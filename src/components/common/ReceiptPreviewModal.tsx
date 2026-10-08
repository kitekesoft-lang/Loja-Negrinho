import React, { useState } from 'react';
import { FiscalDocument } from '../../core/fiscal/types/document';
import { Company, Establishment } from '../../core/fiscal/types/company';
import { FISCAL_DOCUMENT_TYPES } from '../../core/fiscal/types/series';
import { KitekeLogo } from '../common/KitekeLogo';
import { FiscalQRCode } from './FiscalQRCode';
import {
  X,
  Printer,
  ShieldCheck,
  FileText,
  Receipt,
  Download,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

interface ReceiptPreviewModalProps {
  document: FiscalDocument;
  company: Company;
  establishment?: Establishment;
  onClose: () => void;
  initialMode?: 'thermal' | 'a4';
}

/**
 * Modal Completo de Pré-visualização e Impressão de Documentos Fiscais
 * Oferece alternância instantânea entre:
 * 1. Talão Térmico de Caixa (POS 80mm / 58mm)
 * 2. Factura Formal A4 (Padrão Legal AGT)
 */
export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  document,
  company,
  establishment,
  onClose,
  initialMode = 'thermal',
}) => {
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>(initialMode);
  const [documentCopy, setDocumentCopy] = useState<'ORIGINAL' | 'DUPLICADO' | 'SEGUNDA_VIA'>('ORIGINAL');
  const docTypeInfo = FISCAL_DOCUMENT_TYPES[document.documentTypeCode];

  const handlePrint = () => {
    window.print();
  };

  // Agrupamento de impostos para quadro resumo AGT
  const taxSummaryMap: Record<
    string,
    {
      description: string;
      rate: number;
      taxableBase: number;
      taxAmount: number;
      exemptionCode?: string;
      exemptionReason?: string;
    }
  > = {};

  document.lines.forEach((line) => {
    const key = `${line.taxRate}_${line.exemptionCode || 'NONE'}`;
    if (!taxSummaryMap[key]) {
      let desc = `IVA ${line.taxRate}%`;
      if (line.taxRate === 0 && line.exemptionCode) {
        desc = `Isenção IVA (${line.exemptionCode})`;
      }
      taxSummaryMap[key] = {
        description: desc,
        rate: line.taxRate,
        taxableBase: 0,
        taxAmount: 0,
        exemptionCode: line.exemptionCode,
        exemptionReason: line.exemptionReason,
      };
    }
    taxSummaryMap[key].taxableBase += line.taxableBase;
    taxSummaryMap[key].taxAmount += line.taxAmount;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-4xl w-full overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Não impresso) */}
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-stone-100">
                  {document.documentNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-800 text-amber-400 border border-stone-700">
                  {docTypeInfo?.name || document.documentTypeCode}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                Documento fiscal assinado com sucesso. Pré-visualize antes de imprimir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor Oficial de Vias (Decreto Executivo AGT) */}
            <div className="bg-stone-800 p-1 rounded-lg border border-stone-700 flex items-center gap-1 text-xs">
              <span className="text-[10px] text-stone-400 font-semibold px-1 hidden md:inline">Via:</span>
              <button
                type="button"
                onClick={() => setDocumentCopy('ORIGINAL')}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  documentCopy === 'ORIGINAL'
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Via Original para o cliente"
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => setDocumentCopy('DUPLICADO')}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  documentCopy === 'DUPLICADO'
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Duplicado para arquivo"
              >
                Duplicado
              </button>
              <button
                type="button"
                onClick={() => setDocumentCopy('SEGUNDA_VIA')}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  documentCopy === 'SEGUNDA_VIA'
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="2ª Via em conformidade com original"
              >
                2ª Via
              </button>
            </div>

            {/* Alternador de Formato: Talão Térmico vs A4 */}
            <div className="bg-stone-800 p-1 rounded-lg border border-stone-700 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  printFormat === 'thermal'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Talão POS (80mm)</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  printFormat === 'a4'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Factura A4</span>
              </button>
            </div>

            {/* Botão Imprimir */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-stone-100 flex justify-center items-start grow">
          {/* ========================================================
              MODO 1: TALÃO TÉRMICO DE CAIXA (80mm)
              ======================================================== */}
          {printFormat === 'thermal' && (
            <div className="w-[320px] sm:w-[350px] bg-white p-5 rounded-xl shadow-md border border-stone-200 text-stone-900 font-mono text-xs space-y-3 print:shadow-none print:border-none print:w-full print:p-0">
              {/* Cabeçalho do Talão */}
              <div className="text-center space-y-1 border-b border-dashed border-stone-300 pb-3">
                <div className="flex justify-center mb-1">
                  <KitekeLogo variant="symbol" size="sm" />
                </div>
                <div className="font-extrabold text-sm tracking-tight text-stone-950 uppercase">
                  {company.tradeName || company.name}
                </div>
                {company.tradeName && (
                  <div className="text-[10px] text-stone-600 uppercase">
                    {company.name}
                  </div>
                )}
                <div className="text-[11px] text-stone-600">
                  NIF: <span className="font-bold text-stone-900">{company.taxId}</span>
                </div>
                <div className="text-[10px] text-stone-500 leading-tight">
                  {establishment?.address || company.address}
                </div>
                <div className="text-[10px] text-stone-500">
                  {company.city}, {company.province} • Angola
                </div>
                <div className="text-[9.5px] text-stone-600">
                  Reg. Com.: <span className="font-semibold text-stone-900">{company.conservatoryRegistration || '1432-19/Luanda'}</span>
                </div>
                <div className="text-[9.5px] text-stone-600">
                  Cap. Social: <span className="font-semibold text-stone-900">{company.capitalSocial || '5.000.000,00 Kz'}</span>
                </div>
                <div className="text-[9.5px] text-stone-600 font-semibold">
                  {company.taxRegime === 'SIMPLIFICADO' ? 'Regime Simplificado de IVA' : 'Regime Geral de IVA'}
                </div>
                {company.phone && (
                  <div className="text-[10px] text-stone-500">Tel: {company.phone}</div>
                )}
              </div>

              {/* Indicação Oficial de Via Obrigatória conforme Decreto Executivo */}
              <div className="text-center font-bold text-[10px] tracking-wider py-1 bg-stone-100 border-b border-dashed border-stone-300 uppercase text-stone-900">
                {documentCopy === 'ORIGINAL' && '*** ORIGINAL (CLIENTE) ***'}
                {documentCopy === 'DUPLICADO' && '*** DUPLICADO (ARQUIVO) ***'}
                {documentCopy === 'SEGUNDA_VIA' && '*** 2ª VIA EMITIDA EM CONFORMIDADE COM O ORIGINAL ***'}
              </div>

              {/* Informações do Documento */}
              <div className="text-[11px] space-y-0.5 border-b border-dashed border-stone-300 pb-2 text-stone-700">
                <div className="flex justify-between font-bold text-stone-900 text-xs">
                  <span>{docTypeInfo?.name || document.documentTypeCode}</span>
                  <span>{document.documentNumber}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Data: {document.documentDate}</span>
                  <span>Hora: {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span>Cliente:</span>
                  <span className="font-semibold text-stone-900 text-right truncate max-w-[180px]">
                    {document.customerName}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>NIF Cliente:</span>
                  <span className="font-semibold text-stone-900">{document.customerTaxId}</span>
                </div>
              </div>

              {/* Tabela de Artigos do Talão */}
              <div className="space-y-1.5 border-b border-dashed border-stone-300 pb-2">
                <div className="flex justify-between text-[10px] font-bold text-stone-500 border-b border-stone-200 pb-1">
                  <span>QTD x ARTIGO</span>
                  <span>TOTAL</span>
                </div>
                {document.lines.map((line) => (
                  <div key={line.id} className="text-[11px] space-y-0.5">
                    <div className="font-medium text-stone-900 leading-tight">
                      {line.description}
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-500">
                      <span>
                        {line.quantity} {line.unit} x {line.unitPrice.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                        {line.taxRate > 0 ? ` (IVA ${line.taxRate}%)` : ' (Isento)'}
                      </span>
                      <span className="font-bold text-stone-900">
                        {line.totalLineAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totais do Talão */}
              <div className="space-y-1 text-xs text-stone-700 border-b border-dashed border-stone-300 pb-2">
                <div className="flex justify-between text-[11px]">
                  <span>Total Ilíquido:</span>
                  <span>{document.grossAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                </div>
                {document.discountAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-700">
                    <span>Desconto:</span>
                    <span>-{document.discountAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px]">
                  <span>Total IVA:</span>
                  <span>{document.taxAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                </div>
                {document.withholdingAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-indigo-700">
                    <span>Retenção Fonte (6.5%):</span>
                    <span>-{document.withholdingAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-stone-950 pt-1 border-t border-stone-200">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-emerald-800">
                    {document.netTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                  </span>
                </div>

                {/* Pagamento e Troco no Talão POS */}
                <div className="pt-1 border-t border-dashed border-stone-300 space-y-0.5 text-[10.5px]">
                  <div className="flex justify-between text-stone-600">
                    <span>Modo de Pagamento:</span>
                    <span className="font-semibold text-stone-900">{document.paymentMethodName || 'Dinheiro (Kz)'}</span>
                  </div>
                  {document.amountReceived !== undefined && document.amountReceived > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Valor Entregue:</span>
                      <span className="font-mono font-medium">{document.amountReceived.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                    </div>
                  )}
                  {document.changeAmount !== undefined && document.changeAmount > 0 && (document.amountReceived || 0) >= document.netTotal ? (
                    <div className="flex justify-between font-extrabold text-emerald-800 text-xs pt-0.5 border-t border-dashed border-stone-300">
                      <span>TROCO:</span>
                      <span className="font-mono">{document.changeAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-stone-500 text-[10px]">
                      <span>Troco:</span>
                      <span className="font-mono">0,00 AOA (Exato)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumo de IVA (AGT Obrigatório) */}
              <div className="space-y-1 text-[9px] text-stone-600 border-b border-dashed border-stone-300 pb-2">
                <div className="font-bold text-[10px] text-stone-700">Resumo de Impostos:</div>
                {Object.values(taxSummaryMap).map((t, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{t.description}:</span>
                    <span>
                      Incid.: {t.taxableBase.toFixed(2)} | Imp.: {t.taxAmount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Código QR Fiscal AGT */}
              <div className="flex flex-col items-center justify-center pt-2 pb-1 border-b border-dashed border-stone-300">
                <FiscalQRCode document={document} company={company} size={96} />
                <span className="text-[8px] font-mono text-stone-500 mt-0.5">Leitura Rápida Fiscal AGT</span>
              </div>

              {/* Rodapé Legal & Assinatura AGT */}
              <div className="text-center space-y-1.5 pt-1">
                <div className="font-bold text-[10px] text-stone-900 bg-stone-100 py-1 px-2 rounded border border-stone-200">
                  {document.hashControl} - Processado por programa validado n.º {document.softwareCertificateNumber}
                </div>
                <div className="text-[9px] text-stone-500 leading-tight">
                  Os bens/serviços foram colocados à disposição na data e local indicados.
                </div>
                <div className="text-[8px] text-stone-400">
                  Obrigado pela preferência! • Loja Negrinho (Mini Mercado)
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              MODO 2: FACTURA FORMAL A4 (Padrão AGT)
              ======================================================== */}
          {printFormat === 'a4' && (
            <div className="w-full max-w-3xl bg-white p-8 sm:p-10 rounded-xl shadow-md border border-stone-200 text-stone-900 font-sans space-y-6 print:shadow-none print:border-none print:w-full print:p-0">
              {/* Header: Emissor e Documento */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-stone-200 pb-6">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2.5 mb-2">
                    <KitekeLogo variant="symbol" size="sm" />
                    <h1 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                      {company.name}
                    </h1>
                  </div>
                  <p className="text-xs text-stone-600 font-mono">
                    <strong>NIF:</strong> {company.taxId}
                  </p>
                  <p className="text-xs text-stone-600">{establishment?.address || company.address}</p>
                  <p className="text-xs text-stone-600">
                    {company.city}, {company.province} • Angola
                  </p>
                  <p className="text-xs text-stone-600 font-mono">
                    <strong>Registo Comercial:</strong> {company.conservatoryRegistration || '1432-19/Luanda'}
                  </p>
                  <p className="text-xs text-stone-600 font-mono">
                    <strong>Capital Social:</strong> {company.capitalSocial || '5.000.000,00 Kz'}
                  </p>
                  <p className="text-xs text-stone-600">
                    Regime Fiscal: <strong>{company.taxRegime === 'SIMPLIFICADO' ? 'Regime Simplificado de IVA' : 'Regime Geral de IVA'}</strong>
                  </p>
                  {company.phone && <p className="text-xs text-stone-500">Tel: {company.phone}</p>}
                </div>

                {/* Caixa de Identificação do Documento & Indicação Oficial da Via */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 min-w-[260px] text-xs">
                  {/* Indicação Oficial da Via Conforme Decreto Executivo */}
                  <div className="text-center py-1 px-2 rounded bg-amber-100/80 border border-amber-300 font-extrabold text-[11px] text-amber-950 uppercase tracking-wide">
                    {documentCopy === 'ORIGINAL' && 'ORIGINAL — DESTINADO AO CLIENTE'}
                    {documentCopy === 'DUPLICADO' && 'DUPLICADO — ARQUIVO CONTABILÍSTICO'}
                    {documentCopy === 'SEGUNDA_VIA' && '2ª VIA EMITIDA EM CONFORMIDADE COM O ORIGINAL'}
                  </div>

                  <div className="flex items-center justify-between font-bold text-stone-950 text-sm pt-0.5">
                    <span>{docTypeInfo?.name || document.documentTypeCode}</span>
                    <span className="font-mono text-blue-700">{document.documentNumber}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Data de Emissão:</span>
                    <span className="font-mono font-medium">{document.documentDate}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Hora Entrada:</span>
                    <span className="font-mono">{document.systemEntryDate.split('T')[1]?.slice(0, 8) || '12:00:00'}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Moeda:</span>
                    <span className="font-semibold text-stone-900">Kwanza (AOA)</span>
                  </div>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div className="bg-stone-50/60 p-4 rounded-xl border border-stone-200 space-y-1 text-xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                  Exmo.(s) Sr.(s) / Destinatário:
                </span>
                <div className="font-bold text-stone-900 text-sm">{document.customerName}</div>
                <div className="text-stone-700">
                  <strong>NIF:</strong> <span className="font-mono">{document.customerTaxId}</span>
                </div>
                {document.customerAddress && (
                  <div className="text-stone-600">{document.customerAddress}</div>
                )}
              </div>

              {/* Tabela de Linhas A4 */}
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                      <th className="py-2.5 px-3 w-10 text-center">Nº</th>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Descrição do Artigo / Serviço</th>
                      <th className="py-2.5 px-3 text-right">Qtd</th>
                      <th className="py-2.5 px-3 text-center">Un.</th>
                      <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                      <th className="py-2.5 px-3 text-right">Desc.</th>
                      <th className="py-2.5 px-3 text-right">Taxa IVA</th>
                      <th className="py-2.5 px-3 text-right">Total Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {document.lines.map((line) => (
                      <tr key={line.id} className="hover:bg-stone-50/50">
                        <td className="py-2 px-3 text-center text-stone-500 font-mono">{line.lineNumber}</td>
                        <td className="py-2 px-3 font-mono text-stone-700">{line.productCode}</td>
                        <td className="py-2 px-3">
                          <div className="font-medium text-stone-900">{line.description}</div>
                          {line.exemptionCode && (
                            <div className="text-[10px] text-stone-500 italic mt-0.5">
                              Isento de IVA ({line.exemptionCode}): {line.exemptionReason}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{line.quantity}</td>
                        <td className="py-2 px-3 text-center font-mono text-stone-500">{line.unit}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          {line.unitPrice.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-stone-500">
                          {line.discountRate > 0 ? `${line.discountRate}%` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {line.taxRate > 0 ? `${line.taxRate}%` : '0% (Isento)'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-stone-900">
                          {line.totalLineAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totais & Resumo AGT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Resumo de Impostos */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Quadro Resumo de Impostos (AGT):
                  </span>
                  <div className="border border-stone-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                          <th className="py-1.5 px-2.5">Taxa / Isenção</th>
                          <th className="py-1.5 px-2.5 text-right">Incidência</th>
                          <th className="py-1.5 px-2.5 text-right">Montante IVA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {Object.values(taxSummaryMap).map((t, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-2.5 font-medium text-stone-800">{t.description}</td>
                            <td className="py-1.5 px-2.5 text-right font-mono">
                              {t.taxableBase.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-medium">
                              {t.taxAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bloco de Totais */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Total Ilíquido / Bruto:</span>
                    <span className="font-mono">
                      {document.grossAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                    </span>
                  </div>
                  {document.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Descontos Comerciais:</span>
                      <span className="font-mono">
                        -{document.discountAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>Base Tributável (Incidência):</span>
                    <span className="font-mono">
                      {document.taxableBase.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Total de IVA:</span>
                    <span className="font-mono">
                      {document.taxAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                    </span>
                  </div>
                  {document.withholdingAmount > 0 && (
                    <div className="flex justify-between text-indigo-900 bg-indigo-50 px-2 py-1 rounded font-medium">
                      <span>Retenção na Fonte (6.5%):</span>
                      <span className="font-mono">
                        -{document.withholdingAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                      </span>
                    </div>
                  )}
                  <div className="border-t border-stone-300 pt-2 flex justify-between items-baseline text-sm sm:text-base font-bold text-stone-950">
                    <span>Total Líquido a Pagar:</span>
                    <span className="font-mono text-lg text-emerald-800">
                      {document.netTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                    </span>
                  </div>

                  {/* Informações de Pagamento e Troco na Factura A4 */}
                  <div className="pt-2 border-t border-stone-200 text-xs space-y-1">
                    <div className="flex justify-between text-stone-600">
                      <span>Modo de Pagamento:</span>
                      <span className="font-semibold text-stone-900">{document.paymentMethodName || 'Dinheiro (Kz)'}</span>
                    </div>
                    {document.amountReceived !== undefined && document.amountReceived > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>Valor Entregue pelo Cliente:</span>
                        <span className="font-mono">{document.amountReceived.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                      </div>
                    )}
                    {document.changeAmount !== undefined && document.changeAmount > 0 && (document.amountReceived || 0) >= document.netTotal && (
                      <div className="flex justify-between font-bold text-emerald-800 text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        <span>Troco Devolvido:</span>
                        <span className="font-mono">{document.changeAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dizeres Oficiais & Certificação Criptográfica AGT */}
              <div className="border-t border-stone-200 pt-4 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <FiscalQRCode document={document} company={company} size={90} className="shrink-0" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono font-bold text-stone-900 bg-stone-100 px-3 py-1 rounded border border-stone-200 w-fit">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>
                          {document.hashControl} - Processado por programa validado n.º{' '}
                          {document.softwareCertificateNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 italic">
                        Os bens/serviços foram colocados à disposição na data e local indicados.
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Código QR conforme especificações oficiais da AGT (Portaria n.º 292/18).
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 font-mono text-[10px] text-stone-500 space-y-0.5 break-all">
                  <div>
                    <strong className="text-stone-700">Hash SHA-256:</strong> {document.hash}
                  </div>
                  {document.signature && (
                    <div>
                      <strong className="text-stone-700">Assinatura Digital RSA-2048:</strong>{' '}
                      <span className="text-indigo-800">{document.signature.signatureBase64.slice(0, 50)}... ({document.signature.algorithm})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
