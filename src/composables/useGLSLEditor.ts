import { ref, watch, onMounted, type Ref } from "vue";
import { EditorView } from "@codemirror/view";
import { Diagnostic, setDiagnostics } from "@codemirror/lint";
import { buildExtensions, updateEditorUniformKeys } from "../util/codemirror";
import { EditorState } from "@codemirror/state";

export function useGLSLEditor(
  parentDOMElement: Ref<HTMLElement>,
  refs: {
    modelValue: Ref<string>;
    uniformKeys: Ref<string[]>;
    error: Ref<any>;
  },
  onUpdate: any,
  onClickValue?: (data: any) => void
): any {
  const editor = ref<EditorView | null>(null);
  const localState = ref(refs.modelValue.value);

  function init() {
    if (!parentDOMElement.value) return editor.value?.destroy?.();
    editor.value?.destroy?.();
    editor.value = new EditorView({
      parent: parentDOMElement.value,
      doc: refs.modelValue.value,
      extensions: buildExtensions(refs.uniformKeys, onClickValue, update),
    });
    if (editor.value) updateEditorUniformKeys(editor.value as any /* fuck you */, refs.uniformKeys.value);
  }

  function createDiagnostics() {
    if (!refs.error.value?.line || !refs.error.value?.message) return [];
    const { line, message, problem } = refs.error.value;
    const lineStart = editor.value?.state.doc.line(line)?.from || 0;
    const lineEnd = editor.value?.state.doc.line(line)?.to || lineStart;

    return [
      {
        from: lineStart,
        to: lineEnd,
        severity: "error",
        message: `${message}${problem ? ` (${problem})` : ""}`,
        source: "glsl",
      } as Diagnostic,
    ];
  }

  function update(e: any) {
    const { state, docChanged } = e;
    if (!docChanged) return;
    localState.value = state.doc.toString();
    onUpdate(localState.value);
  }

  watch(
    () => refs.error.value,
    () => {
      if (editor.value) {
        const diagnostics = createDiagnostics();
        editor.value.dispatch(setDiagnostics(editor.value.state as any /* fuck you */, diagnostics));
      }
    },
    { deep: true }
  );

  watch(
    () => refs.uniformKeys.value,
    (newUniformKeys) => {
      if (editor.value) {
        updateEditorUniformKeys(editor.value, newUniformKeys);
      }
    },
    { deep: true }
  );

  onMounted(() => {
    init();
  });

  return {
    editor,
  };
}
