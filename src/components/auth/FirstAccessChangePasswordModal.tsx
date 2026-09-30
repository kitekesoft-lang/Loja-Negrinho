import React, { useState } from 'react';
import { AuthService } from '../../core/fiscal/security/AuthService';
import { User } from '../../core/fiscal/types/user';
import { KitekeLogo } from '../common/KitekeLogo';
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldAlert, LogOut } from 'lucide-react';

interface FirstAccessChangePasswordModalProps {
  user: User;
  onPasswordChanged: (updatedUser: User) => void;
  onLogout: () => void;
}

export const FirstAccessChangePasswordModal: React.FC<FirstAccessChangePasswordModalProps> = ({
  user,
  onPasswordChanged,
  onLogout,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações imediatas
    if (!newPassword.trim()) {
      setErrorMessage('Por favor, introduza a nova palavra-passe.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setErrorMessage('A nova palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword.trim() === AuthService.DEFAULT_PASSWORD) {
      setErrorMessage('A nova palavra-passe deve ser diferente da palavra-passe padrão ("chave123").');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A confirmação não coincide com a nova palavra-passe.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = AuthService.changePassword(user.id, newPassword, confirmPassword);
      setIsLoading(false);

      if (result.success && result.user) {
        onPasswordChanged(result.user);
      } else {
        setErrorMessage(result.error || 'Erro ao alterar a palavra-passe.');
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-stone-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Nome Oficial Kiteke Pro & Alerta de Primeiro Acesso */}
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-1">
            <KitekeLogo variant="wordmark" size="sm" darkTheme={true} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Primeiro Acesso ao Sistema
          </h2>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Por razões de segurança e conformidade com os requisitos da AGT, é obrigatório alterar a
            sua palavra-passe antes de aceder aos módulos.
          </p>
        </div>

        {/* Ficha Resumo do Utilizador */}
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 mb-6 text-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Utilizador Autenticado
            </div>
            <div className="font-bold text-white text-sm mt-0.5">{user.name}</div>
            <div className="text-stone-400 font-mono text-[11px]">{user.email}</div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 font-semibold border border-stone-700 text-[11px]">
            {user.role}
          </span>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário de Alteração de Palavra-passe */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nova Palavra-passe */}
          <div className="space-y-1.5">
            <label
              htmlFor="first-access-new-password"
              className="block text-xs font-semibold text-stone-300"
            >
              Nova Palavra-passe Pessoal
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="first-access-new-password"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres (diferente de chave123)"
                className="w-full pl-10 pr-11 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 cursor-pointer"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nova Palavra-passe */}
          <div className="space-y-1.5">
            <label
              htmlFor="first-access-confirm-password"
              className="block text-xs font-semibold text-stone-300"
            >
              Confirmar Nova Palavra-passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="first-access-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova palavra-passe"
                className="w-full pl-10 pr-11 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 cursor-pointer"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Requisitos Visuais */}
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 text-[11px] text-stone-400 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-400' : 'bg-stone-600'}`} />
              <span>Pelo menos 6 caracteres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${newPassword && newPassword !== AuthService.DEFAULT_PASSWORD ? 'bg-emerald-400' : 'bg-stone-600'}`} />
              <span>Diferente da palavra-passe padrão ("chave123")</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${newPassword && newPassword === confirmPassword ? 'bg-emerald-400' : 'bg-stone-600'}`} />
              <span>Confirmação idêntica</span>
            </div>
          </div>

          {/* Ações */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-stone-950 border-t-transparent animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar e Aceder aos Módulos</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cancelar e Terminar Sessão</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
