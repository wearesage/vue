<template>
  <Row is="address">
    <Icon name="marker" size="1.5rem" />
    <p>
      {{ value.house_number }}
      {{ value.road }}
      <small v-if="full">
        <i>&nbsp;</i>
        {{ value.city }},
        {{ toCode(value.state)
        }}
        {{ value.postcode }}
        <span v-if="value.suburb">({{ value.suburb }})</span></small>
    </p>

  </Row>
</template>

<script lang="ts" setup>
import type { Address } from '@/types/address';
import { STATE_NAME_MAP } from '../../util/states';

const toCode = (state: string) => (STATE_NAME_MAP as any)?.[state]

defineProps<{
  value: Address
  full?: boolean;
}>()
</script>

<style lang="scss" scoped>
address {
  @include flex-column(start, start);
}

small {
  font-size: .8rem;
  margin-left: 1rem;

  span {
    opacity: .5;
    padding-left: .25rem;
  }

  i {
    font-size: 1rem;
  }
}
</style>