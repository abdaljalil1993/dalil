/** Client-side Arabic normalization (mirrors the backend) for local filtering. */
export const normalize = (s: string) =>
  s.toLowerCase().replace(/[ً-ٰٟ]/g, '').replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
