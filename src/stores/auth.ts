import { defineStore, acceptHMRUpdate } from "pinia";
import { ref } from "vue";
import { createAppKit, useAppKit, useAppKitConnection, useAppKitAccount } from "@reown/appkit/vue";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { mainnet, solana } from "@reown/appkit/networks";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/vue";

export const useAuth = defineStore("auth", () => {
  const isAuthenticated = ref(false);
  const isAuthenticating = ref(false);
  const connection = useAppKitConnection({
    onSuccess() {
      console.log("fuck you");
    },
    onError() {
      console.log("no really fuck you");
    },
  });
  const account = useAppKitAccount();

  createAppKit({
    adapters: [new EthersAdapter(), new SolanaAdapter()],
    networks: [mainnet, solana],
    projectId: "b56e18d47c72ab683b10814fe9495694",
    themeMode: "dark",
    features: {
      analytics: true, // Optional - defaults to your Cloud configuration
    },
    metadata: {
      name: "Kaleidosync",
      description: "Your favorite music visualizer.",
      url: "http://localhost:5173",
      icons: ["https://www.kaleidosync.com/favicon.png"],
    },
    themeVariables: {
      "--w3m-accent": "#000000",
    },
  });

  const { open, close } = useAppKit();

  return {
    isAuthenticated,
    isAuthenticating,
    open,
    close,
    connection,
    account,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot));
}
