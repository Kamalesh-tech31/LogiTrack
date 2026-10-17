const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (R * c).toFixed(2)
}

const estimateDeliveryTime = (distance) => {
  const averageSpeed = 30
  const hours = distance / averageSpeed
  return Math.ceil(hours)
}

const interpolateRoute = (start, end, steps = 5) => {
  const route = [start]
  for (let i = 1; i < steps; i++) {
    const lat = start.lat + ((end.lat - start.lat) * i) / steps
    const lng = start.lng + ((end.lng - start.lng) * i) / steps
    route.push({ lat, lng })
  }
  route.push(end)
  return route
}

module.exports = {
  calculateDistance,
  estimateDeliveryTime,
  interpolateRoute,
}
