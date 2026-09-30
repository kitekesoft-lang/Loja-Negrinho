import { FiscalDatabase } from '../repository/FiscalDatabase';
import { User, canAccessAdminLayout } from '../types/user';

export interface AuthResult {
  success: boolean;
  user?: User;
  mustChangePassword?: boolean;
  error?: string;
}

export class AuthService {
  public static readonly DEFAULT_PASSWORD = 'chave123';

  /**
   * Autentica um utilizador através de nome de utilizador ou e-mail
   */
  public static login(identifier: string, password: string): AuthResult {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      return {
        success: false,
        error: 'Por favor, introduza o utilizador/e-mail e a palavra-passe.',
      };
    }

    const db = FiscalDatabase.getInstance();
    const allUsers = Array.from(db.users.values());

    const user = allUsers.find(
      (u) =>
        u.status === 'ACTIVE' &&
        (u.username?.toLowerCase() === cleanId ||
          u.email?.toLowerCase() === cleanId ||
          u.id?.toLowerCase() === cleanId)
    );

    if (!user) {
      return {
        success: false,
        error: 'Utilizador ou e-mail não encontrado.',
      };
    }

    const expectedPassword = user.password || this.DEFAULT_PASSWORD;
    if (cleanPass !== expectedPassword) {
      return {
        success: false,
        error: 'Palavra-passe incorreta. Tente novamente.',
      };
    }

    const isFirstAccess = Boolean(user.mustChangePassword || user.password === this.DEFAULT_PASSWORD);

    return {
      success: true,
      user,
      mustChangePassword: isFirstAccess,
    };
  }

  /**
   * Altera a palavra-passe de um utilizador.
   * Regra estrita: a nova palavra-passe DEVE ser diferente da padrão ('chave123').
   */
  public static changePassword(
    userId: string,
    newPassword: string,
    confirmPassword: string
  ): AuthResult {
    const cleanNew = (newPassword || '').trim();
    const cleanConfirm = (confirmPassword || '').trim();

    if (!cleanNew) {
      return {
        success: false,
        error: 'A nova palavra-passe não pode estar vazia.',
      };
    }

    if (cleanNew.length < 6) {
      return {
        success: false,
        error: 'A nova palavra-passe deve conter pelo menos 6 caracteres.',
      };
    }

    if (cleanNew === this.DEFAULT_PASSWORD) {
      return {
        success: false,
        error: 'A nova palavra-passe deve ser diferente da palavra-passe padrão ("chave123").',
      };
    }

    if (cleanNew !== cleanConfirm) {
      return {
        success: false,
        error: 'A confirmação não coincide com a nova palavra-passe.',
      };
    }

    const db = FiscalDatabase.getInstance();
    const user = db.users.get(userId);

    if (!user) {
      return {
        success: false,
        error: 'Utilizador não encontrado no sistema.',
      };
    }

    user.password = cleanNew;
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();

    return {
      success: true,
      user,
      mustChangePassword: false,
    };
  }

  /**
   * Verifica se o utilizador tem permissão para aceder à consola técnica / layout de administração.
   * Apenas o Administrador A tem acesso a ambos os layouts.
   * O Administrador B tem acesso exclusivo ao layout de utilizadores.
   */
  public static canAccessAdminLayout(user: User | null | undefined): boolean {
    return canAccessAdminLayout(user);
  }
}
