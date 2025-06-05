import { ref } from "vue";
import { sample } from "../util/arrays";

export function useRandomGreeting() {
  const greetings = ref(["Hello, ", "Hi, ", "Bonjour, ", "Hola, ", "Howdy, ", "Salutations, "]);
  const greeting = ref(sample(greetings.value));
  return greeting;
}
