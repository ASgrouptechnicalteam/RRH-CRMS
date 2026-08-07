import React from 'react';

interface QRCodeVisualProps {
  value: string;
  size?: number;
  label?: string;
}

// Generate realistic, deterministic 21x21 QR Code matrix with finder patterns
function generateQRGrid(text: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array(size)
    .fill(false)
    .map(() => Array(size).fill(false));

  // Helper to draw 7x7 Finder Pattern
  const drawFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[startRow + r][startCol + c] = true;
        } else {
          grid[startRow + r][startCol + c] = false;
        }
      }
    }
  };

  // 1. Top-Left Finder
  drawFinder(0, 0);
  // 2. Top-Right Finder
  drawFinder(0, 14);
  // 3. Bottom-Left Finder
  drawFinder(14, 0);

  // 4. Timing Pattern
  for (let i = 8; i < 13; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // 5. Fill remaining data cells deterministically using string hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder pattern zones
      const isTopLeft = r < 8 && c < 8;
      const isTopRight = r < 8 && c > 12;
      const isBottomLeft = r > 12 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!isTopLeft && !isTopRight && !isBottomLeft && !isTiming) {
        const val = Math.abs(Math.sin((r * size + c + hash) * 1.5));
        grid[r][c] = val > 0.45;
      }
    }
  }

  return grid;
}

export const QRCodeVisual: React.FC<QRCodeVisualProps> = ({ value, size = 180, label }) => {
  const grid = generateQRGrid(value || 'RRH-DEFAULT');
  const gridSize = grid.length;
  const cellSize = size / gridSize;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-lg relative inline-block">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
          <rect width={size} height={size} fill="#ffffff" />
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) =>
              cell ? (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={cIdx * cellSize}
                  y={rIdx * cellSize}
                  width={cellSize + 0.3}
                  height={cellSize + 0.3}
                  fill="#0f172a"
                  rx={0.5}
                />
              ) : null
            )
          )}
        </svg>

        {/* Center Brand Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-teal-700 text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-white shadow-md">
            RRH
          </div>
        </div>
      </div>

      {label && <span className="font-mono text-[11px] font-bold text-slate-700">{label}</span>}
    </div>
  );
};
