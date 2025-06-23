export type UniformValue = number | boolean | number[];
export type Uniform = { value: UniformValue };
export type Variant = Record<string, Uniform>;

export type Sketch = {
  _id: string;
  shader: string;
  variants: Variant[];
};

export type SketchProps = {
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
  position?: [number, number, number];
  visible?: boolean;
  scale?: number;
  meshKey?: boolean;
};

export interface ShaderScrollProps extends Partial<SketchProps> {
  sketches: Sketch[];
  scrollY: number;
  visible?: boolean;
  shader?: string;
}

export type AddUniformProps = {
  type: string;
  value: string;
  name: string;
  range: [number, number];
};
