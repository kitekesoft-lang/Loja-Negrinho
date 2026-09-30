import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User, UserRole } from '../../core/fiscal/types/user';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  KeyRound,
  Shield,
  CheckCircle2,
  X,
  Lock,
  UserCheck,
} from 'lucide-react';

interface OperatorUsersViewProps {
  currentUser: User;
  onSwitchUser?: (userId: string) => void;
}

export const OperatorUsersView: React.FC<OperatorUsersViewProps> = ({ currentUser, onSwitchUser }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('CAIXA');
  const [formPassword, setFormPassword] = useState('chave123');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [db]);

  const allUsers = Array.from(db.users.values());

  const filtered = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    const company = Array.from(db.companies.values())[0];
    const establishment = Array.from(db.establishments.values())[0];

    if (editingUser) {
      editingUser.name = formName.trim();
      editingUser.email = formEmail.trim();
      editingUser.role = formRole;
      if (formPassword.trim()) {
        editingUser.password = formPassword.trim();
      }
      db.users.set(editingUser.id, editingUser);
      setFeedbackSuccess(`Utilizador "${editingUser.name}" atualizado com sucesso!`);
    } else {
      const newId = `USR-${Date.now().toString(36)}`;
      const newUser: User = {
        id: newId,
        companyId: company.id,
        establishmentId: establishment ? establishment.id : 'EST-001',
        name: formName.trim(),
        username: formEmail.trim().split('@')[0],
        email: formEmail.trim(),
        role: formRole,
        password: formPassword.trim() || 'chave123',
        mustChangePassword: false,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      db.users.set(newUser.id, newUser);
      setFeedbackSuccess(`Novo operador "${newUser.name}" cadastrado com sucesso!`);
    }

    setTimeout(() => setFeedbackSuccess(null), 3500);
    setShowAddModal(false);
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('chave123');
    setTick((t) => t + 1);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormPassword('');
    setShowAddModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (id === currentUser.id) {
      alert('Não é possível excluir o utilizador atualmente em sessão.');
      return;
    }
    if (confirm(`Deseja realmente remover o acesso de "${name}"?`)) {
      db.users.delete(id);
      setTick((t) => t + 1);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'GERENTE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CAIXA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'GERENTE':
        return 'Gerente';
      case 'CAIXA':
        return 'Operador de Caixa';
      case 'CONTABILISTA':
        return 'Contabilista';
      case 'AUDITOR':
        return 'Auditor AGT';
      default:
        return role;
    }
  };

  return (
    <div id="operator-users-view" className="space-y-4">
      {/* 1. Header & Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Utilizadores &amp; Operadores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerencie os operadores e permissões de acesso ao sistema comercial e fiscal.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setFormName('');
            setFormEmail('');
            setFormRole('CAIXA');
            setFormPassword('chave123');
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Utilizador</span>
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
            placeholder="Pesquisar por nome, email ou função..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          />
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold shadow-2xs">
          <span>{filtered.length} utilizadores</span>
        </div>
      </div>

      {/* 3. Tabela de Utilizadores */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Utilizador</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Cargo / Função</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full font-bold">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ativo
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {isCurrent ? 'Hoje, agora' : 'Hoje, 08:30'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSwitchUser && (
                          <button
                            onClick={() => onSwitchUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Alternar para este utilizador"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar utilizador"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar utilizador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar / Editar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                {editingUser ? 'Editar Utilizador' : 'Cadastrar Novo Operador'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beatriz Costa"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email de Acesso *
                </label>
                <input
                  type="email"
                  required
                  placeholder="beatriz@email.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cargo / Perfil de Permissões *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="CAIXA">Operador de Caixa (Emissão de Faturas)</option>
                  <option value="GERENTE">Gerente de Loja (Stock, Preços, Caixa)</option>
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Palavra-passe de Acesso {editingUser && '(deixe em branco para manter)'}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? '••••••••' : 'chave123'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  Salvar Utilizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
