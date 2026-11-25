import { RelationshipMeta, RelationshipType } from '../types/scripture';

export interface EnhancedRelationshipMeta extends RelationshipMeta {
  arrowShape: 'triangle' | 'vee' | 'diamond' | 'none' | 'circle' | 'chevron' | 'tee';
  bidirectional?: boolean;
  dashPattern?: number[];
}

export const RELATIONSHIP_METADATA: Record<RelationshipType, EnhancedRelationshipMeta> = {
  direct_quotation: {
    id: 'direct_quotation',
    label: 'Quotations',
    shortLabel: 'Quotation',
    description: 'Explicit verbal citation of an earlier biblical passage by a later writer or speaker.',
    color: '#E09A5E', // Burnished copper
    lineStyle: 'solid',
    width: 2.5,
    arrowShape: 'triangle',
  },
  allusion: {
    id: 'allusion',
    label: 'Allusions',
    shortLabel: 'Allusion',
    description: 'Intentional literary echo or indirect reference to earlier biblical phrasing, imagery, or covenant motifs.',
    color: '#67B7D1', // Slate azure
    lineStyle: 'dashed',
    dashPattern: [6, 3],
    width: 2.2,
    arrowShape: 'vee',
  },
  prophecy_fulfillment: {
    id: 'prophecy_fulfillment',
    label: 'Prophecy & Fulfillment',
    shortLabel: 'Prophecy',
    description: 'Predictive covenant or messianic promise linked to its historical or eschatological fulfillment.',
    color: '#4EC498', // Verdigris celadon
    lineStyle: 'solid',
    width: 2.4,
    arrowShape: 'vee',
  },
  typology: {
    id: 'typology',
    label: 'Typology',
    shortLabel: 'Typology',
    description: 'Old Testament persons, offices, or sanctuary rituals foreshadowing New Testament reality in Christ.',
    color: '#C48FDB', // Archival amethyst
    lineStyle: 'dashed',
    dashPattern: [8, 4],
    width: 2.1,
    arrowShape: 'diamond',
  },
  parallel: {
    id: 'parallel',
    label: 'Parallel Accounts',
    shortLabel: 'Parallel',
    description: 'Synoptic, historical, or structural parallel recounting the same event or teaching.',
    color: '#84C98B', // Olive sage
    lineStyle: 'solid',
    width: 2.0,
    arrowShape: 'triangle',
    bidirectional: true,
  },
  thematic: {
    id: 'thematic',
    label: 'Shared Themes',
    shortLabel: 'Theme',
    description: 'Shared theological motif or redemptive doctrine developed across canonical books.',
    color: '#7B9FE8', // Lapis slate
    lineStyle: 'dashed',
    dashPattern: [4, 4],
    width: 1.75,
    arrowShape: 'none',
  },
  historical: {
    id: 'historical',
    label: 'Historical Relationships',
    shortLabel: 'Historical',
    description: 'Chronological, covenantal, or narrative continuity linking historical events across eras.',
    color: '#E5A93C', // Amber ochre
    lineStyle: 'dotted',
    width: 2.0,
    arrowShape: 'chevron',
  },
  linguistic: {
    id: 'linguistic',
    label: 'Linguistic Echoes',
    shortLabel: 'Linguistic',
    description: 'Shared Hebrew, Aramaic, or Greek vocabulary, idiom, or Septuagint lexical overlap.',
    color: '#E47B96', // Madder rose
    lineStyle: 'dotted',
    width: 1.9,
    arrowShape: 'circle',
  },
};

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  'direct_quotation',
  'allusion',
  'prophecy_fulfillment',
  'typology',
  'parallel',
  'thematic',
  'historical',
  'linguistic',
];

export const EPISTEMIC_META: Record<
  'explicit_biblical' | 'scholarly_interpretive',
  { label: string; shortLabel: string; description: string; color: string }
> = {
  explicit_biblical: {
    label: 'Explicit Biblical',
    shortLabel: 'Explicit Biblical',
    description:
      'Direct quotation, explicit citation formula ("as it is written"), immediate textual parallel, or unmistakable verbal reuse within Scripture.',
    color: '#4EC498',
  },
  scholarly_interpretive: {
    label: 'Scholarly / Interpretive',
    shortLabel: 'Scholarly / Interpretive',
    description:
      'Canonical typology, prophetic-thematic synthesis, or historical-theological linkage established through comparative biblical exegesis.',
    color: '#D4894A',
  },
};

export const EDITORIAL_STATUS_META: Record<
  'verified_textual' | 'curated_sample',
  { label: string; description: string }
> = {
  verified_textual: {
    label: 'Verified Textual',
    description:
      'Directly verifiable from explicit wording, citation formulas, or synoptic parallels in the KJV text.',
  },
  curated_sample: {
    label: 'Curated Sample',
    description:
      'Curated thematic, typological, or canonical connection included in the Scripture Atlas sample corpus.',
  },
};

export const CONFIDENCE_META: Record<'high' | 'moderate', { label: string }> = {
  high: { label: 'High Confidence' },
  moderate: { label: 'Moderate Confidence' },
};

