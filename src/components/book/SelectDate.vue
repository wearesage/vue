<template>
  <Column class="step two">
    <Row is="header">
      <Button @click="$emit('back')"> < </Button>
      <h2>Select a date</h2>
    </Row>
    <Scheduler
      v-model="model"
      @select="(e: any) => $emit('select', e)" />
  </Column>
</template>

<script setup lang="ts">
defineEmits(["back", "select"]);

const model = defineModel();
</script>
