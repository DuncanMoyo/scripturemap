import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ChevronRight,
  Compass,
  Crosshair,
  FolderPlus,
  GitBranchPlus,
  History,
  Landmark,
  Languages,
  Layers,
  Link2,
  MinusCircle,
  PanelRightClose,
  Route,
  Search,
  Trash2,
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
  getConnectedPassages,
  getEventsForVerse,
  getLocationsForVerse,
  getSanctuaryForVerse,
  getThemesForVerse,
  getVerseById,
  getVerseStrongsTokensAsync,
  loadTskConnectionsForVerse,
  resolveVerseAsync,
  ScripturePathResult,
} from '../services/scriptureService';
import {
  HighlightColor,
  RelationshipType,
  StrongsWordToken,
  StudyCollection,
  TskCrossReference,
  UserStudyState,
  Verse,
  VerseId,
} from '../types/scripture';
import { StrongsWordInspector } from './StrongsWordInspector';

interface ContextualScripturePanelProps {
  verseId: VerseId;
  visibleNodeIds: Set<VerseId>;
  activeRelationships: Set<RelationshipType>;
  epistemicFilter: EpistemicFilter;
  onChangeEpistemicFilter: (filter: EpistemicFilter) => void;
  focusMode: boolean;
  collapsibleCount: number;
  pathSourceId: VerseId | null;
  pathTargetId: VerseId | null;
  activePath: ScripturePathResult | null;
  onSetPathSource: (verseId: VerseId) => void;
  onTracePathTo: (verseId: VerseId) => void;
  onClearPath: () => void;
  onToggleFocusMode: () => void;
  onExpandVerse: (verseId: VerseId) => void;
  onCollapseBranch: (verseId: VerseId) => void;
  onSelectVerse: (verseId: VerseId) => void;
  onExpandTskReference?: (sourceVerseId: VerseId, targetVerseId: VerseId) => void;
  onOpenInReader: (bookId: string, chapter: number, verseId: VerseId) => void;
  onOpenTheme: (themeId: string) => void;
  onOpenLocation?: (locationId: string) => void;
  onOpenSanctuary?: (sanctuaryId: string) => void;
  onOpenTimeline?: (eventId: string) => void;
  studyState: UserStudyState;
  onToggleBookmark: (verseId: VerseId) => void;
  onSetHighlight: (verseId: VerseId, color: HighlightColor | null) => void;
  onSaveNote: (verseId: VerseId, note: string) => void;
  onToggleVerseInCollection: (collectionId: string, verseId: VerseId) => void;
  onCreateCollectionForVerse: (verseId: VerseId) => void;
  onOpenCreateCustomEdge?: (sourceVerseId: VerseId) => void;
  onDeleteCustomEdge?: (edgeId: string) => void;
  onMapLexicalParallels?: (
    strongsId: string,
    lemma: string,
    originVerseId: VerseId,
    matchingVerses: VerseId[]
  ) => void;
  onClosePanel?: () => void;
}

const HIGHLIGHT_SWATCHES: { id: HighlightColor; label: string; bg: string; ring: string }[] = [
  { id: 'gold', label: 'Copper highlight', bg: 'bg-[#D4894A]', ring: 'ring-[#D4894A]' },
  { id: 'teal', label: 'Celadon highlight', bg: 'bg-[#4EC498]', ring: 'ring-[#4EC498]' },
  { id: 'rose', label: 'Crimson highlight', bg: 'bg-[#E57399]', ring: 'ring-[#E57399]' },
  { id: 'indigo', label: 'Cobalt highlight', bg: 'bg-[#6FA8DC]', ring: 'ring-[#6FA8DC]' },
];

const HIGHLIGHT_TEXT_BG: Record<HighlightColor, string> = {
  gold: 'bg-[#D4894A]/15 border-[#D4894A]/40',
  teal: 'bg-[#4EC498]/14 border-[#4EC498]/40',
  rose: 'bg-[#E57399]/14 border-[#E57399]/40',
  indigo: 'bg-[#6FA8DC]/14 border-[#6FA8DC]/40',
};

export const ContextualScripturePanel: React.FC<ContextualScripturePanelProps> = ({
  verseId,
  visibleNodeIds,
  activeRelationships,
  epistemicFilter,
  onChangeEpistemicFilter,
  focusMode,
  collapsibleCount,
  pathSourceId,
  pathTargetId,
  activePath,
  onSetPathSource,
  onTracePathTo,
  onClearPath,
  onToggleFocusMode,
  onExpandVerse,
  onCollapseBranch,
  onSelectVerse,
  onExpandTskReference,
  onOpenInReader,
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
  onOpenCreateCustomEdge,
  onDeleteCustomEdge,
  onMapLexicalParallels,
  onClosePanel,
}) => {
  const [resolvedVerse, setResolvedVerse] = useState<Verse | undefined>(() =>
    getVerseById(verseId)
  );
  const [noteDraft, setNoteDraft] = useState(studyState.notes[verseId] ?? '');
  const [collectionMenuOpen, setCollectionMenuOpen] = useState(false);
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'in_graph' | 'expandable'>('all');
  const [connectionQuery, setConnectionQuery] = useState('');
  const [tskLinks, setTskLinks] = useState<TskCrossReference[]>([]);
  const [tskLoading, setTskLoading] = useState(false);
  const [tskExpanded, setTskExpanded] = useState(true);
  const [strongsTokens, setStrongsTokens] = useState<StrongsWordToken[]>([]);
  const [lexiconExpanded, setLexiconExpanded] = useState(false);
  const [activeStrongsChip, setActiveStrongsChip] = useState<{
    id: string;
    word: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const syncVerse = getVerseById(verseId);
    setResolvedVerse(syncVerse);
    if (!syncVerse) {
      void resolveVerseAsync(verseId).then((loaded) => {
        if (active && loaded) setResolvedVerse(loaded);
      });
    }
    return () => {
      active = false;
    };
  }, [verseId]);

  useEffect(() => {
    let active = true;
    setTskLoading(true);
    void loadTskConnectionsForVerse(verseId)
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
  }, [verseId]);

  useEffect(() => {
    let active = true;
    void getVerseStrongsTokensAsync(verseId)
      .then((toks) => {
        if (active) setStrongsTokens(toks);
      })
      .catch(() => {
        if (active) setStrongsTokens([]);
      });
    return () => {
      active = false;
    };
  }, [verseId]);

  useEffect(() => {
    setNoteDraft(studyState.notes[verseId] ?? '');
    setCollectionMenuOpen(false);
  }, [verseId, studyState.notes]);

  const verse = resolvedVerse ?? getVerseById(verseId);

  const allConnections = useMemo(
    () =>
      verse
        ? getConnectedPassages(
            verse.id,
            undefined,
            'all',
            studyState.customEdges ?? []
          )
        : [],
    [verse, studyState.customEdges]
  );

  const uniqueStrongsChips = useMemo(() => {
    const seen = new Set<string>();
    const chips: { id: string; word: string }[] = [];
    for (const tok of strongsTokens) {
      for (const sid of tok.strongsIds) {
        if (seen.has(sid)) continue;
        seen.add(sid);
        chips.push({ id: sid, word: tok.text.replace(/[.,;:!?()"']/g, '') });
      }
    }
    return chips;
  }, [strongsTokens]);

  const filteredByRel = useMemo(
    () =>
      allConnections.filter(
        (c) =>
          activeRelationships.has(c.edge.relationship) &&
          (epistemicFilter === 'all' || c.edge.epistemicNature === epistemicFilter)
      ),
    [allConnections, activeRelationships, epistemicFilter]
  );

  const displayedConnections = useMemo(() => {
    const q = connectionQuery.trim().toLowerCase();
    return filteredByRel.filter((item) => {
      const inGraph = visibleNodeIds.has(item.verse.id);
      if (connectionFilter === 'in_graph' && !inGraph) return false;
      if (connectionFilter === 'expandable' && inGraph) return false;
      if (q) {
        const matchRef = item.verse.reference.toLowerCase().includes(q);
        const matchText = item.verse.text.toLowerCase().includes(q);
        const matchRel = RELATIONSHIP_METADATA[item.edge.relationship].label
          .toLowerCase()
          .includes(q);
        if (!matchRef && !matchText && !matchRel) return false;
      }
      return true;
    });
  }, [filteredByRel, connectionFilter, connectionQuery, visibleNodeIds]);

  const curatedTargetIds = useMemo(
    () => new Set(allConnections.map((c) => c.verse.id)),
    [allConnections]
  );

  const additionalTskLinks = useMemo(
    () => tskLinks.filter((l) => !curatedTargetIds.has(l.targetVerseId)),
    [tskLinks, curatedTargetIds]
  );

  if (!verse) {
    return (
      <div className="p-6 text-sm text-[var(--atlas-text-muted)]">
        Loading passage {formatReferenceFromId(verseId)}...
      </div>
    );
  }

  const unexpandedCount = filteredByRel.filter(
    (c) => !visibleNodeIds.has(c.verse.id)
  ).length;

  const themes = getThemesForVerse(verse.id);
  const locations = getLocationsForVerse(verse.id);
  const sanctuaryArticles = getSanctuaryForVerse(verse.id);
  const timelineEvents = getEventsForVerse(verse.id);

  const isBookmarked = studyState.bookmarks.includes(verse.id);
  const currentHighlight = studyState.highlights[verse.id];
  const memberCollections: StudyCollection[] = studyState.collections.filter((col) =>
    col.verseIds.includes(verse.id)
  );
  const pathSourceVerse = pathSourceId ? getVerseById(pathSourceId) : undefined;
  const isPathSource = pathSourceId === verse.id;

  return (
    <div className="flex flex-col h-full bg-[var(--atlas-surface)] border-l border-[var(--atlas-border)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--atlas-border)] flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[var(--atlas-text-muted)]">
            <span>{verse.testament === 'OT' ? 'Old Testament' : 'New Testament'}</span>
            <span aria-hidden="true">·</span>
            <span>{verse.bookName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{verse.translation}</span>
          </div>
          <h2 className="mt-0.5 font-scripture text-xl font-semibold text-[var(--atlas-heading)] truncate">
            {verse.reference}
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onToggleBookmark(verse.id)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
            title={isBookmarked ? 'Bookmarked' : 'Bookmark verse'}
            className={`p-2 rounded-md transition-colors ${
              isBookmarked
                ? 'text-[var(--atlas-accent)] bg-[var(--atlas-accent)]/14'
                : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          {onClosePanel && (
            <button
              type="button"
              onClick={onClosePanel}
              aria-label="Close Scripture panel"
              className="p-2 rounded-md text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)]"
            >
              <PanelRightClose className="w-4 h-4 hidden lg:block" />
              <X className="w-4 h-4 lg:hidden" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Scripture Text */}
        <div
          className={`p-4 rounded-md border transition-colors ${
            currentHighlight
              ? HIGHLIGHT_TEXT_BG[currentHighlight]
              : 'bg-[var(--atlas-bg)] border-[var(--atlas-border)]'
          }`}
        >
          <p className="font-scripture text-[17px] leading-[1.75] text-[var(--atlas-heading)]">
            <span className="font-mono text-xs text-[var(--atlas-accent)] mr-2 tabular-nums select-none">
              {verse.verse}
            </span>
            {verse.text}
          </p>

          {/* Highlight & Reader toolbar */}
          <div className="mt-3 pt-3 border-t border-[var(--atlas-border)] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[var(--atlas-text-subtle)] mr-1">Highlight</span>
              {HIGHLIGHT_SWATCHES.map((sw) => {
                const active = currentHighlight === sw.id;
                return (
                  <button
                    key={sw.id}
                    type="button"
                    onClick={() => onSetHighlight(verse.id, active ? null : sw.id)}
                    aria-label={sw.label}
                    title={sw.label}
                    className={`w-4 h-4 rounded-full ${sw.bg} transition-transform ${
                      active
                        ? `ring-2 ring-offset-2 ring-offset-[var(--atlas-bg)] ${sw.ring} scale-110`
                        : 'opacity-65 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onOpenInReader(verse.bookId, verse.chapter, verse.id)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--atlas-secondary)] hover:text-[var(--atlas-secondary-soft)] transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open in Reader</span>
            </button>
          </div>
        </div>

        {/* Node & Path Graph Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onExpandVerse(verse.id)}
            disabled={unexpandedCount === 0}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
              unexpandedCount > 0
                ? 'bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-accent-soft)] border-[var(--atlas-accent)]/35'
                : 'bg-[var(--atlas-bg)]/60 text-[var(--atlas-text-subtle)] border-[var(--atlas-border)] cursor-not-allowed'
            }`}
          >
            <GitBranchPlus className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
            <span>
              {unexpandedCount > 0 ? `Expand (+${unexpandedCount})` : 'All Expanded'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onCollapseBranch(verse.id)}
            disabled={collapsibleCount === 0}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
              collapsibleCount > 0
                ? 'bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-text-secondary)] border-[var(--atlas-border-strong)]'
                : 'bg-[var(--atlas-bg)]/60 text-[var(--atlas-text-subtle)] border-[var(--atlas-border)] cursor-not-allowed'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5 text-[var(--atlas-text-muted)]" />
            <span>
              {collapsibleCount > 0 ? `Collapse (-${collapsibleCount})` : 'No Leaf Branch'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
              focusMode
                ? 'bg-[var(--atlas-secondary)]/15 text-[var(--atlas-secondary-soft)] border-[var(--atlas-secondary)]/45'
                : 'bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-text-secondary)] border-[var(--atlas-border-strong)]'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
          </button>

          {pathSourceId && !isPathSource ? (
            <button
              type="button"
              onClick={() => onTracePathTo(verse.id)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-[var(--atlas-secondary)]/15 hover:bg-[var(--atlas-secondary)]/25 text-[var(--atlas-secondary-soft)] border border-[var(--atlas-secondary)]/45 transition-colors whitespace-nowrap"
            >
              <Route className="w-3.5 h-3.5" />
              <span className="truncate">
                Trace from {pathSourceVerse?.shortRef ?? 'Origin'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSetPathSource(verse.id)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                isPathSource
                  ? 'bg-[var(--atlas-accent)]/15 text-[var(--atlas-accent-soft)] border-[var(--atlas-accent)]/45'
                  : 'bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-text-secondary)] border-[var(--atlas-border-strong)]'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>{isPathSource ? 'Path Origin Set' : 'Set Path Origin'}</span>
            </button>
          )}

          {onOpenCreateCustomEdge && (
            <button
              type="button"
              onClick={() => onOpenCreateCustomEdge(verse.id)}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/35 transition-colors whitespace-nowrap"
            >
              <Link2 className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
              <span>Link Custom Connection from {verse.shortRef}</span>
            </button>
          )}
        </div>

        {/* Active Shortest Path Breakdown */}
        {pathSourceId && pathTargetId && (
          <div className="p-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-secondary)]/35 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--atlas-secondary)]">
                <Route className="w-3.5 h-3.5" />
                <span>Shortest Discovered Path</span>
              </div>
              <button
                type="button"
                onClick={onClearPath}
                className="text-[11px] text-[var(--atlas-text-muted)] hover:text-[var(--atlas-heading)]"
              >
                Clear
              </button>
            </div>

            {activePath && activePath.steps.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-[var(--atlas-text-muted)] tabular-nums">
                  {activePath.steps.length} hop{activePath.steps.length === 1 ? '' : 's'} ·{' '}
                  {activePath.nodeIds.length} passages
                </div>
                <div className="space-y-1.5">
                  {activePath.steps.map((step, idx) => {
                    const meta = RELATIONSHIP_METADATA[step.edge.relationship];
                    return (
                      <div
                        key={step.edge.id}
                        className="p-2 rounded bg-[var(--atlas-surface)] border border-[var(--atlas-border)] text-xs space-y-1"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap font-medium text-[var(--atlas-heading)]">
                          <span className="font-mono text-[10px] text-[var(--atlas-text-subtle)]">
                            0{idx + 1}.
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectVerse(step.from.id)}
                            className="hover:text-[var(--atlas-accent)]"
                          >
                            {step.from.shortRef}
                          </button>
                          <ArrowRight className="w-3 h-3 text-[var(--atlas-text-subtle)]" />
                          <button
                            type="button"
                            onClick={() => onSelectVerse(step.to.id)}
                            className="hover:text-[var(--atlas-accent)]"
                          >
                            {step.to.shortRef}
                          </button>
                          <span
                            className="ml-auto text-[11px]"
                            style={{ color: meta.color }}
                          >
                            {meta.shortLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--atlas-text-muted)] leading-relaxed">
                          {step.edge.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--atlas-text-muted)]">
                No canonical path found between these passages under the active relationship
                filters.
              </p>
            )}
          </div>
        )}

        {/* Cross-Module Context */}
        {(themes.length > 0 ||
          locations.length > 0 ||
          sanctuaryArticles.length > 0 ||
          timelineEvents.length > 0) && (
          <div className="space-y-2.5 pt-1 border-t border-[var(--atlas-border)]">
            {themes.length > 0 && (
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)] mb-1">
                  Themes
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  {themes.map((theme, idx) => (
                    <React.Fragment key={theme.id}>
                      {idx > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                      <button
                        type="button"
                        onClick={() => onOpenTheme(theme.id)}
                        className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent)] underline decoration-[var(--atlas-border-strong)] underline-offset-4 transition-colors"
                      >
                        {theme.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {locations.length > 0 && onOpenLocation && (
              <div>
                <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)] mb-1">
                  <Compass className="w-3 h-3 text-[var(--atlas-secondary)]" />
                  <span>Biblical Places</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  {locations.map((loc, idx) => (
                    <React.Fragment key={loc.id}>
                      {idx > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                      <button
                        type="button"
                        onClick={() => onOpenLocation(loc.id)}
                        className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-secondary)] underline decoration-[var(--atlas-border-strong)] underline-offset-4 transition-colors"
                      >
                        {loc.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {sanctuaryArticles.length > 0 && onOpenSanctuary && (
              <div>
                <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)] mb-1">
                  <Landmark className="w-3 h-3 text-[var(--atlas-accent)]" />
                  <span>Sanctuary Pattern</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  {sanctuaryArticles.map((art, idx) => (
                    <React.Fragment key={art.id}>
                      {idx > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                      <button
                        type="button"
                        onClick={() => onOpenSanctuary(art.id)}
                        className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] underline decoration-[var(--atlas-border-strong)] underline-offset-4 transition-colors"
                      >
                        {art.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {timelineEvents.length > 0 && onOpenTimeline && (
              <div>
                <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)] mb-1">
                  <History className="w-3 h-3 text-[var(--atlas-accent)]" />
                  <span>Timeline Eras</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  {timelineEvents.map((evt, idx) => (
                    <React.Fragment key={evt.id}>
                      {idx > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                      <button
                        type="button"
                        onClick={() => onOpenTimeline(evt.id)}
                        className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] underline decoration-[var(--atlas-border-strong)] underline-offset-4 transition-colors text-left"
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

        {/* Collections */}
        <div className="space-y-3 pt-2 border-t border-[var(--atlas-border)]">
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                Collections
              </span>
              <button
                type="button"
                onClick={() => setCollectionMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-[var(--atlas-accent)] hover:text-[var(--atlas-accent-hover)] transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Add to Collection</span>
              </button>
            </div>

            {memberCollections.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--atlas-text-muted)]">
                {memberCollections.map((c, idx) => (
                  <React.Fragment key={c.id}>
                    {idx > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                    <span>{c.title}</span>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-[var(--atlas-text-subtle)]">Not in any study collection yet.</p>
            )}

            {collectionMenuOpen && (
              <div className="mt-2 p-2 bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] rounded-md space-y-1">
                {studyState.collections.map((col) => {
                  const checked = col.verseIds.includes(verse.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => onToggleVerseInCollection(col.id, verse.id)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-left hover:bg-[var(--atlas-elevated)] transition-colors"
                    >
                      <span className={checked ? 'text-[var(--atlas-accent-soft)]' : 'text-[var(--atlas-text-secondary)]'}>
                        {col.title}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--atlas-text-subtle)]">
                        {checked ? 'Added' : '+ Add'}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setCollectionMenuOpen(false);
                    onCreateCollectionForVerse(verse.id);
                  }}
                  className="w-full text-left px-2 py-1.5 mt-1 border-t border-[var(--atlas-border)] text-xs text-[var(--atlas-accent)] hover:text-[var(--atlas-accent-hover)]"
                >
                  + Create New Collection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tier 1: Curated Scholarly Cross-References */}
        <div className="pt-2 border-t border-[var(--atlas-border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
              Curated Connections
            </span>
            <span className="text-xs font-mono tabular-nums text-[var(--atlas-text-subtle)]">
              {filteredByRel.length} of {allConnections.length}
            </span>
          </div>

          {allConnections.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
                {(
                  [
                    { id: 'all', label: 'All Basis' },
                    { id: 'explicit_biblical', label: 'Explicit Biblical' },
                    { id: 'scholarly_interpretive', label: 'Scholarly' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeEpistemicFilter(opt.id)}
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

              {filteredByRel.length > 0 && (
                <>
                  <div className="flex items-center gap-1 p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
                    {(
                      [
                        { id: 'all', label: `All (${filteredByRel.length})` },
                        {
                          id: 'in_graph',
                          label: `In Graph (${filteredByRel.length - unexpandedCount})`,
                        },
                        { id: 'expandable', label: `Addable (${unexpandedCount})` },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setConnectionFilter(tab.id)}
                        className={`flex-1 py-1 px-1.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                          connectionFilter === tab.id
                            ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                            : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {filteredByRel.length > 3 && (
                    <div className="relative">
                      <Search className="w-3 h-3 text-[var(--atlas-text-subtle)] absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={connectionQuery}
                        onChange={(e) => setConnectionQuery(e.target.value)}
                        placeholder="Filter connected passages..."
                        className="w-full h-7 pl-7 pr-2.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)]"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {displayedConnections.length === 0 ? (
            <p className="text-xs text-[var(--atlas-text-subtle)] leading-relaxed">
              {filteredByRel.length === 0
                ? 'No curated scholarly cross-references match the active filters for this verse.'
                : 'No connected passages match the current sidebar filter.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {displayedConnections.map(({ edge, verse: targetVerse }) => {
                const rel = RELATIONSHIP_METADATA[edge.relationship];
                const epMeta = EPISTEMIC_META[edge.epistemicNature];
                const edMeta = EDITORIAL_STATUS_META[edge.editorialStatus];
                const confMeta = CONFIDENCE_META[edge.confidence];
                const inGraph = visibleNodeIds.has(targetVerse.id);
                return (
                  <div
                    key={edge.id}
                    className="p-3 rounded-md bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)]/90 border border-[var(--atlas-border)] hover:border-[var(--atlas-border-strong)] transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-4 h-0 shrink-0"
                          style={{
                            borderTop: `2px ${rel.lineStyle} ${rel.color}`,
                          }}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-medium" style={{ color: rel.color }}>
                          {rel.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--atlas-text-subtle)] shrink-0">
                        {inGraph ? 'In graph' : 'Click to add'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectVerse(targetVerse.id)}
                      className="mt-1.5 w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-scripture text-sm font-semibold text-[var(--atlas-heading)] group-hover:text-[var(--atlas-accent-soft)]">
                          {targetVerse.reference}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--atlas-text-subtle)] group-hover:text-[var(--atlas-accent)] shrink-0" />
                      </div>

                      <p className="mt-1 font-scripture text-xs text-[var(--atlas-text-secondary)] line-clamp-2 leading-relaxed">
                        {targetVerse.text}
                      </p>

                      <p className="mt-1.5 text-[11px] text-[var(--atlas-text-muted)] leading-relaxed">
                        {edge.explanation}
                      </p>

                      <div className="mt-2 pt-1.5 border-t border-[var(--atlas-border)] text-[10.5px] text-[var(--atlas-text-subtle)] space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span style={{ color: epMeta.color }}>{epMeta.shortLabel}</span>
                            {' · '}
                            <span className="text-[var(--atlas-text-muted)]">
                              {edge.id.startsWith('custom-') ? 'Personal Edge' : edMeta.label}
                            </span>
                            {' · '}
                            <span>{confMeta.label}</span>
                          </div>
                          {edge.id.startsWith('custom-') && onDeleteCustomEdge && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCustomEdge(edge.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.stopPropagation();
                                  onDeleteCustomEdge(edge.id);
                                }
                              }}
                              title="Delete custom edge"
                              className="p-0.5 text-[#E57399] hover:opacity-80"
                            >
                              <Trash2 className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="truncate" title={edge.sourceAttribution}>
                          Source: {edge.sourceAttribution}
                        </div>
                        {edge.supportingEvidence && (
                          <div className="text-[var(--atlas-text-muted)] leading-snug">
                            Evidence: {edge.supportingEvidence}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Original Language Lexicon (Strong's Hebrew & Greek) */}
        <div className="pt-2 border-t border-[var(--atlas-border)] space-y-2">
          <button
            type="button"
            onClick={() => setLexiconExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                Original Lexicon (Strong&apos;s)
              </span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-[var(--atlas-text-subtle)]">
              {uniqueStrongsChips.length} terms
            </span>
          </button>

          {lexiconExpanded && (
            <div className="flex flex-wrap gap-1.5">
              {uniqueStrongsChips.length === 0 ? (
                <p className="text-xs text-[var(--atlas-text-subtle)]">
                  No Strong&apos;s lexical tokens indexed for this verse.
                </p>
              ) : (
                uniqueStrongsChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveStrongsChip(chip)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] transition-colors"
                  >
                    <span>{chip.word}</span>
                    <span className="font-mono text-[10px] text-[var(--atlas-accent)]">
                      {chip.id}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Tier 2: OpenBible.info Treasury of Scripture Knowledge (Community Vote-Ranked) */}
        <div className="pt-2 border-t border-[var(--atlas-border)] space-y-2">
          <button
            type="button"
            onClick={() => setTskExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[var(--atlas-text-muted)]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                TSK Macro Index (OpenBible)
              </span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-[var(--atlas-text-subtle)]">
              {tskLoading ? 'Loading...' : `${additionalTskLinks.length} links`}
            </span>
          </button>

          {tskExpanded && (
            <div className="space-y-2">
              <p className="text-[11px] text-[var(--atlas-text-subtle)] leading-relaxed">
                Unannotated historical parallels ranked by OpenBible.info community votes (distinct
                from curated scholarly edges above).
              </p>

              {additionalTskLinks.length === 0 && !tskLoading ? (
                <p className="text-xs text-[var(--atlas-text-subtle)]">
                  No additional TSK entries indexed for {verse.shortRef}.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                  {additionalTskLinks.slice(0, 24).map((item) => {
                    const targetBook = item.targetVerseId.split('.')[0];
                    const targetCh = parseInt(item.targetVerseId.split('.')[1] ?? '1', 10);
                    const label = formatReferenceFromId(item.targetVerseId);
                    const inGraph = visibleNodeIds.has(item.targetVerseId);

                    return (
                      <div
                        key={`${item.direction}-${item.targetVerseId}`}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)] text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (onExpandTskReference) {
                              onExpandTskReference(verse.id, item.targetVerseId);
                            } else {
                              onSelectVerse(item.targetVerseId);
                            }
                          }}
                          className="min-w-0 flex-1 text-left hover:text-[var(--atlas-accent)] transition-colors truncate font-medium text-[var(--atlas-heading)]"
                          title={inGraph ? `Focus ${label}` : `Add ${label} to graph`}
                        >
                          {label}
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[10px] tabular-nums text-[var(--atlas-text-subtle)]">
                            {item.votes > 0 ? `+${item.votes}` : item.votes}v
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenInReader(targetBook, targetCh, item.targetVerseId)}
                            title="Open in Reader"
                            className="p-1 text-[var(--atlas-text-muted)] hover:text-[var(--atlas-secondary)]"
                          >
                            <BookOpen className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Personal Note */}
        <div className="pt-2 border-t border-[var(--atlas-border)]">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="verse-study-note"
              className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]"
            >
              Personal Study Note
            </label>
            <span className="text-[11px] text-[var(--atlas-text-subtle)]">Saved locally</span>
          </div>
          <textarea
            id="verse-study-note"
            rows={3}
            value={noteDraft}
            onChange={(e) => {
              setNoteDraft(e.target.value);
              onSaveNote(verse.id, e.target.value);
            }}
            placeholder="Record observations, cross-reference notes, or structural patterns..."
            className="w-full p-2.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)] resize-y leading-relaxed"
          />
        </div>
      </div>

      {activeStrongsChip && (
        <StrongsWordInspector
          strongsId={activeStrongsChip.id}
          clickedWord={activeStrongsChip.word}
          sourceVerseId={verse.id}
          onClose={() => setActiveStrongsChip(null)}
          onOpenInReader={onOpenInReader}
          onMapLexicalParallels={onMapLexicalParallels}
        />
      )}
    </div>
  );
};
