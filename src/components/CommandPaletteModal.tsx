import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CircleHelp,
  Command,
  Compass,
  FolderKanban,
  GitFork,
  Grid3X3,
  History,
  Landmark,
  Layers,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { BIBLICAL_LOCATIONS } from '../data/geography';
import { SANCTUARY_ARTICLES } from '../data/sanctuary';
import { BIBLICAL_THEMES } from '../data/themes';
import { searchScripture } from '../services/scriptureService';
import {
  AtlasTheme,
  BibleTranslationId,
  GraphViewMode,
  NavSection,
  VerseId,
} from '../types/scripture';

interface CommandPaletteModalProps {
  open: boolean;
  onClose: () => void;
  atlasTheme: AtlasTheme;
  onToggleTheme: () => void;
  translation: BibleTranslationId;
  onChangeTranslation: (tr: BibleTranslationId) => void;
  onSelectSection: (section: NavSection) => void;
  onSelectGraphMode: (mode: GraphViewMode) => void;
  onOpenInGraph: (verseId: VerseId) => void;
  onOpenInReader: (bookId: string, chapter: number, verseId?: VerseId) => void;
  onOpenTheme: (themeId: string) => void;
  onOpenLocation: (locationId: string) => void;
  onOpenSanctuary: (sanctuaryId: string) => void;
}

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  subtitle: string;
  keywords: string;
  icon: 'graph' | 'reader' | 'theme' | 'geo' | 'sanctuary' | 'timeline' | 'collections' | 'matrix' | 'guide' | 'action';
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  open,
  onClose,
  atlasTheme,
  onToggleTheme,
  translation,
  onChangeTranslation,
  onSelectSection,
  onSelectGraphMode,
  onOpenInGraph,
  onOpenInReader,
  onOpenTheme,
  onOpenLocation,
  onOpenSanctuary,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const staticItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [
      {
        id: 'nav-graph-ego',
        group: 'Views',
        label: 'Bible Graph · Ego Network (2D)',
        subtitle: 'Interactive cross-reference & shortest-path explorer',
        keywords: 'graph network 2d cytoscape path',
        icon: 'graph',
        action: () => {
          onSelectSection('graph');
          onSelectGraphMode('ego');
        },
      },
      {
        id: 'nav-graph-arc',
        group: 'Views',
        label: 'Bible Graph · Canon Arc (3D)',
        subtitle: '344,753 TSK links arcing across all 66 books',
        keywords: '3d arc tsk canon overview',
        icon: 'graph',
        action: () => {
          onSelectSection('graph');
          onSelectGraphMode('canon_arc');
        },
      },
      {
        id: 'nav-graph-ring',
        group: 'Views',
        label: 'Bible Graph · Canon Ring (3D)',
        subtitle: 'Circular Old & New Testament resonance chord ring',
        keywords: '3d ring chord tsk canon',
        icon: 'graph',
        action: () => {
          onSelectSection('graph');
          onSelectGraphMode('canon_ring');
        },
      },
      {
        id: 'nav-graph-matrix',
        group: 'Views',
        label: 'Bible Graph · 66×66 Cross-Reference Matrix (2D)',
        subtitle: 'Orthographic heatmap of OT↔NT cross-reference density',
        keywords: 'matrix heatmap 66x66 canon density tsk',
        icon: 'matrix',
        action: () => {
          onSelectSection('graph');
          onSelectGraphMode('canon_matrix');
        },
      },
      {
        id: 'nav-reader',
        group: 'Views',
        label: 'Explore Scripture · Bible Reader & Strong’s Interlinear',
        subtitle: `Read 66 books in KJV / ASV / YLT (${translation} active)`,
        keywords: 'reader bible interlinear strongs greek hebrew parallel',
        icon: 'reader',
        action: () => onSelectSection('reader'),
      },
      {
        id: 'nav-timeline',
        group: 'Views',
        label: 'Biblical Timeline · Chronological Swimlane',
        subtitle: 'Continuous redemptive chronology from Creation to Consummation',
        keywords: 'timeline chronology history swimlane',
        icon: 'timeline',
        action: () => onSelectSection('timeline'),
      },
      {
        id: 'nav-geo',
        group: 'Views',
        label: 'Biblical Geography · Interactive Map & Journeys',
        subtitle: 'Locations, Exodus route, & Paul’s missionary journeys',
        keywords: 'geography map locations journeys paul exodus',
        icon: 'geo',
        action: () => onSelectSection('geography'),
      },
      {
        id: 'nav-sanctuary',
        group: 'Views',
        label: 'Sanctuary Explorer · 2D Plan & 3D Tabernacle',
        subtitle: 'Interactive Tabernacle stations & Hebrews typology',
        keywords: 'sanctuary tabernacle ark menorah 3d floor plan',
        icon: 'sanctuary',
        action: () => onSelectSection('sanctuary'),
      },
      {
        id: 'nav-collections',
        group: 'Views',
        label: 'Study Collections & Cloud Sync',
        subtitle: 'Bookmarks, saved graphs, custom edges, JSON/Markdown & sharing',
        keywords: 'collections bookmarks cloud firebase sync share',
        icon: 'collections',
        action: () => onSelectSection('collections'),
      },
      {
        id: 'nav-guide',
        group: 'Views',
        label: 'How to Use Scripture Atlas · Full Potential Guide',
        subtitle: 'Workflows, Strong’s interlinear, TSK pathfinding, 3D views & shortcuts',
        keywords: 'guide help tutorial how to use workflows manual shortcuts',
        icon: 'guide',
        action: () => onSelectSection('guide'),
      },
      {
        id: 'act-theme',
        group: 'Preferences',
        label: `Switch to ${atlasTheme === 'dark' ? 'Light Parchment' : 'Dark Obsidian'} Theme`,
        subtitle: 'Updates reading typography, graph, map, and 3D lighting',
        keywords: 'theme dark light parchment mode appearance',
        icon: 'action',
        action: onToggleTheme,
      },
      ...(['KJV', 'ASV', 'YLT'] as BibleTranslationId[]).map((tr) => ({
        id: `act-tr-${tr}`,
        group: 'Preferences',
        label: `Set Translation: ${tr}`,
        subtitle:
          tr === 'KJV'
            ? '1769 King James Version (+ Strong’s tagging)'
            : tr === 'ASV'
            ? '1901 American Standard Version'
            : "1898 Young's Literal Translation",
        keywords: `translation ${tr.toLowerCase()}`,
        icon: 'reader' as const,
        action: () => {
          onChangeTranslation(tr);
          onSelectSection('reader');
        },
      })),
      ...BIBLICAL_THEMES.map((t) => ({
        id: `thm-${t.id}`,
        group: 'Themes',
        label: t.name,
        subtitle: `Biblical Theme · ${t.verseIds.length} passages`,
        keywords: `theme ${t.name.toLowerCase()} ${t.summary.toLowerCase()}`,
        icon: 'theme' as const,
        action: () => onOpenTheme(t.id),
      })),
      ...SANCTUARY_ARTICLES.map((s) => ({
        id: `sanc-${s.id}`,
        group: 'Sanctuary Stations',
        label: s.name,
        subtitle: `${s.compartment} · ${s.dimensions}`,
        keywords: `sanctuary ${s.name.toLowerCase()} ${s.compartment.toLowerCase()}`,
        icon: 'sanctuary' as const,
        action: () => onOpenSanctuary(s.id),
      })),
      ...BIBLICAL_LOCATIONS.slice(0, 14).map((l) => ({
        id: `loc-${l.id}`,
        group: 'Locations',
        label: l.name,
        subtitle: `${l.region} · ${l.category}`,
        keywords: `location place ${l.name.toLowerCase()} ${l.region.toLowerCase()}`,
        icon: 'geo' as const,
        action: () => onOpenLocation(l.id),
      })),
    ];
    return items;
  }, [
    atlasTheme,
    translation,
    onToggleTheme,
    onChangeTranslation,
    onSelectSection,
    onSelectGraphMode,
    onOpenTheme,
    onOpenLocation,
    onOpenSanctuary,
  ]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const dynamicScripture: PaletteItem[] = [];

    if (q) {
      const hits = searchScripture(query).slice(0, 8);
      for (const h of hits) {
        if ((h.type === 'verse' || h.type === 'chapter' || h.type === 'book') && h.verseId) {
          const targetVerse = h.verseId;
          const bId = h.bookId ?? targetVerse.split('.')[0];
          const ch = h.chapter ?? (parseInt(targetVerse.split('.')[1] ?? '1', 10) || 1);
          dynamicScripture.push({
            id: `jump-reader-${h.id}`,
            group: 'Scripture Jump',
            label: `${h.title} — Read Chapter`,
            subtitle: h.snippet ? h.snippet.slice(0, 96) : h.subtitle,
            keywords: h.title.toLowerCase(),
            icon: 'reader',
            action: () => onOpenInReader(bId, ch, targetVerse),
          });
          if (h.type === 'verse') {
            dynamicScripture.push({
              id: `jump-graph-${h.id}`,
              group: 'Scripture Jump',
              label: `${h.title} — Explore in Graph`,
              subtitle: 'Center Bible Graph & reveal cross-references',
              keywords: h.title.toLowerCase(),
              icon: 'graph',
              action: () => onOpenInGraph(targetVerse),
            });
          }
        }
      }
    }

    const matchingStatic = q
      ? staticItems.filter(
          (it) =>
            it.label.toLowerCase().includes(q) ||
            it.subtitle.toLowerCase().includes(q) ||
            it.keywords.includes(q)
        )
      : staticItems.slice(0, 12);

    return [...dynamicScripture, ...matchingStatic].slice(0, 18);
  }, [query, staticItems, onOpenInReader, onOpenInGraph]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const renderIcon = (kind: PaletteItem['icon']) => {
    switch (kind) {
      case 'graph':
        return <GitFork className="w-4 h-4 text-[var(--atlas-accent)]" />;
      case 'matrix':
        return <Grid3X3 className="w-4 h-4 text-[var(--atlas-secondary)]" />;
      case 'reader':
        return <BookOpen className="w-4 h-4 text-[var(--atlas-secondary)]" />;
      case 'theme':
        return <Layers className="w-4 h-4 text-[var(--atlas-accent)]" />;
      case 'geo':
        return <Compass className="w-4 h-4 text-[var(--atlas-secondary)]" />;
      case 'sanctuary':
        return <Landmark className="w-4 h-4 text-[var(--atlas-accent)]" />;
      case 'timeline':
        return <History className="w-4 h-4 text-[var(--atlas-accent)]" />;
      case 'collections':
        return <FolderKanban className="w-4 h-4 text-[var(--atlas-accent)]" />;
      case 'guide':
        return <CircleHelp className="w-4 h-4 text-[var(--atlas-secondary)]" />;
      case 'action':
        return atlasTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-[var(--atlas-accent)]" />
        ) : (
          <Moon className="w-4 h-4 text-[var(--atlas-accent)]" />
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/60 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Scripture Atlas command palette"
      >
        <div className="px-3.5 py-2.5 border-b border-[var(--atlas-border)] flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[var(--atlas-accent)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(filteredItems.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter' && filteredItems[activeIndex]) {
                e.preventDefault();
                filteredItems[activeIndex].action();
                onClose();
              }
            }}
            placeholder="Jump to verse (Rom 8:28), book, module, matrix, Strong’s, or action..."
            className="flex-1 bg-transparent text-sm text-[var(--atlas-heading)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="p-1 text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[54vh] overflow-y-auto divide-y divide-[var(--atlas-border)]">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--atlas-text-muted)]">
              No navigation commands or references matched &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors ${
                    active ? 'bg-[var(--atlas-elevated)]' : 'hover:bg-[var(--atlas-elevated)]/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{renderIcon(item.icon)}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--atlas-heading)] truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[var(--atlas-text-muted)] truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--atlas-text-subtle)] shrink-0">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-3.5 py-2 border-t border-[var(--atlas-border)] bg-[var(--atlas-bg)] flex items-center justify-between text-[10.5px] text-[var(--atlas-text-subtle)]">
          <div className="flex items-center gap-1.5">
            <Command className="w-3 h-3" />
            <span>↑↓ Navigate · Enter Execute · Esc Close</span>
          </div>
          <span className="font-mono">Cmd/Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};
