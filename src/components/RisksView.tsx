import React from 'react';
import { TECHNICAL_RISKS } from '../data/planningData';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export const RisksView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-stone-200">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-stone-900">Riscos Técnicos Mapeados e Estratégias de Mitigação</h2>
        </div>
        <p className="text-xs text-stone-500 mb-6">
          Identificação antecipada de pontos críticos fiscais, criptográficos e de concorrência antes da codificação.
        </p>

        <div className="space-y-4">
          {TECHNICAL_RISKS.map((risk) => (
            <div
              key={risk.id}
              className="p-4 rounded-lg border border-stone-200 bg-stone-50 hover:bg-white transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-stone-500">{risk.id}</span>
                  <h3 className="font-bold text-stone-900 text-sm">{risk.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-medium">
                    {risk.category}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      risk.severity === 'Crítico'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : risk.severity === 'Alto'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {risk.severity}
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600">{risk.description}</p>

              <div className="bg-white p-3 rounded border border-stone-200 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Estratégia de Mitigação Implementada:</span>
                </div>
                <p className="text-stone-700 leading-relaxed text-[11px]">{risk.mitigationStrategy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
