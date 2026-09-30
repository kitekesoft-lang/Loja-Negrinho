import { AuditLog, AuditEntityType, AuditOperationType } from '../types/audit';
import { User } from '../types/user';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export class AuditService {
  private static logs: AuditLog[] = [];

  static logEvent(params: {
    companyId: string;
    user: Pick<User, 'id' | 'name' | 'role'>;
    entityType: AuditEntityType;
    entityId: string;
    operation: AuditOperationType;
    description: string;
    previousState?: any;
    newState?: any;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): AuditLog {
    const timestamp = new Date().toISOString();
    const id = 'AUD-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);

    const serializedContent = `${params.companyId}|${params.user.id}|${params.entityType}|${params.entityId}|${params.operation}|${timestamp}`;
    const integrityHash = simpleHash(serializedContent);

    const logEntry: AuditLog = {
      id,
      companyId: params.companyId,
      timestamp,
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      entityType: params.entityType,
      entityId: params.entityId,
      operation: params.operation,
      description: params.description,
      previousState: params.previousState ? JSON.parse(JSON.stringify(params.previousState)) : undefined,
      newState: params.newState ? JSON.parse(JSON.stringify(params.newState)) : undefined,
      metadata: params.metadata,
      ipAddress: params.ipAddress || '127.0.0.1',
      integrityHash,
    };

    this.logs.unshift(logEntry); // Most recent first
    return logEntry;
  }

  static getLogs(filters?: {
    companyId?: string;
    entityType?: AuditEntityType;
    entityId?: string;
    operation?: AuditOperationType;
    userId?: string;
    limit?: number;
  }): AuditLog[] {
    let result = this.logs;

    if (filters?.companyId) {
      result = result.filter((l) => l.companyId === filters.companyId);
    }
    if (filters?.entityType) {
      result = result.filter((l) => l.entityType === filters.entityType);
    }
    if (filters?.entityId) {
      result = result.filter((l) => l.entityId === filters.entityId);
    }
    if (filters?.operation) {
      result = result.filter((l) => l.operation === filters.operation);
    }
    if (filters?.userId) {
      result = result.filter((l) => l.userId === filters.userId);
    }

    if (filters?.limit && filters.limit > 0) {
      result = result.slice(0, filters.limit);
    }

    return [...result];
  }

  static clear(): void {
    this.logs = [];
  }
}
