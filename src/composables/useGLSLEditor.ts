import { ref, watch, onMounted, onUnmounted, type Ref } from "vue";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, dropCursor } from "@codemirror/view";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { bracketMatching, indentOnInput, LanguageSupport, LRLanguage, delimitedIndent, indentNodeProp, continuedIndent, foldInside, foldNodeProp } from "@codemirror/language";
import { parser as glslParser } from "lezer-glsl";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import * as themes from "thememirror";
import * as glslUtils from "../constants/glsl-util";
import { TYPES, KEYWORDS, MATH } from "../constants/glsl-lang";

export function useGLSLEditor(
  parentDOMElement: Ref<HTMLElement>,
  refs: {
    shader: Ref<string>;
    uniforms: Ref<any>;
  },
  onUpdate: any
) {
  const editor = ref<EditorView | null>(null);
  const localState = ref(refs.shader.value);
  const uniformKeys = ref(Object.keys(refs.uniforms.value || {}));

  function uniformCompletionSource(context: any) {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return {
      from: word.from,
      options: [
        ...[...["resolution", "volume", "stream", "time"], ...TYPES, ...KEYWORDS, ...MATH, ...uniformKeys.value].map((key) => ({
          label: key,
          type: "variable",
        })),
        ...Object.keys(glslUtils).map((key) => ({
          label: key,
          type: "function",
        })),
      ],
    };
  }

  const parser = glslParser.configure({
    props: [
      indentNodeProp.add({
        IfStatement: continuedIndent({ except: /^\s*({|else\b)/ }),
        CaseStatement: (context) => context.baseIndent + context.unit,
        BlockComment: () => null,
        CompoundStatement: delimitedIndent({ closing: "}" }),
        Statement: continuedIndent({ except: /^{/ }),
      }),
      foldNodeProp.add({
        "StructDeclarationList CompoundStatement": foldInside,
        BlockComment(tree) {
          return { from: tree.from + 2, to: tree.to - 2 };
        },
      }),
    ],
  });

  const languageData = {
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
    indentOnInput: /^\s*(?:case |default:|\{|\})$/,
    closeBrackets: {
      stringPrefixes: ["L", "u", "U", "u8", "LR", "UR", "uR", "u8R", "R"],
    },
  };

  const glslLanguage = LRLanguage.define({
    name: "glsl",
    parser,
    languageData,
  });

  watch(
    () => [refs.shader.value, refs.uniforms.value],
    () => {
      const keys = Object.keys(refs.uniforms.value || {});
      if (refs.shader.value !== localState.value || uniformKeys.value.some((key, i) => key !== keys[i])) {
        init();
      }
    }
  );

  watch(
    () => refs.uniforms.value,
    (newValue) => {
      uniformKeys.value = Object.keys(newValue || {});
    },
    { immediate: true }
  );

  function init() {
    if (!parentDOMElement.value) return;

    const extensions = [
      lineNumbers(),
      history(),
      bracketMatching(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      closeBrackets(),
      dropCursor(),
      indentOnInput(),
      autocompletion({ override: [uniformCompletionSource] }),
      themes.dracula,
      new LanguageSupport(glslLanguage),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.updateListener.of(update),
    ];

    editor.value?.destroy?.();
    editor.value = new EditorView({
      parent: parentDOMElement.value,
      doc: refs.shader.value,
      extensions,
    });
  }

  function update(e: any) {
    const { state, docChanged } = e;
    if (!docChanged) return;
    localState.value = state.doc.toString();
    onUpdate(localState.value);
  }

  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    editor.value?.destroy?.();
  });

  return {
    editor,
  };
}
