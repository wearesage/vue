<template>
  <Column class="step three">
    <Row is="header">
      <Button @click="$emit('back')"> < </Button>
      <h2>Contact Info</h2>
    </Row>

    <form @submit.prevent="onSubmit">
      <Row
        collapse
        is="fieldset">
        <Input
          type="text"
          name="firstname"
          v-model="firstName"
          label="First Name"
          placeholder="enter your first name" />
        <Input
          type="text"
          name="lastname"
          v-model="lastName"
          label="Last Name"
          placeholder="enter your last name" />
      </Row>
      <Row
        collapse
        is="fieldset">
        <Input
          type="email"
          name="email"
          v-model="email"
          label="Email"
          placeholder="enter your email address" />
        <Input
          type="phone"
          name="phone"
          v-model="phone"
          label="Phone Number"
          placeholder="enter your phone number" />
      </Row>

      <Button class="submit">Submit</Button>
    </form>
  </Column>
</template>

<script setup lang="ts">
import { validatePhoneNumber, validateEmail } from "../../util";

const { get, set } = createdNamespacedStorageHelpers("BOOKING:CONTACT");

const $emit = defineEmits(["back", "submit"]);

const firstName = ref(get("firstName") || "");
const lastName = ref(get("lastName") || "");
const email = ref(get("email") || "");
const phone = ref(get("phone") || "");

watch(
  () => [firstName.value, lastName.value, email.value, phone.value],
  () => {
    set("firstName", firstName.value);
    set("lastName", lastName.value);
    set("email", email.value);
    set("phone", phone.value);
  },
  {
    immediate: true
  }
);

function onSubmit(e: any) {
  const formData = new FormData(e.target);
  const { firstname, lastname, email, phone } = Object.fromEntries(formData);
  const { valid: phoneValid, value } = validatePhoneNumber(phone as string);

  if (!validateEmail(email as string)) {
    alert("email is invalid");
    return;
  }

  if (!phoneValid) {
    alert("phone is invalid");
    return;
  }

  $emit("submit", {
    firstname,
    lastname,
    email,
    phone: value
  });
}
</script>

<style lang="scss" scoped>
form {
  @include flex-column(start, start);
  @include box;
  width: 100%;
  margin: 0 auto;
}

:deep(input) {
  border: 1px solid var(--light-gray);
  border-radius: 3rem;
}

fieldset {
  @include gap;
  @include cascade-children(60, 30ms);
  width: 100%;
  min-width: 300px !important;
}

.submit {
  margin-left: auto;
  margin-top: 1rem;

  @include mobile {
    width: 100%;
  }
}
</style>
