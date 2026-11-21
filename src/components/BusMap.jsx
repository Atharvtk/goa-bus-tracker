import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// BusMap renders an interactive Leaflet map with:
// - OpenStreetMap tiles
// - A smooth route polyline
// - Bus stop pins (sequence numbers) using L.divIcon (no broken PNG assets)
// - A custom pulsing blue user-location marker
export function BusMap({ stops, userPosition, center }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const polylineRef = useRef(null)
  const stopLayerRef = useRef(null)
  const userMarkerRef = useRef(null)

  const [isReady, setIsReady] = useState(false)

  // ---- Initialise the map once -----------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      keyboard: false, // keep focus on the app, not the map
    })

    map.setView([15.477, 73.837], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    mapRef.current = map
    stopLayerRef.current = L.layerGroup().addTo(map)
    polylineRef.current = L.polyline([], {
      color: '#10b981',
      weight: 5,
      opacity: 0.85,
      dashArray: '1, 8',
      lineCap: 'round',
    }).addTo(map)

    setIsReady(true)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // ---- Draw the route polyline + stop markers --------------------------
  useEffect(() => {
    if (!mapRef.current || !polylineRef.current || !stopLayerRef.current) return

    const map = mapRef.current
    const coords = stops.map((s) => [s.latitude, s.longitude])

    polylineRef.current.setLatLngs(coords)

    // Clear old stop markers.
    stopLayerRef.current.clearLayers()

    stops.forEach((stop) => {
      const icon = L.divIcon({
        className: 'bus-stop-icon',
        html: `
          <div class="bus-stop-pin">
            <span class="bus-stop-num">${stop.sequence}</span>
          </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })

      const marker = L.marker([stop.latitude, stop.longitude], { icon })
      marker.bindPopup(`
        <div class="stop-popup">
          <div class="stop-popup__seq">Stop ${stop.sequence}</div>
          <div class="stop-popup__name">${stop.name}</div>
          <div class="stop-popup__landmark">${stop.landmark}</div>
        </div>
      `)
      marker.addTo(stopLayerRef.current)
    })
  }, [stops])

  // ---- User location marker --------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    if (!userPosition) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current)
        userMarkerRef.current = null
      }
      return
    }

    const userIcon = L.divIcon({
      className: 'user-location-icon',
      html: `
        <div class="user-pulse-marker">
          <div class="user-pulse-dot"></div>
        </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userPosition)
      userMarkerRef.current.setIcon(userIcon)
    } else {
      userMarkerRef.current = L.marker(userPosition, {
        icon: userIcon,
        keyboard: false,
      })
        .addTo(map)
        .bindPopup('You are here')
    }
  }, [userPosition])

  // ---- Recenter / pan when the active route or user moves --------------
  useEffect(() => {
    if (!mapRef.current || !isReady) return
    const map = mapRef.current

    const target = userPosition || (stops.length ? [stops[0].latitude, stops[0].longitude] : null)
    if (!target) return

    // Pan smoothly (no zoom change) so the map follows the passenger.
    map.panTo(target, { animate: true, duration: 0.6 })
  }, [userPosition, stops, isReady, center])

  return (
    <div
      ref={containerRef}
      className="bus-map w-full h-full min-h-[350px] relative z-0"
      role="application"
      aria-label="Bus route map"
    />
  )
}