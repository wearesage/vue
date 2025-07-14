import { ref, shallowRef, computed, watch } from "vue";
import { defineStore, acceptHMRUpdate } from "pinia";
import { useRAF } from "./raf";
import type { Sketch, Variant, AddUniformProps } from "../types/sketches";
import { buildVariantInterpolator, clone, sample, addUniformToSketch, patchUniformValueWithName, generateVariant } from "../util";

// API-based sketch loading instead of static JSON
const sketchesData = ref<Sketch[]>([
  {
    shader:
      "#define orbs 20.\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float stream = stream / 1.2;\n  float dist = length(uv);\n  uv *= k_rotate2d(stream/15.);\n  uv = k_kale(uv, vec2(center), sides);\n  uv *= k_rotate2d(stream/5.);\n  for (float i = 0.; i < orbs; i++) {\n    uv.x += x1*sin(x2*uv.y-stream);\n    uv.y -= y1*cos(y2*uv.x+stream);\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(t+stream/10.);\n    float y = radius * cos(t-stream/10.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, pow(volume, .5)*orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 26.54,
        },
        contrast: {
          value: 1.37,
        },
        orbSize: {
          value: 1.39,
        },
        radius: {
          value: 4.02,
        },
        colorShift: {
          value: 5.37,
        },
        x1: {
          value: 0.57,
        },
        x2: {
          value: 0.3,
        },
        y1: {
          value: 0.63,
        },
        y2: {
          value: 0.53,
        },
        center: {
          value: 5.39,
        },
        sides: {
          value: 1,
        },
      },
      {
        zoom: {
          value: 53.08,
        },
        contrast: {
          value: 1.475624,
        },
        orbSize: {
          value: 1.812746,
        },
        radius: {
          value: 6.592458,
        },
        colorShift: {
          value: 6.478777,
        },
        x1: {
          value: 0,
        },
        x2: {
          value: 0.26894,
        },
        y1: {
          value: 1.26,
        },
        y2: {
          value: 2.372751,
        },
        center: {
          value: 30.572182,
        },
        sides: {
          value: 1,
        },
      },
      {
        zoom: {
          value: 69.63853,
        },
        contrast: {
          value: 2.119733,
        },
        orbSize: {
          value: 6.244888,
        },
        radius: {
          value: 10.580402,
        },
        colorShift: {
          value: 6.478777,
        },
        x1: {
          value: 0.84439,
        },
        x2: {
          value: 1.006902,
        },
        y1: {
          value: 1.525242,
        },
        y2: {
          value: 0.179639,
        },
        center: {
          value: 6.533354,
        },
        sides: {
          value: 1,
        },
      },
      {
        zoom: {
          value: 30.635108,
        },
        contrast: {
          value: 2.38993,
        },
        orbSize: {
          value: 3.662296,
        },
        radius: {
          value: 10.669814,
        },
        colorShift: {
          value: 2.920201,
        },
        x1: {
          value: 0,
        },
        x2: {
          value: 5.370659,
        },
        y1: {
          value: 4.792634,
        },
        y2: {
          value: 1.211102,
        },
        center: {
          value: 6.533354,
        },
        sides: {
          value: 1,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 15.\n\nvoid main() {\n  float stream = stream / 3.;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  uv *= k_rotate2d(stream/-4.);\n  // uv *=outer*sin(inner / 500.*dot(uv, uv) - stream/24.);\n  uv = k_kale(uv, vec2(center), sides);\n  uv *= k_rotate2d(stream/2.75);\n  gl_FragColor = vec4(0);\n  for (float i = 0.; i < BALLS; i++) {\n    uv *= k_rotate2d(stream/-5.*PI/20.);\n    float t = float(i) * PI / BALLS * (2. + 1.);\n    float x = xOuter * sin(xInner * t - stream);\n    float y = yOuter * cos(yOuter * t - stream/1.7);\n    vec2 p = vec2(radius*x, radius*y);\n    p /= pDiv * sin(PI * sin(uv.x/shape - stream/2.));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (5. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(pow(volume,.5)*ballSize / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 763.232826,
        },
        ballSize: {
          value: 90.045199,
        },
        contrast: {
          value: 1.865348,
        },
        radius: {
          value: 4945.528285,
        },
        shape: {
          value: 114.095092,
        },
        sides: {
          value: 3,
        },
        center: {
          value: 817.995185,
        },
        xOuter: {
          value: 0.323888,
        },
        xInner: {
          value: 0.198128,
        },
        yInner: {
          value: 1.408218,
        },
        yOuter: {
          value: 1.670995,
        },
        pDiv: {
          value: 22,
        },
        inner: {
          value: 0.001367,
        },
        outer: {
          value: 17.325566,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\n  vec2 kale(vec2 uv, vec2 offset, float sides) {\n  float angle = atan(uv.y, uv.x);\n  angle = ((angle / PI) + 1.0) * 0.5;\n  angle = mod(angle, 1.0 / sides) * sides;\n  angle = -abs(2.0 * angle - 1.0) + 1.0;\n  angle = angle;\n  float y = length(uv);\n  angle = angle * (y);\n  return vec2(angle, y) - offset;\n} \n\nvec4 hue(vec4 color, float shift) {\n  const vec4 kRGBToYPrime = vec4(0.299, 0.587, 0.114, 0.0);\n  const vec4 kRGBToI = vec4(0.596, -0.275, -0.321, 0.0);\n  const vec4 kRGBToQ = vec4(0.212, -0.523, 0.311, 0.0);\n  const vec4 kYIQToR = vec4(1.0, 0.956, 0.621, 0.0);\n  const vec4 kYIQToG = vec4(1.0, -0.272, -0.647, 0.0);\n  const vec4 kYIQToB = vec4(1.0, -1.107, 1.704, 0.0);\n  float YPrime = dot(color, kRGBToYPrime);\n  float I = dot(color, kRGBToI);\n  float Q = dot(color, kRGBToQ);\n  float hue = atan(Q, I);\n  float chroma = sqrt(I * I + Q * Q);\n  hue += shift;\n  Q = chroma * sin(hue);\n  I = chroma * cos(hue);\n  vec4 yIQ = vec4(YPrime, I, Q, 0.0);\n  color.r = dot(yIQ, kYIQToR);\n  color.g = dot(yIQ, kYIQToG);\n  color.b = dot(yIQ, kYIQToB);\n  return color;\n}\n\nvec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {\n  return a + b * cos(2. * PI * (c * t + d));\n}\n\nvec4 orb (vec2 uv, float size, vec2 position, vec3 color, float contrast) {\n  return pow(vec4(size / length(uv + position) * color, 1.), vec4(contrast));\n}\n\nmat2 rotate (float angle) {\n  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float dist = length(uv);\n  uv *= abs(uv);\n  uv *= rotate(dist/rotation + stream/50.);\n  //uv /= dot(uv, uv);\n  //uv = kale(uv, vec2(0), sides);\n  //uv *= rotate(rotation*stream/10.);\n  for (float i = 0.; i < orbs; i++) {\n    uv.x += sinMul * sin(uv.y * yMul + stream*xSpeed) + cos(uv.y/yDivide-stream/2.);\n    uv.y -= cosMul * cos(uv.x * xMul + stream*ySpeed) - sin(uv.x/xDivide-stream/2.);\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(t-stream/6.);\n    float y = radius * sin(t+stream/8.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += orb(uv, volume * orbSize, position, 1.-color, contrast);\n  }\n}",
    variants: [
      {
        speed: {
          value: 0.04,
        },
        bump: {
          value: 0.2,
        },
        zoom: {
          value: 9.741,
        },
        contrast: {
          value: 1.21,
        },
        orbSize: {
          value: 4.346,
        },
        radius: {
          value: 39.769,
        },
        colorShift: {
          value: 7.65,
        },
        sides: {
          value: 4,
        },
        rotation: {
          value: 50,
        },
        sinMul: {
          value: 2.23,
        },
        cosMul: {
          value: 1.53,
        },
        yMul: {
          value: 0.11,
        },
        xMul: {
          value: 0.29,
        },
        xSpeed: {
          value: 1,
        },
        ySpeed: {
          value: 1,
        },
        gloop: {
          value: 0.006,
        },
        yDivide: {
          value: 19,
        },
        xDivide: {
          value: 19,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvec2 kale(vec2 uv, vec2 offset, float sides) {\n  float angle = atan(uv.y, uv.x);\n  angle = ((angle / PI) + 1.0) * 0.5;\n  angle = mod(angle, 1.0 / sides) * sides;\n  angle = -abs(2.0 * angle - 1.0) + 1.0;\n  angle = angle;\n  float y = length(uv);\n  angle = angle * (y);\n  return vec2(angle, y) - offset;\n} \n\nvec4 orb (vec2 uv, float size, vec2 position, vec3 color, float contrast) {\n  return pow(vec4(size / length(uv + position) * color, 1.), vec4(contrast));\n}\n\nmat2 rotate (float angle) {\n  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float dist = length(uv);\n  uv *= rotate(dist/rotation + stream/50.);\n  //uv /= dot(uv, uv);\n  uv = kale(uv, vec2(0), sides);\n  uv *= rotate(stream/10.);\n  for (float i = 0.; i < orbs; i++) {\n    uv.x += sinMul * sin(uv.y * yMul + stream*xSpeed) + cos(uv.y/yDivide-stream/2.);\n    uv.y -= cosMul * cos(uv.x * xMul + stream*ySpeed) - sin(uv.x/xDivide-stream/2.);\n    float t = i * PI / orbs * 2.;\n    float x = radius * cos(t-stream/11.);\n    float y = radius * sin(t+stream/11.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += orb(uv, pow(volume, .8) * orbSize, position, 1.-color, contrast);\n  }\n}",
    variants: [
      {
        speed: {
          value: 0.1,
        },
        bump: {
          value: 0.5,
        },
        zoom: {
          value: 40.43,
        },
        contrast: {
          value: 1.202,
        },
        orbSize: {
          value: 5,
        },
        radius: {
          value: 14.079999999999998,
        },
        colorShift: {
          value: 7.65,
        },
        sides: {
          value: 1,
        },
        rotation: {
          value: 50,
        },
        sinMul: {
          value: 0,
        },
        cosMul: {
          value: 3,
        },
        yMul: {
          value: 0,
        },
        xMul: {
          value: 0.4,
        },
        xSpeed: {
          value: -22,
        },
        ySpeed: {
          value: -2,
        },
        gloop: {
          value: 0.006,
        },
        yDivide: {
          value: 5.89,
        },
        xDivide: {
          value: 5.89,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\n  vec2 kale(vec2 uv, vec2 offset, float sides) {\n  float angle = atan(uv.y, uv.x);\n  angle = ((angle / PI) + 1.0) * 0.5;\n  angle = mod(angle, 1.0 / sides) * sides;\n  angle = -abs(2.0 * angle - 1.0) + 1.0;\n  angle = angle;\n  float y = length(uv);\n  angle = angle * (y);\n  return vec2(angle, y) - offset;\n} \n\nvec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {\n  return a + b * cos(2. * PI * (c * t + d));\n}\n\nvec4 orb (vec2 uv, float size, vec2 position, vec3 color, float contrast) {\n  return pow(vec4(size / length(uv + position) * color, 1.), vec4(contrast));\n}\n\nmat2 rotate (float angle) {\n  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));\n}\n\nvec2 swap (vec2 uv, vec2 uv2, bool v, bool vT, float vTP) {\n  return vT ? (v ? mix(uv, uv2, vTP) : mix(uv2, uv, vTP)) : (v ? uv2 : uv);\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n\n  float stream = stream / .532;\n  float dist = length(uv);\n  vec2 warped = uv / dot(uv, uv);\n  uv = swap(uv, warped, warp, warpTween, warpTweenProgress);\n  uv *= rotate(stream/10.);\n  for (float i = 0.; i < orbs; i++) {\n    uv.x += sin((i+1.)*uv.y/div - stream/2.);\n    uv.y += cos((i+1.)*uv.x/div2 + stream/2.);\n    float t = i * PI / orbs * 20.;\n    float x = radius * sin(t);\n    float y = radius * cos(t);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += orb(uv, pow(volume, .79)*orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        speed: {
          value: 0.03,
        },
        bump: {
          value: 0.44,
        },
        zoom: {
          value: 0.1,
        },
        contrast: {
          value: 1.55,
        },
        orbSize: {
          value: 1.79,
        },
        radius: {
          value: 1,
        },
        colorShift: {
          value: 10.95,
        },
        div: {
          value: 15.427,
        },
        div2: {
          value: 32.974,
        },
        warp: {
          value: true,
        },
      },
      {
        speed: {
          value: 0.03,
        },
        bump: {
          value: 0.44,
        },
        zoom: {
          value: 10.56,
        },
        contrast: {
          value: 1.55,
        },
        orbSize: {
          value: 0.94,
        },
        radius: {
          value: 1,
        },
        colorShift: {
          value: 8.11,
        },
        div: {
          value: 90.8,
        },
        div2: {
          value: 16.276,
        },
        warp: {
          value: false,
        },
      },
      {
        speed: {
          value: 0.03,
        },
        bump: {
          value: 0.68,
        },
        zoom: {
          value: 0.43,
        },
        contrast: {
          value: 1.24,
        },
        orbSize: {
          value: 1.17,
        },
        radius: {
          value: 14,
        },
        colorShift: {
          value: 10.95,
        },
        div: {
          value: 96.668,
        },
        div2: {
          value: 66.266,
        },
        warp: {
          value: true,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 20\n  \nfloat stepping(float t) {\n  if (t < 0.) return -1. + pow(1. + t, 2.);\n  else return 1. - pow(1. - t, 2.);\n}\n\nmat2 rotate2d(float _angle){\n  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  gl_FragColor = vec4(0);\n  uv = normalize((uv) + sin(abs(1./length(uv)*20.*uv)-stream/2.)) * length(uv);\n//  uv /= .1*tan(.1*dot(1.1*tan(uv), 5.*atan(uv)) - stream/5.);\n  uv += dot(sin(uv+stream), cos(uv+stream));\n // uv += sin(.01*dot(tan(uv+stream/20.), tan(uv-stream/20.)) - stream/5.);\n  uv *= rotate2d(rotation + stream/15.);\n  for (int i = 0; i < BALLS; i++) {\n    float dist = length(uv);\n\t\tuv.y += yOuter*sin(uv.y/yDivider + stream/2.) / 1.*sin(uv.x/1. - stream/1.);\n    uv.x -= xOuter*sin(uv.x/xDivider - stream/5.) / 1.*sin(uv.x/1.1 + stream/1.);\n    float t = float(i) * PI / float(BALLS) * (5. + 1.);// + stream/5000.;\n    float _multiplier = dist*multiplier * sin(stream + uv.x);\n    vec2 p = vec2(radius*-1.*tan(t*multiplier), 1.*radius*sin(t*multiplier));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (stream / 10. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(pow(volume, .8) * ballSize / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        speed: {
          value: 0.04,
        },
        bump: {
          value: 0.42,
        },
        zoom: {
          value: 25.38,
        },
        yDivider: {
          value: 27.34,
        },
        xDivider: {
          value: 10.17,
        },
        multiplier: {
          value: 287.12,
        },
        ballSize: {
          value: 1.72,
        },
        contrast: {
          value: 1.41,
        },
        radius: {
          value: 11,
        },
        yOuter: {
          value: 0.3,
        },
        xOuter: {
          value: 1,
        },
        rotation: {
          value: 5,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvec2 kale(vec2 uv, vec2 offset, float sides) {\n  float angle = atan(uv.y, uv.x);\n  angle = ((angle / PI) + 1.0) * 0.5;\n  angle = mod(angle, 1.0 / sides) * sides;\n  angle = -abs(2.0 * angle - 1.0) + 1.0;\n  angle = angle;\n  float y = length(uv);\n  angle = angle * (y);\n  return vec2(angle, y) - offset;\n} \n\nvec4 hue(vec4 color, float shift) {\n  const vec4 kRGBToYPrime = vec4(0.299, 0.587, 0.114, 0.0);\n  const vec4 kRGBToI = vec4(0.596, -0.275, -0.321, 0.0);\n  const vec4 kRGBToQ = vec4(0.212, -0.523, 0.311, 0.0);\n  const vec4 kYIQToR = vec4(1.0, 0.956, 0.621, 0.0);\n  const vec4 kYIQToG = vec4(1.0, -0.272, -0.647, 0.0);\n  const vec4 kYIQToB = vec4(1.0, -1.107, 1.704, 0.0);\n  float YPrime = dot(color, kRGBToYPrime);\n  float I = dot(color, kRGBToI);\n  float Q = dot(color, kRGBToQ);\n  float hue = atan(Q, I);\n  float chroma = sqrt(I * I + Q * Q);\n  hue += shift;\n  Q = chroma * sin(hue);\n  I = chroma * cos(hue);\n  vec4 yIQ = vec4(YPrime, I, Q, 0.0);\n  color.r = dot(yIQ, kYIQToR);\n  color.g = dot(yIQ, kYIQToG);\n  color.b = dot(yIQ, kYIQToB);\n  return color;\n}\n\nvec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {\n  return a + b * cos(2. * PI * (c * t + d));\n}\n\nvec4 orb (vec2 uv, float size, vec2 position, vec3 color, float contrast) {\n  return pow(vec4(size / length(uv + position) * color, 1.), vec4(contrast));\n}\n\nmat2 rotate (float angle) {\n  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float dist = length(uv);\n  uv *= rotate(dist/rotation + stream/20.);\n  //uv /= dot(uv, uv);\n  uv = kale(uv, vec2(0), sides);\n  //uv *= rotate(rotation*stream/10.);\n  for (float i = 0.; i < orbs; i++) {\n    uv.x += sinMul * sin(uv.y * yMul + stream*xSpeed) + cos(uv.y/yDivide-stream/1.);\n    uv.y -= cosMul * cos(uv.x * xMul + stream*ySpeed) - sin(uv.x/xDivide-stream/1.7);\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(t-stream/11.);\n    float y = radius * sin(t+stream/11.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += orb(uv, volume * orbSize, position, 1.-color, contrast);\n  }\n}",
    variants: [
      {
        speed: {
          value: 0.06,
        },
        bump: {
          value: 0.37,
        },
        zoom: {
          value: 33.367,
        },
        contrast: {
          value: 1.242,
        },
        orbSize: {
          value: 1.418,
        },
        radius: {
          value: 8.08,
        },
        colorShift: {
          value: 7.65,
        },
        sides: {
          value: 1,
        },
        rotation: {
          value: 12.74,
        },
        sinMul: {
          value: 0,
        },
        cosMul: {
          value: 2.22,
        },
        yMul: {
          value: 0.25,
        },
        xMul: {
          value: 0.42,
        },
        xSpeed: {
          value: -1,
        },
        ySpeed: {
          value: 0,
        },
        gloop: {
          value: 0.006,
        },
        yDivide: {
          value: 2.04,
        },
        xDivide: {
          value: 16.34,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\n  vec2 kale(vec2 uv, vec2 offset, float sides) {\n  float angle = atan(uv.y, uv.x);\n  angle = ((angle / PI) + 1.0) * 0.5;\n  angle = mod(angle, 1.0 / sides) * sides;\n  angle = -abs(2.0 * angle - 1.0) + 1.0;\n  angle = angle;\n  float y = length(uv);\n  angle = angle * (y);\n  return vec2(angle, y) - offset;\n} \n\nvec4 hue(vec4 color, float shift) {\n  const vec4 kRGBToYPrime = vec4(0.299, 0.587, 0.114, 0.0);\n  const vec4 kRGBToI = vec4(0.596, -0.275, -0.321, 0.0);\n  const vec4 kRGBToQ = vec4(0.212, -0.523, 0.311, 0.0);\n  const vec4 kYIQToR = vec4(1.0, 0.956, 0.621, 0.0);\n  const vec4 kYIQToG = vec4(1.0, -0.272, -0.647, 0.0);\n  const vec4 kYIQToB = vec4(1.0, -1.107, 1.704, 0.0);\n  float YPrime = dot(color, kRGBToYPrime);\n  float I = dot(color, kRGBToI);\n  float Q = dot(color, kRGBToQ);\n  float hue = atan(Q, I);\n  float chroma = sqrt(I * I + Q * Q);\n  hue += shift;\n  Q = chroma * sin(hue);\n  I = chroma * cos(hue);\n  vec4 yIQ = vec4(YPrime, I, Q, 0.0);\n  color.r = dot(yIQ, kYIQToR);\n  color.g = dot(yIQ, kYIQToG);\n  color.b = dot(yIQ, kYIQToB);\n  return color;\n}\n\nvec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {\n  return a + b * cos(2. * PI * (c * t + d));\n}\n\nvec4 orb (vec2 uv, float size, vec2 position, vec3 color, float contrast) {\n  return pow(vec4(size / length(uv + position) * color, 1.), vec4(contrast));\n}\n\nmat2 rotate (float angle) {\n  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float dist = length(uv);\n  //uv *= rotate(rotation*stream/5.);\n  //uv /= dot(uv, uv);\n  //uv = kale(uv, vec2(0), sides);\n  uv *= rotate(stream/40.);\n  for (float i = 0.; i < orbs; i++) {\n    uv.x += sinMul * sin(uv.y * yMul + stream*xSpeed) + cos(uv.y/yDivide-stream/4.);\n    uv.y -= cosMul * cos(uv.x * xMul - stream*ySpeed) - sin(uv.x/xDivide-stream/7.);\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(t-stream/4.);\n    float y = radius * sin(t+stream/4.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += orb(uv, pow(volume, .8)*orbSize, position, 1.-color, contrast);\n  }\n}",
    variants: [
      {
        speed: {
          value: 0.1,
        },
        bump: {
          value: 0.5,
        },
        zoom: {
          value: 47.434,
        },
        contrast: {
          value: 1.167,
        },
        orbSize: {
          value: 2.594,
        },
        radius: {
          value: 10.291,
        },
        colorShift: {
          value: 7.12,
        },
        sides: {
          value: 4,
        },
        rotation: {
          value: 0,
        },
        sinMul: {
          value: 2,
        },
        cosMul: {
          value: 0.94,
        },
        yMul: {
          value: 0.14,
        },
        xMul: {
          value: 0.05,
        },
        xSpeed: {
          value: -0.5,
        },
        ySpeed: {
          value: 0.5,
        },
        gloop: {
          value: 0.006,
        },
        yDivide: {
          value: 3.2,
        },
        xDivide: {
          value: 2.08,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvec4 orb (vec2 uv, float size, vec2 position, vec3 color, float contrast) {\n  return pow(vec4(size / length(uv + position) * color, 1.), vec4(contrast));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  uv *= k_rotate2d(stream/20.);\n  for (float i = 0.; i < orbs; i++) {\n    uv.x += radius * sin((i+1.)*uv.y/yDiv - stream);\n    uv.y += radius * cos((i+1.)*uv.x/xDiv + stream);\n    float t = i * PI / orbs;\n    vec2 position = vec2(0, 0);\n    vec3 color = cos(stream/2.+vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / 16.)) * 0.5 + 0.5;\n    gl_FragColor += orb(uv, volume * orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 0.882917,
        },
        contrast: {
          value: 1.21,
        },
        orbSize: {
          value: 0.071563,
        },
        colorShift: {
          value: 15,
        },
        warp: {
          value: true,
        },
        radius: {
          value: 0.103421,
        },
        yDiv: {
          value: 0.754,
        },
        xDiv: {
          value: 2.235,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "precision highp float;\n\nmat2 rotate2d(float _angle) {\n  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  gl_FragColor = vec4(0);\n  uv *= rotate2d(1. + stream/35.);\n  vec2 p = shape2 / abs(vec2(.5 / shape));\n  p /= abs(tan(sin(xShape * uv.x-stream) * (cos(yShape * uv.y - stream))));\n  vec3 col = cos(vec3(0, 2, 0) * PI * 2. / 3. + PI * (time / 3.23 + colorShape * uv.x)) * 0.5 + 0.5;\n  float x = sin(uv.x);\n  float y = cos(uv.y - cos(uv.y + uv.x));\n  gl_FragColor += vec4(length(vec2(x, y)) * (pow(1./volume, -.6)) * ballSize / length(uv - p * 0.9) * col, contrast);\n  gl_FragColor.xyz = pow(vec3(1.25) - (gl_FragColor.xyz), vec3(contrast));\n  gl_FragColor.w = 1.0;\n  gl_FragColor.b *= .42;\n}",
    variants: [
      {
        speed: {
          value: 0.1,
        },
        bump: {
          value: 0.5,
        },
        zoom: {
          value: 1.443,
        },
        xShape: {
          value: 7.238,
        },
        yShape: {
          value: 7.275,
        },
        colorShape: {
          value: 11,
        },
        contrast: {
          value: 0.376,
        },
        ballSize: {
          value: 3.948,
        },
        shape: {
          value: 1.34,
        },
        shape2: {
          value: 0.284,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 30.\n\nvec4 orb (vec2 uv, float size, vec2 position, vec3 color, float contrast) {\n  return pow(vec4(size / length(uv + position) * color, 1.), vec4(contrast));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  uv *= k_rotate2d(stream / 20.);\n  uv = uv - cos( .0005 * dot(uv, uv)) * sin(.01 * dot(uv, uv)+stream/12.);\n  for (float i = 0.; i < orbs; i++) {\n    uv.x -= cos((i+1.)*uv.y/div - stream);\n    uv.y += cos((i+1.)*uv.x/div2 - stream/2.5);\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(t - stream/2.);\n    float y = radius * cos(t - stream/6.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(uv.x/200. + uv.y/25500.*stream + vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += orb(uv, pow(volume, .7) * orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        speed: {
          value: 0.15,
        },
        bump: {
          value: 0.37,
        },
        zoom: {
          value: 11.15,
        },
        contrast: {
          value: 1.094,
        },
        orbSize: {
          value: 1.055,
        },
        radius: {
          value: 12.89,
        },
        colorShift: {
          value: 10.54,
        },
        div: {
          value: 40,
        },
        div2: {
          value: 40,
        },
        warp: {
          value: true,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvec4 orb (vec2 uv, float size, vec2 position, vec3 color, float contrast) {\n  return pow(vec4(size / length(uv + position) * color, 1.), vec4(contrast));\n}\n\nvoid main() {\n  float stream = stream / 2.;\n  vec2 uv = k_uv();\n  uv *= zoom;\n\tuv.x = abs(uv.x);\n  uv = uv * cos( .0001 * dot(uv, uv) - stream/5.) + uv.x / 1111.;// * 20.*sin(9.1 * dot(uv, uv)-stream/10.);\n  for (float i = 0.; i < orbs; i++) {\n    uv.y -= cos((i+1.)*uv.y/div - stream);\n    uv.x += cos((i+1.)*uv.y/div2 - stream/1.5);\n    float t = i * PI / orbs;\n    float x = radius * tan(t + stream/11.) * sin(t-stream) * cos(t+stream/2.114) ;\n    float y = radius * cos(t - stream/2.2) * cos(t-stream) * tan(t+stream/3.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += orb(uv, volume * orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        speed: {
          value: 0.03,
        },
        bump: {
          value: 0.45,
        },
        zoom: {
          value: 52.612,
        },
        contrast: {
          value: 0.931,
        },
        orbSize: {
          value: 0.617,
        },
        radius: {
          value: 22.221,
        },
        colorShift: {
          value: 11.52,
        },
        div: {
          value: 17.328,
        },
        div2: {
          value: 14.483,
        },
        warp: {
          value: true,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  for (float i = 0.; i < orbs; i++) {\n    uv.y -= cos((i+1.)*uv.y/div - stream);\n    uv.x += cos((i+1.)*uv.y/div2 - stream/1.5);\n    float t = i * PI / orbs;\n    float x = radius * tan(t + stream/2.);\n    float y = radius * cos(t - stream/2.2) * sin(t-stream/3.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, volume * orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        speed: {
          value: 0.03,
        },
        bump: {
          value: 0.5,
        },
        zoom: {
          value: 24.95,
        },
        contrast: {
          value: 0.902,
        },
        orbSize: {
          value: 0.682,
        },
        radius: {
          value: 8.159,
        },
        colorShift: {
          value: 12.71,
        },
        div: {
          value: 10,
        },
        div2: {
          value: 10,
        },
        warp: {
          value: true,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 20.\n\nvoid main() {\n  float stream = stream / 2.;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  gl_FragColor = vec4(0);\n  uv = normalize(uv) / length(uv);\n  float dist = length(uv);\n    uv *= k_rotate2d(stream/2.);\n  uv = sin(stream * 1. + (uv));\n  //  uv += tan(log(uv) + stream/1.);\n  uv *= sin((dot(uv, uv)) - stream / .8);\n  uv *= k_rotate2d(rotation * dist + stream / 1.7);\n  for (float i = 0.; i < BALLS; i++) {\n    // uv.x /= cos(log(abs(uv.x*.1)-float(i+2.)));\n    float t = stream / 7. + float(i) * PI / BALLS;\n    vec2 p = vec2(radius * tan(t), radius * sin(t));\n    //p *= radius * tan(float(i) - PI);\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + 3.141925 * (stream / 2. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(2.7/dist * pow(volume, .9)*ballSize / length(uv + p) * col, 1.0);\n  }\n  gl_FragColor.xyz = pow(dist, .6) * pow((gl_FragColor.xyz), vec3(contrast)) + .2 * col;\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 0.559,
        },
        contrast: {
          value: 2.733,
        },
        ballSize: {
          value: 0.034,
        },
        radius: {
          value: 0.53,
        },
        col: {
          value: [0.37254901960784315, 0.6509803921568628, 0.9490196078431372],
        },
        rotation: {
          value: 0.225,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 20\n\nvoid main() {\n  float stream = stream / 3.;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  gl_FragColor = vec4(0);\n  uv /= dot(uv, uv);\n  float dist = length(uv);\n  // uv += sin(stream*1.+(1.-log(sin(uv))));\n  uv *= k_rotate2d(stream/3.);\n  // uv += sin(dotMultiplier * (cos(dot(abs(uv), log(abs(uv)))) - stream / 11.));\n  // uv *= k_rotate2d(rotation*dist+stream/1.);\n  for (int i = 5; i < BALLS; i++) {\n    // uv.x -= .01*cos(log(abs(uv.x*.1)-float(i+1))-stream);\n    float t = float(i) * PI / float(BALLS);\n    vec2 p = radius * vec2(tanMul * tan(t - stream/2.), sinMul * sin(t + stream/4.));\n    p += radius * tan(stream + float(i) - PI) * sin(t - stream);\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + 3.141925 * (stream / 55. + float(i) / 10.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(volume * ballSize / length(uv + p) * col, 1.0);\n  }\n  gl_FragColor.xyz = pow(dist, .5) * pow((gl_FragColor.xyz), vec3(contrast)) + .2 * col;\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 0.153,
        },
        contrast: {
          value: 1.831,
        },
        ballSize: {
          value: 0.507,
        },
        radius: {
          value: 6.699,
        },
        col: {
          value: [0.37254901960784315, 0.6509803921568628, 0.9490196078431372],
        },
        rotation: {
          value: 2.17,
        },
        dotMultiplier: {
          value: 5,
        },
        tanMul: {
          value: 0.9,
        },
        sinMul: {
          value: 0,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 20\n\nvoid main() {\n  float stream = stream / .45;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  gl_FragColor = vec4(0);\n  float dist = length(uv);\n  for (int i = 0; i < BALLS; i++) {\n    uv.y -= float(i) / 15. * cos(uv.y / yDivider + stream / 10.) + aa * sin(uv.x / 100. - stream / 12.);\n    uv.x += float(i) / 8. * sin(uv.x / xDivider - stream / 15.) - bb * cos(uv.y / 100. + stream / 10.);\n    float t = 1.1 * float(i) * PI / float(BALLS) * (5. + 1.);\n    float _multiplier = dist / multiplier * sin(uv.x - stream / 1.);\n    vec2 p = radius * vec2(-11. * tan(t + stream/10.), 1. * sin(t / multiplier));\n    p /= sin(PI * sin(uv.x / 100.) * cos(uv.y / 40.));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (5. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(float(i) / 40. * ballSize / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 239.782,
        },
        yDivider: {
          value: 23.215,
        },
        xDivider: {
          value: 520.181,
        },
        multiplier: {
          value: 1.895,
        },
        ballSize: {
          value: 50.485,
        },
        contrast: {
          value: 3.054,
        },
        radius: {
          value: 23.28,
        },
        aa: {
          value: 1.91,
        },
        bb: {
          value: 8.04,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 15.\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  uv *= k_rotate2d(stream/9.);\n  float dist = length(uv);\n  uv = k_kale(uv, vec2(center*dist), sides);\n  for (float i = 0.; i < orbs; i++) {\n    float t = i / PI / orbs * 8.;\n    float x = t * radius * cos(dist*t-stream/1.5)*1.-sin(dist+stream);\n    float y = 0.;\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, volume * orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 4.34,
        },
        contrast: {
          value: 1.344,
        },
        orbSize: {
          value: 0.132,
        },
        radius: {
          value: 2.239,
        },
        colorShift: {
          value: 4.5,
        },
        center: {
          value: 0.94,
        },
        sides: {
          value: 8,
        },
        shape: {
          value: 0.36,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 20\n\nvoid main() {\n  float stream = stream / .6;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  gl_FragColor = vec4(0);\n  uv = normalize(uv) * length(abs(uv));\n  uv = k_swap(uv, abs(uv), mirror, mirrorTween, mirrorTweenProgress);\n  float dist = length(uv);\n  for (int i = 0; i < BALLS; i++) {\n    uv.y += .2 * float(i) * cos(uv.y / yDivider + stream / 11.) + sin(uv.x / 21. - stream / 12.);\n    uv.x += .2 * float(i) * sin(uv.x / xDivider - stream / 11.) - sin(uv.y / 20. + stream / 12.);\n    float t = .01 * dist * float(i) * PI / float(BALLS) * (5. + 1.);\n    float _multiplier = dist / multiplier * sin(uv.x - stream / 1.);\n    vec2 p = radius * vec2(-1. * cos(t), 1. * sin(t / multiplier));\n    p /= sin(PI * sin(uv.x / 10.) * cos(uv.y / 11.));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (stream / 5. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(float(i) *volume* ballSize / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 50.47,
        },
        yDivider: {
          value: 397.41,
        },
        xDivider: {
          value: 815.27,
        },
        multiplier: {
          value: 4.29,
        },
        ballSize: {
          value: 0.22,
        },
        contrast: {
          value: 1.96,
        },
        radius: {
          value: 9.33,
        },
        mirror: {
          value: true,
        },
      },
      {
        zoom: {
          value: 50.47,
        },
        yDivider: {
          value: 397.41,
        },
        xDivider: {
          value: 815.27,
        },
        multiplier: {
          value: 4.29,
        },
        ballSize: {
          value: 0.22,
        },
        contrast: {
          value: 1.96,
        },
        radius: {
          value: 9.33,
        },
        mirror: {
          value: false,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float dist = length(uv);\n\n  uv *= k_rotate2d(stream / 20.);\n  uv = k_kale(uv, vec2(center), sides);\n  uv *= k_rotate2d(stream / 5.);\n  for (float i = 0.; i < 20.; i++) {\n    uv.x += x1 * sin(x2 * uv.y - stream);\n    uv.y -= y1 * cos(y2 * uv.x + stream);\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(t + stream / 10.);\n    float y = radius * cos(t - stream / 30.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, volume * orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 21.09,
        },
        contrast: {
          value: 1.37,
        },
        orbSize: {
          value: 1.39,
        },
        radius: {
          value: 4.02,
        },
        colorShift: {
          value: 5.37,
        },
        x1: {
          value: 0.57,
        },
        x2: {
          value: 0.3,
        },
        y1: {
          value: 0.63,
        },
        y2: {
          value: 0.53,
        },
        center: {
          value: 6.97,
        },
        sides: {
          value: 6,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 5\n\nvec2 kale(vec2 uv, vec2 offset, float sides) {\n  float angle = atan(uv.y, uv.x);\n  angle = ((angle / PI) + 1.0) * 0.5;\n  angle = mod(angle, 1.0 / sides) * sides;\n  angle = -abs(2.0 * angle - 1.0) + 1.0;\n  angle = angle;\n  float y = length(uv);\n  angle = angle * (y);\n  return vec2(angle, y) - offset;\n} \n\nvec4 hue(vec4 color, float shift) {\n  const vec4 kRGBToYPrime = vec4(0.299, 0.587, 0.114, 0.0);\n  const vec4 kRGBToI = vec4(0.596, -0.275, -0.321, 0.0);\n  const vec4 kRGBToQ = vec4(0.212, -0.523, 0.311, 0.0);\n  const vec4 kYIQToR = vec4(1.0, 0.956, 0.621, 0.0);\n  const vec4 kYIQToG = vec4(1.0, -0.272, -0.647, 0.0);\n  const vec4 kYIQToB = vec4(1.0, -1.107, 1.704, 0.0);\n  float YPrime = dot(color, kRGBToYPrime);\n  float I = dot(color, kRGBToI);\n  float Q = dot(color, kRGBToQ);\n  float hue = atan(Q, I);\n  float chroma = sqrt(I * I + Q * Q);\n  hue += shift;\n  Q = chroma * sin(hue);\n  I = chroma * cos(hue);\n  vec4 yIQ = vec4(YPrime, I, Q, 0.0);\n  color.r = dot(yIQ, kYIQToR);\n  color.g = dot(yIQ, kYIQToG);\n  color.b = dot(yIQ, kYIQToB);\n  return color;\n}\n\nmat2 rotate2d(float _angle){\n  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  gl_FragColor = vec4(0);\n  uv = normalize(uv) * length(uv);\n  uv = zoom * (uv);//(1.+ProgressBasis/2.);\n  if (invertTween) {\n  \tif (invert) {\n     \tuv = mix(uv, abs(uv), invertTweenProgress); \n    } else {\n      uv = mix(abs(uv), uv, invertTweenProgress); \n    }\n  } else if (invert) {\n   \tuv = abs(uv); \n  }\n  float dist = distance(uv, vec2(0));\n  float thing = .005*sin(shapeMultiplier*dot(uv, uv)/dist - stream/4.);\n//  vec2 _kale = kale(uv, vec2(0.), sides);\n  uv *= rotate2d(rotation * (dist - stream/1.));\n  float _grid = (cos(uv.x * xMultiplier - stream/4.) + sin(uv.y * yMultiplier + stream/10.));\n  uv /= colorSpread * thing * _grid;\n  uv*=dist;\n  uv.x += uv.y;// / cos(uv.x);//sin(uv.y+stream/.1);\n  for (int i = 0; i < BALLS; i++) {\n    uv *= rotate2d(dist*float(i));//-stream/10.);\n    float t = float(i) * PI / float(BALLS);// - stream/4.;\n    vec2 p = radius * vec2(radius*tan(t), radius*cos(t));\n    //p += log(sin(stream/3. + float(i) * PI));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (stream / 20. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(volume * ballSize  / length(uv + p * colorMultiplier) * col, 1.0);\n  }\n  gl_FragColor.xyz = glow * brightness * pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n gl_FragColor = hue(gl_FragColor, stream/50.);\n}",
    variants: [
      {
        zoom: {
          value: 0.062,
        },
        shapeMultiplier: {
          value: 203.13,
        },
        rotation: {
          value: 0.05,
        },
        xMultiplier: {
          value: 59.27,
        },
        yMultiplier: {
          value: 88,
        },
        colorSpread: {
          value: 0.001,
        },
        colorMultiplier: {
          value: 0.81,
        },
        invert: {
          value: true,
        },
        brightness: {
          value: 3.86,
        },
        ballSize: {
          value: 36.72,
        },
        glow: {
          value: 1.22,
        },
        contrast: {
          value: 2.72,
        },
        radius: {
          value: 16.24,
        },
      },
      {
        zoom: {
          value: 0.02,
        },
        shapeMultiplier: {
          value: 203.13,
        },
        rotation: {
          value: 0.05,
        },
        xMultiplier: {
          value: 59.27,
        },
        yMultiplier: {
          value: 88,
        },
        colorSpread: {
          value: 0.001,
        },
        colorMultiplier: {
          value: 0.81,
        },
        invert: {
          value: false,
        },
        brightness: {
          value: 3.86,
        },
        ballSize: {
          value: 36.72,
        },
        glow: {
          value: 1.22,
        },
        contrast: {
          value: 2.72,
        },
        radius: {
          value: 22.046,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 20\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float stream = stream / .47;\n  gl_FragColor = vec4(0);\n  float dist = length(uv);\n  uv *= cos(.00005 * dot(uv, uv) - stream / 20.);\n  uv *= k_rotate2d(stream / 120.);\n  for (int i = 0; i < BALLS; i++) {\n    uv.y -= float(i) / yDivide * sin(uv.y) - cos(uv.y / yDivider + stream / 8.);\n    uv.x += float(i) / xDivide * sin(uv.x / xDivider + stream / 14.) * .251 * cos(uv.y / yShape + stream / 6.);\n    float t = 5.1 * float(i) * PI / float(BALLS) * (2. + 1.) + stream / 100.;\n    float x = -1. * tan(t + stream / 1000.);\n    float y = sin(t / multiplier); // + stream/401.);\n    vec2 p = radius * vec2(x, y);\n    p /= sin(PI * sin(uv.x / shape + stream / 10.)); //+cos(uv.x/300.-stream/1.));\n    vec3 col = cos(stream / 10. + vec3(0, 1, -1) * PI * 2. / 3. + PI * (5. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(float(i) / 40. * pow(volume, 1.16)*ballSize / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 90.275,
        },
        yDivider: {
          value: 18.646,
        },
        xDivider: {
          value: 9.294,
        },
        multiplier: {
          value: 1.219,
        },
        ballSize: {
          value: 34.82,
        },
        contrast: {
          value: 1.8,
        },
        radius: {
          value: 76.67,
        },
        rotation: {
          value: 14.858,
        },
        yDivide: {
          value: 307.888,
        },
        xDivide: {
          value: 0.408,
        },
        yShape: {
          value: 200,
        },
        shape: {
          value: 14.966,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float dist = length(uv);\n\n  uv *= k_rotate2d(stream / 6.);\n  uv = k_kale(uv, vec2(center), sides);\n  uv *= k_rotate2d(stream / 5.);\n  for (float i = 0.; i < 20.; i++) {\n    uv.x += x1 * sin(x2 * uv.y - stream);\n    uv.y -= y1 * cos(y2 * uv.x + stream);\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(t + stream / 10.);\n    float y = radius * cos(t - stream / 30.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, pow(volume, 1.) * orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 12.35,
        },
        contrast: {
          value: 1.19,
        },
        orbSize: {
          value: 0.64,
        },
        radius: {
          value: 4.02,
        },
        colorShift: {
          value: 4.41,
        },
        x1: {
          value: 0.1,
        },
        x2: {
          value: 0.91,
        },
        y1: {
          value: 0.37,
        },
        y2: {
          value: 1.86,
        },
        center: {
          value: 6.97,
        },
        sides: {
          value: 3,
        },
      },
      {
        zoom: {
          value: 24.7,
        },
        contrast: {
          value: 1.19,
        },
        orbSize: {
          value: 1.204,
        },
        radius: {
          value: 8.04,
        },
        colorShift: {
          value: 2.6,
        },
        x1: {
          value: 0.1,
        },
        x2: {
          value: 0,
        },
        y1: {
          value: 0.74,
        },
        y2: {
          value: 0.394,
        },
        center: {
          value: 13.273,
        },
        sides: {
          value: 3,
        },
      },
      {
        zoom: {
          value: 11.101,
        },
        contrast: {
          value: 1.19,
        },
        orbSize: {
          value: 1.003,
        },
        radius: {
          value: 8.04,
        },
        colorShift: {
          value: 4.625,
        },
        x1: {
          value: 0.053,
        },
        x2: {
          value: 1.82,
        },
        y1: {
          value: 0.74,
        },
        y2: {
          value: 3.72,
        },
        center: {
          value: 3.859,
        },
        sides: {
          value: 3,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 20\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  gl_FragColor = vec4(0);\n  float dist = length(uv);\n  uv *= k_rotate2d(stream / 10.);\n  uv = k_swap(uv, abs(uv), mirror, mirrorTween, mirrorTweenProgress);\n  uv = k_swap(uv, uv * sin(.0001 * dot(uv, uv) + stream/5.), dotted, dottedTween, dottedTweenProgress);\n  for (int i = 0; i < BALLS; i++) {\n    uv.y -= float(i) / yDivide * (uv.x) - cos(uv.y / yDivider + stream / 2.);\n    uv.x += float(i) / xDivide * sin(uv.x / xDivider + stream / 5.) * .4229 * cos(uv.y / yShape + stream / 1.5);\n    float t = 1.1 * float(i) * PI / float(BALLS) * (2. + 1.) + stream / 90.;\n    float x = -1. * tan(t - stream / 10.); // + stream/100.);\n    float y = sin(t * multiplier); // + stream/401.);\n    vec2 p = radius * vec2(x, y);\n    p /= sin(PI * sin(uv.x / shape)); //+cos(uv.x/300.-stream/1.));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (.02 * float(BALLS) + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(float(i) / 40. * pow(volume, .75) * ballSize / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 116.00066318094458,
        },
        yDivider: {
          value: 2.0108340560372664,
        },
        xDivider: {
          value: 19.66732405775273,
        },
        multiplier: {
          value: 5,
        },
        ballSize: {
          value: 26.2977033459619,
        },
        contrast: {
          value: 3.1896125184039077,
        },
        radius: {
          value: 51.601894147360014,
        },
        rotation: {
          value: 10.745,
        },
        yDivide: {
          value: 225.75,
        },
        xDivide: {
          value: 1.485310136543849,
        },
        yShape: {
          value: 14.65960528313752,
        },
        shape: {
          value: 71.5548653767282,
        },
        dotted: {
          value: true,
        },
        mirror: {
          value: true,
        },
      },
      {
        zoom: {
          value: 41.078,
        },
        yDivider: {
          value: 0.648,
        },
        xDivider: {
          value: 4.401,
        },
        multiplier: {
          value: 5,
        },
        ballSize: {
          value: 18.522,
        },
        contrast: {
          value: 3.132,
        },
        radius: {
          value: 28.094,
        },
        rotation: {
          value: 10.745,
        },
        yDivide: {
          value: 225.75,
        },
        xDivide: {
          value: 0.788,
        },
        yShape: {
          value: 4.193,
        },
        shape: {
          value: 142.16,
        },
        dotted: {
          value: false,
        },
        mirror: {
          value: true,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float dist = length(uv);\n  uv = abs(uv);\n  //  uv *= k_rotate2d(-stream/10.);\n  //  uv = k_kale(uv, vec2(0.),sides);\n  //uv *= k_rotate2d(stream/5.);\n  //uv *= k_rotate2d(rotation*stream/5.);\n\n  uv /= dot(uv, uv);\n  //uv *= k_rotate2d(rotation*stream/10.);\n  for (float i = 0.; i < 20.; i++) {\n    uv.x += sinMul * sin(uv.y * yMul + stream * xSpeed) + cos(uv.y / yDivide - stream / 2.);\n    uv.y += cosMul * cos(uv.x * xMul - stream * ySpeed) - sin(uv.x / xDivide - stream / 2.);\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(t - stream / 50.);\n    float y = radius * cos(t + stream / 50.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, volume*orbSize, position, 1. - color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 0.12,
        },
        contrast: {
          value: 1.234,
        },
        orbSize: {
          value: 2.298,
        },
        radius: {
          value: 20.95,
        },
        colorShift: {
          value: 5.41,
        },
        sides: {
          value: 1,
        },
        rotation: {
          value: 0,
        },
        sinMul: {
          value: 0.56,
        },
        cosMul: {
          value: 0.88,
        },
        yMul: {
          value: 0,
        },
        xMul: {
          value: 0.56,
        },
        xSpeed: {
          value: 1,
        },
        ySpeed: {
          value: -2,
        },
        gloop: {
          value: 0.0051,
        },
        yDivide: {
          value: 3.65,
        },
        xDivide: {
          value: 32.82,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 15.\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float dist = length(uv);\n  uv *= k_rotate2d(stream / 14.);\n  uv = k_kale(uv, vec2(dist), sides);\n  for (float i = 0.; i < orbs; i++) {\n    float t = i / PI / orbs * 15. - cos(.01*dist*uv.x/2. - stream/10.2) * sin(dist - uv.x/14. - stream/8.);\n    float x = t + radius * cos(dist * t - stream /-3.) * sin(dist + stream / 2.5);\n    float y = 0.;\n    vec2 position = vec2(x + sin(x+stream/2. + dist), y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, volume * orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 4.677086,
        },
        contrast: {
          value: 1.67239,
        },
        orbSize: {
          value: 0.062933,
        },
        radius: {
          value: 0.708866,
        },
        colorShift: {
          value: 4.5,
        },
        center: {
          value: 0.353764,
        },
        sides: {
          value: 6,
        },
        shape: {
          value: 0.72,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvoid main() {\n float stream =stream / 6.;\n  vec2 uv = k_uv();\n  uv *= zoom;\n\n  float dist = length(uv); \n uv *= k_rotate2d(-.8*stream);\n  uv = k_kale(uv, vec2(center), sides);\n  uv *= k_rotate2d(stream);\n  uv += sin(dotMul * dot(uv + sinMul * sin(uv - stream), uv));\n  uv /= dot(tan(uv), cos(uv));\n  for (float i = 0.; i < 20.; i++) {\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(cos(t - stream / 10.) - stream/10.);\n    float y = radius * cos(sin(t + stream / 10.) + stream/20.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, (uv.x * .02 * dist + orbSize) * pow(volume, .7), position, color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 5.831,
        },
        contrast: {
          value: 2.21,
        },
        orbSize: {
          value: 0.685,
        },
        radius: {
          value: 2.435,
        },
        colorShift: {
          value: 4.69,
        },
        center: {
          value: 2.82,
        },
        sides: {
          value: 6,
        },
        dotMul: {
          value: 0.3,
        },
        sinMul: {
          value: 7.27,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 20\n\nvoid main() {\n  float stream = stream / .2;\n  vec2 uv = k_uv();\n  gl_FragColor = vec4(0);\n  uv = normalize(uv) * length(uv);\n  uv = zoom * (uv); //(1.+ProgressBasis/2.);\n  if (invertTween) {\n    if (invert) {\n      uv = mix(uv, abs(uv), invertTweenProgress);\n    } else {\n      uv = mix(abs(uv), uv, invertTweenProgress);\n    }\n  } else if (invert) {\n    uv = abs(uv);\n  }\n  float dist = distance(uv, vec2(0));\n  float thing = .005 * sin(shapeMultiplier * dot(uv, uv) / dist - stream / 2.);\n  //  vec2 _kale = k_kale(uv, vec2(0.), sides);\n  uv *= k_rotate2d(rotation * (dist - stream / 13.));\n  float _grid = (cos(uv.x * xMultiplier - stream / 8.) + sin(uv.y * yMultiplier + stream / 6.));\n  uv /= colorSpread * thing * _grid;\n  uv *= dist;\n  uv.x = uv.y; //sin(uv.y+stream/.1);\n  for (int i = 0; i < BALLS; i++) {\n    uv *= k_rotate2d(dist * float(i)); //-stream/10.);\n    float t = float(i) * PI / float(BALLS); // - stream/4.;\n    vec2 p = radius * vec2(radius * tan(t), radius * cos(t));\n    //p += log(sin(stream/3. + float(i) * PI));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (stream / 20. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(volume*ballSize / length(uv + p * colorMultiplier) * col, 1.0);\n  }\n  gl_FragColor.xyz = glow * brightness * pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n  gl_FragColor = k_hue(gl_FragColor, stream / 50.);\n}",
    variants: [
      {
        zoom: {
          value: 0.053,
        },
        shapeMultiplier: {
          value: 223.96,
        },
        rotation: {
          value: 0,
        },
        xMultiplier: {
          value: 217.723,
        },
        yMultiplier: {
          value: 157.966,
        },
        colorSpread: {
          value: 0.001,
        },
        colorMultiplier: {
          value: 0.863,
        },
        invert: {
          value: true,
        },
        brightness: {
          value: 1.636,
        },
        ballSize: {
          value: 17.795,
        },
        glow: {
          value: 0.714,
        },
        contrast: {
          value: 2.278,
        },
        radius: {
          value: 15.459,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 15\n\nvoid main() {\n  float stream = stream / 2.;\n  vec2 uv = k_uv();\n  if (invertTween) {\n    if (invert) {\n      uv = mix(uv, abs(uv), invertTweenProgress);\n    } else {\n      uv = mix(abs(uv), uv, invertTweenProgress);\n    }\n  } else if (invert) {\n    uv = abs(uv);\n  }\n  uv *= zoom2;\n  uv *= k_rotate2d(stream / -3. + length(.6 * cos(uv - stream / 4.)) / 1.);\n  uv = zoom * (log(abs(uv)) + 1.5 * cos(uv)); //(1.+ProgressBasis/2.);\n  float dist = distance(uv, vec2(0));\n  float thing = .005 * sin(shapeMultiplier * dot(uv, uv) / dist - stream / .2);\n  //  vec2 _kale = k_kale(uv, vec2(0.), sides);\n  uv *= k_rotate2d(rotation * (dist + stream / 2.));\n  float _grid = (cos(uv.x * xMultiplier - stream / 5.) - sin(uv.y * yMultiplier + stream / -10.));\n  uv /= colorSpread * thing * _grid;\n  uv *= .1 * dist;\n\n  for (int i = 0; i < BALLS; i++) {\n    uv *= k_rotate2d(dist * float(i)); //-stream/10.);\n    float t = float(i) * PI / float(BALLS) - stream / 140.;\n    vec2 p = radius * vec2(radius * tan(t), radius * cos(t));\n    //p += log(sin(stream/3. + float(i) * PI));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (stream / 500. + uv.y / 850. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(volume * ballSize / length(uv + p * colorMultiplier) * col, 1.0);\n  }\n  gl_FragColor.xyz = glow * brightness * pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 0.008,
        },
        shapeMultiplier: {
          value: 589.178,
        },
        rotation: {
          value: 0.012,
        },
        xMultiplier: {
          value: 251.592,
        },
        yMultiplier: {
          value: 1549.9,
        },
        colorSpread: {
          value: 0.000012,
        },
        colorMultiplier: {
          value: 0.51,
        },
        invert: {
          value: false,
        },
        brightness: {
          value: 1.86,
        },
        ballSize: {
          value: 6.194,
        },
        glow: {
          value: 4.435,
        },
        contrast: {
          value: 3.189,
        },
        radius: {
          value: 10.691,
        },
        zoom2: {
          value: 0.48,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "void main() {\n  float stream = stream / 5.;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  uv *= k_rotate2d(-stream/5.);\n  vec2 _uv = uv;\n  float dist = length(uv);\n  float thing = dist * .001 * sin(shapeMultiplier * dot(uv, uv) / dist - stream/.1);\n  float _grid = (cos(uv.x * xMultiplier - stream) + sin(uv.y * yMultiplier + stream / .5));\n  uv /= colorSpread * thing * _grid;\n  uv *= dist;\n  float i = uv.x / granularity;\n  vec2 p = vec2(sin(i), cos(i));\n  vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (float(i) / 3.)) * 0.5 + 0.5;\n  gl_FragColor = vec4(ballSize / length(uv + p * colorMultiplier) * col, 1.0);\n  gl_FragColor.xyz = volume * (glow * brightness * pow(gl_FragColor.xyz, vec3(contrast)));\n}",
    variants: [
      {
        zoom: {
          value: 0.177,
        },
        xMultiplier: {
          value: 20.37,
        },
        yMultiplier: {
          value: 44.741,
        },
        ballSize: {
          value: 2.769,
        },
        colorSpread: {
          value: 1.681,
        },
        colorMultiplier: {
          value: 71.815,
        },
        shapeMultiplier: {
          value: 76.571,
        },
        glow: {
          value: 4786.254,
        },
        contrast: {
          value: 3.473,
        },
        brightness: {
          value: 10.92,
        },
        center: {
          value: 0,
        },
        granularity: {
          value: 22,
        },
        radius: {
          value: 1,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 5\n\nvoid main() {\n  float stream = stream / 3.2718;\n  vec2 uv = k_uv();\n  uv *= zoom;\n\n  gl_FragColor = vec4(0);\n  float dist = length(uv);\n  for (int i = 0; i < BALLS; i++) {\n    uv *= k_rotate2d(rotation * sin(PI * float(1 + i)) + stream / rotationFactor * dist / rot2);\n    float t = float(i) * PI / float(BALLS) / divider;\n    float a = cos(float(i) * dist - uv.x/xDiv2);\n    float b = radius * sin(t) * sinMul * cos(stream*rotationSpeed + uv.x/wap + sin(uv.y / yDiv2));\n    float c = sin(uv.y / yDiv);\n    float x = xOuter - a * uv.x / dist * PI + b;\n    float y = radius * cos(dist + yOuter * uv.x / xDiv + t + yMultiplier - stream/.251);\n    vec2 p = vec2(x, y);\n    vec3 col = cos(c + vec3(-2, 0, -1) * PI * 2. / 3. + PI * (stream/colorSpeed)) * 0.5 + 0.5;\n    gl_FragColor += vec4(ballSize / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz =1. - pow(abs(log(abs(gl_FragColor.xyz))), vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 6.404439730457706,
        },
        ballSize: {
          value: 1.4751218196831208,
        },
        contrast: {
          value: 2.15,
        },
        radius: {
          value: 4.88,
        },
        yOuter: {
          value: 1.5,
        },
        xOuter: {
          value: 6.71,
        },
        mirror: {
          value: true,
        },
        xMultiplier: {
          value: 0.65,
        },
        yMultiplier: {
          value: 4.84,
        },
        divider: {
          value: 28,
        },
        rotation: {
          value: 0,
        },
        xDiv: {
          value: 30.19,
        },
        colorSpeed: {
          value: 64.79,
        },
        rotationSpeed: {
          value: 1.75,
        },
        yDiv: {
          value: 28.3,
        },
        sinMul: {
          value: 330.32,
        },
        xDiv2: {
          value: 1,
        },
        rotationFactor: {
          value: 87.67,
        },
        rot2: {
          value: 1112,
        },
        yDiv2: {
          value: 9.81,
        },
        wap: {
          value: 1,
        },
      },
      {
        zoom: {
          value: 8.768,
        },
        ballSize: {
          value: 29.087,
        },
        contrast: {
          value: 2.15,
        },
        radius: {
          value: 18.114,
        },
        yOuter: {
          value: 2.31,
        },
        xOuter: {
          value: 6.981,
        },
        mirror: {
          value: true,
        },
        xMultiplier: {
          value: 0.74,
        },
        yMultiplier: {
          value: 1.881,
        },
        divider: {
          value: 20.309,
        },
        rotation: {
          value: 0,
        },
        xDiv: {
          value: 4.51,
        },
        colorSpeed: {
          value: 64.79,
        },
        rotationSpeed: {
          value: 1.75,
        },
        yDiv: {
          value: 10.09,
        },
        sinMul: {
          value: 330.32,
        },
        xDiv2: {
          value: 1.17,
        },
        rotationFactor: {
          value: 87.67,
        },
        rot2: {
          value: 1112,
        },
        yDiv2: {
          value: 9.81,
        },
        wap: {
          value: 2,
        },
      },
      {
        zoom: {
          value: 30.768,
        },
        ballSize: {
          value: 25.846,
        },
        contrast: {
          value: 2.088,
        },
        radius: {
          value: 30.748,
        },
        yOuter: {
          value: 1.5,
        },
        xOuter: {
          value: 6.71,
        },
        mirror: {
          value: true,
        },
        xMultiplier: {
          value: 0.65,
        },
        yMultiplier: {
          value: 4.84,
        },
        divider: {
          value: 0.433,
        },
        rotation: {
          value: 0,
        },
        xDiv: {
          value: 30.19,
        },
        colorSpeed: {
          value: 12.49,
        },
        rotationSpeed: {
          value: 1.67,
        },
        yDiv: {
          value: 28.3,
        },
        sinMul: {
          value: 330.32,
        },
        xDiv2: {
          value: 1,
        },
        rotationFactor: {
          value: 108.54,
        },
        rot2: {
          value: 1112,
        },
        yDiv2: {
          value: 9.81,
        },
        wap: {
          value: 8.43,
        },
      },
      {
        zoom: {
          value: 11.833,
        },
        ballSize: {
          value: 15.769,
        },
        contrast: {
          value: 2.15,
        },
        radius: {
          value: 4.88,
        },
        yOuter: {
          value: 1.5,
        },
        xOuter: {
          value: 6.71,
        },
        mirror: {
          value: true,
        },
        xMultiplier: {
          value: 0.65,
        },
        yMultiplier: {
          value: 4.84,
        },
        divider: {
          value: 28,
        },
        rotation: {
          value: 0,
        },
        xDiv: {
          value: 30.19,
        },
        colorSpeed: {
          value: 64.79,
        },
        rotationSpeed: {
          value: 1.75,
        },
        yDiv: {
          value: 28.3,
        },
        sinMul: {
          value: 330.32,
        },
        xDiv2: {
          value: 1,
        },
        rotationFactor: {
          value: 87.67,
        },
        rot2: {
          value: 1112,
        },
        yDiv2: {
          value: 9.81,
        },
        wap: {
          value: 1,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "mat2 r2d (in float degree)\n{\n\tfloat rad = radians (degree);\n\tfloat c = cos (rad);\n\tfloat s = sin (rad);\n\treturn mat2 (vec2 (c, s),vec2 (-s, c));\n}\n\n// using a slightly adapted implementation of iq's simplex noise from\n// https://www.shadertoy.com/view/Msf3WH with hash(), noise() and fbm()\nvec2 hash (in vec2 p)\n{ \n\tp = vec2 (dot (p, vec2 (1227.1, 311.7)),\n\t\t\t  dot (p, vec2 (269.5, 183.3)));\n\n\treturn -1. + 102.*fract (sin (p)*43758.5453123);\n}\n\nfloat noise (in vec2 p)\n{\n    const float K1 = .366025404;\n    const float K2 = .211324865;\n\n\tvec2 i = floor (p + (p.x + p.y)*K1);\n\t\n    vec2 a = p - i + (i.x + i.y)*K2;\n    vec2 o = step (a.yx, a.xy);    \n    vec2 b = a - o + K2;\n\tvec2 c = a - 1. + 2.*K2;\n\n    vec3 h = max (.5 - vec3 (dot (a, a), dot (b, b), dot (c, c) ), .0);\n\n\tvec3 n = h*h*h*h*vec3 (dot (a, hash (i + .0)),\n\t\t\t\t\t\t   dot (b, hash (i + o)),\n\t\t\t\t\t\t   dot (c, hash (i + 1.)));\n\n    return dot (n, vec3 (3.));\n}\n\nfloat fbm (in vec2 p)\n{\n\tmat2 rot = r2d (11111111.5);\n    float d = noise (p); p *= rot;\n    d += 1.5*noise (p); p *= rot;\n    d += .25*noise (p); p *= rot;\n    d += .125*noise (p); p *= rot;\n    d += .625*noise (p);\n\td /= (1. + .5 + .25 + .125 + .0625);\n\treturn d;\n}\n\nvec2 mapToScreen (in vec2 p, in float scale)\n{\n    vec2 uv = k_uv();\n    uv *= zoom;\n    return uv;//- (sin(stream/5.+uv));\n}\n\nvec2 cart2polar (in vec2 cart)\n{\n    float r = length (cart);\n    float phi = atan (cart.y, cart.x);\n    return vec2 (r, phi); \n}\n\nvec2 polar2cart (in vec2 polar)\n{\n  float x = polar.x;\n  float y= polar.y;\n  vec2 fuck = vec2(x, y);\n    return vec2 (fuck); \n}\n\nvoid main() {\n   float stream = stream / 3.;\n    vec2 uv = mapToScreen ((k_uv() + 1.0) / 2.0, zoom);\n    float len = length (sin(uv-stream));\n//  uv -= dot(uv, uv) - uv/2.;\n\n //  uv =(polar2cart (uv));\n\n\t\tfloat thicc = thickness * length(abs(uv))*length(sin(uv+stream));\n    float d1 = size*abs (sin(stream+uv.x*haze)*thicc * (cos(uv.x+stream) + abs(fbm (aa*uv + stream))));\n    uv = abs(uv);\n    float d2 = size*abs (sin(stream-uv.y*haze)*thicc * (sin(uv.y-stream) * abs(fbm (bb*uv + stream))));\n    float d3 = size*abs (cos(stream+uv.x*uv.y/haze)*thicc / (uv.x+log(uv.y) + fbm (cc*uv + stream)));\n    vec3 col = vec3 (.0);\n\tcol += d1*size*abs(sin(col1-stream/20.));\n\tcol += d2*size*abs(cos(col2-stream/20.));\n\tcol += d3*size*col3;\n\n    gl_FragColor = vec4 (.5-1.*sin(log(col)), 1.);\n}",
    variants: [
      {
        speed: {
          value: 0.023,
        },
        bump: {
          value: 0.18,
        },
        zoom: {
          value: 0.52,
        },
        thickness: {
          value: 0.0028,
        },
        haze: {
          value: 2,
        },
        col1: {
          value: [0.9529411764705882, 0.9137254901960784, 0.3686274509803922],
        },
        col2: {
          value: [0.12156862745098039, 0.8235294117647058, 1],
        },
        col3: {
          value: [0, 1, 0.06666666666666667],
        },
        size: {
          value: 0.005,
        },
        aa: {
          value: 24.47,
        },
        bb: {
          value: 4.95,
        },
        cc: {
          value: 11.59,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 15\n  \nfloat stepping(float t) {\n  if (t < 0.) return -1. + pow(1. + t, 2.);\n  else return 1. - pow(1. - t, 2.);\n}\n\nmat2 rotate2d(float _angle){\n  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  gl_FragColor = vec4(0);\n  uv = normalize(abs(uv) + sin(abs(uv)-stream)) * length(uv);\n//  uv /= .1*tan(.1*dot(1.1*tan(uv), 5.*atan(uv)) - stream/5.);\n // uv /= dot(sin(uv+stream), cos(uv+stream));\n // uv += sin(.01*dot(tan(uv+stream/20.), tan(uv-stream/20.)) - stream/5.);\n  uv *= rotate2d(rotation);\n  for (int i = 0; i < BALLS; i++) {\n    float dist = length(uv);\n\t\tuv.y += yOuter*sin(uv.y/yDivider + stream/5.) / 1.*sin(uv.x/1. - stream/3.);\n    uv.x -= xOuter*sin(uv.x/xDivider - stream/5.) / 1.*sin(uv.x/1.1 + stream/1.);\n    float t = float(i) * PI / float(BALLS) * (5. + 1.) + stream/5000.;\n    float _multiplier = dist*multiplier * sin(uv.x);\n    vec2 p = vec2(radius*-2.*tan(t*multiplier), 2.*radius*sin(t*multiplier));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (stream / 20. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(pow(volume, .75) * ballSize / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        speed: {
          value: 0.04,
        },
        bump: {
          value: 0.53,
        },
        zoom: {
          value: 27.87,
        },
        yDivider: {
          value: 187.19,
        },
        xDivider: {
          value: 130.77,
        },
        multiplier: {
          value: 583.53,
        },
        ballSize: {
          value: 1.8,
        },
        contrast: {
          value: 2.09,
        },
        radius: {
          value: 19.36,
        },
        yOuter: {
          value: 0.42,
        },
        xOuter: {
          value: 0.42,
        },
        rotation: {
          value: 0.58,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom / 1.5;\n  float stream = stream / 5.;\n  float dist = length(uv);\n  uv *= k_rotate2d(-stream/13.);\n  uv = k_kale(uv, vec2(center), sides);\n  uv += sin(dotMul * dot(uv + sinMul * sin(uv - stream/.4), uv));\n  uv *= k_rotate2d(stream/1.5);\n  uv /= dot(tan(uv), cos(uv));\n  for (float i = 0.; i < 20.; i++) {\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan((t - stream / 4.2));\n    float y = radius * cos((t));\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, pow(volume, .25) * uv.y * .02 * dist + orbSize*1.5* pow(volume, .5), position, color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 10.222483,
        },
        contrast: {
          value: 2.19,
        },
        orbSize: {
          value: 0.573,
        },
        radius: {
          value: 2.499,
        },
        colorShift: {
          value: 9.38,
        },
        center: {
          value: 3.248,
        },
        sides: {
          value: 6,
        },
        dotMul: {
          value: 0.449923,
        },
        sinMul: {
          value: 5.834043,
        },
      },
      {
        zoom: {
          value: 7.411,
        },
        contrast: {
          value: 2.490571,
        },
        orbSize: {
          value: 0.284351,
        },
        radius: {
          value: 1.45411,
        },
        colorShift: {
          value: 9.38,
        },
        center: {
          value: 1.982842,
        },
        sides: {
          value: 6,
        },
        dotMul: {
          value: 0.6,
        },
        sinMul: {
          value: 2.761415,
        },
      },
      {
        zoom: {
          value: 8.535869,
        },
        contrast: {
          value: 2.544121,
        },
        orbSize: {
          value: 0.76,
        },
        radius: {
          value: 3.52,
        },
        colorShift: {
          value: 9.38,
        },
        center: {
          value: 0.586818,
        },
        sides: {
          value: 6,
        },
        dotMul: {
          value: 0.219598,
        },
        sinMul: {
          value: 3.851995,
        },
      },
      {
        zoom: {
          value: 1.935531,
        },
        contrast: {
          value: 2.591991,
        },
        orbSize: {
          value: 0.369118,
        },
        radius: {
          value: 2.299153,
        },
        colorShift: {
          value: 9.38,
        },
        center: {
          value: 0.760752,
        },
        sides: {
          value: 6,
        },
        dotMul: {
          value: 0.6,
        },
        sinMul: {
          value: 11.975028,
        },
      },
      {
        zoom: {
          value: 12.832807,
        },
        contrast: {
          value: 2.591991,
        },
        orbSize: {
          value: 0.694402,
        },
        radius: {
          value: 0.893505,
        },
        colorShift: {
          value: 9.38,
        },
        center: {
          value: 4.290152,
        },
        sides: {
          value: 6,
        },
        dotMul: {
          value: 0.387826,
        },
        sinMul: {
          value: 4.995423,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "void main() {\nfloat stream = stream / 3.;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  mat2 rotation = k_rotate2d(stream/2.);\n  float ot = ot;\n  for (float i = 0.; i < 20.; i++) {\n    uv *= rotation;\n    uv = abs(uv) * iterator - 1.;\n    ot = dot(uv, uv) - atan(length(k_uv()) / LL + stream/1.569);\n    vec3 col = k_rainbow(i / iterations, colorShift, colorOffset);\n    gl_FragColor += k_orb(uv, volume/10., vec2(sin((k_uv()).x), cos((k_uv()).y)),  col, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 3.135,
        },
        iterator: {
          value: 1.071,
        },
        ot: {
          value: 63.521,
        },
        II: {
          value: 2.264,
        },
        JJ: {
          value: 1.356,
        },
        KK: {
          value: 3.881,
        },
        iterations: {
          value: 18.705,
        },
        LL: {
          value: 0.651,
        },
        MM: {
          value: 9.278,
        },
        colorShift: {
          value: 0.676,
        },
        colorOffset: {
          value: 0.5,
        },
        contrast: {
          value: 1.676,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "void main() {\n  float stream = stream / 7.8;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  uv /= dot(uv, uv);\n  uv *= k_rotate2d(stream/1.);\n  for (float i = 0.; i < 10.; i++) {\n    uv.x += aa * cos(bb * uv.y);\n    uv.y += cc * cos(dd * uv.x + stream/.15);\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(t - stream/2.4);\n    float y = radius * cos(t - stream/1.7);\n    vec2 position = vec2(x, y);\n    vec3 color = k_rainbow(i / orbs, colorShift, colorOffset);\n    gl_FragColor += k_orb(uv, pow(volume, .6) * orbSize, position, color, contrast);\n  }\n\n  gl_FragColor.xyz = 1. - pow(abs(1.-log(abs(gl_FragColor.xyz))), vec3(contrast));\n}",
    variants: [
      {
        zoom: {
          value: 0.32,
        },
        contrast: {
          value: 0.656,
        },
        orbSize: {
          value: 1.488,
        },
        radius: {
          value: 0,
        },
        colorShift: {
          value: 0.962,
        },
        orbs: {
          value: 16,
        },
        aa: {
          value: 1.64,
        },
        bb: {
          value: 0.56,
        },
        cc: {
          value: 0.94,
        },
        dd: {
          value: 0.43,
        },
        colorOffset: {
          value: 0,
        },
      },
      {
        zoom: {
          value: 0.307,
        },
        contrast: {
          value: 1.358,
        },
        orbSize: {
          value: 5.006,
        },
        radius: {
          value: 2.979,
        },
        colorShift: {
          value: 0,
        },
        orbs: {
          value: 16,
        },
        aa: {
          value: 1.64,
        },
        bb: {
          value: 0.56,
        },
        cc: {
          value: 0.94,
        },
        dd: {
          value: 0.66,
        },
        colorOffset: {
          value: 4.12,
        },
      },
      {
        zoom: {
          value: 0.145,
        },
        contrast: {
          value: 1.35,
        },
        orbSize: {
          value: 8.789,
        },
        radius: {
          value: 0,
        },
        colorShift: {
          value: 1.277,
        },
        orbs: {
          value: 16,
        },
        aa: {
          value: 5,
        },
        bb: {
          value: 0.19,
        },
        cc: {
          value: 1.77,
        },
        dd: {
          value: 0.47,
        },
        colorOffset: {
          value: 2.06,
        },
      },
      {
        zoom: {
          value: 1,
        },
        contrast: {
          value: 1.358,
        },
        orbSize: {
          value: 5.006,
        },
        radius: {
          value: 8.327,
        },
        colorShift: {
          value: 0.994,
        },
        orbs: {
          value: 16,
        },
        aa: {
          value: 1.64,
        },
        bb: {
          value: 0.56,
        },
        cc: {
          value: 0.8,
        },
        dd: {
          value: 0.66,
        },
        colorOffset: {
          value: 9.29,
        },
      },
      {
        zoom: {
          value: 0.089,
        },
        contrast: {
          value: 0.617,
        },
        orbSize: {
          value: 0.993,
        },
        radius: {
          value: 8.327,
        },
        colorShift: {
          value: 0.227,
        },
        orbs: {
          value: 16,
        },
        aa: {
          value: 1.64,
        },
        bb: {
          value: 0,
        },
        cc: {
          value: 0,
        },
        dd: {
          value: 0.66,
        },
        colorOffset: {
          value: 9.29,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      '/* Anti-aliasing code */\n\n#define _AA_START               \\\nvec3 tot;                       \\\nfor (int j = 0; j < AA; j++)    \\\nfor (int k = 0; k < AA; k++) {  \\\nvec2 o = vec2(float(j), float(k)) / float(AA) - 0.5;\n\n#define _AA_END       \\\n} tot /= float(AA*AA);  \\\ngl_FragColor = vec4(tot, 1.); \\\n\n/* "Digital Abyss" by @kishimisu (2022) - https://www.shadertoy.com/view/Dsj3WW\n *   \n * Interact with the mouse!  */\n\n#define AA 1 // Antialiasing level\n\nvoid main() { \n_AA_START     \n    float r, t = 1.;\n    vec2 mouse = vec2(0., 0.);\n    vec2 i = k_uv() * zoom;\ni *= k_rotate2d(stream/15.);\n    for (float a = 0.; a < 32.; a++) {        i = abs(i);\n\n        i *= k_rotate2d(a/50.);\n\n        vec3 p = r*vec3(i, wap);\n\n        p.xy  *= mat2(120.*sin(cos(stream/100.-.01*r/i.y/116.-sub) - vec4(AA, BB, CC, DD)-stream/5.));\n              i = abs(i);\n\n        p.z   += stream*.47590611;\n\n        p = (abs(fract(p)-.5)); \n        r += t = (p.x + p.y + p.z -dep)*mul;        \n    }\n    tot += mix(.17 - vec3(r*r*length(i)), \n        1.2 * cos(r - (vec3(.1, .7, 1.1) - length(i))), \n        exp(-r*.0007)); \n_AA_END \n}',
    variants: [
      {
        zoom: {
          value: 0.024,
        },
        mul: {
          value: 0.46,
        },
        rot: {
          value: 489.87,
        },
        sub: {
          value: 42.73,
        },
        AA: {
          value: 2.34,
        },
        BB: {
          value: 5.57,
        },
        CC: {
          value: 10.18,
        },
        DD: {
          value: 3.59,
        },
        dep: {
          value: 0.11,
        },
        wap: {
          value: 0.7,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "void main() {\n  gl_FragColor = vec4(0);\n  vec2 uv = k_uv() * zoom * k_rotate2d(stream/20.);\n  float dist = length(uv);\n  for (float i = 0.; i < 5.; i++) {\n    uv *= k_rotate2d(rotation / (i + 1.));\n    float t = float(i) * PI / float(4.) * (5. + 1.) / divider;// + stream/50.;\n    vec2 p = vec2(xOuter-(cos(xMultiplier*uv.x - stream/2.))*uv.x/yMultiplier*PI+radius*cos(t-stream/-10.)\n                  * yMultiplier*cos(stream/.5 -uv.x * sin(uv.y/4.-stream/1.6)), radius*\n                  cos(stream/3000. - 9.1*yOuter*uv.x/.5+t+yMultiplier+1.));\n    vec3 col = cos(sin(uv.y/7.-stream/40.)+vec3(-2, 0, -1) * PI * 2. / 3. + PI * (10.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(ballSize / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = 1.-(pow(abs(log(abs(gl_FragColor.xyz))), vec3(contrast)));\n}",
    variants: [
      {
        zoom: {
          value: 20.93585278614458,
        },
        ballSize: {
          value: 10,
        },
        contrast: {
          value: 2.96,
        },
        radius: {
          value: 32.010777484939766,
        },
        yOuter: {
          value: 0,
        },
        xOuter: {
          value: 21.24435240963856,
        },
        xMultiplier: {
          value: 1.3759412650602412,
        },
        yMultiplier: {
          value: 0.9386201054216868,
        },
        divider: {
          value: 1,
        },
        rotation: {
          value: 2.778567394578314,
        },
      },
      {
        zoom: {
          value: 33.7234092620482,
        },
        ballSize: {
          value: 3.170444277108434,
        },
        contrast: {
          value: 5.053252070783133,
        },
        radius: {
          value: 28.778237951807235,
        },
        yOuter: {
          value: 0.004550781250000001,
        },
        xOuter: {
          value: 1,
        },
        xMultiplier: {
          value: 2.145849021084338,
        },
        yMultiplier: {
          value: 1.6400000000000003,
        },
        divider: {
          value: 1,
        },
        rotation: {
          value: 3.607210090361446,
        },
      },
      {
        zoom: {
          value: 33.7234092620482,
        },
        ballSize: {
          value: 6.476543674698796,
        },
        contrast: {
          value: 5.053252070783133,
        },
        radius: {
          value: 31.092338102409645,
        },
        yOuter: {
          value: 0.0005304028614457833,
        },
        xOuter: {
          value: 130.72176204819277,
        },
        xMultiplier: {
          value: 1.1696630271084338,
        },
        yMultiplier: {
          value: 1.1726844879518075,
        },
        divider: {
          value: 1,
        },
        rotation: {
          value: 3.607210090361446,
        },
      },
      {
        zoom: {
          value: 13.757765436746988,
        },
        ballSize: {
          value: 6.476543674698796,
        },
        contrast: {
          value: 5.053252070783133,
        },
        radius: {
          value: 10.042356927710845,
        },
        yOuter: {
          value: 0.011533635853503293,
        },
        xOuter: {
          value: 18.25225903614458,
        },
        xMultiplier: {
          value: 0.8655402861445785,
        },
        yMultiplier: {
          value: 2,
        },
        divider: {
          value: 1,
        },
        rotation: {
          value: 0,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "void main() {\n  float stream =stream * 1.6;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  uv *= k_rotate2d(stream / 21.);\n  for (float i = 0.; i < 15.; i++) {\n    uv = uv * iterator;\n    vec3 col = k_rainbow(i / iterations, colorShift, colorOffset);\n    float a = radius * cos(uv.x + stream / 14.);\n    float b = radius * sin(uv.y + stream / -5.);\n    float c = radius * wave * sin(split * uv.x - stream / 2.5);\n    float d = radius * wave * cos(split * uv.y  - stream / 5.5);\n    float x = a * b - c + d;\n    gl_FragColor += k_orb(uv,zoom* pow(volume,1.) * orbSize, vec2(x, x),  col, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 1.35424,
        },
        iterator: {
          value: 1.07941,
        },
        iterations: {
          value: 21.63525,
        },
        colorShift: {
          value: 0.79378,
        },
        colorOffset: {
          value: 29.16356,
        },
        contrast: {
          value: 0.93552,
        },
        orbSize: {
          value: 0.13542,
        },
        div: {
          value: 1.37978,
        },
        radius: {
          value: 4.11947,
        },
        wave: {
          value: 0.9217,
        },
        split: {
          value: 7.46972,
        },
      },
      {
        zoom: {
          value: 1.16404,
        },
        iterator: {
          value: 0.92054,
        },
        iterations: {
          value: 21.63525,
        },
        colorShift: {
          value: 0.76422,
        },
        colorOffset: {
          value: 19.50448,
        },
        contrast: {
          value: 0.93552,
        },
        orbSize: {
          value: 0.13542,
        },
        div: {
          value: 1.37978,
        },
        radius: {
          value: 3.43899,
        },
        wave: {
          value: 1.61956,
        },
        split: {
          value: 14.62046,
        },
      },
      {
        zoom: {
          value: 0.5544239457831327,
        },
        iterator: {
          value: 1.00471,
        },
        iterations: {
          value: 16.31461,
        },
        colorShift: {
          value: 0.33359,
        },
        colorOffset: {
          value: 21.77581,
        },
        contrast: {
          value: 1.21895,
        },
        orbSize: {
          value: 0.04777,
        },
        div: {
          value: 1.37978,
        },
        radius: {
          value: 3.11627,
        },
        wave: {
          value: 1.07795,
        },
        split: {
          value: 33.59867,
        },
      },
      {
        zoom: {
          value: 2.88861,
        },
        iterator: {
          value: 0.80495,
        },
        iterations: {
          value: 13.72489,
        },
        colorShift: {
          value: 0.38237,
        },
        colorOffset: {
          value: 15.97272,
        },
        contrast: {
          value: 1.05403,
        },
        orbSize: {
          value: 0.17637,
        },
        div: {
          value: 1.37978,
        },
        radius: {
          value: 4.26167,
        },
        wave: {
          value: 1.11087,
        },
        split: {
          value: 3.30232,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 30\n\nvoid main() {\n  float stream =stream / 40.;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  uv /= dot(uv, uv);\n  // uv = uv*uv;\n  if (mirrorTween) {\n    if (mirror) {\n      uv = mix(uv, uv * uv, (mirrorTweenProgress));\n    } else {\n      uv = mix(uv * uv, uv, (mirrorTweenProgress));\n    }\n  } else if (mirror) {\n    uv = abs(uv);\n  }\n  gl_FragColor = vec4(0);\n  float dist = length(uv);\n  for (int i = 0; i < BALLS; i++) {\n    uv *= k_rotate2d(rotation * 5. + -rotation + stream / 5.);\n    float t = float(i) * PI / float(BALLS) * (5. + 1.) / divider; // + stream/50.;\n    vec2 p = vec2(xOuter * (cos(uv.x - stream / .1)) * uv.x + radius * tan(t) * 20. * cos(uv.x + sin(uv.y / 100.)), radius * cos(.1 / dist * yOuter * uv.x / .5 + t + yMultiplier + 2. * stream));\n    vec3 col = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (stream / 3. / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(volume*ballSize / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = 1. - pow(abs(log(abs(gl_FragColor.xyz))), vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 1.78,
        },
        ballSize: {
          value: 0.811,
        },
        contrast: {
          value: 6.18,
        },
        radius: {
          value: 0.37,
        },
        yOuter: {
          value: 0,
        },
        xOuter: {
          value: 55.27,
        },
        mirror: {
          value: false,
        },
        xMultiplier: {
          value: 4.14,
        },
        yMultiplier: {
          value: 5.19,
        },
        divider: {
          value: 4,
        },
        rotation: {
          value: 0.0576,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  float dist = length(uv);\n  uv *= k_rotate2d(stream / 12.);\n  uv = k_kale(uv, vec2(center), sides);\n  uv *= k_rotate2d(stream / -15.);\n  uv *= sin(dotMul * dot(uv + xDot * cos(uv), .1 / dist * uv + yDot * cos(uv)) - stream / 10.);\n  for (float i = 0.; i < 20.; i++) {\n    float t = i * PI / orbs * 2.;\n    float x = radius * sin(t + stream / 10.);\n    float y = radius * cos(t - stream / 10.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, 1./length(uv)*pow(volume, .827) * orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 10.141,
        },
        contrast: {
          value: 1.6,
        },
        orbSize: {
          value: 0.602,
        },
        radius: {
          value: 1.82,
        },
        colorShift: {
          value: 17.42,
        },
        center: {
          value: 7.68,
        },
        sides: {
          value: 6,
        },
        xDot: {
          value: 2.982958668830698,
        },
        yDot: {
          value: 2.59,
        },
        dotMul: {
          value: 0.11973979612093022,
        },
        rotation: {
          value: 0,
        },
      },
      {
        zoom: {
          value: 10.141,
        },
        contrast: {
          value: 1.6,
        },
        orbSize: {
          value: 1.535,
        },
        radius: {
          value: 5.629,
        },
        colorShift: {
          value: 17.42,
        },
        center: {
          value: 5.341,
        },
        sides: {
          value: 6,
        },
        xDot: {
          value: 1.211,
        },
        yDot: {
          value: 0.554,
        },
        dotMul: {
          value: 0.11973979612093022,
        },
        rotation: {
          value: 6.332,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 18\n  \nfloat stepping(float t) {\n  if (t < 0.) return -1. + pow(1. + t, 2.);\n  else return 1. - pow(1. - t, 2.);\n}\n\nmat2 rotate2d(float _angle){\n  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));\n}\n\nvoid main() {\n  vec2 uv = k_uv();\n  uv *= zoom;\n  gl_FragColor = vec4(0);\n  uv = normalize(uv) * length((uv));\n  float dist = length(uv);\n  uv *= k_rotate2d(PI /2.);\n\n  uv *= rotate2d(stream/10.);\n  for (int i = 0; i < BALLS; i++) {\n\t\tuv.y += aa*float(i)*cos(uv.y/yDivider - stream/1.) + sin(uv.x/cc - stream/1.);\n    uv.x += bb*float(i)*cos(uv.y/xDivider - stream)+sin(uv.x/xDivider + stream) - sin(uv.y/dd);\n    float t = .05*dist*float(i) * PI / float(BALLS) * (5. + 1.);\n    vec2 p = radius*vec2(-1.*cos(t), ee*sin(t/multiplier));\n    p /= sin(PI * sin(uv.y/10.)*cos(uv.y/10.));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (stream / 2. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(pow(volume, .7)*ballSize*1.1 / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = pow(log(gl_FragColor.xyz), vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 31.948,
        },
        yDivider: {
          value: 1.5,
        },
        xDivider: {
          value: 0.9,
        },
        multiplier: {
          value: 1.07475,
        },
        ballSize: {
          value: 3.58,
        },
        contrast: {
          value: 1.19,
        },
        radius: {
          value: 17.01,
        },
        rotation: {
          value: 0.08,
        },
        aa: {
          value: 0.13,
        },
        bb: {
          value: 0,
        },
        cc: {
          value: 2.33,
        },
        dd: {
          value: 0.63,
        },
        ee: {
          value: 1,
        },
      },
      {
        zoom: {
          value: 20.68,
        },
        yDivider: {
          value: 19.63,
        },
        xDivider: {
          value: 0.49,
        },
        multiplier: {
          value: 64,
        },
        ballSize: {
          value: 1.1,
        },
        contrast: {
          value: 1.19,
        },
        radius: {
          value: 6.19,
        },
        rotation: {
          value: 0.17,
        },
        aa: {
          value: 0,
        },
        bb: {
          value: 0,
        },
        cc: {
          value: 3.3,
        },
        dd: {
          value: 0.71,
        },
        ee: {
          value: 1,
        },
      },
      {
        zoom: {
          value: 16.84005370031426,
        },
        yDivider: {
          value: 19.63,
        },
        xDivider: {
          value: 2.119977205335353,
        },
        multiplier: {
          value: 8.310778794401344,
        },
        ballSize: {
          value: 1.6599921687041703,
        },
        contrast: {
          value: 0.8500047547153251,
        },
        radius: {
          value: 4.0500299267376345,
        },
        rotation: {
          value: 0.17,
        },
        aa: {
          value: 0.11999832186517936,
        },
        bb: {
          value: 0,
        },
        cc: {
          value: 6.879949935644517,
        },
        dd: {
          value: 0.71,
        },
        ee: {
          value: 1,
        },
      },
      {
        zoom: {
          value: 16.43,
        },
        yDivider: {
          value: 3.47,
        },
        xDivider: {
          value: 0.79,
        },
        multiplier: {
          value: 0.83,
        },
        ballSize: {
          value: 3.58,
        },
        contrast: {
          value: 1.19,
        },
        radius: {
          value: 13.28,
        },
        rotation: {
          value: 0.16,
        },
        aa: {
          value: 0.53,
        },
        bb: {
          value: 0.08,
        },
        cc: {
          value: 2.12,
        },
        dd: {
          value: 1.16,
        },
        ee: {
          value: 1,
        },
      },
      {
        zoom: {
          value: 14.53,
        },
        yDivider: {
          value: 19.63,
        },
        xDivider: {
          value: 2.73,
        },
        multiplier: {
          value: 5.73,
        },
        ballSize: {
          value: 2.16,
        },
        contrast: {
          value: 1.19,
        },
        radius: {
          value: 0.18,
        },
        rotation: {
          value: 0.03,
        },
        aa: {
          value: 0,
        },
        bb: {
          value: 1.56,
        },
        cc: {
          value: 7.05,
        },
        dd: {
          value: 1.29,
        },
        ee: {
          value: 0.94,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "void main() {\n  float stream = stream / 75.;\n  vec2 uv = k_uv();\n  uv *= zoom / 1090.;\n  uv *= k_rotate2d(stream/-.33726);\n  uv *= outer * (1.1 + cos(inner*dot(uv, uv) - stream/-.061271));\n  uv = abs(uv);\n  for (float i = 5.; i < 15.; i++) {\n    uv = uv * iterator;\n    vec3 col = k_rainbow(i / iterations, colorShift, colorOffset);\n    float a = radius * cos(uv.x + stream/.05);\n    float b = radius * sin(uv.y - stream/-.1);\n    float c = radius * wave * sin(split * uv.x - (stream / -.0355));\n    float d = radius * wave * cos(split * uv.y  - (stream / .035));\n    float x = a * b - c + d;\n    gl_FragColor += k_orb(uv,zoom* pow(volume, 1.)* orbSize, vec2(x, x),  col, contrast);\n  }\n\n  gl_FragColor = k_hue(gl_FragColor, stream/.5 + length(uv/.2));\n}",
    variants: [
      {
        zoom: {
          value: 0.267,
        },
        iterator: {
          value: 1.5,
        },
        iterations: {
          value: 1.412,
        },
        colorShift: {
          value: 0.035,
        },
        colorOffset: {
          value: 20.312,
        },
        contrast: {
          value: 1.294,
        },
        orbSize: {
          value: 7.351,
        },
        div: {
          value: 14.233,
        },
        radius: {
          value: 5.486,
        },
        wave: {
          value: 17.67,
        },
        split: {
          value: 500,
        },
        inner: {
          value: 9689533.356,
        },
        outer: {
          value: 2.616,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 5.\n\nvoid main() {\n  float stream = stream / 30.;\n  vec2 uv = k_uv();\n  uv *= k_rotate2d(stream / .4);\n  uv /= dot(uv, uv);\n  uv *= zoom;\n  // gl_FragColor = vec4(0);\n  // float dist = length(uv);\n  uv *= k_rotate2d(stream / 2.);\n  // uv *= log(abs(uv));\n  // uv = normalize(uv) * length((uv));\n  vec2 _uv = uv;\n  uv *= (outer + outer2*sin(woot*cos(_uv.x/div2 + stream / .15) * _uv.y/div - stream/-.08));\n  uv -= 21212.5*tan(uv.x/zoom - stream/.28);\n  for (float i = 0.; i < orbs; i++) {\n    uv *= k_rotate2d(rotation * PI);\n    float t = float(i) * PI / float(orbs) * (2. + 1.);\n    vec2 p = vec2(radius*wat*tan(- t*PI), radius*sin(t - stream/-.08));\n    p /= (cos(wad * cos(stream/.3 - uv.x/xx))*sin(stream/-.035- uv.y/(.9*yy + .26*yy*sin(stream/.3123))));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (.9 * float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(colorOffset*float(i)*pow(volume, .4)*ballSize / length(uv  - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = 1.-pow(abs(1.-log(abs(gl_FragColor.xyz))), vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 301487.844,
        },
        ballSize: {
          value: 37126.406,
        },
        contrast: {
          value: 0.902,
        },
        radius: {
          value: 15666547.614,
        },
        mirror: {
          value: false,
        },
        xx: {
          value: 31929999,
        },
        yy: {
          value: 40348628.99,
        },
        rotation: {
          value: 0.014,
        },
        colorOffset: {
          value: 326.72,
        },
        sides: {
          value: 3,
        },
        kaleidoscope: {
          value: false,
        },
        div: {
          value: 100000,
        },
        div2: {
          value: 1031881.214,
        },
        wad: {
          value: 8.806,
        },
        woot: {
          value: 0.223,
        },
        wat: {
          value: 0.075,
        },
        wob: {
          value: 61.937,
        },
        outer: {
          value: 133,
        },
        outer2: {
          value: 50.949,
        },
        wave: {
          value: 2.122,
        },
        aWave: {
          value: 0.336,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\n  void main() {\n    vec2 uv = k_uv().xy;\n    uv *= zoom;\n    uv *= k_rotate2d(stream/62.);\n    float dist = length(sin(cos(uv+stream/33.) + stream/2.5));\n    for (float i = 0.; i < orbs; i++) {\n      uv.x *= abs(dist+.001* dist*(i) * (uv.x/2.));\n      float t = (i+1.) * PI / orbs * 2.;\n      float x = radius * tan(t+stream/-4.);//* cos(t-stream/1.) / sin(t);\n      float y = radius * sin(t);// / sin(t-stream/1.) / cos(t);\n      vec2 position = vec2(x, y);\n      vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i+100.) / colorShift)) * 0.5 + 0.5;\n      gl_FragColor += k_orb(uv, pow(volume, 1.)*orbSize, position, color, contrast);\n    }\n  }",
    variants: [
      {
        zoom: {
          value: 6.197,
        },
        contrast: {
          value: 1.682,
        },
        orbSize: {
          value: 1.314,
        },
        radius: {
          value: 7.257,
        },
        colorShift: {
          value: 5.092,
        },
        mirror: {
          value: false,
        },
        kaleidoscope: {
          value: false,
        },
        center: {
          value: 1,
        },
        sides: {
          value: 3,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 20.\n\n  vec2 kale(vec2 uv, vec2 offset, float sides) {\n  float angle = atan(uv.y, uv.x);\n  angle = ((angle / PI) + 1.0) * 0.5;\n  angle = mod(angle, 1.0 / sides) * sides;\n  angle = -abs(2.0 * angle - 1.0) + 1.0;\n  angle = angle;\n  float y = length(uv);\n  angle = angle * (y);\n  return vec2(angle, y) - offset;\n} \n\nvec4 hue(vec4 color, float shift) {\n  const vec4 kRGBToYPrime = vec4(0.299, 0.587, 0.114, 0.0);\n  const vec4 kRGBToI = vec4(0.596, -0.275, -0.321, 0.0);\n  const vec4 kRGBToQ = vec4(0.212, -0.523, 0.311, 0.0);\n  const vec4 kYIQToR = vec4(1.0, 0.956, 0.621, 0.0);\n  const vec4 kYIQToG = vec4(1.0, -0.272, -0.647, 0.0);\n  const vec4 kYIQToB = vec4(1.0, -1.107, 1.704, 0.0);\n  float YPrime = dot(color, kRGBToYPrime);\n  float I = dot(color, kRGBToI);\n  float Q = dot(color, kRGBToQ);\n  float hue = atan(Q, I);\n  float chroma = sqrt(I * I + Q * Q);\n  hue += shift;\n  Q = chroma * sin(hue);\n  I = chroma * cos(hue);\n  vec4 yIQ = vec4(YPrime, I, Q, 0.0);\n  color.r = dot(yIQ, kYIQToR);\n  color.g = dot(yIQ, kYIQToG);\n  color.b = dot(yIQ, kYIQToB);\n  return color;\n}\n\nvec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {\n  return a + b * cos(2. * PI * (c * t + d));\n}\n\nvec4 orb (vec2 uv, float size, vec2 position, vec3 color, float contrast) {\n  return pow(vec4(size / length(uv + position) * color, 1.), vec4(contrast));\n}\n\nmat2 rotate (float angle) {\n  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));\n}\n\nvoid main() {\n  vec2 uv = k_uv().xy;\n  uv *= zoom;\n  uv *= rotate(stream/5.);\n  float dist = length(uv);\n  if (mirrorTween) {\n   \tif (mirror) { \n    \tuv = mix(uv, abs(uv), (mirrorTweenProgress));\n    } else {\n      uv = mix(abs(uv), uv, (mirrorTweenProgress));\n    }\n  } else if (mirror) {\n    uv = abs(uv);\n  }\n  //uv *= rotate(rotation*stream/5.);\n  uv /= dot(uv, uv);\n  //uv = kale(uv, vec2(0), sides);\n  //uv *= rotate(rotation*stream/10.);\n  for (float i = 0.; i < orbs; i++) {\n    uv.x += sinMul * sin(uv.y * yMul + stream*xSpeed) - cos(uv.y/yDivide-stream/2.);\n    uv.y += cosMul * cos(uv.x * xMul - stream*ySpeed) * sin(uv.x/xDivide-stream/2.);\n    float t = i * PI / orbs * 2.;\n    float x = radius * tan(t-stream/5.);\n    float y = radius * cos(t+stream/5.);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += orb(uv, orbSize, position, color, contrast);\n  }\n}",
    variants: [
      {
        zoom: {
          value: 0.31,
        },
        contrast: {
          value: 1.46,
        },
        orbSize: {
          value: 2.7,
        },
        radius: {
          value: 12.69,
        },
        colorShift: {
          value: 4.31,
        },
        sides: {
          value: 7,
        },
        rotation: {
          value: 0.66,
        },
        sinMul: {
          value: 0,
        },
        cosMul: {
          value: 1.09,
        },
        yMul: {
          value: 0,
        },
        xMul: {
          value: 0.26,
        },
        xSpeed: {
          value: -1,
        },
        ySpeed: {
          value: 1,
        },
        gloop: {
          value: 0.0022,
        },
        yDivide: {
          value: 3.33,
        },
        xDivide: {
          value: 3.33,
        },
        mirror: {
          value: false,
        },
      },
      {
        zoom: {
          value: 0.06,
        },
        contrast: {
          value: 1.59,
        },
        orbSize: {
          value: 2.7,
        },
        radius: {
          value: 18.4,
        },
        colorShift: {
          value: 10,
        },
        sides: {
          value: 7,
        },
        rotation: {
          value: 0.66,
        },
        sinMul: {
          value: 0,
        },
        cosMul: {
          value: 1.09,
        },
        yMul: {
          value: 0,
        },
        xMul: {
          value: 0.26,
        },
        xSpeed: {
          value: -1,
        },
        ySpeed: {
          value: 1,
        },
        gloop: {
          value: 0.0022,
        },
        yDivide: {
          value: 3.33,
        },
        xDivide: {
          value: 3.33,
        },
        mirror: {
          value: false,
        },
      },
      {
        zoom: {
          value: 0.14,
        },
        contrast: {
          value: 1.46,
        },
        orbSize: {
          value: 2.7,
        },
        radius: {
          value: 12.69,
        },
        colorShift: {
          value: 4.31,
        },
        sides: {
          value: 7,
        },
        rotation: {
          value: 0.66,
        },
        sinMul: {
          value: 0,
        },
        cosMul: {
          value: 0,
        },
        yMul: {
          value: 0,
        },
        xMul: {
          value: 0.26,
        },
        xSpeed: {
          value: -1,
        },
        ySpeed: {
          value: 1,
        },
        gloop: {
          value: 0.0022,
        },
        yDivide: {
          value: 3.33,
        },
        xDivide: {
          value: 3.33,
        },
        mirror: {
          value: false,
        },
      },
      {
        zoom: {
          value: 0.62,
        },
        contrast: {
          value: 1.5,
        },
        orbSize: {
          value: 2.7,
        },
        radius: {
          value: 10.4,
        },
        colorShift: {
          value: 4.31,
        },
        sides: {
          value: 7,
        },
        rotation: {
          value: 0.66,
        },
        sinMul: {
          value: 0,
        },
        cosMul: {
          value: 0,
        },
        yMul: {
          value: 0,
        },
        xMul: {
          value: 0.26,
        },
        xSpeed: {
          value: 1,
        },
        ySpeed: {
          value: 1,
        },
        gloop: {
          value: 0.0059,
        },
        yDivide: {
          value: 0.43,
        },
        xDivide: {
          value: 12.45,
        },
        mirror: {
          value: false,
        },
      },
      {
        zoom: {
          value: 0.05,
        },
        contrast: {
          value: 1.68,
        },
        orbSize: {
          value: 6.95,
        },
        radius: {
          value: 55.15,
        },
        colorShift: {
          value: 7.11,
        },
        sides: {
          value: 7,
        },
        rotation: {
          value: 0.66,
        },
        sinMul: {
          value: 0,
        },
        cosMul: {
          value: 1.09,
        },
        yMul: {
          value: 0,
        },
        xMul: {
          value: 0.26,
        },
        xSpeed: {
          value: -1,
        },
        ySpeed: {
          value: 1,
        },
        gloop: {
          value: 0.0022,
        },
        yDivide: {
          value: 3.33,
        },
        xDivide: {
          value: 3.33,
        },
        mirror: {
          value: false,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 45.\n\nvoid main() {\n  float stream = stream / 3.67950;\n  vec2 uv = k_uv();\n\n  uv *= zoom;\n\n  // uv = abs(uv);\n  uv *= k_rotate2d(stream/8.);\n  gl_FragColor = vec4(0);\n  float dist = length(uv);\n  for (float i = 30.; i < BALLS; i++) {\n    // uv *= k_rotate2d(rotation * PI /1.);\n    uv.y -= float(i) / 12. * cos(uv.y / yDiv + stream / 1.) + sin(uv.x / xDiv2 - stream / 1.);\n    uv.x -= float(i) / 15. * sin(uv.x / xDiv + stream / 1.) - cos(uv.y / yDiv2 + stream / 1.);\n    float t = 1.1 * i * PI / BALLS * (5. + 1.);\n    float _multiplier = dist / multiplier * sin(uv.x - stream / 1.);\n    vec2 p = radius * vec2(xMul * tan(t + stream / 2.), yMul * sin(t / multiplier + stream / 1.));\n    p /= cos(PI * sin(uv.x / xDiv3 + stream / 1.) * sin(uv.y / yDiv3 - stream / 1.));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (5. - float(i) / PI)) * 0.5 + 0.5;\n    gl_FragColor += vec4(ballSize * pow(volume, .86)/3. / length(uv - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 248.939,
        },
        xDiv: {
          value: 322.096,
        },
        yDiv: {
          value: 486.62,
        },
        xDiv2: {
          value: 80.919,
        },
        yDiv2: {
          value: 116.964,
        },
        xDiv3: {
          value: 26.013,
        },
        yDiv3: {
          value: 26.786,
        },
        multiplier: {
          value: 5.982,
        },
        ballSize: {
          value: 52.287,
        },
        contrast: {
          value: 1.688,
        },
        radius: {
          value: 26.877,
        },
        rotation: {
          value: 0,
        },
        xMul: {
          value: 3.482,
        },
        yMul: {
          value: 4.196,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define orbs 10.\n\nvoid main() {\n  float stream = stream / 17.;\n  vec2 uv = k_uv();\n  uv *= zoom;\n  // gl_FragColor = vec4(0);\n  // float dist = length(uv);\n  uv *= k_rotate2d(stream / 1.28);\n  // uv /= dot(uv, uv);\n  // uv *= log(abs(uv));\n  // uv = normalize(uv) * length((uv));\n  vec2 _uv = uv;\n  uv *= (outer + outer2*sin(woot*cos(_uv.x/div2 + stream / .25) * _uv.y/div - stream/-1.18));\n  // uv= .5*tan(uv.y/300. - stream/.8);\n  for (float i = 0.; i < orbs; i++) {\n    uv *= k_rotate2d(rotation * PI);\n    float t = float(i) * PI / float(orbs) * (2. + 1.);\n    vec2 p = vec2(radius*wat*tan(stream/31.3 - t*PI), radius*tan(t - stream/-33.8));\n    p /= (cos(wad * cos(stream/.27 - uv.x/xx))*sin(stream/-.29- uv.y/(.9*yy + .6*yy*sin(stream/.23))));\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (.9 * float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(colorOffset*float(i)*ballSize / length(uv  - p * 0.9) * col, contrast);\n  }\n  gl_FragColor.xyz = 1.-pow(abs(1.-log(abs(gl_FragColor.xyz))), vec3(contrast));\n  gl_FragColor.w = 1.0;\n}",
    variants: [
      {
        zoom: {
          value: 419328.267,
        },
        ballSize: {
          value: 9569.469,
        },
        contrast: {
          value: 2.176,
        },
        radius: {
          value: 3832855.202,
        },
        mirror: {
          value: false,
        },
        xx: {
          value: 129670504.048,
        },
        yy: {
          value: 6535949.534,
        },
        rotation: {
          value: 0.006,
        },
        colorOffset: {
          value: 451.118,
        },
        sides: {
          value: 3.5,
        },
        kaleidoscope: {
          value: false,
        },
        div: {
          value: 37429.995,
        },
        div2: {
          value: 500328.954,
        },
        wad: {
          value: 1.945,
        },
        woot: {
          value: 0.132,
        },
        wat: {
          value: 0.232,
        },
        wob: {
          value: 39.916,
        },
        outer: {
          value: 133,
        },
        outer2: {
          value: 65.295,
        },
        wave: {
          value: 1.181,
        },
        aWave: {
          value: 0.28,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "void main() {\n    vec2 uv = k_uv();\n    uv *=  zoom;//(zoom * cos(stream/5000.) + zoom);\n    vec2 frac = abs(fract(uv) - .5) * 1.;\n  \n    uv *= k_rotate2d(stream/-3.);\n  \n    float dist = distance(uv, vec2(0.));\n    vec2 rotated = uv * k_rotate2d(dist/210. * stream/22.);\n    vec2 rotated2 = uv * k_rotate2d(dist/100. + stream/4.);// * sin(uv.x) * cos(uv.y);\n    uv *= k_rotate2d(stream/2.);\n    uv = mix(rotated, rotated2, cos(dist - stream/5.5));\n    uv = k_kale(uv, vec2(0), sides);\n\n    // uv /= atan(dot(uv, uv));\n    vec4 result = vec4(0, 0, 0, 1);\n    float t = 0.;\n    float base = 1. * atan(length(uv));\n    for (int p = 0; p < 3; p++) {\n        uv *= k_rotate2d(stream/15.);\n      float a = dist*cos((t * base) );\n      float b = cos(lines * uv.x / + dist);\n      result[p] = pMul * a + bMul  * b + base / 2.;\n      t += offset;\n    }\n    float col =  k_hue(result.xyxy, stream / 2.).g;\n    result.xyz *= brightness * result.x;\n    gl_FragColor =  2.-log(1.-abs(result)); \n    gl_FragColor.r *= red;\n    gl_FragColor.g *= green;\n    gl_FragColor.b *= blue;\n    gl_FragColor = k_hue(gl_FragColor, stream/1. - dist/4.); \n  }",
    variants: [
      {
        zoom: {
          value: 0.724369,
        },
        brightness: {
          value: 4,
        },
        red: {
          value: 0.219879,
        },
        green: {
          value: 0.2,
        },
        blue: {
          value: 0.25,
        },
        sides: {
          value: 1,
        },
        offset: {
          value: 1,
        },
        lines: {
          value: 7.685157,
        },
        ySpread: {
          value: 78.74546,
        },
        pMul: {
          value: 2.395309,
        },
        bMul: {
          value: 2.943299,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "void main() {\nfloat stream = stream / 1.5; vec2 uv = k_uv();\nuv *= zoom;\nuv *= k_rotate2d(stream /-10.);\nvec2 _uv = uv;\nmat2 rotation = k_rotate2d(stream/ (PI*6.));\nfor (float i = 0.; i < 5.; i++) {\n  uv *= rotation;\n  uv = abs(uv) * iterator;\n  vec3 col = k_rainbow(i / iterations, colorShift, colorOffset);\n  gl_FragColor += k_orb(uv, pow(volume, 1.) * orbSize, vec2(radius*abs(cos(stream/-.8+uv.x/div)) * LL * sin(stream/.7 - uv.y), radius*cos(stream/.7+uv.y/div)),  col, contrast);\n}\n  uv = _uv;\n  uv *= zoom / 50.;\n  uv *= (wob / dot(uv, uv));\n  uv *= k_rotate2d(stream/-4.);\n  float dist = length(sin(cos(uv+stream/1.)));\n  for (float i = 10.; i < 20.; i++) {\n    uv.x *= tan(dist+.0001* dist*(i) * (uv.x));\n    float t = (i+1.) * PI / 10. * PI * 1.5;\n    float x = radius * tan(t - stream/10.);//* cos(t-stream/1.) / sin(t);\n    float y = radius * sin(t + stream/30.);// / sin(t-stream/1.) / cos(t);\n    vec2 position = vec2(x, y);\n    vec3 color = cos(vec3(-2, 0, -1) * PI * 2. / 3. + PI * (float(i-i*PI) / colorShift)) * 0.5 + 0.5;\n    gl_FragColor += k_orb(uv, pow(volume, .5) + volume + pow(volume,1.5) * orbSize, position, color, contrast);\n  }\ngl_FragColor.g *= .2;\n  }",
    variants: [
      {
        zoom: {
          value: 0.6347062999362257,
        },
        iterator: {
          value: 9.545699904913453,
        },
        ot: {
          value: 63.45670382482259,
        },
        II: {
          value: 2.004611658162746,
        },
        JJ: {
          value: 0.9292826277731768,
        },
        KK: {
          value: 1.7887850816908168,
        },
        iterations: {
          value: 0.485278,
        },
        LL: {
          value: 1.1279381425603259,
        },
        MM: {
          value: 0.43865731802863905,
        },
        colorShift: {
          value: 1.2714860957637544,
        },
        colorOffset: {
          value: 4.816923703081921,
        },
        contrast: {
          value: 2.172935900983824,
        },
        orbSize: {
          value: 1.3638092748249202,
        },
        div: {
          value: 0.18712700275218697,
        },
        radius: {
          value: 4.478964174125304,
        },
        wob: {
          value: 0.027189022299892483,
        },
      },
      {
        zoom: {
          value: 0.252383,
        },
        iterator: {
          value: 7.569259349233938,
        },
        ot: {
          value: 77.22702061398316,
        },
        II: {
          value: 2.5421969305949066,
        },
        JJ: {
          value: 2.3204582724811766,
        },
        KK: {
          value: 10.66774605644863,
        },
        iterations: {
          value: 0.485278,
        },
        LL: {
          value: 2.4078496791886295,
        },
        MM: {
          value: 0.49353160809578367,
        },
        colorShift: {
          value: 1.2714860957637544,
        },
        colorOffset: {
          value: 5.7879599494522385,
        },
        contrast: {
          value: 1.72852776965142,
        },
        orbSize: {
          value: 2,
        },
        div: {
          value: 0.08027884559708552,
        },
        radius: {
          value: 3.306594,
        },
        wob: {
          value: 0.09822452407689686,
        },
      },
      {
        zoom: {
          value: 0.5518645466466255,
        },
        iterator: {
          value: 9.345306061754322,
        },
        ot: {
          value: 76.95672847031916,
        },
        II: {
          value: 2.0299764684706196,
        },
        JJ: {
          value: 0.5775865735935444,
        },
        KK: {
          value: 4.5782725349372235,
        },
        iterations: {
          value: 0.485278,
        },
        LL: {
          value: 2.5327226221179027,
        },
        MM: {
          value: 0.9855923008127525,
        },
        colorShift: {
          value: 1.2714860957637544,
        },
        colorOffset: {
          value: 7.124793907730577,
        },
        contrast: {
          value: 1.8673261085401902,
        },
        orbSize: {
          value: 1.6922743948115222,
        },
        div: {
          value: 0.06848968434306733,
        },
        radius: {
          value: 3.145716,
        },
        wob: {
          value: 0.003,
        },
      },
      {
        zoom: {
          value: 0.380322,
        },
        iterator: {
          value: 9.218471677489154,
        },
        ot: {
          value: 131.63249519716393,
        },
        II: {
          value: 1.3802125534214826,
        },
        JJ: {
          value: 1.395041179704047,
        },
        KK: {
          value: 2.951226237343881,
        },
        iterations: {
          value: 0.485278,
        },
        LL: {
          value: 2.974272682393624,
        },
        MM: {
          value: 0.8482203936410846,
        },
        colorShift: {
          value: 1.2714860957637544,
        },
        colorOffset: {
          value: 8.985077800486769,
        },
        contrast: {
          value: 1.87270215686231,
        },
        orbSize: {
          value: 0.8984214901639822,
        },
        div: {
          value: 0.07098858854079364,
        },
        radius: {
          value: 7.968495755292857,
        },
        wob: {
          value: 0.012046381298866725,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
  {
    shader:
      "#define BALLS 15\n\nvec2 kale(vec2 uv, vec2 offset, float splits) {\n  float angle = atan(uv.y, uv.x);\n  angle = ((angle / PI) + 1.0) * 0.5;\n  angle = mod(angle, 1.0 / splits) * splits;\n  angle = -abs(2.0 * angle - 1.0) + 1.0;\n  angle = angle;\n  float y = length(uv);\n  angle = angle * (y);\n  return vec2(angle, y) - offset;\n} \nmat2 rotate2d(float _angle){\n  return mat2(\n    cos(_angle),\n    -sin(_angle), \n    sin(_angle), \n    cos(_angle)\n  );\n}\n\nfloat stepping(float t) {\n  if (t < 0.) return -1. + pow(1. + t, 2.);\n  else return 1. - pow(1. - t, 2.);\n}\nvoid main() {\n  vec2 uv = k_uv().xy;\n  gl_FragColor = vec4(0);\n  uv = normalize(uv) * length(uv);\n  vec2 uv2 = uv * zoom/5.;\n  vec2 uv3 = uv * zoom/15.;\n  uv = mix(uv2, uv3, abs(.1*sin(time/200.)));\n  float dist = distance(uv, vec2(0));\n  float thing = dist * .001*sin(shapeMultiplier*dot(uv2, uv3)/dist - stream/30.);\n\tif (warpTween) {\n   \tif (warp) {\n    \tuv = mix(uv, uv * uv, float(warpTweenProgress));\n    } else {\n      uv = mix(uv * uv, uv, float(warpTweenProgress));\n    }\n  } else if (warp) {\n    uv = uv * uv;\n  }\n  vec2 _kale = kale(uv, vec2(0.), sides);\n  if (kaleidoscopeTween) {\n   \tif (kaleidoscope) {\n    \tuv = mix(uv, _kale, float(kaleidoscopeTweenProgress));\n    } else {\n      uv = mix(_kale, uv, float(kaleidoscopeTweenProgress));\n    } \n  } else if (kaleidoscope) {\n    uv = kale(uv, vec2(0.), sides);\n  }\n  uv *= rotate2d(rotation * (dist - stream/200.));\n  float _grid = (cos(uv.x * xMultiplier - stream/20.) - sin(uv.y * yMultiplier + stream/15.));\n  uv /= colorSpread * thing  * _grid;\n  uv*=dist;\n  for (int i = 0; i < BALLS; i++) {\n    float t = float(i) * PI / float(BALLS);\n    vec2 p = vec2(sin(t), cos(t));\n    p += cos(stream/3001. + float(i) * PI);\n    vec3 col = cos(vec3(0, 1, -1) * PI * 2. / 3. + PI * (stream / 229. + float(i) / 5.)) * 0.5 + 0.5;\n    gl_FragColor += vec4(ballSize  / length(uv + p * colorMultiplier) * col, 1.0);\n  }\n  gl_FragColor.xyz = glow * brightness * pow(gl_FragColor.xyz, vec3(contrast));\n  gl_FragColor.w = 1.0;\n  if (invert) gl_FragColor = 1. - gl_FragColor;\n}",
    variants: [
      {
        zoom: {
          value: 3.21,
        },
        xMultiplier: {
          value: 49.77,
        },
        yMultiplier: {
          value: 0,
        },
        ballSize: {
          value: 1.37,
        },
        colorSpread: {
          value: 1.21,
        },
        colorMultiplier: {
          value: 500,
        },
        shapeMultiplier: {
          value: 17.27,
        },
        glow: {
          value: 2080.32,
        },
        contrast: {
          value: 4.53,
        },
        rotation: {
          value: 5,
        },
        brightness: {
          value: 6430.09,
        },
        sides: {
          value: 9,
        },
        warp: {
          value: false,
        },
        kaleidoscope: {
          value: false,
        },
        invert: {
          value: false,
        },
      },
      {
        zoom: {
          value: 1.1,
        },
        xMultiplier: {
          value: 200,
        },
        yMultiplier: {
          value: 167.38,
        },
        ballSize: {
          value: 0.6,
        },
        colorSpread: {
          value: 0.27,
        },
        colorMultiplier: {
          value: 256.75,
        },
        shapeMultiplier: {
          value: 65.06,
        },
        glow: {
          value: 8509.81,
        },
        contrast: {
          value: 4.52,
        },
        rotation: {
          value: 5,
        },
        brightness: {
          value: 5636,
        },
        sides: {
          value: 10,
        },
        warp: {
          value: false,
        },
        kaleidoscope: {
          value: false,
        },
        invert: {
          value: false,
        },
      },
      {
        zoom: {
          value: 1.09,
        },
        xMultiplier: {
          value: 63.13,
        },
        yMultiplier: {
          value: 77.92,
        },
        ballSize: {
          value: 0.52,
        },
        colorSpread: {
          value: 1.71,
        },
        colorMultiplier: {
          value: 256.75,
        },
        shapeMultiplier: {
          value: 65.06,
        },
        glow: {
          value: 8509.81,
        },
        contrast: {
          value: 4.52,
        },
        rotation: {
          value: 5,
        },
        brightness: {
          value: 5636,
        },
        sides: {
          value: 10,
        },
        warp: {
          value: false,
        },
        kaleidoscope: {
          value: false,
        },
        invert: {
          value: false,
        },
      },
      {
        zoom: {
          value: 0.45,
        },
        xMultiplier: {
          value: 24.23,
        },
        yMultiplier: {
          value: 13.15,
        },
        ballSize: {
          value: 0.6,
        },
        colorSpread: {
          value: 1.71,
        },
        colorMultiplier: {
          value: 256.75,
        },
        shapeMultiplier: {
          value: 65.06,
        },
        glow: {
          value: 8509.81,
        },
        contrast: {
          value: 4.52,
        },
        rotation: {
          value: 5,
        },
        brightness: {
          value: 5636,
        },
        sides: {
          value: 10,
        },
        warp: {
          value: false,
        },
        kaleidoscope: {
          value: false,
        },
        invert: {
          value: false,
        },
      },
    ],
    walletAddress: "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT",
    isPublic: true,
  },
]);

type SelectionMethod = "pointer" | "keyboard" | "internal";

export const useSketches = defineStore("sketches", () => {
  const raf = useRAF();
  const sketch = shallowRef<Sketch | null>(null);
  const activeSketchId = computed(() => sketch.value?.id || null);

  // Local hardcoded sketches - no more API calls!
  const iterations = ref<Sketch[]>(sketchesData as Sketch[]);
  const loading = ref(false);
  const error = ref(null);
  const index = computed(() => {
    if (!sketch.value) return -1;
    return iterations.value.findIndex((s) => s.shader === sketch.value!.shader);
  });
  const shader = ref();
  const uniforms = ref<Variant>({});
  const variant = ref(0);
  const shuffleVariants = ref(false);
  const variantShuffleInterval = ref<any>(null);
  const keyboardIndex = ref(0);
  const sketchSelectionMethod = ref<SelectionMethod>("pointer");
  const tweening = ref(false);
  const shaderError = ref<any>(null);
  const magicInterval = ref<any>(null);
  const uniformKeys = computed(() => Object.keys(uniforms.value || {})); // ['zoom', 'rotation', 'invert']
  const uniformKeysSerialized = computed(() => uniformKeys.value.join(",")); // 'zoom,rotation,true'
  const uniformValues = computed(() => uniformKeys.value.map((v: string) => (uniforms.value as any)?.[v]?.value)); // [1.231, 12.212, true]
  const uniformValuesSerialized = computed(() => uniformValues.value.join(",")); // '1.231,12.212,true'
  const activeVariant = computed(() => clone(sketch?.value?.variants?.[variant.value] || {}));
  const activeVariantKeys = computed(() => Object.keys(activeVariant.value)); // ['zoom', 'rotation', 'invert']
  const activeVariantKeysSerialized = computed(() => activeVariantKeys.value.join(",")); //  'zoom,rotation,true'
  const activeVariantValues = computed(() => activeVariantKeys.value.map((v) => activeVariant.value[v]?.value)); // [1.231, 12.212, true]
  const activeVariantValuesSerialized = computed(() => activeVariantValues.value.join(",")); // '1.231,12.212,true'
  const uniformKeysDirty = computed(() => uniformKeysSerialized.value !== activeVariantKeysSerialized.value);
  const uniformValuesDirty = computed(() => uniformValuesSerialized.value !== activeVariantValuesSerialized.value);
  const uniformsDirty = computed(() => uniformKeysDirty.value || uniformValuesDirty.value);
  const shaderDirty = computed(() => shader.value !== sketch.value?.shader);
  const isDirty = computed(() => uniformsDirty.value || shaderDirty.value);
  const canAddVariant = computed(() => !tweening.value && uniformValuesDirty.value);

  watch(
    () => shuffleVariants.value,
    (val) => {
      clearInterval(variantShuffleInterval.value);
      if (!val) return;
      variantShuffleInterval.value = setInterval(selectNextVariant, 3050);
    },
    {
      immediate: true,
    }
  );

  // Watch iterations and auto-select a random sketch when sketches are loaded
  watch(
    () => iterations.value,
    (newIterations) => {
      if (newIterations.length > 0 && !sketch?.value) {
        console.log(`🎲 Auto-selecting random sketch from ${newIterations.length} loaded sketches`);
        sampleSketches();
      }
    },
    {
      immediate: true,
    }
  );

  function selectSketch(value: Sketch, method: SelectionMethod = "pointer", internal: any = null) {
    if (!value) return;

    const currentId = sketch.value?.id;

    raf.remove("variant");

    sketchSelectionMethod.value = method;
    tweening.value = false;
    sketch.value = clone(value);
    shader.value = value.shader;

    if (currentId !== value.id && internal === null) {
      variant.value = 0;
      keyboardIndex.value = 0;
    } else {
      variant.value = value.variants.length - 1;
    }

    uniforms.value = clone(value.variants[variant.value]);
  }

  function selectVariant(i: number) {
    if (!sketch.value) return;
    variant.value = i;
    tweenTo(sketch.value.variants[i]);
  }

  function tweenVariant(from: Variant, to: Variant, duration = shuffleVariants.value ? 2500 : 1000) {
    const iVariant = buildVariantInterpolator(clone(from), clone(to));

    tweening.value = true;

    raf.add(
      (now, progress) => {
        const next = iVariant(progress);
        uniformKeys.value.forEach((key) => {
          uniforms.value[key].value = next[key].value;
        });

        if (progress === 1) tweening.value = false;
      },
      {
        duration,
        id: "variant",
      }
    );
  }

  function tweenTo(values: Variant, duration = shuffleVariants.value ? 2500 : 1000) {
    tweenVariant(uniforms.value, values, duration);
  }

  function sampleSketches() {
    selectSketch(sample(iterations.value) as any);
  }

  function selectSketchByIndex(i: number, method: SelectionMethod = "pointer") {
    selectSketch(iterations.value[i], method);
  }

  function selectPreviousSketch(method: SelectionMethod = "pointer") {
    const last = iterations.value.length - 1;
    const target = index.value - 1;
    if (target === -1) return selectSketchByIndex(last, method);
    selectSketchByIndex(target, method);
  }

  function selectNextSketch(method: SelectionMethod = "pointer") {
    const last = iterations.value.length - 1;
    const target = index.value + 1;
    if (target > last) return selectSketchByIndex(0, method);
    selectSketchByIndex(target, method);
  }

  function addUniform(e: AddUniformProps) {
    if (!sketch.value) return;
    const cloned = addUniformToSketch(sketch, e) as Sketch;
    cloned.shader = patchUniformValueWithName(shader, e);
    selectSketch(cloned, "internal");
  }

  function addVariant() {
    if (!sketch.value) return;
    const cloned = clone(sketch.value);
    cloned.variants.push(clone(uniforms.value));
    selectSketch(cloned, "internal");
  }

  function selectNextVariant() {
    if (!sketch.value) return;
    const len = sketch.value?.variants.length;
    if (variant.value + 1 === len) return selectVariant(0);
    selectVariant(variant.value + 1);
  }

  function toggleShuffleVariants() {
    shuffleVariants.value = !shuffleVariants.value;
  }

  function magicTween(duration = 500, temp = 0.7) {
    if (!sketch.value) return;
    const source = sketch.value.variants[variant.value];
    tweenTo(generateVariant(source, temp), duration);
  }

  function startMagicInterval() {
    clearInterval(magicInterval.value);
    magicInterval.value = setInterval(() => {
      magicTween(3000, 0.25);
    }, 3100);
  }

  function stopMagicInterval() {
    clearInterval(magicInterval.value);
  }

  /**
   * Reset sketches store state (called on logout)
   */
  function reset() {
    console.log("🎨 Resetting sketches store state");

    // Stop all intervals
    clearInterval(variantShuffleInterval.value);
    clearInterval(magicInterval.value);

    // Reset interval refs
    variantShuffleInterval.value = null;
    magicInterval.value = null;
  }

  return {
    sampleSketches,
    variant,
    sketch,
    activeSketchId,
    shader,
    uniforms,
    shuffleVariants,
    index,
    selectSketchByIndex,
    selectPreviousSketch,
    selectNextSketch,
    selectVariant,
    tweening,
    toggleShuffleVariants,
    sketchSelectionMethod,
    addVariant,
    addUniform,
    uniformValues,
    shaderDirty,
    isDirty,
    uniformKeys,
    uniformKeysSerialized,
    uniformValuesSerialized,
    uniformValuesDirty,
    activeVariantKeys,
    activeVariantKeysSerialized,
    activeVariantValues,
    activeVariantValuesSerialized,
    keyboardIndex,
    selectSketch,
    iterations,
    loading, // Loading state for ShaderTom sketches
    error, // Error state for ShaderTom sketches
    shaderError,
    magicTween,
    tweenTo,
    activeVariant,
    startMagicInterval,
    stopMagicInterval,
    canAddVariant,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSketches, import.meta.hot));
}
