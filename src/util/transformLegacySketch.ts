import type { Sketch, Variant } from "../types/sketches";

// Legacy format types based on the old.json structure
export type LegacyUniformType = 0 | 1 | 2 | 3; // float, bool, vec2, vec3
export type LegacyUniformValue = number | boolean | [number, number] | [number, number, number];
export type LegacyUniform = [
  string, // name
  LegacyUniformType, // type
  LegacyUniformValue, // value
  number, // min
  number, // max
  boolean, // unknown flag 1
  boolean  // unknown flag 2
];
export type LegacyVariant = LegacyUniform[];

export interface LegacySketch {
  _id: { $oid: string } | string;
  shader: string;
  variants: LegacyVariant[];
  study?: { $oid: string };
}

// Modern format (your current system)
export type ModernSketch = Sketch;

/**
 * Transforms a legacy uniform array to modern Three.js uniform object
 */
function transformUniform(legacyUniform: LegacyUniform): [string, { value: LegacyUniformValue }] {
  const [name, type, value] = legacyUniform;
  return [name, { value }];
}

/**
 * Transforms a legacy variant (array of uniform arrays) to modern variant (object)
 */
function transformVariant(legacyVariant: LegacyVariant): Variant {
  return legacyVariant.reduce((acc, uniform) => {
    const [name, uniformObj] = transformUniform(uniform);
    acc[name] = uniformObj;
    return acc;
  }, {} as Variant);
}

/**
 * Removes duplicate utility function definitions that are now injected by the renderer
 */
function removeUtilityFunctions(shaderCode: string): string {
  // List of utility functions that are now injected and should be removed
  const utilityFunctions = [
    'k_hue',
    'k_kale', 
    'k_orb',
    'k_rainbow',
    'k_rotate2d',
    'k_swap',
    'k_sphere',
    'k_uv_to_sphere'
  ];

  let cleanedCode = shaderCode;

  // Remove function definitions (looking for patterns like "vec4 k_hue(" or "mat2 k_rotate2d(")
  utilityFunctions.forEach(funcName => {
    // Match function definitions with various return types
    const functionPattern = new RegExp(
      `(vec[234]|mat[234]|float|bool)\\s+${funcName}\\s*\\([^}]*\\}`,
      'gs'
    );
    cleanedCode = cleanedCode.replace(functionPattern, '');
  });

  // Clean up extra whitespace
  cleanedCode = cleanedCode.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return cleanedCode.trim();
}

/**
 * Transforms gl_FragCoord usage to k_uv() calls and removes redundant aspect ratio corrections
 */
function transformFragCoord(shaderCode: string): string {
  let transformedCode = shaderCode;

  // Pattern 1: Direct gl_FragCoord.xy / resolution.xy normalization
  // Replace with k_uv() since it handles normalization internally
  const fragCoordPattern1 = /(-?1\.?\s*\+\s*)?2\.?\s*\*\s*gl_FragCoord\.xy\s*\/\s*resolution\.xy/g;
  transformedCode = transformedCode.replace(fragCoordPattern1, 'k_uv()');

  // Pattern 2: Simple gl_FragCoord.xy / resolution.xy
  const fragCoordPattern2 = /gl_FragCoord\.xy\s*\/\s*resolution\.xy/g;
  transformedCode = transformedCode.replace(fragCoordPattern2, '(k_uv() + 1.0) / 2.0');

  // Pattern 3: More complex normalization patterns
  const fragCoordPattern3 = /-1\.\s*\+\s*2\.\s*\*\s*gl_FragCoord\.xy\s*\/\s*resolution\.xy/g;
  transformedCode = transformedCode.replace(fragCoordPattern3, 'k_uv()');

  // After replacing gl_FragCoord with k_uv(), remove redundant aspect ratio corrections
  // Look for patterns like: uv.x *= resolution.x/resolution.y; after k_uv() assignment
  transformedCode = removeRedundantAspectRatioCorrections(transformedCode);

  return transformedCode;
}

/**
 * Removes redundant aspect ratio corrections that are already handled by k_uv()
 */
function removeRedundantAspectRatioCorrections(shaderCode: string): string {
  let cleanedCode = shaderCode;

  // Pattern: Look for uv variable assignment followed by aspect ratio correction
  // This handles cases like:
  // vec2 uv = k_uv();
  // uv.x *= resolution.x/resolution.y;
  
  // First, find lines with k_uv() assignments
  const lines = cleanedCode.split('\n');
  const cleanedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];
    
    // Check if current line assigns k_uv() to a variable
    const uvAssignmentMatch = currentLine.match(/(\w+)\s*=\s*k_uv\(\)/);
    
    if (uvAssignmentMatch && nextLine) {
      const uvVarName = uvAssignmentMatch[1];
      
      // Check if the next line is a redundant aspect ratio correction for this variable
      const aspectRatioPattern = new RegExp(
        `^\\s*${uvVarName}\\.x\\s*\\*=\\s*resolution\\.x\\s*\\/\\s*resolution\\.y\\s*;?\\s*$`
      );
      
      if (aspectRatioPattern.test(nextLine)) {
        // Add current line but skip the next line (redundant aspect ratio correction)
        cleanedLines.push(currentLine);
        i++; // Skip the next line
        continue;
      }
    }
    
    cleanedLines.push(currentLine);
  }

  return cleanedLines.join('\n');
}

/**
 * Validates that tween usage in shader code has corresponding base uniforms
 */
function validateTweenIntegrity(shaderCode: string, variants: LegacyVariant[]): boolean {
  // Find all *Tween and *TweenProgress references in shader code
  const tweenMatches = shaderCode.match(/(\w+)Tween(?:Progress)?/g);
  if (!tweenMatches) return true; // No tween usage, valid
  
  // Extract unique base names (e.g., "warp" from "warpTween" and "warpTweenProgress")
  const baseNames = new Set<string>();
  tweenMatches.forEach(match => {
    const baseName = match.replace(/Tween(?:Progress)?$/, '');
    baseNames.add(baseName);
  });
  
  // Check if all base names have corresponding boolean uniforms in variants
  const uniformNames = new Set(
    variants.flatMap(variant => 
      variant.map(uniform => uniform[0]) // uniform name is first element
    )
  );
  
  for (const baseName of baseNames) {
    if (!uniformNames.has(baseName)) {
      return false; // Missing base uniform for tween usage
    }
  }
  
  return true;
}

/**
 * Removes invalid *Tween and *TweenProgress uniform definitions from variants
 */
function cleanTweenUniforms(variants: LegacyVariant[]): LegacyVariant[] {
  return variants.map(variant => 
    variant.filter(uniform => {
      const uniformName = uniform[0];
      // Type guard: ensure uniformName is a string before calling endsWith
      if (typeof uniformName !== 'string') return true;
      return !uniformName.endsWith('Tween') && !uniformName.endsWith('TweenProgress');
    })
  );
}

/**
 * Transforms single-letter uniform names to double letters for better readability
 * Creates a mapping like: a -> aa, b -> bb, c -> cc, etc.
 */
function transformSingleLetterUniforms(shaderCode: string, variants: LegacyVariant[]): {
  transformedShader: string;
  transformedVariants: LegacyVariant[];
  nameMapping: Record<string, string>;
} {
  // Find all single-letter uniform names from variants
  const singleLetterUniforms = new Set<string>();
  variants.forEach(variant => {
    variant.forEach(uniform => {
      const uniformName = uniform[0];
      if (typeof uniformName === 'string' && uniformName.length === 1 && /^[a-zA-Z]$/.test(uniformName)) {
        singleLetterUniforms.add(uniformName);
      }
    });
  });

  // Create mapping: a -> aa, b -> bb, etc.
  const nameMapping: Record<string, string> = {};
  singleLetterUniforms.forEach(letter => {
    nameMapping[letter] = letter + letter;
  });

  // Transform shader code - only transform within main function to avoid breaking local variables
  let transformedShader = shaderCode;
  
  // Find the main function and only transform within it
  const mainFunctionRegex = /void\s+main\s*\(\s*\)\s*\{([\s\S]*)\}/;
  const mainMatch = transformedShader.match(mainFunctionRegex);
  
  if (mainMatch) {
    let mainBody = mainMatch[1];
    
    // Transform single letter uniforms only within main function body
    Object.entries(nameMapping).forEach(([oldName, newName]) => {
      // Only match the uniform when it's NOT preceded by a dot (to avoid property access like uv.x)
      // and NOT followed by a dot (to avoid object property definitions)
      const regex = new RegExp(`(?<!\\.)\\b${oldName}\\b(?!\\.)`, 'g');
      mainBody = mainBody.replace(regex, newName);
    });
    
    // Replace the main function body in the full shader
    transformedShader = transformedShader.replace(mainFunctionRegex, `void main() {${mainBody}}`);
  }

  // Transform variants - update uniform names
  const transformedVariants: LegacyVariant[] = variants.map(variant =>
    variant.map(uniform => {
      const [name, type, value, min, max, flag1, flag2] = uniform;
      const newName = typeof name === 'string' && nameMapping[name] ? nameMapping[name] : name;
      return [newName, type, value, min, max, flag1, flag2] as LegacyUniform;
    })
  );

  return {
    transformedShader,
    transformedVariants,
    nameMapping
  };
}

/**
 * Fixes undefined 'div' usage in specific study by replacing with '1.'
 */
function fixUndefinedDivUsage(shaderCode: string, variants: LegacyVariant[], studyId?: string): string {
  // Only apply this fix to the specific study
  if (studyId !== '66d117b92396a72915a21a68') {
    return shaderCode;
  }
  
  // Check if shader uses 'div' but it's not defined in uniforms
  const usesDivInShader = /\bdiv\b/.test(shaderCode);
  if (!usesDivInShader) {
    return shaderCode;
  }
  
  // Check if 'div' is defined in any variant
  const uniformNames = new Set(
    variants.flatMap(variant => 
      variant.map(uniform => uniform[0]).filter(name => typeof name === 'string')
    )
  );
  
  const hasDivUniform = uniformNames.has('div');
  
  // If shader uses 'div' but it's not defined as a uniform, replace with '1.'
  if (!hasDivUniform) {
    return shaderCode.replace(/\bdiv\b/g, '1.');
  }
  
  return shaderCode;
}

/**
 * Validates that a legacy sketch meets integrity requirements
 */
export function isValidSketch(legacySketch: LegacySketch): boolean {
  // Check tween integrity
  if (!validateTweenIntegrity(legacySketch.shader, legacySketch.variants)) {
    return false;
  }
  
  // Add more validation checks here as needed
  
  return true;
}

/**
 * Cleans study iterations by removing references to non-existent sketches
 */
export function cleanStudyIterations(studies: any[], validSketchIds: Set<string>): any[] {
  return studies
    .map(study => ({
      ...study,
      iterations: study.iterations.filter((id: string) => validSketchIds.has(id))
    }))
    .filter(study => study.iterations.length > 0); // Remove studies with no valid iterations
}

/**
 * Transforms modern TresJS format to Shadertoy format
 * Converts main() to mainImage() and updates uniforms to Shadertoy conventions
 */
export function transformToShadertoy(modernSketch: ModernSketch): ModernSketch {
  let transformedShader = modernSketch.shader;
  
  // Convert main() function to mainImage(out vec4 fragColor, in vec2 fragCoord)
  transformedShader = transformedShader.replace(
    /void\s+main\s*\(\s*\)\s*\{/,
    'void mainImage(out vec4 fragColor, in vec2 fragCoord) {'
  );
  
  // Convert gl_FragColor to fragColor
  transformedShader = transformedShader.replace(/gl_FragColor/g, 'fragColor');
  
  // Convert gl_FragCoord to fragCoord
  transformedShader = transformedShader.replace(/gl_FragCoord/g, 'fragCoord');
  
  // Convert uniform names to Shadertoy conventions
  const uniformMappings = {
    'resolution': 'iResolution.xy',
    'time': 'iTime',
    'volume': 'iVolume',
    'stream': 'iStream'
  };
  
  // Apply uniform name transformations
  Object.entries(uniformMappings).forEach(([oldName, newName]) => {
    const regex = new RegExp(`\\b${oldName}\\b`, 'g');
    transformedShader = transformedShader.replace(regex, newName);
  });
  
  // Update variants to use Shadertoy uniform names
  const transformedVariants = modernSketch.variants.map(variant => {
    const newVariant: Variant = {};
    
    Object.entries(variant).forEach(([key, uniform]) => {
      let newKey = key;
      
      // Transform uniform names in variants
      if (key === 'resolution') {
        newKey = 'iResolution';
        // Convert vec2 to vec3 (add aspect ratio as .z)
        if (Array.isArray(uniform.value) && uniform.value.length === 2) {
          const [x, y] = uniform.value;
          uniform.value = [x, y, x / y];
        }
      } else if (key === 'time') {
        newKey = 'iTime';
      } else if (key === 'volume') {
        newKey = 'iVolume';
      } else if (key === 'stream') {
        newKey = 'iStream';
      }
      
      newVariant[newKey] = uniform;
    });
    
    return newVariant;
  });
  
  return {
    ...modernSketch,
    shader: transformedShader,
    variants: transformedVariants
  };
}

/**
 * Main transformation function that converts a legacy sketch to modern format
 */
export function transformLegacySketch(legacySketch: LegacySketch): ModernSketch {
  // Handle both MongoDB ObjectId format and string format for _id
  const id = typeof legacySketch._id === 'string' 
    ? legacySketch._id 
    : legacySketch._id.$oid;

  // Clean tween uniforms first
  const cleanedVariants = cleanTweenUniforms(legacySketch.variants);

  // Transform single-letter uniforms BEFORE other shader transformations
  const uniformTransformation = transformSingleLetterUniforms(legacySketch.shader, cleanedVariants);
  
  // Transform shader code using updated shader from uniform transformation
  let transformedShader = uniformTransformation.transformedShader;
  transformedShader = transformFragCoord(transformedShader);
  transformedShader = removeUtilityFunctions(transformedShader);
  transformedShader = fixUndefinedDivUsage(
    transformedShader, 
    uniformTransformation.transformedVariants, 
    legacySketch.study?.$oid
  );

  // Transform variants using the updated variants from uniform transformation
  const transformedVariants = uniformTransformation.transformedVariants.map(transformVariant);

  return {
    _id: id,
    shader: transformedShader,
    variants: transformedVariants
  };
}

/**
 * Full pipeline: Legacy → Modern → Shadertoy format
 * Convenience function that applies both transformations
 */
export function transformLegacyToShadertoy(legacySketch: LegacySketch): ModernSketch {
  const modernSketch = transformLegacySketch(legacySketch);
  return transformToShadertoy(modernSketch);
}