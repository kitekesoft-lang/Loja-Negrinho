import React, { useState } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User } from '../../core/fiscal/types/user';
import { ProductVisual } from '../common/ProductVisual';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  CreditCard,
  Banknote,
  Building,
  PieChart,
  Printer,
  ChevronDown,
} from 'lucide-react';

interface OperatorReportsViewProps {
  currentUser: User;
}

export const OperatorReportsView: React.FC<OperatorReportsViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [period, setPeriod] = useState<'7dias' | 'mes' | 'hoje'>('7dias');

  // Dados dos produtos mais vendidos conforme mockup
  const topProducts = [
    { code: 'P001', name: 'Arroz', category: 'Alimentação', qty: 85, total: 425000, percent: 100 },
    { code: 'P002', name: 'Açúcar', category: 'Alimentação', qty: 64, total: 320000, percent: 75 },
    { code: 'P003', name: 'Óleo', category: 'Alimentação', qty: 48, total: 408000, percent: 56 },
    { code: 'P004', name: 'Leite', category: 'Bebidas/Lácteos', qty: 42, total: 105000, percent: 49 },
    { code: 'P005', name: 'Refrigerante', category: 'Bebidas', qty: 38, total: 114000, percent: 44 },
    { code: 'P006', name: 'Pão', category: 'Padaria', qty: 21, total: 52500, percent: 25 },
  ];

  // Formas de pagamento
  const paymentMethods = [
    { method: 'Dinheiro (Numerário)', percentage: 55, amount: 797500, color: 'bg-emerald-500', text: 'text-emerald-700', icon: Banknote },
    { method: 'Multicaixa / TPA', percentage: 30, amount: 435000, color: 'bg-blue-500', text: 'text-blue-700', icon: CreditCard },
    { method: 'Transferência Bancária', percentage: 15, amount: 217500, color: 'bg-purple-500', text: 'text-purple-700', icon: Building },
  ];

  // Gráfico de vendas dos últimos 7 dias
  const chartDays = [
    { day: 'Seg', val: 140 },
    { day: 'Ter', val: 195 },
    { day: 'Qua', val: 230 },
    { day: 'Qui', val: 210 },
    { day: 'Sex', val: 285 },
    { day: 'Sáb', val: 320 },
    { day: 'Dom', val: 390 },
  ];

  const maxVal = 400;
  const graphWidth = 540;
  const graphHeight = 160;
  const paddingX = 35;
  const paddingY = 15;

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

  return (
    <div id="operator-reports-view" className="space-y-4">
      {/* 1. Header & Filtro de Período */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Relatórios de Desempenho
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Análise detalhada de faturamento, vendas por produto e formas de pagamento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de Período */}
          <div className="flex bg-white border border-slate-200/90 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setPeriod('hoje')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'hoje' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriod('7dias')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === '7dias' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriod('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'mes' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Este Mês
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* 2. Quatro Cartões de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Total Vendido</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">1.450.000 Kz</span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">↑ 18% vs período anterior</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Lucro Bruto Estimado</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">435.000 Kz</span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Margem média 30%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Ticket Médio</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">11.500 Kz</span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Por venda no caixa</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Itens Vendidos</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">298 Unidades</span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">126 Atendimentos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Duas Colunas: Gráfico + Formas de Pagamento & Tabela de Mais Vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Coluna Esquerda: Gráfico de Vendas + Meios de Quitação (7 colunas) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Gráfico Linear */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Evolução de Vendas Diárias (Kz)
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">Valores em Milhares (K)</span>
            </div>

            <div className="w-full h-[180px]">
              <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="repGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

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
                        x={paddingX - 8}
                        y={y + 3}
                        fill="#94a3b8"
                        fontSize="8.5"
                        textAnchor="end"
                      >
                        {val === 0 ? '0' : `${val}K`}
                      </text>
                    </g>
                  );
                })}

                <path d={areaD} fill="url(#repGradient)" />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

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

                {points.map((pt, i) => (
                  <text
                    key={i}
                    x={pt.x}
                    y={graphHeight - 2}
                    fill="#64748b"
                    fontSize="9"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {pt.day}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Distribuição por Meio de Pagamento
            </h2>

            <div className="space-y-3">
              {paymentMethods.map((pm, idx) => {
                const Icon = pm.icon;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold text-slate-800">{pm.method}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {pm.amount.toLocaleString('pt-AO')} Kz
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${pm.text} bg-slate-100`}>
                          {pm.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Barra de progresso */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${pm.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pm.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Produtos Mais Vendidos (5 colunas) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Produtos Mais Vendidos
              </h2>
              <span className="text-[10px] text-blue-600 font-semibold">Top 6</span>
            </div>

            <div className="divide-y divide-slate-100">
              {topProducts.map((p) => (
                <div key={p.code} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ProductVisual codeOrName={p.name} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.category}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900 font-mono">
                      {p.total.toLocaleString('pt-AO')} Kz
                    </div>
                    <div className="text-[10px] text-slate-500">{p.qty} unidades vendidas</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-center">
            <span className="text-[11px] text-slate-400">
              Relatório em conformidade com o formato SAF-T(AO) e Portaria n.º 292/18.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
