<template>
  <figure ref="container"></figure>
</template>

<script setup lang="ts">
import { type LngLatLike } from "maplibre-gl";
import map from "maplibre-gl";

export type Marker = any;

export type MapProps = {
  center?: LngLatLike;
  width?: number;
  height?: number;
  zoom?: number;
  pitch?: number;
  loading?: boolean;
  visible?: boolean;
  antialias?: boolean;
  bearing?: number;
  markers?: any[];
  selectedMarker?: Marker | null;
  onUpdate?: Function;
  onMarkerClick?: Function;
};

const { center = [-85.75713102656687, 38.22991872594457], zoom = 13, pitch = 70, bearing = 20.954011069080245, width = 200, height = 200, markers = [] } = defineProps<MapProps>();

watch(
  () => markers,
  val => {
    if (!val.length) return _markers.value.forEach(m => m.remove());
    buildMarkers();
  }
);

const emits = defineEmits(["update"]);
const container = ref();
const instance = shallowRef<any>(null);
const cssWidth = computed(() => width + "px");
const cssHeight = computed(() => height + "px");
const _markers = shallowRef<any>([]);

function buildMarkers() {
  _markers.value.forEach(m => m.remove());
  _markers.value = markers.map(({ coordinates }) => {
    const div = document.createElement("div");
    const img = document.createElement("img");
    div.classList.add("marker");
    img.src = `/icons/marker-pink.svg`;
    div.appendChild(img);
    return new map.Marker({ element: div }).setLngLat(coordinates).addTo(instance.value as any);
  });
}

onMounted(() => {
  instance.value = new map.Map({
    container: container.value,
    style: `https://api.maptiler.com/maps/1441c354-550d-4902-85ab-e0491b8a4bef/style.json?key=K4p1IWWrJYEjxxY6LBW1`,
    center,
    zoom,
    pitch,
    bearing
  });

  buildMarkers();

  instance.value.on("zoom", () => {
    emits("update", {
      key: "zoom",
      value: instance.value.getZoom()
    });
  });

  instance.value.on("pitch", () => {
    emits("update", {
      key: "pitch",
      value: instance.value.getPitch()
    });
  });

  instance.value.on("bearing", () => {
    emits("update", {
      key: "bearing",
      value: instance.value.getBearing()
    });
  });

  instance.value.on("rotate", () => {
    emits("update", {
      key: "bearing",
      value: instance.value.getBearing()
    });
  });

  instance.value.on("move", async () => {
    const { lat, lng } = instance.value.getCenter();

    emits("update", {
      key: "center",
      value: [lng, lat]
    });
  });
});
</script>

<style lang="scss">
.marker {
  @include size(2rem);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 0.25rem;
  border-radius: 100%;
}
</style>

<style lang="scss" scoped>
figure {
  will-change: transform, opacity;
  width: v-bind(cssWidth);
  height: v-bind(cssHeight);

  :deep(.maplibregl-ctrl) {
    display: none;
  }
}
</style>
