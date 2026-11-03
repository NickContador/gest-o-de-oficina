import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Car,
  User,
  Clock,
  DollarSign,
  Printer,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Lock,
  Layers,
  Wrench,
  Package,
  CreditCard,
  TrendingUp,
  X,
  Share2,
  Kanban,
  List,
  FileSpreadsheet,
  AlertTriangle,
  Target,
  Sliders,
  Percent,
  ChevronDown,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { Cliente, Veiculo, OrdemServico } from '../data/mockData.ts';
import {
  calculateOSTotals,
  formatCurrencyBRL,
  maskSensitiveData,
  checkProfitTargetAlert,
  calculateMonthlyFinancialData,
  checkPartsExpenseLimit,
  loadSystemSettingsFromStorage,
  saveSystemSettingsToStorage,
  WorkshopSystemSettings,
} from '../utils/workshopLogic.ts';
import { MinhaOficinaLogo } from './MinhaOficinaLogo.tsx';
import { KanbanBoard } from './KanbanBoard.tsx';
import { OrdemServicoLaudoModal } from './OrdemServicoLaudoModal.tsx';
import { FinancialChart } from './FinancialChart.tsx';
import { FinancialGoalsModal } from './FinancialGoalsModal.tsx';
import { MetaAlertsModal, MetaAlertsBanner } from './MetaAlertsModal.tsx';
import { WhatsAppBillingModal } from './WhatsAppBillingModal.tsx';
import { WhatsAppReminderButton } from './WhatsAppReminderButton.tsx';
import { AccountsReceivableView } from './AccountsReceivableView.tsx';
import { OSProfitMarginBarChart } from './OSProfitMarginBarChart.tsx';
import { RevenueEvolutionVsTargetChart } from './RevenueEvolutionVsTargetChart.tsx';
import { AnnualRevenueTrendLineChart } from './AnnualRevenueTrendLineChart.tsx';
import {
  exportFinancialSummaryPDF,
  exportAccountsReceivablePDF,
  exportProfitabilityReportPDF,
} from '../services/financialPdfService.ts';
import { exportFinancialSummaryExcel } from '../services/financialExcelService.ts';
import {
  exportOrdersToCSV,
  exportClientsToCSV,
  exportVehiclesToCSV,
  exportAllWorkshopDataToCSV,
} from '../services/csvExportService.ts';
import {
  checkCriticalRevenueAlert,
  getAccountsReceivableMetrics,
  RevenueGoalAlert,
} from '../utils/workshopLogic.ts';

interface WorkshopViewProps {
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  onCreateOS: (newOS: Omit<OrdemServico, 'id' | 'numero_os' | 'created_at'>) => void;
  onUpdateOSStatus: (id: string, status: OrdemServico['status']) => void;
  onUpdateOSPaymentStatus?: (id: string, status: 'pago' | 'pendente' | 'vencido', paymentMethod?: string) => void;
  isExternalNewOSOpen?: boolean;
  onCloseExternalNewOS?: () => void;
  isExternalGoalsOpen?: boolean;
  onCloseExternalGoals?: () => void;
  activeSubSection?: 'os' | 'clientes' | 'veiculos' | 'financeiro';
  globalSearchTerm?: string;
}

export const WorkshopView: React.FC<WorkshopViewProps> = ({
  ordens,
  clientes,
  veiculos,
  onCreateOS,
  onUpdateOSStatus,
  onUpdateOSPaymentStatus,
  isExternalNewOSOpen,
  onCloseExternalNewOS,
  isExternalGoalsOpen,
  onCloseExternalGoals,
  activeSubSection = 'os',
  globalSearchTerm = '',
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'os' | 'clientes' | 'veiculos' | 'financeiro'>(activeSubSection);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [internalNewOSModal, setInternalNewOSModal] = useState(false);
  const isNewOSModalOpen = isExternalNewOSOpen ?? internalNewOSModal;
  const setIsNewOSModalOpen = (open: boolean) => {
    setInternalNewOSModal(open);
    if (!open && onCloseExternalNewOS) {
      onCloseExternalNewOS();
    }
  };

  const [activeOSDetail, setActiveOSDetail] = useState<OrdemServico | null>(null);
  const [osModalSubTab, setOsModalSubTab] = useState<'cliente' | 'servicos' | 'produtos' | 'pagamento' | 'lucro' | 'impressao'>('cliente');
  const [viewMode, setViewMode] = useState<'tabela' | 'kanban'>('tabela');
  const [laudoModalOS, setLaudoModalOS] = useState<OrdemServico | null>(null);
  const [systemSettings, setSystemSettings] = useState<WorkshopSystemSettings>(() => loadSystemSettingsFromStorage());
  
  // Financial Sub-Tabs & Dedicated Modals
  const [financialSubTab, setFinancialSubTab] = useState<'dre' | 'tendencia' | 'metas' | 'margem_os' | 'receber'>('dre');
  const [isMetaAlertModalOpen, setIsMetaAlertModalOpen] = useState(false);
  const [whatsappBillingModalOS, setWhatsappBillingModalOS] = useState<OrdemServico | null>(null);
  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);
  const [isCsvMenuOpen, setIsCsvMenuOpen] = useState(false);

  const [internalGoalsModal, setInternalGoalsModal] = useState(false);
  const isGoalsModalOpen = isExternalGoalsOpen ?? internalGoalsModal;
  const setIsGoalsModalOpen = (open: boolean) => {
    setInternalGoalsModal(open);
    if (!open && onCloseExternalGoals) {
      onCloseExternalGoals();
    }
  };

  // React to prop sub section change
  React.useEffect(() => {
    if (activeSubSection) {
      setActiveMainTab(activeSubSection);
    }
  }, [activeSubSection]);

  // Sync global search term if provided
  React.useEffect(() => {
    if (globalSearchTerm) {
      setSearchTerm(globalSearchTerm);
    }
  }, [globalSearchTerm]);

  // Global Keyboard Shortcuts (F2 for New OS, Escape to close modals)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsNewOSModalOpen(true);
      } else if (e.key === 'Escape') {
        setIsNewOSModalOpen(false);
        setActiveOSDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // New OS Form State
  const [newClienteId, setNewClienteId] = useState(clientes[0]?.id || '');
  const [newVeiculoId, setNewVeiculoId] = useState(veiculos[0]?.id || '');
  const [newDescricao, setNewDescricao] = useState('');
  const [newPecas, setNewPecas] = useState<number>(350);
  const [newMaoDeObra, setNewMaoDeObra] = useState<number>(250);
  const [newDesconto, setNewDesconto] = useState<number>(0);
  const [newTecnico, setNewTecnico] = useState('Marcos Silveira (Mecânico Chefe)');

  const clientVehicles = veiculos.filter((v) => v.cliente_id === newClienteId);
  const newOSTotals = calculateOSTotals(newPecas, newMaoDeObra, newDesconto);

  // Stats
  const totalRevenue = ordens.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
  const abertasCount = ordens.filter((o) => o.status === 'aberto').length;
  const emAndamentoCount = ordens.filter((o) => o.status === 'em_andamento').length;
  const aguardandoPecasCount = ordens.filter((o) => o.status === 'aguardando_pecas').length;
  const concluidasCount = ordens.filter((o) => o.status === 'concluido' || o.status === 'entregue').length;

  // Realized Revenue and Critical Revenue Target Alert (<20%)
  const completedOrders = ordens.filter((o) => o.status === 'concluido' || o.status === 'entregue');
  const completedRevenue = completedOrders.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
  const targetRevenue = systemSettings.financialGoals.faturamentoAlvo;
  const criticalRevenueAlert = checkCriticalRevenueAlert(completedRevenue, targetRevenue, ordens);
  const receivableMetrics = getAccountsReceivableMetrics(ordens);

  // Filtered OS list
  const activeEffectiveSearch = (searchTerm || globalSearchTerm).toLowerCase();
  const filteredOrdens = ordens.filter((os) => {
    const matchesStatus = statusFilter === 'todos' || os.status === statusFilter;
    const client = clientes.find((c) => c.id === os.cliente_id);
    const vehicle = veiculos.find((v) => v.id === os.veiculo_id);

    const matchesSearch =
      os.numero_os.toString().includes(activeEffectiveSearch) ||
      os.descricao_problema.toLowerCase().includes(activeEffectiveSearch) ||
      (client && client.nome_completo.toLowerCase().includes(activeEffectiveSearch)) ||
      (vehicle && (vehicle.placa.toLowerCase().includes(activeEffectiveSearch) || vehicle.modelo.toLowerCase().includes(activeEffectiveSearch)));

    return matchesStatus && matchesSearch;
  });

  const handleSendWhatsAppOS = (os: OrdemServico, clientName?: string, vehicleInfo?: string) => {
    const text = encodeURIComponent(
      `*AUTO MECÂNICA CENTRAL — STATUS DA ORDEM DE SERVIÇO*\n\n` +
      `Olá ${clientName || 'Cliente'}, informamos sobre seu veículo *${vehicleInfo || 'Veículo'}*:\n` +
      `📋 *OS Nº:* #${os.numero_os}\n` +
      `⚡ *Status:* ${os.status.toUpperCase().replace('_', ' ')}\n` +
      `💰 *Valor Total:* ${formatCurrencyBRL(os.valor_total)}\n` +
      `🔧 *Serviço:* ${os.descricao_problema}\n\n` +
      `Qualquer dúvida estamos à disposição pelo WhatsApp ou telefone da oficina!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCreateOSSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClienteId || !newVeiculoId || !newDescricao.trim()) return;

    onCreateOS({
      usuario_id: 'usr-oficina-7729-uuid',
      cliente_id: newClienteId,
      veiculo_id: newVeiculoId,
      status: 'aberto',
      descricao_problema: newDescricao,
      pecas_valor: newPecas,
      mao_de_obra_valor: newMaoDeObra,
      desconto_valor: newDesconto,
      valor_total: newOSTotals.total,
      data_entrada: new Date().toISOString(),
      tecnico_responsavel: newTecnico,
    });

    setIsNewOSModalOpen(false);
    setNewDescricao('');
    setNewPecas(0);
    setNewMaoDeObra(0);
    setNewDesconto(0);
  };

  const getStatusBadge = (status: OrdemServico['status']) => {
    switch (status) {
      case 'aberto':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />
            Em Aberto
          </span>
        );
      case 'em_andamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Em Execução
          </span>
        );
      case 'aguardando_pecas':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Aguardando Peças
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Finalizada
          </span>
        );
      case 'entregue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Entregue
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top KPI Dashboard (MinhaOficina Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>OS em Aberto</span>
            <Clock className="w-4 h-4 text-[#00a2e8]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{abertasCount}</div>
          <span className="text-[11px] text-[#00a2e8] font-medium">Aguardando serviço</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Em Execução</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1 tabular-nums">{emAndamentoCount}</div>
          <span className="text-[11px] text-amber-700 font-medium">Mecânicos trabalhando</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Aguardando Peças</span>
            <Package className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-1 tabular-nums">{aguardandoPecasCount}</div>
          <span className="text-[11px] text-purple-700 font-medium">Fornecedores acionados</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Finalizadas</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">{concluidasCount}</div>
          <span className="text-[11px] text-emerald-700 font-medium">Pronto p/ faturar</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs col-span-2 lg:col-span-1 bg-gradient-to-br from-white to-sky-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Faturamento Bruto</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{formatCurrencyBRL(totalRevenue)}</div>
          <span className="text-[11px] text-emerald-700 font-medium">Total faturado no mês</span>
        </div>
      </div>

      {/* Sub-navigation Menu: Ordens de Serviço | Clientes | Veículos | Planejamento Financeiro */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveMainTab('os')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeMainTab === 'os'
                ? 'bg-[#00a2e8] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ordens de Serviço ({ordens.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('clientes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeMainTab === 'clientes'
                ? 'bg-[#00a2e8] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Cadastro de Clientes ({clientes.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('veiculos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeMainTab === 'veiculos'
                ? 'bg-[#00a2e8] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Veículos ({veiculos.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('financeiro')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeMainTab === 'financeiro'
                ? 'bg-[#00a2e8] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Planejador Financeiro</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* CSV Export Dropdown (Clients, Vehicles, and OS) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCsvMenuOpen(!isCsvMenuOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all active:scale-95 cursor-pointer"
              title="Exportar dados em formato CSV para relatórios offline (RFC 4180)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar CSV</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCsvMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCsvMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsCsvMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                    Relatórios Offline (CSV)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCsvMenuOpen(false);
                      exportOrdersToCSV(ordens, clientes, veiculos);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#00a2e8]" />
                    <div>
                      <div className="font-bold">Ordens de Serviço ({ordens.length})</div>
                      <div className="text-[10px] text-slate-400">Valores, peças, mão de obra e status</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCsvMenuOpen(false);
                      exportClientsToCSV(clientes, veiculos, ordens);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 transition-colors cursor-pointer border-t border-slate-50"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <div>
                      <div className="font-bold">Cadastro de Clientes ({clientes.length})</div>
                      <div className="text-[10px] text-slate-400">Contatos, endereços e histórico</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCsvMenuOpen(false);
                      exportVehiclesToCSV(veiculos, clientes, ordens);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 transition-colors cursor-pointer border-t border-slate-50"
                  >
                    <Car className="w-3.5 h-3.5 text-amber-600" />
                    <div>
                      <div className="font-bold">Frota de Veículos ({veiculos.length})</div>
                      <div className="text-[10px] text-slate-400">Placas, modelos e manutenções</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCsvMenuOpen(false);
                      exportAllWorkshopDataToCSV(ordens, clientes, veiculos);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 text-emerald-700 font-bold transition-colors cursor-pointer border-t border-slate-100 bg-emerald-50/50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Baixar Todas as Tabelas (CSV)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {activeMainTab === 'os' && (
            <button
              onClick={() => setIsNewOSModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Emitir Nova OS</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: ORDENS DE SERVIÇO */}
      {activeMainTab === 'os' && (
        <div className="space-y-4">
          {/* Search bar & filter pills (MinhaOficina standard) */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por cliente, placa, modelo ou nº da OS..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00a2e8] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="text-slate-400 text-[11px] font-semibold mr-1">Filtrar:</span>
                {['todos', 'aberto', 'em_andamento', 'aguardando_pecas', 'concluido'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-colors ${
                      statusFilter === st
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'todos' ? 'Todas' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle (Tabela vs Kanban) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('tabela')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'tabela'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Visualização em Lista / Tabela"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabela</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Visualização em Quadro Kanban com Arrastar e Soltar"
                >
                  <Kanban className="w-3.5 h-3.5 text-[#00a2e8]" />
                  <span>Quadro Kanban</span>
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'kanban' ? (
            <KanbanBoard
              ordens={filteredOrdens}
              clientes={clientes}
              veiculos={veiculos}
              onUpdateOSStatus={onUpdateOSStatus}
              onOpenNewOS={() => setIsNewOSModalOpen(true)}
              globalSearchTerm={searchTerm}
            />
          ) : (
            /* MinhaOficina Classic Table */
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nº OS</th>
                      <th className="py-3 px-4">Entrada</th>
                    <th className="py-3 px-4">Cliente &amp; Veículo</th>
                    <th className="py-3 px-4">Serviço Solicitado</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrdens.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhuma ordem de serviço encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredOrdens.map((os) => {
                      const client = clientes.find((c) => c.id === os.cliente_id);
                      const vehicle = veiculos.find((v) => v.id === os.veiculo_id);

                      return (
                        <tr key={os.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#00a2e8] tabular-nums">
                            #{os.numero_os}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                            {new Date(os.data_entrada).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{client?.nome_completo}</div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-1">
                              <span className="font-medium text-slate-700">{vehicle?.marca} {vehicle?.modelo}</span>
                              <span className="text-slate-300">·</span>
                              <div className="inline-flex items-center overflow-hidden rounded border border-slate-300 bg-white font-mono text-[9px] shadow-2xs font-bold leading-none select-none">
                                <span className="bg-[#003399] px-1 py-0.5 text-[7px] font-black text-white">BR</span>
                                <span className="px-1.5 py-0.5 text-slate-900 tracking-wider font-extrabold">{vehicle?.placa}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs text-slate-700">
                            <p className="line-clamp-2 leading-relaxed">{os.descricao_problema}</p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="space-y-1.5">
                              {getStatusBadge(os.status)}
                              <div className="flex items-center space-x-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    os.status_pagamento === 'pago'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : os.status_pagamento === 'vencido'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {os.status_pagamento === 'pago' ? 'Pago' : os.status_pagamento === 'vencido' ? 'Vencido' : 'Pendente'}
                                </span>
                              </div>
                              <select
                                value={os.status}
                                onChange={(e) => onUpdateOSStatus(os.id, e.target.value as OrdemServico['status'])}
                                className="block w-full text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none focus:border-[#00a2e8]"
                              >
                                <option value="aberto">Em Aberto</option>
                                <option value="em_andamento">Em Execução</option>
                                <option value="aguardando_pecas">Aguardando Peças</option>
                                <option value="concluido">Finalizada</option>
                                <option value="entregue">Entregue</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap tabular-nums">
                            {formatCurrencyBRL(os.valor_total)}
                            <div className="text-[10px] text-slate-400 font-normal">
                              Pçs: {formatCurrencyBRL(os.pecas_valor)} · M.O: {formatCurrencyBRL(os.mao_de_obra_valor)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center space-x-1.5">
                              {/* Clickable WhatsApp Reminder Link for Pending/Overdue OS */}
                              {(os.status_pagamento === 'pendente' || os.status_pagamento === 'vencido') && (
                                <WhatsAppReminderButton
                                  ordem={os}
                                  cliente={client}
                                  veiculo={vehicle}
                                  variant="compact"
                                  workshopName={systemSettings.nomeOficina}
                                  workshopPhone={systemSettings.telefone}
                                  pixKey={systemSettings.cnpj}
                                />
                              )}

                              <button
                                onClick={() => {
                                  setActiveOSDetail(os);
                                  setOsModalSubTab('cliente');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#00a2e8] font-bold text-xs border border-sky-200 transition-colors inline-flex items-center space-x-1"
                                title="Abrir dados completos da OS"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Abrir</span>
                              </button>

                              <button
                                onClick={() => handleSendWhatsAppOS(os, client?.nome_completo, `${vehicle?.marca} ${vehicle?.modelo}`)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                title="Enviar notificação de status para o cliente via WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setLaudoModalOS(os)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                                title="Imprimir Laudo A4 Oficial ou Enviar via WhatsApp"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}

      {/* VIEW 2: CADASTRO DE CLIENTES */}
      {activeMainTab === 'clientes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cadastro de Clientes da Oficina</h3>
              <p className="text-xs text-slate-500">
                Dados operacionais públicos + dados sigilosos (CPF, endereço) protegidos no schema <strong className="text-amber-600">private</strong>.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Conformidade LGPD Ativa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientes.map((cli) => {
              const cliVehicles = veiculos.filter((v) => v.cliente_id === cli.id);
              const cliOrders = ordens.filter((o) => o.cliente_id === cli.id);

              return (
                <div key={cli.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#00a2e8]/10 text-[#00a2e8] font-black flex items-center justify-center text-sm border border-[#00a2e8]/20">
                        {cli.nome_completo.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{cli.nome_completo}</h4>
                        {cli.nome_fantasia && (
                          <div className="text-xs text-slate-500 font-medium">{cli.nome_fantasia}</div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                      ID: {cli.id}
                    </span>
                  </div>

                  {/* Private Data protected block */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-700">
                      <span className="flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Schema private (Protegido):</span>
                      </span>
                      <span className="font-mono text-slate-400 font-normal">Edge Function Guard</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>CPF: <span className="font-mono text-slate-800 font-medium">{maskSensitiveData(cli.dados_privados?.cpf || '', 'cpf')}</span></div>
                      <div>Telefone: <span className="font-mono text-slate-800 font-medium">{maskSensitiveData(cli.dados_privados?.telefone || '', 'telefone')}</span></div>
                      <div className="col-span-2 text-slate-500">
                        Localidade: {cli.dados_privados?.endereco_cidade} - {cli.dados_privados?.endereco_uf} ({cli.dados_privados?.endereco_bairro})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>{cliVehicles.length} veículo(s) cadastrado(s)</span>
                    <span className="font-semibold text-emerald-600">{cliOrders.length} ordens de serviço</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: FROTA DE VEÍCULOS */}
      {activeMainTab === 'veiculos' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Veículos dos Clientes (Tabela public.veiculos)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {veiculos.map((v) => {
              const client = clientes.find((c) => c.id === v.cliente_id);
              return (
                <div key={v.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-[#00a2e8]/10 text-[#00a2e8] font-mono font-bold text-xs border border-[#00a2e8]/20">
                      {v.placa}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{v.ano}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{v.marca} {v.modelo}</h4>
                  <div className="text-xs text-slate-500">Cor: <span className="text-slate-800">{v.cor}</span></div>
                  <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                    Cliente: <strong className="text-slate-900">{client?.nome_completo}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: PLANEJADOR FINANCEIRO (Recurso exclusivo MinhaOficina) */}
      {activeMainTab === 'financeiro' && (() => {
        const finMonthlyData = calculateMonthlyFinancialData(ordens, '6meses');
        const activeMonth = finMonthlyData[finMonthlyData.length - 1];
        const activeMonthProfit = activeMonth ? activeMonth.lucroLiquido : 0;
        const currentTargetProfit = systemSettings.financialGoals.metaLucro;
        const targetRevenue = systemSettings.financialGoals.faturamentoAlvo;
        const partsLimit = systemSettings.financialGoals.limiteGastosPecas;
        const profitAlert = checkProfitTargetAlert(activeMonthProfit, currentTargetProfit);

        const totalPecasGasto = ordens.reduce((acc, curr) => acc + (curr.pecas_valor || 0), 0);
        const partsAlert = checkPartsExpenseLimit(totalPecasGasto, partsLimit);

        return (
          <div className="space-y-6">
            {/* Header Card with Sub-tabs, Meta Alert Button, PDF, Excel and Goals Config Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Módulo Financeiro MinhaOficina</span>
                  </div>
                  {criticalRevenueAlert.isCritical && (
                    <button
                      type="button"
                      onClick={() => setIsMetaAlertModalOpen(true)}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-black border border-rose-300 animate-pulse hover:bg-rose-200 transition-colors"
                      title="Clique para ver o diagnóstico do faturamento abaixo de 20%"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Alerta Crítico (&lt;20% da Meta)</span>
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Planejador Financeiro &amp; Contas a Receber</h3>
                <p className="text-xs text-slate-500">
                  Acompanhe DRE, metas de faturamento, cobranças automáticas via WhatsApp e exporte relatórios gerenciais em PDF e Excel (.xlsx).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Sub-tab Switcher: DRE vs Tendência vs Metas vs Margem por OS vs Contas a Receber */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 mr-1 flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setFinancialSubTab('dre')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      financialSubTab === 'dre'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-[#00a2e8]" />
                    <span>DRE Geral</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinancialSubTab('tendencia')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      financialSubTab === 'tendencia'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LineChartIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>Tendência 12M</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinancialSubTab('metas')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      financialSubTab === 'metas'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Evolução vs Metas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinancialSubTab('margem_os')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      financialSubTab === 'margem_os'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Margem por OS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinancialSubTab('receber')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      financialSubTab === 'receber'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                    <span>Contas a Receber</span>
                    {receivableMetrics.receivableOrders.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white font-mono ml-0.5">
                        {receivableMetrics.receivableOrders.length}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGoalsModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-all active:scale-[0.98]"
                  title="Configurar metas de faturamento, lucro, limite de peças e dados da oficina no localStorage"
                >
                  <Sliders className="w-4 h-4 text-[#00a2e8]" />
                  <span>Configurar Metas</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    exportFinancialSummaryExcel({
                      ordens,
                      clientes,
                      veiculos,
                      totalRevenue,
                      profitTarget: currentTargetProfit,
                      workshopName: systemSettings.nomeOficina,
                      cnpj: systemSettings.cnpj,
                      phone: systemSettings.telefone,
                    })
                  }
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all active:scale-[0.98]"
                  title="Exportar dados contábeis completos em planilha Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Excel (.xlsx)</span>
                </button>

                {/* PDF Multi-Report Dropdown Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPdfDropdownOpen(!isPdfDropdownOpen)}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    title="Exportar relatórios em formato PDF A4 para impressão e conciliação"
                  >
                    <Printer className="w-4 h-4 text-[#00a2e8]" />
                    <span>Exportar PDF</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isPdfDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isPdfDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsPdfDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                          Relatórios Impressos A4
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsPdfDropdownOpen(false);
                            exportFinancialSummaryPDF({
                              ordens,
                              clientes,
                              veiculos,
                              totalRevenue,
                              workshopName: systemSettings.nomeOficina,
                              cnpj: systemSettings.cnpj,
                              phone: systemSettings.telefone,
                              address: systemSettings.endereco,
                            });
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 transition-colors cursor-pointer"
                        >
                          <TrendingUp className="w-4 h-4 text-[#00a2e8] shrink-0" />
                          <div>
                            <div className="font-bold">1. Demonstrativo DRE Geral</div>
                            <div className="text-[10px] text-slate-400">Resumo de receitas, peças e serviços</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsPdfDropdownOpen(false);
                            exportAccountsReceivablePDF({
                              ordens,
                              clientes,
                              veiculos,
                              workshopName: systemSettings.nomeOficina,
                              cnpj: systemSettings.cnpj,
                              phone: systemSettings.telefone,
                              address: systemSettings.endereco,
                            });
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 transition-colors cursor-pointer border-t border-slate-50"
                        >
                          <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <div className="font-bold">2. Contas a Receber &amp; Cobrança</div>
                            <div className="text-[10px] text-slate-400">Inadimplência, vencimentos e PIX</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsPdfDropdownOpen(false);
                            exportProfitabilityReportPDF({
                              ordens,
                              clientes,
                              veiculos,
                              targetMargin: systemSettings.financialGoals.margemMinima || 40,
                              workshopName: systemSettings.nomeOficina,
                              cnpj: systemSettings.cnpj,
                              phone: systemSettings.telefone,
                              address: systemSettings.endereco,
                            });
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 transition-colors cursor-pointer border-t border-slate-50"
                        >
                          <Percent className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="font-bold">3. Lucratividade &amp; Margem por OS</div>
                            <div className="text-[10px] text-slate-400">Dedução de peças e mão de obra direta</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Critical Revenue Goal Alert Banner (<20% of Target) */}
            <MetaAlertsBanner
              alert={criticalRevenueAlert}
              onOpenModal={() => setIsMetaAlertModalOpen(true)}
              onGoToReceivables={() => setFinancialSubTab('receber')}
            />

            {/* TAB VIEW 1: DRE & OPERATIONAL PERFORMANCE */}
            {financialSubTab === 'dre' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Financial Profit Target Alert Notification Banner */}
            {profitAlert.isBelow ? (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 text-slate-800 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 animate-in fade-in duration-150">
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                        Alerta Gerencial: Lucro Líquido Abaixo da Meta
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-200/80 text-rose-800 font-mono">
                        {profitAlert.percentage}% da meta alcançada
                      </span>
                    </div>
                    <p className="text-xs text-rose-900 font-medium">
                      {profitAlert.message}
                    </p>
                    <p className="text-[11px] text-slate-600 pt-0.5 leading-relaxed">
                      <strong className="text-slate-800">Recomendação de Gestão:</strong> {profitAlert.recommendation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  <div className="p-2.5 bg-white border border-rose-200 rounded-lg text-right font-mono shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-sans font-bold">Déficit a Recuperar</div>
                    <div className="text-sm font-black text-rose-600 tabular-nums">
                      -{formatCurrencyBRL(profitAlert.deficit)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                        Meta Financeira Mensal Superada ({profitAlert.percentage}%)
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-800 font-mono font-bold">
                        Meta: {formatCurrencyBRL(currentTargetProfit)}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 font-medium mt-0.5">
                      {profitAlert.message}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs shrink-0">
                  <span className="text-[10px] text-slate-500 block font-sans">Lucro Líquido Vigente</span>
                  <span className="font-black text-emerald-700 text-sm tabular-nums">
                    {formatCurrencyBRL(activeMonthProfit)}
                  </span>
                </div>
              </div>
            )}

            {/* Parts Expense Ceiling Alert Banner if Exceeded */}
            {partsAlert.isExceeded && (
              <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-black shadow-2xs">
                    !
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        Atenção: Teto de Gastos com Peças Ultrapassado
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-800 font-bold">
                        {partsAlert.percentage}% do teto
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/90 mt-0.5">
                      {partsAlert.message}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGoalsModalOpen(true)}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 shadow-2xs"
                >
                  Ajustar Metas
                </button>
              </div>
            )}

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Receita Bruta Total</span>
                  <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                    Alvo: {formatCurrencyBRL(targetRevenue)}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">{formatCurrencyBRL(totalRevenue)}</div>
                <p className="text-[11px] text-slate-500">Soma de peças e mão de obra de todas as ordens</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Custo de Peças &amp; Insumos</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    partsAlert.isExceeded
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    Teto: {formatCurrencyBRL(partsLimit)}
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-700 font-mono tabular-nums">
                  {formatCurrencyBRL(totalPecasGasto)}
                </div>
                <p className="text-[11px] text-slate-500">Valores repassados aos fornecedores</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Lucro Líquido Estimado</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    Meta: {formatCurrencyBRL(currentTargetProfit)}
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums">
                  {formatCurrencyBRL(totalRevenue * 0.42)}
                </div>
                <p className="text-[11px] text-slate-500">Margem operacional média de 42% sobre serviços</p>
              </div>
            </div>

            {/* Comparative Bar Chart using Recharts with Target Alert badge, MoM growth and ReferenceLine */}
            <FinancialChart
              ordens={ordens}
              profitTarget={currentTargetProfit}
              targetRevenue={targetRevenue}
              partsLimit={partsLimit}
              onTargetChange={(newTarget) => {
                const updated = {
                  ...systemSettings,
                  financialGoals: {
                    ...systemSettings.financialGoals,
                    metaLucro: newTarget,
                  },
                };
                setSystemSettings(updated);
                saveSystemSettingsToStorage(updated);
              }}
              onOpenSettings={() => setIsGoalsModalOpen(true)}
            />

            {/* Quick Navigation Cards to Tendência 12M, Metas and Margem por OS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFinancialSubTab('tendencia')}
                className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-purple-50/50 to-white hover:border-purple-300 transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <LineChartIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-purple-700 transition-colors">
                      Tendência de Faturamento (12M)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Gráfico de linha Recharts com curva anual e médias móveis
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform ml-2 shrink-0">
                  Abrir &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFinancialSubTab('metas')}
                className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-emerald-50/50 to-white hover:border-emerald-300 transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-emerald-700 transition-colors">
                      Evolução vs Metas Estipuladas
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Comparativo de faturamento mensal e atingimento
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform ml-2 shrink-0">
                  Abrir &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFinancialSubTab('margem_os')}
                className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-50/50 to-white hover:border-indigo-300 transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Percent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-700 transition-colors">
                      Margem de Lucro por Ordem
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Subtração de peças e mão de obra do valor pago
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform ml-2 shrink-0">
                  Abrir &rarr;
                </span>
              </button>
            </div>

          {/* Table of Completed Work Orders Contributing to Financial Result */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Ordens de Serviço que Compõem o Resultado</h4>
                <p className="text-xs text-slate-500">Detalhamento de faturamento por veículo e cliente</p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600 tabular-nums">
                {ordens.length} ordens registradas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">OS</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Veículo</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Mão de Obra</th>
                    <th className="py-2.5 px-3 text-right">Peças</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Laudo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ordens.map((os) => {
                    const client = clientes.find((c) => c.id === os.cliente_id);
                    const vehicle = veiculos.find((v) => v.id === os.veiculo_id);
                    return (
                      <tr key={os.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-[#00a2e8] tabular-nums">
                          #{os.numero_os}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {client?.nome_completo}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {vehicle?.modelo} ({vehicle?.placa})
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold capitalize bg-slate-100 text-slate-700">
                            {os.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600">
                          {formatCurrencyBRL(os.mao_de_obra_valor || 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600">
                          {formatCurrencyBRL(os.pecas_valor || 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrencyBRL(os.valor_total)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setLaudoModalOS(os)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Ver Laudo A4"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#00a2e8]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB VIEW 2: TENDÊNCIA DE FATURAMENTO DOS ÚLTIMOS 12 MESES (RECHARTS LINE CHART) */}
      {financialSubTab === 'tendencia' && (
        <AnnualRevenueTrendLineChart
          ordens={ordens}
          onOpenSettings={() => setIsGoalsModalOpen(true)}
          onExportPDF={() =>
            exportFinancialSummaryPDF({
              ordens,
              clientes,
              veiculos,
              totalRevenue,
              workshopName: systemSettings.nomeOficina,
              cnpj: systemSettings.cnpj,
              phone: systemSettings.telefone,
              address: systemSettings.endereco,
            })
          }
        />
      )}

      {/* TAB VIEW 3: EVOLUÇÃO MENSAL DO FATURAMENTO VS METAS ESTIPULADAS (RECHARTS) */}
      {financialSubTab === 'metas' && (
        <RevenueEvolutionVsTargetChart
          ordens={ordens}
          targetRevenue={targetRevenue}
          onOpenSettings={() => setIsGoalsModalOpen(true)}
        />
      )}

      {/* TAB VIEW 3: CÁLCULO DE MARGEM DE LUCRO POR ORDEM DE SERVIÇO (RECHARTS BAR CHART) */}
      {financialSubTab === 'margem_os' && (
        <OSProfitMarginBarChart
          ordens={ordens}
          clientes={clientes}
          veiculos={veiculos}
          targetMargin={systemSettings.financialGoals.margemMinima || 40}
        />
      )}

      {/* TAB VIEW 4: CONTAS A RECEBER & COBRANÇA WHATSAPP */}
      {financialSubTab === 'receber' && (
        <AccountsReceivableView
          ordens={ordens}
          clientes={clientes}
          veiculos={veiculos}
          onOpenWhatsAppBilling={(ordem) => setWhatsappBillingModalOS(ordem)}
          onMarkAsPaid={(orderId, paymentMethod) => {
            if (onUpdateOSPaymentStatus) {
              onUpdateOSPaymentStatus(orderId, 'pago', paymentMethod);
            }
          }}
          onViewOrder={(ordem) => setLaudoModalOS(ordem)}
        />
      )}
    </div>
  );
})()}

      {/* MODAL 1: EMISSÃO DE NOVA OS */}
      {isNewOSModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <MinhaOficinaLogo size="sm" showText={false} />
                <h3 className="text-base font-bold text-slate-900">Emitir Nova Ordem de Serviço</h3>
              </div>
              <button
                onClick={() => setIsNewOSModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOSSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cliente *</label>
                  <select
                    value={newClienteId}
                    onChange={(e) => {
                      setNewClienteId(e.target.value);
                      const available = veiculos.filter((v) => v.cliente_id === e.target.value);
                      if (available.length > 0) setNewVeiculoId(available[0].id);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:border-[#00a2e8]"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome_completo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Veículo *</label>
                  <select
                    value={newVeiculoId}
                    onChange={(e) => setNewVeiculoId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:border-[#00a2e8]"
                  >
                    {clientVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.marca} {v.modelo} ({v.placa})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descrição do Problema / Sintoma *</label>
                <textarea
                  rows={3}
                  value={newDescricao}
                  onChange={(e) => setNewDescricao(e.target.value)}
                  placeholder="Ex: Barulho agudo na frenagem, troca de óleo 5W30, revisão geral..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00a2e8]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Peças (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPecas}
                    onChange={(e) => setNewPecas(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mão de Obra (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMaoDeObra}
                    onChange={(e) => setNewMaoDeObra(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Desconto (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDesconto}
                    onChange={(e) => setNewDesconto(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-between font-mono">
                <span className="text-slate-600 font-sans text-xs">Total Calculado da OS:</span>
                <span className="text-base font-black text-[#00a2e8]">
                  {formatCurrencyBRL(newOSTotals.total)}
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewOSModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#00a2e8] hover:bg-[#0089c7] text-white font-bold shadow-md shadow-[#00a2e8]/20"
                >
                  Salvar Ordem de Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TELA COMPLETA DA ORDEM DE SERVIÇO (EXATO MINHAOOFICINA) */}
      {activeOSDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in duration-150">
            {/* Top Modal Header */}
            <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MinhaOficinaLogo size="sm" showText={false} />
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    Ordem de Serviço Nº {activeOSDetail.numero_os}
                  </h3>
                  <span className="text-xs text-slate-300">
                    Aberta em: {new Date(activeOSDetail.data_entrada).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveOSDetail(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MinhaOficina 6-Tabs Ribbon: Cliente | Serviços | Produtos | Pagamento | Lucro | Impressão */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setOsModalSubTab('cliente')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  osModalSubTab === 'cliente'
                    ? 'bg-[#00a2e8] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>1. Cliente &amp; Veículo</span>
              </button>

              <button
                onClick={() => setOsModalSubTab('servicos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  osModalSubTab === 'servicos'
                    ? 'bg-[#00a2e8] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>2. Serviços / M.O.</span>
              </button>

              <button
                onClick={() => setOsModalSubTab('produtos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  osModalSubTab === 'produtos'
                    ? 'bg-[#00a2e8] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>3. Peças &amp; Produtos</span>
              </button>

              <button
                onClick={() => setOsModalSubTab('pagamento')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  osModalSubTab === 'pagamento'
                    ? 'bg-[#00a2e8] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>4. Forma de Pagamento</span>
              </button>

              <button
                onClick={() => setOsModalSubTab('lucro')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  osModalSubTab === 'lucro'
                    ? 'bg-[#00a2e8] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>5. Análise de Lucro</span>
              </button>

              <button
                onClick={() => setOsModalSubTab('impressao')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  osModalSubTab === 'impressao'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>6. Impressão A4</span>
              </button>
            </div>

            {/* Modal Body & Subtabs */}
            <div className="p-6">
              {/* SUBTAB 1: CLIENTE & VEÍCULO */}
              {osModalSubTab === 'cliente' && (
                <div className="space-y-4 text-xs">
                  {(() => {
                    const client = clientes.find((c) => c.id === activeOSDetail.cliente_id);
                    const vehicle = veiculos.find((v) => v.id === activeOSDetail.veiculo_id);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                          <h4 className="font-bold text-slate-900 text-sm">Dados do Cliente</h4>
                          <div>Nome: <strong className="text-slate-800">{client?.nome_completo}</strong></div>
                          {client?.nome_fantasia && <div>Razão Social: {client.nome_fantasia}</div>}
                          <div>Telefone: <span className="font-mono text-slate-800">{maskSensitiveData(client?.dados_privados?.telefone || '', 'telefone')}</span></div>
                          <div>CPF/CNPJ: <span className="font-mono text-slate-800">{maskSensitiveData(client?.dados_privados?.cpf || '', 'cpf')}</span></div>
                          <span className="text-[10px] text-amber-700 font-semibold block pt-1">
                            🔒 Protegido no schema private (RLS ativo)
                          </span>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                          <h4 className="font-bold text-slate-900 text-sm">Dados do Veículo</h4>
                          <div>Modelo: <strong className="text-slate-800">{vehicle?.marca} {vehicle?.modelo}</strong></div>
                          <div>Placa: <span className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-[#00a2e8]">{vehicle?.placa}</span></div>
                          <div>Ano: {vehicle?.ano} | Cor: {vehicle?.cor}</div>
                          <div>Técnico: <strong className="text-slate-700">{activeOSDetail.tecnico_responsavel}</strong></div>
                        </div>

                        <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                          <span className="font-bold text-slate-700 block">Sintoma / Problema Relatado:</span>
                          <p className="text-slate-800 leading-relaxed text-xs">{activeOSDetail.descricao_problema}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SUBTAB 2: SERVIÇOS */}
              {osModalSubTab === 'servicos' && (
                <div className="space-y-3 text-xs">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-3">Serviço / Mão de Obra</th>
                          <th className="p-3">Horas / Qtd</th>
                          <th className="p-3 text-right">Valor M.O.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-3 font-medium text-slate-800">
                            Mão de Obra Mecânica Geral &amp; Diagnóstico Computadorizado
                          </td>
                          <td className="p-3">1 serviço</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrencyBRL(activeOSDetail.mao_de_obra_valor)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">
                    Subtotal de Serviços: <strong className="text-slate-800">{formatCurrencyBRL(activeOSDetail.mao_de_obra_valor)}</strong>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: PRODUTOS & PEÇAS */}
              {osModalSubTab === 'produtos' && (
                <div className="space-y-3 text-xs">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-3">Peça / Insumo</th>
                          <th className="p-3">Qtd</th>
                          <th className="p-3 text-right">Valor Venda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-3 font-medium text-slate-800">
                            Peças de Reposição Genuínas para {activeOSDetail.descricao_problema.slice(0, 40)}...
                          </td>
                          <td className="p-3">1 kit</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrencyBRL(activeOSDetail.pecas_valor)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">
                    Subtotal de Peças: <strong className="text-slate-800">{formatCurrencyBRL(activeOSDetail.pecas_valor)}</strong>
                  </div>
                </div>
              )}

              {/* SUBTAB 4: PAGAMENTO */}
              {osModalSubTab === 'pagamento' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <h4 className="font-bold text-slate-800">Condições de Pagamento</h4>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 rounded bg-white border border-slate-300 font-semibold">
                          Pix / Cartão / Boleto
                        </span>
                        <span className="text-slate-500">À vista ou em até 3x</span>
                      </div>
                      <div className="pt-2 text-slate-600">
                        Desconto Concedido: <span className="font-mono font-bold text-emerald-600">{formatCurrencyBRL(activeOSDetail.desconto_valor || 0)}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-sky-50 space-y-2 font-mono">
                      <h4 className="font-bold text-slate-800 font-sans">Resumo Financeiro da OS</h4>
                      <div className="flex justify-between">
                        <span>Total de Serviços:</span>
                        <span>{formatCurrencyBRL(activeOSDetail.mao_de_obra_valor)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total de Peças:</span>
                        <span>{formatCurrencyBRL(activeOSDetail.pecas_valor)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Desconto:</span>
                        <span>- {formatCurrencyBRL(activeOSDetail.desconto_valor || 0)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-[#00a2e8] border-t border-sky-200 pt-1">
                        <span>Total a Pagar:</span>
                        <span>{formatCurrencyBRL(activeOSDetail.valor_total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Reminder Section inside Payment subtab */}
                  {(activeOSDetail.status_pagamento === 'pendente' || activeOSDetail.status_pagamento === 'vencido') && (
                    <div className="pt-2">
                      <WhatsAppReminderButton
                        ordem={activeOSDetail}
                        cliente={clientes.find((c) => c.id === activeOSDetail.cliente_id)}
                        veiculo={veiculos.find((v) => v.id === activeOSDetail.veiculo_id)}
                        variant="full"
                        workshopName={systemSettings.nomeOficina}
                        workshopPhone={systemSettings.telefone}
                        pixKey={systemSettings.cnpj}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 5: ANÁLISE DE LUCRO (MINHAOFICINA EXCLUSIVE) */}
              {osModalSubTab === 'lucro' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 text-sm">Demonstrativo de Lucro Líquido Real</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                        Margem: 52%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 font-mono text-center">
                      <div className="p-2.5 rounded bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-sans block">Receita Cobrada</span>
                        <span className="font-bold text-slate-900">{formatCurrencyBRL(activeOSDetail.valor_total)}</span>
                      </div>
                      <div className="p-2.5 rounded bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-sans block">Custo de Peças (Base)</span>
                        <span className="font-bold text-amber-700">{formatCurrencyBRL(activeOSDetail.pecas_valor * 0.65)}</span>
                      </div>
                      <div className="p-2.5 rounded bg-white border border-emerald-300">
                        <span className="text-[10px] text-emerald-700 font-sans font-bold block">Lucro Líquido</span>
                        <span className="font-black text-emerald-700">
                          {formatCurrencyBRL(activeOSDetail.valor_total - (activeOSDetail.pecas_valor * 0.65))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 6: IMPRESSÃO A4 (MINHAOFICINA STANDARD) */}
              {osModalSubTab === 'impressao' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">
                      Visualização prévia do laudo impresso padrão MinhaOficina (formato A4).
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>Imprimir Laudo A4</span>
                    </button>
                  </div>

                  {/* Printable sheet container */}
                  <div
                    id="printable-os"
                    className="p-6 bg-white border border-slate-300 rounded-xl shadow-xs space-y-4 text-slate-900 font-sans"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                      <div className="flex items-center space-x-2">
                        <MinhaOficinaLogo size="md" />
                      </div>
                      <div className="text-right text-[11px]">
                        <div className="font-bold text-sm">ORDEM DE SERVIÇO Nº {activeOSDetail.numero_os}</div>
                        <div>Data: {new Date(activeOSDetail.data_entrada).toLocaleDateString('pt-BR')}</div>
                        <div>Status: {activeOSDetail.status.toUpperCase()}</div>
                      </div>
                    </div>

                    {/* Customer & Vehicle Info Grid */}
                    <div className="grid grid-cols-2 gap-4 border border-slate-200 p-3 rounded-lg text-xs">
                      <div>
                        <span className="font-bold block text-slate-800">CLIENTE:</span>
                        <div>{clientes.find((c) => c.id === activeOSDetail.cliente_id)?.nome_completo}</div>
                        <div>Telefone: {clientes.find((c) => c.id === activeOSDetail.cliente_id)?.dados_privados?.telefone}</div>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-800">VEÍCULO:</span>
                        <div>
                          {veiculos.find((v) => v.id === activeOSDetail.veiculo_id)?.marca}{' '}
                          {veiculos.find((v) => v.id === activeOSDetail.veiculo_id)?.modelo}
                        </div>
                        <div>Placa: {veiculos.find((v) => v.id === activeOSDetail.veiculo_id)?.placa}</div>
                      </div>
                    </div>

                    {/* Problem */}
                    <div className="border border-slate-200 p-3 rounded-lg text-xs space-y-1">
                      <span className="font-bold block text-slate-800">SERVIÇO SOLICITADO / RELATO:</span>
                      <p>{activeOSDetail.descricao_problema}</p>
                    </div>

                    {/* Totals */}
                    <div className="border-t-2 border-slate-800 pt-3 flex justify-between items-center text-xs">
                      <div className="text-slate-500">
                        Técnico Responsável: {activeOSDetail.tecnico_responsavel}
                      </div>
                      <div className="text-right font-mono text-sm">
                        Total da Ordem de Serviço: <strong className="text-base text-slate-900">{formatCurrencyBRL(activeOSDetail.valor_total)}</strong>
                      </div>
                    </div>

                    {/* Signature lines */}
                    <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                      <div>
                        <div className="border-t border-slate-400 pt-1">Assinatura do Cliente</div>
                        <span className="text-[10px] text-slate-400">Autorizo a execução dos serviços acima</span>
                      </div>
                      <div>
                        <div className="border-t border-slate-400 pt-1">Mecânica Responsável</div>
                        <span className="text-[10px] text-slate-400">Garantia legal de 90 dias conforme CDC</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visualizador de Laudo A4 e WhatsApp Oficial */}
      <OrdemServicoLaudoModal
        os={laudoModalOS}
        cliente={clientes.find((c) => c.id === laudoModalOS?.cliente_id)}
        veiculo={veiculos.find((v) => v.id === laudoModalOS?.veiculo_id)}
        isOpen={!!laudoModalOS}
        onClose={() => setLaudoModalOS(null)}
        onUpdateStatus={(id, status) => {
          onUpdateOSStatus(id, status);
          if (laudoModalOS && laudoModalOS.id === id) {
            setLaudoModalOS({ ...laudoModalOS, status });
          }
        }}
      />

      {/* Modal de Configuração de Metas e Sistema da Oficina (Salvo em localStorage) */}
      <FinancialGoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        systemSettings={systemSettings}
        onSaveSettings={(newSettings) => {
          setSystemSettings(newSettings);
          saveSystemSettingsToStorage(newSettings);
        }}
      />

      {/* Modal de Alertas de Meta Crítica (<20%) */}
      <MetaAlertsModal
        isOpen={isMetaAlertModalOpen}
        onClose={() => setIsMetaAlertModalOpen(false)}
        alert={criticalRevenueAlert}
        onGoToReceivables={() => {
          setActiveMainTab('financeiro');
          setFinancialSubTab('receber');
        }}
        onGoToKanban={() => {
          setActiveMainTab('os');
          setViewMode('kanban');
        }}
        onOpenSettings={() => setIsGoalsModalOpen(true)}
      />

      {/* Modal de Lembrete de Cobrança WhatsApp (Contas a Receber) */}
      <WhatsAppBillingModal
        isOpen={!!whatsappBillingModalOS}
        onClose={() => setWhatsappBillingModalOS(null)}
        ordem={whatsappBillingModalOS}
        cliente={clientes.find((c) => c.id === whatsappBillingModalOS?.cliente_id)}
        veiculo={veiculos.find((v) => v.id === whatsappBillingModalOS?.veiculo_id)}
        workshopName={systemSettings.nomeOficina}
        workshopPhone={systemSettings.telefone}
        onMarkAsPaid={(orderId, paymentMethod) => {
          if (onUpdateOSPaymentStatus) {
            onUpdateOSPaymentStatus(orderId, 'pago', paymentMethod);
          }
        }}
      />
    </div>
  );
};
