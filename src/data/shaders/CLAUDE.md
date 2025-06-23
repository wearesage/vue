# Porting Shader Collection to Three.js

Please see `old.json` next to this file.

We need to write scripts to migrate these shader sketches to ThreeJS. Things that need to happen:

## 1. Shape of variants has changed.

OLD:
type UniformType = 0 | 1 | 2 | 3 (these are `float`, `bool`, `vec2`, `vec3`)
type UniformValue = number | boolean | [number, number] | [number, number, number]
type Uniform = ['zoom', UniformType, UniformValue, min, max, ...]
type Variant = Uniform[]

NEW (three.js style):
[{
zoom: {
value: .5
}
}, {
zoom: {
value: 2
}
}]

## 2. gl_FragCoord -> vUv

ANYWHERE that's using gl_FragCoord, needs to be using vUv instead. This is how I'd like to pull in vUv:

```glsl
vec2 uv = k_uv();
```

this (and every other k\_ utility method) are meant to be injected into the shaders by the renderer.

NOTE: k_uv() normalizes vUv by screen resolution. so we must find a way to remove any normalization logic and replace with k_uv();

## 3. Duplicate utility methods.

Please @see: `/Users/zach/dev/@wearesage-vue/src/constants/glsl-util.ts`

These utility methods are injected to shader by the renderer. It did not used to be that way.

ANYWHERE that the shaders _define these exactly-named utilities_, we must remove the definition.
