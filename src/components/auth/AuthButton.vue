<template>
  <Button 
    @click="handleAuthClick"
    :disabled="auth.loading || auth.isAuthenticating"
  >
    <template v-if="auth.loading">
      <Loading size="small" /> Initializing...
    </template>
    <template v-else-if="auth.isAuthenticating">
      <Loading size="small" /> Authenticating...
    </template>
    <template v-else-if="auth.isAuthenticated">
      <Icon name="wallet" /> {{ auth.walletAddress?.slice(0, 8) }}...
    </template>
    <template v-else>
      <Icon name="wallet" /> Sign In
    </template>
  </Button>
</template>

<script setup lang="ts">
import { Button, Icon, Loading } from '@wearesage/vue';
import { useAuth } from '../../stores/auth';

const auth = useAuth();

async function handleAuthClick() {
  if (auth.isAuthenticated) {
    // Show user menu or navigate to profile
    // For now, just sign out
    await auth.signOut();
  } else {
    // Sign in
    await auth.signIn();
  }
}
</script>