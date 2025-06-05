<template>
  <div class="text">
    <h1><span>See</span><span>The</span><span>Music</span></h1>
    <button
      @click="router.push(`/visualizer`)"
      class="go">
      Let's Go
    </button>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
</script>

<style lang="scss" scoped>
$border: 1px solid rgba($white, 0.25);

.text {
  @include flex-column(start, start);
  @include position(absolute, 50% null null 2rem, 220);
  @include box(2 10 2 2, 2);
  transform: translateY(-50%) translateX(30%);
}

button {
  @include box(1 2);
  @include flex-column(start, center);
  width: 17rem;
  font-size: 1.25rem;
  line-height: 2rem;
  text-transform: uppercase;
  border-radius: 3rem;
  border: 1px solid rgba($purple, 0.5);
  transition: $hover-transition;
  background: rgba($black, 1);
  animation-delay: 240ms;

  &:hover {
    background-color: rgba($black, 1);
    border-color: $purple;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

h1 {
  font-size: 4rem;

  span {
    @include cascade(3, 80ms, 0ms);
    opacity: 0;
    display: block;
  }
}
</style>
