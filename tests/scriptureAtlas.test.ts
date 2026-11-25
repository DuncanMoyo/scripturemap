import { describe, expect, it } from 'vitest';
import { BIBLICAL_EVENTS } from '../src/data/atlasModules';
import { BIBLE_BOOKS } from '../src/data/books';
import { CROSS_REFERENCES } from '../src/data/crossReferences';
import { BIBLICAL_JOURNEYS, BIBLICAL_LOCATIONS } from '../src/data/geography';
import { SANCTUARY_ARTICLES } from '../src/data/sanctuary';
import { BIBLICAL_THEMES } from '../src/data/themes';
import {
  buildGraphAtDepth,
  findShortestScripturePath,
  getAvailableChaptersForBook,
  getChapterVerses,
  getConnectedPassages,
  getCrossModuleContextForEvent,
  getDatasetSummary,
  getEventsForVerse,
  getLocationsForVerse,
  getSanctuaryForVerse,
  getVerseById,
  loadBookKjv,
  queryRelationshipDatabase,
  searchScripture,
} from '../src/services/scriptureService';
import {
  createInitialStudyState,
  exportStudyStateAsJson,
  exportStudyStateAsMarkdown,
  mergeStudyStates,
  parseAndValidateStudyImport,
} from '../src/services/storageRepository';

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
