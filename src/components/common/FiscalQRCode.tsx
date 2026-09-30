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
} from 'lucide-react';

interface FiscalQRCodeProps {
  document: FiscalDocument;
  company: Company;
  size?: number; // Largura em px (padrão 120)
  className?: string;
  showInspectorButton?: boolean;
  defaultMode?: 'url' | 'canonical';
  onOpenPublicVerification?: (docNumber: string) => void;
}

export const FiscalQRCode: React.FC<FiscalQRCodeProps> = ({
  document,
  company,
  size = 120,
  className = '',
  showInspectorButton = true,
  defaultMode = 'url',
  onOpenPublicVerification,
}) => {
  const [mode, setMode] = useState<'url' | 'canonical'>(defaultMode);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [canonicalString, setCanonicalString] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>('');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    try {
      const raw = FiscalQRCodeService.buildQRCodeString(document, company);
      setCanonicalString(raw);

      const url = FiscalQRCodeService.buildVerificationURL(document, company);
      setVerificationUrl(url);

      const contentToEncode = mode === 'url' ? url : raw;
      FiscalQRCodeService.generateDataURL(contentToEncode, {
        width: size * 2,
        margin: 1,
      }).then((imgUrl) => {
        setDataUrl(imgUrl);
      });
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

  const handleOpenPortal = () => {
    if (onOpenPublicVerification) {
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
          title="Clique para auditar ou abrir Portal de Validação no Telemóvel"
        >
          <img
            src={dataUrl}
            alt="Código QR Fiscal AGT"
            style={{ width: `${size}px`, height: `${size}px` }}
            className="rounded border border-stone-200 bg-white p-1 shadow-xs transition-transform group-hover:scale-105"
          />
          {showInspectorButton && (
            <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center text-white text-[10px] font-bold p-1 text-center backdrop-blur-xs">
              <Smartphone className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
              <span>Ver Validação</span>
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
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Código QR &amp; Portal de Validação AGT</h3>
                  <p className="text-[11px] text-stone-400">
                    {document.documentNumber} • Portaria n.º 292/18
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
              <span className="font-bold text-stone-700 text-[11px]">Destino da Leitura:</span>
              <div className="flex items-center gap-1 bg-stone-200 p-0.5 rounded-lg text-[11px]">
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
                  <span>Portal Web Móvel</span>
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
                  <span>Texto Bruto AGT</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-4 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                {dataUrl && (
                  <img
                    src={dataUrl}
                    alt="QR Code"
                    className="w-24 h-24 rounded border border-stone-300 bg-white p-1 shrink-0 shadow-xs"
                  />
                )}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="font-bold text-stone-900 text-sm truncate">
                    {document.documentNumber}
                  </div>
                  <div className="text-stone-500 text-[11px]">
                    Emitido em: <strong className="text-stone-700">{document.documentDate}</strong>
                  </div>
                  <div className="text-stone-500 text-[11px]">
                    Total Líquido:{' '}
                    <strong className="text-emerald-700 font-mono">
                      {document.netTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                    </strong>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    HashControl (Q): <span className="font-mono">{document.hashControl}</span>
                  </div>
                </div>
              </div>

              {/* Botão de Destaque: Abrir Portal de Validação */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="font-bold text-emerald-900 text-xs flex items-center justify-center sm:justify-start gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Ao ler com a câmara do telemóvel:</span>
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    O utilizador é direcionado para a página pública oficial de consulta fiscal.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPortal}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs cursor-pointer shrink-0 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Portal</span>
                </button>
              </div>

              {/* URL do Portal para Cópia */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3 text-stone-400" />
                    Link Direto do Portal de Validação:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
                <div className="p-2 bg-stone-50 text-stone-700 rounded-lg font-mono text-[10px] break-all border border-stone-200 select-all">
                  {verificationUrl}
                </div>
              </div>

              {/* Tabela de Campos Padronizados da AGT */}
              <div>
                <h4 className="font-bold text-stone-800 mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-stone-500" />
                  Estrutura Canónica Oficial da AGT (Portaria n.º 292/18):
                </h4>
                <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-[11px]">
                  <div className="grid grid-cols-12 p-2 bg-stone-50 font-bold text-stone-600 text-[10px]">
                    <div className="col-span-2">TAG</div>
                    <div className="col-span-5">CAMPO LEGAL</div>
                    <div className="col-span-5">VALOR CODIFICADO</div>
                  </div>
                  <div className="grid grid-cols-12 p-2">
                    <div className="col-span-2 font-mono font-bold text-blue-700">A</div>
                    <div className="col-span-5 text-stone-600">NIF do Emitente</div>
                    <div className="col-span-5 font-mono font-medium">{parsed?.emitterTaxId}</div>
                  </div>
                  <div className="grid grid-cols-12 p-2">
                    <div className="col-span-2 font-mono font-bold text-blue-700">B</div>
                    <div className="col-span-5 text-stone-600">NIF do Adquirente</div>
                    <div className="col-span-5 font-mono font-medium">{parsed?.customerTaxId}</div>
                  </div>
                  <div className="grid grid-cols-12 p-2">
                    <div className="col-span-2 font-mono font-bold text-blue-700">D / E</div>
                    <div className="col-span-5 text-stone-600">Tipo / Estado</div>
                    <div className="col-span-5 font-mono">
                      {parsed?.documentType} / {parsed?.documentStatus}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 p-2">
                    <div className="col-span-2 font-mono font-bold text-blue-700">F / G</div>
                    <div className="col-span-5 text-stone-600">Data / Num. Documento</div>
                    <div className="col-span-5 font-mono font-medium">{parsed?.documentNumber}</div>
                  </div>
                  <div className="grid grid-cols-12 p-2">
                    <div className="col-span-2 font-mono font-bold text-blue-700">I7 / I8</div>
                    <div className="col-span-5 text-stone-600">Base / Montante IVA</div>
                    <div className="col-span-5 font-mono">
                      {parsed?.taxableBase?.toFixed(2)} / {parsed?.taxAmount?.toFixed(2)} AOA
                    </div>
                  </div>
                  <div className="grid grid-cols-12 p-2">
                    <div className="col-span-2 font-mono font-bold text-blue-700">N</div>
                    <div className="col-span-5 text-stone-600">Total com Impostos</div>
                    <div className="col-span-5 font-mono font-bold text-emerald-800">
                      {parsed?.grossTotal?.toFixed(2)} AOA
                    </div>
                  </div>
                  <div className="grid grid-cols-12 p-2 bg-amber-50/50">
                    <div className="col-span-2 font-mono font-bold text-amber-700">Q</div>
                    <div className="col-span-5 font-bold text-stone-800">HashControl (RSA-2048)</div>
                    <div className="col-span-5 font-mono font-bold text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded w-fit">
                      {parsed?.hashControl}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 p-2">
                    <div className="col-span-2 font-mono font-bold text-blue-700">R</div>
                    <div className="col-span-5 text-stone-600">Certificado Software AGT</div>
                    <div className="col-span-5 font-mono">{parsed?.softwareCertificateNumber}</div>
                  </div>
                </div>
              </div>

              {/* String canónica raw para cópia */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    String Canónica Bruta do QR Code:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRaw}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar String'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-stone-900 text-stone-200 rounded-lg font-mono text-[10px] break-all leading-relaxed select-all">
                  {canonicalString}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-stone-50 px-5 py-3 border-t border-stone-200 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                Padrão compatível com smartphones iOS e Android.
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
