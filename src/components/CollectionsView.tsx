import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  Cloud,
  CloudOff,
  Copy,
  Download,
  FileText,
  GitFork,
  Link2,
  LogIn,
  LogOut,
  Plus,
  Search,
  Share2,
  Trash2,
  Upload,
} from 'lucide-react';
import { RELATIONSHIP_METADATA } from '../data/relationships';
import {
  deleteSharedCollection,
  listMySharedCollections,
  publishSharedCollection,
} from '../services/firebaseClient';
import {
  formatReferenceFromId,
  getVerseById,
  loadBookKjv,
  searchScripture,
} from '../services/scriptureService';
import {
  exportStudyStateAsJson,
  exportStudyStateAsMarkdown,
  parseAndValidateStudyImport,
} from '../services/storageRepository';
import {
  FirebaseUserSummary,
  SavedGraphConfig,
  SharedStudyCollection,
  UserStudyState,
  VerseId,
} from '../types/scripture';

interface CollectionsViewProps {
  studyState: UserStudyState;
  onCreateCollection: (title: string, description: string) => void;
  onToggleVerseInCollection: (collectionId: string, verseId: VerseId) => void;
  onToggleBookmark: (verseId: VerseId) => void;
  onLoadVersesInGraph: (verseIds: VerseId[], anchorId: VerseId) => void;
  onLoadSavedGraph: (config: SavedGraphConfig) => void;
  onOpenInGraph: (verseId: VerseId) => void;
  onOpenInReader: (bookId: string, chapter: number, verseId: VerseId) => void;
  onImportStudyState: (incoming: UserStudyState, mode: 'merge' | 'replace') => void;
  authUser?: FirebaseUserSummary | null;
  cloudSyncStatus?: 'offline' | 'syncing' | 'synced' | 'error';
  cloudSyncError?: string | null;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  sharedIncoming?: SharedStudyCollection | null;
  sharedLoading?: boolean;
  onImportSharedCollection?: (shared: SharedStudyCollection) => void;
  onDismissSharedCollection?: () => void;
  onDeleteCustomEdge?: (edgeId: string) => void;
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  studyState,
  onCreateCollection,
  onToggleVerseInCollection,
  onToggleBookmark,
  onLoadVersesInGraph,
  onLoadSavedGraph,
  onOpenInGraph,
  onOpenInReader,
  onImportStudyState,
  authUser = null,
  cloudSyncStatus = 'offline',
  cloudSyncError = null,
  onSignInGoogle,
  onSignOut,
  sharedIncoming = null,
  sharedLoading = false,
  onImportSharedCollection,
  onDismissSharedCollection,
  onDeleteCustomEdge,
}) => {
  const [tab, setTab] = useState<'collections' | 'bookmarks' | 'graphs' | 'custom_edges'>(
    'collections'
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    studyState.collections[0]?.id ?? ''
  );
  const [verseSearch, setVerseSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [, setHydratedTick] = useState(0);

  // Public shared collections authored by the signed-in user
  const [myShares, setMyShares] = useState<SharedStudyCollection[]>([]);
  const [publishingShare, setPublishingShare] = useState(false);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<UserStudyState | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const activeCollection =
    studyState.collections.find((c) => c.id === selectedCollectionId) ??
    studyState.collections[0];

  const customEdges = studyState.customEdges ?? [];

  useEffect(() => {
    if (!authUser) {
      setMyShares([]);
      return;
    }
    let mounted = true;
    listMySharedCollections(authUser.uid)
      .then((list) => {
        if (mounted) setMyShares(list);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [authUser]);

  useEffect(() => {
    const neededBookIds = new Set<string>();
    const allIds = [
      ...studyState.bookmarks,
      ...(activeCollection?.verseIds ?? []),
      ...(sharedIncoming?.verseIds ?? []),
      ...customEdges.flatMap((e) => [e.source, e.target]),
    ];
    for (const vId of allIds) {
      if (!getVerseById(vId)) {
        const bookId = vId.split('.')[0];
        if (bookId) neededBookIds.add(bookId);
      }
    }
    if (neededBookIds.size === 0) return;

    Promise.all(Array.from(neededBookIds).map((bId) => loadBookKjv(bId)))
      .then(() => setHydratedTick((t) => t + 1))
      .catch(() => {});
  }, [studyState.bookmarks, activeCollection?.verseIds, sharedIncoming?.verseIds, customEdges]);

  const handlePublishShare = async () => {
    if (!authUser || !activeCollection) return;
    setPublishingShare(true);
    try {
      const created = await publishSharedCollection(authUser, activeCollection);
      setMyShares((prev) => [created, ...prev]);
      const shareUrl = `${window.location.origin}/?shared=${encodeURIComponent(created.shareId)}`;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareUrl).catch(() => {});
      }
      setCopiedShareId(created.shareId);
      window.setTimeout(() => setCopiedShareId(null), 3000);
      setStatusMessage({
        kind: 'success',
        text: `Published "${created.title}" & copied share link to clipboard.`,
      });
    } catch (err) {
      setStatusMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Unable to publish shared link.',
      });
    } finally {
      setPublishingShare(false);
    }
  };

  const handleCopyExistingShare = (shareId: string) => {
    const shareUrl = `${window.location.origin}/?shared=${encodeURIComponent(shareId)}`;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      void navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopiedShareId(shareId);
    window.setTimeout(() => setCopiedShareId(null), 2500);
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      await deleteSharedCollection(shareId);
      setMyShares((prev) => prev.filter((s) => s.shareId !== shareId));
      setStatusMessage({ kind: 'success', text: 'Revoked public share link.' });
    } catch (err) {
      setStatusMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Failed to revoke share link.',
      });
    }
  };

  const verseCandidates = useMemo(() => {
    if (!verseSearch.trim()) return [];
    return searchScripture(verseSearch)
      .filter((r) => r.type === 'verse' && r.verseId)
      .slice(0, 6);
  }, [verseSearch]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateCollection(
      newTitle.trim(),
      newDesc.trim() || 'Custom personal Scripture study collection.'
    );
    setNewTitle('');
    setNewDesc('');
    setShowNewForm(false);
  };

  const handleExportJson = () => {
    const content = exportStudyStateAsJson(studyState);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(`scripture-atlas-backup-${stamp}.json`, content, 'application/json');
    setStatusMessage({ kind: 'success', text: 'Downloaded JSON study archive.' });
  };

  const handleExportMarkdown = () => {
    const content = exportStudyStateAsMarkdown(studyState, getVerseById);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(`scripture-atlas-notes-${stamp}.md`, content, 'text/markdown');
    setStatusMessage({ kind: 'success', text: 'Downloaded Markdown study export.' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const rawText = await file.text();
    const parsed = parseAndValidateStudyImport(rawText);
    if (parsed.ok === false) {
      setStatusMessage({ kind: 'error', text: parsed.error });
      setPendingImport(null);
      return;
    }
    setPendingImport(parsed.state);
    setStatusMessage(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--atlas-bg)]">
      {/* Cloud Sync & Account Bar */}
      <div className="px-5 py-2.5 bg-[var(--atlas-bg)] border-b border-[var(--atlas-border)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 text-xs">
          {authUser ? (
            <>
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={authUser.displayName ?? 'User'}
                  className="w-6 h-6 rounded-full border border-[var(--atlas-border-strong)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Cloud className="w-4 h-4 text-[var(--atlas-secondary)]" />
              )}
              <div className="flex flex-col">
                <span className="font-medium text-[var(--atlas-heading)]">
                  {authUser.displayName ?? authUser.email ?? 'Signed In'}
                </span>
                <span className="text-[11px] text-[var(--atlas-text-muted)]">
                  {cloudSyncStatus === 'syncing'
                    ? 'Syncing study library to cloud...'
                    : cloudSyncStatus === 'synced'
                    ? 'Cloud sync active'
                    : cloudSyncStatus === 'error'
                    ? cloudSyncError ?? 'Sync error'
                    : 'Connected'}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-[var(--atlas-text-muted)]">
              <CloudOff className="w-4 h-4 text-[var(--atlas-text-subtle)]" />
              <span>Local browser storage active · Sign in to sync &amp; publish shared study links</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {authUser && onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--atlas-surface)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text-secondary)]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : onSignInGoogle ? (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--atlas-secondary)] text-[var(--atlas-secondary-contrast)] text-xs font-semibold hover:opacity-90"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Google</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Incoming Shared Collection Banner (?shared=<id>) */}
      {(sharedLoading || sharedIncoming) && (
        <div className="px-5 py-3 bg-[var(--atlas-elevated)] border-b border-[var(--atlas-accent)]/35 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {sharedLoading ? (
            <span className="text-xs text-[var(--atlas-text-muted)]">
              Loading shared Scripture collection...
            </span>
          ) : (
            sharedIncoming && (
              <>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-[var(--atlas-accent-soft)]">
                    Shared Study Collection · By {sharedIncoming.authorLabel} ·{' '}
                    {sharedIncoming.verseIds.length} passages
                  </div>
                  <div className="text-sm font-semibold text-[var(--atlas-heading)] truncate">
                    {sharedIncoming.title}
                  </div>
                  {sharedIncoming.description && (
                    <p className="text-xs text-[var(--atlas-text-secondary)] line-clamp-1">
                      {sharedIncoming.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {sharedIncoming.verseIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onLoadVersesInGraph(sharedIncoming.verseIds, sharedIncoming.verseIds[0])
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] hover:text-[var(--atlas-accent-soft)]"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                      <span>Explore in Graph</span>
                    </button>
                  )}
                  {onImportSharedCollection && (
                    <button
                      type="button"
                      onClick={() => onImportSharedCollection(sharedIncoming)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold hover:bg-[var(--atlas-accent-hover)]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Copy to My Collections</span>
                    </button>
                  )}
                  {onDismissSharedCollection && (
                    <button
                      type="button"
                      onClick={onDismissSharedCollection}
                      className="px-2 py-1 text-xs text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* Sub-navigation & Portability Bar */}
      <div className="px-5 py-3 bg-[var(--atlas-surface)] border-b border-[var(--atlas-border)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
          <button
            type="button"
            onClick={() => setTab('collections')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
              tab === 'collections'
                ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
            }`}
          >
            Collections ({studyState.collections.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('bookmarks')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
              tab === 'bookmarks'
                ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
            }`}
          >
            Bookmarks ({studyState.bookmarks.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('graphs')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
              tab === 'graphs'
                ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
            }`}
          >
            Saved Graphs ({studyState.savedGraphs.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('custom_edges')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
              tab === 'custom_edges'
                ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
            }`}
          >
            Personal Edges ({customEdges.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text-secondary)] whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text-secondary)] whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
            <span>Export Markdown</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text-secondary)] whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-[var(--atlas-text-muted)]" />
            <span>Import Backup</span>
          </button>

          {tab === 'collections' && (
            <button
              type="button"
              onClick={() => setShowNewForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--atlas-elevated)] hover:bg-[var(--atlas-hover)] border border-[var(--atlas-accent)]/40 text-xs font-medium text-[var(--atlas-accent-soft)] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Collection</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Import Confirmation / Status Banner */}
      {(pendingImport || statusMessage) && (
        <div className="px-5 py-2.5 bg-[var(--atlas-surface)] border-b border-[var(--atlas-border)] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {pendingImport ? (
            <>
              <div className="text-[var(--atlas-text)]">
                Ready to import{' '}
                <span className="font-mono text-[var(--atlas-accent-soft)]">
                  {pendingImport.collections.length}
                </span>{' '}
                collections,{' '}
                <span className="font-mono text-[var(--atlas-accent-soft)]">
                  {pendingImport.bookmarks.length}
                </span>{' '}
                bookmarks, and{' '}
                <span className="font-mono text-[var(--atlas-accent-soft)]">
                  {Object.keys(pendingImport.notes).length}
                </span>{' '}
                notes.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onImportStudyState(pendingImport, 'merge');
                    setPendingImport(null);
                    setStatusMessage({
                      kind: 'success',
                      text: 'Merged imported study archive into current library.',
                    });
                  }}
                  className="px-3 py-1 rounded bg-[var(--atlas-secondary)] text-[var(--atlas-secondary-contrast)] font-semibold whitespace-nowrap"
                >
                  Merge with Current
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onImportStudyState(pendingImport, 'replace');
                    setPendingImport(null);
                    setStatusMessage({
                      kind: 'success',
                      text: 'Replaced current study library with imported archive.',
                    });
                  }}
                  className="px-3 py-1 rounded bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] font-semibold hover:bg-[var(--atlas-accent-hover)] whitespace-nowrap"
                >
                  Replace All
                </button>
                <button
                  type="button"
                  onClick={() => setPendingImport(null)}
                  className="px-2 py-1 text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            statusMessage && (
              <>
                <span
                  className={
                    statusMessage.kind === 'error' ? 'text-[#E57399]' : 'text-[var(--atlas-secondary)]'
                  }
                >
                  {statusMessage.text}
                </span>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]"
                >
                  Dismiss
                </button>
              </>
            )
          )}
        </div>
      )}

      {tab === 'collections' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <aside className="lg:w-72 bg-[var(--atlas-surface)]/80 border-b lg:border-b-0 lg:border-r border-[var(--atlas-border)] overflow-y-auto p-3 space-y-1.5 shrink-0">
            {showNewForm && (
              <form
                onSubmit={handleCreate}
                className="p-3 mb-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-accent)]/40 space-y-2.5"
              >
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Collection title..."
                  required
                  className="w-full h-8 px-2.5 rounded bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] focus:outline-none focus:border-[var(--atlas-accent)]"
                />
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full p-2 rounded bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] focus:outline-none focus:border-[var(--atlas-accent)]"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="px-2.5 py-1 text-xs text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {studyState.collections.map((col) => {
              const active = activeCollection?.id === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setSelectedCollectionId(col.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    active
                      ? 'bg-[var(--atlas-elevated)] border-[var(--atlas-accent)]/40 text-[var(--atlas-accent-soft)]'
                      : 'bg-transparent border-transparent hover:bg-[var(--atlas-elevated)]/60 text-[var(--atlas-text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{col.title}</span>
                    <span className="font-mono text-xs tabular-nums text-[var(--atlas-text-subtle)]">
                      {col.verseIds.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--atlas-text-muted)] line-clamp-2">{col.description}</p>
                </button>
              );
            })}
          </aside>

          <main className="flex-1 overflow-y-auto px-5 sm:px-10 py-7">
            {activeCollection ? (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="pb-5 border-b border-[var(--atlas-border)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="text-xs text-[var(--atlas-text-muted)]">
                      {activeCollection.isSystem ? 'Curated Study Collection' : 'Personal Study Collection'} ·{' '}
                      <span className="font-mono tabular-nums">
                        {activeCollection.verseIds.length} passages
                      </span>
                    </div>
                    <h2 className="font-scripture text-2xl sm:text-3xl font-semibold text-[var(--atlas-heading)]">
                      {activeCollection.title}
                    </h2>
                    <p className="text-sm text-[var(--atlas-text-secondary)] max-w-xl">
                      {activeCollection.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                    {authUser && (
                      <button
                        type="button"
                        disabled={publishingShare}
                        onClick={() => void handlePublishShare()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[var(--atlas-surface)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border-strong)] text-xs font-medium text-[var(--atlas-text-secondary)] transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
                        <span>{publishingShare ? 'Publishing...' : 'Share Public Link'}</span>
                      </button>
                    )}

                    {activeCollection.verseIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          onLoadVersesInGraph(
                            activeCollection.verseIds,
                            activeCollection.verseIds[0]
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold hover:bg-[var(--atlas-accent-hover)] transition-colors whitespace-nowrap"
                      >
                        <GitFork className="w-3.5 h-3.5" />
                        <span>Explore Collection in Graph</span>
                      </button>
                    )}
                  </div>
                </div>

                {authUser && myShares.length > 0 && (
                  <div className="p-3 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-muted)]">
                      Your Published Shared Links ({myShares.length})
                    </div>
                    <div className="space-y-1.5">
                      {myShares.map((s) => (
                        <div
                          key={s.shareId}
                          className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)]"
                        >
                          <div className="min-w-0 truncate">
                            <span className="font-medium text-[var(--atlas-heading)]">{s.title}</span>
                            <span className="ml-2 font-mono text-[11px] text-[var(--atlas-text-muted)]">
                              ?shared={s.shareId}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyExistingShare(s.shareId)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--atlas-elevated)] text-[11px] text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)]"
                            >
                              {copiedShareId === s.shareId ? (
                                <>
                                  <Check className="w-3 h-3 text-[var(--atlas-secondary)]" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRevokeShare(s.shareId)}
                              title="Revoke public share link"
                              className="p-1 text-[var(--atlas-text-subtle)] hover:text-[#E57399]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[var(--atlas-text-subtle)] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={verseSearch}
                      onChange={(e) => setVerseSearch(e.target.value)}
                      placeholder="Add a verse to this collection (e.g. Romans 8:34, Isaiah 53:5)..."
                      className="w-full h-8 pl-8 pr-3 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)]"
                    />
                  </div>
                  {verseCandidates.length > 0 && (
                    <div className="divide-y divide-[var(--atlas-border)] border border-[var(--atlas-border)] rounded bg-[var(--atlas-bg)]">
                      {verseCandidates.map((cand) => {
                        const already = activeCollection.verseIds.includes(cand.verseId!);
                        return (
                          <div
                            key={cand.id}
                            className="px-3 py-2 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <span className="font-medium text-[var(--atlas-heading)]">{cand.title}</span>
                              <p className="text-[var(--atlas-text-muted)] truncate">{cand.snippet}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onToggleVerseInCollection(activeCollection.id, cand.verseId!)
                              }
                              className={`px-2.5 py-1 rounded text-xs font-medium shrink-0 ${
                                already
                                  ? 'text-[var(--atlas-text-muted)] hover:text-[#E57399]'
                                  : 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent)] hover:bg-[var(--atlas-hover)]'
                              }`}
                            >
                              {already ? 'Remove' : '+ Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {activeCollection.verseIds.length === 0 ? (
                  <div className="p-8 text-center rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] text-sm text-[var(--atlas-text-muted)]">
                    This collection has no verses yet. Use the search box above to add passages.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeCollection.verseIds.map((vId) => {
                      const verse = getVerseById(vId);
                      if (!verse) {
                        const [bId, chStr] = vId.split('.');
                        const chNum = parseInt(chStr ?? '1', 10) || 1;
                        return (
                          <div
                            key={vId}
                            className="p-4 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] flex items-center justify-between"
                          >
                            <span className="font-mono text-xs text-[var(--atlas-accent-soft)]">{vId}</span>
                            <button
                              type="button"
                              onClick={() => onOpenInReader(bId, chNum, vId)}
                              className="text-xs text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)]"
                            >
                              Open in Reader
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={verse.id}
                          className="p-4 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-scripture text-base font-semibold text-[var(--atlas-accent-soft)]">
                              {verse.reference}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenInReader(verse.bookId, verse.chapter, verse.id)
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)]"
                              >
                                <BookOpen className="w-3 h-3" />
                                <span>Read</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenInGraph(verse.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--atlas-secondary)] hover:bg-[var(--atlas-secondary)]/12"
                              >
                                <GitFork className="w-3 h-3" />
                                <span>Graph</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleVerseInCollection(activeCollection.id, verse.id)
                                }
                                aria-label={`Remove ${verse.reference} from collection`}
                                className="p-1 text-[var(--atlas-text-subtle)] hover:text-[#E57399]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="font-scripture text-[16px] leading-relaxed text-[var(--atlas-text)]">
                            {verse.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--atlas-text-muted)]">Select or create a collection.</p>
            )}
          </main>
        </div>
      )}

      {tab === 'bookmarks' && (
        <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="font-scripture text-2xl font-semibold text-[var(--atlas-heading)]">
              Bookmarked Passages
            </h2>
            {studyState.bookmarks.length === 0 ? (
              <p className="text-sm text-[var(--atlas-text-muted)]">
                No bookmarked passages yet. Click the bookmark icon on any verse in the Graph or Bible Reader.
              </p>
            ) : (
              <div className="space-y-3">
                {studyState.bookmarks.map((vId) => {
                  const verse = getVerseById(vId);
                  if (!verse) {
                    const [bId, chStr] = vId.split('.');
                    const chNum = parseInt(chStr ?? '1', 10) || 1;
                    return (
                      <div
                        key={vId}
                        className="p-4 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] flex items-center justify-between"
                      >
                        <span className="font-mono text-xs text-[var(--atlas-accent-soft)]">{vId}</span>
                        <button
                          type="button"
                          onClick={() => onOpenInReader(bId, chNum, vId)}
                          className="text-xs text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)]"
                        >
                          Read
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={verse.id}
                      className="p-4 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-scripture text-base font-semibold text-[var(--atlas-accent-soft)]">
                          {verse.reference}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenInReader(verse.bookId, verse.chapter, verse.id)}
                            className="text-xs text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] px-2 py-1 rounded hover:bg-[var(--atlas-elevated)]"
                          >
                            Read
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenInGraph(verse.id)}
                            className="text-xs text-[var(--atlas-secondary)] hover:underline px-2 py-1"
                          >
                            Graph
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleBookmark(verse.id)}
                            aria-label="Remove bookmark"
                            className="p-1 text-[var(--atlas-accent)] hover:text-[#E57399]"
                          >
                            <Bookmark className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>
                      <p className="font-scripture text-[16px] leading-relaxed text-[var(--atlas-text)]">
                        {verse.text}
                      </p>
                      {studyState.notes[verse.id] && (
                        <p className="text-xs text-[var(--atlas-text-muted)] pt-2 border-t border-[var(--atlas-border)]">
                          Note: {studyState.notes[verse.id]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'graphs' && (
        <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="font-scripture text-2xl font-semibold text-[var(--atlas-heading)]">
              Saved Graph Configurations
            </h2>
            {studyState.savedGraphs.length === 0 ? (
              <div className="p-6 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] text-sm text-[var(--atlas-text-muted)]">
                No graph snapshots saved yet. In the Bible Graph workspace, click{' '}
                <span className="text-[var(--atlas-accent-soft)]">Save View</span> to store your expanded network
                and relationship filters.
              </div>
            ) : (
              <div className="space-y-3">
                {studyState.savedGraphs.map((cfg) => (
                  <div
                    key={cfg.id}
                    className="p-4 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-medium text-sm text-[var(--atlas-heading)]">{cfg.name}</div>
                      <div className="mt-1 text-xs text-[var(--atlas-text-muted)] font-mono tabular-nums">
                        {cfg.visibleNodeIds.length} nodes · {cfg.activeRelationships.length} filters ·{' '}
                        {cfg.layout} layout
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onLoadSavedGraph(cfg)}
                      className="px-3 py-1.5 rounded-md bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold hover:bg-[var(--atlas-accent-hover)] whitespace-nowrap"
                    >
                      Restore Graph
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'custom_edges' && (
        <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-scripture text-2xl font-semibold text-[var(--atlas-heading)]">
                Personal Cross-Reference Edges
              </h2>
              <span className="text-xs font-mono text-[var(--atlas-text-muted)]">
                {customEdges.length} custom links
              </span>
            </div>
            {customEdges.length === 0 ? (
              <div className="p-6 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] text-sm text-[var(--atlas-text-muted)]">
                No personal cross-reference edges authored yet. In the Bible Graph workspace, click{' '}
                <span className="text-[var(--atlas-accent-soft)]">Link Edge</span> or{' '}
                <span className="text-[var(--atlas-accent-soft)]">Link Custom Connection</span> in the
                verse inspector to create your own links.
              </div>
            ) : (
              <div className="space-y-3">
                {customEdges.map((edge) => {
                  const meta = RELATIONSHIP_METADATA[edge.relationship];
                  return (
                    <div
                      key={edge.id}
                      className="p-4 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: meta.color }} />
                          <span className="text-sm font-medium text-[var(--atlas-heading)] truncate">
                            {formatReferenceFromId(edge.source)} → {formatReferenceFromId(edge.target)}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)] text-[var(--atlas-text-muted)]">
                            {meta.shortLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onLoadVersesInGraph([edge.source, edge.target], edge.source)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-[var(--atlas-secondary)] hover:bg-[var(--atlas-secondary)]/12"
                          >
                            <GitFork className="w-3 h-3" />
                            <span>View in Graph</span>
                          </button>
                          {onDeleteCustomEdge && (
                            <button
                              type="button"
                              onClick={() => onDeleteCustomEdge(edge.id)}
                              aria-label="Delete personal edge"
                              className="p-1 text-[var(--atlas-text-subtle)] hover:text-[#E57399]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                        {edge.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
