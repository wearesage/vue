<template>
  <aside>
    <ul
      class="dates"
      ref="dates">
      <li
        v-for="(day, i) in days"
        :key="`${day}-${i}`"
        :class="{ selected: i == selected }"
        @click="selectDate(i)">
        <p class="month">{{ day.month }}</p>
        <p class="day">{{ day.day }}</p>
      </li>
    </ul>

    <TransitionGroup
      name="slot"
      tag="ul"
      class="slots">
      <li
        v-for="(slot, i) in days[selected].slots"
        :key="`slot-${selected}-${i}`"
        @click="selectSlot(i)">
        {{ slot }}
      </li>
    </TransitionGroup>
  </aside>
</template>

<script setup lang="ts">
import { interpolateNumber } from "d3-interpolate";
import { format, addDays } from "date-fns";

const $props = defineProps<{
  modelValue: any;
}>();

const $emit = defineEmits(["select"]);
const raf = useRAF();
const viewport = useViewport();
const dates = ref();
const dayWidth = ref(110);
const selected = ref(0);

function generateSlots() {
  const times = ["9:00 am", "11:30 am", "2:15 pm", "4:30 pm"];
  const { random, floor } = Math;
  const total = 1 + floor(random() * 4);
  const slots = [];
  for (let i = 0; i < total; i++) slots.push(times[i]);
  return slots;
}

const days = computed(() => {
  const today = new Date();
  const range = [];

  for (let i = 0; i < 60; i++) {
    const value = addDays(today, i);
    range.push({
      value,
      month: format(value, "MMM").toLowerCase(),
      day: format(value, "dd"),
      slots: generateSlots()
    });
  }

  return range;
});

function selectDate(i: number) {
  selected.value = i;

  const iScroll = interpolateNumber(dates.value.scrollLeft, i * dayWidth.value + dayWidth.value / 2 - viewport.width / 2);

  raf.remove("date");
  raf.add(
    {
      tick({ progress }) {
        dates.value.scrollLeft = iScroll(progress);
      },
      duration: 400
    },
    "date"
  );
}

function selectSlot(i: number) {
  $emit("select", {
    date: days.value[selected.value].value,
    slot: days.value[selected.value].slots[i]
  });
}

onMounted(() => {
  console.log($props.modelValue);
});
</script>

<style>
.slot-enter-active,
.slot-leave-active {
  transition: var(--transition);
}

.slot-enter-from,
.slot-leave-to {
  height: 0rem !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  border-width: 0px !important;
  border-color: transparent !important;
  opacity: 0 !important;
}
</style>

<style lang="scss" scoped>
.dates {
  @include flex-row(start, start);
  @include hide-scroll-bar;
  @include cascade-children(60, 15ms);
  width: 100%;
  overflow-x: scroll;
  user-select: none;

  li:hover {
    color: var(--primary-color);
  }

  li {
    @include flex-column;
    @include box(1 0, 0.25);
    font-family: var(--heading-font-family);
    font-style: var(--heading-font-style);
    font-weight: var(--heading-font-weight);
    transition: var(--hover-transition);
    width: 110px;
    min-width: 110px;

    &.selected {
      color: var(--primary-color);
    }
  }

  .day {
    font-size: 2.5rem;
  }
}

.slots {
  @include flex-column(start, start);
  user-select: none;

  li {
    @include flex-row;
    @include box;
    height: 7rem;
    font-size: 2rem;
    overflow: hidden;
    box-shadow: inset 0 0 1px var(--light-gray);
    width: 100%;
  }
}
</style>
