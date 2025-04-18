import React from 'react';
import './PaintingBoard.scss';
import { COLORS } from './ColorPalette';

type PaintingBoardProps = {
  pixels: number[][];
  onPixelClick: (x: number, y: number) => void;
  isSubmitting: boolean;
};

const PaintingBoard: React.FC<PaintingBoardProps> = ({ pixels, onPixelClick, isSubmitting }) => {
  return (
    <div className="painting-board">
      <div className="board-container">
        {pixels.map((row, y) => (
          <div key={y} className="board-row">
            {row.map((colorIndex, x) => (
              <div
                key={`${x}-${y}`}
                className={`pixel ${isSubmitting ? 'disabled' : ''}`}
                style={{ backgroundColor: COLORS[colorIndex] }}
                onClick={() => !isSubmitting && onPixelClick(x, y)}
                title={`Pixel (${x}, ${y})`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaintingBoard; 