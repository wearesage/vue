<template>
  <Button
    v-if="!isCurrentUser"
    :disabled="isLoading(walletAddress) || !canInteract"
    @click="toggleFollow"
    :class="{
      'follow-button': true,
      'following': isFollowing(walletAddress),
      'admin-user': isAdminUser,
    }"
  >
    <Icon 
      v-if="isLoading(walletAddress)" 
      name="loading" 
      class="loading-icon" 
    />
    <template v-else>
      {{ followButtonText }}
    </template>
  </Button>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAuth } from "../../stores/auth";
import { useUserFollows } from "../../stores/user-follows";
import Button from "./Button.vue";
import Icon from "./Icon.vue";

interface Props {
  walletAddress: string;
}

const props = defineProps<Props>();

const auth = useAuth();
const userFollows = useUserFollows();

// Check if this is the current user
const isCurrentUser = computed(() => {
  return auth.walletAddress === props.walletAddress;
});

// Check if this is the admin user (MySpace Tom!)
const isAdminUser = computed(() => {
  // You could also store this in env or make it dynamic
  return props.walletAddress === "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT";
});

// Whether user can interact (must be authenticated and not themselves)
const canInteract = computed(() => {
  return auth.isAuthenticated && !isCurrentUser.value;
});

// Follow button text
const followButtonText = computed(() => {
  if (isAdminUser.value && userFollows.isFollowing(props.walletAddress)) {
    return "Following"; // Can't unfollow admin
  }
  return userFollows.isFollowing(props.walletAddress) ? "Following" : "Follow";
});

// Toggle follow status
async function toggleFollow() {
  if (!canInteract.value) return;
  
  // Can't unfollow admin (MySpace Tom protection!)
  if (isAdminUser.value && userFollows.isFollowing(props.walletAddress)) {
    return;
  }
  
  if (userFollows.isFollowing(props.walletAddress)) {
    await userFollows.unfollowUser(props.walletAddress);
  } else {
    await userFollows.followUser(props.walletAddress);
  }
}

// Expose store computed for template
const { isFollowing, isLoading } = userFollows;

// Load follow status on mount
onMounted(() => {
  if (auth.isAuthenticated && !isCurrentUser.value) {
    userFollows.checkFollowStatus(props.walletAddress);
  }
});
</script>

<style lang="scss" scoped>
.follow-button {
  &.following {
    background: var(--green) !important;
    color: var(--black) !important;
    
    &:hover {
      background: lighten($green, 10%) !important;
    }
  }
  
  &.admin-user.following {
    background: var(--purple) !important;
    color: var(--white) !important;
    cursor: default !important;
    
    &:hover {
      transform: none !important;
      background: var(--purple) !important;
    }
  }
  
  .loading-icon {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>