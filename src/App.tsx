import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TimelineView } from './components/AtlasModulesView';
import { BibleReaderView } from './components/BibleReaderView';
import { CollectionsView } from './components/CollectionsView';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { CreateCollectionModal } from './components/CreateCollectionModal';
import { GeographyView } from './components/GeographyView';
import { GuideView, GuideWorkspaceTab } from './components/GuideView';
import { SanctuaryExplorerView } from './components/SanctuaryExplorerView';
import { ScriptureGraphView } from './components/ScriptureGraphView';
import { Sidebar } from './components/Sidebar';
import { ThemesView } from './components/ThemesView';
import { TopBar } from './components/TopBar';
import { RELATIONSHIP_TYPES } from './data/relationships';
import {
  fetchSharedCollection,
  loadCloudStudyState,
  saveCloudStudyState,
  signInWithGoogle,
  signOutFirebase,
  subscribeAuthState,
  subscribeCloudStudyState,
} from './services/firebaseClient';
import {
  buildGraphAtDepth,
  EpistemicFilter,
  findFullBiblePathAsync,
  formatReferenceFromId,
  getConnectedPassages,
  getEdgesBetweenNodes,
  getVerseById,
  loadTskConnectionsForVerse,
  resolveVerseAsync,
  ScripturePathResult,
} from './services/scriptureService';
import {
  addCollectionToState,
  addCustomEdgeInState,
  createInitialStudyState,
  loadStoredTheme,
  mergeStudyStates,
  normalizePartialState,
  removeCustomEdgeInState,
  saveGraphConfigInState,
  saveStoredTheme,
  setHighlightInState,
  setNoteInState,
  setPreferredTranslationInState,
  studyRepository,
  subscribeToStudyStateChanges,
  toggleBookmarkInState,
  toggleReadChapterInState,
  toggleVerseInCollectionState,
} from './services/storageRepository';
import {
  AtlasRouteSnapshot,
  buildShareUrl,
  buildUrlFromState,
  parseUrlRoute,
} from './services/urlRouter';
import {
  AtlasTheme,
  BibleTranslationId,
  CrossReferenceEdge,
  FirebaseUserSummary,
  GraphLayoutType,
  GraphViewMode,
  HighlightColor,
  NavSection,
  RelationshipType,
  SavedGraphConfig,
  SharedStudyCollection,
  UserStudyState,
  VerseId,
} from './types/scripture';

function buildTskEdge(sourceId: VerseId, targetId: VerseId, votes?: number): CrossReferenceEdge {
  const srcLabel = formatReferenceFromId(sourceId);
  const dstLabel = formatReferenceFromId(targetId);
  return {
    id: `tsk-${sourceId}--${targetId}`,
    source: sourceId,
    target: targetId,
    relationship: 'parallel',
    epistemicNature: 'scholarly_interpretive',
    editorialStatus: 'curated_sample',
    confidence: votes && votes >= 15 ? 'high' : 'moderate',
    sourceAttribution: 'OpenBible.info / Treasury of Scripture Knowledge (Community Vote-Ranked)',
    explanation: `Community vote-ranked cross-reference pairing ${srcLabel} with ${dstLabel}${
      votes !== undefined ? ` (${votes > 0 ? `+${votes}` : votes} net votes)` : ''
    }.`,
  };
}

export default function App() {
  const [initialRoute] = useState(() =>
    typeof window !== 'undefined'
      ? parseUrlRoute(window.location.pathname, window.location.search)
      : {}
  );

  const [atlasTheme, setAtlasTheme] = useState<AtlasTheme>(() => loadStoredTheme());
  const [activeSection, setActiveSection] = useState<NavSection>(
    () => initialRoute.section ?? 'graph'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Graph workspace state
  const [graphViewMode, setGraphViewMode] = useState<GraphViewMode>(
    () => initialRoute.graphViewMode ?? 'ego'
  );
  const [anchorVerseId, setAnchorVerseId] = useState<VerseId>(
    () => initialRoute.anchorVerseId ?? 'JHN.3.16'
  );
  const [selectedVerseId, setSelectedVerseId] = useState<VerseId>(
    () => initialRoute.anchorVerseId ?? 'JHN.3.16'
  );
  const [graphDepth, setGraphDepth] = useState<number>(2);
  const [activeRelationships, setActiveRelationships] = useState<RelationshipType[]>(
    () => [...RELATIONSHIP_TYPES]
  );
  const [epistemicFilter, setEpistemicFilter] = useState<EpistemicFilter>('all');
  const [visibleNodeIds, setVisibleNodeIds] = useState<VerseId[]>(() => {
    const startAnchor = initialRoute.anchorVerseId ?? 'JHN.3.16';
    if (getVerseById(startAnchor)) {
      return buildGraphAtDepth(startAnchor, 2, new Set(RELATIONSHIP_TYPES), 14, 'all').nodeIds;
    }
    return [startAnchor];
  });
  const [dynamicTskEdges, setDynamicTskEdges] = useState<CrossReferenceEdge[]>([]);
  const [graphLayout, setGraphLayout] = useState<GraphLayoutType>('cose');
  const [focusMode, setFocusMode] = useState(false);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);

  // Path tracing state
  const [pathSourceId, setPathSourceId] = useState<VerseId | null>(() =>
    initialRoute.pathTargetId ? initialRoute.anchorVerseId ?? 'JHN.3.16' : null
  );
  const [pathTargetId, setPathTargetId] = useState<VerseId | null>(
    () => initialRoute.pathTargetId ?? null
  );
  const [pathScope, setPathScope] = useState<'curated' | 'tsk'>('tsk');
  const [pathLoading, setPathLoading] = useState(false);
  const [activePath, setActivePath] = useState<ScripturePathResult | null>(null);

  // Bible Reader state
  const [readerBookId, setReaderBookId] = useState(() => initialRoute.readerBookId ?? 'JHN');
  const [readerChapter, setReaderChapter] = useState(() => initialRoute.readerChapter ?? 3);
  const [readerVerseId, setReaderVerseId] = useState<VerseId>(
    () => initialRoute.readerVerseId ?? 'JHN.3.16'
  );

  // Themes, Timeline, Geography & Sanctuary state
  const [activeThemeId, setActiveThemeId] = useState<string | undefined>(
    () => initialRoute.themeId
  );
  const [activeEventId, setActiveEventId] = useState<string | undefined>(
    () => initialRoute.eventId
  );
  const [activeLocationId, setActiveLocationId] = useState<string | undefined>(
    () => initialRoute.locationId
  );
  const [activeJourneyId, setActiveJourneyId] = useState<string | undefined>(
    () => initialRoute.journeyId
  );
  const [activeSanctuaryId, setActiveSanctuaryId] = useState<string | undefined>(
    () => initialRoute.sanctuaryId
  );
  const [guideTab, setGuideTab] = useState<GuideWorkspaceTab>('beliefs');
  const [activeBeliefId, setActiveBeliefId] = useState<string | undefined>('ch-1');

  // Persistent study state
  const [studyState, setStudyState] = useState<UserStudyState>(() =>
    createInitialStudyState()
  );
  const studyStateRef = useRef(studyState);
  studyStateRef.current = studyState;

  // Create collection modal & Cmd/Ctrl+K Command Palette
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionModalVerseId, setCollectionModalVerseId] = useState<VerseId | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Firebase Auth, Cloud Sync & Shared Collection State
  const [authUser, setAuthUser] = useState<FirebaseUserSummary | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    'offline' | 'syncing' | 'synced' | 'error'
  >('offline');
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [sharedIncoming, setSharedIncoming] = useState<SharedStudyCollection | null>(null);
  const [sharedLoading, setSharedLoading] = useState<boolean>(
    Boolean(initialRoute.sharedId)
  );
  const lastCloudSnapshotRef = useRef<string>('');
  const cloudHydratedRef = useRef(false);

  // Global Cmd/Ctrl + K command palette shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Apply dual theme class & meta theme-color + persist
  useEffect(() => {
    const root = document.documentElement;
    if (atlasTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', atlasTheme === 'dark' ? '#0D0E10' : '#F8F6F3');
    }
    saveStoredTheme(atlasTheme);
  }, [atlasTheme]);

  // Load persisted study state & cross-tab sync
  useEffect(() => {
    let mounted = true;
    studyRepository.loadState().then((loaded) => {
      if (!mounted) return;
      if (initialRoute.translation) {
        setStudyState(setPreferredTranslationInState(loaded, initialRoute.translation));
      } else {
        setStudyState(loaded);
      }
    });
    const unsubscribe = subscribeToStudyStateChanges((syncedState) => {
      if (mounted) {
        setStudyState(syncedState);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [initialRoute.translation]);

  // Load incoming public shared collection if URL contains ?shared=<shareId>
  useEffect(() => {
    if (!initialRoute.sharedId) return;
    let active = true;
    setSharedLoading(true);
    fetchSharedCollection(initialRoute.sharedId)
      .then((shared) => {
        if (!active) return;
        setSharedIncoming(shared);
        if (shared) {
          setActiveSection('collections');
        }
      })
      .catch(() => {
        if (active) setSharedIncoming(null);
      })
      .finally(() => {
        if (active) setSharedLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialRoute.sharedId]);

  // Subscribe to Firebase Auth & hydrate/sync Cloud StudyState
  useEffect(() => {
    let unsubCloud: (() => void) | null = null;
    const unsubAuth = subscribeAuthState((user) => {
      setAuthUser(user);
      if (unsubCloud) {
        unsubCloud();
        unsubCloud = null;
      }
      cloudHydratedRef.current = false;

      if (!user) {
        setCloudSyncStatus('offline');
        setCloudSyncError(null);
        return;
      }

      if (!user.emailVerified) {
        setCloudSyncStatus('error');
        setCloudSyncError('Verified Google email required for cloud sync.');
        return;
      }

      setCloudSyncStatus('syncing');
      setCloudSyncError(null);

      void (async () => {
        try {
          const remotePartial = await loadCloudStudyState(user.uid);
          let effectiveState = studyStateRef.current;
          if (remotePartial) {
            const normalizedRemote = normalizePartialState(remotePartial);
            effectiveState = mergeStudyStates(studyStateRef.current, normalizedRemote, 'merge');
          }
          const jsonSnapshot = JSON.stringify(effectiveState);
          lastCloudSnapshotRef.current = jsonSnapshot;
          setStudyState(effectiveState);
          await studyRepository.saveState(effectiveState);
          await saveCloudStudyState(user.uid, effectiveState);
          cloudHydratedRef.current = true;
          setCloudSyncStatus('synced');

          unsubCloud = subscribeCloudStudyState(
            user.uid,
            (incomingPartial) => {
              const incomingNormalized = normalizePartialState(incomingPartial);
              const merged = mergeStudyStates(
                studyStateRef.current,
                incomingNormalized,
                'merge'
              );
              const nextJson = JSON.stringify(merged);
              if (nextJson !== lastCloudSnapshotRef.current) {
                lastCloudSnapshotRef.current = nextJson;
                setStudyState(merged);
                void studyRepository.saveState(merged);
              }
            },
            (err) => {
              setCloudSyncStatus('error');
              setCloudSyncError(err instanceof Error ? err.message : 'Cloud sync error');
            }
          );
        } catch (err) {
          setCloudSyncStatus('error');
          setCloudSyncError(err instanceof Error ? err.message : 'Cloud sync unavailable.');
        }
      })();
    });

    return () => {
      unsubAuth();
      if (unsubCloud) unsubCloud();
    };
  }, []);

  // Debounced upload of local studyState changes when signed in
  useEffect(() => {
    if (!authUser || !authUser.emailVerified || !cloudHydratedRef.current) return;
    const serialized = JSON.stringify(studyState);
    if (serialized === lastCloudSnapshotRef.current) return;

    setCloudSyncStatus('syncing');
    const timer = window.setTimeout(() => {
      lastCloudSnapshotRef.current = serialized;
      saveCloudStudyState(authUser.uid, studyState)
        .then(() => {
          setCloudSyncStatus('synced');
          setCloudSyncError(null);
        })
        .catch((err) => {
          setCloudSyncStatus('error');
          setCloudSyncError(err instanceof Error ? err.message : 'Cloud save failed');
        });
    }, 750);

    return () => window.clearTimeout(timer);
  }, [authUser, studyState]);

  // Hydrate initial non-anchor route verses if URL loaded directly onto a non-sample verse
  useEffect(() => {
    const startAnchor = initialRoute.anchorVerseId;
    if (startAnchor && !getVerseById(startAnchor)) {
      void (async () => {
        await resolveVerseAsync(startAnchor);
        const tskLinks = await loadTskConnectionsForVerse(startAnchor);
        const topLinks = tskLinks.slice(0, 6);
        await Promise.all(topLinks.map((l) => resolveVerseAsync(l.targetVerseId).catch(() => undefined)));
        const newNodes = [startAnchor, ...topLinks.map((l) => l.targetVerseId)];
        const newEdges = topLinks.map((l) => buildTskEdge(startAnchor, l.targetVerseId, l.votes));
        setVisibleNodeIds((prev) => Array.from(new Set([...prev, ...newNodes])));
        setDynamicTskEdges((prev) => {
          const seen = new Set(prev.map((e) => e.id));
          return [...prev, ...newEdges.filter((e) => !seen.has(e.id))];
        });
      })();
    }
    if (initialRoute.readerVerseId && !getVerseById(initialRoute.readerVerseId)) {
      void resolveVerseAsync(initialRoute.readerVerseId);
    }
  }, [initialRoute.anchorVerseId, initialRoute.readerVerseId]);

  const updateStudyState = useCallback(
    (updater: (prev: UserStudyState) => UserStudyState) => {
      setStudyState((prev) => {
        const next = updater(prev);
        studyRepository.saveState(next);
        return next;
      });
    },
    []
  );

  const translation: BibleTranslationId = studyState.preferredTranslation ?? 'KJV';

  // Route snapshot & bidirectional URL sync
  const routeSnapshot: AtlasRouteSnapshot = useMemo(
    () => ({
      activeSection,
      anchorVerseId,
      pathTargetId,
      graphViewMode,
      readerBookId,
      readerChapter,
      readerVerseId,
      translation,
      activeThemeId,
      activeEventId,
      activeLocationId,
      activeJourneyId,
      activeSanctuaryId,
    }),
    [
      activeSection,
      anchorVerseId,
      pathTargetId,
      graphViewMode,
      readerBookId,
      readerChapter,
      readerVerseId,
      translation,
      activeThemeId,
      activeEventId,
      activeLocationId,
      activeJourneyId,
      activeSanctuaryId,
    ]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextUrl = buildUrlFromState(routeSnapshot);
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [routeSnapshot]);

  useEffect(() => {
    const onPopState = () => {
      const parsed = parseUrlRoute(window.location.pathname, window.location.search);
      if (parsed.section) setActiveSection(parsed.section);
      if (parsed.graphViewMode) setGraphViewMode(parsed.graphViewMode);
      if (parsed.anchorVerseId) {
        setAnchorVerseId(parsed.anchorVerseId);
        setSelectedVerseId(parsed.anchorVerseId);
      }
      if (parsed.readerBookId) setReaderBookId(parsed.readerBookId);
      if (parsed.readerChapter) setReaderChapter(parsed.readerChapter);
      if (parsed.readerVerseId) setReaderVerseId(parsed.readerVerseId);
      if (parsed.themeId) setActiveThemeId(parsed.themeId);
      if (parsed.eventId) setActiveEventId(parsed.eventId);
      if (parsed.locationId) setActiveLocationId(parsed.locationId);
      if (parsed.journeyId) setActiveJourneyId(parsed.journeyId);
      if (parsed.sanctuaryId) setActiveSanctuaryId(parsed.sanctuaryId);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleCopyShareLink = useCallback(() => {
    const url = buildShareUrl(routeSnapshot);
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      void navigator.clipboard.writeText(url).catch(() => {});
    }
  }, [routeSnapshot]);

  // Recompute canonical path across Curated or Full 66-Book TSK network
  useEffect(() => {
    if (!pathSourceId || !pathTargetId) {
      setActivePath(null);
      setPathLoading(false);
      return;
    }

    let cancelled = false;
    setPathLoading(true);
    void findFullBiblePathAsync(pathSourceId, pathTargetId, {
      mode: pathScope,
      allowedRelationships: new Set(activeRelationships),
      epistemicFilter,
      customEdges: studyState.customEdges ?? [],
    })
      .then(async (res) => {
        if (cancelled) return;
        setActivePath(res);
        if (res && res.nodeIds.length > 0) {
          await Promise.all(
            res.nodeIds.map((nId) => resolveVerseAsync(nId).catch(() => undefined))
          );
          if (cancelled) return;
          setVisibleNodeIds((prev) => Array.from(new Set([...prev, ...res.nodeIds])));
          const bridgeEdges = res.edges.filter((e) => e.id.startsWith('tsk-'));
          if (bridgeEdges.length > 0) {
            setDynamicTskEdges((prev) => {
              const seen = new Set(prev.map((e) => e.id));
              return [...prev, ...bridgeEdges.filter((e) => !seen.has(e.id))];
            });
          }
        }
      })
      .catch(() => {
        if (!cancelled) setActivePath(null);
      })
      .finally(() => {
        if (!cancelled) setPathLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pathSourceId, pathTargetId, pathScope, activeRelationships, epistemicFilter, studyState.customEdges]);

  // Graph actions
  const handleSelectGraphVerse = useCallback((verseId: VerseId) => {
    setVisibleNodeIds((prev) => (prev.includes(verseId) ? prev : [...prev, verseId]));
    setSelectedVerseId(verseId);
  }, []);

  const handleChangeDepth = useCallback(
    (nextDepth: number) => {
      setGraphDepth(nextDepth);
      const allowed = new Set(activeRelationships);
      const maxNodes = nextDepth <= 1 ? 12 : nextDepth === 2 ? 22 : nextDepth === 3 ? 42 : 65;
      if (getVerseById(anchorVerseId) && getConnectedPassages(anchorVerseId, allowed, epistemicFilter).length > 0) {
        const { nodeIds } = buildGraphAtDepth(
          anchorVerseId,
          nextDepth,
          allowed,
          maxNodes,
          epistemicFilter
        );
        setVisibleNodeIds(Array.from(new Set(nodeIds)));
      }
    },
    [anchorVerseId, activeRelationships, epistemicFilter]
  );

  const handleExpandVerse = useCallback(
    (verseId: VerseId) => {
      const allowed = new Set(activeRelationships);
      const neighbors = getConnectedPassages(verseId, allowed, epistemicFilter).map(
        (c) => c.verse.id
      );
      setVisibleNodeIds((prev) => {
        const merged = new Set(prev);
        merged.add(verseId);
        for (const n of neighbors) {
          merged.add(n);
        }
        return Array.from(merged);
      });
      setSelectedVerseId(verseId);
    },
    [activeRelationships, epistemicFilter]
  );

  const handleExpandTskReference = useCallback(
    (sourceVerseId: VerseId, targetVerseId: VerseId) => {
      void (async () => {
        await resolveVerseAsync(targetVerseId).catch(() => undefined);
        const tskLinks = await loadTskConnectionsForVerse(sourceVerseId).catch(() => []);
        const matched = tskLinks.find((l) => l.targetVerseId === targetVerseId);
        const edge = buildTskEdge(sourceVerseId, targetVerseId, matched?.votes);

        setVisibleNodeIds((prev) =>
          Array.from(new Set([...prev, sourceVerseId, targetVerseId]))
        );
        setDynamicTskEdges((prev) =>
          prev.some((e) => e.id === edge.id) ? prev : [...prev, edge]
        );
        setSelectedVerseId(targetVerseId);
      })();
    },
    []
  );

  const handleCollapseBranch = useCallback(
    (verseId: VerseId) => {
      setVisibleNodeIds((prev) => {
        if (prev.length <= 1) return prev;
        const visibleSet = new Set(prev);
        const allowed = new Set(activeRelationships);
        const visibleEdges = [
          ...getEdgesBetweenNodes(visibleSet, allowed, epistemicFilter),
          ...dynamicTskEdges.filter(
            (e) => visibleSet.has(e.source) && visibleSet.has(e.target)
          ),
        ];

        const neighborIds = new Set<VerseId>();
        const degreeMap = new Map<VerseId, number>();

        for (const edge of visibleEdges) {
          degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
          degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
          if (edge.source === verseId) neighborIds.add(edge.target);
          if (edge.target === verseId) neighborIds.add(edge.source);
        }

        const toRemove = new Set<VerseId>();
        for (const nId of neighborIds) {
          if (nId !== anchorVerseId && nId !== verseId && (degreeMap.get(nId) ?? 0) <= 1) {
            toRemove.add(nId);
          }
        }

        if (toRemove.size === 0) {
          for (const nId of neighborIds) {
            if (nId !== anchorVerseId && nId !== verseId) {
              toRemove.add(nId);
            }
          }
        }

        if (toRemove.size === 0) return prev;
        return prev.filter((id) => !toRemove.has(id));
      });
    },
    [activeRelationships, epistemicFilter, anchorVerseId, dynamicTskEdges]
  );

  const seedGraphAroundVerse = useCallback(
    (targetAnchor: VerseId, filterEpistemic: EpistemicFilter) => {
      const hasCurated =
        getVerseById(targetAnchor) &&
        getConnectedPassages(targetAnchor, new Set(RELATIONSHIP_TYPES), filterEpistemic).length > 0;

      if (hasCurated) {
        setVisibleNodeIds(
          buildGraphAtDepth(targetAnchor, 2, new Set(RELATIONSHIP_TYPES), 14, filterEpistemic)
            .nodeIds
        );
        setDynamicTskEdges([]);
      } else {
        // Hydrate any non-anchor verse cleanly and seed top 6 vote-ranked TSK links
        setVisibleNodeIds([targetAnchor]);
        setDynamicTskEdges([]);
        void (async () => {
          await resolveVerseAsync(targetAnchor).catch(() => undefined);
          const tskLinks = await loadTskConnectionsForVerse(targetAnchor).catch(() => []);
          const topLinks = tskLinks.slice(0, 6);
          await Promise.all(
            topLinks.map((l) => resolveVerseAsync(l.targetVerseId).catch(() => undefined))
          );
          const seededNodes = [targetAnchor, ...topLinks.map((l) => l.targetVerseId)];
          const seededEdges = topLinks.map((l) =>
            buildTskEdge(targetAnchor, l.targetVerseId, l.votes)
          );
          setVisibleNodeIds(Array.from(new Set(seededNodes)));
          setDynamicTskEdges(seededEdges);
        })();
      }
    },
    []
  );

  const handleResetGraph = useCallback(
    (newAnchorId?: VerseId) => {
      const targetAnchor = newAnchorId ?? anchorVerseId;
      const defaultDepth = 2;
      setAnchorVerseId(targetAnchor);
      setSelectedVerseId(targetAnchor);
      setGraphDepth(defaultDepth);
      setActiveRelationships([...RELATIONSHIP_TYPES]);
      setEpistemicFilter('all');
      setFocusMode(false);
      setPathSourceId(null);
      setPathTargetId(null);
      seedGraphAroundVerse(targetAnchor, 'all');
    },
    [anchorVerseId, seedGraphAroundVerse]
  );

  const handleToggleRelationship = useCallback((rel: RelationshipType) => {
    setActiveRelationships((prev) =>
      prev.includes(rel) ? prev.filter((r) => r !== rel) : [...prev, rel]
    );
  }, []);

  const handleSetAllRelationships = useCallback((enabled: boolean) => {
    setActiveRelationships(enabled ? [...RELATIONSHIP_TYPES] : []);
  }, []);

  const handleSetRelationshipPreset = useCallback((rels: RelationshipType[]) => {
    setActiveRelationships(rels);
  }, []);

  const handleTracePath = useCallback((sourceId: VerseId, targetId: VerseId) => {
    setPathSourceId(sourceId);
    setPathTargetId(targetId);
    setSelectedVerseId(targetId);
  }, []);

  const handleClearPath = useCallback(() => {
    setPathSourceId(null);
    setPathTargetId(null);
    setActivePath(null);
  }, []);

  const handleOpenInGraph = useCallback(
    (verseId: VerseId) => {
      setAnchorVerseId(verseId);
      setSelectedVerseId(verseId);
      setGraphDepth(2);
      setFocusMode(false);
      setPathSourceId(null);
      setPathTargetId(null);
      setGraphViewMode('ego');
      setActiveSection('graph');
      seedGraphAroundVerse(verseId, epistemicFilter);
    },
    [epistemicFilter, seedGraphAroundVerse]
  );

  const handleLoadVersesInGraph = useCallback((verseIds: VerseId[], anchorId: VerseId) => {
    const valid = verseIds.filter((id) => Boolean(getVerseById(id)));
    const fallbackIds = valid.length > 0 ? valid : verseIds;
    if (fallbackIds.length === 0) return;
    const anchor = fallbackIds.includes(anchorId) ? anchorId : fallbackIds[0];
    setAnchorVerseId(anchor);
    setSelectedVerseId(anchor);
    setVisibleNodeIds(Array.from(new Set(fallbackIds)));
    setDynamicTskEdges([]);
    setFocusMode(false);
    setPathSourceId(null);
    setPathTargetId(null);
    setGraphViewMode('ego');
    setActiveSection('graph');
  }, []);

  const handleOpenInReader = useCallback(
    (bookId: string, chapter: number, verseId?: VerseId) => {
      setReaderBookId(bookId);
      setReaderChapter(chapter);
      if (verseId) {
        setReaderVerseId(verseId);
      } else {
        setReaderVerseId(`${bookId}.${chapter}.1`);
      }
      setActiveSection('reader');
    },
    []
  );

  const handleOpenTheme = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    setActiveSection('themes');
  }, []);

  const handleOpenLocation = useCallback((locationId: string) => {
    setActiveJourneyId(undefined);
    setActiveLocationId(locationId);
    setActiveSection('geography');
  }, []);

  const handleOpenJourney = useCallback((journeyId: string) => {
    setActiveJourneyId(journeyId);
    setActiveSection('geography');
  }, []);

  const handleOpenTimeline = useCallback((eventId?: string) => {
    if (eventId) setActiveEventId(eventId);
    setActiveSection('timeline');
  }, []);

  const handleOpenSanctuary = useCallback((sanctuaryId: string) => {
    setActiveSanctuaryId(sanctuaryId);
    setActiveSection('sanctuary');
  }, []);

  const handleLoadSavedGraph = useCallback((config: SavedGraphConfig) => {
    setAnchorVerseId(config.anchorVerseId);
    setSelectedVerseId(config.anchorVerseId);
    setVisibleNodeIds(Array.from(new Set(config.visibleNodeIds)));
    setDynamicTskEdges([]);
    setActiveRelationships(config.activeRelationships);
    setGraphLayout(config.layout);
    setFocusMode(false);
    setPathSourceId(null);
    setPathTargetId(null);
    setGraphViewMode('ego');
    setActiveSection('graph');
  }, []);

  // Study state actions
  const handleToggleBookmark = useCallback(
    (verseId: VerseId) => {
      updateStudyState((prev) => toggleBookmarkInState(prev, verseId));
    },
    [updateStudyState]
  );

  const handleSetHighlight = useCallback(
    (verseId: VerseId, color: HighlightColor | null) => {
      updateStudyState((prev) => setHighlightInState(prev, verseId, color));
    },
    [updateStudyState]
  );

  const handleSaveNote = useCallback(
    (verseId: VerseId, note: string) => {
      updateStudyState((prev) => setNoteInState(prev, verseId, note));
    },
    [updateStudyState]
  );

  const handleToggleVerseInCollection = useCallback(
    (collectionId: string, verseId: VerseId) => {
      updateStudyState((prev) =>
        toggleVerseInCollectionState(prev, collectionId, verseId)
      );
    },
    [updateStudyState]
  );

  const handleToggleReadChapter = useCallback(
    (bookId: string, chapter: number) => {
      updateStudyState((prev) => toggleReadChapterInState(prev, bookId, chapter));
    },
    [updateStudyState]
  );

  const handleChangeTranslation = useCallback(
    (nextTranslation: BibleTranslationId) => {
      updateStudyState((prev) => setPreferredTranslationInState(prev, nextTranslation));
    },
    [updateStudyState]
  );

  const handleCreateCollection = useCallback(
    (title: string, description: string, initialVerseIds: VerseId[] = []) => {
      updateStudyState(
        (prev) => addCollectionToState(prev, title, description, initialVerseIds).state
      );
    },
    [updateStudyState]
  );

  const handleRecordSearch = useCallback(
    (term: string) => {
      updateStudyState((prev) => ({
        ...prev,
        recentSearches: [term, ...prev.recentSearches.filter((t) => t !== term)].slice(
          0,
          6
        ),
      }));
    },
    [updateStudyState]
  );

  const handleSaveGraphView = useCallback(() => {
    const anchor = getVerseById(anchorVerseId);
    const name = `${anchor?.reference ?? formatReferenceFromId(anchorVerseId)} Network (${
      visibleNodeIds.length
    } nodes)`;
    updateStudyState((prev) =>
      saveGraphConfigInState(prev, {
        name,
        anchorVerseId,
        visibleNodeIds,
        activeRelationships,
        layout: graphLayout,
      })
    );
  }, [anchorVerseId, visibleNodeIds, activeRelationships, graphLayout, updateStudyState]);

  const handleImportStudyState = useCallback(
    (incoming: UserStudyState, mode: 'merge' | 'replace') => {
      updateStudyState((prev) => mergeStudyStates(prev, incoming, mode));
    },
    [updateStudyState]
  );

  const handleAddCustomEdge = useCallback(
    (edge: CrossReferenceEdge) => {
      updateStudyState((prev) => addCustomEdgeInState(prev, edge));
      void Promise.all([
        resolveVerseAsync(edge.source).catch(() => undefined),
        resolveVerseAsync(edge.target).catch(() => undefined),
      ]).then(() => {
        setVisibleNodeIds((prev) => Array.from(new Set([...prev, edge.source, edge.target])));
      });
    },
    [updateStudyState]
  );

  const handleDeleteCustomEdge = useCallback(
    (edgeId: string) => {
      updateStudyState((prev) => removeCustomEdgeInState(prev, edgeId));
    },
    [updateStudyState]
  );

  const handleMapLexicalParallels = useCallback(
    (strongsId: string, lemma: string, originVerseId: VerseId, matchingVerses: VerseId[]) => {
      const targets = matchingVerses.filter((v) => v !== originVerseId).slice(0, 12);
      const allVerses = Array.from(new Set([originVerseId, ...targets]));
      const lexicalEdges: CrossReferenceEdge[] = targets.map((tId) => ({
        id: `tsk-lex-${strongsId}-${originVerseId}--${tId}`,
        source: originVerseId,
        target: tId,
        relationship: 'linguistic',
        epistemicNature: 'explicit_biblical',
        editorialStatus: 'verified_textual',
        confidence: 'high',
        sourceAttribution: `Strong's Concordance (${strongsId} · ${lemma})`,
        explanation: `Shares Strong's entry ${strongsId} (${lemma}) between ${formatReferenceFromId(
          originVerseId
        )} and ${formatReferenceFromId(tId)}.`,
      }));

      setAnchorVerseId(originVerseId);
      setSelectedVerseId(originVerseId);
      setPathSourceId(null);
      setPathTargetId(null);
      setFocusMode(false);
      setGraphViewMode('ego');
      setActiveSection('graph');
      setVisibleNodeIds(allVerses);
      setDynamicTskEdges(lexicalEdges);

      void Promise.all(allVerses.map((vId) => resolveVerseAsync(vId).catch(() => undefined)));
    },
    []
  );

  const handleSignInGoogle = useCallback(() => {
    void signInWithGoogle().catch((err) => {
      setCloudSyncStatus('error');
      setCloudSyncError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    });
  }, []);

  const handleSignOut = useCallback(() => {
    void signOutFirebase().catch(() => {});
  }, []);

  const handleImportSharedCollection = useCallback(
    (shared: SharedStudyCollection) => {
      updateStudyState(
        (prev) =>
          addCollectionToState(
            prev,
            shared.title,
            shared.description || `Shared by ${shared.authorLabel}`,
            shared.verseIds
          ).state
      );
      setSharedIncoming(null);
    },
    [updateStudyState]
  );

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[var(--atlas-bg)] text-[var(--atlas-text)]">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        bookmarkCount={studyState.bookmarks.length}
        collectionCount={studyState.collections.length}
        readChaptersCount={studyState.readChapters.length}
        atlasTheme={atlasTheme}
        onToggleTheme={() => setAtlasTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar
          activeSection={activeSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenInGraph={handleOpenInGraph}
          onOpenInReader={handleOpenInReader}
          onOpenTheme={handleOpenTheme}
          onOpenLocation={handleOpenLocation}
          onOpenSanctuary={handleOpenSanctuary}
          recentSearches={studyState.recentSearches}
          onRecordSearch={handleRecordSearch}
          onCreateCollectionClick={() => {
            setCollectionModalVerseId(
              activeSection === 'graph'
                ? selectedVerseId
                : activeSection === 'reader'
                ? readerVerseId
                : null
            );
            setCollectionModalOpen(true);
          }}
          onCopyShareLink={handleCopyShareLink}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          authUser={authUser}
          onAuthButtonClick={() => setActiveSection('collections')}
        />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {activeSection === 'graph' && (
            <ScriptureGraphView
              atlasTheme={atlasTheme}
              graphViewMode={graphViewMode}
              onChangeGraphViewMode={setGraphViewMode}
              anchorVerseId={anchorVerseId}
              selectedVerseId={selectedVerseId}
              visibleNodeIds={visibleNodeIds}
              dynamicTskEdges={dynamicTskEdges}
              depth={graphDepth}
              activeRelationships={activeRelationships}
              epistemicFilter={epistemicFilter}
              layout={graphLayout}
              focusMode={focusMode}
              showEdgeLabels={showEdgeLabels}
              pathSourceId={pathSourceId}
              pathTargetId={pathTargetId}
              activePath={activePath}
              pathScope={pathScope}
              pathLoading={pathLoading}
              onChangePathScope={setPathScope}
              onChangeDepth={handleChangeDepth}
              onSelectVerse={handleSelectGraphVerse}
              onExpandVerse={handleExpandVerse}
              onExpandTskReference={handleExpandTskReference}
              onCollapseBranch={handleCollapseBranch}
              onResetGraph={handleResetGraph}
              onToggleRelationship={handleToggleRelationship}
              onSetAllRelationships={handleSetAllRelationships}
              onSetRelationshipPreset={handleSetRelationshipPreset}
              onChangeEpistemicFilter={setEpistemicFilter}
              onChangeLayout={setGraphLayout}
              onToggleFocusMode={() => setFocusMode((f) => !f)}
              onToggleEdgeLabels={() => setShowEdgeLabels((l) => !l)}
              onSetPathSource={setPathSourceId}
              onSetPathTarget={setPathTargetId}
              onTracePath={handleTracePath}
              onClearPath={handleClearPath}
              onOpenInReader={handleOpenInReader}
              onOpenTheme={handleOpenTheme}
              onOpenLocation={handleOpenLocation}
              onOpenSanctuary={handleOpenSanctuary}
              onOpenTimeline={handleOpenTimeline}
              studyState={studyState}
              onToggleBookmark={handleToggleBookmark}
              onSetHighlight={handleSetHighlight}
              onSaveNote={handleSaveNote}
              onToggleVerseInCollection={handleToggleVerseInCollection}
              onCreateCollectionForVerse={(vId) => {
                setCollectionModalVerseId(vId);
                setCollectionModalOpen(true);
              }}
              onSaveGraphView={handleSaveGraphView}
              onAddCustomEdge={handleAddCustomEdge}
              onDeleteCustomEdge={handleDeleteCustomEdge}
              onMapLexicalParallels={handleMapLexicalParallels}
            />
          )}

          {activeSection === 'reader' && (
            <BibleReaderView
              bookId={readerBookId}
              chapter={readerChapter}
              selectedVerseId={readerVerseId}
              translation={translation}
              onChangeTranslation={handleChangeTranslation}
              onToggleReadChapter={handleToggleReadChapter}
              onNavigateReader={handleOpenInReader}
              onSelectVerse={setReaderVerseId}
              onOpenInGraph={handleOpenInGraph}
              onOpenTheme={handleOpenTheme}
              onOpenLocation={handleOpenLocation}
              onOpenSanctuary={handleOpenSanctuary}
              onOpenTimeline={handleOpenTimeline}
              studyState={studyState}
              onToggleBookmark={handleToggleBookmark}
              onSetHighlight={handleSetHighlight}
              onSaveNote={handleSaveNote}
              onToggleVerseInCollection={handleToggleVerseInCollection}
              onCreateCollectionForVerse={(vId) => {
                setCollectionModalVerseId(vId);
                setCollectionModalOpen(true);
              }}
              onMapLexicalParallels={handleMapLexicalParallels}
            />
          )}

          {activeSection === 'themes' && (
            <ThemesView
              initialThemeId={activeThemeId}
              onLoadVersesInGraph={handleLoadVersesInGraph}
              onOpenInGraph={handleOpenInGraph}
              onOpenInReader={handleOpenInReader}
            />
          )}

          {activeSection === 'timeline' && (
            <TimelineView
              initialEventId={activeEventId}
              onOpenInGraph={handleOpenInGraph}
              onLoadVersesInGraph={handleLoadVersesInGraph}
              onOpenInReader={handleOpenInReader}
              onOpenLocation={handleOpenLocation}
              onOpenJourney={handleOpenJourney}
              onOpenSanctuary={handleOpenSanctuary}
              onOpenTheme={handleOpenTheme}
            />
          )}

          {activeSection === 'geography' && (
            <GeographyView
              atlasTheme={atlasTheme}
              initialLocationId={activeLocationId}
              initialJourneyId={activeJourneyId}
              onOpenInGraph={handleOpenInGraph}
              onLoadVersesInGraph={handleLoadVersesInGraph}
              onOpenInReader={handleOpenInReader}
              onOpenTimeline={handleOpenTimeline}
            />
          )}

          {activeSection === 'sanctuary' && (
            <SanctuaryExplorerView
              atlasTheme={atlasTheme}
              initialComponentId={activeSanctuaryId}
              onOpenInGraph={handleOpenInGraph}
              onLoadVersesInGraph={handleLoadVersesInGraph}
              onOpenInReader={handleOpenInReader}
            />
          )}

          {activeSection === 'collections' && (
            <CollectionsView
              studyState={studyState}
              onCreateCollection={(title, desc) => handleCreateCollection(title, desc, [])}
              onToggleVerseInCollection={handleToggleVerseInCollection}
              onToggleBookmark={handleToggleBookmark}
              onLoadVersesInGraph={handleLoadVersesInGraph}
              onLoadSavedGraph={handleLoadSavedGraph}
              onOpenInGraph={handleOpenInGraph}
              onOpenInReader={handleOpenInReader}
              onImportStudyState={handleImportStudyState}
              authUser={authUser}
              cloudSyncStatus={cloudSyncStatus}
              cloudSyncError={cloudSyncError}
              onSignInGoogle={handleSignInGoogle}
              onSignOut={handleSignOut}
              sharedIncoming={sharedIncoming}
              sharedLoading={sharedLoading}
              onImportSharedCollection={handleImportSharedCollection}
              onDismissSharedCollection={() => setSharedIncoming(null)}
              onDeleteCustomEdge={handleDeleteCustomEdge}
            />
          )}

          {activeSection === 'guide' && (
            <GuideView
              initialTab={guideTab}
              initialBeliefId={activeBeliefId}
              onOpenInGraph={handleOpenInGraph}
              onLoadVersesInGraph={handleLoadVersesInGraph}
              onOpenGraphMode={(mode, targetAnchor) => {
                if (targetAnchor) {
                  setAnchorVerseId(targetAnchor);
                  setSelectedVerseId(targetAnchor);
                }
                setGraphViewMode(mode);
                setActiveSection('graph');
              }}
              onTracePath={(src, dst) => {
                setAnchorVerseId(src);
                setSelectedVerseId(dst);
                setPathScope('tsk');
                setGraphViewMode('ego');
                setPathSourceId(src);
                setPathTargetId(dst);
                setActiveSection('graph');
              }}
              onOpenInReader={handleOpenInReader}
              onOpenTheme={handleOpenTheme}
              onOpenTimeline={handleOpenTimeline}
              onOpenLocation={handleOpenLocation}
              onOpenJourney={handleOpenJourney}
              onOpenSanctuary={handleOpenSanctuary}
              onOpenCollections={() => setActiveSection('collections')}
              onCreateCollection={handleCreateCollection}
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            />
          )}
        </div>
      </div>

      <CreateCollectionModal
        open={collectionModalOpen}
        initialVerseId={collectionModalVerseId}
        onClose={() => setCollectionModalOpen(false)}
        onCreate={handleCreateCollection}
      />

      <CommandPaletteModal
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        atlasTheme={atlasTheme}
        onToggleTheme={() => setAtlasTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        translation={translation}
        onChangeTranslation={handleChangeTranslation}
        onSelectSection={setActiveSection}
        onSelectGraphMode={setGraphViewMode}
        onOpenInGraph={handleOpenInGraph}
        onOpenInReader={handleOpenInReader}
        onOpenTheme={handleOpenTheme}
        onOpenLocation={handleOpenLocation}
        onOpenSanctuary={handleOpenSanctuary}
        onOpenBeliefGuide={(tab, beliefId) => {
          setGuideTab(tab);
          if (beliefId) setActiveBeliefId(beliefId);
          setActiveSection('guide');
        }}
      />
    </div>
  );
}
