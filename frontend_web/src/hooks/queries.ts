import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { businessApi, catalogApi, notificationApi } from '@/api/services';
import type { BusinessFilters } from '@/api/types';
import { useAuthStore } from '@/store/authStore';

export const qk = {
  home: (cityId?: number | null) => ['home', cityId ?? 0] as const,
  categories: (all = false) => ['categories', all] as const,
  category: (slug: string) => ['category', slug] as const,
  cities: (all = false) => ['cities', all] as const,
  business: (slug: string) => ['business', slug] as const,
  businessList: (kind: string, f: object) => ['businesses', kind, f] as const,
  reviews: (businessId: string, f: object) => ['reviews', businessId, f] as const,
  unread: ['notifications', 'unread'] as const,
};

export const useHome = (cityId?: number | null) => useQuery({ queryKey: qk.home(cityId), queryFn: () => catalogApi.home(cityId), staleTime: 60_000 });
export const useCategories = (all = false) => useQuery({ queryKey: qk.categories(all), queryFn: () => catalogApi.categories(all), staleTime: 5 * 60_000 });
export const useCategory = (slug: string) => useQuery({ queryKey: qk.category(slug), queryFn: () => catalogApi.category(slug), enabled: Boolean(slug) });
export const useCities = (all = false) => useQuery({ queryKey: qk.cities(all), queryFn: () => catalogApi.cities(all), staleTime: 5 * 60_000 });
export const useBusiness = (slug: string) => useQuery({ queryKey: qk.business(slug), queryFn: () => businessApi.details(slug), enabled: Boolean(slug), retry: 0 });

/** Infinite list; `search` requires auth (text search), `browse` is public. */
export const useBusinessInfinite = (kind: 'browse' | 'search', filters: BusinessFilters, enabled = true) =>
  useInfiniteQuery({
    queryKey: qk.businessList(kind, filters),
    queryFn: ({ pageParam }) => (kind === 'search' ? businessApi.search : businessApi.browse)({ ...filters, page: pageParam, limit: filters.limit || 12 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.page + 1 : undefined),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useUnreadCount = () => {
  const isAuth = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({ queryKey: qk.unread, queryFn: notificationApi.unread, enabled: isAuth, refetchInterval: 60_000, select: (d) => d.count });
};
