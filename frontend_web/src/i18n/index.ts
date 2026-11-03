import { useCallback } from 'react';
import ar, { Dict } from './ar';
import en from './en';
import xar, { XDict } from './x.ar';
import xen from './x.en';
import { usePrefs, Locale } from '@/store/prefsStore';

type FullDict = Dict & { x: XDict };
const dicts: Record<Locale, FullDict> = { ar: { ...ar, x: xar }, en: { ...en, x: xen } };

type Path<T> = T extends readonly unknown[] ? never : T extends object
  ? { [K in keyof T & string]: T[K] extends string ? K : T[K] extends readonly unknown[] ? K : `${K}.${Path<T[K]>}` }[keyof T & string]
  : never;
export type TKey = Path<FullDict>;

const resolve = (dict: FullDict, key: string): unknown => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], dict);

export const translate = (locale: Locale, key: string, vars?: Record<string, string | number>): string => {
  const raw = resolve(dicts[locale], key) ?? resolve(dicts.ar, key) ?? key;
  const str = typeof raw === 'string' ? raw : key;
  return vars ? str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : str;
};

/** const { t, dict, locale, isRtl } = useT(); t('home.heroTitle') */
export const useT = () => {
  const locale = usePrefs((s) => s.locale);
  const t = useCallback((key: TKey | string, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale]);
  return { t, dict: dicts[locale], locale, isRtl: locale === 'ar' };
};

/** Picks the localized name of an entity that has name / nameEn. */
export const useLocalName = () => {
  const locale = usePrefs((s) => s.locale);
  return useCallback((o?: { name: string; nameEn?: string | null } | null) => (o ? (locale === 'en' && o.nameEn ? o.nameEn : o.name) : ''), [locale]);
};
