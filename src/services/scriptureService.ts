import { BIBLICAL_EVENTS } from '../data/atlasModules';
import { BIBLE_BOOKS, BOOK_MAP } from '../data/books';
import { CROSS_REFERENCES } from '../data/crossReferences';
import {
  BIBLICAL_JOURNEYS,
  BIBLICAL_LOCATIONS,
  LOCATION_CATEGORY_META,
} from '../data/geography';
import { SANCTUARY_ARTICLES } from '../data/sanctuary';
import { BIBLICAL_THEMES } from '../data/themes';
import { SAMPLE_CHAPTERS, SAMPLE_VERSES, VERSE_MAP } from '../data/verses';
import {
  BibleBook,
  BibleChapter,
  BibleTranslationId,
  BiblicalEvent,
  BiblicalJourney,
  BiblicalLocation,
  BiblicalPeriodId,
  CanonHeadGraph,
  CanonIndex,
  CorpusSearchProgress,
  CrossReferenceEdge,
  EditorialStatus,
  EpistemicNature,
  LocationCategory,
  RelationshipType,
  SanctuaryArticle,
  SearchResult,
  Theme,
  TskCrossReference,
  Verse,
  VerseId,
} from '../types/scripture';

export type EpistemicFilter = 'all' | EpistemicNature;
export type EditorialFilter = 'all' | EditorialStatus;

export interface ConnectedPassage {
  edge: CrossReferenceEdge;
  verse: Verse;
  role: 'outgoing' | 'incoming';
}

export interface ScripturePathResult {
  nodeIds: VerseId[];
  edges: CrossReferenceEdge[];
  steps: {
    from: Verse;
    to: Verse;
    edge: CrossReferenceEdge;
  }[];
}

interface RawBookPayload {
  bookId: string;
  chapters: Record<string, { v: number; t: string }[]>;
}

const TOTAL_FULL_KJV_VERSES = 31102;

// Dynamic runtime cache for full 66-book KJV, ASV, YLT corpora
const DYNAMIC_VERSE_MAP: Record<VerseId, Verse> = {};
const LOADED_BOOKS_CACHE = new Map<string, Map<number, Verse[]>>();
const IN_FLIGHT_BOOK_LOADS = new Map<string, Promise<Verse[]>>();

const TRANSLATION_CACHE: Record<BibleTranslationId, Map<string, Map<number, Verse[]>>> = {
  KJV: LOADED_BOOKS_CACHE,
  ASV: new Map(),
  YLT: new Map(),
};
const TRANSLATION_VERSE_CACHE: Record<'ASV' | 'YLT', Record<VerseId, Verse>> = {
  ASV: {},
  YLT: {},
};
const IN_FLIGHT_TRANSLATION_LOADS = new Map<string, Promise<Verse[]>>();

// Canon index & TSK Tier-2 caches
let canonIndexCache: CanonIndex | null = null;
let canonIndexPromise: Promise<CanonIndex> | null = null;

let canonHeadCache: CanonHeadGraph | null = null;
let canonHeadPromise: Promise<CanonHeadGraph> | null = null;

type RawTskBookMap = Record<string, [string, number, 'out' | 'in'][]>;
const TSK_BOOK_CACHE = new Map<string, RawTskBookMap>();
const TSK_IN_FLIGHT = new Map<string, Promise<RawTskBookMap>>();

// Common canonical abbreviations for smart reference parsing
const BOOK_ALIASES: Record<string, string> = {
  gen: 'GEN', ge: 'GEN', gn: 'GEN',
  exod: 'EXO', ex: 'EXO', exo: 'EXO',
  lev: 'LEV', le: 'LEV', lv: 'LEV',
  num: 'NUM', nu: 'NUM', nm: 'NUM',
  deut: 'DEU', dt: 'DEU', deu: 'DEU',
  josh: 'JOS', jos: 'JOS',
  judg: 'JDG', jdg: 'JDG', jg: 'JDG',
  ruth: 'RUT', rth: 'RUT', rut: 'RUT',
  '1sam': '1SA', '1sa': '1SA', '1sm': '1SA', '1 sam': '1SA',
  '2sam': '2SA', '2sa': '2SA', '2sm': '2SA', '2 sam': '2SA',
  '1kgs': '1KI', '1ki': '1KI', '1kg': '1KI', '1 kings': '1KI', '1 kgs': '1KI',
  '2kgs': '2KI', '2ki': '2KI', '2kg': '2KI', '2 kings': '2KI', '2 kgs': '2KI',
  '1chr': '1CH', '1ch': '1CH', '1 chr': '1CH',
  '2chr': '2CH', '2ch': '2CH', '2 chr': '2CH',
  ezra: 'EZR', ezr: 'EZR',
  neh: 'NEH', ne: 'NEH',
  esth: 'EST', est: 'EST',
  job: 'JOB', jb: 'JOB',
  ps: 'PSA', psa: 'PSA', psm: 'PSA', psalm: 'PSA', psalms: 'PSA',
  prov: 'PRO', pro: 'PRO', pr: 'PRO',
  eccl: 'ECC', ecc: 'ECC', ec: 'ECC', qoh: 'ECC',
  song: 'SNG', sng: 'SNG', sos: 'SNG', ss: 'SNG', 'song of songs': 'SNG', 'song of solomon': 'SNG',
  isa: 'ISA', is: 'ISA',
  jer: 'JER', je: 'JER',
  lam: 'LAM', la: 'LAM',
  ezek: 'EZK', ezk: 'EZK', eze: 'EZK',
  dan: 'DAN', da: 'DAN', dn: 'DAN',
  hos: 'HOS', ho: 'HOS',
  joel: 'JOL', jol: 'JOL', jl: 'JOL',
  amos: 'AMO', am: 'AMO', amo: 'AMO',
  obad: 'OBA', ob: 'OBA', oba: 'OBA', obadiah: 'OBA',
  jonah: 'JON', jon: 'JON', jnh: 'JON',
  mic: 'MIC', mi: 'MIC',
  nah: 'NAM', nam: 'NAM', na: 'NAM',
  hab: 'HAB', hb: 'HAB',
  zeph: 'ZEP', zep: 'ZEP', zp: 'ZEP',
  hag: 'HAG', hg: 'HAG',
  zech: 'ZEC', zec: 'ZEC', zc: 'ZEC',
  mal: 'MAL', ml: 'MAL',
  matt: 'MAT', mat: 'MAT', mt: 'MAT',
  mark: 'MRK', mrk: 'MRK', mk: 'MRK',
  luke: 'LUK', luk: 'LUK', lk: 'LUK',
  john: 'JHN', jhn: 'JHN', jn: 'JHN', joh: 'JHN',
  acts: 'ACT', act: 'ACT', ac: 'ACT',
  rom: 'ROM', ro: 'ROM', rm: 'ROM',
  '1cor': '1CO', '1co': '1CO', '1 cor': '1CO',
  '2cor': '2CO', '2co': '2CO', '2 cor': '2CO',
  gal: 'GAL', ga: 'GAL',
  eph: 'EPH', ep: 'EPH',
  phil: 'PHP', php: 'PHP', pp: 'PHP',
  col: 'COL',
  '1thess': '1TH', '1th': '1TH', '1 thes': '1TH', '1 thess': '1TH',
  '2thess': '2TH', '2th': '2TH', '2 thes': '2TH', '2 thess': '2TH',
  '1tim': '1TI', '1ti': '1TI', '1tm': '1TI', '1 tim': '1TI',
  '2tim': '2TI', '2ti': '2TI', '2tm': '2TI', '2 tim': '2TI',
  titus: 'TIT', tit: 'TIT', ti: 'TIT',
  phlm: 'PHM', phm: 'PHM', philemon: 'PHM',
  heb: 'HEB', he: 'HEB',
  jas: 'JAS', jam: 'JAS', jm: 'JAS', james: 'JAS',
  '1pet': '1PE', '1pe': '1PE', '1pt': '1PE', '1 pet': '1PE',
  '2pet': '2PE', '2pe': '2PE', '2pt': '2PE', '2 pet': '2PE',
  '1john': '1JN', '1jn': '1JN', '1jo': '1JN', '1 jn': '1JN', '1 john': '1JN',
  '2john': '2JN', '2jn': '2JN', '2jo': '2JN', '2 jn': '2JN', '2 john': '2JN',
  '3john': '3JN', '3jn': '3JN', '3jo': '3JN', '3 jn': '3JN', '3 john': '3JN',
  jude: 'JUD', jud: 'JUD', jd: 'JUD',
  rev: 'REV', re: 'REV', rv: 'REV', apoc: 'REV',
};

function normalizeVerseText(raw: string): string {
  return raw
    .replace(/^#\s*/, '')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

async function readPublicJson<T>(publicSubPath: string): Promise<T> {
  const normalized = publicSubPath.replace(/^\/+/, '');
  if (typeof window === 'undefined') {
    const fsModuleName = 'node:fs/promises';
    const pathModuleName = 'node:path';
    const fs = await import(/* @vite-ignore */ fsModuleName);
    const path = await import(/* @vite-ignore */ pathModuleName);
    const filePath = path.resolve(process.cwd(), 'public', ...normalized.split('/'));
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  const response = await fetch(`/${normalized}`);
  if (!response.ok) {
    throw new Error(`Unable to load /${normalized} (${response.status})`);
  }
  return (await response.json()) as T;
}

export function formatReferenceFromId(verseId: VerseId, short = false): string {
  const existing = getVerseById(verseId);
  if (existing) return short ? existing.shortRef : existing.reference;
  const parts = verseId.split('.');
  if (parts.length !== 3) return verseId;
  const book = BOOK_MAP[parts[0]];
  if (!book) return verseId;
  return `${short ? book.shortName : book.name} ${parts[1]}:${parts[2]}`;
}

export async function loadBookKjv(bookId: string): Promise<Verse[]> {
  return loadBookTranslation(bookId, 'KJV');
}

export async function loadBookTranslation(
  bookId: string,
  translation: BibleTranslationId = 'KJV'
): Promise<Verse[]> {
  const bookCache = TRANSLATION_CACHE[translation];
  const existing = bookCache.get(bookId);
  if (existing) {
    const out: Verse[] = [];
    const sortedChapters = Array.from(existing.keys()).sort((a, b) => a - b);
    for (const ch of sortedChapters) {
      out.push(...existing.get(ch)!);
    }
    return out;
  }

  const flightKey = `${translation}:${bookId}`;
  const pending =
    translation === 'KJV'
      ? IN_FLIGHT_BOOK_LOADS.get(bookId)
      : IN_FLIGHT_TRANSLATION_LOADS.get(flightKey);
  if (pending) {
    return pending;
  }

  const task = (async () => {
    const book = BOOK_MAP[bookId];
    if (!book) {
      throw new Error(`Unknown canonical book ID: ${bookId}`);
    }

    const subPath =
      translation === 'KJV'
        ? `kjv/${encodeURIComponent(bookId)}.json`
        : `translations/${translation.toLowerCase()}/${encodeURIComponent(bookId)}.json`;

    const payload = await readPublicJson<RawBookPayload>(subPath);
    const chapterMap = new Map<number, Verse[]>();
    const allVerses: Verse[] = [];

    const chapterNums = Object.keys(payload.chapters)
      .map((n) => parseInt(n, 10))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);

    for (const chNum of chapterNums) {
      const rawVerses = payload.chapters[String(chNum)] ?? [];
      const verseList: Verse[] = [];
      for (const rv of rawVerses) {
        const id: VerseId = `${book.id}.${chNum}.${rv.v}`;
        const anchor = VERSE_MAP[id];
        const verse: Verse = {
          id,
          bookId: book.id,
          bookName: book.name,
          chapter: chNum,
          verse: rv.v,
          reference: `${book.name} ${chNum}:${rv.v}`,
          shortRef: `${book.shortName} ${chNum}:${rv.v}`,
          testament: book.testament,
          text: normalizeVerseText(rv.t),
          translation,
          ...(anchor?.keyTerms ? { keyTerms: anchor.keyTerms } : {}),
        };
        if (translation === 'KJV') {
          DYNAMIC_VERSE_MAP[id] = verse;
        } else {
          TRANSLATION_VERSE_CACHE[translation][id] = verse;
        }
        verseList.push(verse);
        allVerses.push(verse);
      }
      chapterMap.set(chNum, verseList);
    }

    bookCache.set(bookId, chapterMap);
    return allVerses;
  })().finally(() => {
    if (translation === 'KJV') {
      IN_FLIGHT_BOOK_LOADS.delete(bookId);
    } else {
      IN_FLIGHT_TRANSLATION_LOADS.delete(flightKey);
    }
  });

  if (translation === 'KJV') {
    IN_FLIGHT_BOOK_LOADS.set(bookId, task);
  } else {
    IN_FLIGHT_TRANSLATION_LOADS.set(flightKey, task);
  }
  return task;
}

export async function loadChapterVerses(
  bookId: string,
  chapter: number,
  translation: BibleTranslationId = 'KJV'
): Promise<Verse[]> {
  await loadBookTranslation(bookId, translation);
  return getChapterVersesInTranslation(bookId, chapter, translation);
}

export function getChapterVersesInTranslation(
  bookId: string,
  chapter: number,
  translation: BibleTranslationId = 'KJV'
): Verse[] {
  if (translation === 'KJV') {
    return getChapterVerses(bookId, chapter);
  }
  const bookCache = TRANSLATION_CACHE[translation].get(bookId);
  if (bookCache) {
    return bookCache.get(chapter) ?? [];
  }
  return [];
}

export function getVerseInTranslation(
  verseId: VerseId,
  translation: BibleTranslationId = 'KJV'
): Verse | undefined {
  if (translation === 'KJV') {
    return getVerseById(verseId);
  }
  return TRANSLATION_VERSE_CACHE[translation][verseId];
}

export async function resolveVerseAsync(verseId: VerseId): Promise<Verse | undefined> {
  const existing = getVerseById(verseId);
  if (existing) return existing;
  const bookId = verseId.split('.')[0];
  if (!BOOK_MAP[bookId]) return undefined;
  await loadBookKjv(bookId);
  return getVerseById(verseId);
}

export function isBookLoaded(bookId: string): boolean {
  return LOADED_BOOKS_CACHE.has(bookId);
}

export function getLoadedBooksCount(): number {
  return LOADED_BOOKS_CACHE.size;
}

export function getLoadedVerseCount(): number {
  return Object.keys(DYNAMIC_VERSE_MAP).length;
}

// ---------- Tier-2 OpenBible.info TSK & Canon Index Loaders ----------

export async function loadCanonIndex(): Promise<CanonIndex> {
  if (canonIndexCache) return canonIndexCache;
  if (canonIndexPromise) return canonIndexPromise;
  canonIndexPromise = readPublicJson<CanonIndex>('canon-index.json')
    .then((data) => {
      canonIndexCache = data;
      return data;
    })
    .finally(() => {
      canonIndexPromise = null;
    });
  return canonIndexPromise;
}

export async function loadTskCanonHead(): Promise<CanonHeadGraph> {
  if (canonHeadCache) return canonHeadCache;
  if (canonHeadPromise) return canonHeadPromise;
  canonHeadPromise = readPublicJson<CanonHeadGraph>('tsk/canon-head.json')
    .then((data) => {
      canonHeadCache = data;
      return data;
    })
    .finally(() => {
      canonHeadPromise = null;
    });
  return canonHeadPromise;
}

export async function loadTskForBook(bookId: string): Promise<RawTskBookMap> {
  const existing = TSK_BOOK_CACHE.get(bookId);
  if (existing) return existing;
  const inFlight = TSK_IN_FLIGHT.get(bookId);
  if (inFlight) return inFlight;

  const task = readPublicJson<RawTskBookMap>(`tsk/books/${encodeURIComponent(bookId)}.json`)
    .then((data) => {
      TSK_BOOK_CACHE.set(bookId, data);
      return data;
    })
    .finally(() => {
      TSK_IN_FLIGHT.delete(bookId);
    });

  TSK_IN_FLIGHT.set(bookId, task);
  return task;
}

export function getTskConnectionsForVerse(verseId: VerseId): TskCrossReference[] {
  const bookId = verseId.split('.')[0];
  const map = TSK_BOOK_CACHE.get(bookId);
  if (!map) return [];
  const entries = map[verseId];
  if (!entries) return [];
  return entries.map(([targetVerseId, votes, direction]) => ({
    targetVerseId,
    votes,
    direction,
  }));
}

export async function loadTskConnectionsForVerse(verseId: VerseId): Promise<TskCrossReference[]> {
  const bookId = verseId.split('.')[0];
  if (!BOOK_MAP[bookId]) return [];
  const map = await loadTskForBook(bookId);
  const entries = map[verseId] ?? [];
  return entries.map(([targetVerseId, votes, direction]) => ({
    targetVerseId,
    votes,
    direction,
  }));
}

// Pre-computed O(1) adjacency index for fast graph traversal, depth expansion, and path tracing
const ADJACENCY_INDEX: Map<VerseId, ConnectedPassage[]> = (() => {
  const map = new Map<VerseId, ConnectedPassage[]>();
  for (const edge of CROSS_REFERENCES) {
    const sourceVerse = VERSE_MAP[edge.source];
    const targetVerse = VERSE_MAP[edge.target];
    if (!sourceVerse || !targetVerse) continue;

    if (!map.has(edge.source)) map.set(edge.source, []);
    map.get(edge.source)!.push({ edge, verse: targetVerse, role: 'outgoing' });

    if (!map.has(edge.target)) map.set(edge.target, []);
    map.get(edge.target)!.push({ edge, verse: sourceVerse, role: 'incoming' });
  }
  return map;
})();

const BOOKS_WITH_SAMPLE_TEXT = new Set(SAMPLE_VERSES.map((v) => v.bookId));

export function getBookById(bookId: string): BibleBook | undefined {
  return BOOK_MAP[bookId];
}

export function getAllBooks(): BibleBook[] {
  return BIBLE_BOOKS;
}

export function getAllIndexedVerses(): Verse[] {
  return SAMPLE_VERSES;
}

export function getAllCrossReferences(): CrossReferenceEdge[] {
  return CROSS_REFERENCES;
}

export function queryRelationshipDatabase(filters: {
  relationship?: RelationshipType | 'all';
  epistemic?: EpistemicFilter;
  editorial?: EditorialFilter;
  query?: string;
}): CrossReferenceEdge[] {
  const q = filters.query?.trim().toLowerCase() ?? '';
  return CROSS_REFERENCES.filter((edge) => {
    if (
      filters.relationship &&
      filters.relationship !== 'all' &&
      edge.relationship !== filters.relationship
    ) {
      return false;
    }
    if (
      filters.epistemic &&
      filters.epistemic !== 'all' &&
      edge.epistemicNature !== filters.epistemic
    ) {
      return false;
    }
    if (
      filters.editorial &&
      filters.editorial !== 'all' &&
      edge.editorialStatus !== filters.editorial
    ) {
      return false;
    }
    if (q) {
      const src = getVerseById(edge.source);
      const dst = getVerseById(edge.target);
      const haystack = [
        src?.reference,
        dst?.reference,
        src?.text,
        dst?.text,
        edge.explanation,
        edge.sourceAttribution,
        edge.supportingEvidence,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function getBooksWithSampleText(): Set<string> {
  return BOOKS_WITH_SAMPLE_TEXT;
}

export function getAvailableChaptersForBook(bookId: string): BibleChapter[] {
  const loaded = LOADED_BOOKS_CACHE.get(bookId);
  if (loaded) {
    return Array.from(loaded.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([chapterNumber, verses]) => ({
        id: `${bookId}.${chapterNumber}`,
        bookId,
        chapterNumber,
        verseIds: verses.map((v) => v.id),
      }));
  }

  return SAMPLE_CHAPTERS.filter((ch) => ch.bookId === bookId).sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );
}

export function getChapterVerses(bookId: string, chapter: number): Verse[] {
  const loadedBook = LOADED_BOOKS_CACHE.get(bookId);
  if (loadedBook) {
    return loadedBook.get(chapter) ?? [];
  }

  return SAMPLE_VERSES.filter((v) => v.bookId === bookId && v.chapter === chapter).sort(
    (a, b) => a.verse - b.verse
  );
}

export function getVerseById(verseId: VerseId): Verse | undefined {
  return VERSE_MAP[verseId] ?? DYNAMIC_VERSE_MAP[verseId];
}

export function getConnectedPassages(
  verseId: VerseId,
  allowedRelationships?: Set<RelationshipType>,
  epistemicFilter: EpistemicFilter = 'all'
): ConnectedPassage[] {
  const adjacent = ADJACENCY_INDEX.get(verseId) ?? [];
  return adjacent.filter((item) => {
    if (allowedRelationships && !allowedRelationships.has(item.edge.relationship)) {
      return false;
    }
    if (epistemicFilter !== 'all' && item.edge.epistemicNature !== epistemicFilter) {
      return false;
    }
    return true;
  });
}

export function getEdgesBetweenNodes(
  nodeIds: Set<VerseId>,
  allowedRelationships?: Set<RelationshipType>,
  epistemicFilter: EpistemicFilter = 'all'
): CrossReferenceEdge[] {
  const seen = new Set<string>();
  const results: CrossReferenceEdge[] = [];

  for (const nodeId of nodeIds) {
    const adjacent = ADJACENCY_INDEX.get(nodeId);
    if (!adjacent) continue;
    for (const item of adjacent) {
      const { edge } = item;
      if (seen.has(edge.id)) continue;
      if (allowedRelationships && !allowedRelationships.has(edge.relationship)) continue;
      if (epistemicFilter !== 'all' && edge.epistemicNature !== epistemicFilter) continue;
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        seen.add(edge.id);
        results.push(edge);
      }
    }
  }

  return results;
}

export function buildGraphAtDepth(
  anchorId: VerseId = 'JHN.3.16',
  depth = 2,
  allowedRelationships?: Set<RelationshipType>,
  maxNodes = 65,
  epistemicFilter: EpistemicFilter = 'all'
): { nodeIds: VerseId[]; depthMap: Record<VerseId, number> } {
  const safeAnchor = getVerseById(anchorId) ? anchorId : 'JHN.3.16';
  const clampedDepth = Math.max(0, Math.min(4, depth));
  const depthMap: Record<VerseId, number> = { [safeAnchor]: 0 };
  const visited = new Set<VerseId>([safeAnchor]);
  const queue: { id: VerseId; level: number }[] = [{ id: safeAnchor, level: 0 }];

  while (queue.length > 0 && visited.size < maxNodes) {
    const { id, level } = queue.shift()!;
    if (level >= clampedDepth) continue;

    const neighbors = getConnectedPassages(id, allowedRelationships, epistemicFilter);
    for (const item of neighbors) {
      if (visited.size >= maxNodes) break;
      if (!visited.has(item.verse.id)) {
        visited.add(item.verse.id);
        depthMap[item.verse.id] = level + 1;
        queue.push({ id: item.verse.id, level: level + 1 });
      }
    }
  }

  return {
    nodeIds: Array.from(visited),
    depthMap,
  };
}

export function computeHopDistancesFromAnchor(
  anchorId: VerseId,
  nodeIds: Set<VerseId>,
  allowedRelationships?: Set<RelationshipType>,
  epistemicFilter: EpistemicFilter = 'all'
): Record<VerseId, number> {
  const dist: Record<VerseId, number> = {};
  if (!nodeIds.has(anchorId)) return dist;

  dist[anchorId] = 0;
  const queue: VerseId[] = [anchorId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = dist[current];
    const neighbors = getConnectedPassages(current, allowedRelationships, epistemicFilter);
    for (const item of neighbors) {
      const nId = item.verse.id;
      if (nodeIds.has(nId) && dist[nId] === undefined) {
        dist[nId] = currentDist + 1;
        queue.push(nId);
      }
    }
  }

  return dist;
}

export function findShortestScripturePath(
  sourceId: VerseId,
  targetId: VerseId,
  allowedRelationships?: Set<RelationshipType>,
  epistemicFilter: EpistemicFilter = 'all'
): ScripturePathResult | null {
  if (!getVerseById(sourceId) || !getVerseById(targetId)) return null;
  if (sourceId === targetId) {
    return { nodeIds: [sourceId], edges: [], steps: [] };
  }

  const visited = new Set<VerseId>([sourceId]);
  const parent = new Map<VerseId, { prevId: VerseId; edge: CrossReferenceEdge }>();
  const queue: VerseId[] = [sourceId];

  let found = false;
  while (queue.length > 0 && !found) {
    const current = queue.shift()!;
    const neighbors = getConnectedPassages(current, allowedRelationships, epistemicFilter);
    for (const item of neighbors) {
      const nextId = item.verse.id;
      if (!visited.has(nextId)) {
        visited.add(nextId);
        parent.set(nextId, { prevId: current, edge: item.edge });
        if (nextId === targetId) {
          found = true;
          break;
        }
        queue.push(nextId);
      }
    }
  }

  if (!found) return null;

  const nodeIds: VerseId[] = [];
  const edges: CrossReferenceEdge[] = [];
  const steps: ScripturePathResult['steps'] = [];

  let cursor: VerseId | undefined = targetId;
  while (cursor && cursor !== sourceId) {
    nodeIds.unshift(cursor);
    const link = parent.get(cursor);
    if (!link) break;
    edges.unshift(link.edge);
    const fromVerse = getVerseById(link.prevId);
    const toVerse = getVerseById(cursor);
    if (fromVerse && toVerse) {
      steps.unshift({ from: fromVerse, to: toVerse, edge: link.edge });
    }
    cursor = link.prevId;
  }
  nodeIds.unshift(sourceId);

  return { nodeIds, edges, steps };
}

export function searchWithinNodes(query: string, nodeIds: VerseId[]): VerseId[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const matches: VerseId[] = [];
  for (const id of nodeIds) {
    const verse = getVerseById(id);
    if (!verse) continue;
    if (
      verse.reference.toLowerCase().includes(trimmed) ||
      verse.shortRef.toLowerCase().includes(trimmed) ||
      verse.text.toLowerCase().includes(trimmed) ||
      verse.bookName.toLowerCase().includes(trimmed) ||
      verse.keyTerms?.some((t) => t.toLowerCase().includes(trimmed))
    ) {
      matches.push(id);
    }
  }
  return matches;
}

export function buildSeedGraphIds(anchorId: VerseId = 'JHN.3.16', maxNodes = 10): VerseId[] {
  return buildGraphAtDepth(anchorId, 2, undefined, maxNodes).nodeIds;
}

export function getThemesForVerse(verseId: VerseId): Theme[] {
  return BIBLICAL_THEMES.filter((theme) => theme.verseIds.includes(verseId));
}

export function getLocationsForVerse(verseId: VerseId): BiblicalLocation[] {
  return BIBLICAL_LOCATIONS.filter((loc) => loc.verseIds.includes(verseId));
}

export function getSanctuaryForVerse(verseId: VerseId): SanctuaryArticle[] {
  return SANCTUARY_ARTICLES.filter(
    (art) =>
      art.verseIds.includes(verseId) ||
      art.canonicalConnections.some((conn) => conn.verseIds.includes(verseId))
  );
}

export function getEventsForVerse(verseId: VerseId): BiblicalEvent[] {
  return BIBLICAL_EVENTS.filter((evt) => evt.verseIds.includes(verseId));
}

export function getCrossModuleContextForEvent(event: BiblicalEvent): {
  locations: BiblicalLocation[];
  journeys: BiblicalJourney[];
  sanctuaryArticles: SanctuaryArticle[];
  relatedThemes: Theme[];
} {
  const eventVerseSet = new Set(event.verseIds);

  const locations = BIBLICAL_LOCATIONS.filter(
    (loc) =>
      loc.eventIds.includes(event.id) ||
      loc.verseIds.some((vId) => eventVerseSet.has(vId))
  );

  const journeys = BIBLICAL_JOURNEYS.filter(
    (j) =>
      j.eventIds.includes(event.id) ||
      j.waypoints.some((wp) => wp.verseIds.some((vId) => eventVerseSet.has(vId)))
  );

  const sanctuaryArticles = SANCTUARY_ARTICLES.filter(
    (art) =>
      art.verseIds.some((vId) => eventVerseSet.has(vId)) ||
      art.canonicalConnections.some((conn) =>
        conn.verseIds.some((vId) => eventVerseSet.has(vId))
      )
  );

  const relatedThemes = BIBLICAL_THEMES.filter((theme) =>
    theme.verseIds.some((vId) => eventVerseSet.has(vId))
  );

  return {
    locations,
    journeys,
    sanctuaryArticles,
    relatedThemes,
  };
}

function matchBooksForQuery(rawBookToken: string): BibleBook[] {
  const cleaned = rawBookToken.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const compact = cleaned.replace(/\s+/g, '');
  const aliasId = BOOK_ALIASES[cleaned] ?? BOOK_ALIASES[compact];
  if (aliasId && BOOK_MAP[aliasId]) {
    return [BOOK_MAP[aliasId]];
  }
  return BIBLE_BOOKS.filter(
    (b) =>
      b.name.toLowerCase().startsWith(cleaned) ||
      b.shortName.toLowerCase().startsWith(cleaned) ||
      b.name.toLowerCase().replace(/\s+/g, '').startsWith(compact) ||
      b.id.toLowerCase() === compact
  );
}

export function searchScripture(rawQuery: string): SearchResult[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const lower = query.toLowerCase();
  const results: SearchResult[] = [];
  const seenIds = new Set<string>();

  // 0. OSIS reference e.g. "JHN.3.16"
  const osisMatch = query.trim().toUpperCase().match(/^([1-3A-Z]+)\.(\d+)\.(\d+)$/);
  if (osisMatch && BOOK_MAP[osisMatch[1]]) {
    const book = BOOK_MAP[osisMatch[1]];
    const chNum = parseInt(osisMatch[2], 10);
    const vNum = parseInt(osisMatch[3], 10);
    if (chNum >= 1 && chNum <= book.chapterCount) {
      const exactId = `${book.id}.${chNum}.${vNum}`;
      const v = getVerseById(exactId);
      seenIds.add(`v-${exactId}`);
      results.push({
        type: v ? 'verse' : 'chapter',
        id: `v-${exactId}`,
        title: `${book.name} ${chNum}:${vNum}`,
        subtitle: v ? `${v.testament} · KJV` : `Open in Reader · ${book.division}`,
        snippet: v?.text,
        verseId: exactId,
        bookId: book.id,
        chapter: chNum,
      });
    }
  }

  // 1. Reference parsing: e.g. "John 3:16", "1Cor 13", "Ps 23:1", "Obadiah 1"
  const refMatch = lower.match(/^([1-3]?\s*[a-z]+(?:\s+[a-z]+)*)\s+(\d+)(?:[:.](\d+))?$/i);
  if (refMatch) {
    const chNum = parseInt(refMatch[2], 10);
    const vNum = refMatch[3] ? parseInt(refMatch[3], 10) : undefined;
    const matchedBooks = matchBooksForQuery(refMatch[1]);

    for (const book of matchedBooks) {
      if (chNum >= 1 && chNum <= book.chapterCount) {
        if (vNum !== undefined) {
          const exactId = `${book.id}.${chNum}.${vNum}`;
          const exactVerse = getVerseById(exactId);
          if (exactVerse && !seenIds.has(`v-${exactVerse.id}`)) {
            seenIds.add(`v-${exactVerse.id}`);
            results.push({
              type: 'verse',
              id: `v-${exactVerse.id}`,
              title: exactVerse.reference,
              subtitle: `${exactVerse.testament} · ${exactVerse.translation}`,
              snippet: exactVerse.text,
              verseId: exactVerse.id,
              bookId: exactVerse.bookId,
              chapter: exactVerse.chapter,
            });
          } else if (!exactVerse && !seenIds.has(`ch-${book.id}.${chNum}`)) {
            seenIds.add(`ch-${book.id}.${chNum}`);
            results.push({
              type: 'chapter',
              id: `ch-${book.id}.${chNum}`,
              title: `${book.name} ${chNum}:${vNum}`,
              subtitle: `Open chapter in Reader · ${book.division}`,
              bookId: book.id,
              chapter: chNum,
              verseId: exactId,
            });
          }
        }

        const chapterVerses = getChapterVerses(book.id, chNum);
        if (!seenIds.has(`ch-${book.id}.${chNum}`)) {
          seenIds.add(`ch-${book.id}.${chNum}`);
          results.push({
            type: 'chapter',
            id: `ch-${book.id}.${chNum}`,
            title: `${book.name} ${chNum}`,
            subtitle:
              chapterVerses.length > 0
                ? `${chapterVerses.length} verses · ${book.division}`
                : `${book.division} · Bible Chapter`,
            snippet: chapterVerses[0]?.text,
            bookId: book.id,
            chapter: chNum,
            verseId: chapterVerses[0]?.id ?? `${book.id}.${chNum}.1`,
          });
        }
      }
    }
  }

  // 2. Book name match (covers all 66 canonical books + aliases)
  for (const book of BIBLE_BOOKS) {
    if (
      book.name.toLowerCase().includes(lower) ||
      book.shortName.toLowerCase() === lower ||
      BOOK_ALIASES[lower.replace(/\s+/g, '')] === book.id
    ) {
      const chapters = getAvailableChaptersForBook(book.id);
      const firstChapter = chapters.length > 0 ? chapters[0].chapterNumber : 1;
      const firstVerseId =
        chapters.length > 0 ? chapters[0].verseIds[0] : `${book.id}.1.1`;
      if (!seenIds.has(`book-${book.id}`)) {
        seenIds.add(`book-${book.id}`);
        results.push({
          type: 'book',
          id: `book-${book.id}`,
          title: book.name,
          subtitle: `${book.testament === 'OT' ? 'Old Testament' : 'New Testament'} · ${book.chapterCount} ch · ${book.division}`,
          bookId: book.id,
          chapter: firstChapter,
          verseId: firstVerseId,
        });
      }
    }
  }

  // 3. Theme match
  for (const theme of BIBLICAL_THEMES) {
    if (
      theme.name.toLowerCase().includes(lower) ||
      theme.summary.toLowerCase().includes(lower)
    ) {
      if (!seenIds.has(`theme-${theme.id}`)) {
        seenIds.add(`theme-${theme.id}`);
        results.push({
          type: 'theme',
          id: `theme-${theme.id}`,
          title: theme.name,
          subtitle: `Biblical Theme · ${theme.verseIds.length} passages`,
          snippet: theme.summary,
          themeId: theme.id,
          verseId: theme.featuredAnchorId,
        });
      }
    }
  }

  // 3b. Biblical Location match
  for (const loc of BIBLICAL_LOCATIONS) {
    const haystack = [
      loc.name,
      loc.region,
      ...loc.historicalNames,
      loc.significance,
    ]
      .join(' ')
      .toLowerCase();
    if (haystack.includes(lower) && !seenIds.has(`loc-${loc.id}`)) {
      seenIds.add(`loc-${loc.id}`);
      results.push({
        type: 'location',
        id: `loc-${loc.id}`,
        title: loc.name,
        subtitle: `${LOCATION_CATEGORY_META[loc.category].label} · ${loc.region}`,
        snippet: loc.significance,
        locationId: loc.id,
        verseId: loc.verseIds[0],
      });
    }
  }

  // 3c. Sanctuary Component match
  const sanctuaryMatches: { score: number; result: SearchResult }[] = [];
  for (const art of SANCTUARY_ARTICLES) {
    const nameMatch =
      art.name.toLowerCase().includes(lower) ||
      (art.hebrewTerm?.toLowerCase().includes(lower) ?? false);
    const haystack = [
      art.name,
      art.hebrewTerm ?? '',
      art.compartment,
      art.material,
      art.biblicalDescription,
      art.symbolism,
    ]
      .join(' ')
      .toLowerCase();
    if (haystack.includes(lower) && !seenIds.has(`sanc-${art.id}`)) {
      seenIds.add(`sanc-${art.id}`);
      sanctuaryMatches.push({
        score: nameMatch ? 2 : 1,
        result: {
          type: 'sanctuary',
          id: `sanc-${art.id}`,
          title: art.name,
          subtitle: `Sanctuary · ${art.compartment}`,
          snippet: art.biblicalDescription,
          sanctuaryId: art.id,
          verseId: art.verseIds[0],
        },
      });
    }
  }
  sanctuaryMatches.sort((a, b) => b.score - a.score);
  for (const item of sanctuaryMatches) {
    results.push(item.result);
  }

  // 4. Verse reference or text match across anchor verses + any dynamically loaded books
  const searchableVerses: Verse[] = [...SAMPLE_VERSES];
  for (const id of Object.keys(DYNAMIC_VERSE_MAP)) {
    if (!VERSE_MAP[id]) {
      searchableVerses.push(DYNAMIC_VERSE_MAP[id]);
    }
  }

  for (const verse of searchableVerses) {
    if (results.length >= 24) break;
    const key = `v-${verse.id}`;
    if (seenIds.has(key)) continue;

    const matchRef =
      verse.reference.toLowerCase().includes(lower) ||
      verse.shortRef.toLowerCase().includes(lower);
    const matchText = verse.text.toLowerCase().includes(lower);
    const matchTerm = verse.keyTerms?.some((t) => t.toLowerCase().includes(lower));

    if (matchRef || matchText || matchTerm) {
      seenIds.add(key);
      results.push({
        type: 'verse',
        id: key,
        title: verse.reference,
        subtitle: `${verse.testament} · ${verse.translation}`,
        snippet: verse.text,
        verseId: verse.id,
        bookId: verse.bookId,
        chapter: verse.chapter,
      });
    }
  }

  return results.slice(0, 18);
}

/**
 * Progressive full-corpus search across all 66 canonical KJV books (31,102 verses).
 * Loads un-cached book JSON chunks in batches and emits incremental SearchResult[] updates.
 */
export async function searchFullCorpus(
  rawQuery: string,
  options?: {
    maxResults?: number;
    signal?: AbortSignal;
    onProgress?: (progress: CorpusSearchProgress) => void;
  }
): Promise<SearchResult[]> {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 3) return [];

  const maxResults = options?.maxResults ?? 25;
  const tokens = query.split(/\s+/).filter((t) => t.length >= 2);
  const matches: SearchResult[] = [];
  const seen = new Set<VerseId>();

  const scanBookMap = (bookId: string) => {
    const chMap = LOADED_BOOKS_CACHE.get(bookId);
    if (!chMap) return;
    for (const verses of chMap.values()) {
      for (const verse of verses) {
        if (matches.length >= maxResults) return;
        if (seen.has(verse.id)) continue;
        const lowerText = verse.text.toLowerCase();
        const exactPhrase = lowerText.includes(query);
        const allTokens =
          !exactPhrase &&
          tokens.length > 1 &&
          tokens.every((tok) => lowerText.includes(tok));
        if (exactPhrase || allTokens) {
          seen.add(verse.id);
          matches.push({
            type: 'verse',
            id: `corpus-${verse.id}`,
            title: verse.reference,
            subtitle: `${verse.testament} · KJV Full Corpus`,
            snippet: verse.text,
            verseId: verse.id,
            bookId: verse.bookId,
            chapter: verse.chapter,
          });
        }
      }
    }
  };

  let loadedCount = 0;
  const unloadedBooks: string[] = [];
  for (const book of BIBLE_BOOKS) {
    if (LOADED_BOOKS_CACHE.has(book.id)) {
      loadedCount += 1;
      scanBookMap(book.id);
    } else {
      unloadedBooks.push(book.id);
    }
  }

  options?.onProgress?.({
    loadedBooks: loadedCount,
    totalBooks: BIBLE_BOOKS.length,
    done: unloadedBooks.length === 0,
    matches: [...matches],
  });

  const BATCH_SIZE = 8;
  for (let i = 0; i < unloadedBooks.length; i += BATCH_SIZE) {
    if (options?.signal?.aborted || matches.length >= maxResults) break;
    const batch = unloadedBooks.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (bid) => {
        try {
          await loadBookKjv(bid);
        } catch {
          // Ignore single book load failure
        }
      })
    );
    if (options?.signal?.aborted) break;
    for (const bid of batch) {
      loadedCount += 1;
      scanBookMap(bid);
    }
    options?.onProgress?.({
      loadedBooks: loadedCount,
      totalBooks: BIBLE_BOOKS.length,
      done: i + BATCH_SIZE >= unloadedBooks.length || matches.length >= maxResults,
      matches: [...matches],
    });
  }

  return matches;
}

export function queryBiblicalLocations(filters: {
  query?: string;
  category?: LocationCategory | 'all';
  period?: BiblicalPeriodId | 'all';
}): BiblicalLocation[] {
  const q = filters.query?.trim().toLowerCase() ?? '';
  return BIBLICAL_LOCATIONS.filter((loc) => {
    if (filters.category && filters.category !== 'all' && loc.category !== filters.category) {
      return false;
    }
    if (filters.period && filters.period !== 'all' && !loc.periods.includes(filters.period)) {
      return false;
    }
    if (q) {
      const haystack = [
        loc.name,
        loc.region,
        ...loc.historicalNames,
        loc.description,
        loc.significance,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function getJourneysForLocation(locationId: string): BiblicalJourney[] {
  return BIBLICAL_JOURNEYS.filter((j) =>
    j.waypoints.some((wp) => wp.locationId === locationId)
  );
}

export function getDatasetSummary() {
  return {
    totalCanonicalBooks: BIBLE_BOOKS.length,
    totalFullKjvVerses: TOTAL_FULL_KJV_VERSES,
    indexedBooksCount: BOOKS_WITH_SAMPLE_TEXT.size,
    loadedBooksCount: LOADED_BOOKS_CACHE.size,
    indexedChaptersCount: SAMPLE_CHAPTERS.length,
    indexedVersesCount: SAMPLE_VERSES.length,
    loadedVersesCount: Object.keys(DYNAMIC_VERSE_MAP).length,
    crossReferenceCount: CROSS_REFERENCES.length,
  };
}
