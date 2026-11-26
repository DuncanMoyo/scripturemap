import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  Clock,
  Cloud,
  Command,
  Compass,
  GitFork,
  Landmark,
  LogIn,
  Menu,
  Plus,
  Search,
  Share2,
  X,
} from 'lucide-react';
import { searchFullCorpus, searchScripture } from '../services/scriptureService';
import { FirebaseUserSummary, NavSection, SearchResult, VerseId } from '../types/scripture';
import { OfflineIndicator } from './OfflineIndicator';

interface TopBarProps {
  activeSection: NavSection;
  onOpenMobileMenu: () => void;
  onOpenInGraph: (verseId: VerseId) => void;
  onOpenInReader: (bookId: string, chapter: number, verseId?: VerseId) => void;
  onOpenTheme: (themeId: string) => void;
  onOpenLocation?: (locationId: string) => void;
  onOpenSanctuary?: (sanctuaryId: string) => void;
  recentSearches: string[];
  onRecordSearch: (term: string) => void;
  onCreateCollectionClick: () => void;
  onCopyShareLink?: () => void;
  onOpenCommandPalette?: () => void;
  authUser?: FirebaseUserSummary | null;
  onAuthButtonClick?: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  graph: 'Bible Graph',
  reader: 'Explore Scripture',
  themes: 'Thematic Explorer',
  timeline: 'Biblical Timeline',
  geography: 'Biblical Geography',
  sanctuary: 'Sanctuary Explorer',
  collections: 'Study Collections',
  guide: 'Study Guide & Field Manual',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onOpenMobileMenu,
  onOpenInGraph,
  onOpenInReader,
  onOpenTheme,
  onOpenLocation,
  onOpenSanctuary,
  recentSearches,
  onRecordSearch,
  onCreateCollectionClick,
  onCopyShareLink,
  onOpenCommandPalette,
  authUser = null,
  onAuthButtonClick,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [instantResults, setInstantResults] = useState<SearchResult[]>([]);
  const [corpusResults, setCorpusResults] = useState<SearchResult[]>([]);
  const [corpusScanState, setCorpusScanState] = useState<{
    scanning: boolean;
    loadedBooks: number;
    totalBooks: number;
  }>({ scanning: false, loadedBooks: 0, totalBooks: 66 });
  const [copiedShare, setCopiedShare] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setInstantResults([]);
      setCorpusResults([]);
      setCorpusScanState({ scanning: false, loadedBooks: 0, totalBooks: 66 });
      return;
    }

    const immediate = searchScripture(trimmed);
    setInstantResults(immediate);

    // Run progressive full-corpus 66-book keyword search when query >= 3 chars
    // and not solely an explicit chapter reference
    if (trimmed.length < 3) {
      setCorpusResults([]);
      setCorpusScanState({ scanning: false, loadedBooks: 0, totalBooks: 66 });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCorpusScanState({ scanning: true, loadedBooks: 0, totalBooks: 66 });
      void searchFullCorpus(trimmed, {
        maxResults: 20,
        signal: controller.signal,
        onProgress: (prog) => {
          if (controller.signal.aborted) return;
          setCorpusResults(prog.matches);
          setCorpusScanState({
            scanning: !prog.done,
            loadedBooks: prog.loadedBooks,
            totalBooks: prog.totalBooks,
          });
        },
      });
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const combinedResults = useMemo(() => {
    if (corpusResults.length === 0) return instantResults;
    const seenVerseIds = new Set(
      instantResults.map((r) => r.verseId).filter((v): v is string => Boolean(v))
    );
    const merged = [...instantResults];
    for (const cr of corpusResults) {
      if (cr.verseId && seenVerseIds.has(cr.verseId)) continue;
      if (cr.verseId) seenVerseIds.add(cr.verseId);
      merged.push(cr);
    }
    return merged.slice(0, 26);
  }, [instantResults, corpusResults]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (
    res: SearchResult,
    target: 'graph' | 'reader' | 'map' | 'sanctuary'
  ) => {
    if (query.trim()) {
      onRecordSearch(query.trim());
    } else {
      onRecordSearch(res.title);
    }
    setOpen(false);

    if (res.type === 'sanctuary' && res.sanctuaryId && target === 'sanctuary' && onOpenSanctuary) {
      onOpenSanctuary(res.sanctuaryId);
      return;
    }

    if (res.type === 'location' && res.locationId && target === 'map' && onOpenLocation) {
      onOpenLocation(res.locationId);
      return;
    }

    if (res.type === 'theme' && res.themeId && target === 'reader') {
      onOpenTheme(res.themeId);
      return;
    }

    if (target === 'graph' && res.verseId) {
      onOpenInGraph(res.verseId);
    } else if (res.bookId && res.chapter) {
      onOpenInReader(res.bookId, res.chapter, res.verseId);
    } else if (res.verseId) {
      onOpenInGraph(res.verseId);
    }
  };

  const handleShareClick = () => {
    onCopyShareLink?.();
    setCopiedShare(true);
    window.setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <header className="h-14 px-4 bg-[var(--atlas-surface)] border-b border-[var(--atlas-border)] flex items-center justify-between gap-3 shrink-0 z-30">
      {/* Zone 1: Mobile trigger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="lg:hidden font-scripture font-semibold text-[var(--atlas-heading)] whitespace-nowrap">
            Scripture Atlas
          </span>
          <span className="lg:hidden text-[var(--atlas-text-subtle)]">/</span>
          <h1 className="text-sm font-medium text-[var(--atlas-text)] truncate">
            {SECTION_TITLES[activeSection]}
          </h1>
        </div>
      </div>

      {/* Zone 2: Global Search across all 31,102 verses + Atlas */}
      <div ref={containerRef} className="relative flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[var(--atlas-text-subtle)] absolute left-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            placeholder="Search reference (1 Cor 13:4), phrase across 66 books, theme, or place..."
            aria-label="Search Scripture"
            className="w-full h-9 pl-9 pr-14 bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] rounded-md text-sm text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)] transition-colors"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2.5 p-1 text-[var(--atlas-text-subtle)] hover:text-[var(--atlas-text)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[11px] font-mono text-[var(--atlas-text-subtle)] border border-[var(--atlas-border)] rounded">
              /
            </kbd>
          )}
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-11 bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] rounded-md shadow-2xl overflow-hidden z-50 max-h-[70vh] flex flex-col">
            {query.trim().length >= 3 && (
              <div className="px-3.5 py-1.5 border-b border-[var(--atlas-border)] bg-[var(--atlas-bg)] flex items-center justify-between text-[11px] text-[var(--atlas-text-muted)]">
                <span>
                  {corpusScanState.scanning
                    ? `Searching all 66 books (${corpusScanState.loadedBooks}/${corpusScanState.totalBooks})...`
                    : `Full 66-book KJV corpus searched (${corpusScanState.loadedBooks || 66}/${corpusScanState.totalBooks} books)`}
                </span>
                <span className="font-mono tabular-nums text-[var(--atlas-text-subtle)]">
                  {combinedResults.length} results
                </span>
              </div>
            )}

            {!query.trim() ? (
              <div className="p-3 space-y-3">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)] mb-2">
                    Recent Searches
                  </div>
                  {recentSearches.length === 0 ? (
                    <p className="text-xs text-[var(--atlas-text-subtle)]">No recent searches yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setQuery(term)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-xs text-[var(--atlas-text-secondary)] border border-[var(--atlas-border)] transition-colors"
                        >
                          <Clock className="w-3 h-3 text-[var(--atlas-text-subtle)]" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-[var(--atlas-border)]">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)] mb-2">
                    Suggested Queries
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                    {['John 3:16', 'Ruth 2', 'still small voice', 'Sanctuary'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQuery(s)}
                        className="text-left px-2.5 py-1.5 rounded bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-text-muted)] hover:text-[var(--atlas-accent-soft)] border border-[var(--atlas-border)] transition-colors truncate"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : combinedResults.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--atlas-text-muted)]">
                {corpusScanState.scanning
                  ? `Scanning 31,102 verses for "${query}"...`
                  : `No passages, places, or themes matched "${query}".`}
              </div>
            ) : (
              <div className="overflow-y-auto divide-y divide-[var(--atlas-border)]">
                {combinedResults.map((res) => (
                  <div
                    key={res.id}
                    className="px-3.5 py-2.5 hover:bg-[var(--atlas-elevated)]/75 transition-colors flex items-start justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleAction(
                          res,
                          res.type === 'sanctuary'
                            ? 'sanctuary'
                            : res.type === 'location'
                            ? 'map'
                            : res.type === 'book' || res.type === 'chapter'
                            ? 'reader'
                            : 'graph'
                        )
                      }
                      className="text-left min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--atlas-heading)]">
                        <span className="truncate">{res.title}</span>
                        <span className="text-xs font-normal text-[var(--atlas-text-subtle)]">·</span>
                        <span className="text-xs font-normal text-[var(--atlas-text-muted)] truncate">
                          {res.subtitle}
                        </span>
                      </div>
                      {res.snippet && (
                        <p className="mt-1 text-xs font-scripture text-[var(--atlas-text-muted)] line-clamp-2 leading-relaxed">
                          {res.snippet}
                        </p>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      {res.verseId && res.type !== 'chapter' && (
                        <button
                          type="button"
                          onClick={() => handleAction(res, 'graph')}
                          title="Open in Graph"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[var(--atlas-accent)] hover:bg-[var(--atlas-accent)]/15 border border-[var(--atlas-accent)]/35 transition-colors whitespace-nowrap"
                        >
                          <GitFork className="w-3 h-3" />
                          <span>Graph</span>
                        </button>
                      )}
                      {res.bookId && res.chapter && (
                        <button
                          type="button"
                          onClick={() => handleAction(res, 'reader')}
                          title="Open in Bible Reader"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-hover)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Read</span>
                        </button>
                      )}
                      {res.type === 'sanctuary' && res.sanctuaryId && onOpenSanctuary && (
                        <button
                          type="button"
                          onClick={() => handleAction(res, 'sanctuary')}
                          title="Open in Sanctuary Explorer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[var(--atlas-accent-soft)] hover:bg-[var(--atlas-accent)]/15 border border-[var(--atlas-accent)]/35 transition-colors whitespace-nowrap"
                        >
                          <Landmark className="w-3 h-3" />
                          <span>Plan</span>
                        </button>
                      )}
                      {res.type === 'location' && res.locationId && onOpenLocation && (
                        <button
                          type="button"
                          onClick={() => handleAction(res, 'map')}
                          title="Open on Biblical Map"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[var(--atlas-secondary)] hover:bg-[var(--atlas-secondary)]/15 border border-[var(--atlas-secondary)]/35 transition-colors whitespace-nowrap"
                        >
                          <Compass className="w-3 h-3" />
                          <span>Map</span>
                        </button>
                      )}
                      {res.type === 'theme' && res.themeId && (
                        <button
                          type="button"
                          onClick={() => handleAction(res, 'reader')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[var(--atlas-secondary)] hover:bg-[var(--atlas-secondary)]/15 border border-[var(--atlas-secondary)]/35 transition-colors whitespace-nowrap"
                        >
                          <span>Explore</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Command Palette, Account, Offline indicator, Share Link & Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Open Command Palette (Cmd/Ctrl + K)"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[var(--atlas-bg)] text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-heading)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border)] transition-colors whitespace-nowrap shrink-0"
          >
            <Command className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
            <span className="font-mono text-[11px] text-[var(--atlas-text-subtle)]">⌘K</span>
          </button>
        )}

        <OfflineIndicator />

        {onAuthButtonClick && (
          <button
            type="button"
            onClick={onAuthButtonClick}
            title={authUser ? `Signed in as ${authUser.displayName ?? authUser.email}` : 'Sign in with Google for Cloud Sync'}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[var(--atlas-bg)] text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-heading)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border)] transition-colors whitespace-nowrap shrink-0"
          >
            {authUser ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                <span className="max-w-[96px] truncate">
                  {authUser.displayName?.split(' ')[0] ?? 'Synced'}
                </span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-[var(--atlas-text-muted)]" />
                <span>Sign In</span>
              </>
            )}
          </button>
        )}

        {onCopyShareLink && (
          <button
            type="button"
            onClick={handleShareClick}
            title="Copy shareable deep link to current view"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[var(--atlas-bg)] text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-heading)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border)] transition-colors whitespace-nowrap shrink-0"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                <span className="text-[var(--atlas-secondary)]">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onCreateCollectionClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] hover:bg-[var(--atlas-accent-hover)] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Collection</span>
          <span className="sm:hidden">Collection</span>
        </button>
      </div>
    </header>
  );
};
