<template>
  <form
    ref="form"
    @submit.prevent="onSubmit">
  </form>
</template>

<script setup lang="ts">
const form = ref();
const { schema } = defineProps<{ schema: FormSchema }>();
const emits = defineEmits(['submit', 'cancel']);

function onSubmit() {
  const formData = new FormData(form.value);
  const formProps = Object.fromEntries(formData);
  emits('submit', formProps);
}

onMounted(() => {
  console.log(schema);
});
</script>
