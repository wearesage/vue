import { keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, dropCursor } from "@codemirror/view";
import { lintGutter, setDiagnostics } from "@codemirror/lint";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { bracketMatching, indentOnInput, LanguageSupport, syntaxTree } from "@codemirror/language";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { EditorView } from "@codemirror/view";
import { highlightWhitespace } from "@codemirror/view";
import { preserveTabsConfig, createTabHighlighter } from "./tabs";
import { uniformCompletionSource, uniformKeysState, createUniformHighlighter, updateEditorUniformKeys } from "./uniforms";
import { glslLanguage, glslTheme, createGLSLHighlighter } from "./glsl";
import { createCommentLineHighlighter } from "./comments";

export interface ClickValuePayload {
  value: string;
  type: "number" | "uniform" | "identifier";
  range: [number, number];
  click: { x: number; y: number };
}

export interface ErrorObject {
  message: string;
  line?: number;
  severity?: "error" | "warning" | "info";
}

export type OnClickValueHandler = (payload: ClickValuePayload) => void;
export type UpdateHandler = (update: any) => void;

export function buildExtensions(uniformKeys: string[], onClickValue: OnClickValueHandler | null, update: UpdateHandler) {
  function click(event: MouseEvent, view: EditorView): boolean {
    if (!onClickValue) return false;

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });

    if (!pos) return false;

    const tree = syntaxTree(view.state);
    const node = tree.resolveInner(pos);
    const nodeText = view.state.doc.sliceString(node.from, node.to);
    const nodeType = node.type.name;

    if (nodeType === "Number" || /^\d*\.?\d+f?$/.test(nodeText)) {
      onClickValue({
        value: nodeText,
        type: "number",
        range: [node.from, node.to],
        click: { x: event.clientX, y: event.clientY },
      });

      return true;
    }

    if (nodeType === "VariableName" || nodeType === "Identifier") {
      onClickValue({
        value: nodeText,
        type: uniformKeys.includes(nodeText) ? "uniform" : "identifier",
        range: [node.from, node.to],
        click: { x: event.clientX, y: event.clientY },
      });

      return true;
    }

    return false;
  }

  const extensions = [
    lineNumbers(),
    history(),
    bracketMatching(),
    lintGutter(),
    preserveTabsConfig,
    highlightActiveLine(),
    highlightActiveLineGutter(),
    dropCursor(),
    closeBrackets(),
    indentOnInput(),
    highlightWhitespace(),
    createTabHighlighter(),
    autocompletion({
      override: [uniformCompletionSource(uniformKeys)],
    }),
    new LanguageSupport(glslLanguage),
    glslTheme,
    uniformKeysState,
    createUniformHighlighter(),
    createGLSLHighlighter(),
    createCommentLineHighlighter(),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.updateListener.of(update),
    EditorView.domEventHandlers({ click }),
  ];

  return extensions;
}

export interface ShaderEditorConfig {
  target: HTMLElement;
  shader?: string;
  uniformKeys?: string[];
  onClick?: OnClickValueHandler;
  onUpdate?: UpdateHandler;
}

export default class ShaderEditor {
  private editor: EditorView;
  private target: HTMLElement;
  private uniformKeys: string[];
  private onClickHandler: OnClickValueHandler | null;
  private onUpdateHandler: UpdateHandler | null;

  constructor(config: ShaderEditorConfig) {
    this.target = config.target;
    this.uniformKeys = config.uniformKeys || [];
    this.onClickHandler = config.onClick || null;
    this.onUpdateHandler = config.onUpdate || null;

    this.editor = new EditorView({
      parent: this.target,
      doc: config.shader || "",
      extensions: buildExtensions(this.uniformKeys, this.onClickHandler, this.onUpdateHandler || (() => {})),
    });
  }

  // Update the shader content
  setShader(shader: string) {
    this.editor.dispatch({
      changes: {
        from: 0,
        to: this.editor.state.doc.length,
        insert: shader,
      },
    });
  }

  // Get current shader content
  getShader(): string {
    return this.editor.state.doc.toString();
  }

  // Update uniform keys and refresh editor extensions
  setUniformKeys(uniformKeys: string[]) {
    this.uniformKeys = uniformKeys;
    updateEditorUniformKeys(this.editor, uniformKeys);
  }

  // Get current uniform keys
  getUniformKeys(): string[] {
    return this.uniformKeys;
  }

  // Set error diagnostics
  setErrors(errors: ErrorObject[]) {
    const diagnostics = this.createDiagnostics(errors);
    this.editor.dispatch(setDiagnostics(this.editor.state, diagnostics));
  }

  // Clear all error diagnostics  
  clearErrors() {
    this.editor.dispatch(setDiagnostics(this.editor.state, []));
  }

  // Focus the editor
  focus() {
    this.editor.focus();
  }

  // Get the EditorView instance (for advanced usage)
  getEditorView(): EditorView {
    return this.editor;
  }

  // Destroy the editor
  destroy() {
    this.editor?.destroy?.();
  }

  // Convert error objects to CodeMirror diagnostics
  private createDiagnostics(errors: ErrorObject[]) {
    return errors.map((error) => {
      const line = Math.max(1, error.line || 1);
      const lineInfo = this.editor.state.doc.line(Math.min(line, this.editor.state.doc.lines));
      
      return {
        from: lineInfo.from,
        to: lineInfo.to,
        severity: error.severity || "error",
        message: error.message,
      };
    });
  }
}
