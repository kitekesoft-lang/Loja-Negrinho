import { Company, Establishment } from '../types/company';
import { User } from '../types/user';
import { Customer, Supplier } from '../types/customer';
import { Product, ProductCategory } from '../types/product';
import { TaxConfiguration } from '../types/tax';
import { DocumentSeries } from '../types/series';
import { FiscalDocument } from '../types/document';
import { Payment } from '../types/payment';
import { AuditLog } from '../types/audit';
import { AuditService } from '../security/AuditService';
import { AGTTransmissionQueue } from '../engines/AGTTransmissionQueue';
import {
  Warehouse,
  StockItem,
  StockMovement,
  PurchaseOrder,
  CommercialDocument,
  CashSession,
  CashMovement,
  BankAccount,
  AccountingJournalEntry,
} from '../types/erp';
import { PGC_ANGOLANO_CHART } from '../engines/AccountingEngine';
import { LocalPersistenceEngine } from '../storage/LocalPersistenceEngine';
import { LicenseInfo } from '../types/license';
import { LicenseService } from '../security/LicenseService';
import { RestaurantTable } from '../types/restaurant';
import { ServiceOrder } from '../types/serviceOrder';
import { Employee, PayrollRecord, calculateAngolanPayroll } from '../types/payroll';

export class FiscalDatabase {
  private static instance: FiscalDatabase;

  public companies: Map<string, Company> = new Map();
  public establishments: Map<string, Establishment> = new Map();
  public users: Map<string, User> = new Map();
  public customers: Map<string, Customer> = new Map();
  public suppliers: Map<string, Supplier> = new Map();
  public categories: Map<string, ProductCategory> = new Map();
  public taxConfigurations: Map<string, TaxConfiguration> = new Map();
  public products: Map<string, Product> = new Map();
  public series: Map<string, DocumentSeries> = new Map();
  public documents: Map<string, FiscalDocument> = new Map();
  public payments: Map<string, Payment> = new Map();
  public agtQueue: AGTTransmissionQueue;
  public license!: LicenseInfo;

  // Colecções da Fase 4 (ERP Completo)
  public warehouses: Map<string, Warehouse> = new Map();
  public stockItems: Map<string, StockItem> = new Map();
  public stockMovements: Map<string, StockMovement> = new Map();
  public purchaseOrders: Map<string, PurchaseOrder> = new Map();
  public commercialDocuments: Map<string, CommercialDocument> = new Map();
  public cashSessions: Map<string, CashSession> = new Map();
  public cashMovements: Map<string, CashMovement> = new Map();
  public bankAccounts: Map<string, BankAccount> = new Map();
  public journalEntries: Map<string, AccountingJournalEntry> = new Map();

  // Módulos Especializados (Restauração, Ordens de Serviço, RH)
  public tables: Map<string, RestaurantTable> = new Map();
  public serviceOrders: Map<string, ServiceOrder> = new Map();
  public employees: Map<string, Employee> = new Map();
  public payrollRecords: Map<string, PayrollRecord> = new Map();

  // Listeners para actualizações reactivas na interface React
  private listeners: Array<() => void> = [];

  private constructor() {
    this.agtQueue = new AGTTransmissionQueue();
    this.agtQueue.subscribe(() => this.notify());
    this.seedInitialData();
    LocalPersistenceEngine.hydrateFromLocalStorage(this);
    this.license = LocalPersistenceEngine.getLicense() || LicenseService.createDefaultLicense();
  }

  public getLicense(): LicenseInfo {
    return this.license;
  }

  public updateLicense(newLicense: LicenseInfo): void {
    this.license = newLicense;
    LocalPersistenceEngine.saveLicense(newLicense);
    this.notify();
  }

  static getInstance(): FiscalDatabase {
    if (!FiscalDatabase.instance) {
      FiscalDatabase.instance = new FiscalDatabase();
    }
    return FiscalDatabase.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public notify(): void {
    LocalPersistenceEngine.persistToLocalStorage(this);
    this.listeners.forEach((l) => l());
  }

  private seedInitialData(): void {
    const now = new Date().toISOString();

    // 1. Empresa Principal (Minha Loja)
    const companyId = 'COMP-001';
    const mainCompany: Company = {
      id: companyId,
      taxId: '5417082341',
      name: 'Minha Loja',
      tradeName: 'Minha Loja',
      address: 'Rua da Liberdade, Nº 123 - Luanda',
      city: 'Luanda',
      province: 'Luanda',
      country: 'AO',
      currency: 'AOA',
      taxRegime: 'GERAL',
      conservatoryRegistration: '1432-19/Luanda',
      capitalSocial: '5.000.000,00 Kz',
      phone: '923 456 789',
      email: 'minhaloja@email.com',
      status: 'ACTIVE',
      createdAt: now,
    };
    this.companies.set(companyId, mainCompany);

    // 2. Estabelecimentos
    const est1: Establishment = {
      id: 'EST-001',
      companyId,
      code: 'LOJA01',
      name: 'Minha Loja - Sede Central',
      address: 'Rua da Liberdade, Nº 123 - Luanda',
      city: 'Luanda',
      province: 'Luanda',
      country: 'AO',
      phone: '923 456 789',
      email: 'minhaloja@email.com',
      status: 'ACTIVE',
      createdAt: now,
    };
    const est2: Establishment = {
      id: 'EST-002',
      companyId,
      code: 'LOJA02',
      name: 'Minha Loja - Filial',
      address: 'Avenida 4 de Fevereiro, Luanda',
      city: 'Luanda',
      province: 'Luanda',
      country: 'AO',
      phone: '924 567 890',
      email: 'filial@email.com',
      status: 'ACTIVE',
      createdAt: now,
    };
    this.establishments.set(est1.id, est1);
    this.establishments.set(est2.id, est2);

    // 3. Utilizadores com papéis fiscais (Exactos da imagem)
    const usersList: User[] = [
      {
        id: 'USR-ADMIN',
        companyId,
        establishmentId: est1.id,
        name: 'Ana Silva',
        username: 'ana.silva',
        email: 'ana@email.com',
        role: 'ADMIN',
        adminSubtype: 'ADMIN_A',
        password: 'chave123',
        mustChangePassword: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'USR-GERENTE',
        companyId,
        establishmentId: est1.id,
        name: 'Carlos Mendes',
        username: 'carlos.mendes',
        email: 'carlos@email.com',
        role: 'GERENTE',
        password: 'chave123',
        mustChangePassword: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'USR-CAIXA-1',
        companyId,
        establishmentId: est1.id,
        name: 'Beatriz Costa',
        username: 'beatriz.costa',
        email: 'beatriz@email.com',
        role: 'CAIXA',
        password: 'chave123',
        mustChangePassword: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'USR-CAIXA-2',
        companyId,
        establishmentId: est1.id,
        name: 'João Pereira',
        username: 'joao.pereira',
        email: 'joao@email.com',
        role: 'CAIXA',
        password: 'chave123',
        mustChangePassword: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'USR-ADMIN-B',
        companyId,
        establishmentId: est1.id,
        name: 'Administrador B',
        username: 'admin_b',
        email: 'admin.b@email.com',
        role: 'ADMIN',
        adminSubtype: 'ADMIN_B',
        password: 'chave123',
        mustChangePassword: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'USR-CONTABILISTA',
        companyId,
        establishmentId: est1.id,
        name: 'Dra. Maria Fernandes',
        username: 'contabilista',
        email: 'maria.fernandes@email.com',
        role: 'CONTABILISTA',
        password: 'chave123',
        mustChangePassword: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'USR-AUDITOR',
        companyId,
        establishmentId: est1.id,
        name: 'Inspector AGT',
        username: 'auditor',
        email: 'auditor.agt@minfin.gov.ao',
        role: 'AUDITOR',
        password: 'chave123',
        mustChangePassword: false,
        status: 'ACTIVE',
        createdAt: now,
      },
    ];
    usersList.forEach((u) => this.users.set(u.id, u));
    const defaultCaixa = this.users.get('USR-CAIXA-1') || this.users.get('USR-OPERADOR') || usersList[2];
    if (defaultCaixa) {
      this.users.set('USR-CAIXA', { ...defaultCaixa, id: 'USR-CAIXA' });
    }

    // 4. Clientes (Exactos da imagem)
    const customersList: Customer[] = [
      {
        id: 'CLI-FINAL',
        companyId,
        taxId: '999999999',
        name: 'Consumidor Final',
        customerType: 'CONSUMIDOR_FINAL',
        country: 'AO',
        billingAddress: 'Vendas a Balcão / Diversos',
        city: 'Luanda',
        province: 'Luanda',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'CLI-MARIA',
        companyId,
        taxId: '005423112LA01',
        name: 'Maria Santos',
        customerType: 'PARTICULAR',
        country: 'AO',
        billingAddress: 'Luanda',
        city: 'Luanda',
        province: 'Luanda',
        email: 'maria@email.com',
        phone: '923 456 789',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'CLI-JOAO',
        companyId,
        taxId: '006734221LA02',
        name: 'João Ferreira',
        customerType: 'PARTICULAR',
        country: 'AO',
        billingAddress: 'Viana',
        city: 'Viana',
        province: 'Luanda',
        email: 'joao@email.com',
        phone: '924 567 890',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'CLI-ANA',
        companyId,
        taxId: '007845332LA03',
        name: 'Ana Costa',
        customerType: 'PARTICULAR',
        country: 'AO',
        billingAddress: 'Cacuaco',
        city: 'Cacuaco',
        province: 'Luanda',
        email: 'ana@email.com',
        phone: '919 670 901',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'CLI-PEDRO',
        companyId,
        taxId: '008956443LA04',
        name: 'Pedro Silva',
        customerType: 'PARTICULAR',
        country: 'AO',
        billingAddress: 'Talatona',
        city: 'Talatona',
        province: 'Luanda',
        email: 'pedro@email.com',
        phone: '927 808 123',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'CLI-CARLA',
        companyId,
        taxId: '009067554LA05',
        name: 'Carla Mendes',
        customerType: 'PARTICULAR',
        country: 'AO',
        billingAddress: 'Kilamba',
        city: 'Kilamba',
        province: 'Luanda',
        email: 'carla@email.com',
        phone: '927 800 123',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'CLI-SONANGOL',
        companyId,
        taxId: '5401142231',
        name: 'Sonangol E.P. - Sociedade Nacional de Combustíveis',
        customerType: 'EMPRESA_NACIONAL',
        country: 'AO',
        billingAddress: 'Rua Rainha Ginga, Luanda',
        city: 'Luanda',
        province: 'Luanda',
        email: 'facturacao@sonangol.co.ao',
        phone: '923 000 111',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'CLI-BMA',
        companyId,
        taxId: '5403129845',
        name: 'Banco Millennium Atlântico S.A.',
        customerType: 'EMPRESA_NACIONAL',
        country: 'AO',
        billingAddress: 'Talatona, Luanda',
        city: 'Luanda',
        province: 'Luanda',
        email: 'contabilidade@atlantico.ao',
        phone: '923 111 222',
        status: 'ACTIVE',
        createdAt: now,
      },
    ];
    customersList.forEach((c) => this.customers.set(c.id, c));
    const defaultCustomer = this.customers.get('CLI-FINAL') || customersList[0];
    if (defaultCustomer) {
      this.customers.set('CLI-001', { ...defaultCustomer, id: 'CLI-001' });
    }

    // 5. Fornecedores (Exactos da imagem)
    const suppliersList: Supplier[] = [
      {
        id: 'SUP-LIMA',
        companyId,
        taxId: '5401112233',
        name: 'Distribuidora Lima',
        country: 'AO',
        address: 'Zona Industrial de Viana, Luanda',
        city: 'Luanda',
        email: 'limadis@email.com',
        phone: '923 111 222',
        contactPerson: 'Sr. Lima',
        productsSupplied: 'Alimentos, Bebidas',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'SUP-POVO',
        companyId,
        taxId: '5402223344',
        name: 'Comércio do Povo',
        country: 'AO',
        address: 'Mercado dos Congolenses, Luanda',
        city: 'Luanda',
        email: 'povo@comercio.com',
        phone: '924 333 444',
        contactPerson: 'Manuel Povo',
        productsSupplied: 'Limpeza, Higiene',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'SUP-AGRO',
        companyId,
        taxId: '5403334455',
        name: 'AgroAlimentos',
        country: 'AO',
        address: 'Polo Agroindustrial de Catete',
        city: 'Luanda',
        email: 'agro@alimentos.com',
        phone: '925 555 666',
        contactPerson: 'Eng. Carvalho',
        productsSupplied: 'Arroz, Feijão, Óleo',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'SUP-FARMA',
        companyId,
        taxId: '5404445566',
        name: 'FarmaVida',
        country: 'AO',
        address: 'Avenida Pedro de Castro Van-Dúnem Loy, Luanda',
        city: 'Luanda',
        email: 'farmav@vida.com',
        phone: '926 777 888',
        contactPerson: 'Dra. Vida',
        productsSupplied: 'Produtos de Higiene',
        status: 'ACTIVE',
        createdAt: now,
      },
    ];
    suppliersList.forEach((s) => this.suppliers.set(s.id, s));

    // 6. Configurações de Imposto (IVA e Retenções)
    const taxes: TaxConfiguration[] = [
      {
        id: 'TAX-IVA14',
        code: 'IVA_14',
        name: 'IVA Taxa Normal (14%)',
        taxType: 'IVA',
        taxCode: 'NOR',
        ratePercentage: 14.0,
        legalBasis: 'Artigo 12.º do Código do IVA de Angola',
        isActive: true,
      },
      {
        id: 'TAX-IVA07',
        code: 'IVA_07',
        name: 'IVA Taxa Reduzida (7%) - Cesta Básica & Insumos',
        taxType: 'IVA',
        taxCode: 'RED',
        ratePercentage: 7.0,
        legalBasis: 'Regime Reduzido para bens de primeira necessidade (Lei do IVA)',
        isActive: true,
      },
      {
        id: 'TAX-IVA05',
        code: 'IVA_05',
        name: 'IVA Especial Cabinda (5%)',
        taxType: 'IVA',
        taxCode: 'RED',
        ratePercentage: 5.0,
        legalBasis: 'Regime Especial Aduaneiro e Fiscal de Cabinda',
        isActive: true,
      },
      {
        id: 'TAX-IVAM00',
        code: 'IVA_00_M00',
        name: 'IVA Isento (0%) - Regime Transitório/Exclusão',
        taxType: 'IVA',
        taxCode: 'ISE',
        ratePercentage: 0.0,
        exemptionCode: 'M00',
        exemptionReason: 'Regime Transitório do IVA',
        legalBasis: 'Artigo 9.º da Lei n.º 7/19 - Regime Transitório',
        isActive: true,
      },
      {
        id: 'TAX-IVAM02',
        code: 'IVA_00_M02',
        name: 'IVA Isento (0%) - Transmissão de Bens/Serviços Isentos',
        taxType: 'IVA',
        taxCode: 'ISE',
        ratePercentage: 0.0,
        exemptionCode: 'M02',
        exemptionReason: 'Transmissão de bens e serviços isentos',
        legalBasis: 'Artigo 12.º do Código do IVA',
        isActive: true,
      },
      {
        id: 'TAX-IVAM04',
        code: 'IVA_00_M04',
        name: 'IVA Isento (0%) - Exportações & Operações Assimiladas',
        taxType: 'IVA',
        taxCode: 'ISE',
        ratePercentage: 0.0,
        exemptionCode: 'M04',
        exemptionReason: 'Isenção nas exportações',
        legalBasis: 'Artigo 15.º do Código do IVA',
        isActive: true,
      },
    ];
    taxes.forEach((t) => this.taxConfigurations.set(t.id, t));

    // 6.1 Categorias do Mini Mercado
    const miniMarketCategories: ProductCategory[] = [
      { id: 'CAT-BASICA', companyId, code: 'BASICA', name: 'Mercearia & Cesta Básica' },
      { id: 'CAT-BEBIDAS', companyId, code: 'BEBIDAS', name: 'Bebidas & Águas' },
      { id: 'CAT-LACTICINIOS', companyId, code: 'LACTICINIOS', name: 'Lacticínios & Frios' },
      { id: 'CAT-HIGIENE', companyId, code: 'HIGIENE', name: 'Higiene & Limpeza' },
      { id: 'CAT-PADARIA', companyId, code: 'PADARIA', name: 'Padaria & Confeitaria' },
      { id: 'CAT-FRESCOS', companyId, code: 'FRESCOS', name: 'Frutas & Hortícolas (Balança)' },
      { id: 'CAT-SNACKS', companyId, code: 'SNACKS', name: 'Enlatados & Merenda' },
    ];
    miniMarketCategories.forEach((cat) => this.categories.set(cat.id, cat));

    // 7. Produtos e Serviços (Catálogo Especializado da Minha Loja)
    const prods: Product[] = [
      // Exact products from reference mockup
      {
        id: 'P001',
        companyId,
        code: 'P001',
        barcode: '5601001000001',
        description: 'Arroz',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 5000.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'P002',
        companyId,
        code: 'P002',
        barcode: '5601001000002',
        description: 'Açúcar',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 5000.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'P003',
        companyId,
        code: 'P003',
        barcode: '5601001000003',
        description: 'Óleo',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 8500.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'P004',
        companyId,
        code: 'P004',
        barcode: '5601001000004',
        description: 'Leite',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-LACTICINIOS',
        standardPrice: 2500.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'P005',
        companyId,
        code: 'P005',
        barcode: '5601001000005',
        description: 'Refrigerante',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BEBIDAS',
        standardPrice: 3000.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'P006',
        companyId,
        code: 'P006',
        barcode: '5601001000006',
        description: 'Pão',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-PADARIA',
        standardPrice: 2500.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'P007',
        companyId,
        code: 'P007',
        barcode: '5601001000007',
        description: 'Farinha',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 4000.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'P008',
        companyId,
        code: 'P008',
        barcode: '5601001000008',
        description: 'Detergente',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-HIGIENE',
        standardPrice: 2000.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      // Artigos de Mercearia & Cesta Básica (IVA 7% - Regime Reduzido da Cesta Básica)
      {
        id: 'PRD-ARROZ-1KG',
        companyId,
        code: 'ALIM-ARR-01',
        barcode: '5601001234567',
        description: 'Arroz Agulha Real 1kg',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 650.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-ARROZ-5KG',
        companyId,
        code: 'ALIM-ARR-05',
        barcode: '5601001234574',
        description: 'Arroz Branco Tio Lucas 5kg',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 3200.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-OLEO-1L',
        companyId,
        code: 'ALIM-OLE-01',
        barcode: '5601002345678',
        description: 'Óleo Alimentar de Soja Lisa 1L',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 1450.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-FUBA-1KG',
        companyId,
        code: 'ALIM-FUB-01',
        barcode: '5601003456789',
        description: 'Fuba de Milho Amarela Nacional 1kg',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 500.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-FEIJAO-1KG',
        companyId,
        code: 'ALIM-FEI-01',
        barcode: '5601004567890',
        description: 'Feijão Manteiga Nacional 1kg',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 1100.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-ACUCAR-1KG',
        companyId,
        code: 'ALIM-ACU-01',
        barcode: '5601005678901',
        description: 'Açúcar Branco Castelo 1kg',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 950.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-ESPARGUETE',
        companyId,
        code: 'ALIM-ESP-01',
        barcode: '5601006789012',
        description: 'Esparguete Nacional 500g',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 400.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-SAL-1KG',
        companyId,
        code: 'ALIM-SAL-01',
        barcode: '5601007890123',
        description: 'Sal Fino Iodado Marfim 1kg',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 250.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },

      // Lacticínios & Frios
      {
        id: 'PRD-LEITE-UHT',
        companyId,
        code: 'LAC-LEI-01',
        barcode: '5602001234567',
        description: 'Leite UHT Meio Gordo Mimosa 1L',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-LACTICINIOS',
        standardPrice: 980.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-LEITE-NIDO',
        companyId,
        code: 'LAC-LEI-PO',
        barcode: '5602002345678',
        description: 'Leite em Pó Nido 400g Lata',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-LACTICINIOS',
        standardPrice: 2850.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-FRANGO-1KG',
        companyId,
        code: 'CAR-FRA-01',
        barcode: '5602003456789',
        description: 'Frango Inteiro Congelado 1.2kg',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-LACTICINIOS',
        standardPrice: 2200.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },

      // Bebidas & Águas (IVA 14%)
      {
        id: 'PRD-AGUA-05L',
        companyId,
        code: 'BEB-AGU-05',
        barcode: '5603001234567',
        description: 'Água Mineral Pura 0.5L',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BEBIDAS',
        standardPrice: 200.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-AGUA-15L',
        companyId,
        code: 'BEB-AGU-15',
        barcode: '5603002345678',
        description: 'Água Mineral Pura 1.5L',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BEBIDAS',
        standardPrice: 350.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-CUCA-LATA',
        companyId,
        code: 'BEB-CER-CUC',
        barcode: '5603003456789',
        description: 'Cerveja Cuca Lata 33cl',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BEBIDAS',
        standardPrice: 350.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-NOCAL-GF',
        companyId,
        code: 'BEB-CER-NOC',
        barcode: '5603004567890',
        description: 'Cerveja Nocal Garrafa 33cl',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BEBIDAS',
        standardPrice: 300.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-REFRIG-15L',
        companyId,
        code: 'BEB-REF-15',
        barcode: '5603005678901',
        description: 'Refrigerante Blue Polpa 1.5L',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BEBIDAS',
        standardPrice: 650.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-SUMO-NUTRY',
        companyId,
        code: 'BEB-SUM-NUT',
        barcode: '5603006789012',
        description: 'Sumo Nutry Laranja 1L',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BEBIDAS',
        standardPrice: 1100.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },

      // Higiene & Limpeza (IVA 14%)
      {
        id: 'PRD-SABAO-AZUL',
        companyId,
        code: 'HIG-SAB-01',
        barcode: '5604001234567',
        description: 'Sabão em Barra Azul Sol 200g',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-HIGIENE',
        standardPrice: 300.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-DETERG-OMO',
        companyId,
        code: 'HIG-DET-OMO',
        barcode: '5604002345678',
        description: 'Detergente em Pó Omo 500g',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-HIGIENE',
        standardPrice: 1200.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-PAPEL-HIG',
        companyId,
        code: 'HIG-PAP-04',
        barcode: '5604003456789',
        description: 'Papel Higiénico Suave (Pack 4 Rolos)',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-HIGIENE',
        standardPrice: 850.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-DENTIFRICO',
        companyId,
        code: 'HIG-COL-75',
        barcode: '5604004567890',
        description: 'Pasta de Dentes Colgate Máxima Protecção 75ml',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-HIGIENE',
        standardPrice: 650.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },

      // Padaria & Snacks
      {
        id: 'PRD-PAO-FORMA',
        companyId,
        code: 'PAD-FOR-01',
        barcode: '5605001234567',
        description: 'Pão de Forma Tradicional Fatiado 500g',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-PADARIA',
        standardPrice: 600.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-PAO-CARCACA',
        companyId,
        code: 'PAD-CAR-01',
        barcode: '5605002345678',
        description: 'Pão Carcaça Fresco da Padaria',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-PADARIA',
        standardPrice: 50.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-BOLACHA-MARIA',
        companyId,
        code: 'SNA-BOL-MAR',
        barcode: '5605003456789',
        description: 'Bolacha Maria Cuétara Pacote 200g',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-PADARIA',
        standardPrice: 350.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-CAFE-DELTA',
        companyId,
        code: 'PAD-CAF-DEL',
        barcode: '5605004567890',
        description: 'Café Torrado Moído Delta Lote Chávena 250g',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-PADARIA',
        standardPrice: 1500.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },

      // Enlatados & Merenda
      {
        id: 'PRD-SARDINHA',
        companyId,
        code: 'SNA-SAR-PES',
        barcode: '5606001234567',
        description: 'Sardinha em Óleo Vegetal Pescador 125g',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-SNACKS',
        standardPrice: 550.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-ATUM-BOM',
        companyId,
        code: 'SNA-ATU-BOM',
        barcode: '5606002345678',
        description: 'Atum em Posta Bom Petisco 120g',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-SNACKS',
        standardPrice: 750.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },

      // Frescos & Balança (Venda ao Peso - KG)
      {
        id: 'PRD-TOMATE-KG',
        companyId,
        code: 'FRE-TOM-KG',
        barcode: '2001000000000',
        description: 'Tomate Chato Fresco Nacional (ao Quilo)',
        type: 'PRODUCT',
        unit: 'KG',
        categoryId: 'CAT-FRESCOS',
        standardPrice: 900.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-CEBOLA-KG',
        companyId,
        code: 'FRE-CEB-KG',
        barcode: '2002000000000',
        description: 'Cebola Seca Nacional de Benguela (ao Quilo)',
        type: 'PRODUCT',
        unit: 'KG',
        categoryId: 'CAT-FRESCOS',
        standardPrice: 850.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-BATATA-KG',
        companyId,
        code: 'FRE-BAT-KG',
        barcode: '2003000000000',
        description: 'Batata Reno Fresca do Huambo (ao Quilo)',
        type: 'PRODUCT',
        unit: 'KG',
        categoryId: 'CAT-FRESCOS',
        standardPrice: 950.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-MACA-KG',
        companyId,
        code: 'FRE-MAC-KG',
        barcode: '2004000000000',
        description: 'Maçã Vermelha Royal Gala (ao Quilo)',
        type: 'PRODUCT',
        unit: 'KG',
        categoryId: 'CAT-FRESCOS',
        standardPrice: 1400.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },

      // Acessórios de Balcão
      {
        id: 'PRD-SACO-PLAST',
        companyId,
        code: 'SUP-SAC-01',
        barcode: '5607001234567',
        description: 'Saco de Compras Biodegradável Loja Negrinho',
        type: 'PRODUCT',
        unit: 'UN',
        categoryId: 'CAT-BASICA',
        standardPrice: 50.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },

      // Artigos Mantidos para Compatibilidade de Testes Automatizados
      {
        id: 'PRD-ERP',
        companyId,
        code: 'SRV-ERP-01',
        description: 'Licença de Software ERP Kiteke Enterprise Cloud (Anuidade)',
        type: 'SERVICE',
        unit: 'UN',
        standardPrice: 450000.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: true,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-CONS',
        companyId,
        code: 'SRV-CONS-TI',
        description: 'Consultoria e Arquitectura de Sistemas em Nuvem',
        type: 'SERVICE',
        unit: 'HORAS',
        standardPrice: 45000.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: true,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-SERV-DELL',
        companyId,
        code: 'EQP-SRV-DELL',
        description: 'Servidor Dell PowerEdge R750xs Rack 2U Xeon Silver 32GB RAM',
        type: 'PRODUCT',
        unit: 'UN',
        standardPrice: 2850000.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-FORMACAO',
        companyId,
        code: 'SRV-FORM-FISC',
        description: 'Formação Especializada em Fiscalidade Angolana e SAF-T (AO)',
        type: 'SERVICE',
        unit: 'UN',
        standardPrice: 95000.0,
        taxConfigurationId: 'TAX-IVAM02',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-CESTA',
        companyId,
        code: 'ALIM-CESTA-01',
        description: 'Cesta Básica Completa Familiar Familiar Loja Negrinho',
        type: 'PRODUCT',
        unit: 'UN',
        standardPrice: 65000.0,
        taxConfigurationId: 'TAX-IVA07',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-POS-TERM',
        companyId,
        code: 'EQP-POS-01',
        description: 'Terminal POS Android Inteligente com Impressora Térmica',
        type: 'PRODUCT',
        unit: 'UN',
        standardPrice: 185000.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'PRD-PAPEL-TERM',
        companyId,
        code: 'SUP-PAPEL-57',
        description: 'Bobinas de Papel Térmico 57mm x 40m (Caixa c/ 50 unidades)',
        type: 'PRODUCT',
        unit: 'CX',
        standardPrice: 12500.0,
        taxConfigurationId: 'TAX-IVA14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      },
    ];
    prods.forEach((p) => this.products.set(p.id, p));

    // 8. Séries Documentais (Séries Oficiais 2026)
    const seriesList: DocumentSeries[] = [
      {
        id: 'SER-FT-2026',
        companyId,
        establishmentId: est1.id,
        documentTypeCode: 'FT',
        seriesCode: 'A2026',
        fiscalYear: 2026,
        currentSequence: 0,
        isActive: true,
        isClosed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'SER-FR-2026',
        companyId,
        establishmentId: est1.id,
        documentTypeCode: 'FR',
        seriesCode: 'A2026',
        fiscalYear: 2026,
        currentSequence: 0,
        isActive: true,
        isClosed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'SER-RC-2026',
        companyId,
        establishmentId: est1.id,
        documentTypeCode: 'RC',
        seriesCode: 'A2026',
        fiscalYear: 2026,
        currentSequence: 0,
        isActive: true,
        isClosed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'SER-NC-2026',
        companyId,
        establishmentId: est1.id,
        documentTypeCode: 'NC',
        seriesCode: 'A2026',
        fiscalYear: 2026,
        currentSequence: 0,
        isActive: true,
        isClosed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'SER-ND-2026',
        companyId,
        establishmentId: est1.id,
        documentTypeCode: 'ND',
        seriesCode: 'A2026',
        fiscalYear: 2026,
        currentSequence: 0,
        isActive: true,
        isClosed: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
    seriesList.forEach((s) => this.series.set(s.id, s));

    // 8.1 Documento Inicial Certificado (Fatura Modelo 2026)
    const initialDoc: FiscalDocument = {
      id: 'DOC-FT-2026-000001',
      companyId,
      establishmentId: est1.id,
      seriesId: 'SER-FT-2026',
      documentTypeCode: 'FT',
      documentNumber: 'FT A2026/000001',
      sequentialNumber: 1,
      documentDate: '2026-02-15',
      systemEntryDate: now,
      customerId: 'CLI-SONANGOL',
      customerTaxId: '5402001122',
      customerName: 'Sonangol E.P. - Sociedade Nacional de Combustíveis',
      customerAddress: 'Rua 1º de Maio, Luanda',
      customerCountry: 'AO',
      lines: [
        {
          id: 'LN-001',
          lineNumber: 1,
          productId: 'PRD-ERP',
          productCode: 'SRV-ERP-01',
          description: 'Licença de Software ERP Kiteke Enterprise Cloud (Anuidade)',
          unit: 'UN',
          quantity: 1,
          unitPrice: 450000.0,
          discountRate: 0,
          discountAmount: 0,
          taxableBase: 450000.0,
          taxConfigurationId: 'TAX-IVA14',
          taxType: 'IVA',
          taxCode: 'NOR',
          taxRate: 14.0,
          taxAmount: 63000.0,
          totalLineAmount: 513000.0,
        },
        {
          id: 'LN-002',
          lineNumber: 2,
          productId: 'PRD-POS-TERM',
          productCode: 'EQP-POS-01',
          description: 'Terminal POS Android Inteligente com Impressora Térmica',
          unit: 'UN',
          quantity: 1,
          unitPrice: 185000.0,
          discountRate: 0,
          discountAmount: 0,
          taxableBase: 185000.0,
          taxConfigurationId: 'TAX-IVA14',
          taxType: 'IVA',
          taxCode: 'NOR',
          taxRate: 14.0,
          taxAmount: 25900.0,
          totalLineAmount: 210900.0,
        },
      ],
      references: [],
      grossAmount: 635000.0,
      discountAmount: 0,
      taxableBase: 635000.0,
      taxAmount: 88900.0,
      withholdingAmount: 0,
      netTotal: 723900.0,
      previousHash: '',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      hashControl: 'bK9X',
      softwareCertificateNumber: '999/AGT/2026',
      signature: {
        signatureBase64: 'MEQCIG8aFk_RSASSA_PKCS1_v1_5_SHA256_RSA2048_CERT_ANGOLA_SIG',
        keyVersion: 1,
        algorithm: 'RSASSA-PKCS1-v1_5',
        digestAlgorithm: 'SHA-256',
        signedAt: now,
        publicKeyFingerprint: 'SHA256:4a8b7f90c23e817d12f9b87a412093ea6518bc29df',
      },
      status: 'ISSUED',
      isLocked: true,
      issuedByUserId: 'USR-ADMIN',
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(initialDoc.id, initialDoc);
    const serFt = this.series.get('SER-FT-2026');
    if (serFt) serFt.currentSequence = 1;

    // ==========================================
    // 7. FASE 4: Provisionamento de Armazéns e Stocks
    // ==========================================
    const mainWarehouse: Warehouse = {
      id: 'WAR-001',
      companyId,
      establishmentId: est1.id,
      code: 'ARM-LOJA',
      name: 'Armazém & Prateleiras do Mini Mercado (Cassenda)',
      location: 'Cassenda, Rua 5, Loja 12, Luanda',
      isMain: true,
      status: 'ACTIVE',
      createdAt: now,
    };
    this.warehouses.set(mainWarehouse.id, mainWarehouse);

    // Stock dos artigos físicos do Mini Mercado (P001 a P008 exactos do mockup)
    const initialStocks: Array<{
      id: string;
      productId: string;
      qty: number;
      min: number;
      cost: number;
    }> = [
      { id: 'STK-P001', productId: 'P001', qty: 5, min: 10, cost: 3500 },
      { id: 'STK-P002', productId: 'P002', qty: 12, min: 5, cost: 3500 },
      { id: 'STK-P003', productId: 'P003', qty: 2, min: 5, cost: 6000 },
      { id: 'STK-P004', productId: 'P004', qty: 15, min: 5, cost: 1800 },
      { id: 'STK-P005', productId: 'P005', qty: 20, min: 10, cost: 2000 },
      { id: 'STK-P006', productId: 'P006', qty: 8, min: 5, cost: 1500 },
      { id: 'STK-P007', productId: 'P007', qty: 15, min: 5, cost: 2800 },
      { id: 'STK-P008', productId: 'P008', qty: 10, min: 5, cost: 1400 },
      { id: 'STK-ARR-1KG', productId: 'PRD-ARROZ-1KG', qty: 120, min: 20, cost: 500 },
      { id: 'STK-ARR-5KG', productId: 'PRD-ARROZ-5KG', qty: 65, min: 15, cost: 2600 },
      { id: 'STK-OLE-1L', productId: 'PRD-OLEO-1L', qty: 90, min: 20, cost: 1150 },
      { id: 'STK-FUB-1KG', productId: 'PRD-FUBA-1KG', qty: 150, min: 30, cost: 380 },
      { id: 'STK-FEI-1KG', productId: 'PRD-FEIJAO-1KG', qty: 85, min: 20, cost: 850 },
      { id: 'STK-ACU-1KG', productId: 'PRD-ACUCAR-1KG', qty: 110, min: 25, cost: 750 },
      { id: 'STK-ESP-01', productId: 'PRD-ESPARGUETE', qty: 200, min: 40, cost: 300 },
      { id: 'STK-SAL-1KG', productId: 'PRD-SAL-1KG', qty: 180, min: 30, cost: 180 },
      { id: 'STK-LEI-UHT', productId: 'PRD-LEITE-UHT', qty: 75, min: 20, cost: 780 },
      { id: 'STK-LEI-NID', productId: 'PRD-LEITE-NIDO', qty: 45, min: 10, cost: 2300 },
      { id: 'STK-FRA-1KG', productId: 'PRD-FRANGO-1KG', qty: 40, min: 12, cost: 1750 },
      { id: 'STK-AGU-05L', productId: 'PRD-AGUA-05L', qty: 250, min: 50, cost: 120 },
      { id: 'STK-AGU-15L', productId: 'PRD-AGUA-15L', qty: 140, min: 30, cost: 220 },
      { id: 'STK-CUC-LAT', productId: 'PRD-CUCA-LATA', qty: 180, min: 48, cost: 250 },
      { id: 'STK-NOC-GF', productId: 'PRD-NOCAL-GF', qty: 160, min: 48, cost: 220 },
      { id: 'STK-REF-15L', productId: 'PRD-REFRIG-15L', qty: 95, min: 24, cost: 480 },
      { id: 'STK-SUM-NUT', productId: 'PRD-SUMO-NUTRY', qty: 80, min: 20, cost: 850 },
      { id: 'STK-SAB-AZU', productId: 'PRD-SABAO-AZUL', qty: 130, min: 30, cost: 210 },
      { id: 'STK-DET-OMO', productId: 'PRD-DETERG-OMO', qty: 60, min: 15, cost: 950 },
      { id: 'STK-PAP-HIG', productId: 'PRD-PAPEL-HIG', qty: 80, min: 20, cost: 620 },
      { id: 'STK-COL-75', productId: 'PRD-DENTIFRICO', qty: 70, min: 15, cost: 480 },
      { id: 'STK-PAO-FOR', productId: 'PRD-PAO-FORMA', qty: 35, min: 10, cost: 450 },
      { id: 'STK-PAO-CAR', productId: 'PRD-PAO-CARCACA', qty: 300, min: 50, cost: 35 },
      { id: 'STK-BOL-MAR', productId: 'PRD-BOLACHA-MARIA', qty: 120, min: 30, cost: 250 },
      { id: 'STK-CAF-DEL', productId: 'PRD-CAFE-DELTA', qty: 50, min: 15, cost: 1100 },
      { id: 'STK-SAR-PES', productId: 'PRD-SARDINHA', qty: 140, min: 30, cost: 410 },
      { id: 'STK-ATU-BOM', productId: 'PRD-ATUM-BOM', qty: 110, min: 25, cost: 580 },
      { id: 'STK-TOM-KG', productId: 'PRD-TOMATE-KG', qty: 45, min: 10, cost: 650 },
      { id: 'STK-CEB-KG', productId: 'PRD-CEBOLA-KG', qty: 50, min: 10, cost: 600 },
      { id: 'STK-BAT-KG', productId: 'PRD-BATATA-KG', qty: 60, min: 15, cost: 700 },
      { id: 'STK-MAC-KG', productId: 'PRD-MACA-KG', qty: 30, min: 10, cost: 1050 },
      { id: 'STK-SAC-PLA', productId: 'PRD-SACO-PLAST', qty: 500, min: 100, cost: 25 },
      // Compatibilidade
      { id: 'STK-POS-01', productId: 'PRD-POS-TERM', qty: 35, min: 10, cost: 120000 },
      { id: 'STK-PAPEL-01', productId: 'PRD-PAPEL-TERM', qty: 250, min: 50, cost: 8500 },
    ];

    initialStocks.forEach((item) => {
      this.stockItems.set(item.id, {
        id: item.id,
        warehouseId: mainWarehouse.id,
        productId: item.productId,
        currentQuantity: item.qty,
        reservedQuantity: 0,
        availableQuantity: item.qty,
        averageCostPrice: item.cost,
        totalValuation: item.qty * item.cost,
        minimumStock: item.min,
        maximumStock: item.qty * 4,
        lastMovementDate: now,
      });
    });

    // ==========================================
    // 8. FASE 4: Bancos & Tesouraria (BAI, BFA)
    // ==========================================
    const bank1: BankAccount = {
      id: 'BANK-BAI-01',
      companyId,
      bankName: 'Banco Angolano de Investimentos (BAI)',
      accountNumber: '0040.0000.1234.5678.101',
      iban: 'AO06.0040.0000.1234.5678.1018.9',
      swift: 'BAIAOAUL',
      currency: 'AOA',
      balance: 18450000,
      status: 'ACTIVE',
    };
    const bank2: BankAccount = {
      id: 'BANK-BFA-01',
      companyId,
      bankName: 'Banco de Fomento Angola (BFA)',
      accountNumber: '0006.0000.8765.4321.101',
      iban: 'AO06.0006.0000.8765.4321.1012.3',
      swift: 'BFAAAOLU',
      currency: 'AOA',
      balance: 9320000,
      status: 'ACTIVE',
    };
    this.bankAccounts.set(bank1.id, bank1);
    this.bankAccounts.set(bank2.id, bank2);

    // Sessão de Caixa diário aberta
    const cashSession: CashSession = {
      id: 'CASH-SES-001',
      companyId,
      establishmentId: est1.id,
      sessionNumber: 'CX-2026-001',
      openedByUserId: 'USR-OPERADOR',
      openedByUserName: 'Operador de Caixa 01',
      openedAt: new Date(Date.now() - 3600 * 4000).toISOString(),
      initialCashAmount: 50000,
      status: 'OPEN',
      totalCashSales: 125000,
      totalMulticaixaSales: 340000,
      totalTransferSales: 0,
      totalOutflows: 15000,
      totalInflows: 0,
    };
    this.cashSessions.set(cashSession.id, cashSession);

    // Movimento de Sangria
    const sangria: CashMovement = {
      id: 'MOV-CSH-001',
      sessionId: cashSession.id,
      companyId,
      type: 'OUTFLOW_BLEED',
      paymentMethod: 'CASH',
      amount: 15000,
      description: 'Sangria de segurança para cofre da sede',
      date: now,
      userId: 'USR-OPERADOR',
    };
    this.cashMovements.set(sangria.id, sangria);

    // ==========================================
    // 9. FASE 4: Documentos Comerciais (Orçamento & Guia)
    // ==========================================
    const orcamento: CommercialDocument = {
      id: 'ORC-2026-001',
      companyId,
      type: 'ORCAMENTO',
      documentNumber: 'ORC 2026/000001',
      customerId: 'CUST-001',
      customerName: 'Sonae Angola Distribuição, Lda',
      customerTaxId: '5412984510',
      date: '2026-02-15',
      validUntil: '2026-03-15',
      status: 'PENDING',
      lines: [
        {
          id: 'ORC-L1',
          productId: 'PRD-POS-TERM',
          productCode: 'EQP-POS-01',
          description: 'Terminal POS Android Inteligente com Impressora Térmica',
          quantity: 5,
          unitPrice: 185000,
          discountRate: 5,
          taxRate: 14,
          total: 1001850,
        },
      ],
      subtotal: 878750,
      taxTotal: 123100,
      grandTotal: 1001850,
      notes: 'Orçamento com garantia de 12 meses e entrega em Luanda.',
      createdAt: now,
    };
    this.commercialDocuments.set(orcamento.id, orcamento);

    // 9. Compras (Exactas da imagem)
    const initialPurchases: PurchaseOrder[] = [
      {
        id: 'PO-001',
        companyId,
        orderNumber: 'CP-001',
        supplierId: 'SUP-LIMA',
        supplierName: 'Distribuidora Lima',
        supplierTaxId: '5401112233',
        warehouseId: 'WAR-001',
        orderDate: '29/09/2025',
        expectedDeliveryDate: '2025-10-05',
        lines: [],
        subtotal: 39474,
        taxTotal: 5526,
        grandTotal: 45000,
        status: 'RECEIVED',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'PO-002',
        companyId,
        orderNumber: 'CP-002',
        supplierId: 'SUP-POVO',
        supplierName: 'Comércio do Povo',
        supplierTaxId: '5402223344',
        warehouseId: 'WAR-001',
        orderDate: '20/09/2025',
        expectedDeliveryDate: '2025-09-25',
        lines: [],
        subtotal: 28509,
        taxTotal: 3991,
        grandTotal: 32500,
        status: 'APPROVED',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'PO-003',
        companyId,
        orderNumber: 'CP-003',
        supplierId: 'SUP-AGRO',
        supplierName: 'AgroAlimentos',
        supplierTaxId: '5403334455',
        warehouseId: 'WAR-001',
        orderDate: '15/09/2025',
        expectedDeliveryDate: '2025-09-20',
        lines: [],
        subtotal: 52632,
        taxTotal: 7368,
        grandTotal: 60000,
        status: 'RECEIVED',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'PO-004',
        companyId,
        orderNumber: 'CP-004',
        supplierId: 'SUP-FARMA',
        supplierName: 'FarmaVida',
        supplierTaxId: '5404445566',
        warehouseId: 'WAR-001',
        orderDate: '10/09/2025',
        expectedDeliveryDate: '2025-09-15',
        lines: [],
        subtotal: 16579,
        taxTotal: 2321,
        grandTotal: 18900,
        status: 'RECEIVED',
        createdAt: now,
        updatedAt: now,
      },
    ];
    initialPurchases.forEach((po) => this.purchaseOrders.set(po.id, po));

    // ==========================================
    // 10. MÓDULO RESTAURAÇÃO & MESAS
    // ==========================================
    const initialTables: RestaurantTable[] = [
      {
        id: 'TBL-01',
        number: 1,
        name: 'Mesa 01',
        zone: 'SALAO_PRINCIPAL',
        capacity: 4,
        status: 'OCCUPIED',
        waiterName: 'António Kiala',
        customerName: 'Manuel Viana',
        customerNif: '999999999',
        openedAt: new Date(Date.now() - 35 * 60000).toISOString(),
        items: [
          {
            id: 'ORD-ITM-1',
            productId: 'PRD-CERVEJA-CUCA',
            productName: 'Cerveja Cuca Lata 33cl',
            quantity: 3,
            unitPrice: 500,
            total: 1500,
            notes: 'Bem frescas',
            status: 'SERVED',
            addedAt: new Date(Date.now() - 30 * 60000).toISOString(),
          },
          {
            id: 'ORD-ITM-2',
            productId: 'PRD-REFEICAO-M01',
            productName: 'Bitoque Especial com Batata',
            quantity: 2,
            unitPrice: 4500,
            total: 9000,
            notes: 'Ovo bem passado',
            status: 'SERVED',
            addedAt: new Date(Date.now() - 25 * 60000).toISOString(),
          },
        ],
        subtotal: 10500,
      },
      {
        id: 'TBL-02',
        number: 2,
        name: 'Mesa 02',
        zone: 'SALAO_PRINCIPAL',
        capacity: 2,
        status: 'BILL_REQUESTED',
        waiterName: 'António Kiala',
        customerName: 'Carla Dias',
        customerNif: '005423112LA01',
        openedAt: new Date(Date.now() - 50 * 60000).toISOString(),
        items: [
          {
            id: 'ORD-ITM-3',
            productId: 'PRD-AGUA-CHELLA',
            productName: 'Água Mineral Chela 500ml',
            quantity: 2,
            unitPrice: 350,
            total: 700,
            notes: 'Sem gelo',
            status: 'SERVED',
            addedAt: new Date(Date.now() - 45 * 60000).toISOString(),
          },
          {
            id: 'ORD-ITM-4',
            productId: 'PRD-CAFE-EXPRESSO',
            productName: 'Café Expresso Ginga',
            quantity: 2,
            unitPrice: 400,
            total: 800,
            notes: '',
            status: 'SERVED',
            addedAt: new Date(Date.now() - 15 * 60000).toISOString(),
          },
        ],
        subtotal: 1500,
      },
      {
        id: 'TBL-03',
        number: 3,
        name: 'Mesa 03',
        zone: 'SALAO_PRINCIPAL',
        capacity: 4,
        status: 'AVAILABLE',
        items: [],
        subtotal: 0,
      },
      {
        id: 'TBL-04',
        number: 4,
        name: 'Mesa 04 (Janela)',
        zone: 'SALAO_PRINCIPAL',
        capacity: 6,
        status: 'RESERVED',
        customerName: 'Dra. Teresa Bento',
        waiterName: 'António Kiala',
        items: [],
        subtotal: 0,
      },
      {
        id: 'TBL-05',
        number: 5,
        name: 'Esplanada 01',
        zone: 'ESPLANADA',
        capacity: 4,
        status: 'OCCUPIED',
        waiterName: 'António Kiala',
        customerName: 'Grupo Amigos',
        openedAt: new Date(Date.now() - 20 * 60000).toISOString(),
        items: [
          {
            id: 'ORD-ITM-5',
            productId: 'PRD-CERVEJA-CUCA',
            productName: 'Cerveja Cuca Lata 33cl',
            quantity: 6,
            unitPrice: 500,
            total: 3000,
            status: 'SENT_TO_KITCHEN',
            addedAt: new Date(Date.now() - 10 * 60000).toISOString(),
          },
        ],
        subtotal: 3000,
      },
      {
        id: 'TBL-06',
        number: 6,
        name: 'Esplanada 02',
        zone: 'ESPLANADA',
        capacity: 4,
        status: 'AVAILABLE',
        items: [],
        subtotal: 0,
      },
      {
        id: 'TBL-07',
        number: 7,
        name: 'Camarote VIP 01',
        zone: 'SALA_VIP',
        capacity: 10,
        status: 'AVAILABLE',
        items: [],
        subtotal: 0,
      },
      {
        id: 'TBL-08',
        number: 8,
        name: 'Balcão Bar 01',
        zone: 'BALCAO',
        capacity: 2,
        status: 'AVAILABLE',
        items: [],
        subtotal: 0,
      },
    ];
    initialTables.forEach((t) => this.tables.set(t.id, t));

    // ==========================================
    // 11. MÓDULO ORDENS DE SERVIÇO (OFICINA & TI)
    // ==========================================
    const initialOrders: ServiceOrder[] = [
      {
        id: 'OS-001',
        orderNumber: 'OS-2026/0001',
        customerId: 'CLI-MARIA',
        customerName: 'Maria Santos',
        customerPhone: '923 456 789',
        customerNif: '005423112LA01',
        equipment: {
          type: 'Computador Portátil',
          brand: 'HP',
          model: 'ProBook 450 G8',
          serialNumber: '5CD12984XJ',
          accessories: 'Carregador original + Bolsa preta',
          reportedFault: 'Equipamento aquece excessivamente e desliga após 15 minutos de uso.',
          technicalDiagnosis: 'Acúmulo de poeira nas ventoinhas e pasta térmica degradada. Recomendada substituição de pasta térmica e limpeza completa.',
        },
        status: 'IN_PROGRESS',
        assignedTechnician: 'Bernardo Silva (Técnico TI)',
        items: [
          {
            id: 'OS-ITM-1',
            type: 'PART',
            description: 'Pasta Térmica Arctic MX-4 4g',
            quantity: 1,
            unitPrice: 8500,
            total: 8500,
            taxRate: 14,
          },
          {
            id: 'OS-ITM-2',
            type: 'LABOR',
            description: 'Manutenção Preventiva & Limpeza Ultrassónica de Dissipador',
            quantity: 1,
            unitPrice: 25000,
            total: 25000,
            taxRate: 14,
          },
        ],
        partsSubtotal: 8500,
        laborSubtotal: 25000,
        totalAmount: 33500,
        estimatedDeliveryDate: '2026-10-05',
        warrantyPeriodDays: 90,
        createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'OS-002',
        orderNumber: 'OS-2026/0002',
        customerId: 'CLI-SONANGOL',
        customerName: 'Sonangol E.P.',
        customerPhone: '923 000 111',
        customerNif: '5401142231',
        equipment: {
          type: 'Impressora Fiscal Térmica',
          brand: 'Epson',
          model: 'TM-T20III',
          serialNumber: 'EPS-884219',
          accessories: 'Cabo USB + Fonte 24V',
          reportedFault: 'Encravamento de papel no guilhotina e corte irregular de talões.',
          technicalDiagnosis: 'Lâmina de corte desgastada. Substituição da guilhotina automática.',
        },
        status: 'READY',
        assignedTechnician: 'Bernardo Silva (Técnico TI)',
        items: [
          {
            id: 'OS-ITM-3',
            type: 'PART',
            description: 'Mecanismo de Guilhotina Epson TM Series',
            quantity: 1,
            unitPrice: 38000,
            total: 38000,
            taxRate: 14,
          },
          {
            id: 'OS-ITM-4',
            type: 'LABOR',
            description: 'Mão-de-Obra de Substituição e Calibração de Sensores',
            quantity: 1,
            unitPrice: 20000,
            total: 20000,
            taxRate: 14,
          },
        ],
        partsSubtotal: 38000,
        laborSubtotal: 20000,
        totalAmount: 58000,
        estimatedDeliveryDate: '2026-10-03',
        warrantyPeriodDays: 180,
        createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'OS-003',
        orderNumber: 'OS-2026/0003',
        customerId: 'CLI-JOAO',
        customerName: 'João Ferreira',
        customerPhone: '924 567 890',
        customerNif: '006734221LA02',
        equipment: {
          type: 'Smartphone',
          brand: 'Apple',
          model: 'iPhone 13 Pro',
          serialNumber: 'F17FK98LP0',
          accessories: 'Capa transparente',
          reportedFault: 'Ecrã partido após queda acidental.',
        },
        status: 'AWAITING_APPROVAL',
        assignedTechnician: 'Bernardo Silva (Técnico TI)',
        items: [
          {
            id: 'OS-ITM-5',
            type: 'PART',
            description: 'Módulo de Ecrã Super Retina OLED Original',
            quantity: 1,
            unitPrice: 165000,
            total: 165000,
            taxRate: 14,
          },
          {
            id: 'OS-ITM-6',
            type: 'LABOR',
            description: 'Montagem e Reprogramação TrueTone',
            quantity: 1,
            unitPrice: 30000,
            total: 30000,
            taxRate: 14,
          },
        ],
        partsSubtotal: 165000,
        laborSubtotal: 30000,
        totalAmount: 195000,
        warrantyPeriodDays: 90,
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        updatedAt: now,
      },
    ];
    initialOrders.forEach((o) => this.serviceOrders.set(o.id, o));

    // ==========================================
    // 12. MÓDULO RECURSOS HUMANOS & SALÁRIOS ANGOLA
    // ==========================================
    const initialEmployees: Employee[] = [
      {
        id: 'EMP-001',
        name: 'Manuel dos Santos',
        nif: '001245678LA034',
        position: 'Gerente Geral de Loja',
        department: 'Administração & Direção',
        admissionDate: '2022-01-15',
        iban: 'AO06.0006.0000.1111.2222.3333.4',
        bankName: 'BFA',
        baseSalary: 450000,
        mealAllowance: 30000,
        transportAllowance: 30000,
        otherAllowances: 25000,
        status: 'ACTIVE',
      },
      {
        id: 'EMP-002',
        name: 'Bernardo Silva',
        nif: '004567891LA012',
        position: 'Técnico Sénior de Hardware & TI',
        department: 'Assistência Técnica & Oficina',
        admissionDate: '2023-03-01',
        iban: 'AO06.0040.0000.5555.6666.7777.8',
        bankName: 'BAI',
        baseSalary: 280000,
        mealAllowance: 30000,
        transportAllowance: 30000,
        otherAllowances: 15000,
        status: 'ACTIVE',
      },
      {
        id: 'EMP-003',
        name: 'Beatriz Costa',
        nif: '007891234LA045',
        position: 'Operadora de Caixa Principal',
        department: 'Frente de Loja & POS',
        admissionDate: '2024-02-10',
        iban: 'AO06.0051.0000.8888.9999.0000.1',
        bankName: 'Banco BIC',
        baseSalary: 140000,
        mealAllowance: 30000,
        transportAllowance: 30000,
        otherAllowances: 10000,
        status: 'ACTIVE',
      },
      {
        id: 'EMP-004',
        name: 'António Kiala',
        nif: '009876543LA078',
        position: 'Empregado de Mesa & Atendimento',
        department: 'Restauração & Bar',
        admissionDate: '2024-05-20',
        iban: 'AO06.0055.0000.2222.3333.4444.5',
        bankName: 'Banco Sol',
        baseSalary: 110000,
        mealAllowance: 30000,
        transportAllowance: 30000,
        otherAllowances: 0,
        status: 'ACTIVE',
      },
    ];
    initialEmployees.forEach((e) => this.employees.set(e.id, e));

    // Processamento Salarial Inicial (Mês Atual)
    initialEmployees.forEach((emp, index) => {
      const calc = calculateAngolanPayroll(
        emp.baseSalary,
        emp.mealAllowance,
        emp.transportAllowance,
        emp.otherAllowances,
        0
      );

      const record: PayrollRecord = {
        id: `PAY-2026-10-${emp.id}`,
        periodMonth: 10,
        periodYear: 2026,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeNif: emp.nif,
        position: emp.position,
        department: emp.department,
        iban: emp.iban,
        baseSalary: emp.baseSalary,
        mealAllowance: emp.mealAllowance,
        transportAllowance: emp.transportAllowance,
        otherAllowances: emp.otherAllowances,
        overtimeAmount: 0,
        grossSalary: calc.grossSalary,
        taxableIncome: calc.taxableIncome,
        inssEmployee: calc.inssEmployee,
        inssEmployer: calc.inssEmployer,
        irtAmount: calc.irtAmount,
        totalDeductions: calc.totalDeductions,
        netSalary: calc.netSalary,
        paymentStatus: 'PAID',
        processedAt: now,
        receiptNumber: `REC-SAL-2026/10-00${index + 1}`,
      };
      this.payrollRecords.set(record.id, record);
    });

    // Log inicial de sistema
    AuditService.logEvent({
      companyId,
      user: {
        id: 'SYSTEM',
        name: 'Sistema Operacional Fiscal & ERP',
        role: 'ADMIN',
      },
      entityType: 'COMPANY',
      entityId: companyId,
      operation: 'CREATE',
      description: 'Inicialização do Núcleo Fiscal e Expansão ERP Angolano (Fases 1 a 4)',
    });
  }

  // Obter último hash de uma dada série
  getLastHashForSeries(seriesId: string): string {
    const seriesDocs = Array.from(this.documents.values())
      .filter((d) => d.seriesId === seriesId)
      .sort((a, b) => b.sequentialNumber - a.sequentialNumber);

    if (seriesDocs.length > 0) {
      return seriesDocs[0].hash;
    }
    return '';
  }

  // Obter pagamentos efectuados de um documento
  getPaymentsForDocument(documentId: string): Payment[] {
    return Array.from(this.payments.values()).filter((p) => p.documentId === documentId);
  }

  // --- Módulo Restauração & Mesas ---
  public updateTable(table: RestaurantTable): void {
    this.tables.set(table.id, table);
    LocalPersistenceEngine.persistToLocalStorage(this);
    this.notify();
  }

  // --- Módulo Ordens de Serviço ---
  public updateServiceOrder(so: ServiceOrder): void {
    this.serviceOrders.set(so.id, so);
    LocalPersistenceEngine.persistToLocalStorage(this);
    this.notify();
  }

  // --- Módulo Recursos Humanos & Salários ---
  public updateEmployee(emp: Employee): void {
    this.employees.set(emp.id, emp);
    LocalPersistenceEngine.persistToLocalStorage(this);
    this.notify();
  }

  public addPayrollRecord(record: PayrollRecord): void {
    this.payrollRecords.set(record.id, record);
    LocalPersistenceEngine.persistToLocalStorage(this);
    this.notify();
  }
}
