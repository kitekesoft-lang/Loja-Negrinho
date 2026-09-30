import React, { useState } from 'react';
import { SAFTService, SAFTExportOutput } from '../../core/fiscal/saft/SAFTService';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import {
  FileCode,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  Calendar,
  Layers,
  ShieldCheck,
  Building,
  Hash,
} from 'lucide-react';

export const SAFTExportView: React.FC = () => {
  const db = FiscalDatabase.getInstance();
  const company = Array.from(db.companies.values())[0];

  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [headerComment, setHeaderComment] = useState<string>('Extracção oficial SAF-T (AO) Facturação - Portaria n.º 292/18 AGT');
  const [exportOutput, setExportOutput] = useState<SAFTExportOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [xmlPreviewTab, setXmlPreviewTab] = useState<'RAW' | 'SUMMARY'>('SUMMARY');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const months = [
    { value: 'ALL', label: 'Ano Completo (1 Jan - 31 Dez)' },
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const handleGenerateSAFT = () => {
    if (!company) return;
    setIsGenerating(true);
    setStatusMessage(null);

    try {
      let startDate = `${fiscalYear}-01-01`;
      let endDate = `${fiscalYear}-12-31`;

      if (selectedMonth !== 'ALL') {
        const lastDay = new Date(fiscalYear, parseInt(selectedMonth, 10), 0).getDate();
        startDate = `${fiscalYear}-${selectedMonth}-01`;
        endDate = `${fiscalYear}-${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;
      }

      const output = SAFTService.generateSAFTOffice({
        companyId: company.id,
        fiscalYear,
        startDate,
        endDate,
        headerComment,
      });

      setExportOutput(output);
      setStatusMessage(`SAF-T(AO) gerado com sucesso: ${output.fileName}`);
    } catch (err: any) {
      console.error('Erro ao gerar SAF-T:', err);
      setStatusMessage(`Falha na extracção: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadXML = () => {
    if (!exportOutput) return;
    const blob = new Blob([exportOutput.xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportOutput.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30">
              <FileCode className="w-3.5 h-3.5 mr-1 text-amber-700" /> FASE 3 — MOTOR SAF-T (AO)
            </span>
            <span className="text-stone-400 text-xs">|</span>
            <span className="text-stone-500 text-xs font-mono">Portaria n.º 292/18 AGT</span>
          </div>
          <h2 className="text-lg font-bold text-stone-900">
            Extracção, Validação e Emissão do SAF-T(AO) de Facturação
          </h2>
          <p className="text-xs text-stone-500 max-w-3xl leading-relaxed">
            Geração do ficheiro oficial de auditoria tributária com validação prévia de integridade semântica, integridade referencial de clientes/produtos e totalizadores auditáveis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSAFT}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'A Processar...' : 'Extrair & Validar SAF-T'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl text-xs bg-stone-900 text-white flex items-center justify-between">
          <span className="font-mono">{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-stone-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Parâmetros de Extracção */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center gap-2 text-stone-800 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-stone-600" />
            <span>Período Fiscal</span>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-semibold text-stone-600 block mb-1">Ano Fiscal:</label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg font-mono"
              >
                <option value={2026}>2026 (Exercício Corrente)</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 block mb-1">Mês de Competência:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center gap-2 text-stone-800 text-xs font-bold uppercase tracking-wider">
            <Building className="w-4 h-4 text-stone-600" />
            <span>Empresa Sujeito Passivo</span>
          </div>
          <div className="space-y-1.5 text-xs text-stone-600">
            <div>
              <strong className="text-stone-900 block">{company?.tradeName || company?.name}</strong>
              <span className="font-mono text-stone-500">NIF: {company?.taxId}</span>
            </div>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
              <span className="text-stone-500">Regime Tributário:</span>
              <span className="font-semibold text-stone-800">{company?.taxRegime}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-500">Certificado AGT:</span>
              <span className="font-mono font-semibold text-emerald-700">999/AGT/2026</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center gap-2 text-stone-800 text-xs font-bold uppercase tracking-wider">
            <Hash className="w-4 h-4 text-stone-600" />
            <span>Comentário / Metadados</span>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">Nota de Cabeçalho (HeaderComment):</label>
            <input
              type="text"
              value={headerComment}
              onChange={(e) => setHeaderComment(e.target.value)}
              className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-700"
            />
          </div>
          <p className="text-[11px] text-stone-400">
            AuditFileVersion: <span className="font-mono font-bold text-stone-600">0.1.01</span> (Portaria n.º 292/18).
          </p>
        </div>
      </div>

      {/* Resultados da Extracção */}
      {exportOutput ? (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/60">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  exportOutput.validation.isValid
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-rose-100 text-rose-700 border border-rose-300'
                }`}
              >
                {exportOutput.validation.isValid ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-stone-900 text-sm font-mono">{exportOutput.fileName}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      exportOutput.validation.isValid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {exportOutput.validation.isValid ? 'VALIDADO COM SUCESSO' : 'ERROS DETECTADOS'}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Tamanho: {(exportOutput.fileSizeBytes / 1024).toFixed(1)} KB | Gerado em:{' '}
                  {new Date(exportOutput.generatedAt).toLocaleString('pt-AO')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowXmlModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visualizar XML</span>
              </button>
              <button
                onClick={handleDownloadXML}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download SAF-T (.xml)</span>
              </button>
            </div>
          </div>

          {/* Métricas do Ficheiro */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Facturas / Doc. Comerciais</span>
              <span className="text-lg font-bold text-stone-900 font-mono">
                {exportOutput.validation.metrics.invoiceCount}
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Recibos Emitidos</span>
              <span className="text-lg font-bold text-stone-900 font-mono">
                {exportOutput.validation.metrics.paymentCount}
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Volume Total Faturado</span>
              <span className="text-lg font-bold text-stone-900 font-mono">
                {exportOutput.validation.metrics.totalGrossSales.toLocaleString('pt-AO', {
                  minimumFractionDigits: 2,
                })}{' '}
                <span className="text-xs font-normal text-stone-500">AOA</span>
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Total IVA Liquidado</span>
              <span className="text-lg font-bold text-emerald-700 font-mono">
                {exportOutput.validation.metrics.totalTaxPayable.toLocaleString('pt-AO', {
                  minimumFractionDigits: 2,
                })}{' '}
                <span className="text-xs font-normal text-stone-500">AOA</span>
              </span>
            </div>
          </div>

          {/* Relatório de Validação e Diagnóstico Semântico */}
          <div className="p-5 border-t border-stone-100">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Diagnóstico de Conformidade Semântica &amp; XSD da AGT</span>
            </h4>

            {exportOutput.validation.issues.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  O ficheiro SAF-T cumpre integralmente as regras semânticas, namespaces oficiais, correspondência de clientes/artigos e totalizadores de crédito e débito.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {exportOutput.validation.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      issue.severity === 'ERROR'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    {issue.severity === 'ERROR' ? (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px]">{issue.code}</span>
                        <span className="text-[10px] uppercase font-bold opacity-75">
                          [{issue.section}] {issue.field ? `• ${issue.field}` : ''}
                        </span>
                        {issue.documentReference && (
                          <span className="font-mono text-[10px] bg-white/70 px-1 rounded">
                            {issue.documentReference}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5">{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
          <FileCode className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-700">Nenhum ficheiro SAF-T extraído ainda</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
            Clique no botão <strong>"Extrair &amp; Validar SAF-T"</strong> acima para processar os documentos fiscais emitidos e gerar o ficheiro XML auditável.
          </p>
        </div>
      )}

      {/* Modal de Pré-visualização XML */}
      {showXmlModal && exportOutput && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-300 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-stone-700" />
                <span className="font-mono font-bold text-xs text-stone-900">{exportOutput.fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadXML}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Download
                </button>
                <button
                  onClick={() => setShowXmlModal(false)}
                  className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-stone-950 text-stone-200 font-mono text-xs leading-relaxed select-text">
              <pre className="whitespace-pre-wrap">{exportOutput.xml}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
