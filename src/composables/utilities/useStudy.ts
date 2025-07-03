import { computed, ref, watch, type Ref } from "vue";
import { clone } from "../../util";
import { Sketch } from "../../types";

// HARDCODED INTO THE ETERNAL VOID - BAT SIGNAL ACTIVATED 🦇
const ADMIN_WALLET = "6Qxu5cRDNFEZvYtgtvo27tdg7LuT5wuX7THqqPbBWJmT";

// API-based sketch loading instead of static JSON
const sketches = ref<Sketch[]>([]);
const studies = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

/**
 * Load public sketches from ShaderTom (ADMIN_WALLET) via API
 */
async function loadShaderTomSketches() {
  if (loading.value) return;

  loading.value = true;
  error.value = null;

  try {
    // Fetch public sketches by ADMIN_WALLET
    const response = await fetch(`/api/sketches/public?walletAddress=${ADMIN_WALLET}`);

    if (!response.ok) {
      throw new Error(`Failed to load sketches: ${response.statusText}`);
    }

    const data = await response.json();
    sketches.value = data.sketches || [];

    console.log(`✨ Loaded ${sketches.value.length} ShaderTom sketches for main visualizer`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load sketches";
    console.error("Error loading ShaderTom sketches:", err);
    // Fallback to empty array
    sketches.value = [];
  } finally {
    loading.value = false;
  }
}

function getSketchById(id: string) {
  return sketches.value.find((sketch) => sketch.id === id) || null;
}

export function useStudy(activeStudy: Ref<string>, activeSketchId: Ref<string | null>) {
  // For the MVP, we're treating all of ShaderTom's sketches as the main collection
  // The "study" concept is simplified to just be the full collection
  const iterations = computed<Sketch[]>(() => sketches.value);

  const index = computed<number>(() => {
    if (activeSketchId.value === null) return -1;
    const sketch = iterations.value.find((v: Sketch) => v.id === activeSketchId.value);
    if (!sketch) return -1;
    return iterations.value.indexOf(sketch);
  });

  // Load sketches when composable is first used
  if (sketches.value.length === 0 && !loading.value) {
    loadShaderTomSketches();
  }

  return {
    iterations,
    index,
    loading,
    error,
    getSketchById,
    loadShaderTomSketches,
  };
}
