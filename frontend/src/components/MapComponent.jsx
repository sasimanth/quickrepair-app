import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default marker icons in Leaflet with bundlers like Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const techIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


const LiveTrackingMap = ({ providerLocation, userLocation, distanceStr }) => {
  const defaultCenter = providerLocation || [37.7749, -122.4194]; // Fallback to SF

  return (
    <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden border-2 border-indigo-100 shadow-inner relative z-0">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {providerLocation && (
          <Marker position={providerLocation} icon={techIcon}>
            <Popup>
              <strong>Technician Location</strong> <br/>
              On the way!
            </Popup>
          </Marker>
        )}

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <strong>Your Service Match Location</strong>
            </Popup>
          </Marker>
        )}

        {providerLocation && userLocation && (
          <Polyline 
            positions={[providerLocation, userLocation]} 
            color="#4f46e5" 
            dashArray="10, 10" 
            weight={3} 
            opacity={0.6}
          />
        )}
      </MapContainer>
      
      {distanceStr && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 font-bold text-sm text-indigo-700 z-[1000] flex flex-col items-center">
            ETA: {Math.floor(parseFloat(distanceStr) * 4) + 10} mins <span className="text-xs text-slate-500 font-medium">({distanceStr} away)</span>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingMap;
