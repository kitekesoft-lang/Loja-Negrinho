import React, { useState } from 'react';
import { TAX_RATES_ANGOLA } from '../data/planningData';
import { Calculator, Hash, ShieldCheck, CheckCircle } from 'lucide-react';

export const TaxEnginePreview: React.FC = () => {
  const [unitPrice, setUnitPrice] = useState<number>(100000); // 100,000 Kz
  const [quantity, setQuantity] = useState<number>(2);
  const [discountPercent, setDiscountPercent] = useState<number>(5);
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>('IVA_14');
  const [applyWithholding, setApplyWithholding] = useState<boolean>(true); // 6.5% de retenção

  const selectedTax = TAX_RATES_ANGOLA.find((t) => t.code === selectedTaxCode) || TAX_RATES_ANGOLA[0];

  // Mathematical Calculations
  const grossSubtotal = unitPrice * quantity;
  const discountAmount = grossSubtotal * (discountPercent / 100);
  const taxableBase = grossSubtotal - discountAmount;
  const taxAmount = taxableBase * (selectedTax.rate / 100);
  const withholdingAmount = applyWithholding ? taxableBase * 0.065 : 0;
  const netTotal = taxableBase + taxAmount - withholdingAmount;

  // Simulated Hash chaining calculation demonstration
  const sampleDocNumber = 'FT A2026/000001';
  const sampleDate = '2026-09-20';
  const rawString = `${sampleDate};${sampleDate}T07:22:00;${sampleDocNumber};${netTotal.toFixed(2)};`;
  // Simple deterministic demonstration hash
  const pseudoHash = `d41d8cd98f00b204e9800998ecf8427e${Math.abs(Math.sin(netTotal)).toString(16).substring(2, 10)}`;
  const controlChars = `${pseudoHash[0]}${pseudoHash[10]}${pseudoHash[20]}${pseudoHash[30]}`.toUpperCase();

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-stone-900">Motor de Impostos (Tax Engine) — Simulação de Regras</h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Demonstração interactiva da lógica de apuramento tributário angolano (IVA, Isenções, Retenções e Hashes).
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
            Regras de Angola
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                Parâmetros da Linha de Facturação
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Preço Unitário (Kz)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Desconto Comercial (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Enquadramento de Imposto (IVA)</label>
                <select
                  value={selectedTaxCode}
                  onChange={(e) => setSelectedTaxCode(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  {TAX_RATES_ANGOLA.filter((t) => t.type === 'IVA').map((tax) => (
                    <option key={tax.code} value={tax.code}>
                      {tax.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-500 mt-1 italic">
                  Base Legal: {selectedTax.legalBasis}
                  {selectedTax.exemptionCode && ` (Código SAF-T: ${selectedTax.exemptionCode})`}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyWithholding}
                    onChange={(e) => setApplyWithholding(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <span className="text-xs font-medium text-stone-800">
                    Aplicar Retenção na Fonte (6.5% - Prestação de Serviços)
                  </span>
                </label>
                <p className="text-[11px] text-stone-500 ml-5 mt-0.5">
                  Conforme Lei n.º 19/14 (Imposto Industrial / Serviços a sujeitos passivos).
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown & Totals */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-stone-900 text-white p-5 rounded-lg space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-xs uppercase tracking-wider text-stone-400 font-sans font-bold">
                  Demonstração de Liquidação Fiscal
                </span>
                <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-amber-400">
                  Moeda: Kwanza (AOA)
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-stone-300">
                <div className="flex justify-between">
                  <span>Total Ilíquido ({quantity} un × {formatKz(unitPrice)}):</span>
                  <span className="text-white font-semibold">{formatKz(grossSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span>Desconto Comercial ({discountPercent}%):</span>
                    <span>- {formatKz(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-stone-800 pt-1.5">
                  <span className="text-stone-400">Incidência / Base Tributável:</span>
                  <span className="text-white font-semibold">{formatKz(taxableBase)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    IVA {selectedTax.rate}% ({selectedTax.exemptionCode ? `Isento ${selectedTax.exemptionCode}` : 'Apurado'}):
                  </span>
                  <span className="text-emerald-400 font-semibold">{formatKz(taxAmount)}</span>
                </div>
                {applyWithholding && (
                  <div className="flex justify-between text-rose-300">
                    <span>Retenção na Fonte (6.50%):</span>
                    <span>- {formatKz(withholdingAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-stone-700 pt-3 flex justify-between items-baseline font-sans">
                <span className="text-sm font-bold text-white">Total Líquido a Pagar:</span>
                <span className="text-xl font-extrabold text-amber-400 font-mono">
                  {formatKz(netTotal)}
                </span>
              </div>
            </div>

            {/* Simulated Fiscal Hash Generation */}
            <div className="p-4 rounded-lg border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <Hash className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulação do Encadeamento de Hashes (J-Hash / SHA-256)</span>
              </div>
              <p className="text-[11px] text-stone-500 font-mono break-all">
                Payload: {rawString}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded border border-stone-200">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold">Hash SHA-256</span>
                  <span className="font-mono text-[11px] text-stone-800 break-all">{pseudoHash}</span>
                </div>
                <div className="p-2 bg-white rounded border border-stone-200 flex flex-col justify-center items-center">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold">Código de Controlo (Factura)</span>
                  <span className="font-mono text-base font-bold text-amber-600 tracking-widest">{controlChars}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
