<template>
  <nav class="settings">
    <h2>SETTINGS <IconButton icon="close" background="var(--pink)" @click="$emit('toggle')" /></h2>

    <h3>Renderer</h3>
    <Row>
      <p>Disable Flashing</p>
      <Toggle />
    </Row>

    <h3>User Interface</h3>
    <Row>
      <p>Always Show Track Info</p>
      <Toggle />
    </Row>
    <Row>
      <p>Show Player Controls</p>
      <Toggle />
    </Row>
    <Row>
      <p>Shuffle Visualizer Designs</p>
      <Toggle />
    </Row>

    <h3>Audius</h3>
    <Row>
      <p>Infinite Play</p>
      <Toggle />
    </Row>
  </nav>
</template>

<script setup lang="ts">
import Row from "../layout/Row.vue";
import Toggle from "../forms/Toggle.vue";
import IconButton from "../common/IconButton.vue";

defineEmits(["toggle"]);
</script>

<style lang="scss" scoped>
.settings {
  @include gap;

  h3 {
    font-size: 1.25rem;
    margin-left: auto;
    text-align: right;
  }

  .row {
    @include flex-row(end, center);
    @include box(1, 1);
    position: relative;
    width: fit-content;
    background: rgba($black, 1);
    border-radius: 2rem;
  }
}
</style>
