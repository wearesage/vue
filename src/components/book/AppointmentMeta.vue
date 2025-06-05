<template>
  <Column class="step four">
    <Row is="header">
      <Button @click="$emit('back')"> < </Button>
      <h2>More Details</h2>
    </Row>

    <form @submit.prevent="onSubmit">
      <Row
        collapse
        is="fieldset">
        <Input
          type="range"
          name="guests"
          label="# of guests attending"
          v-model="guests"
          min="0"
          max="7"
          step="1" />
        <Input
          type="range"
          name="budget"
          label="Budget"
          currency
          v-model="budget"
          min="1000"
          max="10000"
          step="100" />
      </Row>

      <Button class="submit">Submit</Button>
    </form>
  </Column>
</template>

<script setup lang="ts">
const { get, set } = createdNamespacedStorageHelpers("BOOKING:META");

const guests = ref(get("guests") || 0);
const budget = ref(get("budget") || 1000);

const $emit = defineEmits(["back", "submit"]);

function onSubmit(e: any) {
  const formData = new FormData(e.target);
  const { guests, budget } = Object.fromEntries(formData);
  $emit("submit", { guests, budget });
}
</script>

<style lang="scss" scoped>
form,
fieldset {
  @include gap(3);
  width: 100%;
}

form {
  @include box;
}

.submit {
  margin-top: 3rem;
  margin-left: auto;

  @include mobile {
    width: 100%;
  }
}
</style>
