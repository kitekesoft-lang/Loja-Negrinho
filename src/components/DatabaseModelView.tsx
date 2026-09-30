import React, { useState } from 'react';
import { INITIAL_ENTITIES } from '../data/planningData';
import { Database, Table, Key, ArrowRightLeft } from 'lucide-react';

export const DatabaseModelView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const categories = ['Todas', 'Organizacional', 'Segurança', 'Catálogo', 'Fiscal & Documentos', 'Auditoria'];

  const filteredEntities = selectedCategory === 'Todas'
    ? INITIAL_ENTITIES
    : INITIAL_ENTITIES.filter((e) => e.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-stone-900">Modelo Inicial da Base de Dados (Fase 1)</h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Esquema relacional em 3.ª Forma Normal com chaves estrangeiras restritivas e integridade atómica.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Entities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEntities.map((entity) => (
            <div
              key={entity.name}
              className="border border-stone-200 rounded-lg p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-stone-700" />
                  <h3 className="font-bold text-stone-900 text-sm">{entity.name}</h3>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                  {entity.category}
                </span>
              </div>

              <p className="text-xs text-stone-600 mb-3">{entity.description}</p>

              {/* Primary Key */}
              <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200 mb-3 font-mono">
                <Key className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>PK: {entity.primaryKey}</span>
              </div>

              {/* Attributes Table */}
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      <th className="py-1 font-semibold">Coluna</th>
                      <th className="py-1 font-semibold">Tipo</th>
                      <th className="py-1 font-semibold">Restrições</th>
                      <th className="py-1 font-semibold">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-700 font-mono">
                    {entity.attributes.map((attr) => (
                      <tr key={attr.name}>
                        <td className="py-1 font-semibold text-stone-900">{attr.name}</td>
                        <td className="py-1 text-stone-600">{attr.type}</td>
                        <td className="py-1 text-amber-700 text-[10px]">{attr.constraints || '-'}</td>
                        <td className="py-1 font-sans text-stone-600 text-[11px]">{attr.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Relationships */}
              {entity.relationships.length > 0 && (
                <div className="pt-2 border-t border-stone-200 text-[11px]">
                  <div className="flex items-center gap-1 text-stone-500 font-semibold mb-1">
                    <ArrowRightLeft className="w-3 h-3 text-stone-400" />
                    <span>Relações:</span>
                  </div>
                  <ul className="space-y-0.5 text-stone-600">
                    {entity.relationships.map((rel, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="font-mono text-stone-900 font-semibold">[{rel.type}]</span>
                        <span className="font-semibold text-stone-800">{rel.target}:</span>
                        <span>{rel.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
