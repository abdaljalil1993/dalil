import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import type { Business } from '@/api/types';
import { useLocalName } from '@/i18n';

const pin = (color = '#5B3DF5', featured = false) =>
  L.divIcon({
    className: '',
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
    html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg"><path d="M17 1C8.2 1 1 7.9 1 16.4 1 28.3 17 43 17 43s16-14.7 16-26.6C33 7.9 25.8 1 17 1z" fill="${featured ? '#FF6A3D' : color}" stroke="#fff" stroke-width="2"/><circle cx="17" cy="16" r="6" fill="#fff"/></svg>`,
  });

const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 15);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
};

const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; OpenStreetMap';

/** Map of businesses with clickable markers (OpenStreetMap - free, no API key). */
export const BusinessesMap = ({ businesses, height = 520, center = [34.8, 36.6] as [number, number] }: { businesses: Business[]; height?: number | string; center?: [number, number] }) => {
  const ln = useLocalName();
  const withCoords = businesses.filter((b) => b.latitude != null && b.longitude != null);
  const points = useMemo(() => withCoords.map((b) => [b.latitude!, b.longitude!] as [number, number]), [withCoords]);
  return (
    <Box sx={{ height, borderRadius: 4, overflow: 'hidden', border: (t) => `1px solid ${t.custom.border}` }}>
      <MapContainer center={points[0] || center} zoom={points.length ? 13 : 7} scrollWheelZoom style={{ height: '100%' }}>
        <TileLayer url={OSM} attribution={ATTR} />
        <FitBounds points={points} />
        {withCoords.map((b) => (
          <Marker key={b.id} position={[b.latitude!, b.longitude!]} icon={pin(b.category?.color || undefined, b.isFeatured)}>
            <Popup>
              <Box sx={{ minWidth: 180 }}>
                <Typography fontWeight={700} component={Link} to={`/b/${b.slug}`} sx={{ color: '#5B3DF5' }}>{ln(b)}</Typography>
                <Typography variant="body2" color="text.secondary">{ln(b.subCategory) || ln(b.category)}</Typography>
                <Typography variant="body2">★ {b.averageRating.toFixed(1)} · {b.district || ln(b.city)}</Typography>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export const SingleLocationMap = ({ lat, lng, color, height = 260 }: { lat: number; lng: number; color?: string | null; height?: number }) => (
  <Box sx={{ height, borderRadius: 3, overflow: 'hidden' }}>
    <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ height: '100%' }}>
      <TileLayer url={OSM} attribution={ATTR} />
      <Marker position={[lat, lng]} icon={pin(color || undefined)} />
    </MapContainer>
  </Box>
);

const ClickHandler = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
  useMapEvents({ click: (e) => onPick(Number(e.latlng.lat.toFixed(7)), Number(e.latlng.lng.toFixed(7))) });
  return null;
};

const Recenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], Math.max(map.getZoom(), 14)); }, [lat, lng, map]);
  return null;
};

/** Click-to-pick location (used in the business editor). */
export const LocationPicker = ({ lat, lng, fallback, onChange, height = 360 }: { lat?: number | null; lng?: number | null; fallback?: [number, number]; onChange: (lat: number, lng: number) => void; height?: number }) => {
  const has = lat != null && lng != null;
  const center: [number, number] = has ? [lat!, lng!] : fallback || [34.8, 36.6];
  return (
    <Box sx={{ height, borderRadius: 3, overflow: 'hidden', border: (t) => `1px solid ${t.custom.border}`, cursor: 'crosshair' }}>
      <MapContainer center={center} zoom={has ? 15 : fallback ? 13 : 7} style={{ height: '100%' }}>
        <TileLayer url={OSM} attribution={ATTR} />
        <ClickHandler onPick={onChange} />
        {has && <Marker position={[lat!, lng!]} icon={pin()} draggable eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); onChange(Number(p.lat.toFixed(7)), Number(p.lng.toFixed(7))); } }} />}
        {has && <Recenter lat={lat!} lng={lng!} />}
        {!has && fallback && <Recenter lat={fallback[0]} lng={fallback[1]} />}
      </MapContainer>
    </Box>
  );
};
