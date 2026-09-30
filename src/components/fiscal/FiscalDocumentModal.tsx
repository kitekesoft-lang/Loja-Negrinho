import React from 'react';
import { FiscalDocument } from '../../core/fiscal/types/document';
import { Company, Establishment } from '../../core/fiscal/types/company';
import { FISCAL_DOCUMENT_TYPES } from '../../core/fiscal/types/series';
import { FiscalQRCode } from '../common/FiscalQRCode';
import { X, Printer, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface FiscalDocumentModalProps {
  document: FiscalDocument;
  company: Company;
  establishment?: Establishment;
  onClose: () => void;
}

export const FiscalDocumentModal: React.FC<FiscalDocumentModalProps> = ({
  document,
  company,
  establishment,
  onClose,
}) => {
  const docTypeInfo = FISCAL_DOCUMENT_TYPES[document.documentTypeCode];

  const handlePrint = () => {
    window.print();
  };

  // Agrupar impostos para o quadro resumo legal
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-4xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Action Bar */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">
              Visualização de Documento Fiscal Oficial (AGT Decreto Presidencial 292/18)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-100 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Documento</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (Printable Paper Layout) */}
        <div className="p-8 sm:p-12 text-stone-900 bg-white font-sans space-y-6 print:p-0">
          {/* Header: Emissor e Documento */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-stone-200 pb-6">
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded bg-stone-900 text-amber-400 font-bold flex items-center justify-center text-sm">
                  AO
                </span>
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
              <p className="text-xs text-stone-600">
                Regime Fiscal: <strong>Regime Geral de IVA</strong>
              </p>
              {company.phone && <p className="text-xs text-stone-500">Tel: {company.phone}</p>}
            </div>

            {/* Document details box */}
            <div className="sm:text-right space-y-1.5 bg-stone-50 p-4 rounded-xl border border-stone-200 min-w-[240px]">
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-stone-900 text-white">
                {docTypeInfo.name} • ORIGINAL
              </div>
              <h2 className="text-lg font-extrabold text-stone-900 font-mono tracking-tight">
                {document.documentNumber}
              </h2>
              <div className="text-xs text-stone-600 space-y-0.5">
                <div>
                  <span className="text-stone-500">Data de Emissão:</span>{' '}
                  <strong className="font-mono">{document.documentDate}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Hora do Sistema:</span>{' '}
                  <span className="font-mono text-[11px]">
                    {document.systemEntryDate.replace('T', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500">Estabelecimento:</span>{' '}
                  <span>{establishment?.code || 'SEDE'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Adquirente / Cliente */}
          <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Exmo.(s) Sr.(s) / Adquirente:
              </span>
              <h3 className="text-sm font-bold text-stone-900">{document.customerName}</h3>
              <p className="text-xs text-stone-600 font-mono">
                <strong>NIF:</strong> {document.customerTaxId}
              </p>
              <p className="text-xs text-stone-600">{document.customerAddress}</p>
            </div>
            <div className="text-xs text-stone-500 sm:text-right flex flex-col justify-end">
              <span>País de Destino: {document.customerCountry || 'Angola (AO)'}</span>
              <span>Moeda de Liquidação: <strong>{company.currency}</strong></span>
            </div>
          </div>

          {/* Document References (if NC, ND, RC) */}
          {document.references && document.references.length > 0 && (
            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Documentos Fiscais de Referência Obrigatória:</span>
              </div>
              {document.references.map((ref, idx) => (
                <div key={idx} className="pl-5 space-y-0.5">
                  <div>
                    Documento Original: <strong>{ref.referencedDocumentNumber}</strong> ({ref.referenceType})
                  </div>
                  <div>
                    Motivo Legal de Rectificação: <em>"{ref.reason}"</em>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lines Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                  <th className="py-2.5 px-3 w-12 text-center">Nº</th>
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
                      {line.withholdingAmount && line.withholdingAmount > 0 ? (
                        <div className="text-[10px] text-indigo-700 mt-0.5 font-medium">
                          Sujeito a Retenção na Fonte ({line.withholdingRate}%): -{line.withholdingAmount.toLocaleString('pt-AO')} AOA
                        </div>
                      ) : null}
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

          {/* Bottom Grid: Resumo de Impostos & Totais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Quadro Resumo de Impostos (Obrigatório AGT) */}
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
                        <td className="py-1.5 px-2.5">
                          <span className="font-medium text-stone-800">{t.description}</span>
                          {t.exemptionReason && (
                            <div className="text-[10px] text-stone-500">{t.exemptionReason}</div>
                          )}
                        </td>
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

            {/* Totais Gerais */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Total Ilíquido / Bruto:</span>
                <span className="font-mono">
                  {document.grossAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                </span>
              </div>
              {document.discountAmount > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Descontos Comerciais:</span>
                  <span className="font-mono text-emerald-700">
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
                  <span>Retenção na Fonte (6.5% - CIRT):</span>
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
            </div>
          </div>

          {/* Dizeres Oficiais & Certificação Criptográfica AGT */}
          <div className="border-t border-stone-200 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
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
                    Clique no QR Code para inspecionar os campos estruturados da AGT.
                  </div>
                </div>
              </div>
            </div>

            {/* Hashes SHA-256 e Assinatura Digital RSA-2048 da cadeia */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 font-mono text-[10px] text-stone-500 space-y-1 break-all">
              <div>
                <strong className="text-stone-700">Hash SHA-256 (Documento Actual):</strong> {document.hash}
              </div>
              {document.signature && (
                <div>
                  <strong className="text-stone-700">Assinatura Digital RSA-2048:</strong>{' '}
                  <span className="text-indigo-800">{document.signature.signatureBase64.slice(0, 60)}... ({document.signature.algorithm})</span>
                </div>
              )}
              <div>
                <strong className="text-stone-700">Hash Anterior (Encadeamento):</strong>{' '}
                {document.previousHash ? document.previousHash : '0 (Primeiro Documento da Série)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
