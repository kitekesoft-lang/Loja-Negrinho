import React from 'react';

interface BarcodeVisualProps {
  barcode: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Renderiza um código de barras estético e realista com padrão de barras vetoriais
 * e texto legível com espaçamento EAN-13 padrão.
 */
export const BarcodeVisual: React.FC<BarcodeVisualProps> = ({
  barcode,
  width = 160,
  height = 50,
  showText = true,
  className = '',
}) => {
  const digits = barcode.replace(/\D/g, '') || '5601001000001';

  // Gerar padrão pseudo-EAN estilizado a partir dos dígitos
  const generateBars = () => {
    const bars: { x: number; width: number; heightRatio: number }[] = [];
    let currentX = 5;

    // Guarda inicial (guard pattern: 101)
    bars.push({ x: currentX, width: 2, heightRatio: 1.0 });
    currentX += 4;
    bars.push({ x: currentX, width: 2, heightRatio: 1.0 });
    currentX += 6;

    // 12 dígitos de dados
    for (let i = 0; i < Math.min(12, digits.length); i++) {
      const d = parseInt(digits[i], 10);
      const w1 = (d % 3) + 1.2;
      const w2 = ((d + 1) % 2) + 1.5;

      bars.push({ x: currentX, width: w1, heightRatio: 0.82 });
      currentX += w1 + 2;

      bars.push({ x: currentX, width: w2, heightRatio: 0.82 });
      currentX += w2 + 2.5;

      // Guarda central (centro: 01010)
      if (i === 5) {
        currentX += 3;
        bars.push({ x: currentX, width: 2, heightRatio: 1.0 });
        currentX += 4;
        bars.push({ x: currentX, width: 2, heightRatio: 1.0 });
        currentX += 5;
      }
    }

    // Guarda final (101)
    currentX += 2;
    bars.push({ x: currentX, width: 2, heightRatio: 1.0 });
    currentX += 4;
    bars.push({ x: currentX, width: 2, heightRatio: 1.0 });

    return { bars, totalWidth: currentX + 6 };
  };

  const { bars, totalWidth } = generateBars();
  const barMaxHeight = height - (showText ? 16 : 0);

  // Formatar EAN-13 em blocos legíveis: 5 601001 000096
  const formattedText =
    digits.length >= 13
      ? `${digits[0]}  ${digits.slice(1, 7)}  ${digits.slice(7, 13)}`
      : digits;

  return (
    <div className={`inline-flex flex-col items-center bg-white p-2 rounded-lg border border-slate-200 select-none shadow-2xs ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="overflow-visible"
      >
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={2}
            width={bar.width}
            height={barMaxHeight * bar.heightRatio}
            fill="#1e293b"
          />
        ))}

        {showText && (
          <text
            x={totalWidth / 2}
            y={height - 2}
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="0.08em"
            fill="#334155"
          >
            {formattedText}
          </text>
        )}
      </svg>
    </div>
  );
};
