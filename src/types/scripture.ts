export type Testament = 'OT' | 'NT';

export type BibleTranslationId = 'KJV' | 'ASV' | 'YLT';

export type AtlasTheme = 'dark' | 'light';

export type GraphViewMode = 'ego' | 'canon_arc' | 'canon_ring';

export type NavSection =
  | 'graph'
  | 'reader'
  | 'themes'
  | 'timeline'
  | 'geography'
  | 'sanctuary'
  | 'collections';

export type RelationshipType =
  | 'direct_quotation'
  | 'allusion'
  | 'prophecy_fulfillment'
  | 'typology'
  | 'thematic'
  | 'parallel'
  | 'historical'
  | 'linguistic';

export type EpistemicNature = 'explicit_biblical' | 'scholarly_interpretive';
export type EditorialStatus = 'verified_textual' | 'curated_sample';
export type ConfidenceLevel = 'high' | 'moderate';

export interface RelationshipMeta {
  id: RelationshipType;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  width: number;
}

export type VerseId = string; // Canonical OSIS-style ID e.g. "GEN.1.1", "JHN.3.16"

export type CanonDivision =
  | 'Pentateuch'
  | 'History'
  | 'Wisdom & Poetry'
  | 'Major Prophets'
  | 'Minor Prophets'
  | 'Gospels'
  | 'Acts'
  | 'Pauline Epistles'
  | 'General Epistles'
  | 'Apocalyptic';

export interface BibleBook {
  id: string; // e.g., "GEN"
  name: string; // e.g., "Genesis"
  shortName: string; // e.g., "Gen"
  testament: Testament;
  division: CanonDivision;
  chapterCount: number;
  order: number;
}

export interface BibleChapter {
  id: string; // e.g., "GEN.1"
  bookId: string;
  chapterNumber: number;
  title?: string;
  verseIds: VerseId[];
}

export interface Verse {
  id: VerseId;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  reference: string; // e.g., "Genesis 1:1"
  shortRef: string; // e.g., "Gen 1:1"
  testament: Testament;
  text: string;
  translation: BibleTranslationId;
  keyTerms?: string[];
}

export interface CrossReferenceEdge {
  id: string;
  source: VerseId;
  target: VerseId;
  relationship: RelationshipType;
  epistemicNature: EpistemicNature;
  editorialStatus: EditorialStatus;
  confidence: ConfidenceLevel;
  sourceAttribution: string;
  explanation: string;
  supportingEvidence?: string;
  direction?: 'directed' | 'bidirectional';
}

export interface TskCrossReference {
  targetVerseId: VerseId;
  votes: number;
  direction: 'out' | 'in';
}

export interface CanonBookIndex {
  id: string;
  name: string;
  shortName: string;
  testament: Testament;
  division: CanonDivision;
  order: number;
  firstVerseIdx: number;
  verseCount: number;
  chapterVerseCounts: number[];
}

export interface CanonIndex {
  totalVerses: number;
  books: CanonBookIndex[];
}

export interface CanonHeadGraph {
  totalCount: number;
  headCount: number;
  from: number[];
  to: number[];
  votes: number[];
}

export interface CorpusSearchProgress {
  loadedBooks: number;
  totalBooks: number;
  done: boolean;
  matches: SearchResult[];
}

export interface ThemeEvolutionStage {
  id: string;
  stageOrder: number;
  canonPeriod: string;
  testament: Testament;
  title: string;
  developmentNote: string;
  verseIds: VerseId[];
}

export interface Theme {
  id: string;
  name: string;
  summary: string;
  keyQuestion: string;
  verseIds: VerseId[];
  featuredAnchorId: VerseId;
  evolutionStages: ThemeEvolutionStage[];
}

export interface StudyCollection {
  id: string;
  title: string;
  description: string;
  verseIds: VerseId[];
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BiblicalEvent {
  id: string;
  title: string;
  era: string;
  approximateDate: string;
  sortOrder: number;
  summary: string;
  verseIds: VerseId[];
}

export type LocationCategory = 'city' | 'region' | 'river' | 'mountain';

export type BiblicalPeriodId =
  | 'patriarchal'
  | 'exodus_wilderness'
  | 'monarchy_prophets'
  | 'exile_return'
  | 'gospels'
  | 'apostolic';

export type CoordinateCertainty =
  | 'established'
  | 'probable'
  | 'traditional_approximate';

export type JourneyCategory =
  | 'patriarchs'
  | 'exodus_israel'
  | 'ministry_jesus'
  | 'missionary_paul';

export interface BiblicalLocation {
  id: string;
  name: string;
  historicalNames: string[];
  category: LocationCategory;
  region: string;
  periods: BiblicalPeriodId[];
  coordinates: { lat: number; lng: number };
  certainty: CoordinateCertainty;
  uncertaintyRadiusKm?: number;
  coordinateNote: string;
  description: string;
  significance: string;
  eventIds: string[];
  verseIds: VerseId[];
  additionalReferences?: string[];
  pathGeometry?: [number, number][];
}

export interface JourneyWaypoint {
  order: number;
  locationId?: string;
  name: string;
  coordinates: { lat: number; lng: number };
  certainty: CoordinateCertainty;
  summary: string;
  verseIds: VerseId[];
  scriptureRefs: string[];
}

export interface BiblicalJourney {
  id: string;
  title: string;
  figure: string;
  category: JourneyCategory;
  period: BiblicalPeriodId;
  approximateDate: string;
  routeCertaintyNote: string;
  summary: string;
  color: string;
  waypoints: JourneyWaypoint[];
  eventIds: string[];
}

export type SanctuaryCompartment = 'Outer Court' | 'Holy Place' | 'Most Holy Place';
export type SanctuaryElementKind = 'compartment' | 'furnishing' | 'boundary';

export interface SanctuaryScriptureConnection {
  label: string;
  otRef: string;
  ntRef?: string;
  epistemicNature: EpistemicNature;
  note: string;
  verseIds: VerseId[];
}

export interface SanctuaryArticle {
  id: string;
  order: number;
  name: string;
  hebrewTerm?: string;
  kind: SanctuaryElementKind;
  compartment: SanctuaryCompartment;
  dimensions: string;
  material: string;
  biblicalDescription: string;
  construction: string;
  purpose: string;
  otTextualBasis: string[];
  symbolism: string;
  ntFulfillment: string;
  canonicalConnections: SanctuaryScriptureConnection[];
  verseIds: VerseId[];
}

export type HighlightColor = 'gold' | 'teal' | 'rose' | 'indigo';

export interface SavedGraphConfig {
  id: string;
  name: string;
  anchorVerseId: VerseId;
  visibleNodeIds: VerseId[];
  activeRelationships: RelationshipType[];
  layout: GraphLayoutType;
  createdAt: string;
}

export type GraphLayoutType = 'cose' | 'concentric' | 'breadthfirst' | 'circle';

export interface UserStudyState {
  bookmarks: VerseId[];
  highlights: Record<VerseId, HighlightColor>;
  notes: Record<VerseId, string>;
  collections: StudyCollection[];
  recentSearches: string[];
  savedGraphs: SavedGraphConfig[];
  readChapters: string[];
  preferredTranslation?: BibleTranslationId;
}

export interface SearchResult {
  type: 'verse' | 'book' | 'chapter' | 'theme' | 'location' | 'sanctuary';
  id: string;
  title: string;
  subtitle: string;
  snippet?: string;
  verseId?: VerseId;
  bookId?: string;
  chapter?: number;
  themeId?: string;
  locationId?: string;
  sanctuaryId?: string;
}
