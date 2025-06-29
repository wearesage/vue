import { ref, computed, watch, type Ref, onMounted, shallowRef } from "vue";
import * as glslUtil from "../../constants/glsl-util";
import { DEFAULT_FRAGMENT_SHADER, DEFAULT_VERTEX_SHADER } from "../../constants/glsl-defaults";
import { useViewport } from "../../stores";

const utils =
  Object.keys(glslUtil).reduce((acc: string, key: string) => {
    return acc + `\n${(glslUtil as any)[key]}`;
  }, ``) + "\n";

export type Uniform = {
  value: Number | Boolean | [Number, Number] | [Number, Number, Number];
};

export function useShader(
  props: {
    shader: string;
    uniforms: Record<string, { value: unknown }>;
    width?: number;
    height?: number;
    dpr?: number;
    animate?: boolean;
    volume?: number;
    stream?: number;
    fixed?: boolean;
    time?: number;
    renderMode?: "always" | "manual" | "on-demand";
  },
  mesh: Ref<any>
) {
  const viewport = useViewport();
  const uniforms = shallowRef<any>({});
  const fragmentShader = ref("");
  const vertexShader = ref("");
  const defs = ["precision highp float;", "#define PI 3.14159265359", "#define TWO_PI 2. * PI", "varying vec2 vUv;"].join("\n");
  const width = computed(() => props.width || viewport.width);
  const height = computed(() => props.height || viewport.height);
  const dpr = computed(() => props.dpr || viewport.dpr);
  const aspectRatio = computed(() => width.value / height.value);
  const initialized = ref(false);
  const artboard = computed(() => ({
    width: `${width.value}px`,
    height: `${height.value}px`,
  }));

  // Memoized uniform declarations - only rebuild when uniforms structure changes
  let cachedDeclarations = "";
  let lastUniformKeys = "";

  function initializeUniforms() {
    const time = window.performance.now() / 1000;
    const w = width.value * dpr.value;
    const h = height.value * dpr.value;

    uniforms.value = {
      // Legacy format uniforms (keep for backward compatibility)
      resolution: {
        value: [w, h],
      },
      time: {
        value: time,
      },
      stream: {
        value: props.stream,
      },
      volume: {
        value: props.volume,
      },
      
      // Shadertoy format uniforms (duplicated for compatibility)
      iResolution: {
        value: [w, h, w / h],
      },
      iTime: {
        value: time,
      },
      iStream: {
        value: props.stream,
      },
      iVolume: {
        value: props.volume,
      },

      ...(props.uniforms || {}),

      ...Object.keys(props.uniforms).reduce((acc: Record<string, any>, key) => {
        if (typeof props.uniforms[key].value === "boolean") {
          acc[`${key}Tween`] = { value: false };
          acc[`${key}TweenProgress`] = { value: 0 };
        }
        return acc;
      }, {}),
    };

    // Invalidate cache when uniforms structure changes
    lastUniformKeys = "";
    cachedDeclarations = "";
    initialized.value = true;
  }

  function setInternalUniforms(now: DOMHighResTimeStamp) {
    if (initialized.value === false) initializeUniforms();
    const width = props.width || viewport.width;
    const height = props.height || viewport.height;
    const dpr = props.dpr || viewport.dpr;
    const time = now / 1000;
    const w = width * dpr;
    const h = height * dpr;
    
    // Update legacy uniforms
    uniforms.value.resolution.value = [w, h];
    uniforms.value.time.value = time;
    uniforms.value.stream.value = props.stream || time;
    uniforms.value.volume.value = props?.volume ?? 1;
    
    // Update Shadertoy uniforms
    uniforms.value.iResolution.value = [w, h, w / h];
    uniforms.value.iTime.value = time;
    uniforms.value.iStream.value = props.stream || time;
    uniforms.value.iVolume.value = props?.volume ?? 1;
  }

  function setExternalUniforms() {
    Object.keys(props.uniforms).forEach((key) => {
      if (typeof uniforms.value[key]?.value === "undefined") return;
      uniforms.value[key].value = props.uniforms[key].value;
    });
  }

  function buildUniformDeclarations() {
    // Create a key signature based on uniform names and types
    const currentUniformKeys = Object.keys(uniforms.value)
      .map(key => {
        const value = (uniforms.value as any)?.[key]?.value;
        if (Array.isArray(value)) {
          return `${key}:${value.length === 2 ? 'vec2' : 'vec3'}`;
        }
        if (typeof value === "number") {
          return `${key}:float`;
        }
        if (typeof value === "boolean") {
          return `${key}:bool`;
        }
        return `${key}:unknown`;
      })
      .sort()
      .join(',');

    // Only rebuild if the uniform signature has changed
    if (currentUniformKeys !== lastUniformKeys) {
      cachedDeclarations = Object.keys(uniforms.value).reduce((acc: any, key: any) => {
        if (Array.isArray((uniforms.value as any)?.[key]?.value)) {
          if ((uniforms.value as any)[key]?.value?.length === 2) {
            return acc + `\nuniform vec2 ${key};`;
          } else {
            return acc + `\nuniform vec3 ${key};`;
          }
        }

        if (typeof (uniforms.value as any)?.[key]?.value === "number") {
          return acc + `\nuniform float ${key};`;
        }

        if (typeof (uniforms.value as any)?.[key]?.value === "boolean") {
          return acc + `\nuniform bool ${key};`;
        }

        return acc;
      }, ``);
      
      lastUniformKeys = currentUniformKeys;
    }

    return cachedDeclarations;
  }

  function buildVertexShader(declarations: string) {
    if (mesh.value && mesh.value.material && vertexShader.value !== defs + declarations + DEFAULT_VERTEX_SHADER) {
      try {
        vertexShader.value = defs + declarations + DEFAULT_VERTEX_SHADER;
        mesh.value.material.vertexShader = vertexShader.value;
        mesh.value.material.needsUpdate = true;
      } catch (e) {
        console.log(e);
      }
    }
  }

  function buildFragmentShader(declarations: string) {
    if (mesh.value && mesh.value.material) {
      let shaderCode = props.shader || DEFAULT_FRAGMENT_SHADER;
      
      // Check if this is a Shadertoy-format shader (has mainImage function)
      const isMainImageShader = /void\s+mainImage\s*\(\s*out\s+vec4\s+\w+\s*,\s*in\s+vec2\s+\w+\s*\)/.test(shaderCode);
      
      if (isMainImageShader) {
        // Separate preprocessor directives and global declarations from functions
        const lines = shaderCode.split('\n');
        const globalLines: string[] = [];
        const functionLines: string[] = [];
        let inFunction = false;
        let braceCount = 0;
        
        for (const line of lines) {
          const trimmed = line.trim();
          
          // Check if we're entering a function
          if (!inFunction && /void\s+\w+\s*\(/.test(trimmed)) {
            inFunction = true;
            functionLines.push(line);
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            continue;
          }
          
          if (inFunction) {
            functionLines.push(line);
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            
            // If we've closed all braces, we're out of functions
            if (braceCount <= 0) {
              inFunction = false;
              braceCount = 0;
            }
          } else {
            // Global scope: preprocessor directives, global variables, etc.
            globalLines.push(line);
          }
        }
        
        // Rebuild shader with proper separation
        const globalSection = globalLines.join('\n');
        const functionSection = functionLines.join('\n');
        
        shaderCode = `
${globalSection}

${functionSection}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}`;
      }
      
      const fullShader = defs + declarations + utils + shaderCode;
      
      if (fullShader !== fragmentShader.value) {
        try {
          fragmentShader.value = fullShader;
          mesh.value.material.fragmentShader = fragmentShader.value;
          mesh.value.material.needsUpdate = true;
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  function render(now: DOMHighResTimeStamp) {
    try {
      setInternalUniforms(now);
      setExternalUniforms();
    } catch (e) {
      console.log(e);
    }
  }

  function update() {
    if (!mesh.value) return;
    initializeUniforms();
    const declarations = buildUniformDeclarations();
    buildVertexShader(declarations);
    buildFragmentShader(declarations);
    mesh.value.material.needsUpdate = true;
  }

  watch(
    () => props.shader,
    () => update()
  );

  watch(
    () => props.uniforms,
    () => update()
  );

  onMounted(() => {
    initializeUniforms();
    const declarations = buildUniformDeclarations();
    buildVertexShader(declarations);
    buildFragmentShader(declarations);
    render(window.performance.now());
  });

  return {
    initializeUniforms,
    setInternalUniforms,
    setExternalUniforms,
    buildUniformDeclarations,
    buildVertexShader,
    buildFragmentShader,
    vertexShader,
    fragmentShader,
    uniforms,
    width,
    height,
    dpr,
    artboard,
    aspectRatio,
    render,
  };
}
