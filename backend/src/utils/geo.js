/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in kilometers
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    isNaN(Number(lat1)) ||
    isNaN(Number(lon1)) ||
    isNaN(Number(lat2)) ||
    isNaN(Number(lon2))
  ) {
    return Infinity;
  }

  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (nLat1 === nLat2 && nLon1 === nLon2) {
    return 0;
  }

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(nLat2 - nLat1);
  const dLon = deg2rad(nLon2 - nLon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(nLat1)) * Math.cos(deg2rad(nLat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Computes an optimal visiting order for the remaining stops using a nearest-neighbor heuristic with Haversine distance.
 * 
 * @param {{lat: number, lng: number}} currentLocation 
 * @param {Array<{id: string, lat: number, lng: number}>} stops 
 * @returns {Array<string>} Array of stop IDs in optimal order
 */
function computeRouteSequence(currentLocation, stops) {
  const unvisited = [...stops];
  const sequence = [];
  let currentLat = currentLocation.lat;
  let currentLng = currentLocation.lng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const stop = unvisited[i];
      const dist = getDistanceFromLatLonInKm(currentLat, currentLng, stop.lat, stop.lng);
      if (dist < shortestDistance) {
        shortestDistance = dist;
        nearestIndex = i;
      }
    }

    const nearestStop = unvisited.splice(nearestIndex, 1)[0];
    sequence.push(nearestStop.id);
    currentLat = nearestStop.lat;
    currentLng = nearestStop.lng;
  }

  return sequence;
}

/**
 * Computes an optimal visiting order for stops using actual ROAD distances from OSRM table matrix.
 * Step 1: currentLocation (Warehouse or current customer) -> nearest unvisited customer by road distance
 * Step 2: that customer -> nearest remaining customer by road distance
 * Step 3: repeat dynamically from each newly selected customer location
 *
 * @param {{lat: number, lng: number}} currentLocation
 * @param {Array<{id: string, lat: number, lng: number}>} stops
 * @returns {Promise<Array<string>>} Array of stop IDs in optimal road-network order
 */
async function computeRouteSequenceRoad(currentLocation, stops) {
  if (!stops || stops.length <= 1) {
    return (stops || []).map((s) => s.id);
  }

  // Filter valid coordinates
  const validStops = stops.filter(
    (s) =>
      s.lat != null &&
      s.lng != null &&
      !isNaN(Number(s.lat)) &&
      !isNaN(Number(s.lng)),
  );

  if (validStops.length === 0) {
    return stops.map((s) => s.id);
  }

  const allPoints = [
    { lat: Number(currentLocation.lat), lng: Number(currentLocation.lng) },
    ...validStops,
  ];
  const coordString = allPoints.map((p) => `${p.lng},${p.lat}`).join(";");

  try {
    const url = `https://router.project-osrm.org/table/v1/driving/${coordString}?annotations=distance`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();

    if (data.code === "Ok" && Array.isArray(data.distances)) {
      const distances = data.distances;
      const unvisitedIndices = validStops.map((_, i) => i + 1); // 1-indexed (0 is origin)
      const sequence = [];
      let currentIndex = 0; // Starts from origin (Warehouse or current Customer)

      while (unvisitedIndices.length > 0) {
        let nearestTargetIndex = unvisitedIndices[0];
        let shortestDist = Infinity;

        for (const idx of unvisitedIndices) {
          const d = distances[currentIndex]?.[idx];
          const distVal =
            typeof d === "number" && !isNaN(d) ? d : Infinity;
          if (distVal < shortestDist) {
            shortestDist = distVal;
            nearestTargetIndex = idx;
          }
        }

        const removedPos = unvisitedIndices.indexOf(nearestTargetIndex);
        if (removedPos !== -1) {
          unvisitedIndices.splice(removedPos, 1);
        }

        const chosenStop = validStops[nearestTargetIndex - 1];
        sequence.push(chosenStop.id);
        currentIndex = nearestTargetIndex; // Move current location to that customer for next calculation!
      }

      // Append any stops that had missing/invalid coordinates
      const addedIds = new Set(sequence);
      for (const s of stops) {
        if (!addedIds.has(s.id)) sequence.push(s.id);
      }

      return sequence;
    }
  } catch (err) {
    console.warn(
      "[Geo] OSRM road distance table calculation fallback to Haversine:",
      err.message,
    );
  }

  // Graceful fallback to nearest neighbor Haversine
  return computeRouteSequence(currentLocation, stops);
}

module.exports = {
  getDistanceFromLatLonInKm,
  computeRouteSequence,
  computeRouteSequenceRoad,
};
