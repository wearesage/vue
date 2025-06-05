import { ref, onMounted, onBeforeUnmount, type Ref } from "vue";
import { pause } from "../util/time";

export function useTypedText(elementRef: Ref<HTMLElement>, text: string) {
  const split = ref<string[]>([]);
  const i = ref(0);
  const dead = ref(false);

  async function tick() {
    if (dead.value) return;

    await pause(40);

    elementRef.value.textContent += split.value[i.value];

    if (i.value < split.value.length - 1) {
      i.value++;
      tick();
    }
  }

  onMounted(() => {
    split.value = text
      .split(" ")
      .join("&")
      .split("")
      .map((v) => (v === "&" ? " " : v));
    console.log(split.value);
    tick();
  });

  onBeforeUnmount(() => {
    dead.value = true;
  });
}
