import React from 'react';
import { ARCHITECTURE_LAYERS } from '../data/planningData';
import { ArrowDown, CheckCircle2, Shield, Lock, Layers } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-stone-900">Princípio Fundamental da Arquitectura</h2>
        </div>
        <p className="text-sm text-stone-600 max-w-4xl leading-relaxed">
          O <strong>Núcleo Fiscal (Fiscal Core)</strong> é rigorosamente isolado da interface e de dependências de transporte.
          A mesma base fiscal serve a aplicação Web, o futuro terminal POS, aplicações móveis Android e APIs B2B de terceiros.
        </p>

        {/* Pipeline Diagram */}
        <div className="mt-8 space-y-3">
          {ARCHITECTURE_LAYERS.map((layer, index) => (
            <React.Fragment key={layer.name}>
              <div className="p-5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100/80 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold text-stone-900 text-base">{layer.name}</h3>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-200 text-stone-800">
                    {layer.badge}
                  </span>
                </div>

                <p className="text-xs text-stone-600 mb-3">{layer.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-stone-700 block mb-1">Módulos &amp; Componentes:</span>
                    <ul className="list-disc list-inside text-stone-600 space-y-0.5">
                      {layer.components.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700 block mb-1">Responsabilidades Centrais:</span>
                    <ul className="list-disc list-inside text-stone-600 space-y-0.5">
                      {layer.responsibilities.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {index < ARCHITECTURE_LAYERS.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className="flex items-center gap-1.5 text-stone-400 text-xs font-mono">
                    <ArrowDown className="w-4 h-4 text-amber-600" />
                    <span>Inversão de Dependências &amp; Chamadas Tipadas</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Cross-Cutting Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200">
          <div className="flex items-center gap-2 mb-2 text-stone-900 font-semibold text-sm">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Imutabilidade Fiscal</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Uma vez emitido o documento fiscal, é estritamente proibida qualquer alteração ou eliminação física.
            Rectificações exigem obrigatoriamente Notas de Crédito ou Débito com referência encadeada.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200">
          <div className="flex items-center gap-2 mb-2 text-stone-900 font-semibold text-sm">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Isolamento Multiempresa</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Arquitectura multi-inquilino baseada em <code>company_id</code> contextual com chaves estrangeiras rígidas.
            Cada empresa possui estabelecimentos, utilizadores e séries completamente segregados.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200">
          <div className="flex items-center gap-2 mb-2 text-stone-900 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>Auditoria Contínua</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Trilha de auditoria (AuditLog) imutável que regista utilizador, timestamp UTC, IP, acção e snapshot das
            alterações para cada evento fiscal ou de configuração relevante.
          </p>
        </div>
      </div>
    </div>
  );
};
