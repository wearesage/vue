import { type Ref } from "vue";
import { keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, dropCursor } from "@codemirror/view";
import { lintGutter } from "@codemirror/lint";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { bracketMatching, indentOnInput, LanguageSupport } from "@codemirror/language";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";
import { LRLanguage, syntaxHighlighting, HighlightStyle, syntaxTree } from "@codemirror/language";
import { parser as glslParser } from "lezer-glsl";
import * as glslUtils from "../constants/glsl-util";
import { TYPES, KEYWORDS, MATH } from "../constants/glsl-lang";
import { styleTags, tags } from "@lezer/highlight";
import { highlightWhitespace } from "@codemirror/view";

export const tabVisualizationField = StateField.define({
  create() {
    return null;
  },
  update(value, tr) {
    return value;
  },
});

const glslHighlighting = styleTags({
  PrimitiveType: tags.typeName,
  Identifier: tags.variableName,
  VariableName: tags.variableName,
  PreprocDirective: tags.meta,
  PreprocDirectiveName: tags.keyword,
  PreprocArg: tags.content,
  Number: tags.number,
  String: tags.string,
  LineComment: tags.lineComment,
  BlockComment: tags.blockComment,
  "( )": tags.paren,
  "[ ]": tags.squareBracket,
  "{ }": tags.brace,
  ";": tags.separator,
  ",": tags.separator,
  ArithOp: tags.arithmeticOperator,
  CompareOp: tags.compareOperator,
  UpdateOp: tags.updateOperator,
  BinaryExpression: tags.operator,
  AssignmentExpression: tags.definitionOperator,
  UpdateExpression: tags.updateOperator,
  UnaryExpression: tags.operator,
  ReturnStatement: tags.controlKeyword,
  IfStatement: tags.controlKeyword,
  ForStatement: tags.controlKeyword,
  WhileStatement: tags.controlKeyword,
  for: tags.controlKeyword,
  if: tags.controlKeyword,
  while: tags.controlKeyword,
  return: tags.controlKeyword,
  FieldExpression: tags.propertyName,
  FieldIdentifier: tags.propertyName,
});

const glslHighlightStyle = HighlightStyle.define([
  { tag: tags.typeName, class: "glsl-type" },
  { tag: tags.variableName, class: "glsl-variable" },
  { tag: tags.keyword, class: "glsl-keyword" },
  { tag: tags.controlKeyword, class: "glsl-control" },
  { tag: tags.number, class: "glsl-number" },
  { tag: tags.string, class: "glsl-string" },
  { tag: tags.lineComment, class: "glsl-comment" },
  { tag: tags.blockComment, class: "glsl-comment" },
  { tag: tags.meta, class: "glsl-preprocessor" },
  { tag: tags.content, class: "glsl-content" },
  { tag: tags.operator, class: "glsl-operator" },
  { tag: tags.arithmeticOperator, class: "glsl-arithmetic" },
  { tag: tags.updateOperator, class: "glsl-update" },
  { tag: tags.compareOperator, class: "glsl-compare" },
  { tag: tags.definitionOperator, class: "glsl-assignment" },
  { tag: tags.propertyName, class: "glsl-property" },
]);

const glslTheme = EditorView.theme({
  ".glsl-type": { color: "var(--purple)", fontWeight: "900" },
  ".glsl-variable": { color: "var(--white-60)" },
  ".glsl-definition": { color: "var(--blue)", fontWeight: "900" },
  ".glsl-keyword": { color: "var(--gray)" },
  ".glsl-control": { color: "var(--blue)", fontWeight: "900" },
  ".glsl-number": { color: "var(--blue)" },
  ".glsl-comment": { color: "var(--dark-gray)", fontStyle: "italic" },
  ".glsl-preprocessor": { color: "var(--purple-50)" },
  ".glsl-operator": { color: "var(--pink)" },
  ".glsl-arithmetic": { color: "var(--purple-80)" },
  ".glsl-update": { color: "var(--purple-80)" },
  ".glsl-compare": { color: "var(--purple-80)" },
  ".glsl-assignment": { color: "var(--purple-80)" },
  ".glsl-property": { color: "var(--yellow)" },
  ".glsl-content": { color: "var(--light-gray)" },

  // Uniform highlighting
  ".cm-uniform .glsl-variable": {
    color: "var(--pink)",
    borderRadius: "1rem",
    padding: "0 .5rem",
    fontSize: ".75rem",
    fontWeight: "900",
    border: "1px solid var(--pink-50)",
  },

  // Main function highlighting - SAME PATTERN AS UNIFORMS
  ".cm-main-function .glsl-variable": {
    color: "var(--white)",
    fontWeight: "bold",
    fontStyle: "italic",
  },

  // GL builtin variables highlighting - SAME PATTERN AS UNIFORMS
  ".cm-builtin .glsl-variable": {
    color: "var(--white)",
    fontWeight: "900",
    fontStyle: "italic",
  },

  ".cm-line": {
    width: "fit-content",
    marginLeft: "1rem",
    borderRadius: "1rem",
    paddingRight: ".5rem",
    fontSize: ".8rem",
    lineHeight: "1.2rem",
    fontFamily: `"Space Mono", monospace !important`,
    background: "var(--black)",
  },

  ".cm-line ": {
    color: "var(--blue)",
  },
  ".cm-line.cm-comment-line": {
    background: "linear-gradient(to right, var(--black-30),  var(--black-60))",
    borderColor: "transparent",
  },

  ".cm-line.cm-comment-line *": {
    color: "var(--white-70)",
  },

  // Empty line styling
  ".cm-line.cm-empty-line": {
    background: "transparent",
    minHeight: "1.2rem",
    borderStyle: "dashed",
    borderColor: "var(--white-10)",
  },

  ".cm-util-function .glsl-variable": {
    color: "var(--orange)",
    fontWeight: "900",
    borderBottom: `2px solid var(--pink)`,
  },

  ".cm-builtin-function .glsl-variable": {
    color: "var(--green)",
  },
  ".cm-editor": {
    outline: "none",
    background: "var(--black)",
  },
  ".cm-editor.cm-focused": {
    outline: "none",
  },
  ".cm-gutters": {
    background: "var(--black-30)",
    borderTopRightRadius: "1rem",
    borderBottomRightRadius: "1rem",
    color: "var(--white-40)",
    border: "none",
  },
  ".cm-gutters *": {
    background: "transparent !important",
    fontFamily: `"Space Mono", monospace !important`,
  },
});

export const customGLSLTheme = [glslTheme, syntaxHighlighting(glslHighlightStyle)];
export const updateUniformKeys = StateEffect.define<string[]>();
export const uniformKeysState = StateField.define<string[]>({
  create() {
    return [];
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(updateUniformKeys)) {
        return effect.value;
      }
    }
    return value;
  },
});

export function createUniformHighlighter() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        const stateChanged = update.state.field(uniformKeysState) !== update.startState.field(uniformKeysState);

        if (update.docChanged || update.viewportChanged || stateChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const decorations: any[] = [];
        const doc = view.state.doc.toString();

        let uniformKeys: string[];

        try {
          uniformKeys = view.state.field(uniformKeysState);
        } catch (e) {
          uniformKeys = [];
        }

        if (uniformKeys.length > 0) {
          const pattern = uniformKeys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
          const regex = new RegExp(`\\b(${pattern})\\b`, "g");
          let match;

          while ((match = regex.exec(doc)) !== null) {
            const decoration = Decoration.mark({
              class: "cm-uniform",
            }).range(match.index, match.index + match[0].length);

            decorations.push(decoration);
          }
        }

        return Decoration.set(decorations);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

// Comment line highlighter
export function createCommentLineHighlighter() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const decorations: any[] = [];
        const doc = view.state.doc;

        for (let i = 1; i <= doc.lines; i++) {
          const line = doc.line(i);
          const text = line.text.trim();

          // Check if line is empty - SAME PATTERN AS UNIFORMS
          if (text === "") {
            decorations.push(
              Decoration.line({
                class: "cm-empty-line",
              }).range(line.from)
            );
          }
          // Check if line starts with // or /* or is inside a block comment - SAME PATTERN AS UNIFORMS
          else if (text.startsWith("//") || text.startsWith("/*") || text.includes("*/")) {
            decorations.push(
              Decoration.line({
                class: "cm-comment-line",
              }).range(line.from)
            );
          }
        }

        // SORT decorations by position before creating the set - SAME PATTERN AS UNIFORMS
        decorations.sort((a, b) => a.from - b.from);

        return Decoration.set(decorations);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

// Enhanced GLSL highlighter using the same pattern as uniforms
export function createGLSLHighlighter() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const decorations: any[] = [];
        const doc = view.state.doc.toString();

        // 1. Highlight 'main' function specifically - SAME PATTERN AS UNIFORMS
        const mainRegex = /\bmain\b(?=\s*\()/g;
        let match;
        while ((match = mainRegex.exec(doc)) !== null) {
          decorations.push(
            Decoration.mark({
              class: "cm-main-function",
            }).range(match.index, match.index + match[0].length)
          );
        }

        // 2. Highlight gl_* built-in variables - SAME PATTERN AS UNIFORMS
        const glBuiltinRegex = /\bgl_\w+/g;
        while ((match = glBuiltinRegex.exec(doc)) !== null) {
          decorations.push(
            Decoration.mark({
              class: "cm-builtin",
            }).range(match.index, match.index + match[0].length)
          );
        }

        // 3. Highlight GLSL utility functions (k_* pattern) - SAME PATTERN AS UNIFORMS
        const utilFunctionRegex = /\bk_\w+/g;
        while ((match = utilFunctionRegex.exec(doc)) !== null) {
          decorations.push(
            Decoration.mark({
              class: "cm-util-function",
            }).range(match.index, match.index + match[0].length)
          );
        }

        // 4. Highlight common GLSL built-in functions - SAME PATTERN AS UNIFORMS
        const builtinFunctions = [
          "sin",
          "cos",
          "tan",
          "asin",
          "acos",
          "atan",
          "pow",
          "exp",
          "log",
          "sqrt",
          "abs",
          "sign",
          "floor",
          "ceil",
          "fract",
          "mod",
          "min",
          "max",
          "clamp",
          "mix",
          "step",
          "smoothstep",
          "length",
          "distance",
          "dot",
          "cross",
          "normalize",
          "reflect",
          "refract",
          "texture2D",
          "texture",
          "dFdx",
          "dFdy",
          "fwidth",
        ];

        const builtinPattern = builtinFunctions.map((fn) => fn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        const builtinFuncRegex = new RegExp(`\\b(${builtinPattern})\\b(?=\\s*\\()`, "g");
        while ((match = builtinFuncRegex.exec(doc)) !== null) {
          decorations.push(
            Decoration.mark({
              class: "cm-builtin-function",
            }).range(match.index, match.index + match[0].length)
          );
        }

        // SORT decorations by position before creating the set
        decorations.sort((a, b) => a.from - b.from);

        return Decoration.set(decorations);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

export function updateEditorUniformKeys(view: EditorView, uniformKeys: string[]) {
  console.log('🐱 updateEditorUniformKeys called with:', { 
    uniformKeys, 
    currentShaderContent: view.state.doc.toString().substring(0, 200) + '...' 
  });
  view.dispatch({
    effects: updateUniformKeys.of(uniformKeys),
  });
}

export const parser = glslParser.configure({
  props: [glslHighlighting],
});

export const languageData = {
  commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
  indentOnInput: /^\s*(?:case |default:|\{|\}|#)$/,
  closeBrackets: {
    stringPrefixes: [],
  },
};

export const glslLanguage = LRLanguage.define({
  name: "glsl",
  parser,
  languageData,
});

export function handleEditorClick(event: MouseEvent, view: EditorView, uniformKeys: any, onClickValue: any) {
  if (!onClickValue) return false;
  const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
  if (!pos) return false;
  const tree = syntaxTree(view.state);
  const node = tree.resolveInner(pos);
  const nodeText = view.state.doc.sliceString(node.from, node.to);
  const nodeType = node.type.name;

  // Debug logging for click events
  console.log('🐱 Click debug:', { 
    nodeText, 
    nodeType, 
    pos,
    nodeLength: nodeText.length,
    nodeTypeMatches: nodeType === "VariableName" || nodeType === "Identifier",
    uniformKeyCheck: uniformKeys.value.includes(nodeText),
    allUniformKeys: uniformKeys.value
  });

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
      type: uniformKeys.value.includes(nodeText) ? "uniform" : "identifier",
      range: [node.from, node.to],
      click: { x: event.clientX, y: event.clientY },
    });
    return true;
  }

  return false;
}

export const preserveTabsConfig = EditorView.contentAttributes.of({
  "tab-size": "4",
  "white-space": "pre",
});

export function uniformCompletionSource(uniformKeys: Ref<string[]>) {
  return (context: any) => {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const completions = [
      { label: "resolution", type: "variable", info: "Screen resolution" },
      { label: "time", type: "variable", info: "Time in seconds" },
      { label: "volume", type: "variable", info: "Audio volume" },
      { label: "stream", type: "variable", info: "Audio stream" },

      ...uniformKeys.value.map((key) => ({
        label: key,
        type: "variable",
        info: "Custom uniform",
      })),

      ...TYPES.map((type) => ({
        label: type,
        type: "type",
        info: `GLSL type: ${type}`,
      })),

      ...KEYWORDS.map((keyword) => ({
        label: keyword,
        type: "keyword",
        info: `GLSL keyword: ${keyword}`,
      })),

      ...MATH.map((func) => ({
        label: func,
        type: "function",
        info: `GLSL function: ${func}`,
      })),

      ...Object.keys(glslUtils).map((key) => ({
        label: key,
        type: "function",
        info: `Utility function: ${key}`,
      })),
    ];

    return {
      from: word.from,
      options: completions,
    };
  };
}

export function createTabHighlighter() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const decorations: any[] = [];
        const doc = view.state.doc.toString();

        // Find all tab characters
        let tabIndex = -1;
        while ((tabIndex = doc.indexOf("\t", tabIndex + 1)) !== -1) {
          // Create a widget decoration for each tab
          const widget = Decoration.widget({
            widget: new TabWidget(),
            side: 0,
          });
          decorations.push(widget.range(tabIndex));
        }

        return Decoration.set(decorations);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

class TabWidget {
  toDOM() {
    const span = document.createElement("span");
    span.textContent = "→";
    span.className = "cm-tab-marker";
    span.style.color = "var(--white-20)";
    span.style.opacity = "0.5";
    span.style.fontSize = "0.8em";
    span.style.display = "inline-block";
    span.style.width = "2ch";
    return span;
  }

  compare(other: TabWidget) {
    return other instanceof TabWidget;
  }
}

export function buildExtensions(uniformKeys: Ref<string[]>, onClickValue: any, update: any) {
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
    customGLSLTheme,
    uniformKeysState,
    createUniformHighlighter(),
    createGLSLHighlighter(),
    createCommentLineHighlighter(),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.updateListener.of(update),
    EditorView.domEventHandlers({
      click: (event, view) => {
        return handleEditorClick(event, view, uniformKeys, onClickValue);
      },
    }),
  ];

  return extensions;
}
