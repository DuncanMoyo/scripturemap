import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, GitFork, Grid3X3, Info } from 'lucide-react';
import { BOOK_MAP } from '../data/books';
import {
  formatReferenceFromId,
  loadTskBookMatrix,
  loadTskForBook,
} from '../services/scriptureService';
import { AtlasTheme, TskBookMatrix, VerseId } from '../types/scripture';

interface CanonMatrix2DProps {
  atlasTheme: AtlasTheme;
  onOpenBookInGraph: (verseId: VerseId) => void;
  onOpenBookInReader: (bookId: string, chapter: number, verseId?: VerseId) => void;
}

const BOOK_DEFAULT_ANCHOR: Record<string, VerseId> = {
  GEN: 'GEN.1.1',
  EXO: 'EXO.25.8',
  LEV: 'LEV.16.15',
  NUM: 'NUM.21.9',
  DEU: 'DEU.6.4',
  PSA: 'PSA.23.1',
  PRO: 'PRO.3.5',
  ISA: 'ISA.53.5',
  JER: 'JER.31.31',
  EZK: 'EZK.36.26',
  DAN: 'DAN.7.13',
  MAT: 'MAT.5.17',
  MRK: 'MRK.10.45',
  LUK: 'LUK.24.27',
  JHN: 'JHN.3.16',
  ACT: 'ACT.2.17',
  ROM: 'ROM.3.24',
  '1CO': '1CO.15.3',
  GAL: 'GAL.3.13',
  EPH: 'EPH.2.8',
  HEB: 'HEB.8.5',
  '1PE': '1PE.2.24',
  REV: 'REV.21.1',
};

export const CanonMatrix2D: React.FC<CanonMatrix2DProps> = ({
  atlasTheme,
  onOpenBookInGraph,
  onOpenBookInReader,
}) => {
  const [matrix, setMatrix] = useState<TskBookMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scaleMode, setScaleMode] = useState<'log' | 'linear'>('log');
  const [includeSelf, setIncludeSelf] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({
    row: 22, // ISA
    col: 42, // JHN
  });
  const [pairSamples, setPairSamples] = useState<
    { from: VerseId; to: VerseId; votes: number }[]
  >([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;
    void loadTskBookMatrix()
      .then((m) => {
        if (active) setMatrix(m);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load matrix.');
      });
    return () => {
      active = false;
    };
  }, []);

  const maxCount = useMemo(() => {
    if (!matrix) return 1;
    if (includeSelf) {
      let max = 1;
      for (let r = 0; r < 66; r++) {
        for (let c = 0; c < 66; c++) {
          if (matrix.counts[r][c] > max) max = matrix.counts[r][c];
        }
      }
      return max;
    }
    return Math.max(1, matrix.maxCrossBookCount);
  }, [matrix, includeSelf]);

  // Load sample verse connections between selected row book and column book
  useEffect(() => {
    if (!matrix) return;
    const srcBookId = matrix.bookIds[selectedCell.row];
    const dstBookId = matrix.bookIds[selectedCell.col];
    if (!srcBookId || !dstBookId) return;

    let active = true;
    void loadTskForBook(srcBookId)
      .then((map) => {
        if (!active) return;
        const found: { from: VerseId; to: VerseId; votes: number }[] = [];
        for (const [vId, entries] of Object.entries(map)) {
          for (const [targetId, votes] of entries) {
            if (targetId.startsWith(`${dstBookId}.`)) {
              found.push({ from: vId, to: targetId, votes });
            }
          }
        }
        found.sort((a, b) => b.votes - a.votes);
        setPairSamples(found.slice(0, 8));
      })
      .catch(() => {
        if (active) setPairSamples([]);
      });
    return () => {
      active = false;
    };
  }, [matrix, selectedCell.row, selectedCell.col]);

  // Draw crisp 66x66 heatmap canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cellPx = 8;
    const labelMargin = 38;
    const size = labelMargin + 66 * cellPx + 8;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isLight = atlasTheme === 'light';
    ctx.fillStyle = isLight ? '#F8F6F3' : '#0D0E10';
    ctx.fillRect(0, 0, size, size);

    const logDenom = Math.log1p(maxCount);

    for (let r = 0; r < 66; r++) {
      for (let c = 0; c < 66; c++) {
        const count = !includeSelf && r === c ? 0 : matrix.counts[r][c];
        const x = labelMargin + c * cellPx;
        const y = labelMargin + r * cellPx;

        if (count === 0) {
          ctx.fillStyle =
            r === c
              ? isLight
                ? '#E5DFD4'
                : '#191C21'
              : isLight
              ? '#EFECE5'
              : '#121418';
          ctx.fillRect(x, y, cellPx - 0.8, cellPx - 0.8);
          continue;
        }

        const t =
          scaleMode === 'log'
            ? Math.min(1, Math.log1p(count) / logDenom)
            : Math.min(1, count / maxCount);

        const isCrossTestament = (r < 39 && c >= 39) || (r >= 39 && c < 39);
        if (isCrossTestament) {
          // Teal / Emerald gradient for OT <-> NT typological & citation bridges
          ctx.fillStyle = isLight
            ? `rgba(30, 122, 101, ${0.15 + t * 0.85})`
            : `rgba(78, 196, 152, ${0.14 + t * 0.86})`;
        } else {
          // Terracotta / Amber gradient for intra-testament parallels
          ctx.fillStyle = isLight
            ? `rgba(154, 72, 30, ${0.14 + t * 0.86})`
            : `rgba(212, 137, 74, ${0.14 + t * 0.86})`;
        }
        ctx.fillRect(x, y, cellPx - 0.8, cellPx - 0.8);
      }
    }

    // Testament divider line at index 39 (Malachi | Matthew)
    const splitPos = labelMargin + 39 * cellPx - 0.5;
    ctx.strokeStyle = isLight ? 'rgba(31,27,23,0.42)' : 'rgba(244,239,230,0.4)';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(labelMargin, splitPos);
    ctx.lineTo(labelMargin + 66 * cellPx, splitPos);
    ctx.moveTo(splitPos, labelMargin);
    ctx.lineTo(splitPos, labelMargin + 66 * cellPx);
    ctx.stroke();

    // Axis book abbreviations (every 3rd book + OT/NT landmarks)
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = isLight ? '#5B5248' : '#9B9488';
    for (let i = 0; i < 66; i++) {
      if (i % 3 === 0 || i === 38 || i === 39 || i === 65) {
        const bId = matrix.bookIds[i];
        const pos = labelMargin + i * cellPx + cellPx * 0.5;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(bId, labelMargin - 4, pos);

        ctx.save();
        ctx.translate(pos, labelMargin - 4);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(bId, 0, 0);
        ctx.restore();
      }
    }

    // Highlight selected cell reticle
    const selX = labelMargin + selectedCell.col * cellPx;
    const selY = labelMargin + selectedCell.row * cellPx;
    ctx.strokeStyle = isLight ? '#1F1B17' : '#F4CFA4';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(selX - 0.5, selY - 0.5, cellPx, cellPx);

    if (hoveredCell) {
      const hX = labelMargin + hoveredCell.col * cellPx;
      const hY = labelMargin + hoveredCell.row * cellPx;
      ctx.strokeStyle = isLight ? '#9A481E' : '#4EC498';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(hX - 0.5, hY - 0.5, cellPx, cellPx);
    }
  }, [matrix, atlasTheme, scaleMode, includeSelf, maxCount, selectedCell, hoveredCell]);

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>, isClick = false) => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix) return;
    const rect = canvas.getBoundingClientRect();
    const labelMargin = 38;
    const cellPx = 8;
    const scaleX = (labelMargin + 66 * cellPx + 8) / rect.width;
    const scaleY = (labelMargin + 66 * cellPx + 8) / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const col = Math.floor((mx - labelMargin) / cellPx);
    const row = Math.floor((my - labelMargin) / cellPx);

    if (col >= 0 && col < 66 && row >= 0 && row < 66) {
      setHoveredCell({ row, col });
      if (isClick) {
        setSelectedCell({ row, col });
      }
    } else if (!isClick) {
      setHoveredCell(null);
    }
  };

  const activeCell = hoveredCell ?? selectedCell;
  const srcId = matrix?.bookIds[activeCell.row] ?? 'ISA';
  const dstId = matrix?.bookIds[activeCell.col] ?? 'JHN';
  const srcBook = BOOK_MAP[srcId];
  const dstBook = BOOK_MAP[dstId];
  const cellCount = matrix ? matrix.counts[activeCell.row]?.[activeCell.col] ?? 0 : 0;
  const cellWeighted = matrix ? matrix.weighted[activeCell.row]?.[activeCell.col] ?? 0 : 0;

  const selectedSrcId = matrix?.bookIds[selectedCell.row] ?? 'ISA';
  const selectedDstId = matrix?.bookIds[selectedCell.col] ?? 'JHN';
  const selectedSrcBook = BOOK_MAP[selectedSrcId];
  const selectedDstBook = BOOK_MAP[selectedDstId];
  const selectedCount = matrix ? matrix.counts[selectedCell.row]?.[selectedCell.col] ?? 0 : 0;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[var(--atlas-bg)] pt-14 lg:pt-0">
      {/* Main Heatmap Canvas Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="px-4 pt-12 lg:pt-3 pb-2.5 border-b border-[var(--atlas-border)] bg-[var(--atlas-surface)]/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[var(--atlas-text-muted)]">
            <Grid3X3 className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
            <span className="font-medium text-[var(--atlas-heading)]">
              66×66 Canonical Cross-Reference Matrix
            </span>
            {matrix && (
              <span className="hidden sm:inline font-mono text-[11px] tabular-nums text-[var(--atlas-text-subtle)]">
                ({matrix.totalDirectedSamples.toLocaleString()} pairs ·{' '}
                {matrix.otToNtCount.toLocaleString()} OT↔NT)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
              <button
                type="button"
                onClick={() => setScaleMode('log')}
                className={`px-2 py-1 rounded text-[11px] font-medium ${
                  scaleMode === 'log'
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                    : 'text-[var(--atlas-text-muted)]'
                }`}
              >
                Log Scale
              </button>
              <button
                type="button"
                onClick={() => setScaleMode('linear')}
                className={`px-2 py-1 rounded text-[11px] font-medium ${
                  scaleMode === 'linear'
                    ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                    : 'text-[var(--atlas-text-muted)]'
                }`}
              >
                Linear
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIncludeSelf((v) => !v)}
              className={`h-7 px-2.5 rounded border text-[11px] font-medium transition-colors ${
                includeSelf
                  ? 'bg-[var(--atlas-accent)]/15 text-[var(--atlas-accent-soft)] border-[var(--atlas-accent)]/40'
                  : 'bg-[var(--atlas-bg)] text-[var(--atlas-text-muted)] border-[var(--atlas-border)]'
              }`}
            >
              Same-Book Diagonal
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-4 gap-3">
          {error ? (
            <div className="p-4 rounded border border-[#E57399]/40 bg-[var(--atlas-surface)] text-xs text-[var(--atlas-text)]">
              {error}
            </div>
          ) : !matrix ? (
            <div className="text-xs text-[var(--atlas-text-muted)]">
              Loading 66×66 canonical cross-reference matrix...
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 text-[11px] text-[var(--atlas-text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--atlas-accent)]" />
                  Intra-Testament (OT–OT / NT–NT)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--atlas-secondary)]" />
                  Cross-Testament (OT↔NT)
                </span>
              </div>

              <div className="p-2 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border)] shadow-lg">
                <canvas
                  ref={canvasRef}
                  onMouseMove={(e) => handleCanvasMove(e, false)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={(e) => handleCanvasMove(e, true)}
                  className="cursor-crosshair block max-w-full h-auto"
                  aria-label="66 by 66 Canonical TSK cross-reference density matrix"
                />
              </div>

              <div className="text-xs font-mono tabular-nums text-[var(--atlas-text-secondary)]">
                {srcBook?.name ?? srcId} → {dstBook?.name ?? dstId}:{' '}
                <span className="text-[var(--atlas-accent-soft)] font-semibold">
                  {cellCount.toLocaleString()}
                </span>{' '}
                TSK links · weighted score {cellWeighted.toLocaleString()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Book-Pair Inspector */}
      <aside className="lg:w-88 xl:w-96 bg-[var(--atlas-surface)] border-t lg:border-t-0 lg:border-l border-[var(--atlas-border)] flex flex-col shrink-0 max-h-[42vh] lg:max-h-full overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--atlas-border)] space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-[var(--atlas-text-subtle)]">
            Selected Canon Pair
          </div>
          <h3 className="font-scripture text-lg font-semibold text-[var(--atlas-heading)]">
            {selectedSrcBook?.name ?? selectedSrcId} → {selectedDstBook?.name ?? selectedDstId}
          </h3>
          <div className="text-xs font-mono tabular-nums text-[var(--atlas-text-muted)]">
            {selectedCount.toLocaleString()} cross-references indexed
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onOpenBookInGraph(BOOK_DEFAULT_ANCHOR[selectedSrcId] ?? `${selectedSrcId}.1.1`)
              }
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold hover:bg-[var(--atlas-accent-hover)]"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Graph {selectedSrcBook?.shortName}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenBookInReader(selectedDstId, 1, `${selectedDstId}.1.1`)}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded bg-[var(--atlas-elevated)] text-[var(--atlas-text)] border border-[var(--atlas-border-strong)] text-xs font-medium hover:bg-[var(--atlas-hover)]"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
              <span>Read {selectedDstBook?.shortName}</span>
            </button>
          </div>

          <div className="p-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)] flex items-start gap-2 text-[11px] text-[var(--atlas-text-muted)] leading-relaxed">
            <Info className="w-3.5 h-3.5 text-[var(--atlas-accent)] shrink-0 mt-0.5" />
            <span>
              Rows represent source books (Gen → Rev top-to-bottom); columns represent target
              books (left-to-right). Teal cells highlight Old ↔ New Testament density hotspots
              (e.g., Psalms/Isaiah into Gospels/Hebrews/Revelation).
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
              Highest-Voted Parallels ({pairSamples.length})
            </div>
            {pairSamples.length === 0 ? (
              <p className="text-xs text-[var(--atlas-text-subtle)]">
                Click any bright cell on the matrix to inspect its top vote-ranked TSK verse pairs.
              </p>
            ) : (
              <div className="space-y-1.5">
                {pairSamples.map((p, idx) => (
                  <div
                    key={`${p.from}-${p.to}-${idx}`}
                    className="p-2.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)] flex items-center justify-between gap-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenBookInGraph(p.from)}
                      className="text-left font-medium text-[var(--atlas-heading)] hover:text-[var(--atlas-accent)] truncate"
                    >
                      {formatReferenceFromId(p.from, true)} → {formatReferenceFromId(p.to, true)}
                    </button>
                    <span className="font-mono text-[10.5px] tabular-nums text-[var(--atlas-secondary)] shrink-0">
                      +{p.votes}v
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
