import { ref, computed } from "vue";
import { createAppKit, useAppKit, useAppKitAccount, useAppKitState, useAppKitProvider, useDisconnect } from "@reown/appkit/vue";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { mainnet, arbitrum, base, solana, solanaTestnet } from "@reown/appkit/networks";
import { VITE_REOWN_PROJECT_ID } from "../../constants/env";
import bs58 from "bs58";

// Initialize AppKit only once
let appKitInitialized = false;

/**
 * Wallet connection and signing functionality
 * This composable ONLY handles wallet interactions, no auth state
 */
export function useWallet() {
  // Initialize AppKit on first use
  if (!appKitInitialized) {
    const wagmiAdapter = new WagmiAdapter({
      networks: [mainnet, arbitrum, base],
      projectId: VITE_REOWN_PROJECT_ID,
    });

    const solanaAdapter = new SolanaAdapter({
      networks: [solana, solanaTestnet],
      projectId: VITE_REOWN_PROJECT_ID,
    });

    createAppKit({
      adapters: [wagmiAdapter, solanaAdapter],
      networks: [mainnet, arbitrum, base, solana, solanaTestnet],
      projectId: VITE_REOWN_PROJECT_ID,
      metadata: {
        name: "Kaleidosync",
        description: "WebGL Music Visualizer",
        url: window.location.origin,
        icons: ["https://kaleidosync.com/favicon.png"],
      },
      features: {
        email: true,
        socials: ["google", "discord", "github"],
        emailShowWallets: true,
        onramp: true,
        swaps: true,
      },
      featuredWalletIds: ["metamask", "phantom", "coinbaseWallet", "walletConnect"],
      termsConditionsUrl: `${window.location.origin}/terms`,
      privacyPolicyUrl: `${window.location.origin}/privacy`,
    });

    appKitInitialized = true;
  }

  // AppKit hooks
  const { open, close } = useAppKit();
  const appKitState = useAppKitState();
  const account = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const eip155Provider = useAppKitProvider("eip155");
  const solanaProvider = useAppKitProvider("solana");

  // Computed properties
  const isConnected = computed(() => account.value.isConnected || false);
  const address = computed(() => account.value.address || null);
  const isModalOpen = computed(() => appKitState.open || false);

  const chainType = computed(() => {
    if (!address.value) return null;

    // EVM addresses start with 0x and are 42 chars
    if (address.value.startsWith("0x") && address.value.length === 42) {
      return "evm";
    }

    // Solana addresses are base58 encoded and 32-44 chars
    if (address.value.length >= 32 && address.value.length <= 44) {
      return "solana";
    }

    return "unknown";
  });

  const connectionType = computed(() => {
    if (!isConnected.value) return null;
    return account.value.embeddedWalletInfo ? "social" : "wallet";
  });

  const email = computed(() => account.value?.embeddedWalletInfo?.user?.email || null);

  /**
   * Open wallet connection modal
   */
  async function connect() {
    await open();
  }

  /**
   * Close wallet modal
   */
  function closeModal() {
    close();
  }

  /**
   * Disconnect wallet
   */
  async function disconnectWallet() {
    await disconnect();
  }

  /**
   * Wait for wallet provider to be ready
   */
  async function waitForProvider(maxWait = 2000): Promise<boolean> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkProvider = () => {
        if (
          (chainType.value === "evm" && eip155Provider?.walletProvider) ||
          (chainType.value === "solana" && solanaProvider?.walletProvider)
        ) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > maxWait) {
          resolve(false);
          return;
        }
        
        setTimeout(checkProvider, 50);
      };
      
      checkProvider();
    });
  }

  /**
   * Sign a message with the connected wallet
   */
  async function signMessage(message: string): Promise<string> {
    if (!isConnected.value || !address.value) {
      throw new Error("Wallet not connected");
    }

    // Ensure provider is ready
    const providerReady = await waitForProvider();
    if (!providerReady) {
      throw new Error("Wallet provider not available - please try reconnecting");
    }

    // Debug log to understand provider state
    console.log('🔐 Signing message:', {
      chainType: chainType.value,
      address: address.value,
      hasEip155Provider: !!eip155Provider?.walletProvider,
      hasSolanaProvider: !!solanaProvider?.walletProvider,
    });

    try {
      let signature: string;

      if (chainType.value === "evm" && eip155Provider?.walletProvider) {
        // EVM signing
        signature = await eip155Provider.walletProvider.request({
          method: "personal_sign",
          params: [message, address.value],
        });
      } else if (chainType.value === "solana" && solanaProvider?.walletProvider) {
        // Solana signing
        const encodedMessage = new TextEncoder().encode(message);

        // Check if signMessage exists on the provider
        if (typeof solanaProvider.walletProvider.signMessage !== "function") {
          throw new Error("Solana wallet does not support message signing");
        }

        // Call signMessage with proper context
        const result = await solanaProvider.walletProvider.signMessage(encodedMessage);
        const rawSignature = result?.signature || result;

        if (!rawSignature) {
          throw new Error("No signature returned from Solana wallet");
        }

        // Convert to base58 if needed
        signature = rawSignature instanceof Uint8Array ? bs58.encode(rawSignature) : rawSignature;
      } else {
        throw new Error(`Wallet provider not available. Chain: ${chainType.value}, EVM: ${!!eip155Provider?.walletProvider}, Solana: ${!!solanaProvider?.walletProvider}`);
      }

      return signature;
    } catch (error: any) {
      // Re-throw with cleaner error messages
      if (error.message?.includes("User rejected") || error.code === 4001) {
        throw new Error("User rejected signature request");
      }
      throw error;
    }
  }

  return {
    // State
    isConnected,
    address,
    chainType,
    connectionType,
    email,
    isModalOpen,

    // Actions
    connect,
    closeModal,
    disconnect: disconnectWallet,
    signMessage,
  };
}
