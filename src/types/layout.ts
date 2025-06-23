export type CSSUnit = "rem" | "px" | "%" | "em" | "vw" | "vh";

export type LayoutProps = {
  align?: string;
  justify?: string;
  cascade?: boolean;
  is?: string;
  center?: boolean;
  padding?: number | string | boolean;
  gap?: number | string | boolean;
  width?: number | string;
  height?: number | string;
  collapse?: boolean;
};

export const DEFAULT_LAYOUT_PROPS: LayoutProps = {
  is: "div",
  gap: 0,
  padding: 0,
  justify: "start",
  align: "start",
};
