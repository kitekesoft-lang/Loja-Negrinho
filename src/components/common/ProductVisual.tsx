import React from 'react';

interface ProductVisualProps {
  codeOrName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProductVisual: React.FC<ProductVisualProps> = ({
  codeOrName,
  className = '',
  size = 'md',
}) => {
  const norm = codeOrName.toLowerCase();

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }[size];

  // Arroz (Sack/Bag of Rice)
  if (norm.includes('arroz') || norm === 'p001') {
    return (
      <div className={`relative flex items-center justify-center bg-amber-50/80 rounded-lg p-2 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xs" fill="none">
          {/* Rice sack body */}
          <path d="M22 35 C20 60 18 95 24 110 C30 114 70 114 76 110 C82 95 80 60 78 35 Z" fill="#d4a373" stroke="#b07d50" strokeWidth="2.5" />
          {/* Top gather */}
          <path d="M20 35 C22 28 32 25 50 25 C68 25 78 28 80 35 C75 40 65 38 50 38 C35 38 25 40 20 35 Z" fill="#c68b59" stroke="#996035" strokeWidth="2" />
          {/* Sack tie rope */}
          <ellipse cx="50" cy="36" rx="28" ry="4" fill="#a46d3e" />
          {/* Red/White label */}
          <rect x="32" y="55" width="36" height="34" rx="3" fill="#ffffff" stroke="#e0e0e0" />
          <rect x="34" y="57" width="32" height="10" rx="1.5" fill="#dc2626" />
          <text x="50" y="65" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">ARROZ</text>
          {/* Grain sheaf illustration */}
          <circle cx="50" cy="76" r="5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
          <path d="M46 84 C48 80 52 80 54 84" stroke="#ca8a04" strokeWidth="1" strokeLinecap="round" />
          <text x="50" y="86" fill="#1e293b" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">1 KG</text>
        </svg>
      </div>
    );
  }

  // Açúcar (Blue Sugar Pack)
  if (norm.includes('açúcar') || norm.includes('acucar') || norm === 'p002') {
    return (
      <div className={`relative flex items-center justify-center bg-blue-50/80 rounded-lg p-2 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xs" fill="none">
          {/* Pack body */}
          <path d="M25 25 L75 25 L73 112 L27 112 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2.5" />
          {/* Top fold */}
          <polygon points="25,25 50,15 75,25 50,22" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="1.5" />
          {/* White label banner */}
          <rect x="30" y="48" width="40" height="42" rx="4" fill="#ffffff" />
          <text x="50" y="62" fill="#1d4ed8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">AÇÚCAR</text>
          <text x="50" y="73" fill="#64748b" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">BRANCO</text>
          {/* Sugar bowl icon */}
          <path d="M42 82 C42 86 58 86 58 82 Z" fill="#93c5fd" />
          <text x="50" y="87" fill="#3b82f6" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">1 KG</text>
        </svg>
      </div>
    );
  }

  // Óleo (Cooking Oil Bottle with Yellow Liquid)
  if (norm.includes('óleo') || norm.includes('oleo') || norm === 'p003') {
    return (
      <div className={`relative flex items-center justify-center bg-amber-50/80 rounded-lg p-2 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xs" fill="none">
          {/* Red cap */}
          <rect x="44" y="8" width="12" height="10" rx="2" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
          {/* Bottle neck */}
          <path d="M45 18 L45 28 L36 42 L34 112 L66 112 L64 42 L55 28 L55 18 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" opacity="0.9" />
          {/* Yellow oil liquid level */}
          <path d="M35 50 L34 111 L66 111 L65 50 C60 48 40 48 35 50 Z" fill="#eab308" />
          {/* Highlight glare */}
          <path d="M38 55 L37 105" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          {/* Label */}
          <rect x="37" y="65" width="26" height="32" rx="3" fill="#dc2626" />
          <text x="50" y="77" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">ÓLEO</text>
          <text x="50" y="86" fill="#fef08a" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">SOJA</text>
          <text x="50" y="94" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">1L</text>
        </svg>
      </div>
    );
  }

  // Farinha (Flour Bag)
  if (norm.includes('farinha') || norm.includes('fuba') || norm === 'p007') {
    return (
      <div className={`relative flex items-center justify-center bg-orange-50/80 rounded-lg p-2 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xs" fill="none">
          {/* Flour bag body */}
          <path d="M26 30 C25 60 22 96 26 112 C32 115 68 115 74 112 C78 96 75 60 74 30 Z" fill="#ea580c" stroke="#c2410c" strokeWidth="2.5" />
          {/* White top roll */}
          <path d="M24 30 C26 22 74 22 76 30 C72 35 28 35 24 30 Z" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
          {/* White center label */}
          <rect x="32" y="52" width="36" height="42" rx="4" fill="#ffffff" stroke="#fed7aa" />
          <text x="50" y="66" fill="#ea580c" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">FARINHA</text>
          <text x="50" y="76" fill="#78716c" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">DE TRIGO</text>
          {/* Wheat icon */}
          <ellipse cx="50" cy="85" rx="4" ry="2.5" fill="#f59e0b" />
          <text x="50" y="92" fill="#ea580c" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">1 KG</text>
        </svg>
      </div>
    );
  }

  // Leite (Milk Box / Carton)
  if (norm.includes('leite') || norm === 'p004') {
    return (
      <div className={`relative flex items-center justify-center bg-cyan-50/80 rounded-lg p-2 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xs" fill="none">
          {/* Blue top fold */}
          <polygon points="28,34 50,16 72,34" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
          {/* Cap on fold */}
          <ellipse cx="50" cy="24" rx="6" ry="4" fill="#38bdf8" stroke="#0284c7" />
          {/* Carton body */}
          <path d="M28 34 L72 34 L70 112 L30 112 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
          {/* Blue graphic pattern */}
          <path d="M30 65 C40 60 60 70 70 65 L70 112 L30 112 Z" fill="#0284c7" />
          <text x="50" y="55" fill="#0369a1" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">LEITE</text>
          <text x="50" y="85" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">UHT</text>
          <text x="50" y="98" fill="#e0f2fe" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">1 LITRO</text>
        </svg>
      </div>
    );
  }

  // Refrigerante (Soda Bottle - Red label like Coca-Cola)
  if (norm.includes('refrigerante') || norm.includes('blue') || norm.includes('cuca') || norm === 'p005') {
    return (
      <div className={`relative flex items-center justify-center bg-red-50/80 rounded-lg p-2 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xs" fill="none">
          {/* Red bottle cap */}
          <rect x="44" y="6" width="12" height="8" rx="2" fill="#dc2626" />
          {/* Dark bottle shape */}
          <path d="M45 14 L45 28 L36 45 L35 114 L65 114 L64 45 L55 28 L55 14 Z" fill="#1e1b4b" stroke="#0f172a" strokeWidth="2" />
          {/* Red Coca/Soda label */}
          <rect x="35" y="58" width="30" height="34" rx="2" fill="#dc2626" />
          <path d="M37 72 C45 68 55 78 63 74" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <text x="50" y="84" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">SODA</text>
          {/* Glare */}
          <path d="M39 36 L38 52" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>
    );
  }

  // Pão (Bread Loaf)
  if (norm.includes('pão') || norm.includes('pao') || norm === 'p006') {
    return (
      <div className={`relative flex items-center justify-center bg-amber-50/80 rounded-lg p-2 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xs" fill="none">
          {/* Loaf crust */}
          <path d="M16 68 C16 42 35 34 50 34 C65 34 84 42 84 68 C84 86 76 96 50 96 C24 96 16 86 16 68 Z" fill="#b45309" stroke="#92400e" strokeWidth="2.5" />
          {/* Bottom lighter shade */}
          <path d="M20 74 C25 90 75 90 80 74 C80 84 72 94 50 94 C28 94 20 84 20 74 Z" fill="#92400e" opacity="0.6" />
          {/* Baker cuts on top */}
          <path d="M32 44 C34 54 36 60 38 66" stroke="#fef3c7" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M48 40 C50 52 50 58 52 66" stroke="#fef3c7" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M64 44 C64 54 62 60 62 66" stroke="#fef3c7" strokeWidth="3.5" strokeLinecap="round" />
          <text x="50" y="84" fill="#fef3c7" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">PÃO FRESCO</text>
        </svg>
      </div>
    );
  }

  // Detergente (Cleaning Spray/Bottle)
  if (norm.includes('detergente') || norm.includes('limpeza') || norm === 'p008') {
    return (
      <div className={`relative flex items-center justify-center bg-emerald-50/80 rounded-lg p-2 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xs" fill="none">
          {/* Trigger sprayer cap */}
          <path d="M40 18 L60 18 L58 10 L44 10 Z" fill="#dc2626" />
          <path d="M58 14 L75 14 L75 22 L62 22 Z" fill="#ef4444" />
          <path d="M60 22 L65 30 L58 30 Z" fill="#b91c1c" />
          {/* Bottle body */}
          <path d="M45 28 L42 45 L32 55 L32 112 L68 112 L68 55 L58 45 L55 28 Z" fill="#059669" stroke="#047857" strokeWidth="2" />
          {/* White label */}
          <rect x="36" y="68" width="28" height="34" rx="3" fill="#ffffff" />
          <circle cx="50" cy="80" r="5" fill="#10b981" />
          <text x="50" y="94" fill="#047857" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">LIMPEZA</text>
          {/* Glare */}
          <path d="M36 60 L36 106" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>
    );
  }

  // Generic / Default fallback package
  return (
    <div className={`relative flex items-center justify-center bg-slate-100 rounded-lg p-2 ${sizeClasses} ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full text-slate-400" fill="currentColor">
        <path d="M50 15 L85 35 L85 75 L50 95 L15 75 L15 35 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
        <path d="M50 15 L50 95" stroke="#94a3b8" strokeWidth="2" />
        <path d="M50 55 L85 35" stroke="#94a3b8" strokeWidth="2" />
        <path d="M50 55 L15 35" stroke="#94a3b8" strokeWidth="2" />
      </svg>
    </div>
  );
};
