import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Box,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  GitFork,
  Hammer,
  Landmark,
  Layers,
  Maximize2,
  Route,
  ScrollText,
  Sparkles,
  X,
} from 'lucide-react';
import {
  SANCTUARY_ARTICLES,
  SANCTUARY_COMPARTMENT_META,
} from '../data/sanctuary';
import { getVerseById } from '../services/scriptureService';
import {
  AtlasTheme,
  SanctuaryCompartment,
  VerseId,
} from '../types/scripture';
import { Sanctuary3D } from './Sanctuary3D';

interface SanctuaryExplorerViewProps {
  atlasTheme?: AtlasTheme;
  initialComponentId?: string;
  onOpenInGraph: (verseId: VerseId) => void;
  onLoadVersesInGraph: (verseIds: VerseId[], anchorId: VerseId) => void;
  onOpenInReader: (bookId: string, chapter: number, verseId: VerseId) => void;
}

type PlanZoom = 'precinct' | 'tabernacle';
type StudyLens = 'all' | 'textual' | 'interpretive';

function getSanctuarySvgPalette(theme: AtlasTheme) {
  if (theme === 'light') {
    return {
      canvasBg: '#F4EFE6',
      gridStroke: 'rgba(45, 38, 30, 0.08)',
      compassRing: 'rgba(45, 38, 30, 0.25)',
      compassCross: 'rgba(45, 38, 30, 0.38)',
      courtFill: 'rgba(235, 230, 220, 0.72)',
      courtHighlight: 'rgba(154, 72, 30, 0.1)',
      courtStroke: 'rgba(76, 68, 59, 0.45)',
      holyFill: 'rgba(229, 224, 213, 0.88)',
      holyHighlight: 'rgba(154, 72, 30, 0.18)',
      mostHolyFill: 'rgba(221, 214, 200, 0.94)',
      mostHolyHighlight: 'rgba(30, 122, 101, 0.16)',
      furnishingFill: '#EFECE5',
      laverFill: '#F8F6F3',
      gold: '#9A481E',
      goldBright: '#753414',
      goldSoft: '#B15424',
      copper: '#B15424',
      copperDeep: '#7A3512',
      teal: '#1E7A65',
      tealBright: '#155B4B',
      veil: '#7B3F96',
      veilText: '#622D7B',
      labelMuted: '#6C6257',
      labelDefault: '#4C443B',
      labelDim: '#877D71',
      dimLine: 'rgba(45, 38, 30, 0.35)',
    };
  }
  return {
    canvasBg: '#0D0E10',
    gridStroke: 'rgba(214, 206, 190, 0.06)',
    compassRing: 'rgba(214, 206, 190, 0.22)',
    compassCross: 'rgba(214, 206, 190, 0.35)',
    courtFill: 'rgba(20, 22, 25, 0.68)',
    courtHighlight: 'rgba(200, 109, 50, 0.09)',
    courtStroke: 'rgba(198, 191, 178, 0.42)',
    holyFill: 'rgba(28, 31, 36, 0.88)',
    holyHighlight: 'rgba(212, 137, 74, 0.16)',
    mostHolyFill: 'rgba(20, 22, 25, 0.96)',
    mostHolyHighlight: 'rgba(78, 196, 152, 0.15)',
    furnishingFill: '#242830',
    laverFill: '#1C1F24',
    gold: '#D4894A',
    goldBright: '#F4CFA4',
    goldSoft: '#E09A5E',
    copper: '#C86D32',
    copperDeep: '#9C4E1F',
    teal: '#4EC498',
    tealBright: '#84DFBE',
    veil: '#C48FDB',
    veilText: '#DEC3EB',
    labelMuted: '#8E887D',
    labelDefault: '#C6BFB2',
    labelDim: '#68635B',
    dimLine: 'rgba(214, 206, 190, 0.3)',
  };
}

export const SanctuaryExplorerView: React.FC<SanctuaryExplorerViewProps> = ({
  atlasTheme = 'dark',
  initialComponentId,
  onOpenInGraph,
  onLoadVersesInGraph,
  onOpenInReader,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialComponentId ?? SANCTUARY_ARTICLES[0].id
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [compartmentFilter, setCompartmentFilter] = useState<SanctuaryCompartment | 'all'>('all');
  const [planZoom, setPlanZoom] = useState<PlanZoom>('precinct');
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showPriestlyPath, setShowPriestlyPath] = useState<boolean>(true);
  const [studyLens, setStudyLens] = useState<StudyLens>('all');
  const [viewMode, setViewMode] = useState<'plan2d' | 'model3d'>('plan2d');
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);

  const svgColors = useMemo(() => getSanctuarySvgPalette(atlasTheme), [atlasTheme]);

  useEffect(() => {
    if (initialComponentId) {
      setSelectedId(initialComponentId);
      setInspectorOpen(true);
    }
  }, [initialComponentId]);

  const filteredComponents = useMemo(() => {
    if (compartmentFilter === 'all') return SANCTUARY_ARTICLES;
    return SANCTUARY_ARTICLES.filter((a) => a.compartment === compartmentFilter);
  }, [compartmentFilter]);

  const selected = useMemo(
    () => SANCTUARY_ARTICLES.find((a) => a.id === selectedId) ?? SANCTUARY_ARTICLES[0],
    [selectedId]
  );

  const selectedIndex = SANCTUARY_ARTICLES.findIndex((a) => a.id === selected.id);
  const activeVisualId = hoveredId ?? selected.id;

  const selectComponent = (id: string, autoZoomInterior = false) => {
    setSelectedId(id);
    setInspectorOpen(true);
    if (autoZoomInterior) {
      const target = SANCTUARY_ARTICLES.find((a) => a.id === id);
      if (target && target.compartment !== 'Outer Court' && planZoom === 'tabernacle') {
        setPlanZoom('tabernacle');
      }
    }
  };

  const viewBox =
    planZoom === 'precinct' ? '0 0 980 500' : '90 105 495 290';

  const isSelected = (id: string) => selected.id === id;
  const isHighlighted = (id: string) => activeVisualId === id;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[var(--atlas-bg)]">
      {/* Left Sanctuary Stations Sidebar */}
      <aside className="lg:w-76 xl:w-80 bg-[var(--atlas-surface)] border-b lg:border-b-0 lg:border-r border-[var(--atlas-border)] flex flex-col shrink-0 max-h-[34vh] lg:max-h-full overflow-hidden">
        <div className="p-3 border-b border-[var(--atlas-border)] space-y-2.5 shrink-0">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-[var(--atlas-text-muted)]">
            <div className="flex items-center gap-2">
              <Landmark className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
              <span>Tabernacle Pattern</span>
            </div>
            <span className="font-mono text-[11px] text-[var(--atlas-text-subtle)] tabular-nums">
              10 Stations
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'Outer Court', label: 'Court' },
                { id: 'Holy Place', label: 'Holy Place' },
                { id: 'Most Holy Place', label: 'Most Holy' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCompartmentFilter(f.id)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  compartmentFilter === f.id
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/40'
                    : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] border border-transparent hover:bg-[var(--atlas-elevated)]/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredComponents.map((art) => {
            const active = art.id === selected.id;
            const compColor = SANCTUARY_COMPARTMENT_META[art.compartment].accentColor;
            return (
              <button
                key={art.id}
                type="button"
                onClick={() => selectComponent(art.id)}
                onMouseEnter={() => setHoveredId(art.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`w-full text-left p-2.5 rounded-md border transition-colors ${
                  active
                    ? 'bg-[var(--atlas-elevated)] border-[var(--atlas-accent)]/45 text-[var(--atlas-heading)]'
                    : 'border-transparent hover:bg-[var(--atlas-elevated)]/60 text-[var(--atlas-text-secondary)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] tabular-nums text-[var(--atlas-text-subtle)] shrink-0">
                      {String(art.order).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium truncate">{art.name}</span>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: compColor }}
                  />
                </div>
                <div className="mt-0.5 pl-6 text-[11px] text-[var(--atlas-text-muted)] truncate">
                  {art.compartment} ·{' '}
                  {art.kind === 'compartment'
                    ? 'Chamber'
                    : art.kind === 'boundary'
                    ? 'Partition'
                    : 'Furnishing'}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Center Illustrated Architectural Floor Plan */}
      <div className="relative flex-1 min-h-[340px] flex flex-col bg-[var(--atlas-bg)] overflow-hidden">
        {/* Top Floor Plan / 3D Controls */}
        <div className="px-4 py-2.5 border-b border-[var(--atlas-border)] bg-[var(--atlas-surface)]/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center p-0.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)]">
              <button
                type="button"
                onClick={() => setViewMode('plan2d')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'plan2d'
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                    : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>2D Architectural Plan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('model3d')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'model3d'
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-secondary-soft)]'
                    : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                }`}
              >
                <Box className="w-3 h-3 text-[var(--atlas-secondary)]" />
                <span>3D Scale Model</span>
              </button>
            </div>

            {viewMode === 'plan2d' && (
              <>
                <div className="inline-flex items-center p-0.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
                  <button
                    type="button"
                    onClick={() => setPlanZoom('precinct')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                      planZoom === 'precinct'
                        ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                        : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                    }`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Full Precinct (100×50)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanZoom('tabernacle')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                      planZoom === 'tabernacle'
                        ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-secondary-soft)]'
                        : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Tabernacle Interior</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDimensions((v) => !v)}
                  className={`h-7 px-2.5 rounded border text-[11px] font-medium transition-colors whitespace-nowrap ${
                    showDimensions
                      ? 'bg-[var(--atlas-accent)]/15 text-[var(--atlas-accent-soft)] border-[var(--atlas-accent)]/40'
                      : 'bg-[var(--atlas-bg)] text-[var(--atlas-text-muted)] border-[var(--atlas-border)]'
                  }`}
                >
                  Cubit Dimensions
                </button>

                <button
                  type="button"
                  onClick={() => setShowPriestlyPath((v) => !v)}
                  className={`h-7 px-2.5 rounded border text-[11px] font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                    showPriestlyPath
                      ? 'bg-[var(--atlas-secondary)]/15 text-[var(--atlas-secondary-soft)] border-[var(--atlas-secondary)]/40'
                      : 'bg-[var(--atlas-bg)] text-[var(--atlas-text-muted)] border-[var(--atlas-border)]'
                  }`}
                >
                  <Route className="w-3 h-3" />
                  <span>Ritual Path</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--atlas-text-muted)]">
            <span className="hidden sm:inline">
              Exodus 25–30 · {viewMode === 'model3d' ? '3D Scale Model' : 'Architectural Plan'}
            </span>
            {!inspectorOpen && (
              <button
                type="button"
                onClick={() => setInspectorOpen(true)}
                className="px-2.5 py-1 rounded bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] font-sans font-semibold"
              >
                Inspect
              </button>
            )}
          </div>
        </div>

        {/* Interactive Stage: 2D SVG Plan or 3D Scale Model */}
        {viewMode === 'model3d' ? (
          <Sanctuary3D
            atlasTheme={atlasTheme}
            selectedId={selected.id}
            onSelectComponent={(id) => selectComponent(id)}
          />
        ) : (
        <div className="relative flex-1 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <svg
            viewBox={viewBox}
            className="w-full h-full max-h-full select-none"
            role="img"
            aria-label="Interactive illustrated floor plan of the biblical tabernacle"
          >
            <defs>
              <pattern id="sanctuaryGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke={svgColors.gridStroke}
                  strokeWidth="1"
                />
              </pattern>
              <radialGradient id="shekinahGlow" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={svgColors.goldBright} stopOpacity="0.28" />
                <stop offset="55%" stopColor={svgColors.gold} stopOpacity="0.09" />
                <stop offset="100%" stopColor={svgColors.canvasBg} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="altarEmber" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={svgColors.gold} stopOpacity="0.52" />
                <stop offset="100%" stopColor={svgColors.copper} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="menorahGlow" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={svgColors.goldBright} stopOpacity="0.4" />
                <stop offset="100%" stopColor={svgColors.gold} stopOpacity="0" />
              </radialGradient>
              <marker
                id="pathArrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill={svgColors.teal} />
              </marker>
            </defs>

            {/* Blueprint Backdrop Grid */}
            <rect x="0" y="0" width="980" height="500" fill={svgColors.canvasBg} />
            <rect x="0" y="0" width="980" height="500" fill="url(#sanctuaryGrid)" />

            {/* Compass Rose (Top-Left of Precinct) */}
            <g transform="translate(48, 46)" opacity="0.78">
              <circle cx="0" cy="0" r="18" fill="none" stroke={svgColors.compassRing} strokeWidth="1" />
              <path d="M 0 -14 L 3 0 L 0 14 L -3 0 Z" fill={svgColors.gold} fillOpacity="0.72" />
              <path d="M -14 0 L 0 -3 L 14 0 L 0 3 Z" fill={svgColors.compassCross} />
              <text x="0" y="-22" textAnchor="middle" fill={svgColors.labelMuted} fontSize="9" fontFamily="JetBrains Mono">N</text>
              <text x="0" y="29" textAnchor="middle" fill={svgColors.labelDim} fontSize="8.5" fontFamily="JetBrains Mono">S</text>
              <text x="-26" y="3" textAnchor="middle" fill={svgColors.labelDim} fontSize="8.5" fontFamily="JetBrains Mono">W</text>
              <text x="26" y="3" textAnchor="middle" fill={svgColors.gold} fontSize="8.5" fontFamily="JetBrains Mono">E</text>
            </g>

            {/* 1. THE COURTYARD (Outer Court Enclosure: x 80..900, y 70..430) */}
            <g
              className="cursor-pointer"
              onClick={() => selectComponent('sanc-courtyard')}
              onMouseEnter={() => setHoveredId('sanc-courtyard')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect
                x="80"
                y="70"
                width="820"
                height="360"
                rx="3"
                fill={
                  isHighlighted('sanc-courtyard')
                    ? svgColors.courtHighlight
                    : svgColors.courtFill
                }
                stroke={
                  isHighlighted('sanc-courtyard') ? svgColors.gold : svgColors.courtStroke
                }
                strokeWidth={isSelected('sanc-courtyard') ? 2.5 : 1.5}
              />

              {/* East Gate Opening & Embroidered Curtain (Right Wall, centered y=180..320) */}
              <line
                x1="900"
                y1="180"
                x2="900"
                y2="320"
                stroke={svgColors.canvasBg}
                strokeWidth="4"
              />
              <line
                x1="900"
                y1="180"
                x2="900"
                y2="320"
                stroke={svgColors.veil}
                strokeWidth="4"
                strokeDasharray="8 4"
              />
              <line
                x1="903"
                y1="180"
                x2="903"
                y2="320"
                stroke="#6CA6CD"
                strokeWidth="1.5"
                strokeDasharray="6 6"
              />

              {/* Perimeter Pillars along North & South walls */}
              {Array.from({ length: 21 }).map((_, idx) => {
                const px = 80 + idx * 41;
                return (
                  <g key={`ns-${idx}`}>
                    <circle cx={px} cy={70} r="2.2" fill={svgColors.copper} />
                    <circle cx={px} cy={430} r="2.2" fill={svgColors.copper} />
                  </g>
                );
              })}
              {/* Perimeter Pillars along West & East walls */}
              {Array.from({ length: 9 }).map((_, idx) => {
                const py = 70 + idx * 45;
                return (
                  <g key={`we-${idx}`}>
                    <circle cx={80} cy={py} r="2.2" fill={svgColors.copper} />
                    {(py <= 180 || py >= 320) && (
                      <circle cx={900} cy={py} r="2.2" fill={svgColors.copper} />
                    )}
                  </g>
                );
              })}

              <text
                x="620"
                y="95"
                fill={isHighlighted('sanc-courtyard') ? svgColors.goldBright : svgColors.labelMuted}
                fontSize="12"
                fontWeight="600"
                letterSpacing="0.08em"
                fontFamily="Plus Jakarta Sans"
              >
                OUTER COURTYARD
              </text>
              <text
                x="914"
                y="254"
                fill={svgColors.veilText}
                fontSize="10"
                fontFamily="JetBrains Mono"
              >
                EAST GATE
              </text>
            </g>

            {/* Optional Priestly Approach Path */}
            {showPriestlyPath && (
              <path
                d="M 926 250 L 535 250 L 315 250 L 185 250"
                fill="none"
                stroke={svgColors.teal}
                strokeOpacity="0.48"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                markerEnd="url(#pathArrow)"
                pointerEvents="none"
              />
            )}

            {/* 2. ALTAR OF BURNT OFFERING (Outer Court East, x=725, y=214) */}
            <g
              className="cursor-pointer"
              onClick={() => selectComponent('sanc-altar-burnt-offering')}
              onMouseEnter={() => setHoveredId('sanc-altar-burnt-offering')}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isHighlighted('sanc-altar-burnt-offering') && (
                <rect
                  x="706"
                  y="204"
                  width="94"
                  height="92"
                  rx="6"
                  fill="rgba(200, 109, 50, 0.14)"
                  stroke={svgColors.gold}
                  strokeWidth="1.2"
                />
              )}
              <polygon
                points="792,232 820,236 820,264 792,268"
                fill={svgColors.furnishingFill}
                stroke={svgColors.copper}
                strokeWidth="1.2"
              />
              <rect
                x="718"
                y="214"
                width="74"
                height="72"
                rx="2"
                fill={svgColors.furnishingFill}
                stroke={isHighlighted('sanc-altar-burnt-offering') ? svgColors.goldBright : svgColors.copper}
                strokeWidth={isSelected('sanc-altar-burnt-offering') ? 2.5 : 1.8}
              />
              <rect
                x="730"
                y="226"
                width="50"
                height="48"
                fill="url(#altarEmber)"
                stroke={svgColors.copperDeep}
                strokeWidth="1"
              />
              <path
                d="M 730 250 L 780 250 M 755 226 L 755 274 M 736 232 L 774 268 M 774 232 L 736 268"
                stroke={svgColors.gold}
                strokeOpacity="0.52"
                strokeWidth="1"
              />
              <circle cx="718" cy="214" r="4" fill={svgColors.gold} />
              <circle cx="792" cy="214" r="4" fill={svgColors.gold} />
              <circle cx="718" cy="286" r="4" fill={svgColors.gold} />
              <circle cx="792" cy="286" r="4" fill={svgColors.gold} />

              <text
                x="755"
                y="310"
                textAnchor="middle"
                fill={isHighlighted('sanc-altar-burnt-offering') ? svgColors.goldBright : svgColors.labelDefault}
                fontSize="11"
                fontWeight={isSelected('sanc-altar-burnt-offering') ? '600' : '500'}
                fontFamily="Plus Jakarta Sans"
              >
                Altar of Burnt Offering
              </text>
            </g>

            {/* 3. THE BRONZE LAVER (Between Altar and Tent Door, x=608, y=250) */}
            <g
              className="cursor-pointer"
              onClick={() => selectComponent('sanc-laver')}
              onMouseEnter={() => setHoveredId('sanc-laver')}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isHighlighted('sanc-laver') && (
                <circle
                  cx="608"
                  cy="250"
                  r="34"
                  fill="rgba(78, 196, 152, 0.14)"
                  stroke={svgColors.teal}
                  strokeWidth="1.2"
                />
              )}
              <circle
                cx="608"
                cy="250"
                r="24"
                fill={svgColors.laverFill}
                stroke={isHighlighted('sanc-laver') ? svgColors.tealBright : svgColors.copper}
                strokeWidth={isSelected('sanc-laver') ? 2.5 : 1.8}
              />
              <circle
                cx="608"
                cy="250"
                r="17"
                fill={svgColors.teal}
                fillOpacity="0.22"
                stroke={svgColors.teal}
                strokeWidth="1.2"
              />
              <circle
                cx="608"
                cy="250"
                r="9"
                fill="none"
                stroke={svgColors.tealBright}
                strokeOpacity="0.55"
                strokeWidth="0.9"
                strokeDasharray="3 2"
              />
              <text
                x="608"
                y="293"
                textAnchor="middle"
                fill={isHighlighted('sanc-laver') ? svgColors.tealBright : svgColors.labelDefault}
                fontSize="11"
                fontWeight={isSelected('sanc-laver') ? '600' : '500'}
                fontFamily="Plus Jakarta Sans"
              >
                Bronze Laver
              </text>
            </g>

            {/* TABERNACLE STRUCTURE SHELL */}
            <rect
              x="131"
              y="141"
              width="398"
              height="218"
              rx="3"
              fill={svgColors.gold}
              fillOpacity="0.08"
              stroke={svgColors.gold}
              strokeOpacity="0.6"
              strokeWidth="1"
              pointerEvents="none"
            />

            {/* 4. THE HOLY PLACE */}
            <g
              className="cursor-pointer"
              onClick={() => selectComponent('sanc-holy-place')}
              onMouseEnter={() => setHoveredId('sanc-holy-place')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect
                x="275"
                y="145"
                width="250"
                height="210"
                fill={
                  isHighlighted('sanc-holy-place')
                    ? svgColors.holyHighlight
                    : svgColors.holyFill
                }
                stroke={isHighlighted('sanc-holy-place') ? svgColors.goldBright : svgColors.gold}
                strokeWidth={isSelected('sanc-holy-place') ? 2.6 : 1.6}
              />
              {[165, 207, 250, 293, 335].map((py, idx) => (
                <circle key={`hp-door-${idx}`} cx="525" cy={py} r="3" fill={svgColors.goldBright} />
              ))}
              <line
                x1="525"
                y1="150"
                x2="525"
                y2="350"
                stroke="#6CA6CD"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.7"
              />
              <text
                x="400"
                y="165"
                textAnchor="middle"
                fill={isHighlighted('sanc-holy-place') ? svgColors.goldBright : svgColors.labelDefault}
                fontSize="11.5"
                fontWeight="600"
                letterSpacing="0.08em"
                fontFamily="Plus Jakarta Sans"
              >
                HOLY PLACE
              </text>
            </g>

            {/* 9. THE MOST HOLY PLACE */}
            <g
              className="cursor-pointer"
              onClick={() => selectComponent('sanc-most-holy-place')}
              onMouseEnter={() => setHoveredId('sanc-most-holy-place')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect
                x="135"
                y="145"
                width="140"
                height="210"
                fill={
                  isHighlighted('sanc-most-holy-place')
                    ? svgColors.mostHolyHighlight
                    : svgColors.mostHolyFill
                }
                stroke={isHighlighted('sanc-most-holy-place') ? svgColors.tealBright : svgColors.gold}
                strokeWidth={isSelected('sanc-most-holy-place') ? 2.6 : 1.6}
              />
              <circle cx="205" cy="250" r="64" fill="url(#shekinahGlow)" pointerEvents="none" />
              <text
                x="205"
                y="165"
                textAnchor="middle"
                fill={isHighlighted('sanc-most-holy-place') ? svgColors.tealBright : svgColors.labelDefault}
                fontSize="10.5"
                fontWeight="600"
                letterSpacing="0.06em"
                fontFamily="Plus Jakarta Sans"
              >
                MOST HOLY PLACE
              </text>
            </g>

            {/* 6. TABLE OF SHOWBREAD */}
            <g
              className="cursor-pointer"
              onClick={() => selectComponent('sanc-table-showbread')}
              onMouseEnter={() => setHoveredId('sanc-table-showbread')}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isHighlighted('sanc-table-showbread') && (
                <rect
                  x="368"
                  y="174"
                  width="84"
                  height="44"
                  rx="4"
                  fill="rgba(212, 137, 74, 0.18)"
                  stroke={svgColors.goldBright}
                  strokeWidth="1.2"
                />
              )}
              <rect
                x="375"
                y="180"
                width="70"
                height="32"
                rx="2"
                fill={svgColors.furnishingFill}
                stroke={isHighlighted('sanc-table-showbread') ? svgColors.goldBright : svgColors.gold}
                strokeWidth={isSelected('sanc-table-showbread') ? 2.2 : 1.5}
              />
              {Array.from({ length: 6 }).map((_, col) => (
                <g key={`loaf-${col}`}>
                  <circle cx={386 + col * 9.5} cy={190} r="3" fill={svgColors.goldSoft} />
                  <circle cx={386 + col * 9.5} cy={202} r="3" fill={svgColors.goldSoft} />
                </g>
              ))}
              <text
                x="410"
                y="227"
                textAnchor="middle"
                fill={isHighlighted('sanc-table-showbread') ? svgColors.goldBright : svgColors.labelDefault}
                fontSize="10"
                fontWeight={isSelected('sanc-table-showbread') ? '600' : '500'}
                fontFamily="Plus Jakarta Sans"
              >
                Table of Showbread
              </text>
            </g>

            {/* 5. THE GOLDEN CANDLESTICK / MENORAH */}
            <g
              className="cursor-pointer"
              onClick={() => selectComponent('sanc-candlestick')}
              onMouseEnter={() => setHoveredId('sanc-candlestick')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <circle cx="410" cy="304" r="38" fill="url(#menorahGlow)" pointerEvents="none" />
              {isHighlighted('sanc-candlestick') && (
                <rect
                  x="372"
                  y="278"
                  width="76"
                  height="52"
                  rx="4"
                  fill="rgba(224, 154, 94, 0.14)"
                  stroke={svgColors.goldSoft}
                  strokeWidth="1.2"
                />
              )}
              <g stroke={svgColors.goldSoft} strokeWidth="2" fill="none" strokeLinecap="round">
                <line x1="410" y1="286" x2="410" y2="322" />
                <line x1="398" y1="322" x2="422" y2="322" />
                <path d="M 383 287 Q 383 314 410 314 Q 437 314 437 287" />
                <path d="M 392 287 Q 392 308 410 308 Q 428 308 428 287" />
                <path d="M 401 287 Q 401 302 410 302 Q 419 302 419 287" />
              </g>
              {[383, 392, 401, 410, 419, 428, 437].map((fx, i) => (
                <circle key={`flame-${i}`} cx={fx} cy={284} r="2.2" fill={svgColors.goldBright} />
              ))}
              <text
                x="410"
                y="341"
                textAnchor="middle"
                fill={isHighlighted('sanc-candlestick') ? svgColors.goldBright : svgColors.labelDefault}
                fontSize="10"
                fontWeight={isSelected('sanc-candlestick') ? '600' : '500'}
                fontFamily="Plus Jakarta Sans"
              >
                Golden Candlestick
              </text>
            </g>

            {/* 7. THE ALTAR OF INCENSE */}
            <g
              className="cursor-pointer"
              onClick={() => selectComponent('sanc-altar-incense')}
              onMouseEnter={() => setHoveredId('sanc-altar-incense')}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isHighlighted('sanc-altar-incense') && (
                <circle
                  cx="318"
                  cy="250"
                  r="24"
                  fill="rgba(196, 143, 219, 0.16)"
                  stroke={svgColors.veil}
                  strokeWidth="1.2"
                />
              )}
              <rect
                x="304"
                y="236"
                width="28"
                height="28"
                rx="2"
                fill={svgColors.furnishingFill}
                stroke={isHighlighted('sanc-altar-incense') ? svgColors.veilText : svgColors.gold}
                strokeWidth={isSelected('sanc-altar-incense') ? 2.4 : 1.6}
              />
              <circle cx="304" cy="236" r="2.5" fill={svgColors.goldBright} />
              <circle cx="332" cy="236" r="2.5" fill={svgColors.goldBright} />
              <circle cx="304" cy="264" r="2.5" fill={svgColors.goldBright} />
              <circle cx="332" cy="264" r="2.5" fill={svgColors.goldBright} />
              <circle cx="318" cy="250" r="6" fill={svgColors.veil} fillOpacity="0.45" />
              <text
                x="320"
                y="282"
                textAnchor="middle"
                fill={isHighlighted('sanc-altar-incense') ? svgColors.veilText : svgColors.labelDefault}
                fontSize="10"
                fontWeight={isSelected('sanc-altar-incense') ? '600' : '500'}
                fontFamily="Plus Jakarta Sans"
              >
                Altar of Incense
              </text>
            </g>

            {/* 8. THE VEIL OF PARTITION */}
            <g
              className="cursor-pointer"
              onClick={() => selectComponent('sanc-veil')}
              onMouseEnter={() => setHoveredId('sanc-veil')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <line
                x1="275"
                y1="145"
                x2="275"
                y2="355"
                stroke="transparent"
                strokeWidth="16"
              />
              <line
                x1="275"
                y1="145"
                x2="275"
                y2="355"
                stroke={isHighlighted('sanc-veil') ? svgColors.tealBright : svgColors.veil}
                strokeWidth={isHighlighted('sanc-veil') ? 5 : 3}
                strokeDasharray="6 3"
              />
              {[170, 223, 277, 330].map((vy, idx) => (
                <circle key={`veil-p-${idx}`} cx="275" cy={vy} r="3" fill={svgColors.gold} />
              ))}
              <text
                x="275"
                y="374"
                textAnchor="middle"
                fill={isHighlighted('sanc-veil') ? svgColors.tealBright : svgColors.veilText}
                fontSize="10"
                fontWeight={isSelected('sanc-veil') ? '600' : '500'}
                fontFamily="JetBrains Mono"
              >
                THE VEIL
              </text>
            </g>

            {/* 10. THE ARK OF THE COVENANT & MERCY SEAT */}
            <g
              className="cursor-pointer"
              onClick={() => selectComponent('sanc-ark-covenant')}
              onMouseEnter={() => setHoveredId('sanc-ark-covenant')}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isHighlighted('sanc-ark-covenant') && (
                <rect
                  x="162"
                  y="218"
                  width="86"
                  height="64"
                  rx="5"
                  fill="rgba(212, 137, 74, 0.2)"
                  stroke={svgColors.goldBright}
                  strokeWidth="1.4"
                />
              )}
              <line x1="158" y1="234" x2="252" y2="234" stroke={svgColors.gold} strokeOpacity="0.7" strokeWidth="2.2" />
              <line x1="158" y1="266" x2="252" y2="266" stroke={svgColors.gold} strokeOpacity="0.7" strokeWidth="2.2" />
              <rect
                x="175"
                y="228"
                width="60"
                height="44"
                rx="2"
                fill={svgColors.gold}
                fillOpacity="0.22"
                stroke={isHighlighted('sanc-ark-covenant') ? svgColors.goldBright : svgColors.goldSoft}
                strokeWidth={isSelected('sanc-ark-covenant') ? 2.5 : 1.8}
              />
              <rect
                x="181"
                y="234"
                width="48"
                height="32"
                rx="1.5"
                fill={svgColors.goldBright}
                fillOpacity="0.14"
                stroke={svgColors.goldBright}
                strokeWidth="1"
              />
              <path
                d="M 185 250 C 192 238, 200 240, 203 248 M 225 250 C 218 238, 210 240, 207 248"
                fill="none"
                stroke={svgColors.goldBright}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="187" cy="256" r="2.2" fill={svgColors.goldBright} />
              <circle cx="223" cy="256" r="2.2" fill={svgColors.goldBright} />

              <text
                x="205"
                y="292"
                textAnchor="middle"
                fill={isHighlighted('sanc-ark-covenant') ? svgColors.goldBright : svgColors.goldSoft}
                fontSize="10.5"
                fontWeight="600"
                fontFamily="Plus Jakarta Sans"
              >
                Ark of the Covenant
              </text>
            </g>

            {/* Optional Cubit Architectural Dimensions Overlay */}
            {showDimensions && (
              <g pointerEvents="none" fontFamily="JetBrains Mono" fontSize="9.5" fill={svgColors.labelDim}>
                <line x1="80" y1="452" x2="900" y2="452" stroke={svgColors.dimLine} strokeWidth="1" />
                <line x1="80" y1="446" x2="80" y2="458" stroke={svgColors.dimLine} strokeWidth="1" />
                <line x1="900" y1="446" x2="900" y2="458" stroke={svgColors.dimLine} strokeWidth="1" />
                <rect x="420" y="443" width="140" height="16" fill={svgColors.canvasBg} />
                <text x="490" y="454" textAnchor="middle" fill={svgColors.labelMuted}>
                  100 CUBITS (E–W)
                </text>

                <line x1="56" y1="70" x2="56" y2="430" stroke={svgColors.dimLine} strokeWidth="1" />
                <text
                  x="44"
                  y="250"
                  textAnchor="middle"
                  transform="rotate(-90 44 250)"
                  fill={svgColors.labelMuted}
                >
                  50 CUBITS (N–S)
                </text>

                <text x="205" y="132" textAnchor="middle" fill={svgColors.tealBright} fontSize="9">
                  10 × 10 cubits
                </text>
                <text x="400" y="132" textAnchor="middle" fill={svgColors.gold} fontSize="9">
                  20 × 10 cubits
                </text>
                <text x="755" y="205" textAnchor="middle" fill={svgColors.copper} fontSize="8.5">
                  5×5×3 cubits
                </text>
              </g>
            )}
          </svg>

          {/* Bottom-Left Material Key */}
          <div className="hidden md:flex items-center gap-4 absolute bottom-3 left-3 px-3 py-1.5 rounded bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] text-[11px] text-[var(--atlas-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C86D32]" />
              Bronze (Court)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--atlas-accent)]" />
              Pure Gold (Tent)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C48FDB]" />
              Woven Veil / Gate
            </span>
          </div>

          {/* Bottom-Center Sacred Progression Stepper */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] shadow-xl max-w-[92%] sm:max-w-md">
            <button
              type="button"
              disabled={selectedIndex <= 0}
              onClick={() => selectComponent(SANCTUARY_ARTICLES[selectedIndex - 1].id, true)}
              aria-label="Previous sanctuary station"
              className="p-1.5 rounded hover:bg-[var(--atlas-elevated)] text-[var(--atlas-text-secondary)] disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 text-center px-2">
              <div className="text-[10px] font-mono tabular-nums text-[var(--atlas-text-muted)]">
                Station {selected.order} of {SANCTUARY_ARTICLES.length} · East → West
              </div>
              <div className="text-xs font-medium text-[var(--atlas-heading)] truncate">
                {selected.name}
              </div>
            </div>
            <button
              type="button"
              disabled={selectedIndex >= SANCTUARY_ARTICLES.length - 1}
              onClick={() => selectComponent(SANCTUARY_ARTICLES[selectedIndex + 1].id, true)}
              aria-label="Next sanctuary station"
              className="p-1.5 rounded hover:bg-[var(--atlas-elevated)] text-[var(--atlas-text-secondary)] disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Right Component Inspector */}
      {inspectorOpen && (
        <aside className="fixed inset-x-0 bottom-0 h-[52vh] lg:static lg:h-full lg:w-[400px] xl:w-[440px] bg-[var(--atlas-surface)] border-t lg:border-t-0 lg:border-l border-[var(--atlas-border)] flex flex-col shrink-0 z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--atlas-border)] space-y-2.5 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-[var(--atlas-text-muted)] flex items-center gap-1.5 flex-wrap">
                  <span
                    className="font-mono tabular-nums font-medium"
                    style={{
                      color: SANCTUARY_COMPARTMENT_META[selected.compartment].accentColor,
                    }}
                  >
                    Station {String(selected.order).padStart(2, '0')} · {selected.compartment}
                  </span>
                </div>
                <h2 className="mt-0.5 font-scripture text-xl font-semibold text-[var(--atlas-heading)] leading-snug">
                  {selected.name}
                </h2>
                {selected.hebrewTerm && (
                  <div className="mt-0.5 text-[11px] font-mono text-[var(--atlas-text-muted)]">
                    {selected.hebrewTerm}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setInspectorOpen(false)}
                aria-label="Close sanctuary inspector"
                className="p-1.5 rounded text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Study Lens & Trace Action */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'textual', label: 'Biblical Text' },
                    { id: 'interpretive', label: 'Interpretation' },
                  ] as const
                ).map((lens) => (
                  <button
                    key={lens.id}
                    type="button"
                    onClick={() => setStudyLens(lens.id)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                      studyLens === lens.id
                        ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                        : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                    }`}
                  >
                    {lens.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onLoadVersesInGraph(selected.verseIds, selected.verseIds[0])}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold hover:bg-[var(--atlas-accent-hover)] whitespace-nowrap shrink-0"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Trace in Graph</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {(studyLens === 'all' || studyLens === 'textual') && (
              <section className="p-3.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] space-y-3.5">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--atlas-border)]">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-accent-soft)]">
                    <ScrollText className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                    <span>Biblical Description &amp; Construction</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--atlas-text-muted)]">
                    Direct Textual
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[var(--atlas-text-muted)]">Dimensions: </span>
                    <span className="font-mono text-[var(--atlas-text)]">{selected.dimensions}</span>
                  </div>
                  <div>
                    <span className="text-[var(--atlas-text-muted)]">Materials: </span>
                    <span className="text-[var(--atlas-text)]">{selected.material}</span>
                  </div>
                  <div>
                    <span className="text-[var(--atlas-text-muted)]">OT Basis: </span>
                    <span className="font-mono text-[var(--atlas-accent)]">
                      {selected.otTextualBasis.join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--atlas-text-muted)]">
                    Textual Description
                  </div>
                  <p className="text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                    {selected.biblicalDescription}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--atlas-text-muted)]">
                    <Hammer className="w-3 h-3 text-[var(--atlas-accent)]" />
                    <span>Construction &amp; Craftsmanship</span>
                  </div>
                  <p className="text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                    {selected.construction}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--atlas-text-muted)]">
                    <Compass className="w-3 h-3 text-[var(--atlas-accent)]" />
                    <span>Ritual Purpose in Service</span>
                  </div>
                  <p className="text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                    {selected.purpose}
                  </p>
                </div>
              </section>
            )}

            {(studyLens === 'all' || studyLens === 'interpretive') && (
              <section className="p-3.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-secondary)]/30 space-y-3.5">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--atlas-border)]">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-secondary-soft)]">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                    <span>Symbolism &amp; Interpretation</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--atlas-text-muted)]">
                    Theological / Typological
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--atlas-text-muted)]">
                    Symbolic Meaning
                  </div>
                  <p className="text-xs text-[var(--atlas-text)] leading-relaxed">
                    {selected.symbolism}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--atlas-text-muted)]">
                    New Testament &amp; Heavenly Sanctuary Perspective
                  </div>
                  <p className="text-xs text-[var(--atlas-secondary-soft)] leading-relaxed">
                    {selected.ntFulfillment}
                  </p>
                </div>

                <div className="pt-1 space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                    Canonical Connections
                  </div>
                  {selected.canonicalConnections.map((conn, idx) => (
                    <div
                      key={`${selected.id}-conn-${idx}`}
                      className="p-2.5 rounded bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[var(--atlas-heading)]">
                            {conn.label}
                          </div>
                          <div className="text-[10.5px] font-mono text-[var(--atlas-text-muted)] mt-0.5">
                            {conn.otRef}
                            {conn.ntRef ? ` → ${conn.ntRef}` : ''}
                            {' · '}
                            <span
                              className={
                                conn.epistemicNature === 'explicit_biblical'
                                  ? 'text-[var(--atlas-secondary-soft)]'
                                  : 'text-[#C48FDB]'
                              }
                            >
                              {conn.epistemicNature === 'explicit_biblical'
                                ? 'Explicit Biblical Link'
                                : 'Theological Interpretation'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onLoadVersesInGraph(conn.verseIds, conn.verseIds[0])}
                          className="text-[11px] text-[var(--atlas-secondary)] hover:underline shrink-0"
                        >
                          Graph
                        </button>
                      </div>
                      <p className="text-[11.5px] text-[var(--atlas-text-secondary)] leading-relaxed">
                        {conn.note}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="pt-1 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                  Associated KJV Passages ({selected.verseIds.length})
                </span>
              </div>
              <div className="space-y-2">
                {selected.verseIds.map((vId) => {
                  const verse = getVerseById(vId);
                  if (!verse) return null;
                  return (
                    <div
                      key={verse.id}
                      className="p-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
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
                          <button
                            type="button"
                            onClick={() => onOpenInGraph(verse.id)}
                            className="inline-flex items-center gap-1 text-xs text-[var(--atlas-secondary)] hover:underline"
                          >
                            <GitFork className="w-3 h-3" />
                            <span>Graph</span>
                          </button>
                        </div>
                      </div>
                      <p className="font-scripture text-[14.5px] leading-relaxed text-[var(--atlas-text)]">
                        {verse.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </aside>
      )}
    </div>
  );
};
