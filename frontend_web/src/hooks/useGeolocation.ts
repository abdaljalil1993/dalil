import { useCallback, useRef, useState } from 'react';

/** Rough bounding box of Syria (with a small margin). */
const SYRIA = { minLat: 32.2, maxLat: 37.5, minLng: 35.5, maxLng: 42.5 };

/** A browser position we can trust: inside Syria and not a city-level IP/VPN guess. */
export const isPlausibleSyria = (lat: number, lng: number, accuracy?: number) =>
  lat >= SYRIA.minLat && lat <= SYRIA.maxLat && lng >= SYRIA.minLng && lng <= SYRIA.maxLng && (accuracy == null || accuracy <= 5000);

export type GeoFail = 'unsupported' | 'denied' | 'outside';

export const useGeolocation = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState<GeoFail | null>(null);
  const last = useRef<GeoFail | null>(null);
  const setError = (e: GeoFail | null) => { last.current = e; setErrorState(e); };

  /** Resolves with the position, or null (error says why: 'outside' = VPN / IP guess, e.g. Malta). */
  const locate = useCallback(
    () =>
      new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!navigator.geolocation) {
          setError('unsupported');
          return resolve(null);
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          (p) => {
            setLoading(false);
            const c = { lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) };
            if (!isPlausibleSyria(c.lat, c.lng, p.coords.accuracy)) {
              setError('outside');
              return resolve(null);
            }
            setCoords(c);
            setError(null);
            resolve(c);
          },
          () => {
            setLoading(false);
            setError('denied');
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 }
        );
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Why the last locate() returned null (read right after awaiting it). */
  const reason = useCallback(() => last.current, []);
  return { coords, loading, error, reason, locate, setCoords };
};
