import React, { useState } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User } from '../../core/fiscal/types/user';
import { FiscalDocument } from '../../core/fiscal/types/document';
import { ReceiptPreviewModal } from '../common/ReceiptPreviewModal';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Eye,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface OperatorDocumentsViewProps {
  currentUser: User;
}

export const OperatorDocumentsView: React.FC<OperatorDocumentsViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<FiscalDocument | null>(null);
  const [previewFormat, setPreviewFormat] = useState<'thermal' | 'a4'>('thermal');

  const company = Array.from(db.companies.values())[0];
  const establishment = Array.from(db.establishments.values()).find(
    (e) => e.id === currentUser.establishmentId
  );

  const documents = Array.from(db.documents.values()).sort(
    (a, b) => new Date(b.systemEntryDate).getTime() - new Date(a.systemEntryDate).getTime()
  );

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.customerTaxId && d.customerTaxId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'ALL' || d.documentTypeCode === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div id="operator-documents-view" className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-900">Consulta Rápida de Documentos Fiscais</h2>
          <p className="text-xs text-stone-500">
            Pesquise facturas emitidas, reimprima talões e verifique hashes de controlo fiscal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-600 font-semibold bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
            {documents.length} Facturas Emitidas
          </span>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Pesquisar por nº de factura, nome do cliente ou NIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-stone-900 focus:outline-none"
          />
        </div>

        <div className="flex gap-1 shrink-0 w-full sm:w-auto">
          {['ALL', 'FR', 'FT', 'NC'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                filterType === t
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {t === 'ALL' ? 'Todos' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="p-3">Nº Documento / Tipo</th>
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Cliente / NIF</th>
                <th className="p-3 text-right">Incidência</th>
                <th className="p-3 text-right">IVA</th>
                <th className="p-3 text-right">Total Líquido</th>
                <th className="p-3 text-center">Hash AGT</th>
                <th className="p-3 text-center">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-stone-400 text-xs">
                    Nenhum documento encontrado com os critérios actuais.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3 font-bold text-stone-900">
                      <div>{doc.documentNumber}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold">
                        {doc.documentTypeCode}
                      </span>
                    </td>
                    <td className="p-3 text-stone-600">
                      <div>{doc.documentDate}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{doc.systemEntryDate.split('T')[1].slice(0, 5)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-stone-900">{doc.customerName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {doc.customerTaxId ? `NIF: ${doc.customerTaxId}` : 'Consumidor Final'}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-stone-600">
                      {doc.taxableBase.toLocaleString('pt-AO')} AOA
                    </td>
                    <td className="p-3 text-right font-mono text-stone-600">
                      {doc.taxAmount.toLocaleString('pt-AO')} AOA
                    </td>
                    <td className="p-3 text-right font-bold font-mono text-stone-900">
                      {doc.netTotal.toLocaleString('pt-AO')} AOA
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-[11px] text-stone-700">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                        {doc.hashControl}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setPreviewFormat('thermal');
                            setSelectedDoc(doc);
                          }}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          title="Ver Talão POS"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setPreviewFormat('a4');
                            setSelectedDoc(doc);
                          }}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          title="Ver Factura A4"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pré-visualização do Talão / Factura */}
      {selectedDoc && company && (
        <ReceiptPreviewModal
          document={selectedDoc}
          company={company}
          establishment={establishment}
          initialMode={previewFormat}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
};
