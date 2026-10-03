import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Map Auto-Bounds Adjuster
function MapAutoBounds({ customerCoords, techCoords }) {
  const map = useMap();

  useEffect(() => {
    if (!customerCoords || !techCoords) return;

    try {
      const bounds = L.latLngBounds([customerCoords, techCoords]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    } catch (err) {
      console.warn('Map bounds fit failed:', err);
    }
  }, [customerCoords, techCoords, map]);

  return null;
}

// Create custom SVG markers using L.divIcon
const createCustomerIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center" style="transform: translate(0, 0);">
        <!-- Pulsing radial ripple -->
        <span class="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-emerald-400 opacity-20" style="animation-duration: 2s;"></span>
        <span class="absolute inline-flex h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-400/30"></span>
        <!-- Outer glass circle -->
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm shadow-md border-2 border-white" style="display: flex; align-items: center; justify-content: center;">
          🏠
        </div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createTechnicianIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center" style="transform: translate(0, 0);">
        <!-- Pulsing radial ripple -->
        <span class="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-indigo-400 opacity-25" style="animation-duration: 1.5s;"></span>
        <span class="absolute inline-flex h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-400/30"></span>
        <!-- Outer glass circle -->
        <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-sm shadow-md border-2 border-white" style="display: flex; align-items: center; justify-content: center;">
          🛵
        </div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Haversine distance helper (in kilometers)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TrackingMap({ customerLat, customerLng, techLat, techLng, lastUpdated, techName = 'Technician' }) {
  const customerCoords = customerLat && customerLng ? [parseFloat(customerLat), parseFloat(customerLng)] : null;
  const techCoords = techLat && techLng ? [parseFloat(techLat), parseFloat(techLng)] : null;

  let distanceKm = null;
  let etaMins = null;
  if (customerCoords && techCoords) {
    distanceKm = calculateDistance(customerCoords[0], customerCoords[1], techCoords[0], techCoords[1]);
    // Assuming 25 km/h average urban speed
    etaMins = Math.max(2, Math.round((distanceKm / 25) * 60));
  }

  const isStale = lastUpdated ? (Date.now() - new Date(lastUpdated).getTime() > 45000) : false;

  if (!customerCoords) {
    return (
      <div className="w-full h-64 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
        <p className="text-slate-500 text-xs font-semibold">Location coordinates unavailable</p>
      </div>
    );
  }

  const center = techCoords || customerCoords;

  return (
    <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
      
      {/* Live ETA & Distance Overlay Banner */}
      {techCoords && (
        <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isStale ? 'bg-amber-400 opacity-75' : 'bg-emerald-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isStale ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span>{techName} is en route</span>
          </div>

          <div className="flex items-center gap-3">
            {distanceKm !== null && (
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 font-extrabold">
                📍 {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} away
              </span>
            )}
            {etaMins !== null && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-extrabold">
                ⏱️ ~{etaMins} mins
              </span>
            )}
            {isStale && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 font-bold text-[11px]">
                ⚠️ Connection Paused
              </span>
            )}
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Customer Marker */}
        <Marker position={customerCoords} icon={createCustomerIcon()} />

        {/* Technician Marker */}
        {techCoords && (
          <>
            <Marker position={techCoords} icon={createTechnicianIcon()} />
            <Polyline
              positions={[customerCoords, techCoords]}
              pathOptions={{ color: '#4f46e5', weight: 4, dashArray: '8, 8', lineCap: 'round' }}
            />
            <MapAutoBounds customerCoords={customerCoords} techCoords={techCoords} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
