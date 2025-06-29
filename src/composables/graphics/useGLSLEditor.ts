import { ref, watch, onMounted, onUnmounted, type Ref } from "vue";
import ShaderEditor, { type OnClickValueHandler, type ErrorObject } from "../../codemirror";

export interface GLSLEditorRefs {
  modelValue: Ref<string>;
  uniformKeys: Ref<string[]>;
  error: Ref<any>;
}

export function useGLSLEditor(
  parentDOMElement: Ref<HTMLElement | undefined>,
  refs: GLSLEditorRefs,
  onUpdate: (value: string) => void,
  onClickValue?: OnClickValueHandler
) {
  const editor = ref<ShaderEditor | null>(null);

  function init() {
    if (!parentDOMElement.value) return;

    // Destroy existing editor
    if (editor.value) {
      editor.value.destroy();
      editor.value = null;
    }

    // Create new editor instance
    editor.value = new ShaderEditor({
      target: parentDOMElement.value,
      shader: refs.modelValue.value,
      uniformKeys: refs.uniformKeys.value,
      onClick: onClickValue,
      onUpdate: (update) => {
        const { docChanged } = update;
        if (docChanged) {
          const newValue = editor.value?.getShader() || "";
          onUpdate(newValue);
        }
      },
    });
  }

  function destroy() {
    if (editor.value) {
      editor.value.destroy();
      editor.value = null;
    }
  }

  // Convert error object to ErrorObject format
  function convertError(error: any): ErrorObject | null {
    if (!error?.line || !error?.message) return null;

    return {
      message: `${error.message}${error.problem ? ` (${error.problem})` : ""}`,
      line: error.line,
      severity: "error",
    };
  }

  // Watch for error changes
  watch(
    () => refs.error.value,
    (newError) => {
      if (!editor.value) return;

      if (newError) {
        const errorObj = convertError(newError);
        if (errorObj) {
          editor.value.setErrors([errorObj]);
        }
      } else {
        editor.value.clearErrors();
      }
    },
    { deep: true }
  );

  // Watch for uniform key changes
  watch(
    () => refs.uniformKeys.value,
    (newUniformKeys) => {
      if (editor.value) {
        editor.value.setUniformKeys(newUniformKeys);
      }
    },
    { deep: true }
  );

  // Watch for shader content changes from outside
  watch(
    () => refs.modelValue.value,
    (newShader) => {
      if (editor.value && editor.value.getShader() !== newShader) {
        editor.value.setShader(newShader);
      }
    }
  );

  // Initialize on mount
  onMounted(() => {
    init();
  });

  return {
    editor,
    init,
    destroy,
  };
}
