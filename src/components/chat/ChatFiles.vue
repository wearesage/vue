<template>
  <ul class="chat-files">
    <li
      v-for="(file, i) in files"
      :key="i"
      :class="{ [file.type]: true }">
      <IconButton
        @click="$emit('remove')"
        class="rm"
        icon="close" />
      <figure
        v-if="file.type === 'image/jpeg' || 'image/png' || 'image/gif'"
        @click="remove(i)">
        <img
          v-if="base64[i]"
          :src="base64[i]" />
      </figure>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { imageToBase64 } from "../../util";
import IconButton from "../common/IconButton.vue";

const props = defineProps<{
  files: File[] | null;
}>();

const $emit = defineEmits(["remove"]);

const base64 = ref<any[]>([]);

watch(
  () => props.files,
  async () => {
    if (!props.files) return;
    props.files.forEach(async (file: any, i: number) => {
      base64.value[i] = await imageToBase64(file);
    });
  },
  {
    immediate: true,
    deep: true
  }
);

function remove(i: number) {
  $emit("remove", i);
}
</script>

<style lang="scss" scoped>
.chat-files {
  @include flex-row(start, start);
  @include box(0, 0.5);
  margin-top: 1rem;
}

li {
  position: relative;

  button {
    @include flex;
    @include size(1.5rem);
    @include position(absolute, 0.5rem 0.5rem null null, 100);
    @include box(0.25, 0);
    border: 1px solid $white;
    border-radius: 1rem;
    opacity: 0;

    svg {
      @include size(100%);
      :deep(*) {
        fill: $white;
      }
    }
  }

  &:hover button {
    opacity: 0.5;

    &:hover {
      opacity: 1;
    }
  }
}

figure {
  @include size(80px);
  position: relative;
  z-index: 20;
  border-radius: 1.25rem;
  overflow: hidden;
  padding: 0.25rem;
  border: 1px solid rgba($white, 0.25);
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

img {
  @include size(100%);
  border-radius: 1rem;
  overflow: hidden;
  animation: fade-in var(--transition-duration) var(--transition-easing) forwards;
  object-fit: cover;
}
</style>
