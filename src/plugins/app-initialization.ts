import type { PiniaPlugin } from 'pinia';

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
      console.log('🚀 Initializing app via Pinia plugin...');
      
      try {
        // Import stores dynamically to avoid circular dependencies
        const { useSocketCore } = await import('../stores/socket-core');
        const { useAuth } = await import('../stores/auth');
        const { useSessionLogger } = await import('../stores/session-logger');
        const { useSocketSpace } = await import('../stores/socket-space');
        const { initGlobalPerformanceTracking } = await import('../composables/usePerformanceMonitoring');
        
        // Initialize core services
        const socketCore = useSocketCore(pinia);
        const auth = useAuth(pinia);
        const sessionLogger = useSessionLogger(pinia);
        const socketSpace = useSocketSpace(pinia);
        
        // Initialize auth first (validates stored tokens)
        await auth.initialize();
        console.log('🔐 Auth initialized');
        
        // Connect socket
        await socketCore.connect();
        console.log('🔌 Socket connected via Pinia plugin');
        
        // Start heartbeat to keep connection alive
        socketCore.startHeartbeat();
        console.log('💓 Socket heartbeat started');
        
        // Setup unified space listeners and auto-join if authenticated
        socketSpace.setupSpaceListeners();
        console.log('🚀 Unified space listeners setup');
        
        if (auth.isAuthenticated) {
          await socketSpace.autoJoinUserProjects();
          console.log('🎯 Auto-joined user projects as spaces with unified toast notifications');
        }
        
        // Initialize session logging (happens automatically on store creation)
        console.log('📊 Session logging initialized');
        
        // Initialize global performance tracking
        initGlobalPerformanceTracking();
        console.log('⚡ Performance tracking initialized');
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    });
  }
};