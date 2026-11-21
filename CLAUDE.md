# Goa Bus Tracker (Bambolim ⇄ Panjim)

## Project Overview
A responsive web application for bus travelers in Goa. As the passenger travels on a bus between Bambolim and Panjim, the app tracks their real-time location and dynamically highlights upcoming bus stops, showing remaining distance in meters/kilometers.

## Tech Stack
- **Framework**: Vite + React
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Map Library**: Leaflet (`leaflet` and `leaflet/dist/leaflet.css`)
- **Icons**: `lucide-react`
- **Data**: `src/data/routes.json` (contains actual Bambolim-Panjim routes, stops, coordinates, and sequence)

## Key Project Rules
- Leaflet map icons need default icon fix or custom `L.divIcon` to avoid broken Leaflet PNG icon paths in Vite.
- Always support both **Live GPS Tracking** (`navigator.geolocation.watchPosition`) AND a **Demo / Simulation Mode** (so users can test on a desktop or when not sitting on a bus).
- Use the Haversine formula to compute distance between the user position and each bus stop.
- Automatically identify the **Active Route**, determine which stops are **Passed**, which stop is **Next (Upcoming)**, and list **Remaining Stops**.
