import { LicenseInfo, LicensePlan, LicenseStatus, LICENSE_PLAN_PRESETS } from '../types/license';
import { User, canAccessAdminLayout } from '../types/user';

export class LicenseService {
  /**
   * Verifica se o utilizador possui privilégio exclusivo de Administrador A
   */
  public static canManageLicense(user: User | null | undefined): boolean {
    return canAccessAdminLayout(user);
  }

  /**
   * Calcula o número de dias restantes até a expiração
   */
  public static getDaysRemaining(expirationDate: string): number {
    try {
      const exp = new Date(expirationDate + 'T23:59:59');
      const now = new Date();
      const diffTime = exp.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  /**
   * Avalia dinamicamente o estado atual da licença
   */
  public static evaluateStatus(license: LicenseInfo): LicenseStatus {
    if (license.status === 'SUSPENDED') {
      return 'SUSPENDED';
    }

    const daysRemaining = this.getDaysRemaining(license.expirationDate);
    if (daysRemaining < 0) {
      return 'EXPIRED';
    }
    if (daysRemaining <= 15) {
      return 'EXPIRING_SOON';
    }
    return 'ACTIVE';
  }

  /**
   * Gera uma chave criptográfica simulada de licença com checksum
   * Formato: ML-{PLANO}-{ANO}-{4CHARS}-{4CHARS}-{4CHARS}
   */
  public static generateLicenseKey(plan: LicensePlan, companyTaxId: string): string {
    const year = new Date().getFullYear();
    const cleanTaxId = (companyTaxId || '5417082341').slice(0, 4);
    const randPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = `ML-${plan}-${year}`;
    return `${prefix}-${cleanTaxId}-${randPart1}-${randPart2}`;
  }

  /**
   * Gera uma soma de verificação simples para validação de integridade
   */
  public static generateChecksum(licenseKey: string, expDate: string, plan: string): string {
    const raw = `${licenseKey}:${expDate}:${plan}:KITEKESOFT_SECURE_SALT_2026`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }

  /**
   * Formata data para formato YYYY-MM-DD
   */
  public static formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Adiciona dias a uma data
   */
  public static addDays(dateStr: string, days: number): string {
    const base = new Date(dateStr + 'T00:00:00');
    base.setDate(base.getDate() + days);
    return this.formatDate(base);
  }

  /**
   * Cria uma nova licença inicial (padrão Anual activa)
   */
  public static createDefaultLicense(companyName: string = 'Minha Loja (Mini Mercado)', companyTaxId: string = '5417082341'): LicenseInfo {
    const today = new Date();
    const activationDate = this.formatDate(today);
    const planPreset = LICENSE_PLAN_PRESETS.ANUAL;
    const expirationDate = this.addDays(activationDate, planPreset.defaultDurationDays);
    const licenseKey = this.generateLicenseKey('ANUAL', companyTaxId);

    return {
      id: `LIC-${Date.now().toString(36).toUpperCase()}`,
      licenseKey,
      plan: 'ANUAL',
      status: 'ACTIVE',
      issuedToCompany: companyName,
      issuedToNif: companyTaxId,
      activationDate,
      expirationDate,
      durationDays: planPreset.defaultDurationDays,
      maxUsers: planPreset.maxUsers,
      maxEstablishments: planPreset.maxEstablishments,
      features: [...planPreset.features],
      signatureChecksum: this.generateChecksum(licenseKey, expirationDate, 'ANUAL'),
      assignedByUserId: 'USR-ADMIN',
      assignedByUserName: 'Administrador A (Sistema)',
      lastValidatedAt: new Date().toISOString(),
      notes: 'Licença inicial gerada com conformidade fiscal AGT e validade anual.',
      hardwareFingerprint: 'AGT-TERM-AO-2026-X81',
    };
  }

  /**
   * Altera o plano de licença (DEMO, SEMESTRAL ou ANUAL) com recálculo das datas
   */
  public static setLicensePlan(
    currentLicense: LicenseInfo,
    newPlan: LicensePlan,
    adminUser: User,
    customDays?: number
  ): LicenseInfo {
    if (!this.canManageLicense(adminUser)) {
      throw new Error('Acesso negado: Apenas o Administrador A tem permissão para alterar a licença.');
    }

    const preset = LICENSE_PLAN_PRESETS[newPlan];
    const duration = customDays && customDays > 0 ? customDays : preset.defaultDurationDays;
    const today = new Date();
    const activationDate = this.formatDate(today);
    const expirationDate = this.addDays(activationDate, duration);
    const licenseKey = this.generateLicenseKey(newPlan, currentLicense.issuedToNif);

    return {
      ...currentLicense,
      plan: newPlan,
      licenseKey,
      status: 'ACTIVE',
      activationDate,
      expirationDate,
      durationDays: duration,
      maxUsers: preset.maxUsers,
      maxEstablishments: preset.maxEstablishments,
      features: [...preset.features],
      signatureChecksum: this.generateChecksum(licenseKey, expirationDate, newPlan),
      assignedByUserId: adminUser.id,
      assignedByUserName: adminUser.name,
      lastValidatedAt: new Date().toISOString(),
      notes: `Plano alterado para ${preset.name} (${duration} dias) pelo Administrador A em ${activationDate}.`,
    };
  }

  /**
   * Adiciona dias de prorrogação à licença existente
   */
  public static extendLicense(
    currentLicense: LicenseInfo,
    additionalDays: number,
    adminUser: User
  ): LicenseInfo {
    if (!this.canManageLicense(adminUser)) {
      throw new Error('Acesso negado: Apenas o Administrador A tem permissão para prorrogar a licença.');
    }

    // Se já estiver expirada, a prorrogação começa a contar de hoje; caso contrário, a partir da data de término atual
    const daysLeft = this.getDaysRemaining(currentLicense.expirationDate);
    const baseDate = daysLeft < 0 ? this.formatDate(new Date()) : currentLicense.expirationDate;
    const newExpiration = this.addDays(baseDate, additionalDays);

    return {
      ...currentLicense,
      status: 'ACTIVE',
      expirationDate: newExpiration,
      durationDays: currentLicense.durationDays + additionalDays,
      signatureChecksum: this.generateChecksum(currentLicense.licenseKey, newExpiration, currentLicense.plan),
      assignedByUserId: adminUser.id,
      assignedByUserName: adminUser.name,
      lastValidatedAt: new Date().toISOString(),
      notes: `Prorrogação de +${additionalDays} dias aplicada pelo Administrador A. Válida até ${newExpiration}.`,
    };
  }

  /**
   * Altera o estado administrativo da licença (Activa / Suspensa / Expirada)
   */
  public static setLicenseStatus(
    currentLicense: LicenseInfo,
    newStatus: LicenseStatus,
    adminUser: User,
    reason?: string
  ): LicenseInfo {
    if (!this.canManageLicense(adminUser)) {
      throw new Error('Acesso negado: Apenas o Administrador A tem permissão para alterar o estado da licença.');
    }

    return {
      ...currentLicense,
      status: newStatus,
      lastValidatedAt: new Date().toISOString(),
      notes: reason || `Estado alterado para ${newStatus} por ${adminUser.name}.`,
    };
  }
}
