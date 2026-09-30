import React from 'react';
import { KitekeWordmark } from './KitekeWordmark';

interface KitekeLogoProps {
  className?: string;
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  darkTheme?: boolean;
}

/**
 * Componente do Logotipo e Nome Oficial Kiteke
 * Reproduz fielmente a identidade visual oficial da Kiteke (conforme imagem):
 * - Wordmark estilizado "Kiteke" com braço do K ciano, ponto do i em paralelogramo e gradiente no segundo 'e'
 * - Símbolo K com estética correspondente
 */
export const KitekeLogo: React.FC<KitekeLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
  darkTheme = false,
}) => {
  const heightMap = {
    sm: 26,
    md: 34,
    lg: 44,
    xl: 56,
  };

  const symbolSizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const currentHeight = heightMap[size];

  // Se o utilizador pediu apenas o nome do sistema (fundo vazio / transparente, apenas as letras)
  if (variant === 'wordmark') {
    return (
      <KitekeWordmark
        height={currentHeight}
        darkBackground={darkTheme}
        className={className}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Símbolo K Vetorial Kiteke */}
      <svg
        className={`${symbolSizeMap[size]} shrink-0 overflow-visible`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="kStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#003192" />
            <stop offset="100%" stopColor="#00236e" />
          </linearGradient>

          <linearGradient id="cyanArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0066f5" />
            <stop offset="50%" stopColor="#0099ff" />
            <stop offset="100%" stopColor="#00d5ff" />
          </linearGradient>
        </defs>

        {/* Haste Vertical do K */}
        <rect x="18" y="14" width="20" height="72" rx="3" fill="url(#kStemGrad)" />

        {/* Braço Inferior do K */}
        <path
          d="M 38 52 L 62 52 L 86 86 L 56 86 Z"
          fill="url(#kStemGrad)"
        />

        {/* Braço Superior do K (Ciano Elétrico) */}
        <path
          d="M 38 54 L 38 34 L 76 14 L 92 14 Z"
          fill="url(#cyanArcGrad)"
        />

        {/* Ponto / Acento Inclinado Ciano */}
        <path
          d="M 68 28 L 84 14 L 92 14 L 76 28 Z"
          fill="url(#cyanArcGrad)"
          opacity="0.9"
        />
      </svg>

      {/* Tipografia Oficial idêntica à imagem */}
      {variant === 'full' && (
        <div className="flex items-center">
          <KitekeWordmark height={currentHeight} darkBackground={darkTheme} />
        </div>
      )}
    </div>
  );
};

