import React, { useState } from 'react';
import { AuthService } from '../../core/fiscal/security/AuthService';
import { User } from '../../core/fiscal/types/user';
import { KitekeLogo } from '../common/KitekeLogo';
import { Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, PauseCircle, Clock } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: User, mustChangePassword: boolean) => void;
  onDirectAccess?: () => void;
  isSuspended?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onDirectAccess,
  isSuspended = false,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    // Pequeno delay para feedback visual natural
    setTimeout(() => {
      const result = AuthService.login(identifier, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user, Boolean(result.mustChangePassword));
      } else {
        setErrorMessage(result.error || 'Credenciais inválidas. Tente novamente.');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Decorativo Sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black opacity-80 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabeçalho Minimalista com Nome do Sistema (Kiteke Pro) em Fundo Vazio */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KitekeLogo variant="wordmark" size="sm" darkTheme={true} />
          <div className="border-l border-stone-800 pl-3 hidden sm:block">
            <span className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
              ERP &amp; Certificação Fiscal AGT
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuspended ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-semibold text-amber-300">
              <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Acessos Suspensos</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-[11px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Portaria n.º 292/18</span>
            </div>
          )}
        </div>
      </header>

      {/* Cartão de Autenticação */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Espaço Reservado para a Logo / Imagem Oficial do Sistema */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center justify-center mx-auto shadow-inner p-2.5">
              <KitekeLogo variant="symbol" size="md" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
              {isSuspended ? 'Autenticação Kiteke Pro' : 'Iniciar Sessão'}
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              {isSuspended
                ? 'Exigência de login temporariamente suspensa para preparação do sistema'
                : 'Introduza as suas credenciais para aceder ao sistema'}
            </p>
          </div>

          {/* Painel Informativo de Modo Preparatório / Login Suspenso */}
          {isSuspended && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-blue-300 uppercase tracking-wider text-[11px]">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Modo Preparatório (Acesso Direto Liberado)</span>
              </div>
              <p className="text-blue-100/90 text-xs leading-relaxed">
                Pode aceder livremente sem introduzir credenciais até autorizar a disponibilização a pessoas de fora. Todos os utilizadores e palavras-passe continuam guardados.
              </p>
              {onDirectAccess && (
                <button
                  type="button"
                  onClick={onDirectAccess}
                  className="w-full mt-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Entrar Agora Sem Credenciais</span>
                </button>
              )}
            </div>
          )}

          {/* Mensagem de Erro / Informação */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulário de Login (Sempre operacional e pronto para quando login for exigido) */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo: Utilizador / E-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-identifier"
                className="block text-xs font-semibold text-stone-300"
              >
                Utilizador ou E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nome de utilizador ou e-mail"
                  className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Campo: Palavra-passe */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-stone-300"
                >
                  Palavra-passe
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Palavra-passe de acesso"
                  className="w-full pl-10 pr-11 py-3 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão de Submissão */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-stone-950 font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-stone-950 border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Entrar com Credenciais</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Aviso Legal de Segurança & Auditoria */}
          <div className="mt-8 pt-6 border-t border-stone-800/80 text-center">
            <p className="text-[11px] text-stone-500 leading-relaxed">
              {isSuspended ? (
                <>
                  Modo preparatório: credenciais oficiais (Admin A, Admin B, Gerente, Contabilista, Caixa) guardadas.
                  <br />
                  As operações fiscais continuam assinadas digitalmente via RSA-2048.
                </>
              ) : (
                <>
                  Acesso reservado a operadores registados e credenciados.
                  <br />
                  As operações fiscais são assinadas digitalmente via RSA-2048.
                </>
              )}
            </p>
          </div>
        </div>
      </main>

      {/* Rodapé Institucional */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-stone-500">
        <p>KitekeSoft Enterprise Suite • República de Angola</p>
      </footer>
    </div>
  );
};
