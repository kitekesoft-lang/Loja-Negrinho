import React, { useState, useEffect } from 'react';
import { FiscalQRCodeService } from '../../core/fiscal/security/FiscalQRCodeService';
import { FiscalDocument } from '../../core/fiscal/types/document';
import { Company } from '../../core/fiscal/types/company';
import {
  QrCode,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  X,
  Info,
  Smartphone,
  Globe,
  FileCode,
  Download,
  Award,
} from 'lucide-react';

interface FiscalQRCodeProps {
  document: FiscalDocument;
  company: Company;
  size?: number; // Largura em px (padrão 120)
  className?: string;
  showInspectorButton?: boolean;
  defaultMode?: 'official-agt' | 'url' | 'canonical';
  onOpenPublicVerification?: (docNumber: string) => void;
}

export const FiscalQRCode: React.FC<FiscalQRCodeProps> = ({
  document,
  company,
  size = 120,
  className = '',
  showInspectorButton = true,
  defaultMode = 'official-agt',
  onOpenPublicVerification,
}) => {
  const [mode, setMode] = useState<'official-agt' | 'url' | 'canonical'>(defaultMode);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [canonicalString, setCanonicalString] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>('');
  const [officialAgtUrl, setOfficialAgtUrl] = useState<string>('');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedOfficialUrl, setCopiedOfficialUrl] = useState(false);

  useEffect(() => {
    try {
      const raw = FiscalQRCodeService.buildQRCodeString(document, company);
      setCanonicalString(raw);

      const url = FiscalQRCodeService.buildVerificationURL(document, company);
      setVerificationUrl(url);

      const agtUrl = FiscalQRCodeService.buildOfficialAGTDocumentURL(document.documentNumber);
      setOfficialAgtUrl(agtUrl);

      if (mode === 'official-agt') {
        // Gera o Código QR Oficial da AGT com o logótipo central e nível de erro M (15%)
        FiscalQRCodeService.generateOfficialAGTQRCodeDataURL(document.documentNumber, 350).then((imgUrl) => {
          setDataUrl(imgUrl);
        });
      } else if (mode === 'url') {
        FiscalQRCodeService.generateDataURL(url, {
          width: size * 2,
          margin: 1,
        }).then((imgUrl) => {
          setDataUrl(imgUrl);
        });
      } else {
        FiscalQRCodeService.generateDataURL(raw, {
          width: size * 2,
          margin: 1,
        }).then((imgUrl) => {
          setDataUrl(imgUrl);
        });
      }
    } catch (err) {
      console.error('Erro ao gerar Código QR fiscal:', err);
    }
  }, [document, company, size, mode]);

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(canonicalString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyOfficialUrl = () => {
    navigator.clipboard.writeText(officialAgtUrl);
    setCopiedOfficialUrl(true);
    setTimeout(() => setCopiedOfficialUrl(false), 2000);
  };

  const handleDownloadPNG350 = async () => {
    try {
      const pngUrl = await FiscalQRCodeService.generateOfficialAGTQRCodeDataURL(document.documentNumber, 350);
      const link = window.document.createElement('a');
      link.download = `QRCode_AGT_${document.documentNumber.replace(/[\/\\ ]/g, '_')}_350x350.png`;
      link.href = pngUrl;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao descarregar PNG:', err);
    }
  };

  const handleOpenPortal = () => {
    if (mode === 'official-agt') {
      window.open(officialAgtUrl, '_blank');
    } else if (onOpenPublicVerification) {
      onOpenPublicVerification(document.documentNumber);
      setIsInspectorOpen(false);
    } else {
      window.open(verificationUrl, '_blank');
    }
  };

  const parsed = FiscalQRCodeService.parseQRCodeString(canonicalString);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {dataUrl ? (
        <div
          className="relative group cursor-pointer"
          onClick={() => showInspectorButton && setIsInspectorOpen(true)}
          title="Clique para inspecionar, descarregar PNG oficial 350x350 px ou abrir na AGT"
        >
          <img
            src={dataUrl}
            alt="Código QR Fiscal AGT"
            style={{ width: `${size}px`, height: `${size}px` }}
            className="rounded border border-stone-200 bg-white p-1 shadow-xs transition-transform group-hover:scale-105"
          />
          {showInspectorButton && (
            <div className="absolute inset-0 bg-stone-950/75 opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center text-white text-[10px] font-bold p-1 text-center backdrop-blur-xs">
              <Award className="w-4 h-4 text-amber-400 mb-0.5" />
              <span>QR Oficial AGT</span>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{ width: `${size}px`, height: `${size}px` }}
          className="rounded border border-stone-200 bg-stone-50 flex items-center justify-center animate-pulse"
        >
          <QrCode className="w-6 h-6 text-stone-300" />
        </div>
      )}

      {/* Modal de Auditoria e Inspecção dos Campos do QR Code */}
      {isInspectorOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 print:hidden"
          onClick={() => setIsInspectorOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    Código QR Oficial da AGT (Angola)
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-emerald-500 text-slate-950">
                      100% Homologado
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {document.documentNumber} • Especificação Oficial para Documentos Impressos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alternador de Modo de Codificação */}
            <div className="bg-stone-100 px-4 py-2.5 border-b border-stone-200 flex items-center justify-between text-xs">
              <span className="font-bold text-stone-700 text-[11px]">Formato do Código:</span>
              <div className="flex items-center gap-1 bg-stone-200 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setMode('official-agt')}
                  className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    mode === 'official-agt'
                      ? 'bg-blue-700 text-white shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Award className="w-3 h-3 text-amber-300" />
                  <span>Oficial AGT (Portal FE)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('url')}
                  className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    mode === 'url'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Portal Autónomo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('canonical')}
                  className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    mode === 'canonical'
                      ? 'bg-stone-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <FileCode className="w-3 h-3" />
                  <span>Texto Bruto</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Pré-visualização do Código com o Logótipo Oficial AGT */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                {dataUrl && (
                  <img
                    src={dataUrl}
                    alt="Código QR Oficial AGT"
                    className="w-32 h-32 rounded border border-stone-300 bg-white p-1 shrink-0 shadow-xs"
                  />
                )}
                <div className="space-y-2 flex-1 min-w-0 text-center sm:text-left">
                  <div className="font-black text-stone-900 text-base truncate">
                    {document.documentNumber}
                  </div>
                  <div className="text-stone-500 text-[11px]">
                    Data de Emissão: <strong className="text-stone-800">{document.documentDate}</strong>
                  </div>
                  <div className="text-stone-500 text-[11px]">
                    Total com IVA:{' '}
                    <strong className="text-emerald-700 font-mono text-sm">
                      {(document.taxableBase + document.taxAmount).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                    </strong>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={handleDownloadPNG350}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-300" />
                      <span>Descarregar PNG Oficial (350×350 px)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela de Especificações Oficiais da AGT (Fidelidade 100%) */}
              <div>
                <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-1.5 text-xs">
                  <Info className="w-3.5 h-3.5 text-blue-700" />
                  Especificações do QR Code a utilizar nos documentos impressos (AGT):
                </h4>
                <div className="border border-stone-300 rounded-xl overflow-hidden text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-stone-200">
                      <tr className="bg-stone-50">
                        <td className="py-2 px-3 font-bold text-stone-700 w-1/3">Padrão</td>
                        <td className="py-2 px-3 font-semibold text-stone-900">QR Code Model 2</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-stone-700">Versão</td>
                        <td className="py-2 px-3 text-stone-900">4 (33 × 33 módulos) / Auto Byte</td>
                      </tr>
                      <tr className="bg-stone-50">
                        <td className="py-2 px-3 font-bold text-stone-700">Nível de correcção de erros</td>
                        <td className="py-2 px-3 font-semibold text-emerald-800">M (15%)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-stone-700">Modo de dados</td>
                        <td className="py-2 px-3 text-stone-900">Byte</td>
                      </tr>
                      <tr className="bg-stone-50">
                        <td className="py-2 px-3 font-bold text-stone-700">Codificação de caracteres</td>
                        <td className="py-2 px-3 text-stone-900">UTF-8</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-stone-700">URL codificada</td>
                        <td className="py-2 px-3 font-mono text-blue-800 text-[10.5px] break-all">
                          {officialAgtUrl}
                        </td>
                      </tr>
                      <tr className="bg-stone-50">
                        <td className="py-2 px-3 font-bold text-stone-700">Formato do arquivo</td>
                        <td className="py-2 px-3 font-bold text-stone-900">PNG, 350×350 px</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-stone-700 leading-tight">
                          Método de substituição de espaços no documentNo a incluir na url
                        </td>
                        <td className="py-2 px-3 text-stone-800">
                          Cada espaço deve ser substituído pela sequência <strong className="font-mono text-blue-700">%20</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* URL Codificada Oficial com Ação de Copiar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3 text-stone-400" />
                    URL Completa no Portal da AGT:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyOfficialUrl}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    {copiedOfficialUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOfficialUrl ? 'Copiado!' : 'Copiar URL'}</span>
                  </button>
                </div>
                <div className="p-2 bg-stone-100 text-stone-800 rounded-lg font-mono text-[10.5px] break-all border border-stone-200 select-all">
                  {officialAgtUrl}
                </div>
              </div>

              {/* Botão de Redirecionamento Direto para o Portal do Contribuinte */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="font-bold text-blue-900 text-xs flex items-center justify-center sm:justify-start gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                    <span>Consulta Fiscal no Portal do Contribuinte da AGT</span>
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Abre diretamente a página de conferência da factura no Ministério das Finanças (MINFIN).
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPortal}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs shadow-xs cursor-pointer shrink-0 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Consultar no Portal AGT</span>
                </button>
              </div>

              {/* String canónica raw para cópia e conferência */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    Estrutura de Auditoria (Portaria n.º 292/18):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRaw}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-stone-900 text-stone-200 rounded-lg font-mono text-[10px] break-all leading-relaxed select-all">
                  {canonicalString}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-stone-50 px-5 py-3 border-t border-stone-200 flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-medium">
                Conforme Decreto Presidencial n.º 292/18 e Portaria n.º 292/18 da AGT.
              </span>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs cursor-pointer shadow-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

