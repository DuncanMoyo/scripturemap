import { BOOK_MAP } from '../data/books';
import { BibleTranslationId, GraphViewMode, NavSection, VerseId } from '../types/scripture';

export interface ParsedAtlasRoute {
  section?: NavSection;
  anchorVerseId?: VerseId;
  pathTargetId?: VerseId | null;
  graphViewMode?: GraphViewMode;
  readerBookId?: string;
  readerChapter?: number;
  readerVerseId?: VerseId;
  translation?: BibleTranslationId;
  themeId?: string;
  eventId?: string;
  locationId?: string;
  journeyId?: string;
  sanctuaryId?: string;
  sharedId?: string;
}

export interface AtlasRouteSnapshot {
  activeSection: NavSection;
  anchorVerseId: VerseId;
  pathTargetId: VerseId | null;
  graphViewMode: GraphViewMode;
  readerBookId: string;
  readerChapter: number;
  readerVerseId: VerseId;
  translation: BibleTranslationId;
  activeThemeId?: string;
  activeEventId?: string;
  activeLocationId?: string;
  activeJourneyId?: string;
  activeSanctuaryId?: string;
}

const VALID_SECTIONS = new Set<NavSection>([
  'graph',
  'reader',
  'themes',
  'timeline',
  'geography',
  'sanctuary',
  'collections',
  'guide',
]);

const VALID_TRANSLATIONS = new Set<BibleTranslationId>(['KJV', 'ASV', 'YLT']);

export function parseVerseIdParam(raw: string | null): VerseId | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().toUpperCase();
  const match = cleaned.match(/^([1-3A-Z]+)\.(\d+)\.(\d+)$/);
  if (!match) return undefined;
  const book = BOOK_MAP[match[1]];
  if (!book) return undefined;
  const ch = parseInt(match[2], 10);
  const vs = parseInt(match[3], 10);
  if (ch < 1 || ch > book.chapterCount || vs < 1) return undefined;
  return `${book.id}.${ch}.${vs}`;
}

export function parseUrlRoute(pathname: string, search: string): ParsedAtlasRoute {
  const segments = pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);
  const params = new URLSearchParams(search);
  const out: ParsedAtlasRoute = {};

  const trParam = params.get('tr')?.toUpperCase() as BibleTranslationId | undefined;
  if (trParam && VALID_TRANSLATIONS.has(trParam)) {
    out.translation = trParam;
  }

  const sharedParam = params.get('shared');
  if (sharedParam && /^[a-zA-Z0-9_-]{4,64}$/.test(sharedParam.trim())) {
    out.sharedId = sharedParam.trim();
    out.section = 'collections';
  }

  const head = segments[0]?.toLowerCase();
  if (head && VALID_SECTIONS.has(head as NavSection)) {
    out.section = head as NavSection;
  }

  if (head === 'reader' && segments[1]) {
    const bid = segments[1].toUpperCase();
    const book = BOOK_MAP[bid];
    if (book) {
      out.readerBookId = book.id;
      const ch = segments[2] ? parseInt(segments[2], 10) : 1;
      const safeCh = Number.isFinite(ch) && ch >= 1 && ch <= book.chapterCount ? ch : 1;
      out.readerChapter = safeCh;
      const vNum = segments[3] ? parseInt(segments[3], 10) : undefined;
      if (vNum && Number.isFinite(vNum) && vNum >= 1) {
        out.readerVerseId = `${book.id}.${safeCh}.${vNum}`;
      } else {
        out.readerVerseId = `${book.id}.${safeCh}.1`;
      }
    }
  } else if (head === 'themes' && segments[1]) {
    out.themeId = decodeURIComponent(segments[1]);
  } else if (head === 'timeline' && segments[1]) {
    out.eventId = decodeURIComponent(segments[1]);
  } else if (head === 'geography') {
    if (segments[1]) {
      out.locationId = decodeURIComponent(segments[1]);
    }
    const jParam = params.get('journey');
    if (jParam) {
      out.journeyId = jParam;
    }
  } else if (head === 'sanctuary' && segments[1]) {
    out.sanctuaryId = decodeURIComponent(segments[1]);
  } else if (head !== 'collections') {
    // Graph or root URL query params
    const anchor = parseVerseIdParam(params.get('anchor'));
    if (anchor) out.anchorVerseId = anchor;
    const to = parseVerseIdParam(params.get('to'));
    if (to) out.pathTargetId = to;
    const viewParam = params.get('view');
    if (viewParam === 'canon-arc') out.graphViewMode = 'canon_arc';
    else if (viewParam === 'canon-ring') out.graphViewMode = 'canon_ring';
    else if (viewParam === 'canon-matrix') out.graphViewMode = 'canon_matrix';
    else if (viewParam === 'ego') out.graphViewMode = 'ego';
  }

  return out;
}

export function buildUrlFromState(snap: AtlasRouteSnapshot): string {
  const params = new URLSearchParams();

  switch (snap.activeSection) {
    case 'graph': {
      if (snap.anchorVerseId && snap.anchorVerseId !== 'JHN.3.16') {
        params.set('anchor', snap.anchorVerseId);
      }
      if (snap.pathTargetId) {
        params.set('to', snap.pathTargetId);
      }
      if (snap.graphViewMode === 'canon_arc') {
        params.set('view', 'canon-arc');
      } else if (snap.graphViewMode === 'canon_ring') {
        params.set('view', 'canon-ring');
      } else if (snap.graphViewMode === 'canon_matrix') {
        params.set('view', 'canon-matrix');
      }
      const q = params.toString();
      return q ? `/graph?${q}` : '/graph';
    }
    case 'reader': {
      const parts = snap.readerVerseId.split('.');
      const vSeg = parts.length === 3 ? `/${parts[2]}` : '';
      if (snap.translation !== 'KJV') {
        params.set('tr', snap.translation);
      }
      const q = params.toString();
      return `/reader/${snap.readerBookId}/${snap.readerChapter}${vSeg}${q ? `?${q}` : ''}`;
    }
    case 'themes':
      return snap.activeThemeId
        ? `/themes/${encodeURIComponent(snap.activeThemeId)}`
        : '/themes';
    case 'timeline':
      return snap.activeEventId
        ? `/timeline/${encodeURIComponent(snap.activeEventId)}`
        : '/timeline';
    case 'geography': {
      if (snap.activeJourneyId) {
        params.set('journey', snap.activeJourneyId);
      }
      const base = snap.activeLocationId
        ? `/geography/${encodeURIComponent(snap.activeLocationId)}`
        : '/geography';
      const q = params.toString();
      return q ? `${base}?${q}` : base;
    }
    case 'sanctuary':
      return snap.activeSanctuaryId
        ? `/sanctuary/${encodeURIComponent(snap.activeSanctuaryId)}`
        : '/sanctuary';
    case 'collections':
      return '/collections';
    case 'guide':
      return '/guide';
  }
}

export function buildShareUrl(snap: AtlasRouteSnapshot): string {
  const path = buildUrlFromState(snap);
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}
