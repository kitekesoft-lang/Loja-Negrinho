import { UserRole } from './user';

export type AuditOperationType =
  | 'CREATE'
  | 'UPDATE'
  | 'ISSUE'
  | 'RECTIFY'
  | 'CANCEL_ATTEMPT'
  | 'PAY'
  | 'SERIES_OPEN'
  | 'SERIES_CLOSE'
  | 'TAX_CONFIG'
  | 'SECURITY_VIOLATION'
  | 'PERMISSION_DENIED'
  | 'TRANSMIT_AGT'
  | 'AGT_RETRY';

export type AuditEntityType =
  | 'DOCUMENT'
  | 'SERIES'
  | 'COMPANY'
  | 'ESTABLISHMENT'
  | 'CUSTOMER'
  | 'PRODUCT'
  | 'TAX_CONFIGURATION'
  | 'PAYMENT'
  | 'USER'
  | 'AGT_QUEUE';

export interface AuditLog {
  id: string;
  companyId: string;
  timestamp: string; // UTC ISO 8601
  userId: string;
  userName: string;
  userRole: UserRole;
  entityType: AuditEntityType;
  entityId: string;
  operation: AuditOperationType;
  description: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  metadata?: Record<string, any>;
  integrityHash: string; // tamper evidence check
}
