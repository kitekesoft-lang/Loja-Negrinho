import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { NifValidator } from '../../core/fiscal/security/NifValidator';
import { Percent, Package, Users, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const TaxCatalogView: React.FC = () => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  useEffect(() => {
    return db.subscribe(() => setTick((t) => t + 1));
  }, [db]);

  const taxConfigs = Array.from(db.taxConfigurations.values());
  const products = Array.from(db.products.values());
  const customers = Array.from(db.customers.values());

  // Validador de NIF em tempo real
  const [testNif, setTestNif] = useState<string>('5417082341');
  const [testCountry, setTestCountry] = useState<string>('AO');
  const nifValidationResult = NifValidator.validate(testNif, testCountry);

  return (
    <div className="space-y-8">
      {/* 1. MOTOR DE IMPOSTOS (TAX ENGINE) */}
      <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-900 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                1.7 Motor de Impostos (Tax Engine Parametrizável)
              </h2>
              <p className="text-xs text-stone-500">
                Taxas de IVA (14% Geral, 7% Reduzida, 5% Cabinda), Isenções (M00-M99) e Retenção na Fonte de 6.5%
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
            AGT Tax Rules Activas
          </span>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Designação Oficial</th>
                <th className="py-2.5 px-3 text-center">Tipo</th>
                <th className="py-2.5 px-3 text-right">Taxa (%)</th>
                <th className="py-2.5 px-3 text-center">Isenção</th>
                <th className="py-2.5 px-3">Fundamentação Legal (Legislação Tributária)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {taxConfigs.map((tax) => (
                <tr key={tax.id} className="hover:bg-stone-50/60">
                  <td className="py-2 px-3 font-mono font-bold text-stone-900">{tax.code}</td>
                  <td className="py-2 px-3 font-medium text-stone-800">{tax.name}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-[10px]">
                      {tax.taxType} / {tax.taxCode}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                    {tax.ratePercentage.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-center">
                    {tax.exemptionCode ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[10px]">
                        {tax.exemptionCode}
                      </span>
                    ) : (
                      <span className="text-stone-400">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-stone-600 text-[11px]">{tax.legalBasis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. CATÁLOGO DE ARTIGOS E SERVIÇOS */}
      <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-900 flex items-center justify-center font-bold">
              <Package className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                1.6 Catálogo de Produtos e Serviços Fiscalmente Mapeados
              </h2>
              <p className="text-xs text-stone-500">
                Artigos com vinculação estrita a código de imposto, unidade legal e incidência de retenção na fonte
              </p>
            </div>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            {products.length} itens parametrizados
          </span>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <th className="py-2.5 px-3">Código / SKU</th>
                <th className="py-2.5 px-3">Descrição Comercial</th>
                <th className="py-2.5 px-3 text-center">Tipo</th>
                <th className="py-2.5 px-3 text-center">Un.</th>
                <th className="py-2.5 px-3 text-right">Preço Padrão (AOA)</th>
                <th className="py-2.5 px-3 text-center">Regime IVA</th>
                <th className="py-2.5 px-3 text-center">Retenção na Fonte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {products.map((p) => {
                const tax = db.taxConfigurations.get(p.taxConfigurationId);
                return (
                  <tr key={p.id} className="hover:bg-stone-50/60">
                    <td className="py-2 px-3 font-mono font-bold text-stone-800">{p.code}</td>
                    <td className="py-2 px-3 font-medium text-stone-900">{p.description}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                        {p.type === 'PRODUCT' ? 'PRODUTO' : 'SERVIÇO'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-stone-500">{p.unit}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                      {p.standardPrice.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-800">
                        {tax?.name || p.taxConfigurationId}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {p.withholdingTaxApplicable ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          6.5% (CIRT)
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">Não aplicável</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. CLIENTES & VALIDADOR DE NIF ANGOLANO */}
      <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-900 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                1.4 Cadastro de Clientes e Validador de NIF Angolano
              </h2>
              <p className="text-xs text-stone-500">
                Suporte nativo a 999999999 (Consumidor Final), Empresas (10 dígitos) e Singulares (BI 14 chars)
              </p>
            </div>
          </div>
        </div>

        {/* Live NIF Sandbox Tester */}
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Validador Interactivo de NIF Angolano (Algoritmo AGT):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">NIF a Testar:</label>
              <input
                type="text"
                value={testNif}
                onChange={(e) => setTestNif(e.target.value)}
                placeholder="Ex: 5417082341 ou 999999999"
                className="w-full text-xs font-mono font-bold bg-white border border-stone-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-[11px] text-stone-500 mb-1">País:</label>
              <select
                value={testCountry}
                onChange={(e) => setTestCountry(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2"
              >
                <option value="AO">Angola (AO)</option>
                <option value="PT">Portugal (PT)</option>
                <option value="ZA">África do Sul (ZA)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <div
                className={`p-2 rounded-lg text-xs flex items-center gap-2 border font-medium ${
                  nifValidationResult.isValid
                    ? 'bg-emerald-100/70 text-emerald-900 border-emerald-300'
                    : 'bg-rose-100/70 text-rose-900 border-rose-300'
                }`}
              >
                {nifValidationResult.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="truncate">
                  {nifValidationResult.isValid
                    ? `Válido: [${nifValidationResult.type}]`
                    : nifValidationResult.errorMessage}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <th className="py-2.5 px-3">Nome / Razão Social</th>
                <th className="py-2.5 px-3">NIF</th>
                <th className="py-2.5 px-3 text-center">Tipo de Contribuinte</th>
                <th className="py-2.5 px-3">Morada de Facturação</th>
                <th className="py-2.5 px-3 text-center">País</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50/60">
                  <td className="py-2 px-3 font-semibold text-stone-900">{c.name}</td>
                  <td className="py-2 px-3 font-mono font-bold text-stone-800">{c.taxId}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                      {c.customerType}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-stone-600">{c.billingAddress}</td>
                  <td className="py-2 px-3 text-center font-mono">{c.country}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
