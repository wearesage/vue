<template>
  <section :class="{ focused }">
    <div class="row">
      <div class="actions" :class="{ visible: showActions }" ref="actions">
        <button @click="$emit('new-chat')">
          <span>New Chat</span>
        </button>
      </div>
      <textarea placeholder="send a message" ref="textarea" :value="message" @input="onInput" @keydown="onKeyDown"
        @focus="onFocus" @blur="onBlur" @keyup="onKeyUp" />
      <button class="plus send" :disabled="!message.length">
        <SendSVG />
      </button>
      <button class="plus" @click="actionClick" :class="{ active: showActions }" :disabled="messages.length === 0">
        <FileSVG />
      </button>
    </div>

    <Transition name="slide-up">
      <ChatFiles v-if="files.length" :files="files" @remove="e => $emit('remove', e)" />
    </Transition>
  </section>
</template>

<script setup lang="ts">
import FileSVG from '../../assets/icons/plus.svg'
import SendSVG from '../../assets/icons/send-up.svg'

const message = ref('')
const shift = ref(false);
const textarea = ref();
const focused = ref(false);
const showActions = ref(false);
const actions = ref('actions')

onClickOutside(actions as any, () => {
  showActions.value = false
})

function onFocus() {
  focused.value = true
}

function onBlur() {
  focused.value = false
}

const props = defineProps<{
  files: any;
  messages: any[];
}>()

watch(() => props.messages, (val: any) => {
  if (!val.length) {
    showActions.value = false
    textarea.value?.focus?.()
  }
})

const $emit = defineEmits(['submit', 'remove', 'new-chat'])

function submit() {
  $emit('submit', message.value)
  message.value = ''
}

function onInput({ target }: any) {
  if (target.value.length === 0) {
    target.style.height = '3.75rem';
    return
  }

  target.style.height = "5px";
  target.style.height = (target.scrollHeight) + "px";
  message.value = target.value
}

function actionClick() {
  showActions.value = true
}

async function onKeyDown(e: any) {
  if (e.key === 'Shift') {
    shift.value = true
  }

  if (!shift.value && e.key === 'Enter') {
    e.preventDefault()
    submit()
    await nextTick()
    if (e.target.value.length === 0) {
      e.target.style.height = '3.75rem';
      return
    }
  }
}

function onKeyUp({ key }: any) {
  if (key === 'Shift') {
    shift.value = false
  }
}

onMounted(() => {
  textarea.value.focus()
})
</script>

<style lang="scss" scoped>
$border: 1px solid rgba($white, .25);

section {
  @include position(absolute, null 0 0 0, 100);
  @include flex-column(end, end);
  @include box(3 0, 0);
  @include hide-scroll-bar;
  padding: 0 20vw 3rem 20vw;
  transition: var(--base-transition);

  &:hover {
    border-color: rgba($white, .05);
  }

  .row {
    @include flex-row(start, start);
    @include box(0 0 null 0, 0);
    background: transparent;
    position: relative;
    border-radius: 3rem;
    border-bottom: $border;
    margin-left: auto;
  }

  &.focused {
    border-color: rgba($pink, .25);

    .row {
      // background: lighten($black, 5%);
    }

    .row textarea {
        min-width: 500px;
    }
  }
}

textarea {
  @include box(1.5 1.25 1.5 1.25, 1);
  @include hide-scroll-bar;
  margin-left: auto;
  color: var(--pink);
  height: 1.25rem;
  line-height: 1;
  font-size: 1rem;
  height: 3.75rem;
  color: var(--white);
  min-width: 200px;
  transition: all .75s $transition-easing !important;

  &::placeholder {
    color: rgba($white, .25);
  }
}

.plus {
  @include size(2.25rem, 2.75rem);
  @include box(.5);
  margin: .5rem 1rem .5rem 0;
  border-radius: 100%;
  transition: $hover-transition;
  margin-bottom: auto;

  &:first-of-type {
    margin: .5rem 0;
  }

  &:hover:not([disabled]) {
    transform: scale(1.1);
    transition-duration: 150ms;

    &:active {
      transform: scale(.9);
    }
  }

  :deep(*) {
    fill: $white;
  }

  &[disabled],
  &.send[disabled] {
    opacity: .3;
    cursor: not-allowed;
  }

  &.send {
    opacity: 1;

    svg {
      opacity: 1;
    }
  }

  &:hover:not([disabled]) {
    svg {
      opacity: 1;
    }
  }

  &.active {

    &:hover,
    &:active {
      opacity: 1;
    }
  }
}

.actions {
  @include position(absolute, null -1rem 100% auto, 20);
  @include box;
  @include flex-row(end, start);
  opacity: 0;
  transition: $transition;

  &.visible {
    opacity: 1;
  }

  button {
    @include box(1 2);
    @include flex-row(space-between, center);
    width: 100%;
    margin-left: auto;
    text-align: right;
    border-bottom: $border;
    border-radius: 3rem;

    &[disabled] {
      opacity: .3;
      cursor: not-allowed;
    }

    span {
      font-size: 1rem;
      font-weight: normal;
      font-style: normal;
      text-transform: uppercase;
    }

    p {
      opacity: .25;
    }
  }
}
</style>