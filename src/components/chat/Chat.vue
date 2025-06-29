<template>
  <section
    class="chat"
    ref="container">
    <Transition name="fade">
      <ChatGreeting v-if="messages.length === 0" />
    </Transition>
    <ChatMessages
      @tool-call="callTool"
      @remove="removeMessage"
      :messages="messages"
      :sketch="sketch"
      :model="model"
      ref="chat" />
    <ChatInput
      @submit="streamMessage"
      @new-chat="startNewChat"
      @remove="remove"
      :files="files"
      :messages="messages" />
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ChatGreeting from "./ChatGreeting.vue";
import ChatMessages from "./ChatMessages.vue";
import ChatInput from "./ChatInput.vue";
import { useDropMultipleFiles, useChat } from "../../composables";

const props = defineProps<{ sketch?: any }>();
const chat = ref();
const container = ref();
const { files, base64, remove } = useDropMultipleFiles(container);
const baseUrl = "http://localhost:11434/api/chat";
const model = `gemma3:12b-it-qat`;
const { messages, streamMessage, startNewChat, removeMessage, callTool } = useChat({
  files,
  base64,
  sketch: props.sketch,
  context: chat,
  baseUrl,
  model
});
</script>

<style lang="scss" scoped>
.chat {
  @include flex-column(start, start);
  @include size(100%);
  @include position(fixed, 0 0 0 0, 30);
  @include blur(5rem, rgba($black, 0.9));

  :deep(*) {
    transition: $transition;
  }
}
</style>
