<template>
  <div
    class="container"
    ref="container">
    <transition name="fade-fast">
      <Row
        class="pills"
        v-if="pills.length">
        <Pill
          v-for="(pill, i) in pills"
          class="pill">
          <span>{{ pill }}</span>
          <button
            class="close"
            @click="() => remove(i)">
            X
          </button>
        </Pill>
      </Row>
    </transition>
    <div
      class="search-container"
      ref="searchContainer">
      <Search />
      <Input
        type="text"
        v-model="filter"
        @keydown="onInput"
        :placeholder="placeholder"
        autofocus />
      <button
        class="clear"
        @click="clear"
        :class="{ visible: filter.length }">
        X
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ placeholder: string }>();

const container = ref();
const searchContainer = ref();
const filter = ref("");
const model = defineModel();
const pills = ref<string[]>([]);

watch(
  () => [pills.value, filter.value],
  async () => {
    model.value = [...pills.value, ...filter.value.split(" ")].map(v => v.replaceAll("-", " ")).join(" ");
    if (pills.value.length) {
      await nextTick();
      const width = container.value.querySelector(".pills")?.getBoundingClientRect()?.width;
      searchContainer.value.style.marginLeft = `calc(${width}px + 1rem)`;
    } else {
      searchContainer.value.style.marginLeft = "0rem";
    }
  },
  { deep: true }
);

function remove(i: number) {
  pills.value.splice(i, 1);
  container.value.querySelector("input").focus();
}

function clear() {
  filter.value = "";
  pills.value = [];
  container.value.querySelector("input").focus();
}

function onInput(e: any) {
  if (e.key === "Escape") {
    filter.value = "";
    pills.value = [];
    return;
  }

  if (e.key === "Backspace" && filter.value.length === 0) {
    pills.value.pop();
  } else if (e.key === "Enter") {
    pills.value.push(e.target.value);
    filter.value = "";
  }
}
</script>

<style lang="scss" scoped>
.pills {
  @include gap;
  @include position(absolute, 50% null null 1rem);
  height: var(--element-size);
  transform: translateY(-50%);
}

.pill {
  position: relative;
  user-select: none;

  button {
    transition: var(--hover-transition);
  }

  button:hover {
    transform: scale(1.1);
    cursor: pointer;
  }
}

.container {
  @include flex-row(start, center);
  flex: 1;
}

.container {
  width: 100%;
  flex: 1;
}

input {
  height: 100%;
  min-width: 300px;

  @include mobile {
    flex: 1;
    width: 100%;
  }
}

.close {
  @include position(absolute, -0.5rem -0.5rem null null, 10);
  @include flex;
  background: var(--primary-color);
  border: 0.25rem solid var(--primary-color);
  border-radius: 100%;
}

.clear {
  opacity: 0;
  transition: var(--transition);

  &.visible {
    opacity: 1;
  }
}

.search-container {
  @include flex-row(space-between, center);
  height: var(--element-size);
  transition: var(--transition);
  // border-radius: 2rem;
  // padding: .25rem;
  // border: 1px solid var(--gray);

  @include mobile {
    width: 100%;
  }

  button {
    display: flex;
  }
}

.search-container,
.pills {
  height: var(--element-size);
}

.input {
  gap: 0;
}
</style>
