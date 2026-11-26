import { describe, expect, it } from 'vitest';
import { BIBLICAL_EVENTS } from '../src/data/atlasModules';
import { BIBLE_BOOKS } from '../src/data/books';
import { CROSS_REFERENCES } from '../src/data/crossReferences';
import { BIBLICAL_JOURNEYS, BIBLICAL_LOCATIONS } from '../src/data/geography';
import { SANCTUARY_ARTICLES } from '../src/data/sanctuary';
import { BIBLICAL_THEMES } from '../src/data/themes';
import {
  buildGraphAtDepth,
  findFullBiblePathAsync,
  findShortestScripturePath,
  getAvailableChaptersForBook,
  getChapterVerses,
  getChapterVersesInTranslation,
  getConnectedPassages,
  getCrossModuleContextForEvent,
  getDatasetSummary,
  getEventsForVerse,
  getLocationsForVerse,
  getSanctuaryForVerse,
  getStrongsEntryAsync,
  getStrongsOccurrencesAsync,
  getVerseById,
  getVerseStrongsTokensAsync,
  loadBookKjv,
  loadBookStrongsVerses,
  loadBookTranslation,
  loadCanonIndex,
  loadTskBookMatrix,
  loadTskCanonHead,
  loadTskConnectionsForVerse,
  parseStrongsTaggedText,
  queryRelationshipDatabase,
  searchFullCorpus,
  searchScripture,
} from '../src/services/scriptureService';
import {
  addCustomEdgeInState,
  createInitialStudyState,
  exportStudyStateAsJson,
  exportStudyStateAsMarkdown,
  mergeStudyStates,
  parseAndValidateStudyImport,
  removeCustomEdgeInState,
  setPreferredTranslationInState,
  toggleReadChapterInState,
} from '../src/services/storageRepository';
import { buildUrlFromState, parseUrlRoute } from '../src/services/urlRouter';
import { CrossReferenceEdge } from '../src/types/scripture';

describe('Full 66-book 1769 KJV corpus loading & search', () => {
  it('loads all 66 canonical books with exactly 31,102 verses and zero empty texts', async () => {
    expect(BIBLE_BOOKS).toHaveLength(66);

    let totalVerses = 0;
    for (const book of BIBLE_BOOKS) {
      const verses = await loadBookKjv(book.id);
      expect(verses.length).toBeGreaterThan(0);
      totalVerses += verses.length;

      for (const v of verses) {
        expect(v.text.trim().length).toBeGreaterThan(0);
        expect(v.text).not.toContain('[');
        expect(v.text.startsWith('#')).toBe(false);
      }
    }

    expect(totalVerses).toBe(31102);

    const summary = getDatasetSummary();
    expect(summary.totalCanonicalBooks).toBe(66);
    expect(summary.totalFullKjvVerses).toBe(31102);
    expect(summary.loadedBooksCount).toBe(66);
    expect(summary.loadedVersesCount).toBe(31102);
  });

  it('spot-checks canonical verses, chapters, and non-anchor book search', async () => {
    await loadBookKjv('OBA');
    await loadBookKjv('PHM');

    expect(getVerseById('GEN.1.1')?.text).toContain('In the beginning God created');
    expect(getVerseById('PSA.23.1')?.text).toContain('The LORD is my shepherd');
    expect(getVerseById('SNG.2.1')?.text).toContain('rose of Sharon');
    expect(getVerseById('MAT.1.1')?.text).toContain('Jesus Christ, the son of David');
    expect(getVerseById('JHN.3.16')?.text).toContain('For God so loved the world');
    expect(getVerseById('REV.22.21')?.text).toContain('grace of our Lord Jesus Christ');

    const obadiahChapters = getAvailableChaptersForBook('OBA');
    expect(obadiahChapters).toHaveLength(1);
    const obadiahVerses = getChapterVerses('OBA', 1);
    expect(obadiahVerses).toHaveLength(21);

    const bookSearch = searchScripture('Philemon 1:1');
    expect(bookSearch.some((r) => r.bookId === 'PHM' && r.chapter === 1)).toBe(true);

    const quickJump = searchScripture('Obadiah 1');
    expect(quickJump.some((r) => r.bookId === 'OBA' && r.chapter === 1)).toBe(true);
  });
});

describe('Cross-reference, theme, geography, timeline & sanctuary referential integrity', () => {
  it('resolves every cross-reference source and target verse', () => {
    expect(CROSS_REFERENCES.length).toBeGreaterThanOrEqual(100);
    for (const edge of CROSS_REFERENCES) {
      expect(getVerseById(edge.source), `Missing source ${edge.source}`).toBeDefined();
      expect(getVerseById(edge.target), `Missing target ${edge.target}`).toBeDefined();
      expect(edge.sourceAttribution.trim().length).toBeGreaterThan(0);
    }
  });

  it('resolves verse IDs across themes, timeline events, locations, journeys, and sanctuary', () => {
    for (const theme of BIBLICAL_THEMES) {
      expect(getVerseById(theme.featuredAnchorId)).toBeDefined();
      for (const vId of theme.verseIds) {
        expect(getVerseById(vId), `Missing theme verse ${vId}`).toBeDefined();
      }
    }

    const eventIds = new Set(BIBLICAL_EVENTS.map((e) => e.id));
    for (const evt of BIBLICAL_EVENTS) {
      for (const vId of evt.verseIds) {
        expect(getVerseById(vId), `Missing event verse ${vId}`).toBeDefined();
      }
    }

    for (const loc of BIBLICAL_LOCATIONS) {
      for (const evtId of loc.eventIds) {
        expect(eventIds.has(evtId), `Unknown eventId ${evtId} on ${loc.id}`).toBe(true);
      }
      for (const vId of loc.verseIds) {
        expect(getVerseById(vId), `Missing location verse ${vId}`).toBeDefined();
      }
    }

    for (const journey of BIBLICAL_JOURNEYS) {
      for (const wp of journey.waypoints) {
        for (const vId of wp.verseIds) {
          expect(getVerseById(vId), `Missing journey waypoint verse ${vId}`).toBeDefined();
        }
      }
    }

    for (const article of SANCTUARY_ARTICLES) {
      for (const vId of article.verseIds) {
        expect(getVerseById(vId), `Missing sanctuary verse ${vId}`).toBeDefined();
      }
      for (const conn of article.canonicalConnections) {
        for (const vId of conn.verseIds) {
          expect(getVerseById(vId), `Missing sanctuary connection verse ${vId}`).toBeDefined();
        }
      }
    }
  });
});

describe('Scripture Graph traversal, shortest path & epistemic filtering', () => {
  it('builds deduplicated depth-bounded subgraphs', () => {
    const depth1 = buildGraphAtDepth('JHN.3.16', 1, undefined, 65);
    const depth2 = buildGraphAtDepth('JHN.3.16', 2, undefined, 65);

    expect(depth1.nodeIds[0]).toBe('JHN.3.16');
    expect(new Set(depth1.nodeIds).size).toBe(depth1.nodeIds.length);
    expect(depth2.nodeIds.length).toBeGreaterThanOrEqual(depth1.nodeIds.length);
    for (const id of depth2.nodeIds) {
      expect(depth2.depthMap[id]).toBeLessThanOrEqual(2);
    }
  });

  it('finds shortest canonical scripture paths across testaments', () => {
    const creationToNewCreation = findShortestScripturePath('GEN.1.1', 'REV.21.1');
    expect(creationToNewCreation).not.toBeNull();
    expect(creationToNewCreation!.nodeIds[0]).toBe('GEN.1.1');
    expect(creationToNewCreation!.nodeIds.at(-1)).toBe('REV.21.1');
    expect(creationToNewCreation!.steps.length).toBeGreaterThan(0);

    const sanctuaryPath = findShortestScripturePath('EXO.25.9', 'HEB.8.5');
    expect(sanctuaryPath).not.toBeNull();
    expect(sanctuaryPath!.nodeIds[0]).toBe('EXO.25.9');
    expect(sanctuaryPath!.nodeIds.at(-1)).toBe('HEB.8.5');

    const tabernacleToConsummation = findShortestScripturePath('EXO.25.8', 'GEN.1.1');
    expect(tabernacleToConsummation).not.toBeNull();
    expect(tabernacleToConsummation!.nodeIds[0]).toBe('EXO.25.8');
    expect(tabernacleToConsummation!.nodeIds.at(-1)).toBe('GEN.1.1');
  });

  it('strictly enforces explicit_biblical vs scholarly_interpretive filtering', () => {
    const explicitOnly = getConnectedPassages('GEN.3.15', undefined, 'explicit_biblical');
    for (const item of explicitOnly) {
      expect(item.edge.epistemicNature).toBe('explicit_biblical');
    }

    const scholarlyRows = queryRelationshipDatabase({ epistemic: 'scholarly_interpretive' });
    expect(scholarlyRows.length).toBeGreaterThan(0);
    for (const edge of scholarlyRows) {
      expect(edge.epistemicNature).toBe('scholarly_interpretive');
    }
  });
});

describe('Cross-module reverse lookups & study archive portability', () => {
  it('resolves locations, sanctuary articles, timeline events, and rich event context', () => {
    const exoLocs = getLocationsForVerse('EXO.25.8');
    expect(exoLocs.some((l) => l.id === 'loc-sinai')).toBe(true);

    const matLocs = getLocationsForVerse('MAT.27.46');
    expect(matLocs.some((l) => l.id === 'loc-jerusalem')).toBe(true);

    const exoSanc = getSanctuaryForVerse('EXO.25.8');
    expect(exoSanc.length).toBeGreaterThan(0);

    const jhnEvents = getEventsForVerse('JHN.3.16');
    expect(jhnEvents.length).toBeGreaterThan(0);

    const exodusEvent = BIBLICAL_EVENTS.find((e) => e.id === 'evt-exodus-sinai')!;
    const ctx = getCrossModuleContextForEvent(exodusEvent);
    expect(ctx.locations.length).toBeGreaterThan(0);
    expect(ctx.journeys.length).toBeGreaterThan(0);
    expect(ctx.sanctuaryArticles.length).toBeGreaterThan(0);
    expect(ctx.relatedThemes.length).toBeGreaterThan(0);
  });

  it('round-trips JSON & Markdown export/import and merges/replaces cleanly', () => {
    const base = createInitialStudyState();
    const json = exportStudyStateAsJson(base);
    const parsed = parseAndValidateStudyImport(json);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state.bookmarks).toEqual(base.bookmarks);
      expect(parsed.state.collections.length).toBe(base.collections.length);

      const incoming = {
        ...parsed.state,
        bookmarks: ['ROM.8.38', 'GEN.1.1'],
        notes: { 'ROM.8.38': 'Nothing can separate us from the love of God.' },
      };

      const merged = mergeStudyStates(base, incoming, 'merge');
      expect(merged.bookmarks).toContain('ROM.8.38');
      expect(merged.bookmarks).toContain('JHN.3.16');
      expect(merged.notes['JHN.3.16']).toBeTruthy();
      expect(merged.notes['ROM.8.38']).toBeTruthy();

      const replaced = mergeStudyStates(base, incoming, 'replace');
      expect(replaced.bookmarks).toEqual(['ROM.8.38', 'GEN.1.1']);
      expect(replaced.notes['JHN.3.16']).toBeUndefined();
    }

    const badJson = parseAndValidateStudyImport('{"foo":"bar"}');
    expect(badJson.ok).toBe(false);

    const malformed = parseAndValidateStudyImport('not json at all');
    expect(malformed.ok).toBe(false);

    const markdown = exportStudyStateAsMarkdown(base, getVerseById);
    expect(markdown).toContain('# Scripture Atlas Study Archive');
    expect(markdown).toContain('John 3:16');
    expect(markdown).toContain('## Bookmarks');
    expect(markdown).toContain('## Collections');
  });
});

describe('Two-tier TSK cross-references, Canon Index & ASV/YLT translations', () => {
  it('loads canonical 66-book index and 30,000-edge TSK head graph', async () => {
    const canon = await loadCanonIndex();
    expect(canon.totalVerses).toBe(31102);
    expect(canon.books).toHaveLength(66);
    expect(canon.books[0].id).toBe('GEN');
    expect(canon.books[65].id).toBe('REV');

    const head = await loadTskCanonHead();
    expect(head.totalCount).toBe(344753);
    expect(head.headCount).toBe(30000);
    expect(head.from).toHaveLength(30000);
    expect(head.to).toHaveLength(30000);
    expect(head.votes).toHaveLength(30000);

    const jhnLinks = await loadTskConnectionsForVerse('JHN.3.16');
    expect(jhnLinks.length).toBeGreaterThan(5);
    expect(jhnLinks.every((l) => l.votes >= 0 && (l.direction === 'out' || l.direction === 'in'))).toBe(true);
  });

  it('loads ASV and YLT translations alongside KJV for parallel reading', async () => {
    const asvJohn = await loadBookTranslation('JHN', 'ASV');
    const yltJohn = await loadBookTranslation('JHN', 'YLT');
    expect(asvJohn.length).toBeGreaterThan(800);
    expect(yltJohn.length).toBeGreaterThan(800);

    const asvCh3 = getChapterVersesInTranslation('JHN', 3, 'ASV');
    const yltCh3 = getChapterVersesInTranslation('JHN', 3, 'YLT');
    expect(asvCh3.find((v) => v.id === 'JHN.3.16')?.text).toContain('only begotten Son');
    expect(yltCh3.find((v) => v.id === 'JHN.3.16')?.translation).toBe('YLT');
  });
});

describe('Smart reference parser, full-corpus search, URL routing & reading progress', () => {
  it('parses abbreviations and OSIS IDs and runs progressive full-corpus search', async () => {
    const abbrev1 = searchScripture('1Cor 13:4');
    expect(abbrev1.some((r) => r.verseId === '1CO.13.4')).toBe(true);

    const abbrev2 = searchScripture('Ps 23');
    expect(abbrev2.some((r) => r.bookId === 'PSA' && r.chapter === 23)).toBe(true);

    const osis = searchScripture('JHN.3.16');
    expect(osis.some((r) => r.verseId === 'JHN.3.16')).toBe(true);

    const corpusMatches = await searchFullCorpus('still small voice', { maxResults: 10 });
    expect(corpusMatches.some((r) => r.verseId === '1KI.19.12')).toBe(true);
  }, 20000);

  it('round-trips deep-link URLs and persists reading progress and translation', () => {
    const graphUrl = buildUrlFromState({
      activeSection: 'graph',
      anchorVerseId: 'ROM.8.28',
      pathTargetId: 'GEN.50.20',
      graphViewMode: 'canon_arc',
      readerBookId: 'ROM',
      readerChapter: 8,
      readerVerseId: 'ROM.8.28',
      translation: 'KJV',
    });
    expect(graphUrl).toBe('/graph?anchor=ROM.8.28&to=GEN.50.20&view=canon-arc');

    const parsedGraph = parseUrlRoute('/graph', '?anchor=ROM.8.28&to=GEN.50.20&view=canon-arc');
    expect(parsedGraph.section).toBe('graph');
    expect(parsedGraph.anchorVerseId).toBe('ROM.8.28');
    expect(parsedGraph.pathTargetId).toBe('GEN.50.20');
    expect(parsedGraph.graphViewMode).toBe('canon_arc');

    const readerUrl = buildUrlFromState({
      activeSection: 'reader',
      anchorVerseId: 'JHN.3.16',
      pathTargetId: null,
      graphViewMode: 'ego',
      readerBookId: 'RUT',
      readerChapter: 2,
      readerVerseId: 'RUT.2.1',
      translation: 'YLT',
    });
    expect(readerUrl).toBe('/reader/RUT/2/1?tr=YLT');

    const parsedReader = parseUrlRoute('/reader/RUT/2/1', '?tr=YLT');
    expect(parsedReader.section).toBe('reader');
    expect(parsedReader.readerBookId).toBe('RUT');
    expect(parsedReader.readerChapter).toBe(2);
    expect(parsedReader.readerVerseId).toBe('RUT.2.1');
    expect(parsedReader.translation).toBe('YLT');

    const parsedGeo = parseUrlRoute('/geography/loc-sinai', '?journey=jrn-exodus');
    expect(parsedGeo.section).toBe('geography');
    expect(parsedGeo.locationId).toBe('loc-sinai');
    expect(parsedGeo.journeyId).toBe('jrn-exodus');

    let state = createInitialStudyState();
    state = toggleReadChapterInState(state, 'GEN', 1);
    expect(state.readChapters).toContain('GEN.1');
    state = toggleReadChapterInState(state, 'GEN', 1);
    expect(state.readChapters).not.toContain('GEN.1');
    state = setPreferredTranslationInState(state, 'ASV');
    expect(state.preferredTranslation).toBe('ASV');
  });
});

describe("Strong's Interlinear, Lexicon, 66x66 Matrix, Full-Bible Path, Custom Edges & New Routes", () => {
  it("parses Strong's tokens and loads Hebrew/Greek dictionaries & reverse concordance", async () => {
    const parsedTokens = parseStrongsTaggedText(
      'In the beginning[H7225] God[H430] created[H1254][H853] the heaven[H8064].'
    );
    expect(parsedTokens.some((t) => t.strongsIds.includes('H7225'))).toBe(true);
    expect(parsedTokens.some((t) => t.strongsIds.includes('H430'))).toBe(true);
    expect(parsedTokens.some((t) => t.strongsIds.includes('H853'))).toBe(true);

    const genStrongs = await loadBookStrongsVerses('GEN');
    expect(genStrongs.get('GEN.1.1')).toContain('[H7225]');

    const jhnTokens = await getVerseStrongsTokensAsync('JHN.1.1');
    expect(jhnTokens.some((t) => t.strongsIds.includes('G3056'))).toBe(true);

    const h7225 = await getStrongsEntryAsync('H7225');
    expect(h7225).toBeDefined();
    expect(h7225!.id).toBe('H7225');
    expect(h7225!.def).toBeTruthy();

    const g3056 = await getStrongsEntryAsync('G3056');
    expect(g3056).toBeDefined();
    expect(g3056!.id).toBe('G3056');
    expect(g3056!.lemma).toBeTruthy();

    const agapeOcc = await getStrongsOccurrencesAsync('G26');
    expect(agapeOcc).toBeDefined();
    expect(agapeOcc!.c).toBeGreaterThan(20);
    expect(agapeOcc!.v.length).toBeGreaterThan(10);
  });

  it('loads 66x66 canonical TSK cross-reference book matrix', async () => {
    const matrix = await loadTskBookMatrix();
    expect(matrix.bookIds).toHaveLength(66);
    expect(matrix.counts).toHaveLength(66);
    expect(matrix.counts[0]).toHaveLength(66);
    expect(matrix.totalDirectedSamples).toBeGreaterThan(300000);
    expect(matrix.otToNtCount).toBeGreaterThan(10000);
    expect(matrix.maxCrossBookCount).toBeGreaterThan(1000);
  });

  it('traces full-bible weighted shortest path across non-Tier-1 books via TSK network', async () => {
    const path = await findFullBiblePathAsync('RUT.2.1', 'REV.21.1', { mode: 'tsk' });
    expect(path).not.toBeNull();
    expect(path!.nodeIds[0]).toBe('RUT.2.1');
    expect(path!.nodeIds.at(-1)).toBe('REV.21.1');
    expect(path!.edges.length).toBe(path!.nodeIds.length - 1);
  }, 15000);

  it('persists, merges, and round-trips user-authored customEdges and matrix/shared URLs', () => {
    const customEdge: CrossReferenceEdge = {
      id: 'custom-test-1',
      source: 'RUT.2.12',
      target: 'PSA.91.4',
      relationship: 'allusion',
      epistemicNature: 'scholarly_interpretive',
      editorialStatus: 'curated_sample',
      confidence: 'high',
      sourceAttribution: 'Personal Study Note',
      explanation: 'Refuge under the wings of the Almighty.',
    };

    let state = createInitialStudyState();
    state = addCustomEdgeInState(state, customEdge);
    expect(state.customEdges).toHaveLength(1);

    const exported = exportStudyStateAsJson(state);
    const parsed = parseAndValidateStudyImport(exported);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state.customEdges).toHaveLength(1);
      expect(parsed.state.customEdges![0].id).toBe('custom-test-1');
    }

    const base = createInitialStudyState();
    const merged = mergeStudyStates(base, state, 'merge');
    expect(merged.customEdges).toHaveLength(1);

    state = removeCustomEdgeInState(state, 'custom-test-1');
    expect(state.customEdges).toHaveLength(0);

    const matrixUrl = buildUrlFromState({
      activeSection: 'graph',
      anchorVerseId: 'JHN.3.16',
      pathTargetId: null,
      graphViewMode: 'canon_matrix',
      readerBookId: 'JHN',
      readerChapter: 3,
      readerVerseId: 'JHN.3.16',
      translation: 'KJV',
    });
    expect(matrixUrl).toContain('view=canon-matrix');

    const parsedMatrix = parseUrlRoute('/graph', '?view=canon-matrix');
    expect(parsedMatrix.section).toBe('graph');
    expect(parsedMatrix.graphViewMode).toBe('canon_matrix');

    const parsedShared = parseUrlRoute('/', '?shared=gospel-123abc');
    expect(parsedShared.section).toBe('collections');
    expect(parsedShared.sharedId).toBe('gospel-123abc');

    const guideUrl = buildUrlFromState({
      activeSection: 'guide',
      anchorVerseId: 'JHN.3.16',
      pathTargetId: null,
      graphViewMode: 'ego',
      readerBookId: 'JHN',
      readerChapter: 3,
      readerVerseId: 'JHN.3.16',
      translation: 'KJV',
    });
    expect(guideUrl).toBe('/guide');
    expect(parseUrlRoute('/guide', '').section).toBe('guide');
  });
});


