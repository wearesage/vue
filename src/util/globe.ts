import countriesMetadata from "../data/geo/countries-metadata.json";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import population from "../data/geo/users-by-location.json";

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
    // lineWidth: 0.5,
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
    if (!countriesMetadata.base64Positions) {
      console.warn("No fill data available.");
      return null;
    }

    // Decode fill positions
    const base64 = countriesMetadata.base64Positions;
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

export function initGlobe({ canvas, viewport: v }: any) {
  const viewport = v || { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio };
  const ctx = canvas.value.getContext("webgl2", CTX_OPTIONS);
  const camera = new THREE.PerspectiveCamera(45, viewport.width / viewport.height, 0.001, 2000);
  // camera.position.z = Math.PI / 2;
  camera.position.x = 0.1056750061901908;
  camera.position.y = 1.08473043473166818;
  camera.position.z = 1.432277547321116;
  const renderer = new THREE.WebGLRenderer({ context: ctx, ...CTX_OPTIONS });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(viewport.width, viewport.height);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("rgb(0, 0, 0)");
  const ambientLight = new THREE.AmbientLight(new THREE.Color("rgb(0, 45, 133)"), 0.9);
  const directionalLight = new THREE.DirectionalLight("rgb(242, 45, 0)", 1);
  directionalLight.position.set(5, 13, 5);
  scene.add(ambientLight);
  scene.add(directionalLight);
  const geometry = new THREE.SphereGeometry(1, 48, 48);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x000000),
    side: THREE.FrontSide,
  });

  const globe = new THREE.Mesh(geometry, material);
  // globe.opacity = 0.5;
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
    9, // bloom strength
    0.5, // bloom radius
    0.0 // bloom threshold
  );
  composer.addPass(bloomPass);

  const controls = new OrbitControls(camera, canvas.value);
  controls.autoRotate = true;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotateSpeed = 0.025;
  controls.zoomSpeed = 1.5;
  controls.minDistance = 1;
  controls.maxDistance = 15;
  controls.enablePan = true;

  // Store base transform data for efficient updates
  let pillarBaseData: any = [];
  let populationMesh: any = createPopulationPillars();

  function destroy() {
    controls?.dispose();
    renderer?.dispose();
    globe?.geometry?.dispose();
    globe?.material?.dispose();
    borders?.geometry?.dispose();
    borders?.material?.dispose();
    populationMesh?.geometry?.dispose();
    populationMesh?.material?.dispose();
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

  // Create population pillars with stored base data
  function createPopulationPillars() {
    const geometry = new THREE.BoxGeometry(0.0005, 5, 0.0005); // Use unit height
    // geometry.translate(0, -2.5, 0); // Move pivot to bottom

    const material = new THREE.MeshBasicMaterial({
      color: THEME_COLORS[4],
      transparent: true,
      opacity: 1,
    });

    const count = population.length;
    const mesh = new THREE.InstancedMesh(geometry, material, count);

    // Clear and rebuild base data
    pillarBaseData = [];

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    population.forEach((item, i) => {
      const [lat, lon] = item.coords.map(parseFloat);
      const pop = item.users;

      // Get position on globe
      const position = latLonToVector3(lat, lon, 1);
      dummy.position.copy(position);

      // Point outward from globe center
      dummy.lookAt(position.clone().multiplyScalar(2));
      dummy.rotateX(-Math.PI / 2);

      // Store base transform data (without height scaling)
      const baseScale = Math.log(pop) * 0.25;
      dummy.scale.set(baseScale, 1, baseScale); // Y=1 for unit height

      dummy.updateMatrix();

      // Store the base matrix and initial height
      pillarBaseData.push({
        baseMatrix: dummy.matrix.clone(),
        baseScale: baseScale,
        initialHeight: Math.log(pop) * 0.5,
        currentHeight: Math.log(pop) * 0.5,
      });

      // Set initial matrix with proper height
      dummy.scale.y = Math.log(pop) * 0.05;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Set color
      const intensity = pop;
      color.setHSL(0.5 - intensity * 0.2, 10, 0.13);
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    scene.add(mesh);
    return mesh;
  }

  function updatePillarHeights(heightMultipliers: any, options = {} as any) {
    if (!populationMesh || !pillarBaseData.length) return;

    const {
      batchSize = Infinity, // Process all by default
      startIndex = 0,
      animate = false,
      animationSpeed = 0.1,
    } = options;

    const endIndex = Math.min(startIndex + batchSize, pillarBaseData.length);
    let hasChanges = false;

    for (let i = startIndex; i < endIndex; i++) {
      const data = pillarBaseData[i];
      const targetHeight = data.initialHeight * (Array.isArray(heightMultipliers) ? heightMultipliers?.[i] : typeof heightMultipliers === "number" ? heightMultipliers : 1);

      // Smooth animation if requested
      if (animate) {
        const diff = targetHeight - data.currentHeight;
        if (Math.abs(diff) > 0.001) {
          data.currentHeight += diff * animationSpeed;
          hasChanges = true;
        }
      } else {
        if (data.currentHeight !== targetHeight) {
          data.currentHeight = targetHeight;
          hasChanges = true;
        }
      }

      // Update matrix efficiently by modifying the base matrix
      const matrix = data.baseMatrix.clone();

      // Scale the Y component (height) - matrix elements [5] is scaleY in a 4x4 matrix
      matrix.elements[5] = data.currentHeight;

      populationMesh.setMatrixAt(i, matrix);
    }

    // Only trigger update if there were actual changes
    if (hasChanges) {
      populationMesh.instanceMatrix.needsUpdate = true;
    }

    return endIndex < pillarBaseData.length; // Return true if more batches needed
  }

  // Alternative: Direct matrix manipulation for maximum performance
  function updatePillarHeightsDirect(heightMultipliers: any) {
    if (!populationMesh || !pillarBaseData.length) return;

    const matrices = populationMesh.instanceMatrix.array;
    let hasChanges = false;

    for (let i = 0; i < pillarBaseData.length; i++) {
      const data = pillarBaseData[i];
      const targetHeight = data.initialHeight * (Array.isArray(heightMultipliers) ? heightMultipliers?.[i] : typeof heightMultipliers === "number" ? heightMultipliers : 1);

      if (data.currentHeight !== targetHeight) {
        data.currentHeight = targetHeight;

        // Directly modify the matrix array (16 elements per matrix, element 5 is scaleY)
        matrices[i * 16 + 5] = targetHeight;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      populationMesh.instanceMatrix.needsUpdate = true;
    }
  }

  return {
    ctx,
    camera,
    renderer,
    scene,
    globe,
    borders,
    controls,
    composer,
    destroy,
    bloomPass,
    material,
    tick,
    addMarker,
    addPoint,
    latLonToVector3,
    populationMesh,
    updatePillarHeightsDirect,
    updatePillarHeights,
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
