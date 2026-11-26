import React, { useEffect, useState } from 'react';
import { BookOpen, GitFork, Languages, X } from 'lucide-react';
import {
  formatReferenceFromId,
  getStrongsEntryAsync,
  getStrongsOccurrencesAsync,
} from '../services/scriptureService';
import {
  StrongsDictionaryEntry,
  StrongsOccurrenceRecord,
  VerseId,
} from '../types/scripture';

interface StrongsWordInspectorProps {
  strongsId: string;
  clickedWord?: string;
  sourceVerseId?: VerseId;
  onClose: () => void;
  onOpenInReader: (bookId: string, chapter: number, verseId: VerseId) => void;
  onMapLexicalParallels?: (
    strongsId: string,
    lemma: string,
    originVerseId: VerseId,
    matchingVerses: VerseId[]
  ) => void;
}

export const StrongsWordInspector: React.FC<StrongsWordInspectorProps> = ({
  strongsId,
  clickedWord,
  sourceVerseId,
  onClose,
  onOpenInReader,
  onMapLexicalParallels,
}) => {
  const [entry, setEntry] = useState<StrongsDictionaryEntry | undefined>(undefined);
  const [occurrences, setOccurrences] = useState<StrongsOccurrenceRecord | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getStrongsEntryAsync(strongsId).catch(() => undefined),
      getStrongsOccurrencesAsync(strongsId).catch(() => undefined),
    ])
      .then(([ent, occ]) => {
        if (!active) return;
        setEntry(ent);
        setOccurrences(occ);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [strongsId]);

  const isHebrew = strongsId.toUpperCase().startsWith('H');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Strong's Lexicon ${strongsId}`}
      >
        <div className="px-4 py-3 border-b border-[var(--atlas-border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Languages className="w-4 h-4 text-[var(--atlas-accent)] shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--atlas-text-muted)]">
                Strong&apos;s {isHebrew ? 'Hebrew' : 'Greek'} · {strongsId}
                {clickedWord ? ` · "${clickedWord}"` : ''}
              </div>
              <h3 className="text-base font-semibold text-[var(--atlas-heading)] truncate">
                {entry ? `${entry.lemma} (${entry.translit})` : `Lexicon Entry ${strongsId}`}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Strong's inspector"
            className="p-1.5 rounded text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {loading ? (
            <p className="text-[var(--atlas-text-muted)]">Loading Strong&apos;s lexicon...</p>
          ) : !entry ? (
            <p className="text-[var(--atlas-text-muted)]">
              No lexicon definition found for {strongsId}.
            </p>
          ) : (
            <>
              <div className="p-3.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)] space-y-2">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span
                    className="text-2xl font-scripture font-semibold text-[var(--atlas-accent-soft)]"
                    dir={isHebrew ? 'rtl' : 'ltr'}
                  >
                    {entry.lemma}
                  </span>
                  <div className="text-right font-mono text-[11px] text-[var(--atlas-text-muted)]">
                    <div>{entry.translit}</div>
                    {entry.pron && <div className="text-[var(--atlas-text-subtle)]">/{entry.pron}/</div>}
                  </div>
                </div>
                {entry.derivation && (
                  <div className="text-[11px] text-[var(--atlas-text-muted)] pt-1 border-t border-[var(--atlas-border)]">
                    <span className="text-[var(--atlas-text-subtle)]">Derivation: </span>
                    {entry.derivation}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                  Lexical Definition
                </div>
                <p className="text-sm text-[var(--atlas-text)] leading-relaxed">{entry.def}</p>
              </div>

              {entry.kjv && (
                <div className="space-y-1">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                    KJV Renderings
                  </div>
                  <p className="text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                    {entry.kjv}
                  </p>
                </div>
              )}

              {occurrences && (
                <div className="pt-2 border-t border-[var(--atlas-border)] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                      Reverse Concordance ({occurrences.c.toLocaleString()} verses in 66 books)
                    </span>
                    {onMapLexicalParallels && sourceVerseId && occurrences.v.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onMapLexicalParallels(
                            strongsId,
                            `${entry.lemma} (${entry.translit})`,
                            sourceVerseId,
                            occurrences.v.slice(0, 8)
                          );
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--atlas-secondary)] text-[var(--atlas-secondary-contrast)] text-[11px] font-semibold hover:opacity-90 whitespace-nowrap"
                      >
                        <GitFork className="w-3 h-3" />
                        <span>Map Lexical Edges</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {occurrences.v.map((vId) => {
                      const [bId, chStr] = vId.split('.');
                      const chNum = parseInt(chStr ?? '1', 10) || 1;
                      return (
                        <button
                          key={vId}
                          type="button"
                          onClick={() => {
                            onOpenInReader(bId, chNum, vId);
                            onClose();
                          }}
                          className="inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border)] text-left text-[11.5px] text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] transition-colors"
                        >
                          <span className="truncate">{formatReferenceFromId(vId, true)}</span>
                          <BookOpen className="w-3 h-3 shrink-0 opacity-60" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
