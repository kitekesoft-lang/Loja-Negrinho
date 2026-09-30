import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { InvoiceEngine } from '../../core/fiscal/engines/InvoiceEngine';
import { CreditNoteEngine } from '../../core/fiscal/engines/CreditNoteEngine';
import { PaymentEngine } from '../../core/fiscal/engines/PaymentEngine';
import { FiscalDocument } from '../../core/fiscal/types/document';
import { FiscalDocumentTypeCode, FISCAL_DOCUMENT_TYPES } from '../../core/fiscal/types/series';
import { User, UserRole } from '../../core/fiscal/types/user';
import { PaymentMethod, PAYMENT_METHOD_NAMES } from '../../core/fiscal/types/payment';
import { FiscalDocumentModal } from './FiscalDocumentModal';
import {
  FileText,
  PlusCircle,
  CreditCard,
  Printer,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Building2,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const FiscalWorkbench: React.FC = () => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  useEffect(() => {
    return db.subscribe(() => setTick((t) => t + 1));
  }, [db]);

  const company = db.companies.get('COMP-001')!;
  const establishments = Array.from(db.establishments.values());
  const users = Array.from(db.users.values());
  const customers = Array.from(db.customers.values());
  const products = Array.from(db.products.values());
  const seriesList = Array.from(db.series.values());
  const documents = Array.from(db.documents.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Utilizador activo na sessão simulada (para testar RBAC)
  const [activeUserId, setActiveUserId] = useState<string>('USR-ADMIN');
  const activeUser = db.users.get(activeUserId) || users[0];

  // Estado do formulário de emissão
  const [showIssueForm, setShowIssueForm] = useState<boolean>(false);
  const [docType, setDocType] = useState<FiscalDocumentTypeCode>('FT');
  const [establishmentId, setEstablishmentId] = useState<string>(establishments[0]?.id || '');
  const [seriesId, setSeriesId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>(customers[1]?.id || '');
  const [notes, setNotes] = useState<string>('');

  // Linhas do documento
  const [lines, setLines] = useState<
    Array<{
      productId: string;
      quantity: number;
      discountPercentage: number;
    }>
  >([
    {
      productId: products[0]?.id || '',
      quantity: 1,
      discountPercentage: 0,
    },
  ]);

  // Referência para Nota de Crédito ou Débito
  const [referencedDocId, setReferencedDocId] = useState<string>('');
  const [creditReason, setCreditReason] = useState<string>('Devolução ou cancelamento acordado com o cliente');

  // Modal de visualização
  const [viewingDocument, setViewingDocument] = useState<FiscalDocument | null>(null);

  // Modal de pagamento
  const [payingDocument, setPayingDocument] = useState<FiscalDocument | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MULTICAIXA');
  const [paymentRef, setPaymentRef] = useState<string>('TPA-AUT-1029');

  // Mensagens de feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Ajustar série padrão quando muda tipo de documento
  useEffect(() => {
    const matching = seriesList.find(
      (s) => s.documentTypeCode === docType && s.establishmentId === establishmentId && s.isActive
    );
    if (matching) {
      setSeriesId(matching.id);
    } else {
      const fallback = seriesList.find((s) => s.documentTypeCode === docType && s.isActive);
      setSeriesId(fallback ? fallback.id : '');
    }
  }, [docType, establishmentId, seriesList]);

  // Adicionar linha
  const addLine = () => {
    setLines([
      ...lines,
      {
        productId: products[0]?.id || '',
        quantity: 1,
        discountPercentage: 0,
      },
    ]);
  };

  // Remover linha
  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Submeter Emissão
  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const series = db.series.get(seriesId);
    if (!series) {
      setFeedback({ type: 'error', message: 'Selecione uma série documental válida.' });
      return;
    }

    const customer = db.customers.get(customerId);
    if (!customer) {
      setFeedback({ type: 'error', message: 'Selecione um cliente válido.' });
      return;
    }

    try {
      let doc: FiscalDocument;

      if (docType === 'NC') {
        const origDoc = db.documents.get(referencedDocId);
        if (!origDoc) {
          throw new Error('Selecione a Factura original a rectificar via Nota de Crédito.');
        }

        doc = CreditNoteEngine.issueCreditNote(
          {
            company,
            establishmentId,
            series,
            originalDocument: origDoc,
            customer,
            reason: creditReason,
            lines,
            issuedByUser: activeUser,
            notes,
            previousDocumentHash: db.getLastHashForSeries(series.id),
          },
          { products: db.products, taxConfigs: db.taxConfigurations }
        );
      } else {
        const references =
          docType === 'ND' && referencedDocId
            ? [
                {
                  id: `REF-${Date.now()}`,
                  referencedDocumentId: referencedDocId,
                  referencedDocumentNumber: db.documents.get(referencedDocId)?.documentNumber || '',
                  referenceType: 'DEBIT_NOTE_FOR' as const,
                  reason: 'Encargos e correcções fiscais adicionais',
                  amount: 0,
                },
              ]
            : undefined;

        doc = InvoiceEngine.issueFiscalDocument(
          {
            company,
            establishmentId,
            series,
            documentTypeCode: docType,
            customer,
            lines,
            references,
            issuedByUser: activeUser,
            notes,
            previousDocumentHash: db.getLastHashForSeries(series.id),
          },
          { products: db.products, taxConfigs: db.taxConfigurations }
        );
      }

      // Grava no banco, enfileira na transmissão AGT e notifica
      db.documents.set(doc.id, doc);
      db.agtQueue.enqueueDocument(doc);
      db.notify();

      setFeedback({
        type: 'success',
        message: `Documento fiscal ${doc.documentNumber} emitido com sucesso! Hash: ${doc.hashControl}. Enfileirado para comunicação oficial com a AGT.`,
      });
      setShowIssueForm(false);
      setViewingDocument(doc);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro ao emitir documento fiscal.',
      });
    }
  };

  // Registar Pagamento
  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDocument) return;

    try {
      const existingPayments = db.getPaymentsForDocument(payingDocument.id);
      const payment = PaymentEngine.registerPayment(
        {
          companyId: company.id,
          document: payingDocument,
          amount: paymentAmount,
          paymentMethod,
          transactionReference: paymentRef,
          user: activeUser,
        },
        existingPayments
      );

      db.payments.set(payment.id, payment);
      db.notify();

      setFeedback({
        type: 'success',
        message: `Pagamento de ${payment.amount.toLocaleString('pt-AO')} AOA registado para ${payingDocument.documentNumber} via ${PAYMENT_METHOD_NAMES[paymentMethod]}.`,
      });
      setPayingDocument(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro ao registar pagamento.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Actor RBAC switcher & Empresa */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-lg">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">{company.name}</h2>
              <span className="text-xs font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                NIF: {company.taxId}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {company.address} • {company.taxRegime} de IVA • Moeda: {company.currency}
            </p>
          </div>
        </div>

        {/* RBAC Session Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-700">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Operador Activo (Sessão RBAC):</span>
          </div>
          <select
            id="select-active-user"
            value={activeUserId}
            onChange={(e) => setActiveUserId(e.target.value)}
            className="text-xs bg-white border border-stone-300 rounded px-2.5 py-1 text-stone-800 font-medium focus:ring-1 focus:ring-stone-900"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — [{u.role}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{feedback.message}</div>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900">Documentos Fiscais Emitidos</h3>
          <p className="text-xs text-stone-500">
            Facturas (FT), Facturas/Recibo (FR), Recibos (RC), Notas de Crédito (NC) e Notas de Débito (ND)
          </p>
        </div>

        <button
          id="btn-open-issue-form"
          onClick={() => setShowIssueForm(!showIssueForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>{showIssueForm ? 'Fechar Formulário' : 'Emitir Novo Documento Fiscal'}</span>
        </button>
      </div>

      {/* Issue Form */}
      {showIssueForm && (
        <form
          onSubmit={handleIssue}
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md space-y-6 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <div>
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Emissão de Documento Fiscal Oficial (Fase 1)</span>
              </h4>
              <p className="text-xs text-stone-500">
                Geração atómica de sequência de série e hash encadeado SHA-256 imediato
              </p>
            </div>
            <div className="text-xs text-stone-600 bg-stone-100 px-3 py-1 rounded-full font-mono">
              Operador: <strong>{activeUser.name}</strong> ({activeUser.role})
            </div>
          </div>

          {/* Form Top: Type, Establishment, Series, Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Tipo de Documento:
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as FiscalDocumentTypeCode)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-medium"
              >
                <option value="FT">FT — Factura (a Crédito / Quitação Futura)</option>
                <option value="FR">FR — Factura/Recibo (Quitação Imediata)</option>
                <option value="NC">NC — Nota de Crédito (Rectificação)</option>
                <option value="ND">ND — Nota de Débito (Acréscimo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Estabelecimento:
              </label>
              <select
                value={establishmentId}
                onChange={(e) => setEstablishmentId(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2"
              >
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.code} — {est.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Série Documental:
              </label>
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-mono"
              >
                {seriesList
                  .filter((s) => s.documentTypeCode === docType && s.isActive)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.documentTypeCode} {s.seriesCode} (Seq. Actual: {s.currentSequence})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Cliente / Adquirente:
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (NIF: {c.taxId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference selection for Credit Note (NC) or Debit Note (ND) */}
          {(docType === 'NC' || docType === 'ND') && (
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Referência Obrigatória ao Documento Original (Exigência Legal AGT)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Documento Original a Rectificar:
                  </label>
                  <select
                    value={referencedDocId}
                    onChange={(e) => setReferencedDocId(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-mono"
                    required
                  >
                    <option value="">-- Seleccione a Factura Original --</option>
                    {documents
                      .filter((d) => ['FT', 'FR'].includes(d.documentTypeCode))
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.documentNumber} — {d.customerName} ({d.netTotal.toLocaleString('pt-AO')} AOA)
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Motivo Legal da Rectificação:
                  </label>
                  <input
                    type="text"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2"
                    placeholder="Ex: Devolução de mercadoria, cancelamento de contrato..."
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lines items section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Linhas de Artigos &amp; Serviços (TaxEngine Activo)
              </span>
              <button
                type="button"
                onClick={addLine}
                className="text-xs text-emerald-700 font-semibold hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Adicionar Linha
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);
                const taxConfig = prod ? db.taxConfigurations.get(prod.taxConfigurationId) : null;
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block text-[10px] text-stone-500 mb-0.5">Artigo / Serviço:</label>
                      <select
                        value={line.productId}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].productId = e.target.value;
                          setLines(updated);
                        }}
                        className="w-full bg-white border border-stone-300 rounded p-1.5 text-xs font-medium"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.description} ({p.standardPrice.toLocaleString('pt-AO')} AOA)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-stone-500 mb-0.5">Qtd:</label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setLines(updated);
                        }}
                        className="w-full bg-white border border-stone-300 rounded p-1.5 text-xs font-mono"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-stone-500 mb-0.5">Desconto (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={line.discountPercentage}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].discountPercentage = Math.min(
                            100,
                            Math.max(0, parseFloat(e.target.value) || 0)
                          );
                          setLines(updated);
                        }}
                        className="w-full bg-white border border-stone-300 rounded p-1.5 text-xs font-mono"
                      />
                    </div>

                    <div className="col-span-3 sm:col-span-2 text-right">
                      <label className="block text-[10px] text-stone-500 mb-0.5">Imposto:</label>
                      <span className="inline-block px-1.5 py-1 bg-stone-200 rounded text-[11px] font-mono text-stone-800">
                        {taxConfig?.code || 'IVA_14'} ({taxConfig?.ratePercentage}%)
                      </span>
                    </div>

                    <div className="col-span-1 text-center">
                      <label className="block text-[10px] text-transparent mb-0.5">A</label>
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 1}
                        className="p-1.5 text-stone-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Observações no Documento (opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Condições de pagamento a 30 dias, local de entrega Luanda Marginal..."
              className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowIssueForm(false)}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Emitir Documento &amp; Gerar Hash Criptográfico</span>
            </button>
          </div>
        </form>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {documents.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-3">
            <Receipt className="w-12 h-12 text-stone-300 mx-auto" />
            <p className="text-sm font-medium text-stone-700">
              Nenhum documento fiscal emitido nesta sessão.
            </p>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Clique em "Emitir Novo Documento Fiscal" acima ou execute os Testes Automatizados para gerar as primeiras facturas da série A2026.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                  <th className="py-3 px-4">Documento</th>
                  <th className="py-3 px-4">Data Emissão</th>
                  <th className="py-3 px-4">Cliente / Adquirente</th>
                  <th className="py-3 px-4 text-right">Total Líquido</th>
                  <th className="py-3 px-4 text-center">Código Fiscal</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {documents.map((doc) => {
                  const payments = db.getPaymentsForDocument(doc.id);
                  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
                  const isFullyPaid = totalPaid >= doc.netTotal - 0.01;

                  return (
                    <tr key={doc.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 font-mono flex items-center gap-1.5">
                          <span>{doc.documentNumber}</span>
                          {doc.isLocked && (
                            <span title="Imutável pós-emissão">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          Seq. #{doc.sequentialNumber}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-stone-600">{doc.documentDate}</td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-900">{doc.customerName}</div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          NIF: {doc.customerTaxId}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                        {doc.netTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                        {doc.documentTypeCode === 'FT' && (
                          <div className="text-[10px] font-normal text-stone-500">
                            {isFullyPaid ? (
                              <span className="text-emerald-700 font-medium">● Quitado</span>
                            ) : (
                              <span className="text-amber-700 font-medium">
                                ● Pendente: {(doc.netTotal - totalPaid).toLocaleString('pt-AO')} AOA
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded font-mono font-bold bg-stone-100 border border-stone-200 text-stone-800 text-[11px]"
                          title={`Hash completo: ${doc.hash}`}
                        >
                          {doc.hashControl}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {doc.status}
                        </span>
                        {(() => {
                          const agtItem = db.agtQueue.getByDocumentId(doc.id);
                          if (!agtItem) return null;
                          const isAccepted = agtItem.status === 'ACCEPTED';
                          return (
                            <div className="mt-1">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                  isAccepted
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                    : agtItem.status === 'FAILED_CONTINGENCY'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                                }`}
                                title={
                                  isAccepted
                                    ? `AGT Recibo: ${agtItem.response?.receiptNumber}`
                                    : `AGT Estado: ${agtItem.status}`
                                }
                              >
                                AGT: {agtItem.status === 'ACCEPTED' ? 'OK' : agtItem.status}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setViewingDocument(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ver / Imprimir</span>
                        </button>

                        {doc.documentTypeCode === 'FT' && !isFullyPaid && (
                          <button
                            onClick={() => {
                              setPayingDocument(doc);
                              setPaymentAmount(Math.round((doc.netTotal - totalPaid) * 100) / 100);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-300 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                            <span>Pagar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Pagamento */}
      {payingDocument && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRegisterPayment}
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Registo de Pagamento (Tesouraria)</span>
              </h4>
              <button
                type="button"
                onClick={() => setPayingDocument(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
              <div>
                Factura: <strong className="font-mono">{payingDocument.documentNumber}</strong>
              </div>
              <div>
                Cliente: <strong>{payingDocument.customerName}</strong>
              </div>
              <div>
                Total do Documento:{' '}
                <strong className="font-mono">
                  {payingDocument.netTotal.toLocaleString('pt-AO')} AOA
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Montante a Liquidar (AOA):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-bold font-mono bg-white border border-stone-300 rounded-lg p-2.5 text-emerald-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Método de Pagamento:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-medium"
              >
                <option value="MULTICAIXA">Multicaixa / TPA</option>
                <option value="BANK_TRANSFER">Transferência Bancária</option>
                <option value="CASH">Numerário / Dinheiro</option>
                <option value="CREDIT_CARD">Cartão de Crédito</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Referência / Comprovativo da Transacção:
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Ex: TPA-AUT-99218, Talão BAI 44812..."
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setPayingDocument(null)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-colors cursor-pointer"
              >
                Confirmar Liquidação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Impressão de Factura Oficial AGT */}
      {viewingDocument && (
        <FiscalDocumentModal
          document={viewingDocument}
          company={company}
          establishment={establishments.find((e) => e.id === viewingDocument.establishmentId)}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  );
};
