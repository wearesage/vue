// composables/useShaderEnvMap.ts
import * as THREE from "three";
import { ref, shallowRef, onUnmounted } from "vue";

export function useShaderEnvMap() {
  const envMapCache = new Map<string, THREE.Texture>();
  const renderTarget = shallowRef<THREE.WebGLCubeRenderTarget | null>(null);
  const cubeCamera = shallowRef<THREE.CubeCamera | null>(null);
  const pmremGenerator = shallowRef<THREE.PMREMGenerator | null>(null);
  const scene = shallowRef<THREE.Scene | null>(null);
  const plane = shallowRef<THREE.Mesh | null>(null);

  function initializeRenderer(renderer: THREE.WebGLRenderer) {
    if (!pmremGenerator.value) {
      pmremGenerator.value = new THREE.PMREMGenerator(renderer);
      pmremGenerator.value.compileEquirectangularShader();
    }

    if (!renderTarget.value) {
      // Use higher resolution for better quality, but still reasonable for performance
      renderTarget.value = new THREE.WebGLCubeRenderTarget(512);
    }

    if (!cubeCamera.value) {
      // Adjusted near/far planes for better depth range
      cubeCamera.value = new THREE.CubeCamera(0.01, 100, renderTarget.value);
    }

    if (!scene.value) {
      scene.value = new THREE.Scene();

      // Create a larger sphere geometry instead of plane for better omnidirectional capture
      const geometry = new THREE.SphereGeometry(5, 32, 32);
      plane.value = new THREE.Mesh(geometry);
      // Flip the sphere inside-out so we render on the inner surface
      geometry.scale(-1, 1, 1);
      scene.value.add(plane.value);

      // Position camera at the center of the sphere
      cubeCamera.value.position.set(0, 0, 0);
    }
  }

  function generateEnvMap(
    renderer: THREE.WebGLRenderer,
    shader: string,
    vertexShader: string,
    uniforms: Record<string, { value: any }>,
    cacheKey: string
  ): THREE.Texture | null {
    console.log(`🔮 [EnvMap] Attempting to generate environment map for cache key: ${cacheKey}`);

    // Check cache first
    if (envMapCache.has(cacheKey)) {
      console.log(`♻️ [EnvMap] Cache HIT for key: ${cacheKey}`);
      return envMapCache.get(cacheKey)!;
    }

    console.log(`🆕 [EnvMap] Cache MISS - generating new environment map for key: ${cacheKey}`);

    try {
      console.log(`⚙️ [EnvMap] Initializing renderer and scene...`);
      initializeRenderer(renderer);

      if (!plane.value || !scene.value || !cubeCamera.value || !pmremGenerator.value) {
        console.error(`❌ [EnvMap] Failed to initialize required components:`, {
          plane: !!plane.value,
          scene: !!scene.value,
          cubeCamera: !!cubeCamera.value,
          pmremGenerator: !!pmremGenerator.value,
        });
        return null;
      }

      console.log(`✅ [EnvMap] All components initialized successfully`);

      // Create safe uniforms object without overwriting existing ones
      const safeUniforms = {
        // Add default uniforms only if they don't already exist
        ...(uniforms.u_time ? {} : { u_time: { value: 0 } }),
        ...(uniforms.u_resolution ? {} : { u_resolution: { value: new THREE.Vector2(512, 512) } }),
        ...(uniforms.u_mouse ? {} : { u_mouse: { value: new THREE.Vector2(0.5, 0.5) } }),
        ...(uniforms.u_volume ? {} : { u_volume: { value: 1.0 } }),
        ...(uniforms.u_stream ? {} : { u_stream: { value: 0.0 } }),
        // Add the original uniforms last so they take precedence
        ...uniforms,
      };

      console.log(`🎨 [EnvMap] Creating shader material with ${Object.keys(safeUniforms).length} uniforms`);
      console.log(`📝 [EnvMap] Shader preview: ${shader.substring(0, 100)}...`);

      // Create shader material for the sphere (adjusted vertex shader for sphere UV mapping)
      const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: shader,
        uniforms: safeUniforms,
        side: THREE.BackSide, // Render on the inside of the sphere
      });

      // Store original material
      const originalMaterial = plane.value.material;
      plane.value.material = material;

      console.log(`🧪 [EnvMap] Validating shader compilation...`);

      // Validate shader compilation with better error handling
      try {
        // Check for basic GLSL compatibility
        if (!material.fragmentShader.includes("gl_FragColor") && !material.fragmentShader.includes("gl_FragData")) {
          console.warn(`⚠️ [EnvMap] Shader may not have proper output - missing gl_FragColor/gl_FragData`);
        }

        // Test compilation by creating a minimal render setup
        const testScene = new THREE.Scene();
        const testGeometry = new THREE.PlaneGeometry(0.1, 0.1);
        const testMaterial = material.clone(); // Use a clone to avoid affecting original
        const testMesh = new THREE.Mesh(testGeometry, testMaterial);
        testScene.add(testMesh);

        const testCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        testCamera.position.z = 1;

        // Store original render target and size
        const originalTarget = renderer.getRenderTarget();
        const originalSize = renderer.getSize(new THREE.Vector2());

        // Create a small test render target
        const testTarget = new THREE.WebGLRenderTarget(2, 2);
        renderer.setRenderTarget(testTarget);

        try {
          renderer.render(testScene, testCamera);
          console.log(`✅ [EnvMap] Shader compilation and render test passed`);
        } catch (renderError) {
          console.error(`❌ [EnvMap] Shader render test failed:`, renderError);
          throw new Error(`Shader compilation failed: ${renderError.message}`);
        } finally {
          // Always restore original state
          renderer.setRenderTarget(originalTarget);
          renderer.setSize(originalSize.x, originalSize.y);

          // Clean up test objects
          testTarget.dispose();
          testGeometry.dispose();
          testMaterial.dispose();
          testScene.remove(testMesh);
        }
      } catch (validationError) {
        console.error(`🚫 [EnvMap] Shader validation failed:`, validationError);
        // Clean up and return early
        plane.value.material = originalMaterial;
        material.dispose();
        return null;
      }

      console.log(`📷 [EnvMap] Rendering to cube camera...`);
      // Render to cube camera
      cubeCamera.value.update(renderer, scene.value);
      console.log(`✅ [EnvMap] Cube camera render completed`);

      // Generate PMREM texture with error handling
      console.log(`🌐 [EnvMap] Generating PMREM texture from cube map...`);
      let envMap: THREE.Texture;
      try {
        envMap = pmremGenerator.value.fromCubemap(renderTarget.value.texture).texture;
        console.log(`✨ [EnvMap] PMREM texture generated successfully!`);
      } catch (pmremError) {
        console.error(`❌ [EnvMap] PMREM generation failed for key ${cacheKey}:`, pmremError);
        // Restore original material and clean up before returning
        plane.value.material = originalMaterial;
        material.dispose();
        return null;
      }

      // Cache the result
      console.log(`💾 [EnvMap] Caching environment map for key: ${cacheKey}`);
      envMapCache.set(cacheKey, envMap);
      console.log(`🎉 [EnvMap] Environment map generation completed successfully! Cache size: ${envMapCache.size}`);

      // Restore original material
      plane.value.material = originalMaterial;

      // Dispose of the material immediately since PMREM generation is synchronous
      // The timeout was causing potential race conditions
      console.log(`🗑️ [EnvMap] Disposing shader material safely`);
      material.dispose();

      return envMap;
    } catch (error) {
      console.error(`💥 [EnvMap] Critical error generating environment map for key ${cacheKey}:`, error);
      // Ensure proper cleanup on error with better material handling
      if (plane.value && plane.value.material && originalMaterial) {
        try {
          plane.value.material = originalMaterial;
          console.log(`🔄 [EnvMap] Restored original material after error`);
        } catch (materialError) {
          console.error(`⚠️ [EnvMap] Failed to restore original material:`, materialError);
        }
      }
      return null;
    }
  }

  function clearCache() {
    envMapCache.forEach((texture) => {
      // Safely dispose texture if it's not being used elsewhere
      if (texture.dispose) {
        texture.dispose();
      }
    });
    envMapCache.clear();
  }

  function removeFromCache(key: string) {
    const texture = envMapCache.get(key);
    if (texture) {
      texture.dispose();
      envMapCache.delete(key);
    }
  }

  // Enhanced cache debugging and management methods
  function getCacheInfo() {
    const info = {
      size: envMapCache.size,
      keys: Array.from(envMapCache.keys()),
      memoryEstimate: envMapCache.size * 2.5, // Rough estimate in MB (512x512 cube maps)
    };
    console.log(`📊 [EnvMap] Cache Info:`, info);
    return info;
  }

  function debugCache() {
    console.group(`🔍 [EnvMap] Cache Debug Information`);
    console.log(`Cache size: ${envMapCache.size} items`);
    console.log(`Estimated memory usage: ~${(envMapCache.size * 2.5).toFixed(1)}MB`);

    if (envMapCache.size > 0) {
      console.log(`Cache keys:`);
      Array.from(envMapCache.keys()).forEach((key, index) => {
        console.log(`  ${index + 1}. ${key}`);
      });
    } else {
      console.log(`Cache is empty`);
    }
    console.groupEnd();
  }

  function validateCacheIntegrity() {
    console.log(`🔬 [EnvMap] Validating cache integrity...`);
    let validCount = 0;
    let invalidCount = 0;

    envMapCache.forEach((texture, key) => {
      if (texture && texture.image && texture.image.length === 6) {
        validCount++;
      } else {
        console.warn(`⚠️ [EnvMap] Invalid texture found for key: ${key}`);
        invalidCount++;
      }
    });

    console.log(`✅ Valid textures: ${validCount}, ❌ Invalid textures: ${invalidCount}`);
    return { valid: validCount, invalid: invalidCount };
  }

  onUnmounted(() => {
    clearCache();
    // Clean up geometry and materials
    if (plane.value?.geometry) {
      plane.value.geometry.dispose();
    }
    if (plane.value?.material && typeof plane.value.material !== "string") {
      (plane.value.material as THREE.Material).dispose();
    }
    renderTarget.value?.dispose();
    pmremGenerator.value?.dispose();
  });

  return {
    generateEnvMap,
    clearCache,
    removeFromCache,
    getCacheInfo,
    debugCache,
    validateCacheIntegrity,
    getCached: (key: string) => envMapCache.get(key),
  };
}
