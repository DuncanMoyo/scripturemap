import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Database,
  GitFork,
  Layers,
  Search,
  Waypoints,
} from 'lucide-react';
import {
  CONFIDENCE_META,
  EDITORIAL_STATUS_META,
  EPISTEMIC_META,
  RELATIONSHIP_METADATA,
  RELATIONSHIP_TYPES,
} from '../data/relationships';
import { BIBLICAL_THEMES } from '../data/themes';
import {
  EditorialFilter,
  EpistemicFilter,
  getAllCrossReferences,
  getVerseById,
  queryRelationshipDatabase,
} from '../services/scriptureService';
import { CrossReferenceEdge, RelationshipType, VerseId } from '../types/scripture';

interface ThemesViewProps {
  initialThemeId?: string;
  onLoadVersesInGraph: (verseIds: VerseId[], anchorId: VerseId) => void;
  onOpenInGraph: (verseId: VerseId) => void;
  onOpenInReader: (bookId: string, chapter: number, verseId: VerseId) => void;
}

type DiscoveryMode = 'evolution' | 'database';

export const ThemesView: React.FC<ThemesViewProps> = ({
  initialThemeId,
  onLoadVersesInGraph,
  onOpenInGraph,
  onOpenInReader,
}) => {
  const [mode, setMode] = useState<DiscoveryMode>('evolution');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    initialThemeId ?? BIBLICAL_THEMES[0].id
  );
  const [evolutionEpistemic, setEvolutionEpistemic] = useState<EpistemicFilter>('all');

  const [dbRelationship, setDbRelationship] = useState<RelationshipType | 'all'>('all');
  const [dbEpistemic, setDbEpistemic] = useState<EpistemicFilter>('all');
  const [dbEditorial, setDbEditorial] = useState<EditorialFilter>('all');
  const [dbQuery, setDbQuery] = useState('');

  useEffect(() => {
    if (initialThemeId) {
      setSelectedThemeId(initialThemeId);
      setMode('evolution');
    }
  }, [initialThemeId]);

  const selectedTheme =
    BIBLICAL_THEMES.find((t) => t.id === selectedThemeId) ?? BIBLICAL_THEMES[0];

  const allCrossRefs = useMemo(() => getAllCrossReferences(), []);

  const themeVerseSet = useMemo(
    () => new Set(selectedTheme.verseIds),
    [selectedTheme.verseIds]
  );

  const stageEdgesMap = useMemo(() => {
    const map = new Map<string, CrossReferenceEdge[]>();
    for (const stage of selectedTheme.evolutionStages) {
      const stageSet = new Set(stage.verseIds);
      const matching = allCrossRefs.filter((edge) => {
        if (evolutionEpistemic !== 'all' && edge.epistemicNature !== evolutionEpistemic) {
          return false;
        }
        const touchesStage = stageSet.has(edge.source) || stageSet.has(edge.target);
        if (!touchesStage) return false;
        return themeVerseSet.has(edge.source) || themeVerseSet.has(edge.target);
      });
      map.set(stage.id, matching);
    }
    return map;
  }, [selectedTheme.evolutionStages, allCrossRefs, evolutionEpistemic, themeVerseSet]);

  const dbResults = useMemo(
    () =>
      queryRelationshipDatabase({
        relationship: dbRelationship,
        epistemic: dbEpistemic,
        editorial: dbEditorial,
        query: dbQuery,
      }),
    [dbRelationship, dbEpistemic, dbEditorial, dbQuery]
  );

  const dbCountsByRel = useMemo(() => {
    const base = queryRelationshipDatabase({
      epistemic: dbEpistemic,
      editorial: dbEditorial,
      query: dbQuery,
    });
    const counts: Record<RelationshipType, number> = {
      direct_quotation: 0,
      allusion: 0,
      prophecy_fulfillment: 0,
      typology: 0,
      parallel: 0,
      thematic: 0,
      historical: 0,
      linguistic: 0,
    };
    for (const edge of base) {
      counts[edge.relationship] += 1;
    }
    return { total: base.length, byRel: counts };
  }, [dbEpistemic, dbEditorial, dbQuery]);

  const verifiedCount = useMemo(
    () => allCrossRefs.filter((e) => e.editorialStatus === 'verified_textual').length,
    [allCrossRefs]
  );
  const explicitCount = useMemo(
    () => allCrossRefs.filter((e) => e.epistemicNature === 'explicit_biblical').length,
    [allCrossRefs]
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[var(--atlas-bg)]">
      {/* Left Theme Index */}
      <aside className="lg:w-72 bg-[var(--atlas-surface)] border-b lg:border-b-0 lg:border-r border-[var(--atlas-border)] overflow-y-auto shrink-0">
        <div className="px-4 py-3 border-b border-[var(--atlas-border)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--atlas-text-muted)]">
            <Layers className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
            <span>Biblical Themes</span>
          </div>
          <span className="font-mono text-xs tabular-nums text-[var(--atlas-text-subtle)]">
            {BIBLICAL_THEMES.length}
          </span>
        </div>

        <div className="p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
          {BIBLICAL_THEMES.map((theme) => {
            const active = mode === 'evolution' && theme.id === selectedTheme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setSelectedThemeId(theme.id);
                  setMode('evolution');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                  active
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/35'
                    : 'text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)]/65 border border-transparent'
                }`}
              >
                <span className="truncate">{theme.name}</span>
                <span className="font-mono text-[11px] tabular-nums text-[var(--atlas-text-subtle)] ml-2">
                  {theme.evolutionStages.length} stg · {theme.verseIds.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:block p-3 m-2 mt-4 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)] space-y-2 text-[11px] text-[var(--atlas-text-muted)] leading-relaxed">
          <div className="font-medium text-[var(--atlas-text-secondary)]">Corpus Provenance</div>
          <div className="font-mono tabular-nums text-[var(--atlas-text-subtle)]">
            {allCrossRefs.length} cross-references · {explicitCount} explicit biblical ·{' '}
            {verifiedCount} verified textual
          </div>
          <p>
            Explicit citations and textual parallels are distinguished from scholarly or
            typological syntheses in the curated sample corpus.
          </p>
        </div>
      </aside>

      {/* Main Discovery Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="px-5 sm:px-10 py-3 bg-[var(--atlas-surface)]/80 border-b border-[var(--atlas-border)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="inline-flex items-center p-0.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)]">
            <button
              type="button"
              onClick={() => setMode('evolution')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'evolution'
                  ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                  : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
              }`}
            >
              <Waypoints className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
              <span>OT → NT Thematic Evolution</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('database')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'database'
                  ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-secondary)]'
                  : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
              <span>Relationship Database</span>
              <span className="font-mono text-[11px] text-[var(--atlas-text-subtle)] tabular-nums">
                ({allCrossRefs.length})
              </span>
            </button>
          </div>

          <div className="text-xs text-[var(--atlas-text-subtle)] hidden sm:block">
            {mode === 'evolution'
              ? 'Trace canonical development from Pentateuch & Prophets to Gospels, Epistles & Revelation'
              : 'Filter quotations, allusions, prophecy, typology, parallels & shared themes'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-7">
          {mode === 'evolution' ? (
            <div className="max-w-4xl mx-auto space-y-7">
              <div className="pb-6 border-b border-[var(--atlas-border)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="text-xs text-[var(--atlas-text-muted)]">
                    Thematic Evolution · {selectedTheme.evolutionStages.length} Canonical Stages ·{' '}
                    {selectedTheme.verseIds.length} Key Passages
                  </div>
                  <h2 className="font-scripture text-3xl font-semibold text-[var(--atlas-heading)]">
                    {selectedTheme.name}
                  </h2>
                  <p className="text-sm text-[var(--atlas-text-secondary)] leading-relaxed">
                    {selectedTheme.summary}
                  </p>
                  <p className="text-xs italic text-[var(--atlas-accent)]">
                    Inquiry: {selectedTheme.keyQuestion}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onLoadVersesInGraph(selectedTheme.verseIds, selectedTheme.featuredAnchorId)
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold hover:bg-[var(--atlas-accent-hover)] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Explore Theme in Graph</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)]">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-[var(--atlas-heading)]">
                    Canonical Bridge Evidence Filter
                  </div>
                  <div className="text-[11px] text-[var(--atlas-text-muted)]">
                    {evolutionEpistemic === 'all'
                      ? 'Showing both explicit biblical citations/parallels and scholarly/interpretive connections.'
                      : EPISTEMIC_META[evolutionEpistemic].description}
                  </div>
                </div>

                <div className="inline-flex items-center p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] shrink-0">
                  {(
                    [
                      { id: 'all', label: 'All Links' },
                      { id: 'explicit_biblical', label: 'Explicit Biblical' },
                      { id: 'scholarly_interpretive', label: 'Scholarly / Interpretive' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEvolutionEpistemic(opt.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                        evolutionEpistemic === opt.id
                          ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                          : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {selectedTheme.evolutionStages.map((stage, stageIdx) => {
                  const stageVerses = stage.verseIds
                    .map((id) => getVerseById(id))
                    .filter((v): v is NonNullable<typeof v> => Boolean(v));
                  const stageBridges = stageEdgesMap.get(stage.id) ?? [];
                  const isLast = stageIdx === selectedTheme.evolutionStages.length - 1;

                  return (
                    <div key={stage.id} className="relative flex gap-4 sm:gap-5">
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center font-mono text-xs font-semibold tabular-nums border ${
                            stage.testament === 'OT'
                              ? 'bg-[var(--atlas-elevated)] border-[var(--atlas-accent)]/45 text-[var(--atlas-accent-soft)]'
                              : 'bg-[var(--atlas-secondary)]/15 border-[var(--atlas-secondary)]/45 text-[var(--atlas-secondary)]'
                          }`}
                        >
                          0{stage.stageOrder}
                        </div>
                        {!isLast && (
                          <div className="w-px flex-1 mt-2 bg-[var(--atlas-border-strong)]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pb-2 space-y-3">
                        <div className="p-4 sm:p-5 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span
                                  className={
                                    stage.testament === 'OT'
                                      ? 'font-medium text-[var(--atlas-accent)]'
                                      : 'font-medium text-[var(--atlas-secondary)]'
                                  }
                                >
                                  {stage.testament === 'OT' ? 'Old Testament' : 'New Testament'}
                                </span>
                                <span className="text-[var(--atlas-text-subtle)]">·</span>
                                <span className="text-[var(--atlas-text-muted)]">{stage.canonPeriod}</span>
                              </div>
                              <h3 className="font-scripture text-xl font-semibold text-[var(--atlas-heading)]">
                                {stage.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-[var(--atlas-text-secondary)] leading-relaxed">
                                {stage.developmentNote}
                              </p>
                            </div>

                            {stage.verseIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  onLoadVersesInGraph(stage.verseIds, stage.verseIds[0])
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-accent-soft)] transition-colors whitespace-nowrap shrink-0"
                              >
                                <GitFork className="w-3 h-3 text-[var(--atlas-accent)]" />
                                <span>Trace Stage in Graph</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-2.5">
                            {stageVerses.map((verse) => (
                              <div
                                key={verse.id}
                                className="p-3.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)] space-y-1.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-scripture text-sm font-semibold text-[var(--atlas-accent-soft)]">
                                    {verse.reference}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onOpenInReader(verse.bookId, verse.chapter, verse.id)
                                      }
                                      className="inline-flex items-center gap-1 text-xs text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)]"
                                    >
                                      <BookOpen className="w-3 h-3" />
                                      <span>Read</span>
                                    </button>
                                    <span className="text-[var(--atlas-text-subtle)]">·</span>
                                    <button
                                      type="button"
                                      onClick={() => onOpenInGraph(verse.id)}
                                      className="inline-flex items-center gap-1 text-xs text-[var(--atlas-secondary)] hover:text-[var(--atlas-secondary-soft)]"
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
                            ))}
                          </div>

                          {stageBridges.length > 0 && (
                            <div className="pt-3 border-t border-[var(--atlas-border)] space-y-2">
                              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                                <span>Intertextual Connections from Stage</span>
                                <span className="font-mono tabular-nums">
                                  {stageBridges.length}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {stageBridges.slice(0, 6).map((edge) => {
                                  const rel = RELATIONSHIP_METADATA[edge.relationship];
                                  const src = getVerseById(edge.source);
                                  const dst = getVerseById(edge.target);
                                  const epMeta = EPISTEMIC_META[edge.epistemicNature];
                                  const edMeta = EDITORIAL_STATUS_META[edge.editorialStatus];
                                  if (!src || !dst) return null;

                                  return (
                                    <div
                                      key={`${stage.id}-${edge.id}`}
                                      className="p-2.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)] text-xs space-y-1"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span
                                            className="w-3.5 h-0 shrink-0"
                                            style={{ borderTop: `2px ${rel.lineStyle} ${rel.color}` }}
                                            aria-hidden="true"
                                          />
                                          <span className="font-medium" style={{ color: rel.color }}>
                                            {rel.label}
                                          </span>
                                          <span className="text-[var(--atlas-text-subtle)]">·</span>
                                          <button
                                            type="button"
                                            onClick={() => onOpenInGraph(src.id)}
                                            className="text-[var(--atlas-heading)] hover:text-[var(--atlas-accent)] font-medium"
                                          >
                                            {src.shortRef}
                                          </button>
                                          <ArrowRight className="w-3 h-3 text-[var(--atlas-text-subtle)]" />
                                          <button
                                            type="button"
                                            onClick={() => onOpenInGraph(dst.id)}
                                            className="text-[var(--atlas-heading)] hover:text-[var(--atlas-accent)] font-medium"
                                          >
                                            {dst.shortRef}
                                          </button>
                                        </div>

                                        <span className="text-[11px] text-[var(--atlas-text-muted)]">
                                          <span style={{ color: epMeta.color }}>
                                            {epMeta.shortLabel}
                                          </span>
                                          {' · '}
                                          <span>{edMeta.label}</span>
                                        </span>
                                      </div>

                                      <p className="text-[11px] text-[var(--atlas-text-secondary)] leading-relaxed">
                                        {edge.explanation}
                                      </p>

                                      <div className="text-[11px] text-[var(--atlas-text-subtle)] flex flex-wrap gap-x-2">
                                        <span>Source: {edge.sourceAttribution}</span>
                                        {edge.supportingEvidence && (
                                          <>
                                            <span>·</span>
                                            <span>Evidence: {edge.supportingEvidence}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="pb-5 border-b border-[var(--atlas-border)] space-y-2">
                <div className="text-xs text-[var(--atlas-text-muted)]">
                  Cross-Reference Discovery System · {allCrossRefs.length} Structured Connections
                </div>
                <h2 className="font-scripture text-3xl font-semibold text-[var(--atlas-heading)]">
                  Biblical Relationship Database
                </h2>
                <p className="text-sm text-[var(--atlas-text-secondary)] leading-relaxed max-w-3xl">
                  Explore quotations, allusions, prophecy and fulfillment, typology, parallel
                  accounts, shared themes, historical links, and linguistic echoes. Every entry
                  declares its epistemic basis, editorial verification status, and textual source.
                </p>
                <div className="pt-1 text-xs text-[var(--atlas-text-muted)] flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    <strong className="font-medium text-[var(--atlas-secondary)]">Verified Textual:</strong>{' '}
                    Directly verifiable in KJV wording, citation formulas, or synoptic parallels.
                  </span>
                  <span>
                    <strong className="font-medium text-[var(--atlas-accent)]">Curated Sample:</strong>{' '}
                    Editorial thematic/typological links included in the Scripture Atlas sample
                    corpus.
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative md:col-span-1">
                    <Search className="w-3.5 h-3.5 text-[var(--atlas-text-subtle)] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={dbQuery}
                      onChange={(e) => setDbQuery(e.target.value)}
                      placeholder="Search verses, text, evidence, source..."
                      className="w-full h-8 pl-8 pr-3 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)]"
                    />
                  </div>

                  <div className="inline-flex items-center p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)]">
                    {(
                      [
                        { id: 'all', label: 'All Basis' },
                        { id: 'explicit_biblical', label: 'Explicit Biblical' },
                        { id: 'scholarly_interpretive', label: 'Scholarly / Interpretive' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDbEpistemic(opt.id)}
                        className={`flex-1 px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                          dbEpistemic === opt.id
                            ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                            : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="inline-flex items-center p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)]">
                    {(
                      [
                        { id: 'all', label: 'All Status' },
                        { id: 'verified_textual', label: 'Verified Textual' },
                        { id: 'curated_sample', label: 'Curated Sample' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDbEditorial(opt.id)}
                        className={`flex-1 px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                          dbEditorial === opt.id
                            ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-secondary)]'
                            : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--atlas-border)]">
                  <button
                    type="button"
                    onClick={() => setDbRelationship('all')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      dbRelationship === 'all'
                        ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/40'
                        : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] border border-transparent hover:bg-[var(--atlas-elevated)]/50'
                    }`}
                  >
                    All Categories ({dbCountsByRel.total})
                  </button>
                  {RELATIONSHIP_TYPES.map((type) => {
                    const meta = RELATIONSHIP_METADATA[type];
                    const active = dbRelationship === type;
                    const count = dbCountsByRel.byRel[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDbRelationship(type)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                          active
                            ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-heading)] border border-[var(--atlas-border-strong)]'
                            : 'text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)]/50 border border-transparent'
                        }`}
                      >
                        <span
                          className="w-3 h-0 shrink-0"
                          style={{ borderTop: `2px ${meta.lineStyle} ${meta.color}` }}
                          aria-hidden="true"
                        />
                        <span>{meta.label}</span>
                        <span className="font-mono text-[11px] text-[var(--atlas-text-subtle)] tabular-nums">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--atlas-text-muted)]">
                <span className="font-mono tabular-nums">
                  Showing {dbResults.length} of {allCrossRefs.length} indexed cross-references
                </span>
                {(dbRelationship !== 'all' ||
                  dbEpistemic !== 'all' ||
                  dbEditorial !== 'all' ||
                  dbQuery.trim() !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setDbRelationship('all');
                      setDbEpistemic('all');
                      setDbEditorial('all');
                      setDbQuery('');
                    }}
                    className="text-[var(--atlas-accent)] hover:underline"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {dbResults.length === 0 ? (
                <div className="p-8 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] text-center text-sm text-[var(--atlas-text-muted)]">
                  No cross-references match the selected filters.
                </div>
              ) : (
                <div className="space-y-3">
                  {dbResults.map((edge) => {
                    const rel = RELATIONSHIP_METADATA[edge.relationship];
                    const src = getVerseById(edge.source);
                    const dst = getVerseById(edge.target);
                    const epMeta = EPISTEMIC_META[edge.epistemicNature];
                    const edMeta = EDITORIAL_STATUS_META[edge.editorialStatus];
                    const confMeta = CONFIDENCE_META[edge.confidence];
                    if (!src || !dst) return null;

                    return (
                      <div
                        key={edge.id}
                        className="p-4 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] hover:border-[var(--atlas-border-strong)] transition-colors space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="w-4 h-0 shrink-0"
                              style={{ borderTop: `2px ${rel.lineStyle} ${rel.color}` }}
                              aria-hidden="true"
                            />
                            <span className="text-xs font-semibold" style={{ color: rel.color }}>
                              {rel.label}
                            </span>
                            <span className="text-[var(--atlas-text-subtle)]">·</span>
                            <span className="text-xs font-medium" style={{ color: epMeta.color }}>
                              {epMeta.label}
                            </span>
                            <span className="text-[var(--atlas-text-subtle)]">·</span>
                            <span className="text-xs text-[var(--atlas-text-secondary)]">{edMeta.label}</span>
                            <span className="text-[var(--atlas-text-subtle)]">·</span>
                            <span className="text-xs text-[var(--atlas-text-muted)]">{confMeta.label}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onLoadVersesInGraph([src.id, dst.id], src.id)
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-secondary)] transition-colors whitespace-nowrap"
                          >
                            <GitFork className="w-3 h-3" />
                            <span>Inspect Pair in Graph</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { role: 'Source Passage', verse: src },
                            { role: 'Connected Passage', verse: dst },
                          ].map(({ role, verse }) => (
                            <div
                              key={`${edge.id}-${role}-${verse.id}`}
                              className="p-3 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)] space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs">
                                  <span className="text-[var(--atlas-text-subtle)] mr-1.5">{role} ·</span>
                                  <span className="font-scripture font-semibold text-[var(--atlas-accent-soft)]">
                                    {verse.reference}
                                  </span>
                                  <span className="text-[var(--atlas-text-subtle)] ml-1.5">({verse.testament})</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenInReader(verse.bookId, verse.chapter, verse.id)
                                    }
                                    className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)]"
                                  >
                                    Read
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onOpenInGraph(verse.id)}
                                    className="text-[var(--atlas-secondary)] hover:text-[var(--atlas-secondary-soft)]"
                                  >
                                    Graph
                                  </button>
                                </div>
                              </div>
                              <p className="font-scripture text-sm text-[var(--atlas-text)] leading-relaxed">
                                {verse.text}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1 pt-0.5">
                          <p className="text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                            {edge.explanation}
                          </p>
                          <div className="text-[11px] text-[var(--atlas-text-muted)] flex flex-wrap gap-x-2 gap-y-0.5">
                            <span>Source: {edge.sourceAttribution}</span>
                            {edge.supportingEvidence && (
                              <>
                                <span className="text-[var(--atlas-text-subtle)]">·</span>
                                <span>Supporting Evidence: {edge.supportingEvidence}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
