import React from 'react';
import {
  BookOpen,
  CircleHelp,
  Compass,
  FolderKanban,
  GitFork,
  History,
  Landmark,
  Layers,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  X,
} from 'lucide-react';
import { getDatasetSummary } from '../services/scriptureService';
import { AtlasTheme, NavSection } from '../types/scripture';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  bookmarkCount: number;
  collectionCount: number;
  readChaptersCount: number;
  atlasTheme: AtlasTheme;
  onToggleTheme: () => void;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'primary' | 'atlas' | 'personal';
}

const TOTAL_CANON_CHAPTERS = 1189;

const NAV_ITEMS: NavItem[] = [
  { id: 'graph', label: 'Bible Graph', icon: GitFork, group: 'primary' },
  { id: 'reader', label: 'Explore Scripture', icon: BookOpen, group: 'primary' },
  { id: 'themes', label: 'Themes', icon: Layers, group: 'primary' },
  { id: 'timeline', label: 'Biblical Timeline', icon: History, group: 'atlas' },
  { id: 'geography', label: 'Biblical Geography', icon: Compass, group: 'atlas' },
  { id: 'sanctuary', label: 'Sanctuary Explorer', icon: Landmark, group: 'atlas' },
  { id: 'collections', label: 'Study Collections', icon: FolderKanban, group: 'personal' },
  { id: 'guide', label: 'Study Guide', icon: CircleHelp, group: 'personal' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  bookmarkCount,
  collectionCount,
  readChaptersCount,
  atlasTheme,
  onToggleTheme,
}) => {
  const summary = getDatasetSummary();
  const progressPct = Math.min(100, Math.round((readChaptersCount / TOTAL_CANON_CHAPTERS) * 100));

  const renderGroup = (group: NavItem['group'], heading: string) => {
    const items = NAV_ITEMS.filter((i) => i.group === group);
    return (
      <div className="mb-5">
        {!collapsed && (
          <div className="px-3 mb-2 text-[11px] font-medium tracking-wider text-[var(--atlas-text-subtle)] uppercase select-none">
            {heading}
          </div>
        )}
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--atlas-accent)] ${
                  isActive
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/35'
                    : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)]/65 border border-transparent'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[var(--atlas-accent)]' : 'text-[var(--atlas-text-subtle)]'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!collapsed && item.id === 'collections' && (
                  <span className="text-[11px] font-mono tabular-nums text-[var(--atlas-text-subtle)]">
                    {collectionCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--atlas-surface)] border-r border-[var(--atlas-border)] select-none">
      {/* Sidebar header */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-[var(--atlas-border)] shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-1 min-w-0">
            <span className="w-2 h-2 rotate-45 bg-[var(--atlas-accent)] shrink-0" aria-hidden="true" />
            <span className="font-scripture text-base font-semibold tracking-tight text-[var(--atlas-heading)] truncate">
              Scripture Atlas
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)] transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4" aria-label="Primary navigation">
        {renderGroup('primary', 'Workspace')}
        {renderGroup('atlas', 'Reference Modules')}
        {renderGroup('personal', 'Library')}
      </nav>

      {/* Theme Toggle & Install PWA */}
      <div className="px-3 py-2.5 border-t border-[var(--atlas-border)] space-y-2">
        <button
          type="button"
          onClick={onToggleTheme}
          title={atlasTheme === 'dark' ? 'Switch to Vellum Parchment (Light)' : 'Switch to Obsidian Umber (Dark)'}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-heading)] bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border)] transition-colors whitespace-nowrap ${
            collapsed ? 'justify-center px-0' : 'justify-between'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            {atlasTheme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-[var(--atlas-accent)] shrink-0" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[var(--atlas-accent)] shrink-0" />
            )}
            {!collapsed && (
              <span className="truncate">
                {atlasTheme === 'dark' ? 'Vellum Light Mode' : 'Obsidian Dark Mode'}
              </span>
            )}
          </span>
        </button>

        <PWAInstallButton collapsed={collapsed} />
      </div>

      {/* Footer dataset & reading progress */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-[var(--atlas-border)] text-xs text-[var(--atlas-text-subtle)] space-y-1.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[var(--atlas-text-muted)]">
              <span>Reading Progress</span>
              <span className="font-mono tabular-nums text-[var(--atlas-secondary)]">
                {readChaptersCount} / {TOTAL_CANON_CHAPTERS.toLocaleString()} ch
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--atlas-bg)] overflow-hidden border border-[var(--atlas-border)]">
              <div
                className="h-full bg-[var(--atlas-secondary)] transition-all duration-300"
                style={{ width: `${Math.max(progressPct, readChaptersCount > 0 ? 2 : 0)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-[var(--atlas-text-muted)] pt-0.5">
            <span>Canon ({summary.totalCanonicalBooks} Books)</span>
            <span className="font-mono tabular-nums">
              {summary.totalFullKjvVerses.toLocaleString()} vv.
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Curated + TSK edges</span>
            <span className="font-mono tabular-nums">{summary.crossReferenceCount} + 344k</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Bookmarks saved</span>
            <span className="font-mono tabular-nums">{bookmarkCount}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-200 ease-out ${
          collapsed ? 'w-[62px]' : 'w-[244px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[264px] h-full">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
};
