import { User, UserRole, FiscalPermission, ROLE_PERMISSIONS } from '../types/user';

export interface AuthorizationResult {
  isAuthorized: boolean;
  reason?: string;
}

export class RbacService {
  /**
   * Verifica se o utilizador possui a permissão requerida para a acção fiscal
   */
  static hasPermission(user: User, permission: FiscalPermission): boolean {
    if (user.status !== 'ACTIVE') {
      return false;
    }
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  }

  /**
   * Valida permissão e lança erro fiscal auditável se não autorizado
   */
  static checkPermission(user: User, permission: FiscalPermission): AuthorizationResult {
    if (user.status !== 'ACTIVE') {
      return {
        isAuthorized: false,
        reason: `Utilizador '${user.name}' (${user.email}) encontra-se INACTIVO. Operação fiscal bloqueada.`,
      };
    }

    const authorized = this.hasPermission(user, permission);
    if (!authorized) {
      return {
        isAuthorized: false,
        reason: `Perfil '${user.role}' não tem autorização para executar a operação fiscal '${permission}'. Operação restrita.`,
      };
    }

    return { isAuthorized: true };
  }
}
