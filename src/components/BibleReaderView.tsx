import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Compass,
  FolderPlus,
  GitFork,
  History,
  Landmark,
  Languages,
  Layers,
  PanelRightOpen,
  Search,
  X,
} from 'lucide-react';
import {
  CONFIDENCE_META,
  EDITORIAL_STATUS_META,
  EPISTEMIC_META,
  RELATIONSHIP_METADATA,
} from '../data/relationships';
import {
  EpistemicFilter,
  formatReferenceFromId,
  getAllBooks,
  getAvailableChaptersForBook,
  getBookById,
  getChapterVerses,
  getChapterVersesInTranslation,
  getConnectedPassages,
  getEventsForVerse,
  getLocationsForVerse,
  getSanctuaryForVerse,
  getThemesForVerse,
  getVerseById,
  getVerseInTranslation,
  isBookLoaded,
  loadBookKjv,
  loadBookStrongsVerses,
  loadBookTranslation,
  loadTskConnectionsForVerse,
  parseStrongsTaggedText,
} from '../services/scriptureService';
import {
  BibleTranslationId,
  HighlightColor,
  StrongsWordToken,
  Testament,
  TskCrossReference,
  UserStudyState,
  VerseId,
} from '../types/scripture';
import { StrongsWordInspector } from './StrongsWordInspector';

interface BibleReaderViewProps {
  bookId: string;
  chapter: number;
  selectedVerseId: VerseId;
  translation: BibleTranslationId;
  onChangeTranslation: (tr: BibleTranslationId) => void;
  onToggleReadChapter: (bookId: string, chapter: number) => void;
  onNavigateReader: (bookId: string, chapter: number, verseId?: VerseId) => void;
  onSelectVerse: (verseId: VerseId) => void;
  onOpenInGraph: (verseId: VerseId) => void;
  onOpenTheme?: (themeId: string) => void;
  onOpenLocation?: (locationId: string) => void;
  onOpenSanctuary?: (sanctuaryId: string) => void;
  onOpenTimeline?: (eventId: string) => void;
  studyState: UserStudyState;
  onToggleBookmark: (verseId: VerseId) => void;
  onSetHighlight: (verseId: VerseId, color: HighlightColor | null) => void;
  onSaveNote: (verseId: VerseId, note: string) => void;
  onToggleVerseInCollection: (collectionId: string, verseId: VerseId) => void;
  onCreateCollectionForVerse: (verseId: VerseId) => void;
  onMapLexicalParallels?: (
    strongsId: string,
    lemma: string,
    originVerseId: VerseId,
    matchingVerses: VerseId[]
  ) => void;
}

const TRANSLATION_LABELS: Record<BibleTranslationId, string> = {
  KJV: '1769 King James Version',
  ASV: '1901 American Standard Version',
  YLT: "1898 Young's Literal Translation",
};

const HIGHLIGHT_CLASSES: Record<HighlightColor, string> = {
  gold: 'bg-[#D4894A]/15 border-[#D4894A]/40',
  teal: 'bg-[#4EC498]/12 border-[#4EC498]/35',
  rose: 'bg-[#E57399]/12 border-[#E57399]/35',
  indigo: 'bg-[#6FA8DC]/12 border-[#6FA8DC]/35',
};

export const BibleReaderView: React.FC<BibleReaderViewProps> = ({
  bookId,
  chapter,
  selectedVerseId,
  translation,
  onChangeTranslation,
  onToggleReadChapter,
  onNavigateReader,
  onSelectVerse,
  onOpenInGraph,
  onOpenTheme,
  onOpenLocation,
  onOpenSanctuary,
  onOpenTimeline,
  studyState,
  onToggleBookmark,
  onSetHighlight,
  onSaveNote,
  onToggleVerseInCollection,
  onCreateCollectionForVerse,
  onMapLexicalParallels,
}) => {
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | Testament>('ALL');
  const [bookSearch, setBookSearch] = useState('');
  const [collectionMenuOpen, setCollectionMenuOpen] = useState(false);
  const [epistemicFilter, setEpistemicFilter] = useState<EpistemicFilter>('all');
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [compareParallel, setCompareParallel] = useState(false);
  const [interlinearEnabled, setInterlinearEnabled] = useState(false);
  const [strongsBookMap, setStrongsBookMap] = useState<Map<string, string> | null>(null);
  const [selectedStrongsToken, setSelectedStrongsToken] = useState<{
    id: string;
    word: string;
    verseId: VerseId;
  } | null>(null);
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [corpusVersion, setCorpusVersion] = useState(0);
  const [tskLinks, setTskLinks] = useState<TskCrossReference[]>([]);
  const [tskLoading, setTskLoading] = useState(false);

  const allBooks = getAllBooks();
  const currentBook = getBookById(bookId) ?? allBooks[0];

  // Dynamically load active translation (and KJV base) for the active book
  useEffect(() => {
    let active = true;
    setLoadError(null);
    if (!isBookLoaded(currentBook.id)) {
      setLoadingBookId(currentBook.id);
    }

    const tasks: Promise<unknown>[] = [loadBookKjv(currentBook.id)];
    if (translation !== 'KJV') {
      tasks.push(loadBookTranslation(currentBook.id, translation));
    }
    if (compareParallel) {
      tasks.push(loadBookTranslation(currentBook.id, 'ASV'));
      tasks.push(loadBookTranslation(currentBook.id, 'YLT'));
    }

    Promise.all(tasks)
      .then(() => {
        if (active) {
          setLoadingBookId(null);
          setCorpusVersion((v) => v + 1);
        }
      })
      .catch((err) => {
        if (active) {
          setLoadingBookId(null);
          setLoadError(
            err instanceof Error ? err.message : `Unable to load ${translation} chapter.`
          );
        }
      });
    return () => {
      active = false;
    };
  }, [currentBook.id, translation, compareParallel]);

  useEffect(() => {
    if (!interlinearEnabled) return;
    let active = true;
    void loadBookStrongsVerses(currentBook.id)
      .then((map) => {
        if (active) setStrongsBookMap(map);
      })
      .catch(() => {
        if (active) setStrongsBookMap(null);
      });
    return () => {
      active = false;
    };
  }, [currentBook.id, interlinearEnabled]);

  const chapterVerses = useMemo(() => {
    const translated = getChapterVersesInTranslation(currentBook.id, chapter, translation);
    if (translated.length > 0) return translated;
    return getChapterVerses(currentBook.id, chapter);
  }, [currentBook.id, chapter, translation, corpusVersion]);

  const availableChapters = useMemo(
    () => getAvailableChaptersForBook(currentBook.id),
    [currentBook.id, corpusVersion]
  );

  const filteredBooks = useMemo(() => {
    return allBooks.filter((b) => {
      if (testamentFilter !== 'ALL' && b.testament !== testamentFilter) return false;
      if (
        bookSearch.trim() &&
        !b.name.toLowerCase().includes(bookSearch.trim().toLowerCase()) &&
        !b.shortName.toLowerCase().includes(bookSearch.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [allBooks, testamentFilter, bookSearch]);

  const readChapterSet = useMemo(
    () => new Set(studyState.readChapters ?? []),
    [studyState.readChapters]
  );

  const readCountByBook = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const chKey of readChapterSet) {
      const bId = chKey.split('.')[0];
      if (bId) counts[bId] = (counts[bId] ?? 0) + 1;
    }
    return counts;
  }, [readChapterSet]);

  const isCurrentChapterRead = readChapterSet.has(`${currentBook.id}.${chapter}`);

  const selectedVerseObj = getVerseInTranslation(selectedVerseId, translation) ?? getVerseById(selectedVerseId);
  const activeVerse =
    selectedVerseObj &&
    selectedVerseObj.bookId === currentBook.id &&
    selectedVerseObj.chapter === chapter
      ? selectedVerseObj
      : chapterVerses[0];

  // Load OpenBible TSK Tier-2 links for selected verse
  useEffect(() => {
    if (!activeVerse) {
      setTskLinks([]);
      return;
    }
    let active = true;
    setTskLoading(true);
    void loadTskConnectionsForVerse(activeVerse.id)
      .then((links) => {
        if (active) setTskLinks(links);
      })
      .catch(() => {
        if (active) setTskLinks([]);
      })
      .finally(() => {
        if (active) setTskLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeVerse?.id]);

  const allVerseConnections = activeVerse ? getConnectedPassages(activeVerse.id) : [];
  const connections = activeVerse
    ? getConnectedPassages(activeVerse.id, undefined, epistemicFilter)
    : [];

  const curatedIds = useMemo(
    () => new Set(allVerseConnections.map((c) => c.verse.id)),
    [allVerseConnections]
  );
  const additionalTskLinks = useMemo(
    () => tskLinks.filter((l) => !curatedIds.has(l.targetVerseId)),
    [tskLinks, curatedIds]
  );

  const linkedThemes = activeVerse ? getThemesForVerse(activeVerse.id) : [];
  const linkedLocations = activeVerse ? getLocationsForVerse(activeVerse.id) : [];
  const linkedSanctuary = activeVerse ? getSanctuaryForVerse(activeVerse.id) : [];
  const linkedEvents = activeVerse ? getEventsForVerse(activeVerse.id) : [];

  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < currentBook.chapterCount ? chapter + 1 : null;

  const handleBookClick = (targetBookId: string) => {
    const chs = getAvailableChaptersForBook(targetBookId);
    const firstCh = 1;
    const firstVerse =
      chs.find((c) => c.chapterNumber === 1)?.verseIds[0] ?? `${targetBookId}.1.1`;
    onNavigateReader(targetBookId, firstCh, firstVerse);
  };

  const handleSelectVerseInReader = (vId: VerseId) => {
    onSelectVerse(vId);
    setInspectorOpen(true);
  };

  return (
    <div className="relative flex-1 flex h-full overflow-hidden bg-[var(--atlas-bg)]">
      {/* Left: Full 66-Book Canonical Navigator */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--atlas-surface)] border-r border-[var(--atlas-border)] shrink-0 overflow-hidden">
        <div className="p-3 border-b border-[var(--atlas-border)] space-y-2.5">
          <div className="grid grid-cols-3 gap-1 p-0.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
            {(['ALL', 'OT', 'NT'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTestamentFilter(t)}
                className={`py-1 text-xs font-medium rounded transition-colors ${
                  testamentFilter === t
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                    : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                }`}
              >
                {t === 'ALL' ? 'All (66)' : t}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--atlas-text-subtle)] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Filter 66 books..."
              className="w-full h-8 pl-8 pr-2.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredBooks.map((book) => {
            const isCurrent = book.id === currentBook.id;
            const readCount = readCountByBook[book.id] ?? 0;
            const allRead = readCount >= book.chapterCount;
            return (
              <button
                key={book.id}
                type="button"
                onClick={() => handleBookClick(book.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors ${
                  isCurrent
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/35'
                    : 'text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)]/65 border border-transparent'
                }`}
              >
                <span className="truncate font-medium">{book.name}</span>
                <span
                  className={`font-mono text-[11px] tabular-nums shrink-0 ${
                    allRead
                      ? 'text-[var(--atlas-secondary)]'
                      : readCount > 0
                      ? 'text-[var(--atlas-accent)]'
                      : 'text-[var(--atlas-text-subtle)]'
                  }`}
                >
                  {readCount > 0 ? `${readCount}/${book.chapterCount}` : `${book.chapterCount} ch`}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Center: Reading Canvas */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Chapter Toolbar */}
        <div className="px-4 sm:px-6 py-3 bg-[var(--atlas-surface)]/80 border-b border-[var(--atlas-border)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              aria-label="Select Bible book"
              value={currentBook.id}
              onChange={(e) => handleBookClick(e.target.value)}
              className="md:hidden h-8 px-2.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)]"
            >
              {allBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <h2 className="font-scripture text-xl font-semibold text-[var(--atlas-heading)]">
                {currentBook.name} {chapter}
              </h2>
              <span className="text-xs text-[var(--atlas-text-subtle)]">·</span>
              <span className="text-xs text-[var(--atlas-text-muted)] hidden sm:inline">
                {TRANSLATION_LABELS[translation]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Translation Selector */}
            <div
              role="group"
              aria-label="Select translation"
              className="inline-flex items-center h-8 p-0.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)]"
            >
              {(['KJV', 'ASV', 'YLT'] as BibleTranslationId[]).map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => onChangeTranslation(tr)}
                  title={TRANSLATION_LABELS[tr]}
                  className={`px-2 h-full rounded text-[11px] font-mono font-medium transition-colors whitespace-nowrap ${
                    translation === tr
                      ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                      : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                  }`}
                >
                  {tr}
                </button>
              ))}
            </div>

            {/* Strong's Interlinear Toggle */}
            <button
              type="button"
              onClick={() => setInterlinearEnabled((v) => !v)}
              title="Toggle clickable Hebrew/Greek Strong's Lexicon tags (KJV text)"
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                interlinearEnabled
                  ? 'bg-[var(--atlas-accent)]/16 border-[var(--atlas-accent)]/45 text-[var(--atlas-accent-soft)]'
                  : 'bg-[var(--atlas-bg)] border-[var(--atlas-border-strong)] text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Strong&apos;s</span>
            </button>

            {/* Chapter Read Toggle */}
            <button
              type="button"
              onClick={() => onToggleReadChapter(currentBook.id, chapter)}
              title={
                isCurrentChapterRead ? 'Mark chapter as unread' : 'Mark chapter as read'
              }
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                isCurrentChapterRead
                  ? 'bg-[var(--atlas-secondary)]/16 border-[var(--atlas-secondary)]/45 text-[var(--atlas-secondary)]'
                  : 'bg-[var(--atlas-bg)] border-[var(--atlas-border-strong)] text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isCurrentChapterRead ? 'Read' : 'Mark Read'}
              </span>
            </button>

            <div className="flex items-center gap-1">
              <select
                aria-label="Select chapter"
                value={chapter}
                onChange={(e) => {
                  const chNum = Number(e.target.value);
                  const vs = getChapterVerses(currentBook.id, chNum);
                  onNavigateReader(currentBook.id, chNum, vs[0]?.id ?? `${currentBook.id}.${chNum}.1`);
                }}
                className="h-8 px-2.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs font-mono tabular-nums text-[var(--atlas-text)] focus:outline-none focus:border-[var(--atlas-accent)]"
              >
                {Array.from({ length: currentBook.chapterCount }, (_, idx) => idx + 1).map(
                  (num) => {
                    const done = readChapterSet.has(`${currentBook.id}.${num}`);
                    return (
                      <option key={num} value={num}>
                        Ch. {num}
                        {done ? ' ✓' : ''}
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            <div className="inline-flex items-center h-8 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] overflow-hidden">
              <button
                type="button"
                disabled={prevChapter === null}
                onClick={() => {
                  if (prevChapter !== null) {
                    const vs = getChapterVerses(currentBook.id, prevChapter);
                    onNavigateReader(
                      currentBook.id,
                      prevChapter,
                      vs[0]?.id ?? `${currentBook.id}.${prevChapter}.1`
                    );
                  }
                }}
                aria-label="Previous chapter"
                className="px-2 h-full text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={nextChapter === null}
                onClick={() => {
                  if (nextChapter !== null) {
                    const vs = getChapterVerses(currentBook.id, nextChapter);
                    onNavigateReader(
                      currentBook.id,
                      nextChapter,
                      vs[0]?.id ?? `${currentBook.id}.${nextChapter}.1`
                    );
                  }
                }}
                aria-label="Next chapter"
                className="px-2 h-full text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)] border-l border-[var(--atlas-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {activeVerse && (
              <button
                type="button"
                onClick={() => setInspectorOpen((v) => !v)}
                className="xl:hidden inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] border border-[var(--atlas-accent)]/35 text-xs font-medium text-[var(--atlas-accent-soft)] whitespace-nowrap"
              >
                <PanelRightOpen className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                <span>Inspect</span>
                {allVerseConnections.length + additionalTskLinks.length > 0 && (
                  <span className="font-mono text-[11px] text-[var(--atlas-text-muted)] tabular-nums">
                    ({allVerseConnections.length + additionalTskLinks.length})
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Reading Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-8">
          <div className="max-w-2xl mx-auto">
            {loadingBookId === currentBook.id && chapterVerses.length === 0 ? (
              <div className="p-6 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] text-sm text-[var(--atlas-text-muted)]">
                Loading {currentBook.name} ({translation})...
              </div>
            ) : loadError && chapterVerses.length === 0 ? (
              <div className="p-6 rounded-md bg-[var(--atlas-surface)] border border-[#E57399]/40 space-y-2 text-sm text-[var(--atlas-text)]">
                <div className="font-medium text-[var(--atlas-heading)]">Unable to load chapter text</div>
                <p className="text-xs text-[var(--atlas-text-muted)]">{loadError}</p>
              </div>
            ) : chapterVerses.length === 0 ? (
              <div className="p-6 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-3">
                <h3 className="font-scripture text-lg font-medium text-[var(--atlas-heading)]">
                  {currentBook.name} {chapter}
                </h3>
                <p className="text-sm text-[var(--atlas-text-muted)] leading-relaxed">
                  Select an available chapter ({availableChapters.length} chapters in{' '}
                  {currentBook.name}).
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="pb-4 mb-5 border-b border-[var(--atlas-border)] flex items-center justify-between text-xs text-[var(--atlas-text-subtle)]">
                  <span>
                    {currentBook.testament === 'OT' ? 'Old Testament' : 'New Testament'} ·{' '}
                    {currentBook.division} · {translation}
                  </span>
                  <span className="font-mono tabular-nums">
                    {chapterVerses.length} verses · Ch. {chapter} of {currentBook.chapterCount}
                  </span>
                </div>

                {chapterVerses.map((verse) => {
                  const isSelected = activeVerse?.id === verse.id;
                  const highlight = studyState.highlights[verse.id];
                  const isBookmarked = studyState.bookmarks.includes(verse.id);
                  const xrefCount = getConnectedPassages(verse.id).length;

                  return (
                    <div
                      key={verse.id}
                      onClick={() => handleSelectVerseInReader(verse.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectVerseInReader(verse.id);
                        }
                      }}
                      className={`group px-3.5 py-2.5 rounded-md border transition-colors cursor-pointer ${
                        highlight
                          ? HIGHLIGHT_CLASSES[highlight]
                          : isSelected
                          ? 'bg-[var(--atlas-elevated)]/90 border-[var(--atlas-accent)]/45'
                          : 'border-transparent hover:bg-[var(--atlas-surface)] hover:border-[var(--atlas-border)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-xs tabular-nums text-[var(--atlas-accent)] pt-1.5 w-6 shrink-0 select-none">
                          {verse.verse}
                        </span>
                        <div className="flex-1 min-w-0">
                          {interlinearEnabled && strongsBookMap?.has(verse.id) ? (
                            <p className="font-scripture text-[18px] leading-[1.9] text-[var(--atlas-heading)]">
                              {parseStrongsTaggedText(strongsBookMap.get(verse.id)!).map(
                                (tok: StrongsWordToken, tIdx: number) =>
                                  tok.strongsIds.length > 0 ? (
                                    <React.Fragment key={`${verse.id}-tok-${tIdx}`}>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedStrongsToken({
                                            id: tok.strongsIds[0],
                                            word: tok.text,
                                            verseId: verse.id,
                                          });
                                        }}
                                        title={`${tok.strongsIds.join(', ')} — Click for Strong's lexicon`}
                                        className="inline underline decoration-dotted decoration-[var(--atlas-accent)]/60 underline-offset-4 hover:bg-[var(--atlas-accent)]/15 hover:text-[var(--atlas-accent-soft)] rounded px-0.5 transition-colors"
                                      >
                                        {tok.text}
                                      </button>{' '}
                                    </React.Fragment>
                                  ) : (
                                    <React.Fragment key={`${verse.id}-tok-${tIdx}`}>
                                      <span>{tok.text} </span>
                                    </React.Fragment>
                                  )
                              )}
                            </p>
                          ) : (
                            <p className="font-scripture text-[18px] leading-[1.82] text-[var(--atlas-heading)]">
                              {verse.text}
                            </p>
                          )}
                          <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-[var(--atlas-text-subtle)]">
                            <div className="flex items-center gap-2">
                              {xrefCount > 0 && (
                                <span className="font-mono tabular-nums text-[var(--atlas-text-muted)]">
                                  {xrefCount} curated ref{xrefCount === 1 ? '' : 's'}
                                </span>
                              )}
                              {isBookmarked && (
                                <span className="text-[var(--atlas-accent)]">Bookmarked</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenInGraph(verse.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 inline-flex items-center gap-1 text-[var(--atlas-secondary)] hover:text-[var(--atlas-secondary-soft)] transition-opacity"
                            >
                              <GitFork className="w-3 h-3" />
                              <span>Open in Graph</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile/Tablet Backdrop when Drawer is Open */}
      {activeVerse && inspectorOpen && (
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-[1px] z-30 xl:hidden"
          onClick={() => setInspectorOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Right: Responsive Verse Inspector, Parallel Compare & Dual-Tier Cross-References */}
      {activeVerse && (
        <aside
          className={`${
            inspectorOpen
              ? 'fixed inset-y-0 right-0 w-[92vw] max-w-[390px] z-40 flex shadow-2xl'
              : 'hidden'
          } xl:static xl:flex xl:w-[375px] xl:shadow-none flex-col bg-[var(--atlas-surface)] border-l border-[var(--atlas-border)] shrink-0 overflow-hidden`}
        >
          <div className="px-4 py-3 border-b border-[var(--atlas-border)] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                Selected Verse · {translation}
              </div>
              <h3 className="font-scripture text-lg font-semibold text-[var(--atlas-heading)] truncate">
                {activeVerse.reference}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setCompareParallel((v) => !v)}
                title="Compare KJV / ASV / YLT side-by-side"
                className={`p-2 rounded-md border transition-colors ${
                  compareParallel
                    ? 'bg-[var(--atlas-secondary)]/16 border-[var(--atlas-secondary)]/45 text-[var(--atlas-secondary)]'
                    : 'border-transparent text-[var(--atlas-text-muted)] hover:bg-[var(--atlas-elevated)]'
                }`}
                aria-label="Compare parallel translations"
              >
                <Columns2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onToggleBookmark(activeVerse.id)}
                className={`p-2 rounded-md ${
                  studyState.bookmarks.includes(activeVerse.id)
                    ? 'text-[var(--atlas-accent)] bg-[var(--atlas-accent)]/14'
                    : 'text-[var(--atlas-text-muted)] hover:bg-[var(--atlas-elevated)]'
                }`}
                aria-label="Toggle bookmark"
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    studyState.bookmarks.includes(activeVerse.id) ? 'fill-current' : ''
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => onOpenInGraph(activeVerse.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold hover:bg-[var(--atlas-accent-hover)] transition-colors whitespace-nowrap"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Graph</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorOpen(false)}
                aria-label="Close inspector drawer"
                className="xl:hidden p-1.5 rounded-md text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Parallel Translation Comparison */}
            {compareParallel && (
              <div className="p-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-secondary)]/35 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-secondary)]">
                  <span>Parallel Translations</span>
                  <button
                    type="button"
                    onClick={() => setCompareParallel(false)}
                    className="text-[var(--atlas-text-subtle)] hover:text-[var(--atlas-text)] normal-case"
                  >
                    Hide
                  </button>
                </div>
                {(['KJV', 'ASV', 'YLT'] as BibleTranslationId[]).map((tr) => {
                  const vObj = getVerseInTranslation(activeVerse.id, tr);
                  return (
                    <div key={tr} className="space-y-0.5 pt-1.5 border-t border-[var(--atlas-border)] first:border-t-0 first:pt-0">
                      <div className="font-mono text-[10.5px] font-semibold text-[var(--atlas-accent)]">
                        {tr}
                      </div>
                      <p className="font-scripture text-xs leading-relaxed text-[var(--atlas-text)]">
                        {vObj?.text ?? 'Loading translation...'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Highlights & Collections */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--atlas-border)]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--atlas-text-subtle)] mr-1">Highlight:</span>
                {(['gold', 'teal', 'rose', 'indigo'] as HighlightColor[]).map((color) => {
                  const active = studyState.highlights[activeVerse.id] === color;
                  const bg =
                    color === 'gold'
                      ? 'bg-[#D4894A]'
                      : color === 'teal'
                      ? 'bg-[#4EC498]'
                      : color === 'rose'
                      ? 'bg-[#E57399]'
                      : 'bg-[#6FA8DC]';
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onSetHighlight(activeVerse.id, active ? null : color)}
                      aria-label={`Highlight ${color}`}
                      className={`w-4 h-4 rounded-full ${bg} ${
                        active
                          ? 'ring-2 ring-[var(--atlas-heading)] ring-offset-2 ring-offset-[var(--atlas-surface)]'
                          : 'opacity-65 hover:opacity-100'
                      }`}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCollectionMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-[var(--atlas-accent)] hover:underline"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Collections</span>
              </button>
            </div>

            {collectionMenuOpen && (
              <div className="p-2.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] space-y-1">
                {studyState.collections.map((col) => {
                  const added = col.verseIds.includes(activeVerse.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => onToggleVerseInCollection(col.id, activeVerse.id)}
                      className="w-full flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-[var(--atlas-elevated)]"
                    >
                      <span className={added ? 'text-[var(--atlas-accent-soft)]' : 'text-[var(--atlas-text-secondary)]'}>
                        {col.title}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--atlas-text-subtle)]">
                        {added ? 'Added' : '+ Add'}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setCollectionMenuOpen(false);
                    onCreateCollectionForVerse(activeVerse.id);
                  }}
                  className="w-full text-left px-2 py-1 pt-2 border-t border-[var(--atlas-border)] text-xs text-[var(--atlas-accent)]"
                >
                  + Create New Collection
                </button>
              </div>
            )}

            {/* Cross-Module Context for this Verse */}
            {(linkedThemes.length > 0 ||
              linkedLocations.length > 0 ||
              linkedSanctuary.length > 0 ||
              linkedEvents.length > 0) && (
              <div className="p-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)] space-y-2 text-xs">
                <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                  Atlas Module Links
                </div>

                {linkedThemes.length > 0 && onOpenTheme && (
                  <div className="flex items-start gap-2">
                    <Layers className="w-3.5 h-3.5 text-[var(--atlas-accent)] mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {linkedThemes.map((t, i) => (
                        <React.Fragment key={t.id}>
                          {i > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                          <button
                            type="button"
                            onClick={() => onOpenTheme(t.id)}
                            className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] underline underline-offset-2"
                          >
                            {t.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {linkedLocations.length > 0 && onOpenLocation && (
                  <div className="flex items-start gap-2">
                    <Compass className="w-3.5 h-3.5 text-[var(--atlas-secondary)] mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {linkedLocations.map((loc, i) => (
                        <React.Fragment key={loc.id}>
                          {i > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                          <button
                            type="button"
                            onClick={() => onOpenLocation(loc.id)}
                            className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-secondary)] underline underline-offset-2"
                          >
                            {loc.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {linkedSanctuary.length > 0 && onOpenSanctuary && (
                  <div className="flex items-start gap-2">
                    <Landmark className="w-3.5 h-3.5 text-[var(--atlas-accent)] mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {linkedSanctuary.map((art, i) => (
                        <React.Fragment key={art.id}>
                          {i > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                          <button
                            type="button"
                            onClick={() => onOpenSanctuary(art.id)}
                            className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] underline underline-offset-2"
                          >
                            {art.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {linkedEvents.length > 0 && onOpenTimeline && (
                  <div className="flex items-start gap-2">
                    <History className="w-3.5 h-3.5 text-[var(--atlas-accent)] mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {linkedEvents.map((evt, i) => (
                        <React.Fragment key={evt.id}>
                          {i > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                          <button
                            type="button"
                            onClick={() => onOpenTimeline(evt.id)}
                            className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] underline underline-offset-2 text-left"
                          >
                            {evt.title}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tier 1: Curated Scholarly Cross-references */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                  Curated Cross-References
                </span>
                <span className="font-mono text-xs tabular-nums text-[var(--atlas-text-subtle)]">
                  {connections.length}
                  {allVerseConnections.length !== connections.length
                    ? ` / ${allVerseConnections.length}`
                    : ''}
                </span>
              </div>

              {allVerseConnections.length > 0 && (
                <div className="flex items-center gap-1 p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)] mb-3">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'explicit_biblical', label: 'Explicit Biblical' },
                      { id: 'scholarly_interpretive', label: 'Scholarly' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEpistemicFilter(opt.id)}
                      className={`flex-1 py-1 px-1.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                        epistemicFilter === opt.id
                          ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-secondary)]'
                          : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {connections.length === 0 ? (
                <p className="text-xs text-[var(--atlas-text-subtle)]">
                  {allVerseConnections.length === 0
                    ? 'No curated scholarly cross-references for this verse; check TSK Macro Index below.'
                    : 'No cross-references match the selected epistemic basis filter.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {connections.map(({ edge, verse: target }) => {
                    const meta = RELATIONSHIP_METADATA[edge.relationship];
                    const epMeta = EPISTEMIC_META[edge.epistemicNature];
                    const edMeta = EDITORIAL_STATUS_META[edge.editorialStatus];
                    const confMeta = CONFIDENCE_META[edge.confidence];
                    return (
                      <div
                        key={edge.id}
                        className="p-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)] space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium" style={{ color: meta.color }}>
                            {meta.label}
                          </span>
                          <div className="flex items-center gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() =>
                                onNavigateReader(target.bookId, target.chapter, target.id)
                              }
                              className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] underline underline-offset-2"
                            >
                              Read
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenInGraph(target.id)}
                              className="text-[var(--atlas-secondary)] hover:underline"
                            >
                              Graph
                            </button>
                          </div>
                        </div>
                        <div className="font-scripture text-sm font-semibold text-[var(--atlas-heading)]">
                          {target.reference}
                        </div>
                        <p className="font-scripture text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                          {target.text}
                        </p>
                        <p className="text-[11px] text-[var(--atlas-text-muted)] leading-relaxed">
                          {edge.explanation}
                        </p>
                        <div className="pt-1.5 border-t border-[var(--atlas-border)] text-[10.5px] text-[var(--atlas-text-subtle)] space-y-0.5">
                          <div>
                            <span style={{ color: epMeta.color }}>{epMeta.shortLabel}</span>
                            {' · '}
                            <span className="text-[var(--atlas-text-muted)]">{edMeta.label}</span>
                            {' · '}
                            <span>{confMeta.label}</span>
                          </div>
                          <div>Source: {edge.sourceAttribution}</div>
                          {edge.supportingEvidence && (
                            <div className="text-[var(--atlas-text-muted)]">
                              Evidence: {edge.supportingEvidence}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tier 2: OpenBible.info TSK Cross-References */}
            <div className="pt-3 border-t border-[var(--atlas-border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                  TSK Community Index (OpenBible)
                </span>
                <span className="font-mono text-[11px] tabular-nums text-[var(--atlas-text-subtle)]">
                  {tskLoading ? 'Loading...' : `${additionalTskLinks.length} links`}
                </span>
              </div>

              {additionalTskLinks.length > 0 ? (
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5">
                  {additionalTskLinks.slice(0, 20).map((item) => {
                    const [tBook, tChStr] = item.targetVerseId.split('.');
                    const tCh = parseInt(tChStr ?? '1', 10) || 1;
                    return (
                      <div
                        key={`${item.direction}-${item.targetVerseId}`}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)] text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => onNavigateReader(tBook, tCh, item.targetVerseId)}
                          className="text-left font-medium text-[var(--atlas-heading)] hover:text-[var(--atlas-accent)] truncate"
                        >
                          {formatReferenceFromId(item.targetVerseId)}
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[10px] tabular-nums text-[var(--atlas-text-subtle)]">
                            {item.votes > 0 ? `+${item.votes}` : item.votes}v
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenInGraph(item.targetVerseId)}
                            className="text-[11px] text-[var(--atlas-secondary)] hover:underline"
                          >
                            Graph
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !tskLoading && (
                  <p className="text-xs text-[var(--atlas-text-subtle)]">
                    No additional TSK entries indexed for {activeVerse.shortRef}.
                  </p>
                )
              )}
            </div>

            {/* Study Note */}
            <div className="pt-3 border-t border-[var(--atlas-border)]">
              <label
                htmlFor="reader-verse-note"
                className="block text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)] mb-1.5"
              >
                Study Note
              </label>
              <textarea
                id="reader-verse-note"
                rows={3}
                value={studyState.notes[activeVerse.id] ?? ''}
                onChange={(e) => onSaveNote(activeVerse.id, e.target.value)}
                placeholder="Write a personal note for this verse..."
                className="w-full p-2.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)]"
              />
            </div>
          </div>
        </aside>
      )}

      {selectedStrongsToken && (
        <StrongsWordInspector
          strongsId={selectedStrongsToken.id}
          clickedWord={selectedStrongsToken.word}
          sourceVerseId={selectedStrongsToken.verseId}
          onClose={() => setSelectedStrongsToken(null)}
          onOpenInReader={(bId, chNum, vId) => onNavigateReader(bId, chNum, vId)}
          onMapLexicalParallels={onMapLexicalParallels}
        />
      )}
    </div>
  );
};
