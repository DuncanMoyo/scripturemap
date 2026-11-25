import React, { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape, { Core, EdgeSingular, NodeSingular } from 'cytoscape';
import {
  ArrowLeftRight,
  ArrowRight,
  BookmarkCheck,
  Box,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Crosshair,
  Eye,
  EyeOff,
  Filter,
  GitBranchPlus,
  LayoutGrid,
  Maximize2,
  Minus,
  Network,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Route,
  Save,
  Search,
  X,
} from 'lucide-react';
import {
  CONFIDENCE_META,
  EDITORIAL_STATUS_META,
  EPISTEMIC_META,
  RELATIONSHIP_METADATA,
  RELATIONSHIP_TYPES,
} from '../data/relationships';
import {
  computeHopDistancesFromAnchor,
  EpistemicFilter,
  formatReferenceFromId,
  getAllIndexedVerses,
  getConnectedPassages,
  getEdgesBetweenNodes,
  getVerseById,
  resolveVerseAsync,
  ScripturePathResult,
  searchWithinNodes,
} from '../services/scriptureService';
import {
  AtlasTheme,
  CrossReferenceEdge,
  GraphLayoutType,
  GraphViewMode,
  HighlightColor,
  RelationshipType,
  UserStudyState,
  VerseId,
} from '../types/scripture';
import { CanonAtlas3D } from './CanonAtlas3D';
import { ContextualScripturePanel } from './ContextualScripturePanel';

interface ScriptureGraphViewProps {
  atlasTheme?: AtlasTheme;
  graphViewMode: GraphViewMode;
  onChangeGraphViewMode: (mode: GraphViewMode) => void;
  anchorVerseId: VerseId;
  selectedVerseId: VerseId;
  visibleNodeIds: VerseId[];
  dynamicTskEdges?: CrossReferenceEdge[];
  depth: number;
  activeRelationships: RelationshipType[];
  epistemicFilter: EpistemicFilter;
  layout: GraphLayoutType;
  focusMode: boolean;
  showEdgeLabels: boolean;
  pathSourceId: VerseId | null;
  pathTargetId: VerseId | null;
  activePath: ScripturePathResult | null;
  onChangeDepth: (depth: number) => void;
  onSelectVerse: (verseId: VerseId) => void;
  onExpandVerse: (verseId: VerseId) => void;
  onExpandTskReference?: (sourceVerseId: VerseId, targetVerseId: VerseId) => void;
  onCollapseBranch: (verseId: VerseId) => void;
  onResetGraph: (newAnchorId?: VerseId) => void;
  onToggleRelationship: (rel: RelationshipType) => void;
  onSetAllRelationships: (enabled: boolean) => void;
  onSetRelationshipPreset: (rels: RelationshipType[]) => void;
  onChangeEpistemicFilter: (filter: EpistemicFilter) => void;
  onChangeLayout: (layout: GraphLayoutType) => void;
  onToggleFocusMode: () => void;
  onToggleEdgeLabels: () => void;
  onSetPathSource: (verseId: VerseId | null) => void;
  onSetPathTarget: (verseId: VerseId | null) => void;
  onTracePath: (sourceId: VerseId, targetId: VerseId) => void;
  onClearPath: () => void;
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
  onSaveGraphView: () => void;
}

const ANCHOR_PRESETS: { id: VerseId; label: string }[] = [
  { id: 'JHN.3.16', label: 'John 3:16 · Gospel Core' },
  { id: 'GEN.1.1', label: 'Genesis 1:1 · Creation & Logos' },
  { id: 'EXO.25.8', label: 'Exodus 25:8 · Sanctuary' },
  { id: 'ISA.53.5', label: 'Isaiah 53:5 · Suffering Servant' },
  { id: 'DAN.7.13', label: 'Daniel 7:13 · Son of Man' },
  { id: 'ROM.3.24', label: 'Romans 3:24 · Redemption' },
];

const LAYOUT_OPTIONS: { id: GraphLayoutType; label: string }[] = [
  { id: 'cose', label: 'Force-Directed' },
  { id: 'concentric', label: 'Concentric' },
  { id: 'breadthfirst', label: 'Hierarchy' },
  { id: 'circle', label: 'Circular' },
];

function getCyPalette(theme: AtlasTheme) {
  if (theme === 'light') {
    return {
      nodeBg: '#EFECE5',
      nodeDepth1Bg: '#E5E0D5',
      nodeAnchorBg: '#FAF6EE',
      nodeAnchorBorder: '#9A481E',
      nodeSelectedBg: '#FAF6EE',
      nodeSelectedBorder: '#753414',
      nodeSelectedText: '#1F1B17',
      nodeText: '#2A2520',
      nodePathBg: '#DCEEE8',
      nodePathBorder: '#1E7A65',
      nodeSearchBg: '#F4E4CE',
      nodeSearchBorder: '#B15424',
      nodeSearchText: '#753414',
      edgeLabelColor: '#4C443B',
      edgeLabelBg: '#F8F6F3',
      otBorder: '#9A481E',
      ntBorder: '#1E7A65',
      pathEdge: '#1E7A65',
      gridDot: 'rgba(45, 38, 30, 0.16)',
    };
  }
  return {
    nodeBg: '#16181C',
    nodeDepth1Bg: '#1A1D22',
    nodeAnchorBg: '#22252B',
    nodeAnchorBorder: '#D4894A',
    nodeSelectedBg: '#242830',
    nodeSelectedBorder: '#F4CFA4',
    nodeSelectedText: '#F4EFE6',
    nodeText: '#E5E0D5',
    nodePathBg: '#152520',
    nodePathBorder: '#4EC498',
    nodeSearchBg: '#2A2016',
    nodeSearchBorder: '#E5A94C',
    nodeSearchText: '#F6CA78',
    edgeLabelColor: '#C6BFB2',
    edgeLabelBg: '#0D0E10',
    otBorder: '#D4894A',
    ntBorder: '#4EC498',
    pathEdge: '#4EC498',
    gridDot: 'rgba(214, 206, 190, 0.25)',
  };
}

function buildCytoscapeStylesheet(theme: AtlasTheme): cytoscape.StylesheetStyle[] {
  const c = getCyPalette(theme);
  return [
    {
      selector: 'node',
      style: {
        'background-color': c.nodeBg,
        'border-width': 1.75,
        'border-color': 'data(borderColor)',
        label: 'data(label)',
        color: c.nodeText,
        'font-family': '"Plus Jakarta Sans", sans-serif',
        'font-size': 11,
        'font-weight': 600,
        'text-valign': 'center',
        'text-halign': 'center',
        width: 'data(nodeWidth)',
        height: 36,
        shape: 'round-rectangle',
        padding: '10px',
        'text-wrap': 'none',
        'transition-property': 'opacity, border-color, background-color, border-width',
        'transition-duration': 150,
      },
    },
    {
      selector: 'node[depth = 1]',
      style: {
        'background-color': c.nodeDepth1Bg,
        height: 38,
      },
    },
    {
      selector: 'node[?isAnchor]',
      style: {
        'background-color': c.nodeAnchorBg,
        'border-width': 2.75,
        'border-color': c.nodeAnchorBorder,
        height: 44,
        'font-size': 12,
      },
    },
    {
      selector: 'node.selected-node',
      style: {
        'background-color': c.nodeSelectedBg,
        'border-color': c.nodeSelectedBorder,
        'border-width': 3,
        color: c.nodeSelectedText,
        'z-index': 30,
      },
    },
    {
      selector: 'node.neighbor-node',
      style: {
        'border-width': 2.25,
        opacity: 1,
      },
    },
    {
      selector: 'node.path-node',
      style: {
        'background-color': c.nodePathBg,
        'border-color': c.nodePathBorder,
        'border-width': 3,
        color: c.nodeSelectedText,
        'z-index': 40,
      },
    },
    {
      selector: 'node.search-match',
      style: {
        'background-color': c.nodeSearchBg,
        'border-color': c.nodeSearchBorder,
        'border-width': 2.75,
        color: c.nodeSearchText,
        'z-index': 35,
      },
    },
    {
      selector: 'node.dimmed',
      style: {
        opacity: 0.17,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 'data(edgeWidth)',
        'line-color': 'data(color)',
        'line-style': 'solid',
        'target-arrow-color': 'data(color)',
        'source-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'source-arrow-shape': 'none',
        'arrow-scale': 0.85,
        'curve-style': 'bezier',
        opacity: 0.72,
        label: '',
        color: c.edgeLabelColor,
        'font-family': '"Plus Jakarta Sans", sans-serif',
        'font-size': 9.5,
        'text-background-color': c.edgeLabelBg,
        'text-background-opacity': 0.9,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
        'text-rotation': 'autorotate',
        'transition-property': 'opacity, width',
        'transition-duration': 150,
      },
    },
    {
      selector: 'edge[relationship = "direct_quotation"]',
      style: {
        'line-style': 'solid',
        'target-arrow-shape': 'triangle',
      },
    },
    {
      selector: 'edge[relationship = "allusion"]',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [6, 3],
        'target-arrow-shape': 'vee',
      },
    },
    {
      selector: 'edge[relationship = "prophecy_fulfillment"]',
      style: {
        'line-style': 'solid',
        'target-arrow-shape': 'vee',
        'arrow-scale': 1.05,
      },
    },
    {
      selector: 'edge[relationship = "typology"]',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [8, 4],
        'target-arrow-shape': 'diamond',
      },
    },
    {
      selector: 'edge[relationship = "thematic"]',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [4, 4],
        'target-arrow-shape': 'none',
      },
    },
    {
      selector: 'edge[relationship = "parallel"]',
      style: {
        'line-style': 'solid',
        'source-arrow-shape': 'triangle',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.75,
      },
    },
    {
      selector: 'edge[relationship = "historical"]',
      style: {
        'line-style': 'dotted',
        'target-arrow-shape': 'chevron',
      },
    },
    {
      selector: 'edge[relationship = "linguistic"]',
      style: {
        'line-style': 'dotted',
        'target-arrow-shape': 'circle',
        'arrow-scale': 0.75,
      },
    },
    {
      selector: 'edge[?isTsk]',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [5, 5],
        opacity: 0.62,
      },
    },
    {
      selector: 'edge[epistemicNature = "explicit_biblical"]',
      style: {
        opacity: 0.86,
      },
    },
    {
      selector: 'edge[epistemicNature = "scholarly_interpretive"]',
      style: {
        opacity: 0.56,
      },
    },
    {
      selector: 'edge.show-label',
      style: {
        label: 'data(relLabel)',
      },
    },
    {
      selector: 'edge.highlighted-edge',
      style: {
        opacity: 1,
        width: 3,
        'z-index': 25,
      },
    },
    {
      selector: 'edge.path-edge',
      style: {
        opacity: 1,
        width: 3.6,
        'line-color': c.pathEdge,
        'target-arrow-color': c.pathEdge,
        'source-arrow-color': c.pathEdge,
        'z-index': 50,
        label: 'data(relLabel)',
      },
    },
    {
      selector: 'edge.dimmed',
      style: {
        opacity: 0.1,
      },
    },
  ];
}

export const ScriptureGraphView: React.FC<ScriptureGraphViewProps> = ({
  atlasTheme = 'dark',
  graphViewMode,
  onChangeGraphViewMode,
  anchorVerseId,
  selectedVerseId,
  visibleNodeIds,
  dynamicTskEdges = [],
  depth,
  activeRelationships,
  epistemicFilter,
  layout,
  focusMode,
  showEdgeLabels,
  pathSourceId,
  pathTargetId,
  activePath,
  onChangeDepth,
  onSelectVerse,
  onExpandVerse,
  onExpandTskReference,
  onCollapseBranch,
  onResetGraph,
  onToggleRelationship,
  onSetAllRelationships,
  onSetRelationshipPreset,
  onChangeEpistemicFilter,
  onChangeLayout,
  onToggleFocusMode,
  onToggleEdgeLabels,
  onSetPathSource,
  onSetPathTarget,
  onTracePath,
  onClearPath,
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
  onSaveGraphView,
}) => {
  const cyContainerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pathPanelOpen, setPathPanelOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedEdge, setSelectedEdge] = useState<CrossReferenceEdge | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [resolvedVerseRevision, setResolvedVerseRevision] = useState(0);

  // In-graph search state
  const [inGraphQuery, setInGraphQuery] = useState('');
  const [searchMatchIdx, setSearchMatchIdx] = useState(0);

  const cyPalette = useMemo(() => getCyPalette(atlasTheme), [atlasTheme]);

  // Stable refs for Cytoscape event handlers
  const onSelectVerseRef = useRef(onSelectVerse);
  onSelectVerseRef.current = onSelectVerse;
  const onExpandVerseRef = useRef(onExpandVerse);
  onExpandVerseRef.current = onExpandVerse;
  const themeRef = useRef(atlasTheme);
  themeRef.current = atlasTheme;

  // Deduplicated visible node set
  const deduplicatedNodeIds = useMemo(
    () => Array.from(new Set(visibleNodeIds)),
    [visibleNodeIds]
  );

  // Hydrate any dynamically added non-anchor verses asynchronously
  useEffect(() => {
    const missing = deduplicatedNodeIds.filter((id) => !getVerseById(id));
    if (missing.length === 0) return;
    let active = true;
    Promise.all(missing.map((id) => resolveVerseAsync(id).catch(() => undefined))).then(() => {
      if (active) setResolvedVerseRevision((n) => n + 1);
    });
    return () => {
      active = false;
    };
  }, [deduplicatedNodeIds]);

  const visibleSet = useMemo(() => new Set(deduplicatedNodeIds), [deduplicatedNodeIds]);
  const activeRelSet = useMemo(() => new Set(activeRelationships), [activeRelationships]);

  const curatedEdges = useMemo(
    () => getEdgesBetweenNodes(visibleSet, activeRelSet, epistemicFilter),
    [visibleSet, activeRelSet, epistemicFilter]
  );

  const edges = useMemo(() => {
    const seen = new Set(curatedEdges.map((e) => e.id));
    const combined = [...curatedEdges];
    for (const te of dynamicTskEdges) {
      if (
        !seen.has(te.id) &&
        visibleSet.has(te.source) &&
        visibleSet.has(te.target)
      ) {
        seen.add(te.id);
        combined.push(te);
      }
    }
    return combined;
  }, [curatedEdges, dynamicTskEdges, visibleSet]);

  const depthMap = useMemo(
    () => computeHopDistancesFromAnchor(anchorVerseId, visibleSet, activeRelSet, epistemicFilter),
    [anchorVerseId, visibleSet, activeRelSet, epistemicFilter]
  );

  // Edge counts per relationship type in current graph
  const edgeCountsByRel = useMemo(() => {
    const counts: Record<RelationshipType, number> = {
      direct_quotation: 0,
      allusion: 0,
      prophecy_fulfillment: 0,
      typology: 0,
      thematic: 0,
      parallel: 0,
      historical: 0,
      linguistic: 0,
    };
    const allPossibleEdges = getEdgesBetweenNodes(visibleSet, undefined, epistemicFilter);
    for (const edge of allPossibleEdges) {
      counts[edge.relationship] += 1;
    }
    return counts;
  }, [visibleSet, epistemicFilter]);

  // In-graph search matches
  const inGraphMatches = useMemo(
    () => searchWithinNodes(inGraphQuery, deduplicatedNodeIds),
    [inGraphQuery, deduplicatedNodeIds, resolvedVerseRevision]
  );

  useEffect(() => {
    setSearchMatchIdx(0);
  }, [inGraphQuery, deduplicatedNodeIds.length]);

  const allIndexedVerses = useMemo(() => getAllIndexedVerses(), []);

  // Initialize Cytoscape when in Ego 2D mode
  useEffect(() => {
    if (graphViewMode !== 'ego' || !cyContainerRef.current) return;

    const cy = cytoscape({
      container: cyContainerRef.current,
      elements: [],
      minZoom: 0.22,
      maxZoom: 2.8,
      wheelSensitivity: 0.25,
      boxSelectionEnabled: false,
      textureOnViewport: false,
      hideEdgesOnViewport: false,
      style: buildCytoscapeStylesheet(themeRef.current),
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      setSelectedEdge(null);
      onSelectVerseRef.current(node.id());
    });

    cy.on('dbltap', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      onExpandVerseRef.current(node.id());
    });

    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target as EdgeSingular;
      setSelectedEdge({
        id: edge.id(),
        source: edge.data('source'),
        target: edge.data('target'),
        relationship: edge.data('relationship'),
        epistemicNature: edge.data('epistemicNature'),
        editorialStatus: edge.data('editorialStatus'),
        confidence: edge.data('confidence'),
        sourceAttribution: edge.data('sourceAttribution'),
        supportingEvidence: edge.data('supportingEvidence'),
        explanation: edge.data('explanation'),
      });
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedEdge(null);
      }
    });

    cyRef.current = cy;

    const resizeObserver = new ResizeObserver(() => {
      cy.resize();
    });
    resizeObserver.observe(cyContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, [graphViewMode]);

  // Update Cytoscape stylesheet + border tones on theme change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.style(buildCytoscapeStylesheet(atlasTheme));
    const pal = getCyPalette(atlasTheme);
    cy.batch(() => {
      cy.nodes().forEach((n) => {
        const testament = n.data('testament');
        n.data('borderColor', testament === 'OT' ? pal.otBorder : pal.ntBorder);
      });
    });
  }, [atlasTheme]);

  // Incremental diffing & batched Cytoscape synchronization
  const prevLayoutRef = useRef<GraphLayoutType>(layout);
  const prevAnchorRef = useRef<VerseId>(anchorVerseId);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || graphViewMode !== 'ego') return;

    const desiredNodeIds = new Set(deduplicatedNodeIds);
    const desiredEdgeIds = new Set(edges.map((e) => e.id));
    const pal = getCyPalette(atlasTheme);

    let topologyChanged =
      prevLayoutRef.current !== layout ||
      prevAnchorRef.current !== anchorVerseId ||
      cy.nodes().length === 0;

    cy.batch(() => {
      cy.edges().forEach((edge) => {
        if (!desiredEdgeIds.has(edge.id())) {
          edge.remove();
          topologyChanged = true;
        }
      });

      cy.nodes().forEach((node) => {
        if (!desiredNodeIds.has(node.id())) {
          node.remove();
          topologyChanged = true;
        }
      });

      const nodesToAdd: cytoscape.ElementDefinition[] = [];
      const containerCenter = { x: cy.width() / 2 || 400, y: cy.height() / 2 || 300 };

      let newIdx = 0;
      for (const id of deduplicatedNodeIds) {
        const verse = getVerseById(id);
        const label = verse ? verse.shortRef : formatReferenceFromId(id, true);
        const bookIdx = [
          'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
        ].includes(id.split('.')[0])
          ? 'OT'
          : 'NT';
        const testament = verse ? verse.testament : bookIdx;
        const borderColor = testament === 'OT' ? pal.otBorder : pal.ntBorder;
        const approxWidth = Math.max(84, Math.min(148, label.length * 8 + 28));
        const nodeDepth = depthMap[id] ?? 2;
        const isAnchor = id === anchorVerseId;

        const existingNode = cy.getElementById(id);
        if (existingNode.nonempty()) {
          existingNode.data({
            label,
            testament,
            isAnchor,
            depth: nodeDepth,
            borderColor,
            nodeWidth: approxWidth,
          });
        } else {
          topologyChanged = true;
          let seedPos = {
            x: containerCenter.x + Math.cos(newIdx * 0.9) * 140,
            y: containerCenter.y + Math.sin(newIdx * 0.9) * 140,
          };
          const neighbors = getConnectedPassages(id, activeRelSet, epistemicFilter);
          for (const n of neighbors) {
            const mountedNeighbor = cy.getElementById(n.verse.id);
            if (mountedNeighbor.nonempty()) {
              const p = mountedNeighbor.position();
              seedPos = {
                x: p.x + Math.cos(newIdx * 1.15) * 120,
                y: p.y + Math.sin(newIdx * 1.15) * 120,
              };
              break;
            }
          }
          newIdx += 1;

          nodesToAdd.push({
            group: 'nodes',
            data: {
              id,
              label,
              testament,
              isAnchor,
              depth: nodeDepth,
              borderColor,
              nodeWidth: approxWidth,
            },
            position: seedPos,
          });
        }
      }

      if (nodesToAdd.length > 0) {
        cy.add(nodesToAdd);
      }

      const edgesToAdd: cytoscape.ElementDefinition[] = [];
      for (const edge of edges) {
        if (cy.getElementById(edge.id).empty()) {
          const meta = RELATIONSHIP_METADATA[edge.relationship];
          const isTsk = edge.id.startsWith('tsk-');
          edgesToAdd.push({
            group: 'edges',
            data: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              relationship: edge.relationship,
              epistemicNature: edge.epistemicNature,
              editorialStatus: edge.editorialStatus,
              confidence: edge.confidence,
              sourceAttribution: edge.sourceAttribution,
              supportingEvidence: edge.supportingEvidence,
              relLabel: isTsk ? 'TSK Parallel' : meta.shortLabel,
              explanation: edge.explanation,
              color: isTsk ? (atlasTheme === 'light' ? '#6C6257' : '#8E887D') : meta.color,
              lineStyle: isTsk ? 'dashed' : meta.lineStyle,
              edgeWidth: isTsk ? 1.5 : meta.width,
              isTsk,
            },
          });
        }
      }

      if (edgesToAdd.length > 0) {
        cy.add(edgesToAdd);
      }
    });

    const nodeCount = deduplicatedNodeIds.length;

    if (topologyChanged && nodeCount > 0) {
      const shouldAnimate = nodeCount <= 42;
      const layoutConfig =
        layout === 'cose'
          ? {
              name: 'cose',
              animate: shouldAnimate,
              animationDuration: 280,
              fit: true,
              padding: 58,
              randomize: false,
              numIter: nodeCount > 40 ? 350 : 650,
              nodeRepulsion: () => 5800,
              idealEdgeLength: () => 135,
              edgeElasticity: () => 110,
            }
          : layout === 'concentric'
          ? {
              name: 'concentric',
              animate: shouldAnimate,
              animationDuration: 260,
              fit: true,
              padding: 58,
              minNodeSpacing: 46,
              concentric: (node: NodeSingular) => {
                const d = Number(node.data('depth') ?? 2);
                return Math.max(10, 100 - d * 22);
              },
            }
          : layout === 'breadthfirst'
          ? {
              name: 'breadthfirst',
              directed: true,
              animate: shouldAnimate,
              animationDuration: 260,
              fit: true,
              padding: 58,
              spacingFactor: 1.35,
              roots: `#${CSS.escape(anchorVerseId)}`,
            }
          : {
              name: 'circle',
              animate: shouldAnimate,
              animationDuration: 260,
              fit: true,
              padding: 58,
            };

      cy.layout(layoutConfig as cytoscape.LayoutOptions).run();
    }

    prevLayoutRef.current = layout;
    prevAnchorRef.current = anchorVerseId;
  }, [
    graphViewMode,
    deduplicatedNodeIds,
    edges,
    anchorVerseId,
    layout,
    depthMap,
    activeRelSet,
    epistemicFilter,
    resolvedVerseRevision,
    atlasTheme,
  ]);

  // Highlighting: selection, focus mode, path tracing, and in-graph search
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || graphViewMode !== 'ego') return;

    const pathNodeSet = new Set(activePath?.nodeIds ?? []);
    const pathEdgeSet = new Set(activePath?.edges.map((e) => e.id) ?? []);
    const searchMatchSet = new Set(inGraphMatches);
    const hasActivePath = pathNodeSet.size > 1;
    const hasSearchMatches = inGraphQuery.trim().length > 0;

    cy.batch(() => {
      cy.nodes().removeClass('selected-node neighbor-node path-node search-match dimmed');
      cy.edges().removeClass('highlighted-edge path-edge dimmed show-label');

      if (showEdgeLabels) {
        cy.edges().addClass('show-label');
      }

      const sel = cy.getElementById(selectedVerseId);
      if (sel && sel.nonempty()) {
        sel.addClass('selected-node');
        const connectedEdges = sel.connectedEdges();
        const connectedNodes = connectedEdges.connectedNodes();
        connectedEdges.addClass('highlighted-edge');
        connectedNodes.addClass('neighbor-node');

        if (focusMode && !hasActivePath) {
          cy.nodes().difference(sel.union(connectedNodes)).addClass('dimmed');
          cy.edges().difference(connectedEdges).addClass('dimmed');
        }
      }

      if (hasActivePath) {
        cy.nodes().forEach((n) => {
          if (pathNodeSet.has(n.id())) {
            n.addClass('path-node');
          } else {
            n.addClass('dimmed');
          }
        });
        cy.edges().forEach((e) => {
          if (pathEdgeSet.has(e.id())) {
            e.addClass('path-edge');
          } else {
            e.addClass('dimmed');
          }
        });
      }

      if (hasSearchMatches) {
        cy.nodes().forEach((n) => {
          if (searchMatchSet.has(n.id())) {
            n.addClass('search-match');
            n.removeClass('dimmed');
          } else if (!hasActivePath && !focusMode) {
            n.addClass('dimmed');
          }
        });
      }
    });
  }, [
    graphViewMode,
    selectedVerseId,
    focusMode,
    showEdgeLabels,
    activePath,
    inGraphMatches,
    inGraphQuery,
    deduplicatedNodeIds,
    edges,
  ]);

  const centerOnNode = (verseId: VerseId) => {
    const cy = cyRef.current;
    if (!cy) return;
    const node = cy.getElementById(verseId);
    if (node.nonempty()) {
      cy.animate({
        center: { eles: node },
        duration: 240,
      });
    }
  };

  const stepSearchMatch = (delta: number) => {
    if (inGraphMatches.length === 0) return;
    const nextIdx =
      (searchMatchIdx + delta + inGraphMatches.length) % inGraphMatches.length;
    setSearchMatchIdx(nextIdx);
    const targetId = inGraphMatches[nextIdx];
    onSelectVerse(targetId);
    centerOnNode(targetId);
  };

  const handleZoom = (factor: number) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({
      level: cy.zoom() * factor,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  };

  const handleFit = () => {
    cyRef.current?.fit(undefined, 54);
  };

  const handleSaveView = () => {
    onSaveGraphView();
    setSaveToast(true);
    window.setTimeout(() => setSaveToast(false), 2000);
  };

  const selectedVerse = getVerseById(selectedVerseId);
  const selectedExpandableCount = selectedVerse
    ? getConnectedPassages(selectedVerse.id, activeRelSet, epistemicFilter).filter(
        (c) => !visibleSet.has(c.verse.id)
      ).length
    : 0;

  const selectedCollapsibleCount = useMemo(() => {
    if (!selectedVerse) return 0;
    const degreeMap = new Map<VerseId, number>();
    const neighborIds = new Set<VerseId>();
    for (const edge of edges) {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
      if (edge.source === selectedVerse.id) neighborIds.add(edge.target);
      if (edge.target === selectedVerse.id) neighborIds.add(edge.source);
    }
    let leaves = 0;
    let nonAnchorNeighbors = 0;
    for (const nId of neighborIds) {
      if (nId !== anchorVerseId && nId !== selectedVerse.id) {
        nonAnchorNeighbors += 1;
        if ((degreeMap.get(nId) ?? 0) <= 1) leaves += 1;
      }
    }
    return leaves > 0 ? leaves : nonAnchorNeighbors;
  }, [selectedVerse, edges, anchorVerseId]);

  const effectivePathSource = pathSourceId ?? selectedVerseId;
  const effectivePathTarget = pathTargetId ?? '';

  return (
    <div className="relative flex-1 flex h-full overflow-hidden bg-[var(--atlas-bg)]">
      {/* Main Interactive Stage */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Top Mode Switcher Strip (Always visible above 2D or 3D canvas) */}
        <div
          className={`absolute top-3 z-30 pointer-events-auto ${
            graphViewMode === 'ego' ? 'left-3 hidden' : 'left-3'
          }`}
        />

        {graphViewMode !== 'ego' ? (
          <>
            {/* Segmented Mode Bar at Top Left for 3D Modes */}
            <div className="absolute top-3 left-3 z-30 pointer-events-auto inline-flex items-center p-0.5 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] shadow-md">
              <button
                type="button"
                onClick={() => onChangeGraphViewMode('ego')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] transition-colors whitespace-nowrap"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Ego Graph (2D)</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeGraphViewMode('canon_arc')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  graphViewMode === 'canon_arc'
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                    : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                <span>Canon Arc (3D)</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeGraphViewMode('canon_ring')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  graphViewMode === 'canon_ring'
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-secondary-soft)]'
                    : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                <span>Canon Ring (3D)</span>
              </button>
            </div>

            <CanonAtlas3D
              mode={graphViewMode}
              atlasTheme={atlasTheme}
              selectedVerseId={selectedVerseId}
              onOpenBookInGraph={(vId) => {
                onChangeGraphViewMode('ego');
                onResetGraph(vId);
              }}
              onOpenBookInReader={onOpenInReader}
            />
          </>
        ) : (
          <>
            {/* Subtle scholarly dot grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-45"
              style={{
                backgroundImage: `radial-gradient(${cyPalette.gridDot} 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
              aria-hidden="true"
            />

            {/* Cytoscape Mount */}
            <div
              ref={cyContainerRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              aria-label="Interactive Scripture cross-reference graph"
            />

            {/* Top Graph Control Bar */}
            <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
              {/* Left cluster */}
              <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
                {/* 2D / 3D Mode Switcher */}
                <div className="inline-flex items-center p-0.5 h-8 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)]">
                  <button
                    type="button"
                    onClick={() => onChangeGraphViewMode('ego')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] text-[11px] font-medium whitespace-nowrap"
                  >
                    <Network className="w-3 h-3 text-[var(--atlas-accent)]" />
                    <span>Ego 2D</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeGraphViewMode('canon_arc')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] transition-colors whitespace-nowrap"
                    title="Switch to 3D Canon Arc Overview (344,753 TSK links)"
                  >
                    <Box className="w-3 h-3" />
                    <span>Arc 3D</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeGraphViewMode('canon_ring')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] transition-colors whitespace-nowrap"
                    title="Switch to 3D Canon Ring Overview (344,753 TSK links)"
                  >
                    <CircleDot className="w-3 h-3" />
                    <span>Ring 3D</span>
                  </button>
                </div>

                <select
                  aria-label="Select seed passage"
                  value={ANCHOR_PRESETS.some((p) => p.id === anchorVerseId) ? anchorVerseId : ''}
                  onChange={(e) => {
                    if (e.target.value) onResetGraph(e.target.value);
                  }}
                  className="h-8 px-2.5 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] focus:outline-none focus:border-[var(--atlas-accent)]"
                >
                  {!ANCHOR_PRESETS.some((p) => p.id === anchorVerseId) && (
                    <option value="">
                      Seed: {formatReferenceFromId(anchorVerseId, true)}
                    </option>
                  )}
                  {ANCHOR_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>

                {/* Connection Depth Control */}
                <div
                  className="inline-flex items-center h-8 px-1 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)]"
                  title="Visible connection depth from anchor passage"
                >
                  <span className="text-[11px] text-[var(--atlas-text-subtle)] px-1.5">Depth</span>
                  {[1, 2, 3, 4].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onChangeDepth(lvl)}
                      className={`w-6 h-6 rounded text-xs font-mono tabular-nums transition-colors ${
                        depth === lvl
                          ? 'bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] font-semibold'
                          : 'text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <div className="inline-flex items-center h-8 px-1 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)]">
                  <LayoutGrid className="w-3.5 h-3.5 text-[var(--atlas-text-subtle)] ml-1.5 mr-1" />
                  <select
                    aria-label="Graph layout algorithm"
                    value={layout}
                    onChange={(e) => onChangeLayout(e.target.value as GraphLayoutType)}
                    className="bg-transparent text-xs text-[var(--atlas-text-secondary)] pr-1.5 focus:outline-none"
                  >
                    {LAYOUT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-[var(--atlas-surface)] text-[var(--atlas-text)]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Relationship & Epistemic Filter Panel Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterOpen((v) => !v);
                      setPathPanelOpen(false);
                    }}
                    className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      activeRelationships.length < RELATIONSHIP_TYPES.length ||
                      epistemicFilter !== 'all'
                        ? 'bg-[var(--atlas-accent)]/15 text-[var(--atlas-accent-soft)] border-[var(--atlas-accent)]/45'
                        : 'bg-[var(--atlas-surface)]/95 text-[var(--atlas-text-secondary)] border-[var(--atlas-border-strong)] hover:border-[var(--atlas-text-subtle)]'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filters</span>
                    <span className="font-mono text-[11px] text-[var(--atlas-text-muted)] tabular-nums">
                      {activeRelationships.length}/{RELATIONSHIP_TYPES.length}
                    </span>
                  </button>

                  {filterOpen && (
                    <div className="absolute left-0 top-10 w-80 p-3 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] shadow-2xl z-40 space-y-3">
                      <div className="space-y-1.5 pb-2.5 border-b border-[var(--atlas-border)]">
                        <div className="text-xs font-medium text-[var(--atlas-text)]">Epistemic Basis</div>
                        <div className="grid grid-cols-3 gap-1 p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
                          {(
                            [
                              { id: 'all', label: 'All' },
                              { id: 'explicit_biblical', label: 'Explicit' },
                              { id: 'scholarly_interpretive', label: 'Scholarly' },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => onChangeEpistemicFilter(opt.id)}
                              className={`py-1 px-1.5 rounded text-[11px] font-medium transition-colors ${
                                epistemicFilter === opt.id
                                  ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-secondary-soft)]'
                                  : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-[var(--atlas-border)]">
                        <span className="text-xs font-medium text-[var(--atlas-text)]">
                          Relationship Types
                        </span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => onSetAllRelationships(true)}
                            className="text-[var(--atlas-accent)] hover:underline"
                          >
                            All
                          </button>
                          <span className="text-[var(--atlas-text-subtle)]">/</span>
                          <button
                            type="button"
                            onClick={() =>
                              onSetRelationshipPreset([
                                'direct_quotation',
                                'allusion',
                                'prophecy_fulfillment',
                                'typology',
                              ])
                            }
                            className="text-[var(--atlas-secondary)] hover:underline"
                          >
                            Intertextual
                          </button>
                          <span className="text-[var(--atlas-text-subtle)]">/</span>
                          <button
                            type="button"
                            onClick={() => onSetAllRelationships(false)}
                            className="text-[var(--atlas-text-muted)] hover:underline"
                          >
                            None
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {RELATIONSHIP_TYPES.map((type) => {
                          const meta = RELATIONSHIP_METADATA[type];
                          const checked = activeRelSet.has(type);
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => onToggleRelationship(type)}
                              title={meta.description}
                              className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--atlas-elevated)] text-left transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-4 h-0 shrink-0"
                                  style={{
                                    borderTop: `2px ${meta.lineStyle} ${meta.color}`,
                                  }}
                                  aria-hidden="true"
                                />
                                <span
                                  className={`text-xs truncate ${
                                    checked
                                      ? 'text-[var(--atlas-text)]'
                                      : 'text-[var(--atlas-text-subtle)] line-through'
                                  }`}
                                >
                                  {meta.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-[var(--atlas-text-subtle)] shrink-0">
                                <span>({edgeCountsByRel[type]})</span>
                                <span className={checked ? 'text-[var(--atlas-secondary)]' : 'text-[var(--atlas-text-subtle)]'}>
                                  {checked ? 'On' : 'Off'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Path Tracer Popover Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setPathPanelOpen((v) => !v);
                      setFilterOpen(false);
                    }}
                    className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      activePath
                        ? 'bg-[var(--atlas-secondary)]/15 text-[var(--atlas-secondary-soft)] border-[var(--atlas-secondary)]/45'
                        : 'bg-[var(--atlas-surface)]/95 text-[var(--atlas-text-secondary)] border-[var(--atlas-border-strong)] hover:border-[var(--atlas-text-subtle)]'
                    }`}
                  >
                    <Route className="w-3.5 h-3.5" />
                    <span>Trace Path</span>
                  </button>

                  {pathPanelOpen && (
                    <div className="absolute left-0 top-10 w-80 p-3.5 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] shadow-2xl z-40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--atlas-heading)]">
                          Shortest Canonical Path Tracer
                        </span>
                        <button
                          type="button"
                          onClick={() => setPathPanelOpen(false)}
                          className="text-[var(--atlas-text-subtle)] hover:text-[var(--atlas-text)]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] text-[var(--atlas-text-muted)] mb-1">
                            Origin Passage (A)
                          </label>
                          <select
                            value={effectivePathSource}
                            onChange={(e) => onSetPathSource(e.target.value)}
                            className="w-full h-8 px-2 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)]"
                          >
                            {allIndexedVerses.map((v) => (
                              <option key={`src-${v.id}`} value={v.id}>
                                {v.reference}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (effectivePathTarget) {
                                const prevSrc = effectivePathSource;
                                onSetPathSource(effectivePathTarget);
                                onSetPathTarget(prevSrc);
                              }
                            }}
                            title="Swap origin and destination"
                            className="p-1 rounded text-[var(--atlas-text-muted)] hover:text-[var(--atlas-accent)] hover:bg-[var(--atlas-elevated)]"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[var(--atlas-text-muted)] mb-1">
                            Destination Passage (B)
                          </label>
                          <select
                            value={effectivePathTarget}
                            onChange={(e) => onSetPathTarget(e.target.value || null)}
                            className="w-full h-8 px-2 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)]"
                          >
                            <option value="">Select destination passage...</option>
                            {allIndexedVerses.map((v) => (
                              <option key={`dst-${v.id}`} value={v.id}>
                                {v.reference}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        {activePath ? (
                          <button
                            type="button"
                            onClick={() => {
                              onClearPath();
                            }}
                            className="px-2.5 py-1.5 rounded text-xs text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]"
                          >
                            Clear Path
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--atlas-text-subtle)]">
                            Discovers &amp; adds bridge nodes
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={!effectivePathSource || !effectivePathTarget}
                          onClick={() => {
                            if (effectivePathSource && effectivePathTarget) {
                              onTracePath(effectivePathSource, effectivePathTarget);
                              setPathPanelOpen(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded bg-[var(--atlas-secondary)] text-[var(--atlas-secondary-contrast)] text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Find Path
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search within currently expanded graph */}
                <div className="inline-flex items-center h-8 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] px-2 gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[var(--atlas-text-subtle)] shrink-0" />
                  <input
                    type="text"
                    value={inGraphQuery}
                    onChange={(e) => setInGraphQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inGraphMatches.length > 0) {
                        e.preventDefault();
                        stepSearchMatch(e.shiftKey ? -1 : 1);
                      }
                    }}
                    placeholder="Search in graph..."
                    aria-label="Search within expanded graph"
                    className="w-24 sm:w-32 bg-transparent text-xs text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none"
                  />
                  {inGraphQuery.trim() && (
                    <div className="flex items-center gap-0.5 text-[11px] font-mono tabular-nums text-[var(--atlas-text-muted)]">
                      <span>
                        {inGraphMatches.length > 0
                          ? `${searchMatchIdx + 1}/${inGraphMatches.length}`
                          : '0'}
                      </span>
                      {inGraphMatches.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => stepSearchMatch(-1)}
                            aria-label="Previous graph match"
                            className="p-0.5 hover:text-[var(--atlas-accent-soft)]"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => stepSearchMatch(1)}
                            aria-label="Next graph match"
                            className="p-0.5 hover:text-[var(--atlas-accent-soft)]"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setInGraphQuery('')}
                        aria-label="Clear graph search"
                        className="p-0.5 hover:text-[var(--atlas-text)]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onToggleEdgeLabels}
                  className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    showEdgeLabels
                      ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border-[var(--atlas-accent)]/40'
                      : 'bg-[var(--atlas-surface)]/95 text-[var(--atlas-text-secondary)] border-[var(--atlas-border-strong)] hover:border-[var(--atlas-text-subtle)]'
                  }`}
                >
                  {showEdgeLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="hidden xl:inline">Labels</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleFocusMode}
                  className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    focusMode
                      ? 'bg-[var(--atlas-secondary)]/15 text-[var(--atlas-secondary-soft)] border-[var(--atlas-secondary)]/40'
                      : 'bg-[var(--atlas-surface)]/95 text-[var(--atlas-text-secondary)] border-[var(--atlas-border-strong)] hover:border-[var(--atlas-text-subtle)]'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Focus</span>
                </button>
              </div>

              {/* Right cluster */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                {selectedVerse && (
                  <button
                    type="button"
                    onClick={() => onExpandVerse(selectedVerse.id)}
                    disabled={selectedExpandableCount === 0}
                    title="Expand selected verse connections"
                    className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      selectedExpandableCount > 0
                        ? 'bg-[var(--atlas-elevated)]/95 text-[var(--atlas-accent-soft)] border-[var(--atlas-accent)]/40 hover:bg-[var(--atlas-hover)]'
                        : 'bg-[var(--atlas-surface)]/80 text-[var(--atlas-text-subtle)] border-[var(--atlas-border)] cursor-not-allowed'
                    }`}
                  >
                    <GitBranchPlus className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
                    <span className="hidden sm:inline">
                      Expand {selectedExpandableCount > 0 ? `(+${selectedExpandableCount})` : ''}
                    </span>
                  </button>
                )}

                <div className="inline-flex items-center h-8 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleZoom(1.22)}
                    aria-label="Zoom in"
                    title="Zoom in"
                    className="px-2 h-full text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom(0.82)}
                    aria-label="Zoom out"
                    title="Zoom out"
                    className="px-2 h-full text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)] border-l border-[var(--atlas-border)] transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleFit}
                    aria-label="Fit graph to view"
                    title="Fit graph to view"
                    className="px-2 h-full text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)] border-l border-[var(--atlas-border)] transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInGraphQuery('');
                    onResetGraph();
                  }}
                  title="Reset graph to default network"
                  className="h-8 px-2.5 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-heading)] hover:bg-[var(--atlas-elevated)] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveView}
                  title="Save current graph configuration"
                  className="h-8 px-2.5 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] hover:bg-[var(--atlas-elevated)] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  {saveToast ? (
                    <BookmarkCheck className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden xl:inline">{saveToast ? 'Saved' : 'Save View'}</span>
                </button>

                {!panelOpen && (
                  <button
                    type="button"
                    onClick={() => setPanelOpen(true)}
                    className="h-8 px-2.5 rounded-md bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <PanelRightOpen className="w-3.5 h-3.5" />
                    <span>Scripture</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Path Floating Banner */}
            {activePath && activePath.nodeIds.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 max-w-2xl px-3.5 py-2 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-secondary)]/40 shadow-xl flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--atlas-secondary-soft)] shrink-0">
                  <Route className="w-3.5 h-3.5" />
                  <span>Path ({activePath.steps.length} hops):</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  {activePath.nodeIds.map((nId, idx) => {
                    const v = getVerseById(nId);
                    return (
                      <React.Fragment key={nId}>
                        {idx > 0 && <ArrowRight className="w-3 h-3 text-[var(--atlas-text-subtle)]" />}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectVerse(nId);
                            centerOnNode(nId);
                          }}
                          className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                            nId === selectedVerseId
                              ? 'bg-[var(--atlas-secondary)]/20 text-[var(--atlas-secondary-soft)]'
                              : 'text-[var(--atlas-text)] hover:text-[var(--atlas-accent)]'
                          }`}
                        >
                          {v?.shortRef ?? formatReferenceFromId(nId, true)}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={onClearPath}
                  aria-label="Clear active path"
                  className="ml-1 text-[var(--atlas-text-subtle)] hover:text-[var(--atlas-text)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Bottom-left Graph Legend & Counts */}
            <div className="absolute bottom-3 left-3 z-20 max-w-xs">
              {legendOpen ? (
                <div className="p-3 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-muted)]">
                      Graph Key
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-[var(--atlas-text-subtle)]">
                      <span>{deduplicatedNodeIds.length} nodes</span>
                      <span>·</span>
                      <span>{edges.length} edges</span>
                      <button
                        type="button"
                        onClick={() => setLegendOpen(false)}
                        aria-label="Minimize legend"
                        className="ml-1 text-[var(--atlas-text-subtle)] hover:text-[var(--atlas-text)]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-[var(--atlas-text-secondary)] pb-2 border-b border-[var(--atlas-border)]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-2.5 rounded-[2px] border-[1.5px] bg-[var(--atlas-bg)]"
                        style={{ borderColor: cyPalette.otBorder }}
                      />
                      <span>Old Testament</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-2.5 rounded-[2px] border-[1.5px] bg-[var(--atlas-bg)]"
                        style={{ borderColor: cyPalette.ntBorder }}
                      />
                      <span>New Testament</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {RELATIONSHIP_TYPES.map((type) => {
                      const meta = RELATIONSHIP_METADATA[type];
                      const active = activeRelSet.has(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => onToggleRelationship(type)}
                          className={`flex items-center gap-1.5 text-[11px] text-left transition-opacity ${
                            active
                              ? 'opacity-100 text-[var(--atlas-text-secondary)]'
                              : 'opacity-40 text-[var(--atlas-text-subtle)]'
                          }`}
                        >
                          <span
                            className="w-3.5 h-0 shrink-0"
                            style={{ borderTop: `2px ${meta.lineStyle} ${meta.color}` }}
                            aria-hidden="true"
                          />
                          <span className="truncate">{meta.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[var(--atlas-text-subtle)]">
                    Double-click any node to expand · Use Trace Path to connect two verses.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setLegendOpen(true)}
                  className="px-2.5 py-1.5 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] font-mono tabular-nums"
                >
                  Key · {deduplicatedNodeIds.length} nodes · {edges.length} edges
                </button>
              )}
            </div>

            {/* Selected Edge Detail Card */}
            {selectedEdge && (
              <div className="absolute bottom-3 right-3 z-20 max-w-sm p-3.5 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] shadow-xl space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-0"
                      style={{
                        borderTop: `2px ${
                          RELATIONSHIP_METADATA[selectedEdge.relationship].lineStyle
                        } ${
                          selectedEdge.id.startsWith('tsk-')
                            ? '#8E887D'
                            : RELATIONSHIP_METADATA[selectedEdge.relationship].color
                        }`,
                      }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: selectedEdge.id.startsWith('tsk-')
                          ? 'var(--atlas-text-secondary)'
                          : RELATIONSHIP_METADATA[selectedEdge.relationship].color,
                      }}
                    >
                      {selectedEdge.id.startsWith('tsk-')
                        ? 'TSK Community Parallel'
                        : RELATIONSHIP_METADATA[selectedEdge.relationship].label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEdge(null)}
                    aria-label="Close edge detail"
                    className="text-[var(--atlas-text-subtle)] hover:text-[var(--atlas-text)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--atlas-heading)]">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectVerse(selectedEdge.source);
                      centerOnNode(selectedEdge.source);
                    }}
                    className="hover:text-[var(--atlas-accent)] underline underline-offset-2"
                  >
                    {formatReferenceFromId(selectedEdge.source)}
                  </button>
                  <span className="text-[var(--atlas-text-subtle)]">→</span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectVerse(selectedEdge.target);
                      centerOnNode(selectedEdge.target);
                    }}
                    className="hover:text-[var(--atlas-accent)] underline underline-offset-2"
                  >
                    {formatReferenceFromId(selectedEdge.target)}
                  </button>
                </div>
                <p className="text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                  {selectedEdge.explanation}
                </p>
                <div className="pt-1.5 border-t border-[var(--atlas-border)] text-[11px] text-[var(--atlas-text-muted)] space-y-0.5">
                  <div>
                    <span style={{ color: EPISTEMIC_META[selectedEdge.epistemicNature].color }}>
                      {EPISTEMIC_META[selectedEdge.epistemicNature].label}
                    </span>
                    {' · '}
                    <span>{EDITORIAL_STATUS_META[selectedEdge.editorialStatus].label}</span>
                    {' · '}
                    <span>{CONFIDENCE_META[selectedEdge.confidence].label}</span>
                  </div>
                  <div className="text-[var(--atlas-text-subtle)]">Source: {selectedEdge.sourceAttribution}</div>
                  {selectedEdge.supportingEvidence && (
                    <div className="text-[var(--atlas-text-muted)]">
                      Evidence: {selectedEdge.supportingEvidence}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Connected Passage & Contextual Scripture Sidebar (Ego 2D mode) */}
      {graphViewMode === 'ego' && panelOpen && (
        <aside className="fixed inset-x-0 bottom-0 h-[52vh] lg:static lg:h-full lg:w-[390px] xl:w-[420px] shrink-0 z-30">
          <ContextualScripturePanel
            verseId={selectedVerseId}
            visibleNodeIds={visibleSet}
            activeRelationships={activeRelSet}
            epistemicFilter={epistemicFilter}
            onChangeEpistemicFilter={onChangeEpistemicFilter}
            focusMode={focusMode}
            collapsibleCount={selectedCollapsibleCount}
            pathSourceId={pathSourceId}
            pathTargetId={pathTargetId}
            activePath={activePath}
            onSetPathSource={(id) => onSetPathSource(id)}
            onTracePathTo={(targetId) => {
              if (pathSourceId) {
                onTracePath(pathSourceId, targetId);
              }
            }}
            onClearPath={onClearPath}
            onToggleFocusMode={onToggleFocusMode}
            onExpandVerse={onExpandVerse}
            onExpandTskReference={onExpandTskReference}
            onCollapseBranch={onCollapseBranch}
            onSelectVerse={(id) => {
              onSelectVerse(id);
              centerOnNode(id);
            }}
            onOpenInReader={onOpenInReader}
            onOpenTheme={onOpenTheme}
            onOpenLocation={onOpenLocation}
            onOpenSanctuary={onOpenSanctuary}
            onOpenTimeline={onOpenTimeline}
            studyState={studyState}
            onToggleBookmark={onToggleBookmark}
            onSetHighlight={onSetHighlight}
            onSaveNote={onSaveNote}
            onToggleVerseInCollection={onToggleVerseInCollection}
            onCreateCollectionForVerse={onCreateCollectionForVerse}
            onClosePanel={() => setPanelOpen(false)}
          />
        </aside>
      )}
    </div>
  );
};
