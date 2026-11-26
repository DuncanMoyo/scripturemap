import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Cloud,
  Command,
  Compass,
  FolderKanban,
  GitFork,
  Grid3X3,
  History,
  Keyboard,
  Landmark,
  Languages,
  Network,
  Search,
  Share2,
} from 'lucide-react';
import { getDatasetSummary } from '../services/scriptureService';
import { GraphViewMode, VerseId } from '../types/scripture';

interface GuideViewProps {
  onOpenInGraph: (verseId: VerseId) => void;
  onOpenGraphMode: (mode: GraphViewMode, anchorVerseId?: VerseId) => void;
  onTracePath: (sourceId: VerseId, targetId: VerseId) => void;
  onOpenInReader: (bookId: string, chapter: number, verseId?: VerseId) => void;
  onOpenTheme: (themeId: string) => void;
  onOpenTimeline: (eventId?: string) => void;
  onOpenLocation: (locationId: string) => void;
  onOpenJourney: (journeyId: string) => void;
  onOpenSanctuary: (sanctuaryId: string) => void;
  onOpenCollections: () => void;
  onOpenCommandPalette: () => void;
}

type GuideFocus =
  | 'all'
  | 'graph'
  | 'reader'
  | 'themes_timeline'
  | 'geo_sanctuary'
  | 'sync_shortcuts';

interface ModuleGuideSection {
  id: Exclude<GuideFocus, 'all' | 'sync_shortcuts'>;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  coreSteps: {
    heading: string;
    detail: string;
  }[];
  proTips: string[];
  launchers: {
    label: string;
    detail: string;
    onLaunch: () => void;
  }[];
}

export const GuideView: React.FC<GuideViewProps> = ({
  onOpenInGraph,
  onOpenGraphMode,
  onTracePath,
  onOpenInReader,
  onOpenTheme,
  onOpenTimeline,
  onOpenLocation,
  onOpenJourney,
  onOpenSanctuary,
  onOpenCollections,
  onOpenCommandPalette,
}) => {
  const [focus, setFocus] = useState<GuideFocus>('all');
  const [filterText, setFilterText] = useState('');
  const summary = useMemo(() => getDatasetSummary(), []);

  const quickRecipes = useMemo(
    () => [
      {
        title: 'Trace Full-Bible Path (Ruth 2:1 → Rev 21:1)',
        category: '344k TSK Network',
        description:
          'Run weighted Dijkstra pathfinding across all 66 books to discover canonical bridges between Ruth and New Creation.',
        actionLabel: 'Run Path Trace',
        onLaunch: () => onTracePath('RUT.2.1', 'REV.21.1'),
      },
      {
        title: 'Inspect Logos Interlinear (John 1:1 · G3056)',
        category: "Strong's Lexicon",
        description:
          "Open John 1 in the Reader, toggle Strong's Interlinear, click Logos [G3056], and map lexical parallels straight to the Graph.",
        actionLabel: 'Open John 1:1',
        onLaunch: () => onOpenInReader('JHN', 1, 'JHN.1.1'),
      },
      {
        title: 'Explore the 66×66 Cross-Reference Matrix',
        category: 'Canon Heatmap',
        description:
          'Spot dense Old-to-New Testament corridors (Psalms, Isaiah, Romans, Hebrews) and click any book pair to inspect verses.',
        actionLabel: 'Open 66×66 Matrix',
        onLaunch: () => onOpenGraphMode('canon_matrix'),
      },
      {
        title: 'Walk the Sanctuary in 3D & Hebrews Typology',
        category: 'Sanctuary Explorer',
        description:
          'Switch between the 2D Architectural Plan and 3D Scale Model, separating Mosaic measurements from NT fulfillment.',
        actionLabel: 'Open Sanctuary',
        onLaunch: () => onOpenSanctuary('ark-covenant'),
      },
    ],
    [onTracePath, onOpenInReader, onOpenGraphMode, onOpenSanctuary]
  );

  const moduleSections: ModuleGuideSection[] = useMemo(
    () => [
      {
        id: 'graph',
        number: '01',
        title: 'Bible Graph, 3D Canon Views & 66×66 Matrix',
        subtitle:
          'Move seamlessly from verse-level curated scholarship to 344,753 community-ranked TSK links across all 66 books.',
        icon: Network,
        coreSteps: [
          {
            heading: 'Start with Ego 2D + Depth & Epistemic Filters',
            detail:
              'Click any verse node to open the Context Inspector on the right. Use the Depth selector (1–4 hops) and Focus Mode to isolate immediate citations, and filter by Direct Quotation, Allusion, Prophecy Fulfillment, Typology, or Linguistic edges.',
          },
          {
            heading: 'Separate Explicit Text from Interpretation',
            detail:
              'Toggle All Evidence vs. Explicit Biblical vs. Scholarly Interpretive. Solid lines mark verified direct quotations and historical links; dashed/dotted lines mark thematic or typological synthesis.',
          },
          {
            heading: 'Bridge Any Verse via Tier-2 TSK Expansion',
            detail:
              'Curated anchors hold deep scholarly notes, while the Context Inspector lists ranked Treasury of Scripture Knowledge (TSK) parallels for every one of the 31,102 verses. Click "+ Expand into Graph" on any TSK neighbor to grow your canvas dynamically.',
          },
          {
            heading: 'Switch Perspective: Canon Arc (3D), Canon Ring (3D), & Matrix (66×66)',
            detail:
              'Use the top-left mode bar inside Bible Graph. Canon Arc (3D) reveals OT→NT arcs across canonical time; Canon Ring (3D) maps book-to-book resonance chords; Matrix (66×66) shows exact cross-reference density between any two books.',
          },
          {
            heading: 'Author Custom Edges & Export High-Res PNG',
            detail:
              'Click "+ Edge" on the toolbar to link any two verses with your own study note and epistemic tag. Click the camera icon ("PNG") to save a publication-ready snapshot of your current graph.',
          },
        ],
        proTips: [
          'Use "Trace Path" with scope set to "Full Bible TSK (66 Books)" to connect passages outside curated anchors, such as Ruth to Revelation.',
          'Hold Shift or use the layout switcher (Force, Concentric, Hierarchy, Circle) to reorganize crowded multi-book studies.',
          'Click "Save View" to bookmark exact visible nodes, layout, and active relationship filters into Study Collections.',
        ],
        launchers: [
          {
            label: 'Isaiah 53 Ego Graph',
            detail: 'Prophecy & NT quotation cluster',
            onLaunch: () => onOpenInGraph('ISA.53.5'),
          },
          {
            label: 'Canon Arc (3D)',
            detail: 'OT → NT cross-canonical skyline',
            onLaunch: () => onOpenGraphMode('canon_arc'),
          },
          {
            label: 'Canon Ring (3D)',
            detail: 'Circular 66-book chord ring',
            onLaunch: () => onOpenGraphMode('canon_ring'),
          },
          {
            label: '66×66 Matrix',
            detail: 'Book-pair cross-reference heatmap',
            onLaunch: () => onOpenGraphMode('canon_matrix'),
          },
        ],
      },
      {
        id: 'reader',
        number: '02',
        title: "66-Book Bible Reader, Parallel Versions & Strong's Interlinear",
        subtitle:
          "Read the entire canon offline across KJV, ASV, and Young's Literal Translation with clickable Hebrew and Greek roots.",
        icon: BookOpen,
        coreSteps: [
          {
            heading: 'Switch Translations or Compare Side-by-Side',
            detail:
              'Toggle between 1769 KJV, 1901 ASV, and 1898 YLT directly in the Reader header, or turn on Parallel Mode to compare literal tense/syntax differences verse by verse.',
          },
          {
            heading: "Enable Strong's Interlinear Tags Inline",
            detail:
              'Click the "Strong\'s Interlinear" toggle in the Reader toolbar (or in the Contextual Inspector for any verse). Every tagged English word displays its Hebrew (H) or Greek (G) Strong\'s number.',
          },
          {
            heading: 'Inspect Definitions, KJV Renderings & Reverse Concordance',
            detail:
              "Click any Strong's tag to open the Lexicon Inspector with original script, transliteration, phonetic guide, root derivation, and every canonical verse sharing that root.",
          },
          {
            heading: 'Map Lexical Parallels Straight to the Graph',
            detail:
              'Inside the Strong\'s Lexicon Inspector, click "Map Lexical Edges" to inject shared-lemma verses around your current passage in the Ego 2D Graph as Linguistic connections.',
          },
          {
            heading: 'Annotate & Track Chapter Reading Progress',
            detail:
              'Select any verse to apply color highlights (Gold, Teal, Rose, Indigo), write personal study notes, add to a Collection, or click "Mark Chapter Read" to advance the 1,189-chapter progress meter.',
          },
        ],
        proTips: [
          'Press "/" anywhere outside an input field to focus TopBar search—typing 3+ characters scans all 31,102 verses across the entire 66-book corpus.',
          'Once a book or translation is opened, Service Worker caching stores it locally so you can keep reading completely offline.',
        ],
        launchers: [
          {
            label: 'Genesis 1:1 (Hebrew H7225)',
            detail: 'Creation vocabulary & interlinear',
            onLaunch: () => onOpenInReader('GEN', 1, 'GEN.1.1'),
          },
          {
            label: 'Romans 3:24 (Redemption)',
            detail: 'Dense NT Pauline cross-links',
            onLaunch: () => onOpenInReader('ROM', 3, 'ROM.3.24'),
          },
          {
            label: 'Psalm 23 (Parallel KJV/YLT)',
            detail: 'Compare poetic phrasing side-by-side',
            onLaunch: () => onOpenInReader('PSA', 23, 'PSA.23.1'),
          },
        ],
      },
      {
        id: 'themes_timeline',
        number: '03',
        title: 'Thematic Explorer & Chronological Swimlane Timeline',
        subtitle:
          'Follow major theological arcs across progressive revelation and inspect redemptive history on a zoomable timeline.',
        icon: History,
        coreSteps: [
          {
            heading: 'Trace Multi-Stage Themes Across Canon Periods',
            detail:
              'Open Themes to study curated arcs (such as Covenant, Lamb & Sacrifice, Kingdom, New Creation) organized sequentially from Pentateuch through Prophets, Gospels, Epistles, and Apocalypse.',
          },
          {
            heading: 'Send Entire Themes to the Graph',
            detail:
              'Use "Load Theme Cluster in Graph" on any theme or stage to visualize how every passage in that theological trajectory connects cross-canonically.',
          },
          {
            heading: 'Navigate the Zoomable Chronological Swimlane',
            detail:
              'Inside Biblical Timeline, adjust the zoom scale (1x–3x) to pan across Creation, Patriarchs, Exodus, Monarchy, Exile, Gospels, and Apostolic eras, or filter by era.',
          },
          {
            heading: 'Cross-Link Events to Map, Sanctuary & Themes',
            detail:
              'Selecting any historical event automatically surfaces its linked geographical sites, journeys, Sanctuary typology, and anchor Scripture passages with one-click deep links.',
          },
        ],
        proTips: [
          'Combine Themes with 3D Canon Arc to verify how Old Testament foundational passages cluster into New Testament fulfillment corridors.',
        ],
        launchers: [
          {
            label: 'Open Thematic Explorer',
            detail: 'Covenant, Sacrifice & Kingdom arcs',
            onLaunch: () => onOpenTheme('covenant'),
          },
          {
            label: 'Open Chronological Timeline',
            detail: 'Zoomable swimlane across redemptive history',
            onLaunch: () => onOpenTimeline('evt-exodus'),
          },
        ],
      },
      {
        id: 'geo_sanctuary',
        number: '04',
        title: 'Biblical Geography & Interactive 2D/3D Sanctuary Explorer',
        subtitle:
          'Anchor Scripture in real terrain with transparent coordinate certainty, and inspect the Tabernacle in 2D architectural plan or 3D.',
        icon: Compass,
        coreSteps: [
          {
            heading: 'Filter Geography by Biblical Period & Feature Type',
            detail:
              'Filter map pins across Cities, Regions, Rivers, and Mountains by historical period (Patriarchal through Apostolic), or click any location to read associated Scripture passages and historical names.',
          },
          {
            heading: 'Follow Journeys of Israel, Jesus & Paul',
            detail:
              'Select a route overlay (such as the Exodus & Wilderness Wanderings or Paul’s Missionary Journeys) to step sequentially through numbered waypoints with Scripture citations.',
          },
          {
            heading: 'Respect Transparent Coordinate Certainty',
            detail:
              'Every site explicitly distinguishes between Established archaeology, Probable identification, and Traditional/Approximate sites (e.g. Mt. Sinai) with uncertainty notes—never fabricating false precision.',
          },
          {
            heading: 'Toggle 2D Architectural Floor Plan & 3D Tabernacle Model',
            detail:
              'In Sanctuary Explorer, inspect each station from the Outer Court Gate to the Ark of the Covenant. Read literal Mosaic descriptions separately from typological/Hebrews connections, or orbit the 3D scale model.',
          },
        ],
        proTips: [
          'Click any Sanctuary furnishing in 3D or on the 2D plan to highlight its exact cubit dimensions, materials, OT textual basis, and NT fulfillment verses.',
        ],
        launchers: [
          {
            label: 'Explore Exodus Route',
            detail: 'Goshen → Red Sea → Sinai → Canaan',
            onLaunch: () => onOpenJourney('jrn-exodus'),
          },
          {
            label: 'Inspect Jerusalem Sites',
            detail: 'Geography details & passages',
            onLaunch: () => onOpenLocation('loc-jerusalem'),
          },
          {
            label: 'Enter 2D/3D Sanctuary',
            detail: 'Altar, Laver, Menorah & Ark',
            onLaunch: () => onOpenSanctuary('courtyard'),
          },
        ],
      },
    ],
    [
      onOpenInGraph,
      onOpenGraphMode,
      onOpenInReader,
      onOpenTheme,
      onOpenTimeline,
      onOpenJourney,
      onOpenLocation,
      onOpenSanctuary,
    ]
  );

  const playbooks = useMemo(
    () => [
      {
        title: 'Playbook A · Original-Language Word Study to Graph',
        audience: 'Exegesis & Sermon Prep',
        steps: [
          'Open Romans 3:24 (or John 1:1) in Explore Scripture and enable Strong’s Interlinear.',
          'Click a key theological root (such as G629 redemption or G3056 logos) to inspect its definition and reverse concordance.',
          'Click "Map Lexical Edges" to launch those shared-word verses into the 2D Bible Graph.',
          'Save the resulting network under a Study Collection or export as PNG.',
        ],
        ctaLabel: 'Start at Romans 3:24',
        onLaunch: () => onOpenInReader('ROM', 3, 'ROM.3.24'),
      },
      {
        title: 'Playbook B · Tracing Old-to-New Testament Prophecy',
        audience: 'Cross-Canonical Synthesis',
        steps: [
          'Open the 66×66 Matrix in Bible Graph and click a dense OT→NT cell (such as Isaiah × Matthew or Psalms × Hebrews).',
          'Or enter "Trace Path" with Full Bible TSK (66 Books) active between Genesis 3:15 and Revelation 12:9.',
          'Toggle "Explicit Biblical" vs. "Scholarly Interpretive" to distinguish direct NT citations from thematic echoes.',
          'Add your own Personal Study Edge ("+ Edge") with supporting evidence notes.',
        ],
        ctaLabel: 'Trace Gen 3:15 → Rev 12:9',
        onLaunch: () => onTracePath('GEN.3.15', 'REV.12.9'),
      },
      {
        title: 'Playbook C · Multi-Device Sync & Collaborative Study Sharing',
        audience: 'Small Groups & Teaching',
        steps: [
          'Sign in with Google from the Top Bar or Study Collections tab to enable automatic Firestore cloud sync.',
          'Curate verses, notes, and saved graphs into a named Study Collection.',
          'Click "Share Public Link" on any collection to generate a read-only ?shared=... URL for students or study partners.',
          'Download JSON backups for lossless archival or Markdown outlines for teaching handouts.',
        ],
        ctaLabel: 'Open Study Collections',
        onLaunch: onOpenCollections,
      },
    ],
    [onOpenInReader, onTracePath, onOpenCollections]
  );

  const query = filterText.trim().toLowerCase();

  const visibleModules = useMemo(() => {
    const byTab =
      focus === 'all'
        ? moduleSections
        : focus === 'sync_shortcuts'
        ? []
        : moduleSections.filter((m) => m.id === focus);
    if (!query) return byTab;
    return byTab.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.subtitle.toLowerCase().includes(query) ||
        m.coreSteps.some(
          (s) =>
            s.heading.toLowerCase().includes(query) ||
            s.detail.toLowerCase().includes(query)
        ) ||
        m.proTips.some((t) => t.toLowerCase().includes(query))
    );
  }, [focus, moduleSections, query]);

  const showSyncAndShortcuts =
    focus === 'all' ||
    focus === 'sync_shortcuts' ||
    (query.length > 0 &&
      ('sync firebase google share export json markdown shortcut keyboard command palette offline pwa dark light'.includes(
        query
      ) ||
        playbooks.some(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.steps.some((s) => s.toLowerCase().includes(query))
        )));

  const focusTabs: { id: GuideFocus; label: string }[] = [
    { id: 'all', label: 'All Modules' },
    { id: 'graph', label: 'Bible Graph & Matrix' },
    { id: 'reader', label: "Reader & Strong's" },
    { id: 'themes_timeline', label: 'Themes & Timeline' },
    { id: 'geo_sanctuary', label: 'Geography & Sanctuary' },
    { id: 'sync_shortcuts', label: 'Cloud Sync & Shortcuts' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--atlas-bg)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-10">
        {/* Editorial Hero Header */}
        <header className="border-b border-[var(--atlas-border)] pb-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="text-xs font-medium text-[var(--atlas-accent)] tracking-wide">
                Field Manual · Complete Research Guide
              </div>
              <h2 className="font-scripture text-2xl sm:text-3xl font-semibold text-[var(--atlas-heading)] leading-tight text-balance">
                How to Use Scripture Atlas to Its Fullest Potential
              </h2>
              <p className="text-sm sm:text-[15px] text-[var(--atlas-text-secondary)] leading-relaxed max-w-2xl">
                Scripture Atlas connects all{' '}
                <span className="font-mono tabular-nums text-[var(--atlas-heading)]">
                  {summary.totalCanonicalBooks}
                </span>{' '}
                books and{' '}
                <span className="font-mono tabular-nums text-[var(--atlas-heading)]">
                  {summary.totalFullKjvVerses.toLocaleString()}
                </span>{' '}
                verses across cross-reference networks, Hebrew and Greek Strong’s interlinear
                roots, redemptive chronology, historical geography, and a 2D/3D Tabernacle study
                environment. Launch any workflow directly from this guide.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] hover:bg-[var(--atlas-accent-hover)] transition-colors whitespace-nowrap"
              >
                <Command className="w-3.5 h-3.5" />
                <span>Open Command Palette (⌘K)</span>
              </button>
            </div>
          </div>

          {/* 4-column summary baseline strip (clean unboxed metrics separated by hairlines) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[var(--atlas-border)]">
            <div className="space-y-0.5">
              <div className="text-xs text-[var(--atlas-text-muted)]">Offline Scripture Corpus</div>
              <div className="text-base font-semibold font-mono tabular-nums text-[var(--atlas-heading)]">
                31,102 verses × 3
              </div>
              <div className="text-xs text-[var(--atlas-text-subtle)]">KJV · ASV · YLT</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs text-[var(--atlas-text-muted)]">Cross-Reference Graph</div>
              <div className="text-base font-semibold font-mono tabular-nums text-[var(--atlas-heading)]">
                {summary.crossReferenceCount} + 344,753
              </div>
              <div className="text-xs text-[var(--atlas-text-subtle)]">
                Curated + OpenBible TSK
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs text-[var(--atlas-text-muted)]">Original Language Roots</div>
              <div className="text-base font-semibold font-mono tabular-nums text-[var(--atlas-heading)]">
                13,654 Strong&apos;s
              </div>
              <div className="text-xs text-[var(--atlas-text-subtle)]">
                Hebrew &amp; Greek Reverse Concordance
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs text-[var(--atlas-text-muted)]">Spatial &amp; Study Layers</div>
              <div className="text-base font-semibold font-mono tabular-nums text-[var(--atlas-heading)]">
                2D / 3D / Sync
              </div>
              <div className="text-xs text-[var(--atlas-text-subtle)]">
                Map · Sanctuary · Cloud Share
              </div>
            </div>
          </div>
        </header>

        {/* Quick-Start Live Launchers */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="font-scripture text-lg font-semibold text-[var(--atlas-heading)]">
                Interactive Quick-Start Recipes
              </h3>
              <p className="text-xs text-[var(--atlas-text-muted)] mt-0.5">
                Click any recipe below to jump straight into a real study workflow in the app.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickRecipes.map((recipe) => (
              <div
                key={recipe.title}
                className="p-5 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)] flex flex-col justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="text-xs text-[var(--atlas-text-muted)]">
                    <span>{recipe.category}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="text-[var(--atlas-secondary)]">Live Demo</span>
                  </div>
                  <h4 className="text-[15px] font-semibold text-[var(--atlas-heading)]">
                    {recipe.title}
                  </h4>
                  <p className="text-xs sm:text-[13px] text-[var(--atlas-text-secondary)] leading-relaxed">
                    {recipe.description}
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={recipe.onLaunch}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap"
                  >
                    <span>{recipe.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter Bar: Focus Tabs + Guide Search */}
        <section className="space-y-6 pt-2 border-t border-[var(--atlas-border)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div
              className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)]"
              role="tablist"
              aria-label="Filter guide modules"
            >
              {focusTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={focus === tab.id}
                  onClick={() => setFocus(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    focus === tab.id
                      ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/35'
                      : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="w-3.5 h-3.5 text-[var(--atlas-text-subtle)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter guide (e.g. PNG, Strong's, TSK)..."
                aria-label="Filter guide content"
                className="w-full h-9 pl-8 pr-3 bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] rounded-md text-xs text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)]"
              />
            </div>
          </div>

          {/* Module Deep Dives */}
          {visibleModules.length === 0 && !showSyncAndShortcuts ? (
            <div className="p-8 text-center rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2">
              <p className="text-sm text-[var(--atlas-text-muted)]">
                No guide topics matched &ldquo;{filterText}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterText('');
                  setFocus('all');
                }}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--atlas-elevated)] text-[var(--atlas-text)] border border-[var(--atlas-border-strong)]"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {visibleModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <article
                    key={mod.id}
                    className="p-6 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--atlas-border)]">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-[var(--atlas-accent)] font-mono tabular-nums">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>Module {mod.number}</span>
                        </div>
                        <h3 className="font-scripture text-xl font-semibold text-[var(--atlas-heading)]">
                          {mod.number}. {mod.title}
                        </h3>
                        <p className="text-xs sm:text-[13.5px] text-[var(--atlas-text-secondary)] leading-relaxed max-w-3xl">
                          {mod.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left column: Step-by-step capabilities */}
                      <div className="lg:col-span-8 space-y-4">
                        {mod.coreSteps.map((step, idx) => (
                          <div key={step.heading} className="space-y-1">
                            <h4 className="text-sm font-semibold text-[var(--atlas-heading)]">
                              <span className="font-mono tabular-nums text-[var(--atlas-accent)] mr-2">
                                {String(idx + 1).padStart(2, '0')}.
                              </span>
                              {step.heading}
                            </h4>
                            <p className="text-xs sm:text-[13px] text-[var(--atlas-text-secondary)] leading-relaxed">
                              {step.detail}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Right column: Pro tips + Live Action Launchers (separated by whitespace & hairlines, no nested bordered card clutter) */}
                      <div className="lg:col-span-4 lg:border-l lg:border-[var(--atlas-border)] lg:pl-6 space-y-5">
                        <div className="space-y-2.5">
                          <div className="text-xs font-semibold text-[var(--atlas-heading)]">
                            Scholar &amp; Power-User Tips
                          </div>
                          <ul className="space-y-2 text-xs text-[var(--atlas-text-muted)] leading-relaxed list-disc pl-4">
                            {mod.proTips.map((tip) => (
                              <li key={tip}>{tip}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-4 border-t border-[var(--atlas-border)] space-y-2">
                          <div className="text-xs font-semibold text-[var(--atlas-heading)]">
                            Open in Workspace
                          </div>
                          <div className="space-y-2">
                            {mod.launchers.map((l) => (
                              <button
                                key={l.label}
                                type="button"
                                onClick={l.onLaunch}
                                className="w-full px-3 py-2 rounded-md bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border)] flex items-center justify-between gap-3 text-left transition-colors"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-[var(--atlas-accent-soft)] truncate">
                                    {l.label}
                                  </div>
                                  <div className="text-[11px] text-[var(--atlas-text-muted)] truncate">
                                    {l.detail}
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-[var(--atlas-accent)] shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* End-to-End Research Playbooks + Sync & Shortcuts */}
        {showSyncAndShortcuts && (
          <>
            <section className="space-y-4 pt-4 border-t border-[var(--atlas-border)]">
              <div className="space-y-1">
                <h3 className="font-scripture text-lg font-semibold text-[var(--atlas-heading)]">
                  End-to-End Study Playbooks
                </h3>
                <p className="text-xs text-[var(--atlas-text-muted)]">
                  How the modules fit together for sermon preparation, word studies, and teaching.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {playbooks.map((pb) => (
                  <div
                    key={pb.title}
                    className="p-5 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)] flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="text-xs text-[var(--atlas-secondary)]">{pb.audience}</div>
                        <h4 className="text-sm font-semibold text-[var(--atlas-heading)] leading-snug">
                          {pb.title}
                        </h4>
                      </div>
                      <ol className="space-y-2 text-xs text-[var(--atlas-text-secondary)] leading-relaxed list-decimal pl-4">
                        {pb.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <button
                      type="button"
                      onClick={pb.onLaunch}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-heading)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap"
                    >
                      <span>{pb.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Cloud Sync, Public Sharing & Keyboard Shortcuts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[var(--atlas-border)]">
              <div className="p-5 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-4">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[var(--atlas-secondary)]" />
                  <h3 className="font-scripture text-base font-semibold text-[var(--atlas-heading)]">
                    Cloud Sync, Sharing &amp; Offline Architecture
                  </h3>
                </div>

                <div className="divide-y divide-[var(--atlas-border)] text-xs">
                  <div className="py-2.5 flex items-start gap-3">
                    <Cloud className="w-4 h-4 text-[var(--atlas-secondary)] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[var(--atlas-heading)]">
                        Google Sign-In &amp; Automatic Firestore Sync
                      </div>
                      <p className="text-[var(--atlas-text-secondary)] leading-relaxed">
                        Sign in from the Top Bar or Study Collections to mirror bookmarks,
                        highlights, notes, chapter progress, custom edges, and saved graphs across
                        browsers in real time.
                      </p>
                    </div>
                  </div>

                  <div className="py-2.5 flex items-start gap-3">
                    <Share2 className="w-4 h-4 text-[var(--atlas-accent)] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[var(--atlas-heading)]">
                        Deep Links &amp; Public Collection Sharing
                      </div>
                      <p className="text-[var(--atlas-text-secondary)] leading-relaxed">
                        Use <span className="font-medium text-[var(--atlas-heading)]">Share</span>{' '}
                        in the Top Bar to copy a direct link to any verse, path, map site, or
                        Sanctuary element, or publish a collection to generate a read-only{' '}
                        <span className="font-mono">?shared=</span> URL.
                      </p>
                    </div>
                  </div>

                  <div className="py-2.5 flex items-start gap-3">
                    <FolderKanban className="w-4 h-4 text-[var(--atlas-accent)] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[var(--atlas-heading)]">
                        Lossless JSON &amp; Markdown Exports + Installable PWA
                      </div>
                      <p className="text-[var(--atlas-text-secondary)] leading-relaxed">
                        Export notes and verses as Markdown handouts or full JSON backups. Install
                        Scripture Atlas as a desktop or mobile app from the sidebar to keep studying
                        offline.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-[var(--atlas-accent)]" />
                  <h3 className="font-scripture text-base font-semibold text-[var(--atlas-heading)]">
                    Keyboard Shortcuts &amp; Navigation Reference
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--atlas-border)] text-[var(--atlas-text-muted)]">
                        <th className="py-2 pr-3 font-medium">Shortcut / Control</th>
                        <th className="py-2 font-medium">Action in Workspace</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--atlas-border)] text-[var(--atlas-text-secondary)]">
                      <tr>
                        <td className="py-2.5 pr-3 font-mono tabular-nums text-[var(--atlas-heading)] whitespace-nowrap">
                          Cmd / Ctrl + K
                        </td>
                        <td className="py-2.5">
                          Open the Command Palette to jump to any verse, 3D view, 66×66 Matrix,
                          theme, location, or Sanctuary station.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-3 font-mono tabular-nums text-[var(--atlas-heading)] whitespace-nowrap">
                          /
                        </td>
                        <td className="py-2.5">
                          Focus Global Search across all 31,102 verses, books, themes, and places.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-3 font-mono tabular-nums text-[var(--atlas-heading)] whitespace-nowrap">
                          ↑ / ↓ / Enter / Esc
                        </td>
                        <td className="py-2.5">
                          Navigate and execute items inside the Command Palette without touching the
                          mouse.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-3 font-mono tabular-nums text-[var(--atlas-heading)] whitespace-nowrap">
                          Vellum / Obsidian
                        </td>
                        <td className="py-2.5">
                          Switch Light Parchment and Dark Obsidian themes in the sidebar (syncs
                          typography, map tiles, 2D graph, and 3D lighting).
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenInGraph('JHN.3.16')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-text)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap"
                  >
                    <GitFork className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                    <span>Bible Graph</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenGraphMode('canon_matrix')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-text)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap"
                  >
                    <Grid3X3 className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                    <span>66×66 Matrix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenInReader('JHN', 1, 'JHN.1.1')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-text)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap"
                  >
                    <Languages className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                    <span>Strong&apos;s Reader</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenSanctuary('ark-covenant')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-text)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap"
                  >
                    <Landmark className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                    <span>Sanctuary 3D</span>
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
