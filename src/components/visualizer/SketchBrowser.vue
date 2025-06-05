<template>
  <section>
    <Row class="delay">
      <h2>{{ heading }} <IconButton icon="close" background="var(--pink)" @click="$emit('close')" /></h2>
    </Row>
    <Row class="sketches">
      <div class="img" v-for="({ shader, variants: [uniforms], _id }, i) in visible" :key="`${_id}`">
        <!-- <Shader v-if="sketches.shader === shader" @click="selectShader(i)" :shader="shader" :uniforms="uniforms" v-bind="props" /> -->
        <ShaderThumbnail :id="_id.$oid" size="9vw" @click="selectShader(i)" />
      </div>
    </Row>
    <Pagination class="delay" :pages="pages" :active="active" @select="selectPage" @previous="previous" @next="next" />
  </section>
</template>

<script setup lang="ts">
const viewport = useViewport();
const sketches = useSketches();
const router = useRouter();
const audio = useAudio();
const { visible, next, previous, pages, active, selectPage } = usePaginatedCollection(toRef(sketches.published));
const props = computed(() => ({
  volume: audio.volume,
  stream: audio.stream,
  width: viewport.width * 0.09,
  height: viewport.width * 0.09
}));

const headings = ref(
  [
    "Set & Setting",
    "Eye Flavors",
    "Mood Rings",
    "Math Potions",
    "Code Spells",
    "Pixel Prayers",
    "Chromesthesia",
    "Neural Poetry",
    "Crossed Currents",
    "Heard Colors",
    "Sight Unseen",
    "Sense & Sensibility",
    "Sound Sight",
    "Wired Different",
    "Sensory Stories",
    "Perception Shifts",
    "Mixed Signals"
  ].map(v => v.toUpperCase())
);
const heading = ref(sample(headings.value));
const $emit = defineEmits(["close", "select"]);

function selectShader(i: number) {
  sketches.selectSketchById(visible.value[i]._id.$oid);
  $emit("close");
}
</script>

<style lang="scss" scoped>
section {
  @include position(absolute, 0 0 0 0, 50);
  @include flex;
  @include blur(1rem, linear-gradient(to top, $black, transparent));
}

.img {
  @include cascade;
  @include size(9vw);
}

.row {
  @include flex-row(end, center);
  @include box;
}

.shader,
img {
  @include size(100%);
  transition: var(--hover-transition);
}

.img {
  border-radius: 100%;
  overflow: hidden;
  outline: 0.5rem solid rgba(0, 0, 0, 0.25);
}

button {
  margin-left: auto;
}

.delay {
  opacity: 0;
  animation: fade 500ms $transition-easing forwards;
  animation-delay: 200ms;
}

h2 {
  width: fit-content;
}

.sketches {
  @include gap(2);
}

.sketches:hover img {
  &:hover {
    transform: scale(1.3);
  }
}
</style>
