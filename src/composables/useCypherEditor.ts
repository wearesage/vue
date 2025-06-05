import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { createCypherEditor, type EditorApi, type EditorOptions } from '@neo4j-cypher/codemirror';

export function useCypherEditor(
  parentDOMElement: Ref<HTMLElement | null>,
  options: EditorOptions = {}
) {
  const editor = ref<EditorApi | null>(null);
  const value = ref('');
  
  // Default options
  const defaultOptions: EditorOptions = {
    autocomplete: true,
    lineNumbers: true,
    cursorWide: true,
    bracketMatching: true,
    theme: 'dark',
    value: '',
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  onMounted(() => {
    if (!parentDOMElement.value) return;
    
    editor.value = createCypherEditor(parentDOMElement.value, mergedOptions);
    
    // Set up value syncing
    if (editor.value?.onValueChanged) {
      // Update local value when editor changes
      editor.value.onValueChanged((newValue) => {
        value.value = newValue;
      });
      
      // Initialize value
      value.value = mergedOptions.value || '';
    }
  });
  
  // Clean up on component unmount
  onBeforeUnmount(() => {
    if (editor.value) {
      editor.value.destroy();
      editor.value = null;
    }
  });
  
  // Methods to interact with the editor
  const setEditorValue = (newValue: string) => {
    if (editor.value) {
      editor.value.setValue(newValue);
      value.value = newValue;
    }
  };
  
  const setSchema = (schema: any) => {
    if (editor.value) {
      editor.value.setSchema(schema);
    }
  };
  
  const focus = () => {
    if (editor.value) {
      editor.value.focus();
    }
  };
  
  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (editor.value) {
      editor.value.setTheme(theme);
    }
  };
  
  return {
    editor,
    value,
    setEditorValue,
    setSchema,
    focus,
    setTheme
  };
}