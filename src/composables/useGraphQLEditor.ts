import { ref, watch, onMounted, type Ref } from "vue";
import { EditorView } from "codemirror";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, dropCursor } from "@codemirror/view";
import { graphql } from "cm6-graphql";
import * as themes from "thememirror";

export function useGraphQLEditor(parentDOMElement: Ref<HTMLElement | null>, rawQuery: Ref<string>, schema: Ref<any>) {
  const editor = ref<EditorView | null>(null);
  const initialized = ref(false);

  watch(
    () => schema.value,
    (val) => (val ? init() : null)
  );

  function update(val: any) {
    if (val.docChanged) {
      const value: string = val.state.doc.text.join("\n");
      rawQuery.value = value;
    }
  }

  function init() {
    if (initialized.value || !parentDOMElement.value || !schema.value) return;

    editor.value = new EditorView({
      doc: rawQuery.value,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        closeBrackets(),
        dropCursor(),
        indentOnInput(),
        autocompletion(),
        themes.amy,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of(update),
        graphql(schema.value),
      ],
      parent: parentDOMElement.value,
    });
    initialized.value = true;
  }

  onMounted(() => {
    if (!parentDOMElement.value || !schema.value) return;
    if (schema.value && !initialized.value) init();
  });

  return {
    editor,
  };
}
