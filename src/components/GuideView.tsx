import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Cloud,
  Command,
  Compass,
  Download,
  FileText,
  FolderKanban,
  GitFork,
  Grid3X3,
  History,
  Keyboard,
  Landmark,
  Languages,
  Layers,
  Network,
  Search,
  Share2,
  X,
} from 'lucide-react';
import {
  FUNDAMENTAL_BELIEF_SECTIONS,
  FUNDAMENTAL_BELIEFS_META,
  FundamentalBeliefChapter,
} from '../data/fundamentalBeliefs';
import {
  formatReferenceFromId,
  getDatasetSummary,
  getVerseById,
  resolveVerseAsync,
} from '../services/scriptureService';
import { GraphViewMode, VerseId } from '../types/scripture';

export type GuideWorkspaceTab = 'beliefs' | 'manual';

interface GuideViewProps {
  initialTab?: GuideWorkspaceTab;
  initialBeliefId?: string;
  onOpenInGraph: (verseId: VerseId) => void;
  onLoadVersesInGraph: (verseIds: VerseId[], anchorId: VerseId) => void;
  onOpenGraphMode: (mode: GraphViewMode, anchorVerseId?: VerseId) => void;
  onTracePath: (sourceId: VerseId, targetId: VerseId) => void;
  onOpenInReader: (bookId: string, chapter: number, verseId?: VerseId) => void;
  onOpenTheme: (themeId: string) => void;
  onOpenTimeline: (eventId?: string) => void;
  onOpenLocation: (locationId: string) => void;
  onOpenJourney: (journeyId: string) => void;
  onOpenSanctuary: (sanctuaryId: string) => void;
  onOpenCollections: () => void;
  onCreateCollection: (title: string, description: string, initialVerseIds?: VerseId[]) => void;
  onOpenCommandPalette: () => void;
}

type GuideFocus =
  | 'all'
  | 'graph'
  | 'reader'
  | 'themes_timeline'
  | 'geo_sanctuary'
  | 'sync_shortcuts';

type BeliefCategoryFilter = 'All' | FundamentalBeliefChapter['category'];

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

const BELIEFS_PROGRESS_STORAGE_KEY = 'atlas-beliefs-progress-v1';

function loadStudiedBeliefIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BELIEFS_PROGRESS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function parseBookAndChapter(verseId: VerseId): { bookId: string; chapter: number } {
  const parts = verseId.split('.');
  return {
    bookId: parts[0] || 'GEN',
    chapter: Math.max(1, parseInt(parts[1] || '1', 10) || 1),
  };
}

export const GuideView: React.FC<GuideViewProps> = ({
  initialTab = 'beliefs',
  initialBeliefId,
  onOpenInGraph,
  onLoadVersesInGraph,
  onOpenGraphMode,
  onTracePath,
  onOpenInReader,
  onOpenTheme,
  onOpenTimeline,
  onOpenLocation,
  onOpenJourney,
  onOpenSanctuary,
  onOpenCollections,
  onCreateCollection,
  onOpenCommandPalette,
}) => {
  const [workspaceTab, setWorkspaceTab] = useState<GuideWorkspaceTab>(initialTab);
  const [selectedBeliefId, setSelectedBeliefId] = useState<string>(
    initialBeliefId ?? 'ch-1'
  );
  const [beliefSearch, setBeliefSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BeliefCategoryFilter>('All');
  const [studiedIds, setStudiedIds] = useState<string[]>(() => loadStudiedBeliefIds());
  const [resolvedTexts, setResolvedTexts] = useState<Record<string, string>>({});
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const [focus, setFocus] = useState<GuideFocus>('all');
  const [filterText, setFilterText] = useState('');
  const summary = useMemo(() => getDatasetSummary(), []);

  useEffect(() => {
    setWorkspaceTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialBeliefId) {
      setSelectedBeliefId(initialBeliefId);
      setWorkspaceTab('beliefs');
    }
  }, [initialBeliefId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(BELIEFS_PROGRESS_STORAGE_KEY, JSON.stringify(studiedIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [studiedIds]);

  const activeChapter = useMemo(
    () =>
      FUNDAMENTAL_BELIEF_SECTIONS.find((c) => c.id === selectedBeliefId) ??
      FUNDAMENTAL_BELIEF_SECTIONS[1] ??
      FUNDAMENTAL_BELIEF_SECTIONS[0],
    [selectedBeliefId]
  );

  // Hydrate KJV verse previews for every verse in the currently viewed study chapter
  useEffect(() => {
    let active = true;
    const allIds = Array.from(
      new Set([
        ...activeChapter.keyVerseIds,
        ...activeChapter.subsections.flatMap((s) => s.verseIds),
      ])
    );

    const immediate: Record<string, string> = {};
    const toFetch: string[] = [];
    for (const vId of allIds) {
      const local = getVerseById(vId);
      if (local) {
        immediate[vId] = local.text;
      } else if (!resolvedTexts[vId]) {
        toFetch.push(vId);
      }
    }

    if (Object.keys(immediate).length > 0) {
      setResolvedTexts((prev) => ({ ...prev, ...immediate }));
    }

    if (toFetch.length > 0) {
      void Promise.all(
        toFetch.map(async (vId) => {
          const v = await resolveVerseAsync(vId).catch(() => undefined);
          return v ? [vId, v.text] : null;
        })
      ).then((entries) => {
        if (!active) return;
        const updates: Record<string, string> = {};
        for (const pair of entries) {
          if (pair) updates[pair[0]] = pair[1];
        }
        if (Object.keys(updates).length > 0) {
          setResolvedTexts((prev) => ({ ...prev, ...updates }));
        }
      });
    }

    return () => {
      active = false;
    };
  }, [activeChapter, resolvedTexts]);

  const toggleStudied = (id: string) => {
    setStudiedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const chapterOnlyList = useMemo(
    () => FUNDAMENTAL_BELIEF_SECTIONS.filter((s) => s.kind === 'chapter'),
    []
  );
  const studiedChaptersCount = useMemo(
    () => chapterOnlyList.filter((c) => studiedIds.includes(c.id)).length,
    [chapterOnlyList, studiedIds]
  );

  const filteredBeliefSections = useMemo(() => {
    const q = beliefSearch.trim().toLowerCase();
    return FUNDAMENTAL_BELIEF_SECTIONS.filter((sec) => {
      if (categoryFilter !== 'All' && sec.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        sec.title.toLowerCase().includes(q) ||
        sec.numeral.toLowerCase().includes(q) ||
        sec.biblicalSummary.toLowerCase().includes(q) ||
        sec.doctrinalNotes.toLowerCase().includes(q) ||
        sec.keyVerseIds.some((v) =>
          formatReferenceFromId(v).toLowerCase().includes(q)
        )
      );
    });
  }, [beliefSearch, categoryFilter]);

  const currentIndex = FUNDAMENTAL_BELIEF_SECTIONS.findIndex(
    (s) => s.id === activeChapter.id
  );
  const prevChapter =
    currentIndex > 0 ? FUNDAMENTAL_BELIEF_SECTIONS[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < FUNDAMENTAL_BELIEF_SECTIONS.length - 1
      ? FUNDAMENTAL_BELIEF_SECTIONS[currentIndex + 1]
      : null;

  const handleSaveChapterCollection = (chapter: FundamentalBeliefChapter) => {
    const label =
      chapter.kind === 'chapter'
        ? `Belief ${chapter.numeral}: ${chapter.title}`
        : `${chapter.numeral}: ${chapter.title}`;
    onCreateCollection(
      label,
      `Study Guide (${chapter.pageRange}) · ${chapter.biblicalSummary}`,
      chapter.keyVerseIds
    );
    setSavedNoticeId(chapter.id);
    window.setTimeout(() => {
      setSavedNoticeId((curr) => (curr === chapter.id ? null : curr));
    }, 2400);
  };

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
        onLaunch: () => onOpenSanctuary('sanc-ark-covenant'),
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
            onLaunch: () => onOpenTheme('theme-covenant'),
          },
          {
            label: 'Open Chronological Timeline',
            detail: 'Zoomable swimlane across redemptive history',
            onLaunch: () => onOpenTimeline('evt-exodus-sinai'),
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
            onLaunch: () => onOpenSanctuary('sanc-courtyard'),
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

  const beliefCategories: BeliefCategoryFilter[] = [
    'All',
    'Foundations',
    'Law & Sabbath',
    'Origins & Redemption',
    'Church & Ordinances',
    'Sanctuary & Prophecy',
    'Christian Living',
    'Last Things',
  ];

  const primaryVerse = activeChapter.keyVerseIds[0] ?? 'JHN.3.16';
  const primaryLoc = parseBookAndChapter(primaryVerse);
  const isChapterStudied = studiedIds.includes(activeChapter.id);
  const progressPct = Math.round((studiedChaptersCount / 25) * 100);

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--atlas-bg)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 space-y-6">
        {/* Top Mode Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--atlas-border)]">
          <div className="space-y-1">
            <div className="text-xs font-medium text-[var(--atlas-accent)] tracking-wide">
              Study Guide &amp; App Field Manual
            </div>
            <h2 className="font-scripture text-2xl sm:text-[26px] font-semibold text-[var(--atlas-heading)] leading-tight">
              {workspaceTab === 'beliefs'
                ? 'Fundamental Christian Beliefs — Interactive Study Guide'
                : 'How to Use Scripture Atlas to Its Fullest Potential'}
            </h2>
          </div>

          <div
            className="inline-flex items-center p-1 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)] self-start sm:self-auto"
            role="tablist"
            aria-label="Study guide mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={workspaceTab === 'beliefs'}
              onClick={() => setWorkspaceTab('beliefs')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                workspaceTab === 'beliefs'
                  ? 'bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)]'
                  : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
              }`}
            >
              25 Fundamental Beliefs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspaceTab === 'manual'}
              onClick={() => setWorkspaceTab('manual')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                workspaceTab === 'manual'
                  ? 'bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)]'
                  : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
              }`}
            >
              App Field Manual
            </button>
          </div>
        </div>

        {/* WORKSPACE TAB 1: 25 FUNDAMENTAL CHRISTIAN BELIEFS STUDY GUIDE */}
        {workspaceTab === 'beliefs' && (
          <div className="space-y-6">
            {/* Source Header, Progress & PDF Controls */}
            <div className="p-5 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-3xl">
                <div className="text-xs text-[var(--atlas-text-muted)]">
                  <span>{FUNDAMENTAL_BELIEFS_META.publisher}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono tabular-nums">
                    {FUNDAMENTAL_BELIEFS_META.publicationYear}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span>{FUNDAMENTAL_BELIEFS_META.translationUsed}</span>
                </div>
                <p className="text-xs sm:text-[13px] text-[var(--atlas-text-secondary)] leading-relaxed">
                  Study all 25 chapters (plus Preface &amp; Conclusion) side-by-side with live
                  KJV Scripture verses, interactive Bible Graph clusters, and cross-linked atlas
                  modules. Biblical texts are kept cleanly distinct from doctrinal commentary.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="min-w-[175px] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--atlas-text-muted)]">Study Progress</span>
                    <span className="font-mono tabular-nums font-semibold text-[var(--atlas-secondary)]">
                      {studiedChaptersCount} / 25
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--atlas-bg)] border border-[var(--atlas-border)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--atlas-secondary)] transition-all duration-300"
                      style={{ width: `${Math.max(progressPct, studiedChaptersCount > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPdfModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Original PDF (146 pp.)</span>
                </button>
              </div>
            </div>

            {/* Category & Search Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)]">
                {beliefCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      categoryFilter === cat
                        ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/35'
                        : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="w-3.5 h-3.5 text-[var(--atlas-text-subtle)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={beliefSearch}
                  onChange={(e) => setBeliefSearch(e.target.value)}
                  placeholder="Search topics or Scripture refs..."
                  aria-label="Search fundamental beliefs study guide"
                  className="w-full h-9 pl-8 pr-3 bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] rounded-md text-xs text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)]"
                />
              </div>
            </div>

            {/* Two-Column Study Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Navigation Rail */}
              <aside className="lg:col-span-4 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--atlas-border)] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--atlas-heading)]">
                    Table of Contents
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-[var(--atlas-text-muted)]">
                    {filteredBeliefSections.length} sections
                  </span>
                </div>

                <div className="max-h-[640px] overflow-y-auto divide-y divide-[var(--atlas-border)]">
                  {filteredBeliefSections.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--atlas-text-muted)] space-y-2">
                      <p>No study chapters matched &ldquo;{beliefSearch}&rdquo;.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setBeliefSearch('');
                          setCategoryFilter('All');
                        }}
                        className="px-3 py-1 rounded bg-[var(--atlas-elevated)] text-[var(--atlas-text)] border border-[var(--atlas-border-strong)]"
                      >
                        Reset Filter
                      </button>
                    </div>
                  ) : (
                    filteredBeliefSections.map((item) => {
                      const isSelected = item.id === activeChapter.id;
                      const isDone = studiedIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 px-3.5 py-2.5 transition-colors ${
                            isSelected
                              ? 'bg-[var(--atlas-elevated)]'
                              : 'hover:bg-[var(--atlas-elevated)]/55'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleStudied(item.id)}
                            title={isDone ? 'Mark as unstudied' : 'Mark chapter studied'}
                            aria-label={`Toggle studied status for ${item.title}`}
                            className="p-0.5 text-[var(--atlas-text-subtle)] hover:text-[var(--atlas-secondary)] shrink-0"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-[var(--atlas-secondary)]" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedBeliefId(item.id)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isSelected
                                    ? 'text-[var(--atlas-accent-soft)]'
                                    : 'text-[var(--atlas-heading)]'
                                }`}
                              >
                                <span className="font-mono tabular-nums text-[var(--atlas-accent)] mr-1.5">
                                  {item.numeral}.
                                </span>
                                {item.title}
                              </span>
                              <span className="text-[11px] font-mono tabular-nums text-[var(--atlas-text-subtle)] shrink-0">
                                {item.pageRange}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--atlas-text-muted)] mt-0.5 truncate">
                              <span>{item.category}</span>
                              <span aria-hidden="true"> · </span>
                              <span className="font-mono tabular-nums">
                                {item.keyVerseIds.length} anchor texts
                              </span>
                            </div>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>

              {/* Right Active Lesson Workspace */}
              <article className="lg:col-span-8 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border)] p-6 space-y-6">
                {/* Chapter Header */}
                <header className="space-y-4 pb-5 border-b border-[var(--atlas-border)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--atlas-accent)] font-medium">
                        <span>{activeChapter.kind === 'chapter' ? `Chapter ${activeChapter.numeral}` : activeChapter.numeral}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{activeChapter.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono tabular-nums">{activeChapter.pageRange}</span>
                      </div>
                      <h3 className="font-scripture text-2xl font-semibold text-[var(--atlas-heading)]">
                        {activeChapter.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStudied(activeChapter.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                        isChapterStudied
                          ? 'bg-[var(--atlas-secondary)]/15 text-[var(--atlas-secondary)] border-[var(--atlas-secondary)]/40'
                          : 'bg-[var(--atlas-bg)] text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-heading)] border-[var(--atlas-border-strong)]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isChapterStudied ? 'Studied' : 'Mark Studied'}</span>
                    </button>
                  </div>

                  {/* Live Workspace Launchers */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onLoadVersesInGraph(activeChapter.keyVerseIds, primaryVerse)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] hover:bg-[var(--atlas-accent-hover)] transition-colors whitespace-nowrap shrink-0"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                      <span>Study Cluster in Graph ({activeChapter.keyVerseIds.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenInReader(primaryLoc.bookId, primaryLoc.chapter, primaryVerse)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-heading)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap shrink-0"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                      <span>Read {formatReferenceFromId(primaryVerse)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveChapterCollection(activeChapter)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-heading)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap shrink-0"
                    >
                      {savedNoticeId === activeChapter.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                          <span className="text-[var(--atlas-secondary)]">Saved to Collections</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                          <span>Save to Collection</span>
                        </>
                      )}
                    </button>

                    {activeChapter.relatedSanctuaryId && (
                      <button
                        type="button"
                        onClick={() => onOpenSanctuary(activeChapter.relatedSanctuaryId!)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Landmark className="w-3.5 h-3.5" />
                        <span>Sanctuary 3D</span>
                      </button>
                    )}

                    {activeChapter.relatedThemeId && (
                      <button
                        type="button"
                        onClick={() => onOpenTheme(activeChapter.relatedThemeId!)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-secondary)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Theme Arc</span>
                      </button>
                    )}

                    {activeChapter.relatedEventId && (
                      <button
                        type="button"
                        onClick={() => onOpenTimeline(activeChapter.relatedEventId!)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-text-secondary)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap shrink-0"
                      >
                        <History className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                        <span>Timeline</span>
                      </button>
                    )}
                  </div>
                </header>

                {/* Epistemic Section 1: Direct Biblical Foundation */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--atlas-secondary)]">
                      Direct Biblical Teaching (KJV Scripture)
                    </h4>
                  </div>
                  <p className="text-sm text-[var(--atlas-text)] leading-relaxed">
                    {activeChapter.biblicalSummary}
                  </p>

                  {/* Subsections with Scriptural Breakdown */}
                  <div className="space-y-3 pt-1">
                    {activeChapter.subsections.map((sub) => (
                      <div
                        key={sub.label}
                        className="p-4 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)] space-y-2.5"
                      >
                        <div className="text-xs font-semibold text-[var(--atlas-heading)]">
                          {sub.label}
                        </div>
                        <p className="text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                          {sub.summary}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {sub.verseIds.map((vId) => {
                            const loc = parseBookAndChapter(vId);
                            return (
                              <button
                                key={vId}
                                type="button"
                                onClick={() => onOpenInReader(loc.bookId, loc.chapter, vId)}
                                title={`Open ${formatReferenceFromId(vId)} in Bible Reader`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-[var(--atlas-surface)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap"
                              >
                                <BookOpen className="w-3 h-3 text-[var(--atlas-accent)]" />
                                <span>{formatReferenceFromId(vId)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Epistemic Section 2: Doctrinal & Spirit of Prophecy Notes */}
                <section className="pt-4 border-t border-[var(--atlas-border)] space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--atlas-accent)]">
                    Doctrinal &amp; Historical Notes (Booklet Summary)
                  </h4>
                  <p className="text-xs sm:text-[13px] text-[var(--atlas-text-secondary)] leading-relaxed">
                    {activeChapter.doctrinalNotes}
                  </p>
                </section>

                {/* Live KJV Key Proof-Texts Preview */}
                <section className="pt-4 border-t border-[var(--atlas-border)] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--atlas-heading)]">
                      Key Anchor Passages ({activeChapter.keyVerseIds.length})
                    </h4>
                    <span className="text-[11px] text-[var(--atlas-text-muted)]">
                      Click any passage to read in context or inspect its Graph links
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--atlas-border)] rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-bg)]">
                    {activeChapter.keyVerseIds.map((vId) => {
                      const loc = parseBookAndChapter(vId);
                      const text = resolvedTexts[vId];
                      return (
                        <div
                          key={vId}
                          className="px-4 py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="text-xs font-semibold text-[var(--atlas-heading)]">
                              {formatReferenceFromId(vId)}
                            </div>
                            <p className="font-scripture text-[14px] text-[var(--atlas-text-secondary)] leading-relaxed">
                              {text ?? 'Loading King James Version text...'}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => onOpenInReader(loc.bookId, loc.chapter, vId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-[var(--atlas-surface)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-text-secondary)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap"
                            >
                              <BookOpen className="w-3 h-3 text-[var(--atlas-secondary)]" />
                              <span>Reader</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenInGraph(vId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-[var(--atlas-surface)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/35 transition-colors whitespace-nowrap"
                            >
                              <GitFork className="w-3 h-3 text-[var(--atlas-accent)]" />
                              <span>Graph</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Study & Reflection Questions */}
                <section className="pt-4 border-t border-[var(--atlas-border)] space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--atlas-heading)]">
                    Personal &amp; Small-Group Study Questions
                  </h4>
                  <ol className="space-y-2 text-xs sm:text-[13px] text-[var(--atlas-text-secondary)] leading-relaxed list-decimal pl-5">
                    {activeChapter.studyQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ol>
                </section>

                {/* Footer Prev / Next Chapter Bar */}
                <footer className="pt-4 border-t border-[var(--atlas-border)] flex flex-wrap items-center justify-between gap-3">
                  {prevChapter ? (
                    <button
                      type="button"
                      onClick={() => setSelectedBeliefId(prevChapter.id)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] text-[var(--atlas-text)] border border-[var(--atlas-border-strong)] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                      <span>
                        {prevChapter.numeral}. {prevChapter.title}
                      </span>
                    </button>
                  ) : (
                    <span />
                  )}

                  {nextChapter && (
                    <button
                      type="button"
                      onClick={() => setSelectedBeliefId(nextChapter.id)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-border-strong)] transition-colors ml-auto"
                    >
                      <span>
                        Next: {nextChapter.numeral}. {nextChapter.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </footer>
              </article>
            </div>
          </div>
        )}

        {/* WORKSPACE TAB 2: APP FIELD MANUAL & WORKFLOWS */}
        {workspaceTab === 'manual' && (
          <div className="space-y-10">
            {/* Editorial Hero Header */}
            <header className="border-b border-[var(--atlas-border)] pb-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm sm:text-[15px] text-[var(--atlas-text-secondary)] leading-relaxed max-w-3xl">
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

              {/* 4-column summary baseline strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[var(--atlas-border)]">
                <div className="space-y-0.5">
                  <div className="text-xs text-[var(--atlas-text-muted)]">
                    Offline Scripture Corpus
                  </div>
                  <div className="text-base font-semibold font-mono tabular-nums text-[var(--atlas-heading)]">
                    31,102 verses × 3
                  </div>
                  <div className="text-xs text-[var(--atlas-text-subtle)]">KJV · ASV · YLT</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs text-[var(--atlas-text-muted)]">
                    Cross-Reference Graph
                  </div>
                  <div className="text-base font-semibold font-mono tabular-nums text-[var(--atlas-heading)]">
                    {summary.crossReferenceCount} + 344,753
                  </div>
                  <div className="text-xs text-[var(--atlas-text-subtle)]">
                    Curated + OpenBible TSK
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs text-[var(--atlas-text-muted)]">
                    Original Language Roots
                  </div>
                  <div className="text-base font-semibold font-mono tabular-nums text-[var(--atlas-heading)]">
                    13,654 Strong&apos;s
                  </div>
                  <div className="text-xs text-[var(--atlas-text-subtle)]">
                    Hebrew &amp; Greek Reverse Concordance
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs text-[var(--atlas-text-muted)]">
                    Spatial &amp; Study Layers
                  </div>
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
              <div>
                <h3 className="font-scripture text-lg font-semibold text-[var(--atlas-heading)]">
                  Interactive Quick-Start Recipes
                </h3>
                <p className="text-xs text-[var(--atlas-text-muted)] mt-0.5">
                  Click any recipe below to jump straight into a real study workflow in the app.
                </p>
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
                      How the modules fit together for sermon preparation, word studies, and
                      teaching.
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
                            <div className="text-xs text-[var(--atlas-secondary)]">
                              {pb.audience}
                            </div>
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
                            highlights, notes, chapter progress, custom edges, and saved graphs
                            across browsers in real time.
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
                            Export notes and verses as Markdown handouts or full JSON backups.
                            Install Scripture Atlas as a desktop or mobile app from the sidebar to
                            keep studying offline.
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
                              study chapter, location, or Sanctuary station.
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 pr-3 font-mono tabular-nums text-[var(--atlas-heading)] whitespace-nowrap">
                              /
                            </td>
                            <td className="py-2.5">
                              Focus Global Search across all 31,102 verses, books, themes, and
                              places.
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 pr-3 font-mono tabular-nums text-[var(--atlas-heading)] whitespace-nowrap">
                              ↑ / ↓ / Enter / Esc
                            </td>
                            <td className="py-2.5">
                              Navigate and execute items inside the Command Palette without touching
                              the mouse.
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
                        onClick={() => onOpenSanctuary('sanc-ark-covenant')}
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
        )}
      </div>

      {/* In-App Original PDF Viewer Modal (avoids window.open inside iframe) */}
      {pdfModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[1px]"
          onClick={() => setPdfModalOpen(false)}
        >
          <div
            className="w-full max-w-5xl h-[86vh] rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Original Fundamental Christian Beliefs PDF"
          >
            <div className="px-4 py-3 border-b border-[var(--atlas-border)] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--atlas-heading)] truncate">
                  {FUNDAMENTAL_BELIEFS_META.title} ({FUNDAMENTAL_BELIEFS_META.publicationYear})
                </div>
                <div className="text-[11px] text-[var(--atlas-text-muted)] truncate">
                  {FUNDAMENTAL_BELIEFS_META.totalPages} pages ·{' '}
                  {FUNDAMENTAL_BELIEFS_META.publisher}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={FUNDAMENTAL_BELIEFS_META.pdfUrl}
                  download="Fundamental-Christian-Beliefs.pdf"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-border-strong)] transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPdfModalOpen(false)}
                  aria-label="Close PDF viewer"
                  className="p-1.5 rounded-md text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <iframe
              src={FUNDAMENTAL_BELIEFS_META.pdfUrl}
              title="Fundamental Christian Beliefs PDF"
              className="w-full flex-1 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
