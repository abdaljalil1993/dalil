/**
 * Arabic-aware text helpers.
 * - normalizeText: unify Arabic letter forms so "أطباء" / "اطباء" and "عيادة" / "عياده" match.
 * - slugify: keeps Arabic letters (the old version stripped them and produced empty slugs).
 */
const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

export const normalizeText = (input: string | null | undefined): string => {
  if (!input) return '';
  return input
    .toString()
    .toLowerCase()
    .replace(TASHKEEL, '')
    .replace(TATWEEL, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/** Splits a query into normalized tokens; strips the Arabic definite article "ال" for better recall. */
export const tokenize = (query: string): string[] => {
  const tokens = normalizeText(query)
    .split(' ')
    .filter((t) => t.length >= 2)
    .map((t) => (t.length > 4 && t.startsWith('ال') ? t.slice(2) : t));
  return Array.from(new Set(tokens)).slice(0, 8);
};

export const slugify = (text: string): string => {
  const base = text
    .toString()
    .trim()
    .toLowerCase()
    .replace(TASHKEEL, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base.slice(0, 120) || Math.random().toString(36).slice(2, 10);
};

export const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (m) => `\\${m}`);
