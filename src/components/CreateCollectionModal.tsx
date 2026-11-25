import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getVerseById } from '../services/scriptureService';
import { VerseId } from '../types/scripture';

interface CreateCollectionModalProps {
  open: boolean;
  initialVerseId?: VerseId | null;
  onClose: () => void;
  onCreate: (title: string, description: string, initialVerseIds: VerseId[]) => void;
}

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  open,
  initialVerseId,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  const initialVerse = initialVerseId ? getVerseById(initialVerseId) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(
      title.trim(),
      description.trim() || 'Personal Scripture study collection.',
      initialVerse ? [initialVerse.id] : []
    );
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-collection-title"
        className="relative z-10 w-full max-w-md rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] shadow-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2
            id="create-collection-title"
            className="font-scripture text-xl font-semibold text-[var(--atlas-heading)]"
          >
            New Study Collection
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="collection-title-input"
              className="block text-xs font-medium text-[var(--atlas-text-secondary)] mb-1.5"
            >
              Collection Title
            </label>
            <input
              id="collection-title-input"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Covenants of Promise"
              className="w-full h-9 px-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-sm text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)]"
            />
          </div>

          <div>
            <label
              htmlFor="collection-desc-input"
              className="block text-xs font-medium text-[var(--atlas-text-secondary)] mb-1.5"
            >
              Description
            </label>
            <textarea
              id="collection-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What theme or passage cluster does this collection trace?"
              className="w-full p-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-sm text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)]"
            />
          </div>

          {initialVerse && (
            <div className="p-2.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)] text-xs text-[var(--atlas-text-muted)]">
              Initial passage:{' '}
              <span className="text-[var(--atlas-accent-soft)] font-medium">{initialVerse.reference}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md text-xs font-medium text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold hover:bg-[var(--atlas-accent-hover)]"
            >
              Create Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
