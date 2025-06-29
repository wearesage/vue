import { ref, watch, onUnmounted } from "vue";
import { useSocketCore } from "../../stores/socket-core";
import { useUserState } from "../../stores/user-state";

interface GlobalActiveData {
  totalUsers: number;
  coordinates: ArrayBuffer; // ULTRA-PACKED 8-BIT COORDINATES (4 per float)! 💀🔥
  coordinateCount: number;
  packedFloatCount: number;
  activities: Record<string, number>;
  lastUpdated: number;
}

/**
 * BLAZING FAST Global Active Users - Direct from Active Space Service! ⚡
 * No aggregate space complexity, just pure speed!
 */
export function useGlobalActiveUsers() {
  const userState = useUserState();
  const socket = useSocketCore();
  
  // State
  const totalUsers = ref(0);
  const locations = ref<Array<{ lat: number; lng: number }>>([]);
  const activities = ref<Record<string, number>>({});
  const joined = ref(false);

  // Global update handler reference for proper cleanup
  let globalUpdateHandler: ((data: GlobalActiveData) => void) | null = null;

  // Only listen for updates when on homepage (PROPER subscription management!)
  watch(
    () => userState.isOnHomepage,
    (isOnHomepage) => {
      if (isOnHomepage && socket.connected) {
        // Join homepage room for direct active space broadcasts
        socket.emit('homepage:join');
        
        // Subscribe to global updates ONLY when on homepage! 🔥
        globalUpdateHandler = (data: GlobalActiveData) => {
          // Defensive check - server should NEVER send null but let's be safe
          if (!data) {
            console.warn('⚠️💀 Received null data in global update! Server bug detected!');
            return;
          }
          
          // Handle empty coordinates case (when no users have coordinates)
          if (data.coordinateCount === 0 && data.packedFloatCount === 0) {
            totalUsers.value = data.totalUsers;
            locations.value = [];
            activities.value = data.activities;
            console.log(`⚡💀 No coordinates to unpack: ${data.totalUsers} users online`);
            return;
          }
          
          if (typeof data.totalUsers !== 'number' || !(data.coordinates instanceof ArrayBuffer) || typeof data.coordinateCount !== 'number' || typeof data.packedFloatCount !== 'number') {
            console.warn('⚠️💀 Invalid global update data:', data);
            return;
          }
          
          totalUsers.value = data.totalUsers;
          
          // 💀🔥💀 UNPACK THE ULTIMATE 8-BIT MADNESS! 💀🔥💀
          const ultraPackedFloats = new Float32Array(data.coordinates);
          
          // Process ULTRA-PACKED 8-bit coordinates (4 coordinate pairs per float!)
          const processedLocations: Array<{ lat: number; lng: number }> = [];
          const unpackBuffer = new ArrayBuffer(4);
          const floatView = new Float32Array(unpackBuffer);
          const intView = new Uint32Array(unpackBuffer);
          
          // Each pair of floats contains 4 coordinate pairs!
          for (let i = 0; i < ultraPackedFloats.length; i += 2) {
            // UNPACK FIRST FLOAT: [lat1(8)|lng1(8)|lat2(8)|lng2(8)]
            floatView[0] = ultraPackedFloats[i];
            const packed1 = intView[0];
            
            const quantLat1 = (packed1 >>> 24) & 0xFF;  // Upper 8 bits
            const quantLng1 = (packed1 >>> 16) & 0xFF;  // Next 8 bits  
            const quantLat2 = (packed1 >>> 8) & 0xFF;   // Next 8 bits
            const quantLng2 = packed1 & 0xFF;           // Lower 8 bits
            
            // UNPACK SECOND FLOAT: [lat3(8)|lng3(8)|lat4(8)|lng4(8)]
            const packed2 = i + 1 < ultraPackedFloats.length ? (() => {
              floatView[0] = ultraPackedFloats[i + 1];
              return intView[0];
            })() : 0;
            
            const quantLat3 = (packed2 >>> 24) & 0xFF;
            const quantLng3 = (packed2 >>> 16) & 0xFF;
            const quantLat4 = (packed2 >>> 8) & 0xFF;
            const quantLng4 = packed2 & 0xFF;
            
            // DEQUANTIZE: 8-bit → lat/lng coordinates
            const coords = [
              { lat: quantLat1, lng: quantLng1 },
              { lat: quantLat2, lng: quantLng2 },
              { lat: quantLat3, lng: quantLng3 },
              { lat: quantLat4, lng: quantLng4 }
            ];
            
            coords.forEach(coord => {
              // Skip padded zeros
              if (coord.lat === 0 && coord.lng === 0) return;
              
              const lat = (coord.lat * 180 / 255) - 90;   // 0-255 → -90/90
              const lng = (coord.lng * 360 / 255) - 180;  // 0-255 → -180/180
              
              processedLocations.push({ lat, lng });
            });
          }
          
          // Trim to actual coordinate count (remove padding)
          locations.value = processedLocations.slice(0, data.coordinateCount);
          activities.value = data.activities;
          
          const payloadSize = data.coordinates.byteLength;
          const originalSize = data.coordinateCount * 8; // What it would be with 2 floats per point
          const savings = ((originalSize - payloadSize) / originalSize * 100).toFixed(1);
          const coordsPerFloat = data.coordinateCount / data.packedFloatCount;
          
          console.log(`⚡💀🔥 UNPACKED ULTRA 8-BIT MADNESS: ${data.totalUsers} users, ${data.coordinateCount} coords in ${data.packedFloatCount} floats (${coordsPerFloat.toFixed(1)} coords/float), ${payloadSize} bytes (${savings}% savings!)`);
        };
        
        socket.on('active-space:global-update', globalUpdateHandler);
        joined.value = true;
        console.log('🏠⚡ Joined homepage room AND subscribed to global updates!');
      } else if (joined.value) {
        // Leave homepage room AND unsubscribe properly! 🧹
        socket.emit('homepage:leave');
        
        if (globalUpdateHandler) {
          socket.off('active-space:global-update', globalUpdateHandler);
          globalUpdateHandler = null;
          console.log('🧹💀 Unsubscribed from global updates - no memory leaks!');
        }
        
        joined.value = false;
        console.log('🚪 Left homepage room');
      }
    },
    { immediate: true }
  );

  // Handle socket reconnection (PROPER subscription management!)
  watch(
    () => socket.connected,
    (connected) => {
      if (connected && userState.isOnHomepage && !joined.value) {
        // Rejoin room and re-subscribe on reconnection
        socket.emit('homepage:join');
        
        if (!globalUpdateHandler) {
          // Re-create handler if it doesn't exist
          globalUpdateHandler = (data: GlobalActiveData) => {
            if (!data) {
              console.warn('⚠️💀 Received null data in global update! Server bug detected!');
              return;
            }
            
            // Handle empty coordinates case (when no users have coordinates)
            if (data.coordinateCount === 0 && data.packedFloatCount === 0) {
              totalUsers.value = data.totalUsers;
              locations.value = [];
              activities.value = data.activities;
              console.log(`⚡💀 RECONNECT: No coordinates to unpack: ${data.totalUsers} users online`);
              return;
            }
            
            if (typeof data.totalUsers !== 'number' || !(data.coordinates instanceof ArrayBuffer) || typeof data.coordinateCount !== 'number' || typeof data.packedFloatCount !== 'number') {
              console.warn('⚠️💀 Invalid global update data:', data);
              return;
            }
            
            totalUsers.value = data.totalUsers;
            
            // 💀🔥💀 UNPACK THE ULTIMATE 8-BIT MADNESS! (RECONNECTION VERSION)
            const ultraPackedFloats = new Float32Array(data.coordinates);
            const processedLocations: Array<{ lat: number; lng: number }> = [];
            const unpackBuffer = new ArrayBuffer(4);
            const floatView = new Float32Array(unpackBuffer);
            const intView = new Uint32Array(unpackBuffer);
            
            for (let i = 0; i < ultraPackedFloats.length; i += 2) {
              floatView[0] = ultraPackedFloats[i];
              const packed1 = intView[0];
              
              const coords = [
                { lat: (packed1 >>> 24) & 0xFF, lng: (packed1 >>> 16) & 0xFF },
                { lat: (packed1 >>> 8) & 0xFF, lng: packed1 & 0xFF }
              ];
              
              if (i + 1 < ultraPackedFloats.length) {
                floatView[0] = ultraPackedFloats[i + 1];
                const packed2 = intView[0];
                coords.push(
                  { lat: (packed2 >>> 24) & 0xFF, lng: (packed2 >>> 16) & 0xFF },
                  { lat: (packed2 >>> 8) & 0xFF, lng: packed2 & 0xFF }
                );
              }
              
              coords.forEach(coord => {
                if (coord.lat === 0 && coord.lng === 0) return;
                processedLocations.push({
                  lat: (coord.lat * 180 / 255) - 90,
                  lng: (coord.lng * 360 / 255) - 180
                });
              });
            }
            
            locations.value = processedLocations.slice(0, data.coordinateCount);
            activities.value = data.activities;
            
            const payloadSize = data.coordinates.byteLength;
            const originalSize = data.coordinateCount * 8;
            const savings = ((originalSize - payloadSize) / originalSize * 100).toFixed(1);
            
            console.log(`⚡💀🔥 RECONNECT ULTRA UNPACK: ${data.totalUsers} users, ${payloadSize} bytes (${savings}% savings!)`);
          };
        }
        
        socket.on('active-space:global-update', globalUpdateHandler);
        joined.value = true;
        console.log('🔌⚡ Socket reconnected - rejoined homepage room and re-subscribed!');
      }
    }
  );

  // Clean up on unmount (prevents ghost listeners and memory leaks!)
  onUnmounted(() => {
    if (joined.value) {
      socket.emit('homepage:leave');
      
      if (globalUpdateHandler) {
        socket.off('active-space:global-update', globalUpdateHandler);
        globalUpdateHandler = null;
        console.log('🧹💀 Unsubscribed from global updates on unmount');
      }
      
      joined.value = false;
      console.log('🧹 Cleaned up homepage room on component unmount');
    }
  });

  return {
    totalUsers,
    locations,
    activities,
    joined,
  };
}