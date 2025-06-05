import { ref, computed, watch, type Ref, watchEffect, watchSyncEffect } from "vue";
import type { ShaderProps } from "@/components/shaders/Shader.vue";
import * as glslUtil from "../constants/glsl-util";
import { DEFAULT_FRAGMENT_SHADER, DEFAULT_VERTEX_SHADER } from "../constants/glsl-defaults";
import { useViewport } from "../stores/viewport";
import { useAnimation } from "./useAnimation";

const utils =
  Object.keys(glslUtil).reduce((acc: string, key: string) => {
    return acc + `\n${(glslUtil as any)[key]}`;
  }, ``) + "\n";

export type Uniform = {
  value: Number | Boolean | [Number, Number] | [Number, Number, Number];
};

export function useShader(props: ShaderProps, mesh: Ref<any>) {
  const viewport = useViewport();
  const uniforms = ref<any>({});
  const fragmentShader = ref("");
  const vertexShader = ref("");
  const defs = ["precision highp float;", "#define PI 3.14159265359", "#define TWO_PI 2. * PI", "varying vec2 vUv;"].join("\n");
  const width = computed(() => props.width || viewport.width);
  const height = computed(() => props.height || viewport.height);
  const dpr = computed(() => props.dpr || viewport.dpr);
  const aspectRatio = computed(() => width.value / height.value);
  const artboard = computed(() => ({
    width: `${width.value}px`,
    height: `${height.value}px`,
  }));

  function initializeUniforms() {
    const time = window.performance.now() / 1000;

    uniforms.value = {
      resolution: {
        value: [width.value * dpr.value, height.value * dpr.value],
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

      ...(props.uniforms || {}),
    };
  }

  function setInternalUniforms(now: DOMHighResTimeStamp) {
    const width = props.width || viewport.width;
    const height = props.height || viewport.height;
    const dpr = props.dpr || viewport.dpr;
    const time = now / 1000;
    uniforms.value.resolution.value = [width * dpr, height * dpr];
    uniforms.value.time.value = time;
    uniforms.value.stream.value = props.stream || time;
    uniforms.value.volume.value = props?.volume || 1;
  }

  function setExternalUniforms() {
    Object.keys(props.uniforms).forEach((key) => {
      if (!uniforms.value[key]?.value) return;
      uniforms.value[key].value = props.uniforms[key].value;
    });
  }

  function buildUniformDeclarations() {
    return Object.keys(uniforms.value).reduce((acc: any, key: any) => {
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
        return acc + `\nuniform bool ${key};\nuniform bool ${key}Tween;\nuniform float ${key}TweenProgress;`;
      }

      return acc;
    }, ``);
  }

  function buildVertexShader(declarations: string) {
    if (mesh.value && mesh.value.material && vertexShader.value !== defs + declarations + DEFAULT_VERTEX_SHADER) {
      vertexShader.value = defs + declarations + DEFAULT_VERTEX_SHADER;
      mesh.value.material.vertexShader = vertexShader.value;
      mesh.value.material.needsUpdate = true;
    }
  }

  function buildFragmentShader(declarations: string) {
    if (mesh.value && mesh.value.material && (defs + declarations + utils + props.shader || "") !== fragmentShader.value) {
      fragmentShader.value = defs + declarations + utils + (props.shader || DEFAULT_FRAGMENT_SHADER);
      mesh.value.material.fragmentShader = fragmentShader.value;
      mesh.value.material.needsUpdate = true;
    }
  }

  function render(now: DOMHighResTimeStamp) {
    setInternalUniforms(now);
    setExternalUniforms();
    const declarations = buildUniformDeclarations();
    buildVertexShader(declarations);
    buildFragmentShader(declarations);
  }

  const { start, stop } = useAnimation(({ now }) => {
    render(now);
  }, false);

  function update() {
    if (!mesh.value) return;
    initializeUniforms();
    mesh.value.material.needsUpdate = true;
  }

  watch(
    () => props.animate,
    (val) => {
      if (!val) {
        stop();
      } else {
        start();
      }
    }
  );

  watch(
    () => props.shader,
    () => update()
  );

  watch(
    () => props.uniforms,
    () => update()
  );

  watchSyncEffect((onCleanup) => {
    initializeUniforms();

    if (props.animate) {
      start();
    } else {
      render(Math.random() * 99999999);
    }

    onCleanup(() => stop());
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
