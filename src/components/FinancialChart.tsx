import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Percent,
} from 'lucide-react';
import { OrdemServico } from '../data/mockData.ts';
import {
  calculateMonthlyFinancialData,
  checkProfitTargetAlert,
  formatCurrencyBRL,
} from '../utils/workshopLogic.ts';

interface FinancialChartProps {
  ordens: OrdemServico[];
  profitTarget?: number;
  targetRevenue?: number;
  partsLimit?: number;
  onTargetChange?: (newTarget: number) => void;
  onOpenSettings?: () => void;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  ordens,
  profitTarget = 12000,
  targetRevenue = 25000,
  partsLimit = 8000,
  onTargetChange,
  onOpenSettings,
}) => {
  const [period, setPeriod] = useState<'6meses' | '12meses' | 'trimestre'>('6meses');
  const [chartViewMode, setChartViewMode] = useState<'geral' | 'crescimento'>('geral');
  const [showTargetPresets, setShowTargetPresets] = useState(false);

  const monthlyData = calculateMonthlyFinancialData(ordens, period);

  // Consolidated aggregates for the chosen period
  const totalReceitaPeriodo = monthlyData.reduce((acc, curr) => acc + curr.receitaBruta, 0);
  const totalCustoPecas = monthlyData.reduce((acc, curr) => acc + curr.custoPecas, 0);
  const totalLucroPeriodo = monthlyData.reduce((acc, curr) => acc + curr.lucroLiquido, 0);
  const margemMediaPeriodo = totalReceitaPeriodo > 0
    ? Math.round((totalLucroPeriodo / totalReceitaPeriodo) * 100)
    : 0;

  // Average MoM Growth
  const validMoMMonths = monthlyData.filter((m) => m.receitaMesAnterior && m.receitaMesAnterior > 0);
  const avgMoMGrowth = validMoMMonths.length > 0
    ? Number((validMoMMonths.reduce((acc, curr) => acc + (curr.crescimentoMoM || 0), 0) / validMoMMonths.length).toFixed(1))
    : 0;

  // Latest month in data (current active month)
  const latestMonth = monthlyData[monthlyData.length - 1];
  const latestProfit = latestMonth ? latestMonth.lucroLiquido : 0;
  const currentTargetAlert = checkProfitTargetAlert(latestProfit, profitTarget);
  const latestMoM = latestMonth ? latestMonth.crescimentoMoM || 0 : 0;
  const isLatestGrowthPositive = latestMonth ? latestMonth.isPositiveGrowth : true;

  // Custom Recharts Tooltip for General Breakdown View
  const CustomTooltipGeneral = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      const itemAlert = checkProfitTargetAlert(dataItem.lucroLiquido, profitTarget);
      const isAbove = !itemAlert.isBelow;

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[230px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>{dataItem.mesCompleto}</span>
            <span className="text-[10px] text-slate-400 font-mono">{dataItem.ordensCount} OS</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sky-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00a2e8]" />
                <span>Receita Bruta:</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                {formatCurrencyBRL(dataItem.receitaBruta)}
              </span>
            </div>

            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Custo de Peças:</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                {formatCurrencyBRL(dataItem.custoPecas)}
              </span>
            </div>

            <div className="flex items-center justify-between text-emerald-400 border-t border-slate-800 pt-1">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold">Lucro Líquido:</span>
              </span>
              <span className="font-mono font-black tabular-nums">
                {formatCurrencyBRL(dataItem.lucroLiquido)}
              </span>
            </div>
          </div>

          {/* Target comparison pill inside tooltip */}
          <div className={`p-1.5 rounded-md text-[10px] font-semibold flex items-center justify-between border ${
            isAbove
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
              : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
          }`}>
            <span className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>Meta: {formatCurrencyBRL(profitTarget)}</span>
            </span>
            <span className="font-mono font-bold">
              {itemAlert.percentage}% {isAbove ? '✓' : `(-${formatCurrencyBRL(itemAlert.deficit)})`}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
            <span>Margem Operacional:</span>
            <span className="font-bold text-slate-200 font-mono">{dataItem.margem}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for MoM Growth View
  const CustomTooltipMoM = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      const isPositive = dataItem.isPositiveGrowth ?? (dataItem.crescimentoMoM >= 0);
      const mom = dataItem.crescimentoMoM || 0;
      const diffVal = dataItem.crescimentoValor || 0;

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[240px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>{dataItem.mesCompleto}</span>
            <span className="text-[10px] text-slate-400 font-mono">Comparativo MoM</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sky-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00a2e8]" />
                <span>Receita Mês Atual:</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                {formatCurrencyBRL(dataItem.receitaBruta)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Mês Anterior:</span>
              </span>
              <span className="font-mono font-medium tabular-nums text-slate-300">
                {formatCurrencyBRL(dataItem.receitaMesAnterior || 0)}
              </span>
            </div>
          </div>

          {/* MoM Growth Highlight Card */}
          <div className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-between ${
            isPositive
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
              : 'bg-rose-950/80 text-rose-300 border-rose-700/80'
          }`}>
            <span className="flex items-center space-x-1.5">
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              )}
              <span>Crescimento MoM:</span>
            </span>
            <span className="font-mono text-sm font-black tabular-nums">
              {isPositive ? `+${mom}%` : `${mom}%`}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
            <span>Diferença Nominal:</span>
            <span className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {diffVal >= 0 ? `+${formatCurrencyBRL(diffVal)}` : `-${formatCurrencyBRL(Math.abs(diffVal))}`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const presetTargets = [9000, 12000, 15000, 18000];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
      {/* Header, Status Badge and Period Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#00a2e8]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Evolução &amp; Comparativo de Receita Mensal
              </h3>
            </div>

            {/* Visual Status Badge on Bar Chart Header */}
            {currentTargetAlert.isBelow ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Mês Atual: Abaixo da Meta ({currentTargetAlert.percentage}%)</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Mês Atual: Meta Atingida ({currentTargetAlert.percentage}%)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Receita bruta vs custo direto de peças vs lucro líquido apurado da oficina.
          </p>
        </div>

        {/* Target Manager & Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setChartViewMode('geral')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center space-x-1 ${
                chartViewMode === 'geral'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Visão Geral</span>
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('crescimento')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center space-x-1 ${
                chartViewMode === 'crescimento'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Crescimento MoM</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                isLatestGrowthPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {latestMoM >= 0 ? `+${latestMoM}%` : `${latestMoM}%`}
              </span>
            </button>
          </div>

          {/* Configurar Metas Button */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
              title="Abrir modal de configuração de metas e limites do sistema"
            >
              <Sliders className="w-3.5 h-3.5 text-[#00a2e8]" />
              <span>Configurar Metas</span>
            </button>
          )}

          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setPeriod('6meses')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                period === '6meses'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6M
            </button>
            <button
              type="button"
              onClick={() => setPeriod('12meses')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                period === '12meses'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12M
            </button>
            <button
              type="button"
              onClick={() => setPeriod('trimestre')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                period === 'trimestre'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tri
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: VISÃO GERAL (Receita, Custo e Lucro) */}
      {chartViewMode === 'geral' && (
        <div className="space-y-5">
          {/* Mini KPI summary strip for the selected period */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Faturamento no Período
              </span>
              <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                {formatCurrencyBRL(totalReceitaPeriodo)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Custo Peças Aplicadas
              </span>
              <span className="text-base font-black text-amber-700 font-mono tabular-nums">
                {formatCurrencyBRL(totalCustoPecas)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Lucro Líquido Acumulado
              </span>
              <span className="text-base font-black text-emerald-600 font-mono tabular-nums">
                {formatCurrencyBRL(totalLucroPeriodo)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Margem Líquida Média
              </span>
              <span className="text-base font-black text-[#00a2e8] font-mono tabular-nums">
                {margemMediaPeriodo}%
              </span>
            </div>
          </div>

          {/* Recharts BarChart Canvas with ReferenceLine */}
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip content={<CustomTooltipGeneral />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', fontWeight: 600 }}
                  iconType="circle"
                  iconSize={8}
                />

                {/* Target Reference Line */}
                <ReferenceLine
                  y={profitTarget}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Meta: ${formatCurrencyBRL(profitTarget)}`,
                    position: 'insideTopRight',
                    fill: '#dc2626',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />

                <Bar
                  dataKey="receitaBruta"
                  name="Receita Bruta"
                  fill="#00a2e8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="custoPecas"
                  name="Custo de Peças"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="lucroLiquido"
                  name="Lucro Líquido"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Target Status Badge Strip under Chart */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-rose-500" />
                <span>Desempenho Individual por Mês vs Meta de Lucro ({formatCurrencyBRL(profitTarget)})</span>
              </span>
              <span className="text-[11px] text-slate-400">Passe o cursor sobre as barras para detalhes</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {monthlyData.map((m) => {
                const isBelow = m.lucroLiquido < profitTarget;
                const diff = m.lucroLiquido - profitTarget;
                const pct = Math.round((m.lucroLiquido / profitTarget) * 100);

                return (
                  <div
                    key={m.mes}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      isBelow
                        ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">{m.mes}</div>
                    <div className="text-xs font-mono font-black tabular-nums my-0.5">
                      {formatCurrencyBRL(m.lucroLiquido)}
                    </div>
                    <div
                      className={`text-[9px] font-bold px-1 py-0.5 rounded inline-block ${
                        isBelow
                          ? 'bg-rose-200/80 text-rose-800'
                          : 'bg-emerald-200/80 text-emerald-800'
                      }`}
                    >
                      {isBelow ? `-${formatCurrencyBRL(Math.abs(diff))}` : `${pct}% ✓`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CRESCIMENTO MÊS A MÊS (MoM) COM SETAS VERDES/VERMELHAS */}
      {chartViewMode === 'crescimento' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* MoM Performance Cards Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                Receita Mês Atual ({latestMonth?.mes})
              </span>
              <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                {formatCurrencyBRL(latestMonth?.receitaBruta || 0)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Mesmo Período (Mês Anterior)
              </span>
              <span className="text-base font-black text-slate-700 font-mono tabular-nums">
                {formatCurrencyBRL(latestMonth?.receitaMesAnterior || 0)}
              </span>
            </div>

            {/* Current Month MoM badge card */}
            <div className={`p-3 rounded-lg border ${
              isLatestGrowthPositive
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-rose-50 border-rose-300'
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                isLatestGrowthPositive ? 'text-emerald-800' : 'text-rose-800'
              }`}>
                Variação Mês Atual vs Anterior
              </span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                {isLatestGrowthPositive ? (
                  <ArrowUp className="w-5 h-5 text-emerald-600 stroke-[3]" />
                ) : (
                  <ArrowDown className="w-5 h-5 text-rose-600 stroke-[3]" />
                )}
                <span className={`text-base font-black font-mono tabular-nums ${
                  isLatestGrowthPositive ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {latestMoM >= 0 ? `+${latestMoM}%` : `${latestMoM}%`}
                </span>
                <span className={`text-[10px] font-medium font-mono ${
                  isLatestGrowthPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  ({latestMonth?.crescimentoValor && latestMonth.crescimentoValor >= 0 ? '+' : ''}{formatCurrencyBRL(latestMonth?.crescimentoValor || 0)})
                </span>
              </div>
            </div>

            {/* Average MoM growth card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Crescimento Médio no Período
              </span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                {avgMoMGrowth >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-rose-600 stroke-[2.5]" />
                )}
                <span className={`text-base font-black font-mono tabular-nums ${
                  avgMoMGrowth >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {avgMoMGrowth >= 0 ? `+${avgMoMGrowth}%` : `${avgMoMGrowth}%`}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">ao mês</span>
              </div>
            </div>
          </div>

          {/* Recharts MoM Comparative Bar Chart */}
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip content={<CustomTooltipMoM />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', fontWeight: 600 }}
                  iconType="circle"
                  iconSize={8}
                />

                {/* Target Revenue Reference Line */}
                <ReferenceLine
                  y={targetRevenue}
                  stroke="#0284c7"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Alvo Faturamento: ${formatCurrencyBRL(targetRevenue)}`,
                    position: 'insideTopRight',
                    fill: '#0284c7',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />

                <Bar
                  dataKey="receitaBruta"
                  name="Receita Mês Vigente"
                  fill="#00a2e8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="receitaMesAnterior"
                  name="Receita Mês Anterior (Base MoM)"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* MoM Evolution Strip with Green and Red Arrow Badges */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                <Percent className="w-3.5 h-3.5 text-[#00a2e8]" />
                <span>Evolução Percentual Mês sobre Mês (MoM)</span>
              </span>
              <span className="text-[11px] text-slate-400">Comparado com a receita fechada do mês imediatamente anterior</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {monthlyData.map((m) => {
                const mom = m.crescimentoMoM ?? 0;
                const isPositive = m.isPositiveGrowth ?? (mom >= 0);
                const hasPrev = m.receitaMesAnterior && m.receitaMesAnterior > 0;

                return (
                  <div
                    key={m.mes}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      hasPrev
                        ? isPositive
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-rose-50/70 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-600 uppercase">{m.mes}</div>
                    <div className="text-xs font-mono font-bold text-slate-900 tabular-nums my-0.5">
                      {formatCurrencyBRL(m.receitaBruta)}
                    </div>

                    {hasPrev ? (
                      <div className="flex items-center justify-center space-x-1 pt-1">
                        {isPositive ? (
                          <div className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px] shadow-2xs">
                            <ArrowUp className="w-3 h-3 text-emerald-600 stroke-[3]" />
                            <span>+{mom}%</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono text-[10px] shadow-2xs">
                            <ArrowDown className="w-3 h-3 text-rose-600 stroke-[3]" />
                            <span>{mom}%</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono block pt-1">
                        Base inicial
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-3 gap-1">
        <span>* Setas verdes indicam crescimento de receita e setas vermelhas indicam retração comparada ao mês anterior.</span>
        <span className="font-mono text-slate-500">Recharts v2.x Data Engine</span>
      </div>
    </div>
  );
};

