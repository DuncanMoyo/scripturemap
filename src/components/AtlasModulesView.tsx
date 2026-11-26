import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Compass,
  GitFork,
  History,
  Landmark,
  Layers,
  Route,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { BIBLICAL_EVENTS } from '../data/atlasModules';
import {
  getCrossModuleContextForEvent,
  getVerseById,
} from '../services/scriptureService';
import { VerseId } from '../types/scripture';

interface AtlasModuleActions {
  initialEventId?: string;
  onOpenInGraph: (verseId: VerseId) => void;
  onLoadVersesInGraph: (verseIds: VerseId[], anchorId: VerseId) => void;
  onOpenInReader: (bookId: string, chapter: number, verseId: VerseId) => void;
  onOpenLocation?: (locationId: string) => void;
  onOpenJourney?: (journeyId: string) => void;
  onOpenSanctuary?: (sanctuaryId: string) => void;
  onOpenTheme?: (themeId: string) => void;
}

const ERA_FILTERS = [
  'All Eras',
  'Primeval History',
  'Patriarchal Era',
  'Exodus & Wilderness',
  'Monarchy & Exile',
  'Gospels',
  'Apostolic Age',
  'Consummation',
];

export const TimelineView: React.FC<AtlasModuleActions> = ({
  initialEventId,
  onOpenInGraph,
  onLoadVersesInGraph,
  onOpenInReader,
  onOpenLocation,
  onOpenJourney,
  onOpenSanctuary,
  onOpenTheme,
}) => {
  const [selectedId, setSelectedId] = useState(
    initialEventId ?? BIBLICAL_EVENTS[0].id
  );
  const [eraFilter, setEraFilter] = useState('All Eras');
  const [timelineZoom, setTimelineZoom] = useState(120);

  useEffect(() => {
    if (initialEventId) {
      setSelectedId(initialEventId);
      setEraFilter('All Eras');
    }
  }, [initialEventId]);

  const filteredEvents = useMemo(() => {
    if (eraFilter === 'All Eras') return BIBLICAL_EVENTS;
    return BIBLICAL_EVENTS.filter(
      (evt) => evt.era === eraFilter || evt.era.includes(eraFilter)
    );
  }, [eraFilter]);

  const selected =
    BIBLICAL_EVENTS.find((e) => e.id === selectedId) ??
    filteredEvents[0] ??
    BIBLICAL_EVENTS[0];

  const crossContext = useMemo(
    () => getCrossModuleContextForEvent(selected),
    [selected]
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[var(--atlas-bg)]">
      {/* Left Chronological Milestones Rail */}
      <aside className="lg:w-80 bg-[var(--atlas-surface)] border-b lg:border-b-0 lg:border-r border-[var(--atlas-border)] overflow-y-auto shrink-0 max-h-[36vh] lg:max-h-full">
        <div className="px-4 py-3 border-b border-[var(--atlas-border)] flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wider text-[var(--atlas-text-muted)]">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
            <span>Redemptive Chronology</span>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-[var(--atlas-text-subtle)]">
            {filteredEvents.length} eras
          </span>
        </div>

        <div className="p-2.5 space-y-1">
          {filteredEvents.map((evt) => {
            const active = evt.id === selected.id;
            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => setSelectedId(evt.id)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  active
                    ? 'bg-[var(--atlas-elevated)] border-[var(--atlas-accent)]/40 text-[var(--atlas-accent-soft)]'
                    : 'border-transparent hover:bg-[var(--atlas-elevated)]/65 text-[var(--atlas-text-secondary)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[var(--atlas-text-muted)]">
                  <span>
                    {String(evt.sortOrder).padStart(2, '0')} · {evt.era}
                  </span>
                  <span className="tabular-nums">{evt.approximateDate}</span>
                </div>
                <div className="mt-1 text-sm font-medium">{evt.title}</div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Chronological Span & Cross-Module Explorer */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="px-5 sm:px-10 py-3 bg-[var(--atlas-surface)]/80 border-b border-[var(--atlas-border)] space-y-2.5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {ERA_FILTERS.map((era) => {
                const active = eraFilter === era;
                return (
                  <button
                    key={era}
                    type="button"
                    onClick={() => {
                      setEraFilter(era);
                      if (era !== 'All Eras') {
                        const firstMatch = BIBLICAL_EVENTS.find(
                          (e) => e.era === era || e.era.includes(era)
                        );
                        if (firstMatch) setSelectedId(firstMatch.id);
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/40'
                        : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] border border-transparent hover:bg-[var(--atlas-elevated)]/50'
                    }`}
                  >
                    {era}
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-[11px] font-mono text-[var(--atlas-text-muted)]">
              <button
                type="button"
                onClick={() => setTimelineZoom((z) => Math.max(90, z - 25))}
                aria-label="Zoom out timeline"
                className="p-1 rounded hover:bg-[var(--atlas-elevated)]"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="tabular-nums w-10 text-center">{timelineZoom}%</span>
              <button
                type="button"
                onClick={() => setTimelineZoom((z) => Math.min(240, z + 25))}
                aria-label="Zoom in timeline"
                className="p-1 rounded hover:bg-[var(--atlas-elevated)]"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Zoomable Horizontal Chronological Swimlane Track */}
          <div className="overflow-x-auto pb-1">
            <div
              className="relative flex flex-col gap-1.5 py-2 px-2 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)]"
              style={{ minWidth: `${Math.max(760, BIBLICAL_EVENTS.length * (timelineZoom * 0.92))}px` }}
            >
              {/* Swimlane 1: Redemptive Covenants & Milestones */}
              <div className="flex items-center justify-between gap-2 relative">
                <div
                  className="absolute left-3 right-3 top-1/2 h-px bg-[var(--atlas-border-strong)] pointer-events-none"
                  aria-hidden="true"
                />
                {BIBLICAL_EVENTS.map((evt) => {
                  const isSelected = evt.id === selected.id;
                  return (
                    <button
                      key={`bar-${evt.id}`}
                      type="button"
                      onClick={() => setSelectedId(evt.id)}
                      title={`${evt.title} (${evt.approximateDate})`}
                      className={`relative z-10 flex-1 min-w-[96px] px-2 py-1.5 rounded text-left transition-colors border ${
                        isSelected
                          ? 'bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] border-[var(--atlas-accent)] font-semibold shadow-sm'
                          : 'bg-[var(--atlas-surface)] text-[var(--atlas-text-secondary)] hover:border-[var(--atlas-accent)]/40 border-[var(--atlas-border)]'
                      }`}
                    >
                      <div className="font-mono text-[10px] tabular-nums opacity-85 truncate">
                        {evt.approximateDate}
                      </div>
                      <div className="text-[11px] truncate">{evt.title}</div>
                    </button>
                  );
                })}
              </div>

              {/* Swimlane 2: Concurrent Empires & Scriptural Witnesses */}
              <div className="grid grid-cols-5 gap-2 text-[10px] font-mono">
                <div className="px-2 py-1 rounded bg-[var(--atlas-surface)]/80 border border-[var(--atlas-border)] text-[var(--atlas-text-muted)] truncate">
                  Ancient Near East · Egypt · Genesis–Deut
                </div>
                <div className="px-2 py-1 rounded bg-[var(--atlas-surface)]/80 border border-[var(--atlas-border)] text-[var(--atlas-text-muted)] truncate">
                  United/Divided Monarchy · Assyria · Psalms &amp; Prophets
                </div>
                <div className="px-2 py-1 rounded bg-[var(--atlas-surface)]/80 border border-[var(--atlas-border)] text-[var(--atlas-text-muted)] truncate">
                  Babylon &amp; Persia · Daniel / Ezra–Neh / Zechariah
                </div>
                <div className="px-2 py-1 rounded bg-[var(--atlas-surface)]/80 border border-[var(--atlas-secondary)]/30 text-[var(--atlas-secondary)] truncate">
                  Second Temple Judea · Roman Empire · Gospels &amp; Acts
                </div>
                <div className="px-2 py-1 rounded bg-[var(--atlas-surface)]/80 border border-[var(--atlas-accent)]/30 text-[var(--atlas-accent-soft)] truncate">
                  Mediterranean Churches · Epistles &amp; Revelation
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="pb-5 border-b border-[var(--atlas-border)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs text-[var(--atlas-text-muted)] font-mono tabular-nums">
                  Milestone {String(selected.sortOrder).padStart(2, '0')} · {selected.era} ·{' '}
                  {selected.approximateDate}
                </div>
                <h2 className="font-scripture text-3xl font-semibold text-[var(--atlas-heading)]">
                  {selected.title}
                </h2>
                <p className="text-sm text-[var(--atlas-text-secondary)] max-w-2xl leading-relaxed">
                  {selected.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onLoadVersesInGraph(selected.verseIds, selected.verseIds[0])
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold hover:bg-[var(--atlas-accent-hover)] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Map Era in Graph</span>
              </button>
            </div>

            {(crossContext.locations.length > 0 ||
              crossContext.journeys.length > 0 ||
              crossContext.sanctuaryArticles.length > 0 ||
              crossContext.relatedThemes.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {crossContext.locations.length > 0 && (
                  <div className="p-3.5 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-muted)]">
                      <Compass className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                      <span>Biblical Places ({crossContext.locations.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-xs">
                      {crossContext.locations.map((loc, idx) => (
                        <React.Fragment key={loc.id}>
                          {idx > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                          <button
                            type="button"
                            onClick={() => onOpenLocation?.(loc.id)}
                            className="text-[var(--atlas-text)] hover:text-[var(--atlas-secondary)] underline decoration-[var(--atlas-border-strong)] underline-offset-4 transition-colors"
                          >
                            {loc.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {crossContext.journeys.length > 0 && (
                  <div className="p-3.5 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-muted)]">
                      <Route className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                      <span>Historical Journeys ({crossContext.journeys.length})</span>
                    </div>
                    <div className="space-y-1">
                      {crossContext.journeys.map((journey) => (
                        <button
                          key={journey.id}
                          type="button"
                          onClick={() =>
                            onOpenJourney
                              ? onOpenJourney(journey.id)
                              : onOpenLocation?.(journey.waypoints[0]?.locationId ?? '')
                          }
                          className="block w-full text-left text-xs text-[var(--atlas-text)] hover:text-[var(--atlas-secondary)] transition-colors truncate"
                        >
                          {journey.title}{' '}
                          <span className="text-[var(--atlas-text-muted)]">({journey.approximateDate})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {crossContext.sanctuaryArticles.length > 0 && (
                  <div className="p-3.5 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-muted)]">
                      <Landmark className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                      <span>Sanctuary Pattern ({crossContext.sanctuaryArticles.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-xs">
                      {crossContext.sanctuaryArticles.map((art, idx) => (
                        <React.Fragment key={art.id}>
                          {idx > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                          <button
                            type="button"
                            onClick={() => onOpenSanctuary?.(art.id)}
                            className="text-[var(--atlas-text)] hover:text-[var(--atlas-accent-soft)] underline decoration-[var(--atlas-border-strong)] underline-offset-4 transition-colors"
                          >
                            {art.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {crossContext.relatedThemes.length > 0 && (
                  <div className="p-3.5 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-muted)]">
                      <Layers className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                      <span>Canonical Themes ({crossContext.relatedThemes.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-xs">
                      {crossContext.relatedThemes.map((theme, idx) => (
                        <React.Fragment key={theme.id}>
                          {idx > 0 && <span className="text-[var(--atlas-text-subtle)]">·</span>}
                          <button
                            type="button"
                            onClick={() => onOpenTheme?.(theme.id)}
                            className="text-[var(--atlas-text)] hover:text-[var(--atlas-accent-soft)] underline decoration-[var(--atlas-border-strong)] underline-offset-4 transition-colors"
                          >
                            {theme.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                Canonical Passages ({selected.verseIds.length})
              </div>
              {selected.verseIds.map((id) => {
                const verse = getVerseById(id);
                if (!verse) return null;
                return (
                  <div
                    key={verse.id}
                    className="p-4 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-scripture text-base font-semibold text-[var(--atlas-accent-soft)]">
                        {verse.reference}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenInReader(verse.bookId, verse.chapter, verse.id)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border-strong)] whitespace-nowrap"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Read</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenInGraph(verse.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-[var(--atlas-secondary)] hover:bg-[var(--atlas-secondary)]/12 border border-[var(--atlas-secondary)]/35 whitespace-nowrap"
                        >
                          <GitFork className="w-3 h-3" />
                          <span>Graph</span>
                        </button>
                      </div>
                    </div>
                    <p className="font-scripture text-[16px] leading-relaxed text-[var(--atlas-text)]">
                      {verse.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
