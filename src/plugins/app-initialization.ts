import type { PiniaPlugin } from "pinia";

/**
 * Pinia plugin for app-wide initialization
 *
 * This plugin ensures core services are initialized when the app starts,
 * regardless of which components are rendered (UI, Admin, etc.)
 */
export const appInitializationPlugin: PiniaPlugin = ({ store, pinia }) => {
  // Use a flag to ensure initialization only happens once
  if (!(pinia as any)._appInitialized) {
    (pinia as any)._appInitialized = true;

    // Defer initialization to next tick to ensure all stores are available
    Promise.resolve().then(async () => {
      console.log("🚀 Initializing app via Pinia plugin...");

      try {
        // Import stores dynamically to avoid circular dependencies
        // const { useSocketCore } = await import("../stores/socket-core");
        // const { useAuth } = await import("../stores/auth");
        // const { useSocketSpace } = await import('../stores/socket-space'); // DELETED

        // Initialize core services
        // const socketCore = useSocketCore(pinia);
        // const auth = useAuth(pinia);
        // const socketSpace = useSocketSpace(pinia); // DELETED

        // Initialize auth first (validates stored tokens)
        // await auth.initialize();
        console.log("🔐 Auth initialized");

        // Connect socket
        // await socketCore.connect();
        console.log("🔌 Socket connected via Pinia plugin");

        // Start heartbeat to keep connection alive
        // socketCore.startHeartbeat();
        console.log("💓 Socket heartbeat started");

        // TODO: Add V2 socket integration here if needed for specific functionality
        // (Space management was replaced with V2 patterns)
        console.log("🚀 Socket V2 integration ready (space management simplified)");

        // Auto-join functionality moved to individual V2 composables as needed
      } catch (error) {
        console.error("❌ App initialization failed:", error);
      }
    });
  }
};
