// Distance & upcoming-stop analysis for the Goa Bus Tracker.
// Uses the Haversine formula for great-circle distance and a
// perpendicular-distance projection onto the route polyline to decide
// which stops have been passed, which is the next upcoming stop, and
// how far ahead the remaining stops are.

const EARTH_RADIUS_M = 6371000 // metres
const ARRIVING_THRESHOLD_M = 100 // "Arriving Now!" when within this distance

// Haversine distance in metres between two [lat, lng] points.
export function haversineMeters(a, b) {
  const [lat1, lon1] = a
  const [lat2, lon2] = b
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const la1 = toRad(lat1)
  const la2 = toRad(lat2)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(2)} km`
}

// Distance from point p to the segment a-b (perpendicular distance, in metres).
function pointToSegmentMeters(p, a, b) {
  const [plat, plng] = p
  const [alat, alng] = a
  const [blat, blng] = b

  const dx = blng - alng
  const dy = plat - alat
  const ex = plng - alng
  const ey = plat - alat

  // Treat lat/lng as planar for the short segments involved here; the
  // projection is only used to pick the nearest point along the route.
  const segLen2 = dx * dx + dy * dy
  let t = 0
  if (segLen2 > 0) {
    t = Math.max(0, Math.min(1, (ex * dx + ey * dy) / segLen2))
  }

  const projLat = alat + t * dy
  const projLng = alng + t * dx
  return haversineMeters([plat, plng], [projLat, projLng])
}

// Analyse the user's position against an ordered list of stops.
// Returns:
//   - nextStop: the stop object the user is heading toward (or null)
//   - passedStops: ids of stops the user has already passed
//   - remainingStops: stops still ahead of the user
//   - distances: map of stop id -> distance in metres from user
//   - arrivingNow: bool, user is within ARRIVING_THRESHOLD_M of nextStop
//   - progress: 0..1 fraction of route travelled
export function analyseRoute(userPosition, stops) {
  if (!userPosition || !stops || stops.length === 0) {
    return {
      nextStop: null,
      passedStops: new Set(),
      remainingStops: [],
      distances: {},
      arrivingNow: false,
      progress: 0,
    }
  }

  const coords = stops.map((s) => [s.latitude, s.longitude])
  const distances = {}

  // Distance from user to each stop directly.
  stops.forEach((stop) => {
    distances[stop.id] = haversineMeters(userPosition, [stop.latitude, stop.longitude])
  })

  // Walk the polyline to find the segment the user is currently on and
  // how far along it they are. This determines which stops are "passed".
  let bestSegIndex = -1
  let bestDist = Infinity
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointToSegmentMeters(userPosition, coords[i], coords[i + 1])
    if (d < bestDist) {
      bestDist = d
      bestSegIndex = i
    }
  }

  // All stops up to and including the end of the current segment are passed.
  const passed = new Set()
  const passedCount = Math.max(0, bestSegIndex + 1)

  // If the user is very close to the final stop, everything is passed.
  let effectivePassed = passedCount
  if (bestSegIndex === -1) {
    // User is closest to the first point — nothing passed yet unless they
    // are actually past it along the route direction.
    effectivePassed = 0
  }

  for (let i = 0; i < effectivePassed; i++) {
    passed.add(stops[i].id)
  }

  // Determine the next upcoming stop: the first stop not passed.
  let nextStop = null
  for (let i = 0; i < stops.length; i++) {
    if (!passed.has(stops[i].id)) {
      nextStop = stops[i]
      break
    }
  }

  // If every stop is passed but the user is still near the route, treat the
  // final stop as the next one so the UI stays coherent.
  if (!nextStop) {
    nextStop = stops[stops.length - 1]
  }

  const remainingStops = stops.filter((s) => !passed.has(s.id))

  const arrivingNow =
    nextStop !== null && distances[nextStop.id] <= ARRIVING_THRESHOLD_M

  // Progress: fraction of stops passed, clamped 0..1.
  const progress = Math.min(1, passed.size / Math.max(1, stops.length - 1))

  return {
    nextStop,
    passedStops: passed,
    remainingStops,
    distances,
    arrivingNow,
    progress,
    arrivingThresholdM: ARRIVING_THRESHOLD_M,
  }
}