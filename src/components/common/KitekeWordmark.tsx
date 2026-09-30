import React from 'react';

interface KitekeWordmarkProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  darkBackground?: boolean;
}

/**
 * Nome Oficial do Sistema: "Kiteke Pro"
 * Reprodução vetorial 100% matemática e fiel à imagem oficial enviada pelo utilizador:
 * - Tipografia corporativa oficial (glifos de alta precisão vetorial)
 * - Fundo totalmente vazio / transparente (visíveis estritamente as letras e a insígnia)
 * - 'K': Haste vertical azul real profundo com braço inferior azul e braço superior com corte dinâmico em gradiente ciano elétrico
 * - 'i': Ponto em paralelogramo diagonal ciano com corte angular paralelo de ~30° no topo da haste
 * - 't': Letra 't' autêntica com curvatura/gancho na base e corte biselado no topo
 * - 'e': Primeiro 'e' geométrico perfeito com barra horizontal
 * - 'k': Haste vertical na altura de capitais e braços geométricos
 * - 'e': Segundo 'e' preenchido com gradiente contínuo azul real -> ciano luminoso
 * - Insígnia "Pro": Cápsula arredondada flutuante exatamente acima do 'e' final com gradiente elétrico e tipografia branca em itálico
 */
export const KitekeWordmark: React.FC<KitekeWordmarkProps> = ({
  className = '',
  height = 40,
  width,
  darkBackground = false,
}) => {
  // Cor base das letras: azul real escuro (#002878) em fundos claros, branco puro (#ffffff) em fundos escuros
  const baseColor = darkBackground ? '#ffffff' : '#002878';

  return (
    <svg
      viewBox="15 10 490 156"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 overflow-visible select-none inline-block ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: width ? (typeof width === 'number' ? `${width}px` : width) : 'auto',
        background: 'transparent',
      }}
      aria-label="Kiteke Pro"
      role="img"
    >
      <defs>
        {/* Gradiente Ciano / Azul Elétrico para o braço superior do K e o ponto do i */}
        <linearGradient id="kWordCyanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0052eb" />
          <stop offset="45%" stopColor="#0094ff" />
          <stop offset="100%" stopColor="#00d5ff" />
        </linearGradient>

        {/* Gradiente da Insígnia Cápsula "Pro" (Azul Real Elétrico -> Ciano Céu) */}
        <linearGradient id="kWordBadgeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#004ce6" />
          <stop offset="50%" stopColor="#0080ff" />
          <stop offset="100%" stopColor="#00bfff" />
        </linearGradient>

        {/* Gradiente do segundo 'e' final (azul real -> ciano luminoso no bordo superior direito) */}
        <linearGradient id="kWordLastEGrad" x1="5%" y1="75%" x2="95%" y2="25%">
          <stop offset="0%" stopColor={baseColor} />
          <stop offset="35%" stopColor={darkBackground ? '#85c2ff' : '#003db5'} />
          <stop offset="70%" stopColor="#007df8" />
          <stop offset="100%" stopColor="#00d8ff" />
        </linearGradient>
      </defs>

      {/* ========================================================
          1. LETRA 'K'
          - Haste vertical azul real sólida
          - Braço inferior azul real sólido
          - Braço superior cortado em gradiente ciano dinâmico
         ======================================================== */}
      <g id="kiteke-K">
        {/* Haste Vertical do K */}
        <rect x="30.7" y="49.9" width="23.1" height="110.1" fill={baseColor} />

        {/* Braço Inferior do K */}
        <path
          d="M 53.8 119.8 L 67.3 109.5 L 106.9 160 L 134.1 160 L 83.2 96.5 L 68 108.5 Z"
          fill={baseColor}
        />

        {/* Braço Superior do K (em gradiente ciano com corte dinâmico no topo) */}
        <path
          d="M 53.8 99.8 L 103.4 49.9 L 130.2 49.9 L 83.2 96.5 Z"
          fill="url(#kWordCyanGrad)"
        />
      </g>

      {/* ========================================================
          2. LETRA 'i'
          - Ponto em paralelogramo diagonal ciano elétrico
          - Topo da haste cortado no mesmo ângulo biselado
          - Haste vertical sólida
         ======================================================== */}
      <g id="kiteke-i">
        {/* Ponto do 'i' (Paralelogramo inclinado paralelo ao ângulo de corte) */}
        <path
          d="M 144.7 57.5 L 166.7 44.5 L 166.7 59.5 L 144.7 72.5 Z"
          fill="url(#kWordCyanGrad)"
        />

        {/* Haste do 'i' cortada diagonalmente no topo */}
        <path
          d="M 144.7 85.5 L 166.7 72.5 L 166.7 160 L 144.7 160 Z"
          fill={baseColor}
        />
      </g>

      {/* ========================================================
          3. LETRA 't'
          Glifo vetorial com o gancho característico na base e topo angular
         ======================================================== */}
      <g id="kiteke-t">
        <path
          d="M208.8 161.4Q199.1 161.4 193.9 156.1Q188.7 150.9 188.7 140.2L188.7 90.3L178 90.3L178 75.5L189.8 75.5L196.6 55.6L210.4 55.6L210.4 75.5L226.4 75.5L226.4 90.3L210.4 90.3L210.4 134.2Q210.4 140.4 212.7 143.3Q215.1 146.3 220 146.3Q222 146.3 223.7 145.9Q225.3 145.6 227.3 145.2L227.3 158.8Q223.3 160.1 218.7 160.7Q214.2 161.4 208.8 161.4"
          fill={baseColor}
        />
      </g>

      {/* ========================================================
          4. PRIMEIRO 'e'
          Glifo geométrico clássico em azul real profundo
         ======================================================== */}
      <g id="kiteke-e1">
        <path
          d="M273.1 161.6Q263.9 161.6 256.6 158.9Q249.3 156.2 244.2 150.7Q239 145.2 236.3 136.8Q233.5 128.5 233.5 117.3Q233.5 105.2 236.8 97Q240 88.7 245.5 83.6Q251 78.4 258.2 76.2Q265.4 73.9 273.4 73.9Q283.4 73.9 290.4 77.4Q297.5 80.9 302 87.1Q306.6 93.4 308.7 102.1Q310.8 110.8 310.8 121.3L310.8 122L256.6 122Q256.6 127.3 257.5 131.8Q258.5 136.4 260.6 139.7Q262.7 143 266 145Q269.4 146.9 274.2 146.9Q279.9 146.9 283.6 144.4Q287.3 142 288.8 136.8L309.5 138.6Q308.1 142.2 305.6 146.3Q303.1 150.3 298.8 153.7Q294.6 157.1 288.3 159.3Q282 161.6 273.1 161.6M273.1 87.7Q269.7 87.7 266.8 88.9Q263.8 90 261.7 92.5Q259.5 94.9 258.2 98.8Q256.9 102.7 256.7 108.2L289.5 108.2Q288.9 98 284.6 92.9Q280.3 87.7 273.1 87.7"
          fill={baseColor}
        />
      </g>

      {/* ========================================================
          5. LETRA 'k'
          Haste alta alinhada à capitais e braços diagonais nítidos
         ======================================================== */}
      <g id="kiteke-k">
        <path
          d="M403.4 160L379.4 160L356.8 121.7L347.4 128.3L347.4 160L325.4 160L325.4 44.1L347.4 44.1L347.4 110.5L377.5 75.5L401.1 75.5L371.5 108.4"
          fill={baseColor}
        />
      </g>

      {/* ========================================================
          6. SEGUNDO 'e' (FINAL)
          Preenchido com o gradiente característico azul -> ciano
         ======================================================== */}
      <g id="kiteke-e2">
        <path
          d="M447 161.6Q437.9 161.6 430.6 158.9Q423.3 156.2 418.1 150.7Q413 145.2 410.2 136.8Q407.5 128.5 407.5 117.3Q407.5 105.2 410.7 97Q414 88.7 419.5 83.6Q425 78.4 432.2 76.2Q439.4 73.9 447.3 73.9Q457.3 73.9 464.4 77.4Q471.5 80.9 476 87.1Q480.5 93.4 482.7 102.1Q484.8 110.8 484.8 121.3L484.8 122L430.5 122Q430.5 127.3 431.5 131.8Q432.4 136.4 434.5 139.7Q436.6 143 440 145Q443.4 146.9 448.1 146.9Q453.9 146.9 457.6 144.4Q461.3 142 462.8 136.8L483.5 138.6Q482.1 142.2 479.6 146.3Q477 150.3 472.8 153.7Q468.6 157.1 462.3 159.3Q456 161.6 447 161.6M447 87.7Q443.7 87.7 440.7 88.9Q437.8 90 435.7 92.5Q433.5 94.9 432.2 98.8Q430.9 102.7 430.7 108.2L463.5 108.2Q462.9 98 458.6 92.9Q454.3 87.7 447 87.7"
          fill="url(#kWordLastEGrad)"
        />
      </g>

      {/* ========================================================
          7. INSÍGNIA CÁPSULA "Pro"
          Posicionada exatamente acima do segundo 'e' como na imagem oficial
         ======================================================== */}
      <g id="kiteke-pro-badge">
        {/* Pílula / Cápsula com cantos 100% arredondados */}
        <rect
          x="396"
          y="15"
          width="94"
          height="43"
          rx="21.5"
          fill="url(#kWordBadgeGrad)"
        />

        {/* Texto "Pro" em itálico branco encorpado */}
        <text
          x="443"
          y="46"
          fill="#ffffff"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="30"
          textAnchor="middle"
          letterSpacing="-0.5"
        >
          Pro
        </text>
      </g>
    </svg>
  );
};
