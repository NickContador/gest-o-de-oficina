import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  Target,
  DollarSign,
  Wrench,
  Package,
  Calendar,
  FileSpreadsheet,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  Award,
  Sparkles,
  ChevronRight,
  FileText,
  Car,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  calculateDashboardMetrics,
  formatCurrencyBRL,
  loadFinancialGoalsFromStorage,
  checkCriticalRevenueAlert,
  generateCustomerRecoveryPlan,
  calculate6MonthGrowthMetrics,
} from '../utils/workshopLogic.ts';
import {
  exportOrdersToCSV,
  exportAllWorkshopDataToCSV,
} from '../services/csvExportService.ts';
import { CustomerRecoveryDiagnosticModal } from './CustomerRecoveryDiagnosticModal.tsx';
import { MonthlyRevenueGrowthComparisonChart } from './MonthlyRevenueGrowthComparisonChart.tsx';
import { WhatsAppReminderButton } from './WhatsAppReminderButton.tsx';


interface DashboardViewProps {
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  onNavigateTab: (tab: string) => void;
  onOpenNewOS: () => void;
  onOpenDatabaseBackup: () => void;
}

const SERVICE_COLORS = [
  '#00a2e8', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Sky
  '#64748b', // Slate
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  ordens,
  clientes,
  veiculos,
  onNavigateTab,
  onOpenNewOS,
  onOpenDatabaseBackup,
}) => {
  const [isCustomerRecoveryOpen, setIsCustomerRecoveryOpen] = useState(false);

  const settings = useMemo(() => loadFinancialGoalsFromStorage(), []);
  const metrics = useMemo(() => {
    return calculateDashboardMetrics(ordens, settings.faturamentoAlvo || 25000);
  }, [ordens, settings]);

  const criticalAlert = useMemo(() => {
    return checkCriticalRevenueAlert(metrics.totalRevenue, metrics.targetRevenue, ordens);
  }, [metrics, ordens]);

  const recoveryPlan = useMemo(() => {
    return generateCustomerRecoveryPlan(ordens, clientes, veiculos, metrics.targetRevenue);
  }, [ordens, clientes, veiculos, metrics.targetRevenue]);

  const sixMonthGrowth = useMemo(() => {
    return calculate6MonthGrowthMetrics(ordens);
  }, [ordens]);

  // Orders with pending or overdue payment for clickable WhatsApp reminders
  const pendingRemindersList = useMemo(() => {
    return ordens.filter(
      (o) => o.status_pagamento === 'pendente' || o.status_pagamento === 'vencido'
    );
  }, [ordens]);

  // Data for Revenue vs Target Comparison Chart
  const revenueComparisonData = useMemo(() => {
    return [
      {
        nome: 'Performance Mensal',
        faturado: metrics.totalRevenue,
        meta: metrics.targetRevenue,
      },
    ];
  }, [metrics]);


  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Executive Top Hero Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Business Intelligence (BI)</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {ordens.length} ordens monitoradas em tempo real
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Painel Executivo de Performance da Oficina
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhe indicadores de faturamento vs meta, ticket médio por ordem e frequência dos serviços mais demandados.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Diagnostic & Customer Recovery Trigger */}
          <button
            type="button"
            onClick={() => setIsCustomerRecoveryOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-bold text-xs border transition-all active:scale-[0.98] cursor-pointer ${
              criticalAlert.isCritical
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-xs ring-2 ring-rose-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Abrir diagnóstico e sugestões de recuperação de clientes"
          >
            <ShieldAlert
              className={`w-4 h-4 ${
                criticalAlert.isCritical ? 'text-rose-600 animate-pulse' : 'text-slate-500'
              }`}
            />
            <span>Diagnóstico &amp; Recuperação</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                criticalAlert.isCritical
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {recoveryPlan.sugestoes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenDatabaseBackup}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all active:scale-[0.98] cursor-pointer"
            title="Gerenciar backups do banco de dados no Local e no Google Drive"
          >
            <Database className="w-4 h-4 text-[#00a2e8]" />
            <span>Banco &amp; Google Drive</span>
          </button>

          <button
            type="button"
            onClick={() => exportAllWorkshopDataToCSV(ordens, clientes, veiculos)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Baixar todos os dados em arquivos CSV estruturados para Excel e Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewOS}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#00a2e8] hover:bg-[#0091d0] text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>Nova OS</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Alert Component (< 20% of Target Threshold) */}
      {criticalAlert.isCritical && (
        <div className="p-5 rounded-2xl border-2 border-rose-300 bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs relative">
              <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                  Alerta Crítico de Faturamento
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-200 text-rose-950 border border-rose-300">
                  {criticalAlert.percentage}% da Meta (Piso de Segurança: 20%)
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Déficit de {formatCurrencyBRL(criticalAlert.deficitToThreshold)}
                </span>
              </div>

              <h3 className="text-base font-black text-rose-950">
                Faturamento Realizado Abaixo do Piso de Segurança de 20% da Meta
              </h3>

              <p className="text-xs text-rose-900/90 leading-relaxed max-w-3xl">
                O faturamento concluído apurado da oficina é de <strong className="font-mono text-rose-950">{formatCurrencyBRL(metrics.totalRevenue)}</strong> em relação à meta de <strong className="font-mono text-slate-800">{formatCurrencyBRL(metrics.targetRevenue)}</strong>. Foram mapeados <strong className="font-mono text-emerald-800">{formatCurrencyBRL(recoveryPlan.totalPotencialRecuperavel)}</strong> em oportunidades de recebimento imediato e fechamento de orçamentos pendentes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCustomerRecoveryOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-rose-200" />
              <span>Diagnóstico &amp; Recuperação ({recoveryPlan.sugestoes.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {criticalAlert.unpaidCompletedCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('financeiro')}
                className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-rose-300 shadow-2xs transition-all cursor-pointer"
                title="Cobrar contas a receber no módulo financeiro"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cobrar a Receber</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Key Performance Indicators (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue vs Target */}
        <div
          className={`p-5 rounded-2xl border bg-white shadow-2xs space-y-2 transition-all ${
            criticalAlert.isCritical ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center space-x-1.5">
              <DollarSign className={`w-4 h-4 ${criticalAlert.isCritical ? 'text-rose-600' : 'text-emerald-600'}`} />
              <span>Faturamento Realizado</span>
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                criticalAlert.isCritical
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 cursor-pointer hover:bg-rose-200'
                  : metrics.isTargetAchieved
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
              onClick={criticalAlert.isCritical ? () => setIsCustomerRecoveryOpen(true) : undefined}
              title={criticalAlert.isCritical ? 'Clique para abrir o diagnóstico de recuperação' : undefined}
            >
              {criticalAlert.isCritical
                ? `Critico: ${metrics.revenueAchievementRate}%`
                : `${metrics.revenueAchievementRate}% da Meta`}
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {formatCurrencyBRL(metrics.totalRevenue)}
          </div>

          {/* Progress Bar vs Target */}
          <div className="space-y-1 pt-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  criticalAlert.isCritical
                    ? 'bg-rose-600'
                    : metrics.isTargetAchieved
                    ? 'bg-emerald-500'
                    : 'bg-[#00a2e8]'
                }`}
                style={{ width: `${Math.min(100, metrics.revenueAchievementRate)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Alvo: {formatCurrencyBRL(metrics.targetRevenue)}</span>
              <span className={metrics.revenueSurplusDeficit >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                {metrics.revenueSurplusDeficit >= 0
                  ? `+${formatCurrencyBRL(metrics.revenueSurplusDeficit)}`
                  : formatCurrencyBRL(metrics.revenueSurplusDeficit)}
              </span>
            </div>
          </div>
        </div>

        {/* Average Ticket Price */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">

            <span className="flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-[#00a2e8]" />
              <span>Ticket Médio por OS</span>
            </span>
            <span className="text-[10px] font-mono bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100">
              {metrics.completedOrdersCount} OS Fechadas
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {formatCurrencyBRL(metrics.averageTicketPrice)}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
            <span>Peças: {formatCurrencyBRL(metrics.averagePartsTicket)}</span>
            <span>M.O: {formatCurrencyBRL(metrics.averageLaborTicket)}</span>
          </div>
        </div>

        {/* Most Frequent Service Highlight */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Serviço Mais Frequente</span>
            </span>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
              Top #1 Demanda
            </span>
          </div>

          <div className="text-base font-black text-slate-900 truncate" title={metrics.mostFrequentServices[0]?.categoria}>
            {metrics.mostFrequentServices[0]?.categoria || 'Manutenção Geral'}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
            <span>
              {metrics.mostFrequentServices[0]?.contagem || 0} execuções ({metrics.mostFrequentServices[0]?.percentual || 0}%)
            </span>
            <span className="font-bold text-slate-700">
              {formatCurrencyBRL(metrics.mostFrequentServices[0]?.receitaTotal || 0)}
            </span>
          </div>
        </div>

        {/* Operational Flow in Workshop */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Carga Atual no Pátio</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('kanban')}
              className="text-[10px] font-bold text-[#00a2e8] hover:underline"
            >
              Ver Kanban &rarr;
            </button>
          </div>

          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {metrics.activeOrdersCount} veículos ativos
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
            <span>{ordens.filter((o) => o.status === 'em_andamento').length} em box</span>
            <span>{ordens.filter((o) => o.status === 'aguardando_pecas').length} aguardando peças</span>
          </div>
        </div>
      </div>

      {/* 3. Main Business Intelligence Visual Charts (Recharts Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: Most Frequent Services (BarChart Recharts) - 7 cols */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-[#00a2e8]" />
                <span>Serviços Mais Frequentes (Volume &amp; Receita)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Distribuição dos tipos de intervenções mecânicas mais demandadas pelos clientes
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportOrdersToCSV(ordens, clientes, veiculos)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono transition-colors flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
              title="Exportar dados de serviços em CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar CSV</span>
            </button>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.mostFrequentServices}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  type="category"
                  dataKey="categoria"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  width={140}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'contagem' ? `${value} ordens` : formatCurrencyBRL(value),
                    name === 'contagem' ? 'Frequência de OS' : 'Receita Gerada',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="contagem" name="Frequência de OS" radius={[0, 6, 6, 0]}>
                  {metrics.mostFrequentServices.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SERVICE_COLORS[index % SERVICE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Service Detail Mini-Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            {metrics.mostFrequentServices.slice(0, 3).map((item, idx) => (
              <div
                key={item.categoria}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-0.5"
              >
                <div className="flex items-center space-x-1.5 font-bold text-slate-800 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: SERVICE_COLORS[idx] }}
                  />
                  <span className="truncate">{item.categoria}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{item.contagem} OS</span>
                  <span className="font-bold text-slate-700">
                    {formatCurrencyBRL(item.receitaTotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 2: Revenue vs Monthly Target & Pipeline - 5 cols */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>Receita Total vs Meta Mensal</span>
              </h3>
              <p className="text-xs text-slate-500">
                Atingimento financeiro estipulado para a oficina
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('financeiro')}
              className="text-xs font-bold text-[#00a2e8] hover:underline"
            >
              Ver DRE &rarr;
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueComparisonData}
                margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="nome" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatCurrencyBRL(value),
                    name === 'faturado' ? 'Receita Realizada' : 'Meta Estipulada',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={metrics.targetRevenue}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Meta: ${formatCurrencyBRL(metrics.targetRevenue)}`,
                    position: 'insideTopLeft',
                    fill: '#10b981',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                {/* 20% Safety Floor Reference Line */}
                <ReferenceLine
                  y={criticalAlert.thresholdValue}
                  stroke="#e11d48"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Piso 20%: ${formatCurrencyBRL(criticalAlert.thresholdValue)}`,
                    position: 'insideBottomRight',
                    fill: '#e11d48',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Bar
                  dataKey="faturado"
                  name="Receita Realizada"
                  fill={criticalAlert.isCritical ? '#e11d48' : '#00a2e8'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={55}
                />
                <Bar
                  dataKey="meta"
                  name="Meta Estipulada"
                  fill="#cbd5e1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={55}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Breakdown Box */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Taxa de Atingimento:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded ${
                  criticalAlert.isCritical
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : metrics.isTargetAchieved
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {metrics.revenueAchievementRate}% {criticalAlert.isCritical && '(Abaixo de 20%)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span>Saldo Excedente/Déficit:</span>
              <span
                className={`font-bold ${
                  metrics.revenueSurplusDeficit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {metrics.revenueSurplusDeficit >= 0
                  ? `+${formatCurrencyBRL(metrics.revenueSurplusDeficit)} (Superávit)`
                  : `${formatCurrencyBRL(metrics.revenueSurplusDeficit)} (Déficit)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Monthly Revenue Growth Trends (Last 6 Months) Comparison Chart */}
      <MonthlyRevenueGrowthComparisonChart
        metrics={sixMonthGrowth}
        onNavigateToFinancial={() => onNavigateTab('financeiro')}
      />

      {/* 5. Clickable WhatsApp Reminders Section (Pendente & Vencido) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cobrança Imediata</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {pendingRemindersList.length} ordens aguardando pagamento
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-1 flex items-center space-x-2">
              <span className="text-emerald-600">💬</span>
              <span>Lembretes de Pagamento via WhatsApp (Direto ao Telefone do Cliente)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Dispare lembretes personalizados com chave Pix e dados da OS com um único clique para as ordens com status pendente ou vencido.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('financeiro')}
            className="text-xs font-bold text-[#00a2e8] hover:underline self-start sm:self-auto cursor-pointer"
          >
            Gerenciar em Contas a Receber &rarr;
          </button>
        </div>

        {pendingRemindersList.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Nenhuma ordem com pagamento pendente ou vencido no momento. Todas as ordens estão em dia!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingRemindersList.slice(0, 6).map((os) => {
              const client = clientes.find((c) => c.id === os.cliente_id);
              const vehicle = veiculos.find((v) => v.id === os.veiculo_id);
              const isOverdue = os.status_pagamento === 'vencido';

              return (
                <div
                  key={os.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    isOverdue
                      ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#00a2e8] text-xs">
                        OS #{os.numero_os}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isOverdue ? 'Vencido' : 'Pendente'}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-xs truncate">
                      {client?.nome_completo || 'Cliente'}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 font-mono">
                      <span>{vehicle?.marca} {vehicle?.modelo}</span>
                      <span>·</span>
                      <span className="font-bold text-slate-700">{vehicle?.placa}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 font-mono">
                      <span className="text-slate-500">Valor Total:</span>
                      <span className="font-black text-slate-900 tabular-nums">
                        {formatCurrencyBRL(os.valor_total)}
                      </span>
                    </div>
                  </div>

                  {/* Clickable WhatsApp Reminder Link */}
                  <div className="pt-1">
                    <WhatsAppReminderButton
                      ordem={os}
                      cliente={client}
                      veiculo={vehicle}
                      variant="compact"
                      className="w-full justify-center"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Quick Navigation & Offline Reporting Hub */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-mono font-bold">
            <Database className="w-4 h-4" />
            <span>SEGURANÇA &amp; RELATÓRIOS OFFLINE</span>
          </div>
          <h4 className="text-base font-bold text-white">
            Sincronização de Banco de Dados Local &amp; Backup Google Drive
          </h4>
          <p className="text-xs text-slate-300 max-w-2xl">
            Exporte registros de OS, clientes e veículos em formato CSV para planilhas ou faça o backup seguro da estrutura completa localmente e na nuvem.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={onOpenDatabaseBackup}
            className="px-4 py-2.5 rounded-xl bg-[#00a2e8] hover:bg-[#0091d0] text-white font-bold text-xs transition-all active:scale-[0.98] shadow-xs cursor-pointer flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Gerenciar Banco de Dados</span>
          </button>
        </div>
      </div>

      {/* Customer Recovery & Diagnostic Modal */}
      <CustomerRecoveryDiagnosticModal
        isOpen={isCustomerRecoveryOpen}
        onClose={() => setIsCustomerRecoveryOpen(false)}
        ordens={ordens}
        clientes={clientes}
        veiculos={veiculos}
        targetRevenue={metrics.targetRevenue}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};

