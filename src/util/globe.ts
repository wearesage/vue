import countriesMetadata from "../data/utility/countries-metadata.json";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import population from "../data/utility/population.json";

const THEME_COLORS = [
  "#f22d85", // pink
  "#e64646", // red
  "#ffce51", // yellow
  "#ff924f", // orange
  "#b85bff", // purple
  "#65dca6", // green
];

// Convert lat/lon to 3D position on sphere
export function latLonToVector3(lat: number, lon: number, radius: number = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// Get the rotation to make an object at a position face outward from the sphere
export function getOutwardRotation(position: THREE.Vector3): THREE.Euler {
  const up = new THREE.Vector3(0, 1, 0);
  const lookAt = position.clone().normalize();

  // Create a quaternion that rotates from up to lookAt
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(up, lookAt);

  // Convert to Euler angles
  const euler = new THREE.Euler();
  euler.setFromQuaternion(quaternion);

  return euler;
}

// Store country colors for reuse between borders and fills
const countryColors: Map<string, THREE.Color> = new Map();

export function createCountryBorders(args = {}) {
  const props = {
    opacity: 1,
    lineWidth: 1,
    vertexColors: true,
    side: THREE.DoubleSide,
    ...args,
  };

  try {
    // Decode positions - use new border positions if available
    const base64 = countriesMetadata.base64BorderPositions || countriesMetadata.base64Positions;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const positions = new Float32Array(bytes.buffer);

    // Create color array - one color per vertex
    const colors = new Float32Array(positions.length);

    // Assign random color to each country
    countriesMetadata.countries.forEach((country: any) => {
      // Get or create color for this country
      let countryColor = countryColors.get(country.code);
      if (!countryColor) {
        countryColor = new THREE.Color(THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)]);
        countryColors.set(country.code, countryColor);
      }

      // Each vertex needs a color (3 components per vertex)
      const vertexCount = country.borderVertexCount || country.vertexCount;
      const startIndex = country.borderStartIndex || country.startIndex;

      for (let i = 0; i < vertexCount; i++) {
        const vertexIndex = (startIndex + i) * 3;
        colors[vertexIndex] = countryColor.r;
        colors[vertexIndex + 1] = countryColor.g;
        colors[vertexIndex + 2] = countryColor.b;
      }
    });

    // Create geometry with positions and colors
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial(props);
    return new THREE.LineSegments(geometry, material);
  } catch (error) {
    console.error("Failed to create country borders:", error);
    return new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial());
  }
}

export function createSimpleCountryFills() {
  try {
    // Check if we have fill data
    if (!countriesMetadata.base64FillPositions) {
      console.warn("No fill data available.");
      return null;
    }

    // Decode fill positions
    const base64 = countriesMetadata.base64FillPositions;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const positions = new Float32Array(bytes.buffer);

    // Create a simple white material to test
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    // Compute normals for proper lighting
    geometry.computeVertexNormals();

    console.log("Total vertices:", positions.length / 3);
    console.log("Total triangles:", positions.length / 9);

    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
    });

    return new THREE.Mesh(geometry, material);
  } catch (error) {
    console.error("Failed to create country fills:", error);
    return null;
  }
}

const CTX_OPTIONS: { antialias: boolean; powerPreference: WebGLPowerPreference } = {
  antialias: false,
  powerPreference: "high-performance",
};

export function initGlobe({ canvas, viewport }: any) {
  const ctx = canvas.value.getContext("webgl2", CTX_OPTIONS);
  const camera = new THREE.PerspectiveCamera(45, viewport.width / viewport.height, 0.01, 1000);
  camera.position.z = Math.PI;
  const renderer = new THREE.WebGLRenderer({ context: ctx, ...CTX_OPTIONS });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(viewport.width, viewport.height);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("rgb(0, 0, 0)");
  const ambientLight = new THREE.AmbientLight(new THREE.Color("rgb(0, 45, 133)"), 0.9);
  const directionalLight = new THREE.DirectionalLight("rgb(242, 45, 0)", 1);
  directionalLight.position.set(5, 3, 5);
  scene.add(ambientLight);
  scene.add(directionalLight);
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x000000),
    side: THREE.FrontSide,
  });

  const globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  // Add borders back
  const borders = createCountryBorders();
  scene.add(borders);

  // Create composer for post-processing effects
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Add bloom for neon glow effect
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(viewport.width, viewport.height),
    8, // bloom strength
    0.5, // bloom radius
    0.0 // bloom threshold
  );
  composer.addPass(bloomPass);

  const controls = new OrbitControls(camera, canvas.value);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 1;
  controls.zoomSpeed = 1.5;
  controls.minDistance = 1;
  controls.maxDistance = 5;
  controls.enablePan = true;

  function destroy() {
    controls?.dispose();
    renderer?.dispose();
    globe?.geometry?.dispose();
    globe?.material?.dispose();
    borders?.geometry?.dispose();
    borders?.material?.dispose();
    populationPillars?.geometry?.dispose();
    populationPillars?.material?.dispose();
  }

  function tick() {
    controls.update();
    composer.render();
  }

  // Add a marker at GPS coordinates
  function addMarker(lat: number, lon: number, options: any = {}) {
    const { color = 0xffffff, size = 0.01, height = 0.05 } = options;

    // Create marker geometry (a simple cone pointing outward)
    const geometry = new THREE.ConeGeometry(size, height, 8);
    const material = new THREE.MeshBasicMaterial({ color });
    const marker = new THREE.Mesh(geometry, material);

    // Position at GPS coordinates
    const position = latLonToVector3(lat, lon, 1.01); // Slightly above surface
    marker.position.copy(position);

    // Rotate to point outward
    marker.lookAt(position.clone().multiplyScalar(2));

    scene.add(marker);
    return marker;
  }

  // Add a point at GPS coordinates
  function addPoint(lat: number, lon: number, options: any = {}) {
    const { color = 0xffffff, size = 0.005 } = options;

    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color });
    const point = new THREE.Mesh(geometry, material);

    const position = latLonToVector3(lat, lon, 1.005);
    point.position.copy(position);

    scene.add(point);
    return point;
  }

  // Create population pillars using instanced rendering
  function createPopulationPillars() {
    // Base geometry for pillars (simple box for performance)
    const geometry = new THREE.BoxGeometry(0.005, 15, 0.005);
    // Move pivot to bottom of box
    geometry.translate(0, 0.5, 0);

    // Create instanced mesh
    const material = new THREE.MeshBasicMaterial({
      color: THEME_COLORS[4],
      transparent: true,
      opacity: 0.1,
    });

    const count = population.length;
    const mesh = new THREE.InstancedMesh(geometry, material, count);

    // Temporary objects for calculations
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    // Process each population data point
    population.forEach((item: any, i: number) => {
      const [lat, lon] = item.coords.map(parseFloat);
      const pop = item.population;

      // Get position on globe
      const position = latLonToVector3(lat, lon, 1);
      dummy.position.copy(position);

      // Point outward from globe center
      dummy.lookAt(position.clone().multiplyScalar(10));
      dummy.rotateX(-Math.PI / 2); // Adjust rotation for box orientation

      // Scale based on population (log scale for better visualization)
      dummy.scale.set(Math.log(pop) * 0.5, Math.log(pop) * 0.01, Math.log(pop) * 0.1);

      // Update instance matrix
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Color based on population intensity
      const intensity = pop;
      color.setHSL(0.5 - intensity * 0.5, 11, 0.195); // Cyan to red gradient
      mesh.setColorAt(i, color);
    });

    // Update instance attributes
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    scene.add(mesh);
    return mesh;
  }

  const populationPillars = createPopulationPillars();
  console.log(`Created ${population.length} population pillars`);

  return {
    ctx,
    camera,
    renderer,
    scene,
    globe,
    borders,
    // directionalLight,
    controls,
    composer,
    destroy,
    bloomPass,
    material,
    tick,
    addMarker,
    addPoint,
    latLonToVector3,
  };
}

export function generateRandomCoordinates(total = 100000): Array<[number, number]> {
  const coordinates: Array<[number, number]> = [];

  for (let i = 0; i < total; i++) {
    // Use uniform distribution on sphere
    // Generate random values
    const u = Math.random();
    const v = Math.random();

    // Convert to spherical coordinates for uniform distribution
    const theta = 2 * Math.PI * u; // Longitude: -180 to 180
    const phi = Math.acos(2 * v - 1); // Latitude distribution

    // Convert to lat/lon
    const lat = 90 - (phi * 180) / Math.PI; // -90 to 90
    const lon = (theta * 180) / Math.PI - 180; // -180 to 180

    coordinates.push([lat, lon]);
  }

  return coordinates;
}
