import React, { useState } from 'react';
import { User } from '../../core/fiscal/types/user';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import {
  Employee,
  PayrollRecord,
  calculateAngolanPayroll,
} from '../../core/fiscal/types/payroll';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  ChevronRight,
  Sparkles,
  AlertCircle,
  X,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  Wallet,
  ShieldAlert,
  Percent,
} from 'lucide-react';

interface OperatorPayrollViewProps {
  currentUser: User;
}

export const OperatorPayrollView: React.FC<OperatorPayrollViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick((t) => t + 1);

  const [activeTab, setActiveTab] = useState<'PAYROLL' | 'EMPLOYEES'>('PAYROLL');
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState('');

  // Recibo selecionado para impressão / visualização
  const [activeReceipt, setActiveReceipt] = useState<PayrollRecord | null>(null);

  // Modal para cadastrar novo funcionário
  const [showNewEmpModal, setShowNewEmpModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpNif, setNewEmpNif] = useState('');
  const [newEmpPosition, setNewEmpPosition] = useState('');
  const [newEmpDepartment, setNewEmpDepartment] = useState('Comercial & Vendas');
  const [newEmpBaseSalary, setNewEmpBaseSalary] = useState(150000);
  const [newEmpMeal, setNewEmpMeal] = useState(30000);
  const [newEmpTransport, setNewEmpTransport] = useState(30000);
  const [newEmpOther, setNewEmpOther] = useState(0);
  const [newEmpIban, setNewEmpIban] = useState('');
  const [newEmpBank, setNewEmpBank] = useState('BFA');

  // Feedback de processamento
  const [processFeedback, setProcessFeedback] = useState<string | null>(null);

  const employees = Array.from(db.employees.values());
  const payrollRecords = Array.from(db.payrollRecords.values()).filter(
    (p) => p.periodMonth === selectedMonth && p.periodYear === selectedYear
  );

  // Totais da folha processada
  const totalGross = payrollRecords.reduce((acc, r) => acc + r.grossSalary, 0);
  const totalInssWorker = payrollRecords.reduce((acc, r) => acc + r.inssEmployee, 0);
  const totalInssEmployer = payrollRecords.reduce((acc, r) => acc + r.inssEmployer, 0);
  const totalIrt = payrollRecords.reduce((acc, r) => acc + r.irtAmount, 0);
  const totalNet = payrollRecords.reduce((acc, r) => acc + r.netSalary, 0);

  // Filtragem
  const filteredEmployees = employees.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.nif.toLowerCase().includes(q) || e.position.toLowerCase().includes(q);
    }
    return true;
  });

  // Processar Folha do Mês para Todos os Colaboradores
  const handleProcessFullPayroll = () => {
    const activeStaff = employees.filter((e) => e.status === 'ACTIVE');
    const now = new Date().toISOString();

    activeStaff.forEach((emp, idx) => {
      const calc = calculateAngolanPayroll(
        emp.baseSalary,
        emp.mealAllowance,
        emp.transportAllowance,
        emp.otherAllowances,
        0
      );

      const record: PayrollRecord = {
        id: `PAY-${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${emp.id}`,
        periodMonth: selectedMonth,
        periodYear: selectedYear,
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
        receiptNumber: `REC-SAL-${selectedYear}/${String(selectedMonth).padStart(2, '0')}-${String(idx + 1).padStart(3, '0')}`,
      };

      db.addPayrollRecord(record);
    });

    setProcessFeedback(`Processamento salarial de ${selectedMonth}/${selectedYear} concluído para ${activeStaff.length} colaboradores com retenção de IRT e INSS!`);
    forceUpdate();
  };

  // Cadastrar Novo Colaborador
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: Employee = {
      id: `EMP-${Date.now()}`,
      name: newEmpName,
      nif: newEmpNif,
      position: newEmpPosition,
      department: newEmpDepartment,
      admissionDate: new Date().toISOString().split('T')[0],
      iban: newEmpIban.trim() || undefined,
      bankName: newEmpBank,
      baseSalary: Number(newEmpBaseSalary),
      mealAllowance: Number(newEmpMeal),
      transportAllowance: Number(newEmpTransport),
      otherAllowances: Number(newEmpOther),
      status: 'ACTIVE',
    };

    db.updateEmployee(newEmp);
    setShowNewEmpModal(false);
    setNewEmpName('');
    setNewEmpNif('');
    setNewEmpPosition('');
    setNewEmpIban('');
    forceUpdate();
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo RH & Salários */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Recursos Humanos & Folha Salarial
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Lei do IRT 28/20 & INSS
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Processamento salarial angolano, retenção de IRT, contribuições para Segurança Social (3% e 8%) e recibos de vencimento
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('PAYROLL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'PAYROLL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Folha do Mês
            </button>
            <button
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'EMPLOYEES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Colaboradores ({employees.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowNewEmpModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Colaborador</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Feedback */}
      {processFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{processFeedback}</span>
          </div>
          <button onClick={() => setProcessFeedback(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            Fechar
          </button>
        </div>
      )}

      {/* 3. Seletor de Período e Botão de Processar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Período Fiscal:</span>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
          >
            {monthNames.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m} ({idx + 1})
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleProcessFullPayroll}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Processar Salários de {monthNames[selectedMonth - 1]}</span>
        </button>
      </div>

      {/* 4. Cartões de Métricas da Folha de Pagamento */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Remuneração Bruta</span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            {totalGross.toLocaleString('pt-AO')} <span className="text-xs">Kz</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Base + Abonos</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">INSS Trabalhador (3%)</span>
          <div className="text-xl font-black text-blue-700 mt-1 font-mono">
            {totalInssWorker.toLocaleString('pt-AO')} <span className="text-xs">Kz</span>
          </div>
          <span className="text-[11px] text-blue-500 mt-0.5 block">Desconto em folha</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs bg-indigo-50/20">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">INSS Patronal (8%)</span>
          <div className="text-xl font-black text-indigo-700 mt-1 font-mono">
            {totalInssEmployer.toLocaleString('pt-AO')} <span className="text-xs">Kz</span>
          </div>
          <span className="text-[11px] text-indigo-500 mt-0.5 block">Custo empresa</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">IRT Retido (AGT)</span>
          <div className="text-xl font-black text-amber-800 mt-1 font-mono">
            {totalIrt.toLocaleString('pt-AO')} <span className="text-xs">Kz</span>
          </div>
          <span className="text-[11px] text-amber-600 mt-0.5 block">Imposto de Rendimento</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-300 shadow-xs bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Líquido a Pagar</span>
          <div className="text-xl font-black text-emerald-800 mt-1 font-mono">
            {totalNet.toLocaleString('pt-AO')} <span className="text-xs">Kz</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Transferências bancárias</span>
        </div>
      </div>

      {/* 5. Tabela do Mês ou de Colaboradores */}
      {activeTab === 'PAYROLL' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Mapa Resumo da Folha Salarial: {monthNames[selectedMonth - 1]} / {selectedYear}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {payrollRecords.length} colaboradores processados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Cargo / Dep.</th>
                  <th className="py-3 px-4 text-right">Salário Base</th>
                  <th className="py-3 px-4 text-right">Sub. Alim./Transp.</th>
                  <th className="py-3 px-4 text-right">Bruto</th>
                  <th className="py-3 px-4 text-right text-blue-600">INSS 3%</th>
                  <th className="py-3 px-4 text-right text-amber-600">IRT Retido</th>
                  <th className="py-3 px-4 text-right font-black text-emerald-700">Líquido a Pagar</th>
                  <th className="py-3 px-4 text-center">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollRecords.length > 0 ? (
                  payrollRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIF: {r.employeeNif}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{r.position}</div>
                        <div className="text-[10px] text-slate-500">{r.department}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {r.baseSalary.toLocaleString('pt-AO')} Kz
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {(r.mealAllowance + r.transportAllowance).toLocaleString('pt-AO')} Kz
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {r.grossSalary.toLocaleString('pt-AO')} Kz
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700 font-semibold">
                        -{r.inssEmployee.toLocaleString('pt-AO')} Kz
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700 font-semibold">
                        -{r.irtAmount.toLocaleString('pt-AO')} Kz
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                        {r.netSalary.toLocaleString('pt-AO')} Kz
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveReceipt(r)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Recibo</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Nenhum processamento salarial efetuado para {monthNames[selectedMonth - 1]}/{selectedYear}. Clique em "Processar Salários" acima.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Aba de Cadastro de Colaboradores */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Ficha Cadastral dos Colaboradores</h3>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, cargo, NIF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Nome do Colaborador</th>
                  <th className="py-3 px-4">NIF / BI</th>
                  <th className="py-3 px-4">Cargo & Departamento</th>
                  <th className="py-3 px-4">IBAN & Banco</th>
                  <th className="py-3 px-4 text-right">Salário Base</th>
                  <th className="py-3 px-4 text-right">Sub. Alimentação</th>
                  <th className="py-3 px-4 text-right">Sub. Transporte</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{emp.nif}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{emp.position}</div>
                      <div className="text-[10px] text-slate-400">{emp.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-700">{emp.bankName || 'BFA'}</div>
                      <div className="font-mono text-[10px] text-slate-400">{emp.iban || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {emp.baseSalary.toLocaleString('pt-AO')} Kz
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {emp.mealAllowance.toLocaleString('pt-AO')} Kz
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {emp.transportAllowance.toLocaleString('pt-AO')} Kz
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Modal de Pré-visualização do Recibo de Vencimento Oficial */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs text-slate-900 space-y-4">
            {/* Cabeçalho do Recibo */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
              <div>
                <h4 className="font-black text-sm uppercase text-slate-900">RECIBO DE VENCIMENTO</h4>
                <p className="font-mono font-bold text-blue-700 text-xs mt-0.5">{activeReceipt.receiptNumber}</p>
                <p className="text-[10px] text-slate-500">
                  Período: {monthNames[activeReceipt.periodMonth - 1]} de {activeReceipt.periodYear}
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs">Minha Loja, Lda.</span>
                <p className="text-[10px] text-slate-500">NIF: 5417082341</p>
                <p className="text-[10px] text-slate-500">Luanda, Angola</p>
              </div>
            </div>

            {/* Dados do Colaborador */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block">Colaborador:</span>
                <span className="font-bold text-slate-900">{activeReceipt.employeeName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">NIF / BI:</span>
                <span className="font-mono font-bold">{activeReceipt.employeeNif}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Cargo:</span>
                <span>{activeReceipt.position}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Departamento:</span>
                <span>{activeReceipt.department}</span>
              </div>
              {activeReceipt.iban && (
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block">IBAN de Liquidação:</span>
                  <span className="font-mono text-[10px]">{activeReceipt.iban}</span>
                </div>
              )}
            </div>

            {/* Discriminação de Abonos e Descontos */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                {/* Abonos */}
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/70 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Rendimentos / Abonos</span>
                  <div className="flex justify-between">
                    <span>Salário Base:</span>
                    <span className="font-mono font-bold">{activeReceipt.baseSalary.toLocaleString('pt-AO')} Kz</span>
                  </div>
                  {activeReceipt.mealAllowance > 0 && (
                    <div className="flex justify-between">
                      <span>Sub. Alimentação:</span>
                      <span className="font-mono">{activeReceipt.mealAllowance.toLocaleString('pt-AO')} Kz</span>
                    </div>
                  )}
                  {activeReceipt.transportAllowance > 0 && (
                    <div className="flex justify-between">
                      <span>Sub. Transporte:</span>
                      <span className="font-mono">{activeReceipt.transportAllowance.toLocaleString('pt-AO')} Kz</span>
                    </div>
                  )}
                  {activeReceipt.otherAllowances > 0 && (
                    <div className="flex justify-between">
                      <span>Outros Abonos:</span>
                      <span className="font-mono">{activeReceipt.otherAllowances.toLocaleString('pt-AO')} Kz</span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-emerald-200 flex justify-between font-bold text-emerald-900">
                    <span>Total Bruto:</span>
                    <span className="font-mono">{activeReceipt.grossSalary.toLocaleString('pt-AO')} Kz</span>
                  </div>
                </div>

                {/* Descontos Obrigatórios */}
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200/70 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-rose-800 block">Descontos Oficiais</span>
                  <div className="flex justify-between">
                    <span>INSS Trabalhador (3%):</span>
                    <span className="font-mono text-rose-700 font-bold">-{activeReceipt.inssEmployee.toLocaleString('pt-AO')} Kz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IRT Retido (Lei 28/20):</span>
                    <span className="font-mono text-rose-700 font-bold">-{activeReceipt.irtAmount.toLocaleString('pt-AO')} Kz</span>
                  </div>
                  <div className="pt-1.5 border-t border-rose-200 flex justify-between font-bold text-rose-900">
                    <span>Total Descontos:</span>
                    <span className="font-mono">-{activeReceipt.totalDeductions.toLocaleString('pt-AO')} Kz</span>
                  </div>
                </div>
              </div>

              {/* Total Líquido */}
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Salário Líquido a Receber</span>
                  <span className="text-[11px] text-slate-300">Conforme legislação laboral da República de Angola</span>
                </div>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {activeReceipt.netSalary.toLocaleString('pt-AO')} Kz
                </div>
              </div>
            </div>

            {/* Rodapé de Assinatura */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
              <div>
                <div className="border-b border-slate-300 pb-4 mb-1"></div>
                <span>A Entidade Patronal</span>
              </div>
              <div>
                <div className="border-b border-slate-300 pb-4 mb-1"></div>
                <span>O Colaborador</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer text-xs"
              >
                Fechar Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de Cadastro de Colaborador */}
      {showNewEmpModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Cadastrar Novo Colaborador
            </h3>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: João Baptista da Silva"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIF / N.º do BI</label>
                  <input
                    type="text"
                    placeholder="Ex: 004521345LA042"
                    value={newEmpNif}
                    onChange={(e) => setNewEmpNif(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Departamento</label>
                  <select
                    value={newEmpDepartment}
                    onChange={(e) => setNewEmpDepartment(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-900"
                  >
                    <option value="Comercial & Vendas">Comercial & Vendas</option>
                    <option value="Administração & Direção">Administração & Direção</option>
                    <option value="Assistência Técnica & Oficina">Assistência Técnica & Oficina</option>
                    <option value="Restauração & Bar">Restauração & Bar</option>
                    <option value="Armazém & Logística">Armazém & Logística</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Função / Cargo</label>
                <input
                  type="text"
                  placeholder="Ex: Operador de Caixa, Técnico TI, Atendente"
                  value={newEmpPosition}
                  onChange={(e) => setNewEmpPosition(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Salário Base (Kz)</label>
                  <input
                    type="number"
                    min={70000}
                    value={newEmpBaseSalary}
                    onChange={(e) => setNewEmpBaseSalary(Number(e.target.value))}
                    required
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sub. Alimentação (Kz)</label>
                  <input
                    type="number"
                    min={0}
                    value={newEmpMeal}
                    onChange={(e) => setNewEmpMeal(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sub. Transporte (Kz)</label>
                  <input
                    type="number"
                    min={0}
                    value={newEmpTransport}
                    onChange={(e) => setNewEmpTransport(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Banco</label>
                  <select
                    value={newEmpBank}
                    onChange={(e) => setNewEmpBank(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-900"
                  >
                    <option value="BFA">BFA</option>
                    <option value="BAI">BAI</option>
                    <option value="Banco BIC">Banco BIC</option>
                    <option value="Banco Sol">Banco Sol</option>
                    <option value="Millennium Atlântico">Millennium Atlântico</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">IBAN de Pagamento</label>
                  <input
                    type="text"
                    placeholder="AO06.0006.0000..."
                    value={newEmpIban}
                    onChange={(e) => setNewEmpIban(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewEmpModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Cadastrar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
