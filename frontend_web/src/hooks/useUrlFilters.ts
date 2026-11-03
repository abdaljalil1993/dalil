import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BusinessFilters } from '@/api/types';

const NUM = ['categoryId', 'subCategoryId', 'cityId', 'minRating', 'priceRange', 'lat', 'lng', 'radius'] as const;
const BOOL = ['openNow', 'verified', 'hasPhotos', 'featured'] as const;

/** Filters live in the URL so searches are shareable and survive refresh. */
export const useUrlFilters = (defaults: BusinessFilters = {}) => {
  const [params, setParams] = useSearchParams();
  const filters = useMemo<BusinessFilters>(() => {
    const f: BusinessFilters = { ...defaults };
    const q = params.get('q');
    if (q) f.q = q;
    const d = params.get('district');
    if (d) f.district = d;
    const s = params.get('sort');
    if (s) f.sort = s as BusinessFilters['sort'];
    NUM.forEach((k) => { const v = params.get(k === 'subCategoryId' ? 'sub' : k); if (v) (f as Record<string, unknown>)[k] = Number(v); });
    BOOL.forEach((k) => { if (params.get(k) === 'true') (f as Record<string, unknown>)[k] = true; });
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const setFilters = useCallback(
    (f: BusinessFilters) => {
      const p = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '' || v === false || k === 'page' || k === 'limit') return;
        if ((defaults as Record<string, unknown>)[k] === v) return;
        p.set(k === 'subCategoryId' ? 'sub' : k, String(v));
      });
      setParams(p, { replace: true });
    },
    [setParams, defaults]
  );
  return [filters, setFilters] as const;
};
