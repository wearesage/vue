import { ref, type Ref } from "vue";
import { useNormalizedShaderError } from "./useNormalizedShaderError";

export function useShaderErrorDetection(shader: Ref<string>) {
  const shaderError = ref<string>("");
  const isSetup = ref(false);
  const shaderSource = ref<string>("");
  const error = useNormalizedShaderError(shaderError, shaderSource, shader);

  function setup(renderer: any) {
    const gl = renderer.getContext();
    if (!gl) return;
    const originalCompileShader = gl.compileShader;

    gl.compileShader = function (shader: WebGLShader) {
      originalCompileShader.call(this, shader);
      const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

      if (!success) {
        const error = gl.getShaderInfoLog(shader);
        shaderError.value = error;
        shaderSource.value = gl.getShaderSource(shader);
        const shaderType = gl.getShaderParameter(shader, gl.SHADER_TYPE);
        const typeName = shaderType === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT";
        return;
      }

      shaderError.value = "";
      shaderSource.value = "";
    };

    isSetup.value = true;
    console.log("Shader error detection setup complete");
  }

  return {
    error,
    setup,
    isSetup,
  };
}
