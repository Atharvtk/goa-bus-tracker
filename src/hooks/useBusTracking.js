import { useState, useEffect, useCallback, useRef } from 'react'

// Live GPS tracking hook with a demo simulation fallback.
// - Simulation: advances a virtual passenger along the route stops every 3s.
// - Live GPS: uses navigator.geolocation.watchPosition with high accuracy.
export function useBusTracking(stops) {
  const [userPosition, setUserPosition] = useState(null)
  const [isLiveGps, setIsLiveGps] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationIndex, setSimulationIndex] = useState(0)
  const [gpsError, setGpsError] = useState(null)

  const watchIdRef = useRef(null)
  const simTimerRef = useRef(null)
  const stopsRef = useRef(stops)

  // Keep the latest stops in a ref so the simulation interval can read them
  // without being re-armed on every render.
  useEffect(() => {
    stopsRef.current = stops
  }, [stops])

  // ---- Simulation mode -------------------------------------------------
  useEffect(() => {
    if (!isSimulating) {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current)
        simTimerRef.current = null
      }
      return
    }

    // Start the virtual passenger at the first stop.
    setUserPosition(
      stops.length > 0
        ? [stops[0].latitude, stops[0].longitude]
        : null
    )
    setSimulationIndex(0)

    simTimerRef.current = setInterval(() => {
      setSimulationIndex((prev) => {
        const next = prev + 1
        if (next >= stopsRef.current.length) {
          // Loop back to the start so the demo can run continuously.
          setUserPosition(
            stopsRef.current.length > 0
              ? [
                  stopsRef.current[0].latitude,
                  stopsRef.current[0].longitude,
                ]
              : null
          )
          return 0
        }
        const stop = stopsRef.current[next]
        setUserPosition([stop.latitude, stop.longitude])
        return next
      })
    }, 3000)

    return () => {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current)
        simTimerRef.current = null
      }
    }
  }, [isSimulating, stops])

  // ---- Live GPS mode ----------------------------------------------------
  useEffect(() => {
    if (!isLiveGps) {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.')
      return
    }

    setGpsError(null)

    const handleSuccess = (pos) => {
      setUserPosition([pos.coords.latitude, pos.coords.longitude])
      setGpsError(null)
    }

    const handleError = (err) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setGpsError('Location permission denied. Enable GPS or use Demo mode.')
          break
        case err.POSITION_UNAVAILABLE:
          setGpsError('Location information is unavailable.')
          break
        case err.TIMEOUT:
          setGpsError('Location request timed out.')
          break
        default:
          setGpsError('Unable to retrieve location.')
      }
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [isLiveGps])

  // ---- Toggle actions ---------------------------------------------------
  const startSimulation = useCallback(() => {
    setIsLiveGps(false)
    setIsSimulating(true)
  }, [])

  const startLiveGps = useCallback(() => {
    setIsSimulating(false)
    setIsLiveGps(true)
  }, [])

  const stopTracking = useCallback(() => {
    setIsLiveGps(false)
    setIsSimulating(false)
  }, [])

  return {
    userPosition,
    isLiveGps,
    isSimulating,
    simulationIndex,
    gpsError,
    startSimulation,
    startLiveGps,
    stopTracking,
  }
}