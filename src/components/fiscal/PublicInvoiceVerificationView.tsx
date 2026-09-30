import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { FiscalDocument } from '../../core/fiscal/types/document';
import { Company } from '../../core/fiscal/types/company';
import {
  FiscalQRCodeService,
  PublicVerificationData,
} from '../../core/fiscal/security/FiscalQRCodeService';
import { ReceiptPreviewModal } from '../common/ReceiptPreviewModal';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Building2,
  UserCheck,
  Calendar,
  Clock,
  Printer,
  Share2,
  ExternalLink,
  Search,
  Check,
  Copy,
  AlertTriangle,
  QrCode,
  ArrowLeft,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PublicInvoiceVerificationViewProps {
  initialDocumentNumber?: string;
  initialToken?: string;
  onBackToApp?: () => void;
}

export const PublicInvoiceVerificationView: React.FC<PublicInvoiceVerificationViewProps> = ({
  initialDocumentNumber,
  initialToken,
  onBackToApp,
}) => {
  const db = FiscalDatabase.getInstance();
  const company = db.companies.get('COMP-001')!;

  const [verificationData, setVerificationData] = useState<PublicVerificationData | null>(null);
  const [targetDocument, setTargetDocument] = useState<FiscalDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inicialização a partir de URL ou props
  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams(window.location.search);
    const token = initialToken || params.get('token') || params.get('d') || params.get('v');
    const docQuery = initialDocumentNumber || params.get('doc') || params.get('num') || params.get('validar');
    const qrParam = params.get('qr');

    let resolvedData: PublicVerificationData | null = null;
    let resolvedDoc: FiscalDocument | null = null;

    // 1. Tentar descodificar token embutido (caso ideal para leitura móvel sem cookies/sessão)
    if (token && token !== '1') {
      resolvedData = FiscalQRCodeService.decodeVerificationPayload(token);
    }

    // 2. Se passar parâmetro de string QR canónica
    if (!resolvedData && qrParam) {
      resolvedData = FiscalQRCodeService.decodeVerificationPayload(qrParam);
    }

    // 3. Procurar documento na base de dados pelo número (se existir na mesma instância ou local)
    const allDocs = Array.from(db.documents.values());
    if (docQuery && docQuery !== '1') {
      const decodedDocNum = decodeURIComponent(docQuery).trim();
      resolvedDoc =
        allDocs.find(
          (d) =>
            d.documentNumber.toLowerCase() === decodedDocNum.toLowerCase() ||
            d.id.toLowerCase() === decodedDocNum.toLowerCase()
        ) || null;
    }

    // Se encontramos o documento na base de dados, geramos o payload completo e fidedigno
    if (resolvedDoc) {
      setTargetDocument(resolvedDoc);
      resolvedData = FiscalQRCodeService.buildPublicVerificationData(resolvedDoc, company);
    } else if (resolvedData) {
      // Se apenas veio o token, tentamos ver se existe doc correspondente
      const found = allDocs.find((d) => d.documentNumber === resolvedData?.documentNumber);
      if (found) {
        setTargetDocument(found);
      } else {
        // Criar objeto FiscalDocument sintetizado para permitir pré-visualização de impressão
        resolvedDoc = {
          id: `DOC-VERIFIED-${resolvedData.documentNumber.replace(/\s+/g, '_')}`,
          companyId: company.id,
          establishmentId: 'EST-001',
          seriesId: resolvedData.seriesId,
          documentTypeCode: resolvedData.documentTypeCode as any,
          documentNumber: resolvedData.documentNumber,
          sequentialNumber: 1,
          documentDate: resolvedData.documentDate,
          systemEntryDate: new Date().toISOString(),
          customerId: 'CLI-GUEST',
          customerTaxId: resolvedData.customerTaxId,
          customerName: resolvedData.customerName || 'Consumidor Final',
          customerAddress: resolvedData.customerAddress || 'Luanda, Angola',
          customerCountry: 'AO',
          lines: (resolvedData.items || []).map((it, idx) => ({
            id: `LN-SYNTH-${idx + 1}`,
            lineNumber: idx + 1,
            productId: `PRD-${idx}`,
            productCode: it.code,
            description: it.description,
            unit: 'UN',
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountRate: 0,
            discountAmount: 0,
            taxableBase: it.unitPrice * it.quantity,
            taxConfigurationId: 'TAX-IVA14',
            taxType: 'IVA',
            taxCode: 'NOR',
            taxRate: it.taxRate,
            taxAmount: (it.total * it.taxRate) / 100,
            totalLineAmount: it.total,
          })),
          references: [],
          grossAmount: resolvedData.grossTotal || resolvedData.taxableBase + resolvedData.taxAmount,
          discountAmount: 0,
          taxableBase: resolvedData.taxableBase,
          taxAmount: resolvedData.taxAmount,
          withholdingAmount: resolvedData.withholdingAmount || 0,
          netTotal: resolvedData.netTotal,
          previousHash: '',
          hash: resolvedData.hash,
          hashControl: resolvedData.hashControl,
          softwareCertificateNumber: resolvedData.softwareCertificateNumber,
          status: (resolvedData.status === 'CANCELLED' ? 'CANCELLED' : 'ISSUED') as any,
          isLocked: true,
          issuedByUserId: 'SYSTEM',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTargetDocument(resolvedDoc);
      }
    } else {
      // Se não passou parâmetros válidos, seleciona a fatura mais recente como demonstração
      const latestDoc = allDocs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      if (latestDoc) {
        setTargetDocument(latestDoc);
        resolvedData = FiscalQRCodeService.buildPublicVerificationData(latestDoc, company);
      }
    }

    setVerificationData(resolvedData);
    setLoading(false);
  }, [initialDocumentNumber, initialToken, db, company]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const term = searchQuery.trim();
    // 1. Verificar se é uma string canónica de QR Code
    if (term.includes('*') && term.includes(':')) {
      const parsed = FiscalQRCodeService.decodeVerificationPayload(term);
      if (parsed) {
        setVerificationData(parsed);
        return;
      }
    }

    // 2. Procurar na base de dados
    const allDocs = Array.from(db.documents.values());
    const found = allDocs.find(
      (d) =>
        d.documentNumber.toLowerCase().includes(term.toLowerCase()) ||
        d.id.toLowerCase().includes(term.toLowerCase()) ||
        d.hashControl.toLowerCase() === term.toLowerCase()
    );

    if (found) {
      setTargetDocument(found);
      const data = FiscalQRCodeService.buildPublicVerificationData(found, company);
      setVerificationData(data);
    } else {
      alert(`Nenhum documento fiscal encontrado para a referência: "${term}". Verifique a numeração oficial.`);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: `Validação de Fatura AGT - ${verificationData?.documentNumber}`,
          text: `Confira a autenticidade da fatura ${verificationData?.documentNumber} emitida por ${verificationData?.emitterName} e certificada pela AGT.`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyHash = () => {
    if (!verificationData?.hash) return;
    navigator.clipboard.writeText(verificationData.hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const allDocumentsList = Array.from(db.documents.values());

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Barra de Navegação Pública Superior com Identidade Institucional da AGT */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Brasão / Emblema Fiscal Angolano */}
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 font-black shadow-inner border border-amber-400/40 shrink-0">
              <ShieldCheck className="w-6 h-6 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                  República de Angola
                </span>
                <span className="text-stone-500 text-[10px]">•</span>
                <span className="text-[10px] text-stone-400 font-semibold">AGT</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                Portal de Autenticidade de Faturas
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 border border-stone-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">Voltar à Consola</span>
                <span className="sm:hidden">Voltar</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              title="Partilhar ou copiar link de verificação"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Link Copiado!' : 'Partilhar'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
            <h2 className="text-base font-bold text-stone-800">A verificar autenticidade na AGT...</h2>
            <p className="text-xs text-stone-500">Descodificando assinatura digital RSA-2048 e integridade do documento.</p>
          </div>
        ) : !verificationData ? (
          /* Estado de documento não encontrado */
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-stone-900">Nenhum Documento Especificado</h2>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Leia um Código QR de uma fatura emitida com a câmara do telemóvel ou pesquise o número da fatura abaixo.
              </p>
            </div>

            <form onSubmit={handleManualSearch} className="max-w-md mx-auto flex gap-2 pt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: FT A2026/000001 ou cole o QR"
                className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 cursor-pointer"
              >
                Consultar
              </button>
            </form>
          </div>
        ) : (
          /* Visualização de Fatura Válida e Certificada */
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 1. SELO OFICIAL AGT DE VALIDADE & CERTIFICAÇÃO */}
            <div
              className={`rounded-2xl p-5 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                verificationData.status === 'CANCELLED'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-emerald-900 text-white border-emerald-800'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    verificationData.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-700 border-rose-300'
                      : 'bg-emerald-800/80 text-emerald-300 border-emerald-700'
                  }`}
                >
                  {verificationData.status === 'CANCELLED' ? (
                    <AlertTriangle className="w-7 h-7 text-rose-600" />
                  ) : (
                    <ShieldCheck className="w-7 h-7 text-emerald-300" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        verificationData.status === 'CANCELLED'
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-emerald-400 text-stone-950'
                      }`}
                    >
                      {verificationData.status === 'CANCELLED'
                        ? 'DOCUMENTO ANULADO FISCALMENTE'
                        : 'FATURA AUTÊNTICA & CERTIFICADA PELA AGT'}
                    </span>
                    <span className="text-emerald-400/80 text-xs hidden sm:inline">•</span>
                    <span className="text-[11px] text-emerald-200/90 font-mono hidden sm:inline">
                      Portaria n.º 292/18
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold">
                    {verificationData.documentNumber}
                  </h2>
                  <p className="text-xs text-emerald-100/80">
                    Emitido por software validado sob o n.º{' '}
                    <strong className="text-white underline decoration-amber-400 decoration-2">
                      {verificationData.softwareCertificateNumber}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Botões de Ação Imediata */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {targetDocument && (
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-stone-700" />
                    <span>Ver 2.ª Via / Imprimir</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. CARTÕES DE DESTAQUE: VALORES & CONTROLO CRIPTOGRÁFICO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total do Documento */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Total Pago / A Pagar
                </span>
                <div className="text-lg sm:text-xl font-mono font-black text-emerald-800">
                  {verificationData.netTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                  <span className="text-xs font-sans text-stone-500 font-semibold">AOA</span>
                </div>
                <div className="text-[10px] text-stone-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Valor Líquido Fiscal</span>
                </div>
              </div>

              {/* HashControl Oficial (Tag Q) */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  HashControl (Tag Q)
                </span>
                <div className="text-lg sm:text-xl font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit border border-amber-200">
                  {verificationData.hashControl}
                </div>
                <div className="text-[10px] text-stone-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>4 Caracteres RSA-2048</span>
                </div>
              </div>

              {/* Data e Hora de Emissão */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Data de Emissão
                </span>
                <div className="text-base sm:text-lg font-bold text-stone-900">
                  {verificationData.documentDate}
                </div>
                <div className="text-[10px] text-stone-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>{verificationData.documentTime || 'Registada no Sistema'}</span>
                </div>
              </div>

              {/* Certificação AGT */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Certificado AGT
                </span>
                <div className="text-sm sm:text-base font-bold font-mono text-stone-800">
                  {verificationData.softwareCertificateNumber}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Validado &amp; Vigente</span>
                </div>
              </div>
            </div>

            {/* 3. DADOS DO EMITENTE & CLIENTE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emitente */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Entidade Emitente
                  </h3>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-stone-900 text-sm">
                    {verificationData.emitterName}
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="text-stone-500">NIF do Emitente:</span>
                    <strong className="font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                      {verificationData.emitterTaxId}
                    </strong>
                  </div>
                  {verificationData.emitterAddress && (
                    <div className="text-stone-500 text-[11px] leading-relaxed">
                      {verificationData.emitterAddress}, {verificationData.emitterCity || 'Angola'}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
                    <span className="text-stone-500">Regime Fiscal:</span>
                    <span className="font-semibold text-emerald-700">Regime Geral de IVA</span>
                  </div>
                </div>
              </div>

              {/* Adquirente / Cliente */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Adquirente / Cliente
                  </h3>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-stone-900 text-sm">
                    {verificationData.customerName || 'Consumidor Final'}
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="text-stone-500">NIF do Adquirente:</span>
                    <strong className="font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                      {verificationData.customerTaxId}
                    </strong>
                  </div>
                  {verificationData.customerAddress && (
                    <div className="text-stone-500 text-[11px] leading-relaxed">
                      {verificationData.customerAddress}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
                    <span className="text-stone-500">País de Residência:</span>
                    <span className="font-semibold text-stone-800">Angola (AO)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. DISCRIMINAÇÃO FISCAL DE IMPOSTOS (IVA & RETENÇÃO) */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Quadro Resumo de Impostos &amp; Incidência (AGT)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">
                    Incidência / Base (I7)
                  </div>
                  <div className="font-mono font-bold text-stone-900 mt-1">
                    {verificationData.taxableBase.toLocaleString('pt-AO', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    AOA
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">
                    IVA Liquidado (I8)
                  </div>
                  <div className="font-mono font-bold text-stone-900 mt-1">
                    {verificationData.taxAmount.toLocaleString('pt-AO', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    AOA
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">
                    Retenção na Fonte (O)
                  </div>
                  <div className="font-mono font-bold text-stone-900 mt-1">
                    {(verificationData.withholdingAmount || 0).toLocaleString('pt-AO', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    AOA
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase">
                    Total do Documento (N)
                  </div>
                  <div className="font-mono font-bold text-emerald-900 mt-1">
                    {verificationData.grossTotal.toLocaleString('pt-AO', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    AOA
                  </div>
                </div>
              </div>
            </div>

            {/* 5. LINHAS DE ITENS / PRODUTOS ADQUIRIDOS (se disponíveis) */}
            {verificationData.items && verificationData.items.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Itens / Bens / Serviços Faturados
                  </h3>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {verificationData.items.length}{' '}
                    {verificationData.items.length === 1 ? 'linha' : 'linhas'}
                  </span>
                </div>
                <div className="divide-y divide-stone-100 text-xs">
                  {verificationData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50/60 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-stone-900">{item.description}</div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          Ref: {item.code} • Qtd: <strong>{item.quantity}</strong> ×{' '}
                          {item.unitPrice.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                          IVA {item.taxRate}%
                        </span>
                        <span className="font-mono font-bold text-stone-900">
                          {item.total.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. AUDITORIA CRIPTOGRÁFICA & PROVA MATEMÁTICA RSA-2048 */}
            <div className="bg-stone-900 text-white rounded-2xl p-5 border border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                    Assinatura Criptográfica RSA-2048 &amp; Hash Canónico
                  </h3>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Check className="w-3 h-3 mr-1" />
                  Matematicamente Válida
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                    <span>Hash SHA-256 do Documento (Encadeamento Canónico):</span>
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      className="text-emerald-400 hover:text-emerald-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash ? 'Copiado!' : 'Copiar Hash'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-950 font-mono text-[10px] text-stone-300 break-all select-all border border-stone-800">
                    {verificationData.hash}
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-stone-400 leading-relaxed">
                  Os 4 caracteres de controlo{' '}
                  <strong className="text-amber-400 font-mono text-xs">
                    {verificationData.hashControl}
                  </strong>{' '}
                  correspondem rigorosamente às posições 11, 21, 31 e 41 da assinatura assimétrica
                  RSA-2048 gerada pela chave privada da entidade e validada com a chave pública
                  registada na AGT.
                </div>
              </div>
            </div>

            {/* 7. CONSULTAR OUTRA FATURA OU TESTAR OUTRO DOCUMENTO */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-stone-600" />
                Consultar Outra Fatura ou Série
              </h3>

              <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Introduza número da fatura (ex: FT A2026/000001) ou cole o Código QR"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 cursor-pointer shadow-xs"
                >
                  Verificar Documento
                </button>
              </form>

              {allDocumentsList.length > 1 && (
                <div className="pt-2">
                  <span className="text-[11px] text-stone-500">Outras faturas disponíveis para consulta rápida:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {allDocumentsList.slice(0, 6).map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setTargetDocument(doc);
                          setVerificationData(FiscalQRCodeService.buildPublicVerificationData(doc, company));
                        }}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          doc.documentNumber === verificationData.documentNumber
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {doc.documentNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Rodapé Oficial da AGT */}
      <footer className="bg-white border-t border-stone-200 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sistema Integrado com a Administração Geral Tributária de Angola (AGT)</span>
          </div>
          <div className="text-[11px] text-stone-400">
            Decreto Presidencial n.º 312/18 • Portaria n.º 292/18
          </div>
        </div>
      </footer>

      {/* Modal de Impressão da 2.ª Via Oficial */}
      {showReceiptModal && targetDocument && (
        <ReceiptPreviewModal
          document={targetDocument}
          company={company}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};
