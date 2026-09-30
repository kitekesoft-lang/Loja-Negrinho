import React from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User } from '../../core/fiscal/types/user';
import {
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
} from 'lucide-react';

interface OperatorDashboardViewProps {
  currentUser: User;
  onNavigateTab?: (tabId: string) => void;
}

export const OperatorDashboardView: React.FC<OperatorDashboardViewProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const db = FiscalDatabase.getInstance();

  // First name
  const displayName = currentUser.name.split(' ')[0] || 'Ana';

  // Chart data: Vendas dos últimos 7 dias (0 to 400K)
  const chartDays = [
    { day: 'Seg', val: 120 },
    { day: 'Ter', val: 165 },
    { day: 'Qua', val: 210 },
    { day: 'Qui', val: 190 },
    { day: 'Sex', val: 240 },
    { day: 'Sáb', val: 265 },
    { day: 'Dom', val: 340 },
  ];

  const maxVal = 400;
  const graphWidth = 560;
  const graphHeight = 170;
  const paddingX = 40;
  const paddingY = 20;

  const points = chartDays.map((d, i) => {
    const x = paddingX + (i / (chartDays.length - 1)) * (graphWidth - paddingX * 2);
    const y = graphHeight - paddingY - (d.val / maxVal) * (graphHeight - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = points[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${graphHeight - paddingY} L ${points[0].x} ${graphHeight - paddingY} Z`;

  // Últimas Vendas (Exact from mockup)
  const latestSales = [
    { date: '30/09', product: 'Arroz (2)', value: '20.000 Kz' },
    { date: '30/09', product: 'Açúcar (1)', value: '5.000 Kz' },
    { date: '30/09', product: 'Óleo (1)', value: '8.500 Kz' },
    { date: '30/09', product: 'Refrigerante (2)', value: '6.000 Kz' },
    { date: '30/09', product: 'Pão (3)', value: '7.500 Kz' },
  ];

  return (
    <div id="operator-dashboard-view" className="space-y-5">
      {/* 1. Header Saudação */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Bem-vindo(a), {displayName}!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Aqui está um resumo da sua loja.
        </p>
      </div>

      {/* 2. Quatro Cartões de Métricas (100% fiéis às cores e proporções) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Vendas hoje (Verde Esmeralda) */}
        <div className="bg-[#10b981] text-white rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-emerald-50">Vendas hoje</span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white mt-2">
              250.000 Kz
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-100 font-medium mt-1">
              <span>↑ 12% em relação a ontem</span>
            </div>
          </div>
        </div>

        {/* Card 2: Produtos (Azul Royal) */}
        <div className="bg-[#2563eb] text-white rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-50">Produtos</span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white mt-2">
              458
            </div>
            <div className="text-[11px] text-blue-100 font-medium mt-1">
              Total em estoque
            </div>
          </div>
        </div>

        {/* Card 3: Clientes (Roxo / Púrpura) */}
        <div className="bg-[#8b5cf6] text-white rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-purple-50">Clientes</span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white mt-2">
              126
            </div>
            <div className="text-[11px] text-purple-100 font-medium mt-1">
              Cadastrados
            </div>
          </div>
        </div>

        {/* Card 4: Estoque baixo (Laranja / Âmbar) */}
        <div className="bg-[#f59e0b] text-white rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
              8
            </div>
            <span className="text-xs font-semibold text-amber-50">Estoque baixo</span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white mt-2">
              8
            </div>
            <div className="text-[11px] text-amber-100 font-medium mt-1">
              Produtos
            </div>
          </div>
        </div>
      </div>

      {/* 3. Duas Colunas: Gráfico à esquerda + Tabela à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Gráfico: Vendas dos últimos 7 dias (7 colunas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-2">
            Vendas dos últimos 7 dias
          </h2>

          <div className="relative w-full h-[200px] flex items-end">
            <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Linhas de grelha horizontais */}
              {[400, 300, 200, 100, 0].map((val) => {
                const y = graphHeight - paddingY - (val / maxVal) * (graphHeight - paddingY * 2);
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={graphWidth - paddingX}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="sans-serif"
                      textAnchor="end"
                    >
                      {val === 0 ? '0' : `${val}K`}
                    </text>
                  </g>
                );
              })}

              {/* Área preenchida suave */}
              <path d={areaD} fill="url(#chartGradient)" />

              {/* Linha azul */}
              <path
                d={pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pontos azuis */}
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}

              {/* Rótulos dos dias X */}
              {points.map((pt, i) => (
                <text
                  key={i}
                  x={pt.x}
                  y={graphHeight - 2}
                  fill="#64748b"
                  fontSize="9.5"
                  fontWeight="500"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {pt.day}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Tabela: Últimas vendas (5 colunas) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-3">
            Últimas vendas
          </h2>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-2.5">Data</th>
                  <th className="pb-2.5">Produto</th>
                  <th className="pb-2.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {latestSales.map((sale, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 text-slate-500 font-medium">{sale.date}</td>
                    <td className="py-2.5 font-bold text-slate-800">{sale.product}</td>
                    <td className="py-2.5 text-right font-medium text-slate-900">{sale.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Banner Inferior de Produtos com Estoque Baixo */}
      <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-3.5 flex items-center gap-3 text-xs shadow-2xs">
        <div className="w-7 h-7 rounded-full bg-[#ef4444] text-white flex items-center justify-center shrink-0 font-bold">
          !
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-[#b91c1c] mr-2">Produtos com estoque baixo:</span>
          <span className="text-[#991b1b] font-medium">
            Arroz (5), Açúcar (3), Óleo (2), Leite (4), Café (1)
          </span>
        </div>
      </div>
    </div>
  );
};
