# Goa Bus Tracker 🚌📍

A real-time web application for bus travelers in Goa. As passengers travel between Bambolim and Panjim, the app tracks their location and dynamically highlights upcoming bus stops with remaining distance, alerts, and map navigation.

---

## 🌟 Key Features

- **Interactive Leaflet & OpenStreetMap Navigation:** Clean map view plotting Goa routes with custom numbered bus stop pins and polylines.
- **Dynamic "Next Stop" Detection:** Uses the Haversine formula to compute distance from the passenger to every bus stop along the active route.
- **🚨 Arriving Now Alerts:** High-visibility pulsing alert triggered when within 100 meters of the upcoming bus stop.
- **Demo Trip Simulation:** Built-in simulator allows testing and demonstration on desktop or without traveling on a bus.
- **Live GPS Tracking:** Native HTML5 Geolocation API (`watchPosition`) with high accuracy for on-road mobile usage.
- **Multiple Routes & Reversible Directions:**
  - Route 1: NH66 Highway Route (GMC Bambolim ➔ Santa Cruz ➔ Merces ➔ Patto ➔ Panjim KTC).
  - Route 2: Taleigao / St. Inez Route (GMC ➔ Goa University ➔ Taleigao ➔ Tonca ➔ St. Inez ➔ Panjim Market ➔ Church Square ➔ Panjim KTC).
  - One-click direction reverser (Bambolim ➔ Panaji or Panaji ➔ Bambolim).
- **Stops Timeline Drawer:** Collapsible sheet showing past stops (checked off), next upcoming stop, and remaining route stops.

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Mapping:** Leaflet.js + OpenStreetMap (No API keys required)
- **Icons:** Lucide React

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) installed.

### Installation
```bash
# Clone the repository
git clone https://github.com/2314-Atharv/goa-smart-taxi-meter.git

# Navigate into the project folder
cd goa-smart-taxi-meter

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🗺️ Adding New Routes & Stops

All route and stop information is stored in `src/data/routes.json`. To add a new stop or route, edit the JSON file:

```json
{
  "id": "stop-id",
  "name": "Bus Stop Name",
  "landmark": "Nearby Landmark",
  "latitude": 15.4616,
  "longitude": 73.8560,
  "sequence": 1
}
```
