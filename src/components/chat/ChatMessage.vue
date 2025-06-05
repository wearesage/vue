<template>
  <li class="chat-message" :class="{ [message.role]: true }">
    <button class="remove" @click="$emit('remove')">
      <Close />
    </button>
    <VueMarkdown :source="message.content" :options="{ html: true, breaks: true, highlight }" />
    <strong class="model" v-if="model && message.role === 'assistant'">~ {{ model }}</strong>
    <ul v-if="message.images" class="images">
      <li v-for="(img, i) in message.images" :key="`message-${i}`">
        <img :src="`data:image/jpeg;base64,${img}`" />
      </li>
    </ul>
  </li>
</template>

<script setup lang="ts">
import Close from '../../assets/icons/close.svg';
import VueMarkdown from 'vue-markdown-render';
import hljs from 'highlight.js';
import 'highlight.js/styles/hybrid.css';

function highlight(str: string, lang: any) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return `<pre class="${lang}"${lang === 'yaml' ? ' data-tool-call' : ''}><code class="hljs">` +
        hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
        '</code></pre>';
    } catch (__) { }
  }

  return '<pre><code class="hljs">' + str + '</code></pre>';
}

const $emit = defineEmits(['remove'])

defineProps<{
  message: {
    role: 'system' | 'user' | 'assistant' | 'tool',
    content: string;
    images?: any[];
  },
  model?: string;
}>()
</script>

<style lang="scss" scoped>
.chat-message {
  width: 100%;
  font-size: 1rem;
  line-height: 1.4;
  position: relative;

  :deep(em) {
    @include text-gradient($white, $white);
    font-style: italic;
    font-weight: 300;
    // opacity: .4;
  }

  :deep(code) {
    background: transparent;
  }

  :deep(pre) {
    background: transparent;

    code {
      padding: 0;
      font-family: monospace;
      font-size: .9rem;
      line-height: 1.3rem;
    }
  }

  :deep(> div > * + *) {
    margin-top: 1.5rem;
  }

  :deep(p > code) {
    font-weight: 900;
    font-family: monospace;
    font-size: .9rem;
    color: $pink;
  }

  :deep(strong) {
    font-weight: 700;
  }

  :deep(ol) {
    @include flex-column(start, start);
    @include box(1 10 1 3)
  }

  :deep([data-tool-call]) {
    @include box(1.5, 0);
    border: .2rem solid rgba($pink, .15);
    width: fit-content;
    border-radius: 1.5rem;
    border-bottom-left-radius: 0;
  }
}

.system {
  display: none;
}

$border: 1px solid rgba($pink, 1);

.assistant {
  @include box(1 2, 0);
  @include text-gradient($pink, $purple, to top);
  max-width: 80%;
  border-radius: 2rem;
  color: $pink;
  // border-bottom: $border;
}

$border: 1px solid rgba($white, .25);

.user {
  @include box(1 2, 0);
  border-bottom: $border;
  margin-left: auto;
  width: fit-content;
  max-width: 80%;
  border-radius: 2rem;

  &:hover p {
    opacity: .5;
  }
}

.remove {
  @include size(2rem);
  @include flex;
  @include position(absolute, 50% null null -1rem, 10);
  background: $black;
  border: 1px solid rgba($gray, .25);
  transform: translateY(-50%);
  padding: .5rem;
  border-radius: 100%;
  transition: $hover-transition;
  // margin-bottom: 1rem;
  opacity: 0;

  &:hover {
    cursor: pointer;
    transform: translateY(-50%) scale(1.1);


    :deep(svg *) {
      fill: $white;
    }
  }


  &:active {
    transform: translateY(-50%) scale(1);
  }

  :deep(svg) {
    @include size(100%);

    * {
      fill: $white;
    }
  }

  // .assistant & {
  //   @include position(absolute, null initial .5rem .5rem);
  // }
}

li:hover .remove {
  opacity: 1;
}

.images li {
  @include size(150px);
  position: relative;
  border-radius: 1.25rem;
  overflow: hidden;
  // margin-top: 2rem;
  padding: .25rem;
  border: 1px solid rgba($white, .25);

  img {
    @include size(100%);
    border-radius: 1rem;
    overflow: hidden;
    animation: fade-in var(--transition-duration) var(--transition-easing) forwards;
    object-fit: cover;
  }
}

.model {
  display: flex;
  margin-top: 1rem;
  @include text-gradient($white, $gray);
  font-weight: 100;
  opacity: .25;
  font-size: .8rem;
}
</style>