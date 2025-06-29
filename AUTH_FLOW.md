# Authentication Flow Documentation

## Overview

The authentication system has been refactored for clarity and simplicity. It now follows a clean separation of concerns:

1. **`useWallet`** - Handles wallet/AppKit interactions only
2. **`useAuth`** - Manages JWT tokens and user state only  
3. **`useUserState`** - Tracks user activity and handles socket upgrades
4. **`useSocketCore`** - Manages WebSocket connections

## Key Design Decisions

### 1. Hidden Wallet State
Users don't see "connected/disconnected" wallet states. The "Sign In" button triggers both wallet connection AND authentication in one flow.

### 2. Always-Connected Socket
The socket connects on app initialization for ALL users (anonymous and authenticated). This enables real-time features for everyone.

### 3. Automatic Socket Upgrade
When a user authenticates, their socket automatically upgrades from anonymous to authenticated without reconnection.

### 4. Persistent JWT
JWTs are stored in localStorage and validated on app startup. The auth store's `loading` state prevents UI flicker during validation.

## Sign In Flow

```typescript
// User clicks "Sign In"
await auth.signIn()
  ├─ Connect wallet (if needed)
  ├─ Get auth challenge from server
  ├─ User signs message in wallet
  ├─ Verify signature with server
  ├─ Store JWT tokens
  └─ Socket auto-upgrades via useUserState watcher
```

## Sign Out Flow

```typescript
// User clicks "Sign Out"  
await auth.signOut()
  ├─ Call logout endpoint (ignore errors)
  ├─ Clear all auth state
  ├─ Disconnect wallet
  └─ Redirect to homepage
```

## App Initialization

```typescript
// In root App.vue
import { useAppInitialization } from '@wearesage/vue';

useAppInitialization();
  ├─ Initialize auth (validate stored JWT)
  └─ Connect socket (as anonymous initially)
```

## Auth Guards

```typescript
// In main.ts
import { authGuard } from './router/guards/authGuard';

createApp(App, routes, {
  guards: {
    requiresAuth: authGuard
  }
});
```

The auth guard:
1. Waits for `auth.authReady` promise
2. Checks `auth.isAuthenticated`
3. Redirects to homepage if not authenticated

## Token Refresh

Token refresh happens automatically on 401 responses (except for auth endpoints):

1. Interceptor catches 401
2. Attempts refresh with stored refresh token
3. Updates tokens in localStorage
4. Retries original request
5. Signs out user if refresh fails

## Socket Upgrade Flow

```typescript
// Anonymous user connects
socket.emit('user-state:online', { ... })

// User authenticates
socket.emit('user-state:authenticate', { walletAddress })

// Server upgrades connection
// User continues broadcasting as authenticated
```

## Component Usage

```vue
<template>
  <Button @click="handleAuth">
    <template v-if="auth.loading">Initializing...</template>
    <template v-else-if="auth.isAuthenticating">Authenticating...</template>
    <template v-else-if="auth.isAuthenticated">{{ auth.walletAddress }}</template>
    <template v-else>Sign In</template>
  </Button>
</template>

<script setup>
import { useAuth } from '@wearesage/vue';

const auth = useAuth();

async function handleAuth() {
  if (auth.isAuthenticated) {
    await auth.signOut();
  } else {
    await auth.signIn();
  }
}
</script>
```

## Error Handling

- **Wallet connection rejected**: Modal closes, no error shown
- **Signature rejected**: Wallet disconnects, toast error shown
- **Network errors**: Toast errors shown
- **Invalid JWT**: Cleared from storage, user remains signed out

## State Management

### Auth Store State
- `authToken` - JWT access token
- `refreshToken` - JWT refresh token  
- `user` - User object from server
- `loading` - True during initialization
- `isAuthenticating` - True during sign in flow
- `isAuthenticated` - Computed from token + user

### UserState Store State
- `currentPage` - Current route as enum
- `activityType` - User activity (browsing, listening, etc)
- `audioSource` - Current audio source
- `audioTrack` - Current track info
- `audioPosition` - Playback position
- `geoLocation` - User location (if permitted)

All state changes are automatically broadcast to the server via WebSocket.