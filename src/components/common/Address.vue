<template>
  <Row is="address">
    <Icon name="marker" size="1.5rem" />
    <p>
      {{ value.house_number }}
      {{ value.road }}
      <small v-if="full">
        <i>&nbsp;</i>
        {{ value.city }},
        {{ toCode(value.state) }}
        {{ value.postcode }}
        <span v-if="value.suburb">({{ value.suburb }})</span></small
      >
    </p>
  </Row>
</template>

<script lang="ts">
export interface Address {
  house_number?: string;
  road?: string;
  city?: string;
  state?: string;
  postcode?: string;
  suburb?: string;
}
</script>

<script lang="ts" setup>
import Row from "../layout/Row.vue";
import Icon from "../common/Icon.vue";
import { STATE_NAME_MAP } from "../../util/states";

const toCode = (state?: string) => (state ? (STATE_NAME_MAP as any)?.[state] : "");

defineProps<{
  value: Address;
  full?: boolean;
}>();
</script>

<style lang="scss" scoped>
address {
  @include flex-column(start, start);
}

small {
  font-size: 0.8rem;
  margin-left: 1rem;

  span {
    opacity: 0.5;
    padding-left: 0.25rem;
  }

  i {
    font-size: 1rem;
  }
}
</style>
