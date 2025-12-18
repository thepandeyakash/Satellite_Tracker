# 🛰️ Satellite Tracker

A real-time satellite tracking dashboard that visualizes satellite positions on an interactive map based on a user-defined observer location.

---

## Features
- Track satellites in real time on a world map
- Set observer location (latitude, longitude, altitude)
- View satellites currently above the observer
- Live position updates with smooth marker movement
- Follow / untrack satellite mode
- Display live satellite data (lat, lng, altitude, speed)
- Polling pauses automatically when the browser tab is inactive

---

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS
- Leaflet / React-Leaflet
- Node.js + Express (API proxy)
- N2YO Satellite API

---

## Architecture Notes
- Satellite tracking logic is extracted into a custom React hook
- Global state (observer, selected satellite) is handled via React Context
- Backend proxy is used to handle CORS and protect the API key
- Polling is optimized to reduce unnecessary network requests

---

## Running Locally

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
npm install
npm run dev
```
