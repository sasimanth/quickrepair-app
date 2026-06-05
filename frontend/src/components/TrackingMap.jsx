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

export default function TrackingMap({ customerLat, customerLng, techLat, techLng }) {
  const customerCoords = customerLat && customerLng ? [parseFloat(customerLat), parseFloat(customerLng)] : null;
  const techCoords = techLat && techLng ? [parseFloat(techLat), parseFloat(techLng)] : null;

  if (!customerCoords) {
    return (
      <div className="w-full h-64 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-205">
        <p className="text-slate-500 text-xs font-semibold">Location coordinates unavailable</p>
      </div>
    );
  }

  const center = techCoords || customerCoords;

  return (
    <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
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
