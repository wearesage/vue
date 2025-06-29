export type InputType = "text" | "password" | "number" | "email" | "tel" | "url" | "search";

export interface BaseFormProps {
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  autofocus?: boolean;
}

export interface FormInputProps<T = string> extends BaseFormProps {
  modelValue: T;
}

export interface TextInputProps extends FormInputProps<string> {
  type?: InputType;
}

export interface NumberInputProps extends FormInputProps<number> {
  min?: number;
  max?: number;
  step?: number;
}

export interface RangeInputProps extends FormInputProps<number> {
  min?: number;
  max?: number;
  step?: number;
  showRanges?: boolean;
}

export interface ToggleProps extends FormInputProps<boolean> {
  // Toggle doesn't need placeholder or autofocus
  placeholder?: never;
  autofocus?: never;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends FormInputProps<string> {
  options: SelectOption[] | string[];
}

export interface ColorInputProps extends FormInputProps<string> {
  webgl?: boolean;
  // Color input doesn't use typical text input features
  placeholder?: never;
  autofocus?: never;
}

export const DEFAULT_FORM_PROPS: Partial<BaseFormProps> = {
  disabled: false,
  autofocus: false,
};