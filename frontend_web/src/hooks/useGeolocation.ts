import { useCallback, useState } from 'react';

export const useGeolocation = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            const c = { lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) };
            setCoords(c);
            setLoading(false);
            setError(null);
            resolve(c);
          },
          (e) => {
            setLoading(false);
            setError(e.message);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }),
    []
  );

  return { coords, loading, error, locate, setCoords };
};
