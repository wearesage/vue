<template>
  <Column class="step one">
    <Row is="header">
      <h2>Choose a location</h2>
    </Row>

    <Row collapse>
      <Button
        @click="$emit('select', 'sacramento')"
        class="sacramento"
        ><span><small>Downtown</small> Sacramento</span></Button
      >
      <Button
        @click="$emit('select', 'folsom')"
        class="folsom"
        ><span>Folsom <small>at Palladio</small></span></Button
      >
    </Row>
    <small
      >Appointments are complimentary private sessions scheduled with your personal stylist. Credit/Debit card is required for booking, a $75 cancellation fee will be charged to the card on file if
      less than 48 hour notice of cancellation is given. Booking this appointment is acceptance of our Terms & Conditions and the cancellation policy.</small
    >
  </Column>
</template>

<script setup lang="ts">
defineEmits(["select"]);
</script>

<style lang="scss" scoped>
.one {
  @include flex-column(center, start);
  @include box;
  height: 100%;
}

.row {
  @include box(0, 2);
  width: 100%;
}

button {
  @include box(5 1, 3);
  font-size: 2rem;
  width: 50%;
  position: relative;
  overflow: hidden;
  border: 0.3rem solid transparent;
  will-change: transform, opacity;
  color: #000;

  small,
  span {
    transition: var(--hover-transition);
    will-change: transform, opacity;
  }

  &:before {
    @include position(absolute, -1rem -1rem -1rem -1rem);
    background-image: url("/images/miosa.sacramento.jpg");
    background-size: cover;
    opacity: 0.25;
    content: "";
    transition: var(--hover-transition);
  }

  &:hover:before {
    transform: scale(1.05);
    opacity: 0.1;
  }

  &:hover small {
    transform: translateY(3rem) scale(0.8);
    opacity: 0;
  }

  &:hover span {
    transform: scale(1.1);
  }

  span {
    @include flex-column;
    @include gap(0);
    position: relative;
    line-height: 1.5;
    z-index: 5;
  }

  small {
    font-size: 1.2rem;
    color: inherit;
    position: absolute;
    top: 0;
    transform: translateY(3rem);
    white-space: nowrap;
  }

  @include mobile {
    width: 100%;

    span {
      transform: none;
      opacity: 1 !important;
    }

    small {
      transform: translateY(3rem) !important;
      opacity: 1 !important;
    }

    &:hover:before {
      transform: none !important;
    }

    &:hover {
      span {
        transform: none;
      }

      small {
        transform: translateY(3rem) !important;
      }
    }
  }
}

small {
  font-size: 0.8rem;
  line-height: 1.1rem;
}

.sacramento {
  // background: url('/images/miosa.sacramento.jpg') center;
  background-size: cover;
}

button.folsom:before {
  background-image: url("/images/miosa.folsom.jpg");
  background-size: cover;
}

header.row {
  padding: 0;
}
</style>
