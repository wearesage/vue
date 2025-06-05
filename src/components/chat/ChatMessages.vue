<template>
  <ul class="messages" ref="container">
    <TransitionGroup name="fade">
      <template v-for="(message, i) in messages" :key="message">
        <ChatMessage :message="message" @remove="remove(message)" :model="model" />
      </template>
    </TransitionGroup>
    <ShaderTool ref="shader" v-if="sketch" :sketch="sketch" />
  </ul>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted } from "vue";
import { parse } from "yaml";
import { interpolateNumber } from "d3-interpolate";
import ChatMessage from "./ChatMessage.vue";
import ShaderTool from "./ShaderTool.vue";
import { useRAF } from "../../stores/raf";

const raf = useRAF();
const shader = ref();
const container = ref();
const props = defineProps<{
  sketch?: any;
  messages: any[];
  model?: string;
}>();

const $emit = defineEmits(["remove", "tool-call"]);

function remove(message: any) {
  $emit("remove", message);
}

defineExpose({
  canvas: () => shader?.value?.canvas?.()
});

watch(
  () => props.messages,
  async () => {
    try {
      await nextTick();
      const call = container.value?.querySelector?.(".assistant:last-of-type [data-tool-call]")?.innerText;

      if (props.messages[props.messages.length - 1].role === "user") {
        animate();
      } else if (props.messages[props.messages.length - 1].content.length < 10) {
        animate();
      }

      if (call) {
        const { tool, parameters } = parse(call);
        $emit("tool-call", { tool, parameters });
      }
    } catch (e) {
      // wah
    }
  },
  { deep: true, immediate: true }
);

function animate() {
  const from = container.value.scrollTop;
  const to = container.value.scrollHeight - container.value.offsetHeight;
  const iS = interpolateNumber(from, to);

  raf.remove("chat");
  raf.add(
    {
      tick({ progress }) {
        container.value.scrollTop = iS(progress);
      },
      duration: 750
    },
    "chat"
  );
}

onMounted(() => {
  animate();
});
</script>

<style lang="scss" scoped>
.messages {
  @include flex-column(start, start);
  @include gap(5);
  @include size(100%);
  @include hide-scroll-bar;
  padding: 20vw 20vw 30vh 20vw;
  flex: 1;
  margin: 0 auto;
  overflow-y: scroll;
}
</style>
