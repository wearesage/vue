import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load GeoJSON data
const countriesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/utility/ne_110m_admin_0_countries.json'), 'utf8')
);

// Convert lat/lon to 3D position on sphere
function latLonToVector3(lat, lon, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return { x, y, z };
}

// Process all countries and convert to binary format
function preprocessCountries() {
  const positions = [];
  const metadata = {
    version: 1,
    vertexCount: 0,
    countries: []
  };
  
  let currentIndex = 0;
  
  // Process each country
  countriesData.features.forEach((feature) => {
    const countryData = {
      name: feature.properties.NAME,
      code: feature.properties.ADM0_A3,
      startIndex: currentIndex,
      vertexCount: 0
    };
    
    if (feature.geometry.type === 'Polygon') {
      processPolygon(feature.geometry.coordinates, positions);
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => {
        processPolygon(polygon, positions);
      });
    }
    
    countryData.vertexCount = positions.length - currentIndex;
    currentIndex = positions.length;
    
    if (countryData.vertexCount > 0) {
      metadata.countries.push(countryData);
    }
  });
  
  metadata.vertexCount = positions.length / 3;
  
  // Convert positions to Float32Array
  const positionsArray = new Float32Array(positions);
  
  // Save binary data
  const binaryPath = path.join(__dirname, '../src/data/utility/countries-binary.bin');
  fs.writeFileSync(binaryPath, Buffer.from(positionsArray.buffer));
  
  // Also save as base64 in JSON for easier importing
  const base64Data = Buffer.from(positionsArray.buffer).toString('base64');
  metadata.base64Positions = base64Data;
  
  // Save metadata as JSON
  const metadataPath = path.join(__dirname, '../src/data/utility/countries-metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
  console.log(`Preprocessed ${metadata.countries.length} countries`);
  console.log(`Total vertices: ${metadata.vertexCount}`);
  console.log(`Binary size: ${(positionsArray.buffer.byteLength / 1024).toFixed(2)} KB`);
  console.log(`Original size: ${(fs.statSync(path.join(__dirname, '../src/data/utility/ne_110m_admin_0_countries.json')).size / 1024).toFixed(2)} KB`);
}

// Process polygon coordinates
function processPolygon(coordinates, positions) {
  coordinates.forEach(ring => {
    for (let i = 0; i < ring.length - 1; i++) {
      const [lon1, lat1] = ring[i];
      const [lon2, lat2] = ring[i + 1];
      
      // Add line segment (2 vertices)
      const v1 = latLonToVector3(lat1, lon1, 1.001);
      const v2 = latLonToVector3(lat2, lon2, 1.001);
      
      positions.push(v1.x, v1.y, v1.z);
      positions.push(v2.x, v2.y, v2.z);
    }
  });
}

// Run preprocessing
preprocessCountries();