import { STARTER_COLLECTIONS } from '../data/collections';
import {
  AtlasTheme,
  BibleTranslationId,
  HighlightColor,
  SavedGraphConfig,
  StudyCollection,
  UserStudyState,
  Verse,
  VerseId,
} from '../types/scripture';

export interface StudyStorageRepository {
  loadState(): Promise<UserStudyState>;
  saveState(state: UserStudyState): Promise<void>;
}

const STORAGE_KEY = 'scripture_atlas_study_state_v1';
const THEME_STORAGE_KEY = 'scripture_atlas_theme_v1';
export const SYNC_CHANNEL_NAME = 'scripture_atlas_sync_v1';

const VALID_HIGHLIGHTS = new Set<HighlightColor>(['gold', 'teal', 'rose', 'indigo']);
const VALID_LAYOUTS = new Set(['cose', 'concentric', 'breadthfirst', 'circle']);
const VALID_TRANSLATIONS = new Set<BibleTranslationId>(['KJV', 'ASV', 'YLT']);

export function loadStoredTheme(): AtlasTheme {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'dark';
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveStoredTheme(theme: AtlasTheme): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Ignore storage errors
  }
}

export function createInitialStudyState(): UserStudyState {
  return {
    bookmarks: ['JHN.3.16', 'GEN.1.1', 'PSA.23.1', 'HEB.8.1'],
    highlights: {
      'JHN.3.16': 'gold',
      'EXO.25.8': 'teal',
      'ISA.53.5': 'gold',
    },
    notes: {
      'JHN.3.16':
        'Connects directly back to Numbers 21:9 (bronze serpent lifted up) and anchors Romans 5:8 and 1 John 4:9.',
    },
    collections: STARTER_COLLECTIONS,
    recentSearches: ['John 3:16', 'Sanctuary', 'Isaiah 53:5', 'Genesis 1:1'],
    savedGraphs: [],
    readChapters: [],
    preferredTranslation: 'KJV',
  };
}

function normalizePartialState(parsed: Partial<UserStudyState>): UserStudyState {
  const defaults = createInitialStudyState();

  const bookmarks = Array.isArray(parsed.bookmarks)
    ? Array.from(new Set(parsed.bookmarks.filter((v): v is string => typeof v === 'string')))
    : defaults.bookmarks;

  const highlights: Record<VerseId, HighlightColor> = {};
  if (parsed.highlights && typeof parsed.highlights === 'object') {
    for (const [k, v] of Object.entries(parsed.highlights)) {
      if (typeof k === 'string' && VALID_HIGHLIGHTS.has(v as HighlightColor)) {
        highlights[k] = v as HighlightColor;
      }
    }
  } else {
    Object.assign(highlights, defaults.highlights);
  }

  const notes: Record<VerseId, string> = {};
  if (parsed.notes && typeof parsed.notes === 'object') {
    for (const [k, v] of Object.entries(parsed.notes)) {
      if (typeof k === 'string' && typeof v === 'string' && v.trim()) {
        notes[k] = v;
      }
    }
  } else {
    Object.assign(notes, defaults.notes);
  }

  const collections: StudyCollection[] =
    Array.isArray(parsed.collections) && parsed.collections.length > 0
      ? parsed.collections
          .filter(
            (c): c is StudyCollection =>
              Boolean(c) &&
              typeof c.id === 'string' &&
              typeof c.title === 'string' &&
              Array.isArray(c.verseIds)
          )
          .map((c) => ({
            id: c.id,
            title: c.title,
            description: typeof c.description === 'string' ? c.description : '',
            verseIds: Array.from(
              new Set(c.verseIds.filter((v): v is string => typeof v === 'string'))
            ),
            isSystem: Boolean(c.isSystem),
            createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
            updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : new Date().toISOString(),
          }))
      : defaults.collections;

  const recentSearches = Array.isArray(parsed.recentSearches)
    ? parsed.recentSearches.filter((s): s is string => typeof s === 'string').slice(0, 8)
    : defaults.recentSearches;

  const savedGraphs: SavedGraphConfig[] = Array.isArray(parsed.savedGraphs)
    ? parsed.savedGraphs.filter(
        (g): g is SavedGraphConfig =>
          Boolean(g) &&
          typeof g.id === 'string' &&
          typeof g.name === 'string' &&
          typeof g.anchorVerseId === 'string' &&
          Array.isArray(g.visibleNodeIds) &&
          Array.isArray(g.activeRelationships) &&
          VALID_LAYOUTS.has(g.layout)
      )
    : [];

  const readChapters = Array.isArray(parsed.readChapters)
    ? Array.from(
        new Set(
          parsed.readChapters.filter(
            (ch): ch is string => typeof ch === 'string' && /^[1-3A-Z]+\.\d+$/.test(ch)
          )
        )
      )
    : [];

  const preferredTranslation: BibleTranslationId =
    parsed.preferredTranslation && VALID_TRANSLATIONS.has(parsed.preferredTranslation)
      ? parsed.preferredTranslation
      : 'KJV';

  return {
    bookmarks,
    highlights,
    notes,
    collections,
    recentSearches,
    savedGraphs,
    readChapters,
    preferredTranslation,
  };
}

function broadcastState(state: UserStudyState): void {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage({ type: 'STUDY_STATE_UPDATED', state });
      channel.close();
    }
  } catch {
    // Ignore BroadcastChannel errors in restricted contexts
  }
}

class LocalStorageStudyRepository implements StudyStorageRepository {
  async loadState(): Promise<UserStudyState> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return createInitialStudyState();
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return createInitialStudyState();
      }
      const parsed = JSON.parse(raw) as Partial<UserStudyState>;
      return normalizePartialState(parsed);
    } catch {
      return createInitialStudyState();
    }
  }

  async saveState(state: UserStudyState): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
      broadcastState(state);
    } catch {
      // Ignore storage quota errors gracefully
    }
  }
}

export const studyRepository: StudyStorageRepository = new LocalStorageStudyRepository();

export function subscribeToStudyStateChanges(
  callback: (state: UserStudyState) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.onmessage = (evt) => {
        if (evt.data?.type === 'STUDY_STATE_UPDATED' && evt.data?.state) {
          callback(normalizePartialState(evt.data.state));
        }
      };
    }
  } catch {
    channel = null;
  }

  const handleStorage = (evt: StorageEvent) => {
    if (evt.key === STORAGE_KEY && evt.newValue) {
      try {
        const parsed = JSON.parse(evt.newValue) as Partial<UserStudyState>;
        callback(normalizePartialState(parsed));
      } catch {
        // Ignore malformed cross-tab payload
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    try {
      channel?.close();
    } catch {
      // Ignore
    }
  };
}

export function exportStudyStateAsJson(state: UserStudyState): string {
  return JSON.stringify(
    {
      app: 'Scripture Atlas',
      version: 2,
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2
  );
}

export function exportStudyStateAsMarkdown(
  state: UserStudyState,
  resolveVerse: (id: VerseId) => Verse | undefined
): string {
  const lines: string[] = [
    '# Scripture Atlas Study Archive',
    `Exported: ${new Date().toISOString()}`,
    `Reading Progress: ${state.readChapters.length} / 1,189 chapters completed`,
    '',
    `## Bookmarks (${state.bookmarks.length})`,
    '',
  ];

  if (state.bookmarks.length === 0) {
    lines.push('_No bookmarked verses._', '');
  } else {
    for (const vId of state.bookmarks) {
      const verse = resolveVerse(vId);
      const ref = verse?.reference ?? vId;
      const hl = state.highlights[vId] ? ` [${state.highlights[vId]}]` : '';
      lines.push(`### ${ref}${hl}`);
      if (verse?.text) {
        lines.push(`> ${verse.text}`);
      }
      if (state.notes[vId]) {
        lines.push('', `**Note:** ${state.notes[vId]}`);
      }
      lines.push('');
    }
  }

  lines.push(`## Study Notes (${Object.keys(state.notes).length})`, '');
  for (const [vId, note] of Object.entries(state.notes)) {
    const verse = resolveVerse(vId);
    lines.push(`- **${verse?.reference ?? vId}:** ${note}`);
  }
  lines.push('');

  lines.push(`## Collections (${state.collections.length})`, '');
  for (const col of state.collections) {
    lines.push(`### ${col.title} (${col.verseIds.length} passages)`);
    if (col.description) {
      lines.push(col.description);
    }
    lines.push('');
    for (const vId of col.verseIds) {
      const verse = resolveVerse(vId);
      lines.push(`- **${verse?.reference ?? vId}**${verse ? ` — ${verse.text}` : ''}`);
    }
    lines.push('');
  }

  if (state.savedGraphs.length > 0) {
    lines.push(`## Saved Graph Snapshots (${state.savedGraphs.length})`, '');
    for (const cfg of state.savedGraphs) {
      lines.push(
        `- **${cfg.name}** (Anchor: ${cfg.anchorVerseId}, Layout: ${cfg.layout}, ${cfg.visibleNodeIds.length} nodes)`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function parseAndValidateStudyImport(
  rawText: string
): { ok: true; state: UserStudyState } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(rawText) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Backup file must contain a valid JSON object.' };
    }

    const obj = parsed as Record<string, unknown>;
    const candidate =
      obj.state && typeof obj.state === 'object'
        ? (obj.state as Partial<UserStudyState>)
        : (obj as Partial<UserStudyState>);

    const hasRecognizedKeys =
      'bookmarks' in candidate ||
      'highlights' in candidate ||
      'notes' in candidate ||
      'collections' in candidate ||
      'savedGraphs' in candidate ||
      'readChapters' in candidate;

    if (!hasRecognizedKeys) {
      return {
        ok: false,
        error: 'JSON file does not match the Scripture Atlas study archive schema.',
      };
    }

    if (candidate.bookmarks !== undefined && !Array.isArray(candidate.bookmarks)) {
      return { ok: false, error: 'Invalid "bookmarks" array in backup file.' };
    }
    if (candidate.collections !== undefined && !Array.isArray(candidate.collections)) {
      return { ok: false, error: 'Invalid "collections" array in backup file.' };
    }

    return {
      ok: true,
      state: normalizePartialState(candidate),
    };
  } catch {
    return { ok: false, error: 'Could not parse JSON backup file.' };
  }
}

export function mergeStudyStates(
  current: UserStudyState,
  incoming: UserStudyState,
  mode: 'merge' | 'replace'
): UserStudyState {
  if (mode === 'replace') {
    return normalizePartialState(incoming);
  }

  const bookmarks = Array.from(new Set([...incoming.bookmarks, ...current.bookmarks]));
  const highlights: Record<VerseId, HighlightColor> = {
    ...current.highlights,
    ...incoming.highlights,
  };
  const notes: Record<VerseId, string> = {
    ...current.notes,
    ...incoming.notes,
  };

  const collectionMap = new Map<string, StudyCollection>();
  for (const col of current.collections) {
    collectionMap.set(col.id, col);
  }
  for (const col of incoming.collections) {
    const existing = collectionMap.get(col.id);
    if (existing) {
      collectionMap.set(col.id, {
        ...existing,
        title: col.title || existing.title,
        description: col.description || existing.description,
        verseIds: Array.from(new Set([...existing.verseIds, ...col.verseIds])),
        updatedAt: new Date().toISOString(),
      });
    } else {
      collectionMap.set(col.id, col);
    }
  }

  const graphMap = new Map<string, SavedGraphConfig>();
  for (const g of incoming.savedGraphs) {
    graphMap.set(g.id, g);
  }
  for (const g of current.savedGraphs) {
    if (!graphMap.has(g.id)) {
      graphMap.set(g.id, g);
    }
  }

  const recentSearches = Array.from(
    new Set([...incoming.recentSearches, ...current.recentSearches])
  ).slice(0, 8);

  const readChapters = Array.from(
    new Set([...(current.readChapters ?? []), ...(incoming.readChapters ?? [])])
  );

  return {
    bookmarks,
    highlights,
    notes,
    collections: Array.from(collectionMap.values()),
    recentSearches,
    savedGraphs: Array.from(graphMap.values()).slice(0, 12),
    readChapters,
    preferredTranslation: incoming.preferredTranslation ?? current.preferredTranslation ?? 'KJV',
  };
}

export function toggleBookmarkInState(state: UserStudyState, verseId: VerseId): UserStudyState {
  const exists = state.bookmarks.includes(verseId);
  return {
    ...state,
    bookmarks: exists
      ? state.bookmarks.filter((id) => id !== verseId)
      : [verseId, ...state.bookmarks],
  };
}

export function setHighlightInState(
  state: UserStudyState,
  verseId: VerseId,
  color: HighlightColor | null
): UserStudyState {
  const next = { ...state.highlights };
  if (color === null || next[verseId] === color) {
    delete next[verseId];
  } else {
    next[verseId] = color;
  }
  return { ...state, highlights: next };
}

export function setNoteInState(
  state: UserStudyState,
  verseId: VerseId,
  note: string
): UserStudyState {
  const next = { ...state.notes };
  if (!note.trim()) {
    delete next[verseId];
  } else {
    next[verseId] = note;
  }
  return { ...state, notes: next };
}

export function toggleReadChapterInState(
  state: UserStudyState,
  bookId: string,
  chapter: number
): UserStudyState {
  const chapterKey = `${bookId}.${chapter}`;
  const current = state.readChapters ?? [];
  const exists = current.includes(chapterKey);
  return {
    ...state,
    readChapters: exists
      ? current.filter((c) => c !== chapterKey)
      : [...current, chapterKey],
  };
}

export function setPreferredTranslationInState(
  state: UserStudyState,
  translation: BibleTranslationId
): UserStudyState {
  return {
    ...state,
    preferredTranslation: translation,
  };
}

export function addCollectionToState(
  state: UserStudyState,
  title: string,
  description: string,
  initialVerseIds: VerseId[] = []
): { state: UserStudyState; collection: StudyCollection } {
  const now = new Date().toISOString();
  const collection: StudyCollection = {
    id: `col-${Date.now()}`,
    title: title.trim(),
    description: description.trim(),
    verseIds: Array.from(new Set(initialVerseIds)),
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  };
  return {
    collection,
    state: {
      ...state,
      collections: [collection, ...state.collections],
    },
  };
}

export function toggleVerseInCollectionState(
  state: UserStudyState,
  collectionId: string,
  verseId: VerseId
): UserStudyState {
  return {
    ...state,
    collections: state.collections.map((col) => {
      if (col.id !== collectionId) return col;
      const exists = col.verseIds.includes(verseId);
      return {
        ...col,
        verseIds: exists
          ? col.verseIds.filter((id) => id !== verseId)
          : [...col.verseIds, verseId],
        updatedAt: new Date().toISOString(),
      };
    }),
  };
}

export function saveGraphConfigInState(
  state: UserStudyState,
  config: Omit<SavedGraphConfig, 'id' | 'createdAt'>
): UserStudyState {
  const saved: SavedGraphConfig = {
    ...config,
    id: `graph-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  return {
    ...state,
    savedGraphs: [saved, ...state.savedGraphs].slice(0, 12),
  };
}
