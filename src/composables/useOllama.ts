import { type Ref } from "vue";
import type { OllamaOptions } from "@/types/ollama";
import { useChat } from "./useChat";
export function useOllama(options: OllamaOptions = {}, { files, base64, sketch, context }: { files: Ref<any[]>; base64: Ref<any[]>; sketch?: any; context?: any }) {
  const baseUrl = options.baseUrl || "http://localhost:11434/api/chat";
  const model = options.model || "gemma3:4b-it-qat";
  const { messages, error, toolResults, streamMessage, cancelRequest, clearChat, activeSystemPrompt, startNewChat, removeMessage, callTool, tools, isLoading } = useChat({ ...options, files, base64, sketch, context, model, baseUrl });

  return {
    messages,
    isLoading,
    error,
    toolResults,
    streamMessage,
    cancelRequest,
    clearChat,
    model,
    activeSystemPrompt,
    tools,
    callTool,
    removeMessage,
    startNewChat,
  };
}
