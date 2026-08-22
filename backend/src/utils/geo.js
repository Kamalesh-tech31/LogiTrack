/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in kilometers
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Computes an optimal visiting order for the remaining stops using a nearest-neighbor heuristic.
 * Future improvement: Use road-distance (via OSRM) instead of straight-line distance.
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

module.exports = {
  getDistanceFromLatLonInKm,
  computeRouteSequence
};
