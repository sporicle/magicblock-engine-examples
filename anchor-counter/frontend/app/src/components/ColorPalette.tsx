import React from 'react';
import './ColorPalette.scss';

// Define our 8 colors
export const COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
];

type ColorPaletteProps = {
  selectedColor: number;
  onColorSelect: (colorIndex: number) => void;
};

const ColorPalette: React.FC<ColorPaletteProps> = ({ selectedColor, onColorSelect }) => {
  return (
    <div className="color-palette">
      <div className="colors-container">
        {COLORS.map((color, index) => (
          <div
            key={index}
            className={`color-swatch ${selectedColor === index ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onColorSelect(index)}
            title={`Color ${index}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPalette; 