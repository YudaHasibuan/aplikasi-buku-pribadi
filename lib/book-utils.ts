import type { Theme } from '@/contexts/ThemeContext';
import type { Book } from '@/database/db';
import { READING_STATUSES, type ReadingStatus } from '@/constants/design';

export { READING_STATUSES };
export type { ReadingStatus };

export const isReadingStatus = (s: string | undefined): s is ReadingStatus =>
  !!s && (READING_STATUSES as readonly string[]).includes(s);

/** Semantic colour pair (fg, soft bg) for a reading status. */
export function statusColors(status: string | undefined, t: Theme): { fg: string; bg: string } {
  switch (status) {
    case 'Sedang Dibaca': return { fg: t.info, bg: t.infoSoft };
    case 'Selesai': return { fg: t.success, bg: t.successSoft };
    case 'Ditunda': return { fg: t.warning, bg: t.warningSoft };
    case 'Ingin Baca':
    default: return { fg: t.accent, bg: t.accentSoft };
  }
}

export function statusIcon(status: string | undefined) {
  switch (status) {
    case 'Sedang Dibaca': return 'book.fill' as const;
    case 'Selesai': return 'checkmark.circle.fill' as const;
    case 'Ditunda': return 'pause.circle.fill' as const;
    default: return 'bookmark.fill' as const;
  }
}

/** Time-of-day greeting in Indonesian. */
export function getGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}

/** Deterministic gradient for books without a cover, derived from the title. */
const COVER_PALETTES: readonly (readonly [string, string])[] = [
  ['#6366F1', '#A855F7'],
  ['#0EA5E9', '#6366F1'],
  ['#10B981', '#0EA5E9'],
  ['#F59E0B', '#EF4444'],
  ['#EC4899', '#8B5CF6'],
  ['#14B8A6', '#84CC16'],
  ['#F97316', '#EC4899'],
  ['#8B5CF6', '#06B6D4'],
];

export function coverGradient(seed: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length];
}

/** Up to two initials from a title ("Laskar Pelangi" → "LP"). */
export function titleInitials(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function clampProgress(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Aggregate statistics used by the dashboard and profile. */
export function computeStats(books: Book[]) {
  const total = books.length;
  const count = (s: ReadingStatus) => books.filter((b) => b.status === s).length;
  const completed = count('Selesai');
  const reading = count('Sedang Dibaca');
  const wanted = count('Ingin Baca');
  const paused = count('Ditunda');
  const favorites = books.filter((b) => b.is_favorite === 1).length;
  const pdfs = books.filter((b) => !!b.pdf_uri).length;
  const avgProgress = total ? Math.round(books.reduce((a, b) => a + (b.progress ?? 0), 0) / total) : 0;
  const rated = books.filter((b) => (b.rating ?? 0) > 0);
  const avgRating = rated.length ? rated.reduce((a, b) => a + (b.rating ?? 0), 0) / rated.length : 0;

  const genreCounts = new Map<string, number>();
  for (const b of books) {
    const g = b.genre?.trim();
    if (g) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
  }
  const genres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]);
  const favoriteGenre = genres[0]?.[0] ?? null;

  return { total, completed, reading, wanted, paused, favorites, pdfs, avgProgress, avgRating, genres, favoriteGenre };
}
