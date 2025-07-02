<template>
  <Row class="account-pill" justify="center" align="center" :class="{ logout }" @click="handleClick">
    <i class="online" />
    <Transition name="fade">
      <span class="logout" v-if="logout"> SIGN OUT </span>
    </Transition>
    <!-- <span class="view">PROFILE</span> -->
    <span class="acct"> {{ truncatedAddress }}</span>
    <IconButton @click.stop="handleSignOut" @mouseover="onLogoutMouseover" @mouseout="onLogoutMouseout" icon="logout" small />
  </Row>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuth } from "../../stores";
import { useWallet } from "../../composables/auth/useWallet";
import Row from "../layout/Row.vue";
import IconButton from "./IconButton.vue";

const auth = useAuth();
const wallet = useWallet();
const logout = ref(false);

// Computed truncated address
const truncatedAddress = computed(() => {
  if (!auth.walletAddress) return "";
  return `${auth.walletAddress.slice(0, 6)}...${auth.walletAddress.slice(-4)}`;
});

function handleClick() {
  if (!logout.value) {
    // Could navigate to profile or do nothing
    // For now, do nothing since clicking the pill itself doesn't need an action
  }
}

async function handleSignOut() {
  await auth.signOut();
}

function onLogoutMouseover() {
  logout.value = true;
}

function onLogoutMouseout() {
  logout.value = false;
}
</script>

<style lang="scss" scoped>
.account-pill {
  @include position(fixed, 1rem 1rem null null, 150);
  @include box(0.25 0.25 0.25 1, 0.5);
  border-radius: 2rem;
  line-height: 1;
  background: $black;
  transition: $hover-transition;
  cursor: default;

  span {
    transition: $hover-transition;
    font-family: "Major Mono Display";
  }
}

i {
  @include size(1rem);
  border-radius: 1rem;
  background: $green;
}

.icon-button {
  border: 1px solid $gray;

  &:hover {
    background: lighten($black, 5%) !important;
  }

  .logout & {
    transform: none !important;
  }
}

.view,
span.logout {
  position: absolute;
  left: 2.5rem;
  opacity: 0;
}

.logout:hover {
  .acct {
    opacity: 0;
  }
}

.logout .view {
  opacity: 0 !important;
}

.logout span.logout {
  opacity: 1;
}
</style>
