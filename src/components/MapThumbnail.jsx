import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';

// Fit bounds helper
const FitBounds = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (!coords || !coords.length) return;
    map.fitBounds(coords, { padding: [10,10], maxZoom: 16 });
  }, [coords, map]);
  return null;
};

const MapThumbnail = ({ coords }) => {
  if (!coords || !coords.length) return null;

  return (
    <div className="map-thumb">
      <MapContainer
        style={{ width: '100%', height: '100%' }}
        center={coords[0]}
        zoom={13}
        dragging={false}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
        whenCreated={(map)=> setTimeout(()=>map.invalidateSize(), 0)}
      >
        {/* Dark tiles for contrast */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {/* Glow effect route: outer faint, inner bright */}
        <Polyline positions={coords} weight={10} color="rgba(255,255,255,0.25)" />
        <Polyline positions={coords} weight={4} color="#ffffff" />
        <FitBounds coords={coords} />
      </MapContainer>
    </div>
  );
};

export default MapThumbnail; 