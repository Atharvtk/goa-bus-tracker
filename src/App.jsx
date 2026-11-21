import { useState, useMemo } from 'react'
import routesData from './data/routes.json'
import { useBusTracking } from './hooks/useBusTracking'
import { BusMap } from './components/BusMap'
import { analyseRoute, formatDistance } from './utils/geo'
import {
  Bus,
  Navigation,
  MapPin,
  RotateCw,
  Play,
  Square,
  Radio,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Map,
  Compass,
} from 'lucide-react'

export default function App() {
  const [selectedRouteId, setSelectedRouteId] = useState(routesData[0].id)
  const [isReversed, setIsReversed] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)
  const [selectedStopCenter, setSelectedStopCenter] = useState(null)

  // Find the active route configuration
  const activeRoute = useMemo(() => {
    return routesData.find((r) => r.id === selectedRouteId) || routesData[0]
  }, [selectedRouteId])

  // Compute ordered stops based on direction
  const orderedStops = useMemo(() => {
    if (!isReversed) return activeRoute.stops
    return [...activeRoute.stops].reverse().map((stop, index) => ({
      ...stop,
      sequence: index + 1,
    }))
  }, [activeRoute, isReversed])

  // Tracking hook (Live GPS vs Demo simulation)
  const {
    userPosition,
    isLiveGps,
    isSimulating,
    gpsError,
    startSimulation,
    startLiveGps,
    stopTracking,
  } = useBusTracking(orderedStops)

  // Route progression analysis
  const { nextStop, passedStops, distances, arrivingNow, progress } = useMemo(() => {
    return analyseRoute(userPosition, orderedStops)
  }, [userPosition, orderedStops])

  const nextStopDistance = nextStop && distances[nextStop.id] != null
    ? distances[nextStop.id]
    : null

  const handleStopClick = (stop) => {
    setSelectedStopCenter([stop.latitude, stop.longitude])
  }

  const toggleDirection = () => {
    setIsReversed((prev) => !prev)
    setSelectedStopCenter(null)
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* 1. Header Bar */}
      <header className="bg-emerald-800 text-white px-4 py-3 shadow-md z-30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-700 rounded-lg shadow-inner">
            <Bus className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide flex items-center gap-2">
              Goa Bus Tracker
              <span className="text-xs bg-emerald-600/80 px-2 py-0.5 rounded text-emerald-100 font-normal">
                Live MVP
              </span>
            </h1>
            <p className="text-xs text-emerald-200 hidden sm:block">
              Real-time upcoming stop alerts (Bambolim ⇄ Panjim)
            </p>
          </div>
        </div>

        {/* Route Selector & Reverse Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedRouteId}
            onChange={(e) => {
              setSelectedRouteId(e.target.value)
              setSelectedStopCenter(null)
            }}
            className="flex-1 sm:flex-initial bg-emerald-900/90 text-white text-xs sm:text-sm border border-emerald-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {routesData.map((route) => (
              <option key={route.id} value={route.id} className="bg-slate-900 text-white">
                {route.name}
              </option>
            ))}
          </select>

          <button
            onClick={toggleDirection}
            title="Reverse Route Direction"
            className="flex items-center gap-1 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 active:scale-95 px-3 py-1.5 rounded-lg border border-emerald-500 transition-all text-white shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reverse</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Area: Map + Side Drawer */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 relative h-full w-full">
          {/* A. Floating "Next Stop" Alert Card (Top of Map) */}
          <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-auto sm:w-96 z-20 pointer-events-auto">
            {nextStop ? (
              <div
                className={`p-4 rounded-xl shadow-xl border transition-all duration-300 backdrop-blur-md ${
                  arrivingNow
                    ? 'bg-emerald-900/95 border-emerald-400 text-white ring-4 ring-emerald-400/40 animate-pulse'
                    : 'bg-white/95 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Navigation
                      className={`w-4 h-4 ${
                        arrivingNow ? 'text-emerald-300 animate-spin' : 'text-blue-600'
                      }`}
                    />
                    <span
                      className={`text-xs font-black tracking-wider uppercase ${
                        arrivingNow ? 'text-emerald-300' : 'text-blue-600'
                      }`}
                    >
                      {arrivingNow ? '🚨 Arriving Now!' : 'Next Bus Stop'}
                    </span>
                  </div>

                  {nextStopDistance !== null && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        arrivingNow
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {formatDistance(nextStopDistance)} away
                    </span>
                  )}
                </div>

                <div className="font-bold text-base sm:text-lg leading-tight truncate">
                  {nextStop.name}
                </div>

                {nextStop.landmark && (
                  <p
                    className={`text-xs mt-1 truncate ${
                      arrivingNow ? 'text-emerald-200' : 'text-slate-500'
                    }`}
                  >
                    📍 {nextStop.landmark}
                  </p>
                )}

                {/* Progress bar along the route */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                  <span className={arrivingNow ? 'text-emerald-200' : 'text-slate-500'}>
                    Stop {nextStop.sequence} of {orderedStops.length}
                  </span>
                  <span className={arrivingNow ? 'text-emerald-200' : 'text-slate-500'}>
                    {Math.round(progress * 100)}% route complete
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-md border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Compass className="w-4 h-4 text-slate-400" />
                <span>Start Live GPS or Simulation to detect upcoming stops.</span>
              </div>
            )}
          </div>

          {/* B. Controls Bar (Bottom of Map) */}
          <div className="absolute bottom-4 left-3 right-3 sm:left-6 sm:right-auto z-20 pointer-events-auto flex flex-wrap items-center gap-2">
            {/* Live GPS Button */}
            <button
              onClick={() => {
                if (isLiveGps) stopTracking()
                else startLiveGps()
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-lg border transition-all ${
                isLiveGps
                  ? 'bg-blue-600 border-blue-500 text-white ring-2 ring-blue-300'
                  : 'bg-white/95 border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Radio
                className={`w-4 h-4 ${isLiveGps ? 'animate-pulse text-white' : 'text-blue-600'}`}
              />
              <span>{isLiveGps ? 'Tracking Live GPS' : 'Enable Live GPS'}</span>
            </button>

            {/* Demo Simulation Button */}
            <button
              onClick={() => {
                if (isSimulating) stopTracking()
                else startSimulation()
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-lg border transition-all ${
                isSimulating
                  ? 'bg-emerald-600 border-emerald-500 text-white ring-2 ring-emerald-300'
                  : 'bg-white/95 border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isSimulating ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Demo</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
                  <span>Simulate Trip</span>
                </>
              )}
            </button>

            {/* GPS Error Notification */}
            {gpsError && (
              <div className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-bounce">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{gpsError}</span>
              </div>
            )}
          </div>

          {/* Leaflet Map Component */}
          <BusMap
            stops={orderedStops}
            userPosition={userPosition}
            center={selectedStopCenter}
          />
        </div>

        {/* 3. Stops Timeline Drawer (Mobile Bottom Sheet / Desktop Sidebar) */}
        <aside
          className={`bg-white shadow-2xl border-t md:border-t-0 md:border-l border-slate-200 z-30 transition-all duration-300 flex flex-col ${
            isDrawerOpen
              ? 'h-64 sm:h-72 md:h-full md:w-80 lg:w-96'
              : 'h-12 md:h-full md:w-12'
          }`}
        >
          {/* Drawer Header Toggle */}
          <div
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-emerald-700" />
              <span className={`font-bold text-xs uppercase tracking-wider text-slate-700 ${!isDrawerOpen ? 'md:hidden' : ''}`}>
                Route Stops ({orderedStops.length})
              </span>
            </div>

            <button className="text-slate-500 hover:text-slate-800">
              {isDrawerOpen ? (
                <ChevronDown className="w-4 h-4 md:rotate-90 transition-transform" />
              ) : (
                <ChevronUp className="w-4 h-4 md:-rotate-90 transition-transform" />
              )}
            </button>
          </div>

          {/* Stops List */}
          {isDrawerOpen && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {orderedStops.map((stop) => {
                const isPassed = passedStops?.has(stop.id)
                const isNext = nextStop?.id === stop.id
                const dist = distances[stop.id]

                return (
                  <div
                    key={stop.id}
                    onClick={() => handleStopClick(stop)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                      isNext
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300 shadow-sm'
                        : isPassed
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {/* Status Badge / Icon */}
                    <div className="pt-0.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isNext ? (
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[9px] animate-pulse">
                          {stop.sequence}
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[9px]">
                          {stop.sequence}
                        </div>
                      )}
                    </div>

                    {/* Stop Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`font-semibold truncate ${
                            isNext ? 'text-blue-900 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {stop.name}
                        </span>
                        {dist != null && (
                          <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                            {formatDistance(dist)}
                          </span>
                        )}
                      </div>

                      {stop.landmark && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {stop.landmark}
                        </p>
                      )}

                      {isNext && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          {arrivingNow ? '⚡ ALIGHTING STOP' : 'UPCOMING'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
