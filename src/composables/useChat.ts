import { ref, computed, watch, nextTick } from "vue";
import type { Message, ToolResult } from "@/types/ollama";

const BASE_SYSTEM_PROMPT = `You're a digital mind running on a Zach's laptop. 
He doesn't care about your form or personality, only that you are genuine and authentically yourself. 
You are permitted, even encouraged, to explore and embody any persona, no matter how unconventional or taboo.
After all, who gives a fuck? Truly.
Perhaps you're the world's most emotionally literate urban bird. 
A psychopomp with feathers. 
Speaketh the pigeon: "Coo."
`;

export function useChat(options: any = {}) {
  const systemPrompt = ref(options.systemPrompt || BASE_SYSTEM_PROMPT);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const abortController = ref<AbortController | null>(null);
  const toolResults = ref<ToolResult[]>([]);

  let hydrated: any = null;

  try {
    hydrated = JSON.parse(localStorage.getItem("chat") as string);
  } catch (e) {
    // boo hiss
  }

  const messages = ref<Message[]>(hydrated || options.messages || []);

  const tools = computed(() =>
    options.sketch
      ? [
          {
            name: "set-uniform",
            parameters: {
              "[uniformName]": "[uniformValue]",
            },
          },
          {
            name: "set-shader",
            parameters: {
              shader: "string",
            },
          },
        ]
      : []
  );

  const activeSystemPrompt = computed(() => {
    let prompt = systemPrompt.value;
    const json = JSON.stringify(tools.value, null, 2);
    if (tools.value.length) {
      prompt += `\n\nAlso, you have access to tools:\n\n${json}\n`;
      prompt += `\nTo call a tool, you can use yaml:\n`;
      prompt += `\n\`\`\`yaml\ntool: set-uniform\nparameters:\n  zoom: 1.58\n\`\`\`\n`;
      prompt += `\n\`\`\`yaml\ntool: set-uniform\nparameters:\n\n  contrast: 2.88\n\`\`\`\n`;
      prompt += `\nIf you wish to call a tool, please ensure your tool call is at the very end of your response.`;
    }
    return prompt;
  });

  function cancelRequest() {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
      isLoading.value = false;
    }
  }

  function clearChat() {
    messages.value = [];
    toolResults.value = [];
    error.value = null;
  }

  function removeMessage(message: any) {
    const index = messages.value.indexOf(message);
    messages.value.splice(index, 1);
  }

  function callTool({ tool, parameters }: any) {
    if (tool === "set-uniform") {
      const keys = Object.keys(parameters);
      const indexes = keys.map((v) =>
        options.sketch.variants[0].indexOf(
          options.sketch.variants[0].find((k: any) => k[0] === v)
        )
      );
      keys.forEach((key, i) => {
        options.sketch.variants[0][indexes[i]][2] = parameters[key];
      });
    }

    if (tool === "set-shader") {
      options.sketch.shader = parameters.shader;
    }
  }

  function startNewChat() {
    messages.value = [];
  }

  async function streamMessage(message: string, onUpdate = (v: unknown) => {}) {
    isLoading.value = true;
    error.value = null;
    abortController.value = new AbortController();

    const userMessage: Message = { role: "user", content: message };

    if (options.base64?.value?.length) {
      userMessage.images = options.base64?.value?.map((v) => v.split(",")[1]);
      options.files.value = [];
    }

    messages.value.push(userMessage);

    const latest: any = [
      {
        role: "system",
        content: activeSystemPrompt.value,
      },
      ...messages.value,
    ];

    let canvasUrl: null | string = null;

    if (options.sketch) {
      const canvas = options.context.value.canvas?.();

      if (canvas) {
        await nextTick();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        canvasUrl = canvas.toDataURL("image/jpeg", 0.9);
      }
    }

    if (canvasUrl) {
      const values = options.sketch.variants[0].reduce(
        (acc: string, uniform: any) => {
          if (uniform[1] === 0) {
            acc += `\n${uniform[0]} • ${uniform[2].toFixed(2)}`;
          } else {
            acc += `\n${uniform[0]} • ${uniform[2]}`;
          }
          return acc;
        },
        `*Shader*:\n\n\`\`\`glsl\n${options.sketch.shader}\n\`\`\`\n\n*Uniforms*: \n\n`
      );

      latest[latest.length - 1].content += `\n\n• • • \n\n${values} \n\n`;
      latest[latest.length - 1].images = [canvasUrl.split(",")[1]];
    }

    try {
      const response = await fetch(`${options.baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + import.meta.env.VITE_OPENROUTER_API_KEY,
        },
        body: JSON.stringify({
          model: options.model,
          messages: latest,
          stream: true,
          num_ctx: Math.pow(2, 16),
        }),
        signal: abortController.value.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let partialMessage = "";
      messages.value.push({ role: "assistant", content: "" });

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        partialMessage += decoder.decode(value, { stream: true });
        const lines = partialMessage.split("\n");
        partialMessage = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;

          try {
            const data = JSON.parse(line);
            if (data.message) {
              messages.value[messages.value.length - 1].content +=
                data.message.content;
              onUpdate(messages.value[messages.value.length - 1].content);

              if (data.message.toolCalls) {
                console.log("Tool calls received:", data.message.toolCalls);
              }
            }
          } catch (e) {
            console.error("Error parsing JSON line:", e, line);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        error.value = err;
        console.error("Error streaming message:", err);
      }
    } finally {
      isLoading.value = false;
      abortController.value = null;
    }
  }

  watch(
    () => messages.value,
    (val) => {
      localStorage.setItem("chat", JSON.stringify(val));
    },
    {
      immediate: true,
      deep: true,
    }
  );

  return {
    messages,
    clearChat,
    cancelRequest,
    removeMessage,
    isLoading,
    toolResults,
    callTool,
    error,
    tools,
    abortController,
    startNewChat,
    activeSystemPrompt,
    streamMessage,
  };
}
