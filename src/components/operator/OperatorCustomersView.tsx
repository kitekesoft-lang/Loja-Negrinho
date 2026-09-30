import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User } from '../../core/fiscal/types/user';
import { Customer } from '../../core/fiscal/types/customer';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  History,
  CheckCircle2,
} from 'lucide-react';

interface OperatorCustomersViewProps {
  currentUser: User;
}

export const OperatorCustomersView: React.FC<OperatorCustomersViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('CLI-MARIA');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form de novo cliente
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNif, setNewNif] = useState('');

  useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [db]);

  // Lista dos 5 clientes da imagem
  const defaultCustomers = [
    { id: 'CLI-MARIA', name: 'Maria Santos', phone: '923 456 789', email: 'maria@email.com', address: 'Luanda' },
    { id: 'CLI-JOAO', name: 'João Ferreira', phone: '924 567 890', email: 'joao@email.com', address: 'Viana' },
    { id: 'CLI-ANA', name: 'Ana Costa', phone: '919 670 901', email: 'ana@email.com', address: 'Cacuaco' },
    { id: 'CLI-PEDRO', name: 'Pedro Silva', phone: '927 808 123', email: 'pedro@email.com', address: 'Talatona' },
    { id: 'CLI-CARLA', name: 'Carla Mendes', phone: '927 800 123', email: 'carla@email.com', address: 'Kilamba' },
  ];

  // Integrar clientes da base de dados
  const dbCustomers = Array.from(db.customers.values()).filter((c) => c.customerType !== 'CONSUMIDOR_FINAL');

  const combinedCustomers = defaultCustomers.map((dc) => {
    const fromDb = db.customers.get(dc.id);
    if (fromDb) {
      return {
        id: fromDb.id,
        name: fromDb.name,
        phone: fromDb.phone || dc.phone,
        email: fromDb.email || dc.email,
        address: fromDb.billingAddress || dc.address,
      };
    }
    return dc;
  });

  // Adicionar clientes extras cadastrados
  dbCustomers.forEach((c) => {
    if (!combinedCustomers.some((x) => x.id === c.id)) {
      combinedCustomers.push({
        id: c.id,
        name: c.name,
        phone: c.phone || '923 000 000',
        email: c.email || 'cliente@email.com',
        address: c.billingAddress || 'Luanda',
      });
    }
  });

  const filtered = combinedCustomers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  // Histórico de compras para o cliente selecionado (exacto do mockup para Maria Santos)
  const purchaseHistory = [
    { date: '20/09/2025', products: 'Arroz, Açúcar, Óleo', total: '28.500 Kz' },
    { date: '10/09/2025', products: 'Leite, Pão', total: '12.000 Kz' },
    { date: '01/09/2025', products: 'Refrigerante, Pão', total: '8.500 Kz' },
  ];

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const company = Array.from(db.companies.values())[0];
    const newId = `CLI-${Date.now().toString(36)}`;

    const newCust: Customer = {
      id: newId,
      companyId: company.id,
      taxId: newNif.trim() || '999999999',
      name: newName.trim(),
      customerType: 'PARTICULAR',
      country: 'AO',
      billingAddress: newAddress.trim() || 'Luanda',
      city: 'Luanda',
      province: 'Luanda',
      phone: newPhone.trim(),
      email: newEmail.trim(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    db.customers.set(newCust.id, newCust);
    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewNif('');
    setTick((t) => t + 1);
  };

  const selectedCustomerObj = combinedCustomers.find((c) => c.id === selectedCustomerId) || combinedCustomers[0];

  return (
    <div id="operator-customers-view" className="space-y-5">
      {/* 1. Barra de Ações: Pesquisa + Botão Novo Cliente */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo cliente</span>
        </button>
      </div>

      {/* 2. Tabela de Clientes */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/70 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Endereço</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono">{c.phone}</td>
                    <td className="py-2.5 px-4 text-slate-600">{c.email}</td>
                    <td className="py-2.5 px-4 text-slate-600">{c.address}</td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Editar cliente ${c.name}`);
                          }}
                          className="text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remover cliente ${c.name}?`)) {
                              db.customers.delete(c.id);
                              setTick((t) => t + 1);
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Seção Inferior: Histórico de Compras (Exemplo - Maria Santos) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">
          Histórico de compras <span className="text-slate-400 font-normal">(exemplo - {selectedCustomerObj?.name})</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                <th className="pb-2.5">Data</th>
                <th className="pb-2.5">Produtos</th>
                <th className="pb-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {purchaseHistory.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 text-slate-500 font-medium">{item.date}</td>
                  <td className="py-2.5 font-bold text-slate-800">{item.products}</td>
                  <td className="py-2.5 text-right font-medium text-slate-900">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Adicionar Novo Cliente</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nome Completo:</label>
                <input
                  type="text"
                  placeholder="Ex: Maria Santos"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Telefone:</label>
                  <input
                    type="text"
                    placeholder="923 456 789"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">NIF (opcional):</label>
                  <input
                    type="text"
                    placeholder="005423112LA01"
                    value={newNif}
                    onChange={(e) => setNewNif(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">E-mail:</label>
                  <input
                    type="email"
                    placeholder="maria@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Endereço:</label>
                  <input
                    type="text"
                    placeholder="Ex: Luanda"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
