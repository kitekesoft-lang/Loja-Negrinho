export interface Employee {
  id: string;
  name: string;
  nif: string; // NIF / BI
  position: string; // Cargo
  department: string;
  admissionDate: string;
  iban?: string;
  bankName?: string;
  baseSalary: number; // Salário Base em Kwanza (Kz)
  mealAllowance: number; // Subsídio de Alimentação
  transportAllowance: number; // Subsídio de Transporte
  otherAllowances: number; // Outros Abonos
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PayrollRecord {
  id: string;
  periodMonth: number; // 1 a 12
  periodYear: number; // ex: 2026
  employeeId: string;
  employeeName: string;
  employeeNif: string;
  position: string;
  department: string;
  iban?: string;
  baseSalary: number;
  mealAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  overtimeAmount: number;
  grossSalary: number; // Total Bruto
  taxableIncome: number; // Matéria Coletável para IRT (após dedução INSS e isenções de transporte/alimentação)
  inssEmployee: number; // 3% INSS Trabalhador
  inssEmployer: number; // 8% INSS Entidade Patronal
  irtAmount: number; // IRT Retido na Fonte (Lei 28/20)
  totalDeductions: number; // INSS 3% + IRT
  netSalary: number; // Salário Líquido a Pagar
  paymentStatus: 'PENDING' | 'PAID';
  processedAt: string;
  receiptNumber: string; // ex: REC-SAL-2026/01-001
}

/**
 * Tabela Oficial de IRT de Angola (Lei n.º 28/20)
 */
export function calculateAngolanPayroll(
  baseSalary: number,
  mealAllowance: number = 0,
  transportAllowance: number = 0,
  otherAllowances: number = 0,
  overtimeAmount: number = 0
): {
  grossSalary: number;
  inssEmployee: number;
  inssEmployer: number;
  taxableIncome: number;
  irtAmount: number;
  totalDeductions: number;
  netSalary: number;
} {
  const grossSalary = baseSalary + mealAllowance + transportAllowance + otherAllowances + overtimeAmount;

  // Limites de isenção de subsídios segundo a legislação angolana (até 30.000 Kz cada é isento de IRT e INSS)
  const exemptMeal = Math.min(mealAllowance, 30000);
  const exemptTransport = Math.min(transportAllowance, 30000);

  // Base sujeita a INSS (salário base + abonos tributáveis)
  const inssBase = baseSalary + (mealAllowance - exemptMeal) + (transportAllowance - exemptTransport) + otherAllowances + overtimeAmount;

  // 1. Desconto Segurança Social (INSS)
  const inssEmployee = Math.round(inssBase * 0.03 * 100) / 100; // 3%
  const inssEmployer = Math.round(inssBase * 0.08 * 100) / 100; // 8%

  // 2. Rendimento Coletável para IRT = Bruto Tributável - 3% INSS
  const taxableIncome = Math.max(0, inssBase - inssEmployee);

  // 3. Cálculo de IRT pelos escalões oficiais (Lei 28/20)
  let irt = 0;
  if (taxableIncome <= 100000) {
    irt = 0; // Isento
  } else if (taxableIncome <= 150000) {
    irt = (taxableIncome - 100000) * 0.13;
  } else if (taxableIncome <= 200000) {
    irt = 6500 + (taxableIncome - 150000) * 0.16;
  } else if (taxableIncome <= 300000) {
    irt = 14500 + (taxableIncome - 200000) * 0.18;
  } else if (taxableIncome <= 500000) {
    irt = 32500 + (taxableIncome - 300000) * 0.19;
  } else if (taxableIncome <= 1000000) {
    irt = 70500 + (taxableIncome - 500000) * 0.20;
  } else if (taxableIncome <= 1500000) {
    irt = 170500 + (taxableIncome - 1000000) * 0.21;
  } else if (taxableIncome <= 2000000) {
    irt = 275500 + (taxableIncome - 1500000) * 0.22;
  } else if (taxableIncome <= 2500000) {
    irt = 385500 + (taxableIncome - 2000000) * 0.23;
  } else if (taxableIncome <= 5000000) {
    irt = 500500 + (taxableIncome - 2500000) * 0.24;
  } else {
    irt = 1100500 + (taxableIncome - 5000000) * 0.25;
  }

  const irtAmount = Math.round(irt * 100) / 100;
  const totalDeductions = Math.round((inssEmployee + irtAmount) * 100) / 100;
  const netSalary = Math.round((grossSalary - totalDeductions) * 100) / 100;

  return {
    grossSalary,
    inssEmployee,
    inssEmployer,
    taxableIncome,
    irtAmount,
    totalDeductions,
    netSalary,
  };
}
