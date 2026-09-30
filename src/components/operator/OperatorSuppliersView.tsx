import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User } from '../../core/fiscal/types/user';
import {
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Truck,
  ExternalLink,
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  productsSupplied: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface OperatorSuppliersViewProps {
  currentUser: User;
}

export const OperatorSuppliersView: React.FC<OperatorSuppliersViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formProducts, setFormProducts] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [db]);

  // Lista padrão baseada na base de dados
  const defaultSuppliers: Supplier[] = [
    {
      id: 'SUP-LIMA',
      name: 'Distribuidora Lima',
      taxId: '5401112233',
      phone: '923 111 222',
      email: 'limadis@email.com',
      address: 'Zona Industrial de Viana',
      city: 'Luanda',
      productsSupplied: 'Alimentos, Bebidas',
      status: 'ACTIVE',
    },
    {
      id: 'SUP-POVO',
      name: 'Comércio do Povo',
      taxId: '5402223344',
      phone: '924 333 444',
      email: 'povo@comercio.com',
      address: 'Mercado dos Congolenses',
      city: 'Luanda',
      productsSupplied: 'Limpeza, Higiene',
      status: 'ACTIVE',
    },
    {
      id: 'SUP-AGRO',
      name: 'AgroAlimentos',
      taxId: '5403334455',
      phone: '925 555 666',
      email: 'agro@alimentos.com',
      address: 'Polo Agroindustrial de Catete',
      city: 'Luanda',
      productsSupplied: 'Arroz, Feijão, Óleo',
      status: 'ACTIVE',
    },
    {
      id: 'SUP-FARMA',
      name: 'FarmaVida',
      taxId: '5404445566',
      phone: '926 777 888',
      email: 'farmav@vida.com',
      address: 'Av. Pedro de Castro Van-Dúnem Loy',
      city: 'Luanda',
      productsSupplied: 'Produtos de Higiene',
      status: 'ACTIVE',
    },
  ];

  // Integrar com os fornecedores da base de dados se houver
  const dbSuppliers = Array.from(db.suppliers.values());
  const combinedSuppliers: Supplier[] = [...defaultSuppliers];

  dbSuppliers.forEach((s) => {
    const existingIdx = combinedSuppliers.findIndex((x) => x.id === s.id);
    const item: Supplier = {
      id: s.id,
      name: s.name,
      taxId: s.taxId,
      phone: s.phone || '923 000 000',
      email: s.email || 'fornecedor@email.com',
      address: s.address || 'Luanda',
      city: s.city || 'Luanda',
      productsSupplied: s.productsSupplied || 'Geral',
      status: s.status,
    };
    if (existingIdx >= 0) {
      combinedSuppliers[existingIdx] = item;
    } else {
      combinedSuppliers.push(item);
    }
  });

  const filtered = combinedSuppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.taxId.toLowerCase().includes(q) ||
      s.productsSupplied.toLowerCase().includes(q)
    );
  });

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const company = Array.from(db.companies.values())[0];
    const newId = editingSupplier ? editingSupplier.id : `SUP-${Date.now().toString(36)}`;

    const newSup = {
      id: newId,
      companyId: company.id,
      taxId: formTaxId.trim() || '5409998877',
      name: formName.trim(),
      country: 'AO',
      address: formAddress.trim() || 'Luanda',
      city: 'Luanda',
      email: formEmail.trim() || 'fornecedor@email.com',
      phone: formPhone.trim() || '923 000 000',
      contactPerson: formName.trim(),
      productsSupplied: formProducts.trim() || 'Diversos',
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
    };

    db.suppliers.set(newSup.id, newSup);

    setFeedbackSuccess(
      editingSupplier ? 'Fornecedor atualizado com sucesso!' : 'Novo fornecedor cadastrado com sucesso!'
    );
    setTimeout(() => setFeedbackSuccess(null), 3500);

    setShowAddModal(false);
    setEditingSupplier(null);
    setFormName('');
    setFormTaxId('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormProducts('');
    setTick((t) => t + 1);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormName(s.name);
    setFormTaxId(s.taxId);
    setFormPhone(s.phone);
    setFormEmail(s.email);
    setFormAddress(s.address);
    setFormProducts(s.productsSupplied);
    setShowAddModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente remover o fornecedor "${name}"?`)) {
      db.suppliers.delete(id);
      setTick((t) => t + 1);
    }
  };

  return (
    <div id="operator-suppliers-view" className="space-y-4">
      {/* 1. Header & Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Fornecedores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerencie seus parceiros e fornecedores de produtos para reposição.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSupplier(null);
            setFormName('');
            setFormTaxId('');
            setFormPhone('');
            setFormEmail('');
            setFormAddress('');
            setFormProducts('');
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {feedbackSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {feedbackSuccess}
        </div>
      )}

      {/* 2. Barra de Pesquisa */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, telefone, email, NIF ou tipo de produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          />
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold shadow-2xs">
          <span>{filtered.length} fornecedores</span>
        </div>
      </div>

      {/* 3. Tabela de Fornecedores */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4">NIF</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Localização</th>
                <th className="py-3 px-4">Produtos Fornecidos</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 font-bold">{s.taxId}</td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{s.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[160px]">{s.address}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                      {s.productsSupplied}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Activo
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar fornecedor"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar fornecedor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    Nenhum fornecedor encontrado para a pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar / Editar Fornecedor */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nome da Empresa / Fornecedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Distribuidora Nacional, Lda"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    NIF (Número Fiscal)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 5401112233"
                    value={formTaxId}
                    onChange={(e) => setFormTaxId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Telefone de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 923 111 222"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="fornecedor@email.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Produtos Fornecidos
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bebidas, Arroz, Lácteos"
                    value={formProducts}
                    onChange={(e) => setFormProducts(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Endereço / Localização
                </label>
                <input
                  type="text"
                  placeholder="Ex: Viana, Luanda"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Guardar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
