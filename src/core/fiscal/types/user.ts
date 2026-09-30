export type UserRole =
  | 'ADMIN'
  | 'GERENTE'
  | 'CAIXA'
  | 'VENDEDOR'
  | 'CONTABILISTA'
  | 'AUDITOR';

export type FiscalPermission =
  | 'SERIES_CREATE'
  | 'SERIES_CLOSE'
  | 'INVOICE_CREATE_FT'
  | 'INVOICE_CREATE_FR'
  | 'RECEIPT_CREATE_RC'
  | 'CREDIT_NOTE_CREATE_NC'
  | 'DEBIT_NOTE_CREATE_ND'
  | 'DOCUMENT_CANCEL'
  | 'PAYMENT_REGISTER'
  | 'TAX_ENGINE_CONFIGURE'
  | 'AUDIT_LOG_VIEW'
  | 'COMPANY_MANAGE';

export type AdminSubtype = 'ADMIN_A' | 'ADMIN_B';

export interface User {
  id: string;
  companyId: string;
  establishmentId?: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  mustChangePassword?: boolean;
  role: UserRole;
  adminSubtype?: AdminSubtype;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
}

export function canAccessAdminLayout(user: User | null | undefined): boolean {
  if (!user) return false;
  // O Administrador A é o ÚNICO que tem acesso aos dois layouts
  return user.role === 'ADMIN' && user.adminSubtype === 'ADMIN_A';
}

export const ROLE_PERMISSIONS: Record<UserRole, FiscalPermission[]> = {
  ADMIN: [
    'SERIES_CREATE',
    'SERIES_CLOSE',
    'INVOICE_CREATE_FT',
    'INVOICE_CREATE_FR',
    'RECEIPT_CREATE_RC',
    'CREDIT_NOTE_CREATE_NC',
    'DEBIT_NOTE_CREATE_ND',
    'DOCUMENT_CANCEL',
    'PAYMENT_REGISTER',
    'TAX_ENGINE_CONFIGURE',
    'AUDIT_LOG_VIEW',
    'COMPANY_MANAGE',
  ],
  GERENTE: [
    'SERIES_CREATE',
    'SERIES_CLOSE',
    'INVOICE_CREATE_FT',
    'INVOICE_CREATE_FR',
    'RECEIPT_CREATE_RC',
    'CREDIT_NOTE_CREATE_NC',
    'DEBIT_NOTE_CREATE_ND',
    'PAYMENT_REGISTER',
    'AUDIT_LOG_VIEW',
  ],
  CONTABILISTA: [
    'INVOICE_CREATE_FT',
    'INVOICE_CREATE_FR',
    'RECEIPT_CREATE_RC',
    'CREDIT_NOTE_CREATE_NC',
    'DEBIT_NOTE_CREATE_ND',
    'PAYMENT_REGISTER',
    'AUDIT_LOG_VIEW',
  ],
  CAIXA: [
    'INVOICE_CREATE_FR',
    'RECEIPT_CREATE_RC',
    'PAYMENT_REGISTER',
  ],
  VENDEDOR: [
    'INVOICE_CREATE_FT',
    'INVOICE_CREATE_FR',
  ],
  AUDITOR: [
    'AUDIT_LOG_VIEW',
  ],
};
