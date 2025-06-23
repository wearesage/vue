import { ref, computed, watch, type Ref, onMounted, shallowRef } from "vue";
import * as glslUtil from "../constants/glsl-util";
import { DEFAULT_FRAGMENT_SHADER, DEFAULT_VERTEX_SHADER } from "../constants/glsl-defaults";
import { useViewport } from "../stores";

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

      ...Object.keys(props.uniforms).reduce((acc: Record<string, any>, key) => {
        if (typeof props.uniforms[key].value === "boolean") {
          acc[`${key}Tween`] = { value: false };
          acc[`${key}TweenProgress`] = { value: 0 };
        }
        return acc;
      }, {}),
    };

    initialized.value = true;
  }

  function setInternalUniforms(now: DOMHighResTimeStamp) {
    if (initialized.value === false) initializeUniforms();
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
      if (typeof uniforms.value[key]?.value === "undefined") return;
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
        return acc + `\nuniform bool ${key};`;
      }

      return acc;
    }, ``);
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
    if (mesh.value && mesh.value.material && (defs + declarations + utils + props.shader || "") !== fragmentShader.value) {
      try {
        fragmentShader.value = defs + declarations + utils + (props.shader || DEFAULT_FRAGMENT_SHADER);
        mesh.value.material.fragmentShader = fragmentShader.value;
        mesh.value.material.needsUpdate = true;
      } catch (e) {
        console.log(e);
      }
    }
  }

  function render(now: DOMHighResTimeStamp) {
    try {
      setInternalUniforms(now);
      setExternalUniforms();
      const declarations = buildUniformDeclarations();
      buildVertexShader(declarations);
      buildFragmentShader(declarations);
    } catch (e) {
      console.log(e);
    }
  }

  function update() {
    if (!mesh.value) return;
    initializeUniforms();
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
