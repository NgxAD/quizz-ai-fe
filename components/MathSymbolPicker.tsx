'use client';

import { useState } from 'react';

interface MathSymbolPickerProps {
  onSymbolSelect: (symbol: string) => void;
}

const MATH_SYMBOLS = {
  'Toán Học Cơ Bản': ['√', '±', '×', '÷', '=', '≠', '<', '>', '≤', '≥'],
  'Phân Số & Lũy Thừa': ['½', '⅓', '¼', '⅔', '¾', '²', '³', '⁴', '⁵', 'ⁿ'],
  'Ký Hiệu': ['∑', '∫', '∏', '∂', '∞', 'π', 'θ', 'α', 'β', 'γ'],
  'Hình Học': ['°', '∠', '⊥', '∥', '△', '□', '◯', '⊙', '⌒', '∩'],
  'Logic': ['∧', '∨', '¬', '∀', '∃', '⇒', '⇔', '∈', '∉', '⊆'],
};

export default function MathSymbolPicker({ onSymbolSelect }: MathSymbolPickerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-semibold transition"
        title="Chèn ký tự đặc biệt"
      >
        ∑ fx
      </button>

      {expanded && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-y-auto">
          <div className="p-4 space-y-3">
            {Object.entries(MATH_SYMBOLS).map(([category, symbols]) => (
              <div key={category}>
                <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase">
                  {category}
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {symbols.map((symbol) => (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => {
                        onSymbolSelect(symbol);
                        setExpanded(false);
                      }}
                      className="w-full p-2 border border-gray-300 rounded hover:bg-blue-100 hover:border-blue-500 text-center font-bold text-xl text-black transition cursor-pointer"
                      title={symbol}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="w-full text-sm text-gray-600 hover:text-gray-800 py-2 border-t border-gray-200"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}
