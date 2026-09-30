import React from 'react';
import { ROADMAP_PHASES } from '../data/planningData';
import { CheckCircle2, Clock, ShieldAlert, ArrowRight } from 'lucide-react';

export const RoadmapView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Roteiro de Desenvolvimento em 4 Fases</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Execução incremental e estrita: nenhuma fase inicia antes da anterior estar funcional, testada e documentada.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
            Todas as 4 Fases Concluídas (Núcleo, AGT, SAF-T &amp; ERP)
          </span>
        </div>

        <div className="space-y-4">
          {ROADMAP_PHASES.map((phase) => {
            const isCompleted = phase.status === 'completed';
            const isCurrent = phase.status === 'in_progress';

            return (
              <div
                key={phase.id}
                className={`p-5 rounded-lg border transition-all ${
                  isCompleted
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : isCurrent
                    ? 'border-amber-400 bg-amber-50/20 shadow-xs ring-1 ring-amber-300'
                    : 'border-stone-200 bg-stone-50/50 opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-stone-400 shrink-0" />
                    )}
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">{phase.title}</h3>
                      <p className="text-xs text-stone-500">{phase.subtitle}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isCurrent
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {phase.badge}
                  </span>
                </div>

                <p className="text-xs text-stone-600 mb-3">{phase.description}</p>

                <div className="border-t border-stone-200/80 pt-3">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wide block mb-1.5">
                    Entregáveis e Critérios de Conclusão:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {phase.keyDeliverables.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-stone-600">
                        <span className="text-stone-400 font-mono text-[10px] mt-0.5">[{idx + 1}]</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200/60 text-[11px] text-stone-500 flex items-center justify-between">
                  <span><strong>Pré-requisito:</strong> {phase.prerequisites}</span>
                  {isCurrent && (
                    <span className="text-amber-800 font-semibold flex items-center gap-1">
                      Aguardando autorização para iniciar implementação <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
