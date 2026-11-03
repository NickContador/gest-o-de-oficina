import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { OrdemServico } from '../data/mockData.ts';
import {
  calculateMonthlyFinancialData,
  calculateRevenueVsTargetEvolution,
  formatCurrencyBRL,
  RevenueVsTargetPoint,
} from '../utils/workshopLogic.ts';

interface RevenueEvolutionVsTargetChartProps {
  ordens: OrdemServico[];
  targetRevenue?: number;
  onOpenSettings?: () => void;
}

export const RevenueEvolutionVsTargetChart: React.FC<RevenueEvolutionVsTargetChartProps> = ({
  ordens,
  targetRevenue = 25000,
  onOpenSettings,
}) => {
  const [period, setPeriod] = useState<'6meses' | '12meses' | 'trimestre'>('6meses');
  const [chartType, setChartType] = useState<'composto' | 'barras'>('composto');

  const monthlyRecords = useMemo(
    () => calculateMonthlyFinancialData(ordens, period),
    [ordens, period]
  );

  const evolutionData: RevenueVsTargetPoint[] = useMemo(
    () => calculateRevenueVsTargetEvolution(monthlyRecords, targetRevenue),
    [monthlyRecords, targetRevenue]
  );

  // Consolidated statistics
  const totalRealized = evolutionData.reduce((acc, curr) => acc + curr.faturamentoRealizado, 0);
  const totalTarget = targetRevenue * evolutionData.length;
  const totalDelta = totalRealized - totalTarget;
  const overallAchievement = totalTarget > 0
    ? Number(((totalRealized / totalTarget) * 100).toFixed(1))
    : 0;

  const monthsAchievedCount = evolutionData.filter((item) => item.metaAtingida).length;
  const avgMonthlyRevenue = evolutionData.length > 0
    ? Number((totalRealized / evolutionData.length).toFixed(2))
    : 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: RevenueVsTargetPoint = payload[0].payload;
      const isMet = data.metaAtingida;

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-2 min-w-[260px] animate-in fade-in duration-100">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="font-bold text-slate-200 text-sm">{data.mesCompleto}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                isMet
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              {data.atingimentoPercentual}% da meta
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-sky-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00a2e8]" />
                <span>Faturamento Realizado:</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                {formatCurrencyBRL(data.faturamentoRealizado)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Meta Estipulada:</span>
              </span>
              <span className="font-mono tabular-nums">
                {formatCurrencyBRL(data.metaEstipulada)}
              </span>
            </div>

            <div
              className={`flex items-center justify-between pt-1 border-t border-slate-800 font-bold ${
                isMet ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <span>{isMet ? 'Superávit da Meta:' : 'Déficit da Meta:'}</span>
              <span className="font-mono tabular-nums">
                {isMet ? '+' : ''}
                {formatCurrencyBRL(data.superavitDeficit)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800 text-[10px]">
              <span>Ordens Faturadas no Mês:</span>
              <span className="font-mono">{data.ordensCount} OS</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <Target className="w-3.5 h-3.5" />
            <span>Acompanhamento Estratégico de Faturamento</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            Evolução Mensal do Faturamento vs Metas Estipuladas
          </h3>
          <p className="text-xs text-slate-500">
            Compare o histórico de faturamento bruto realizado com a meta mensal configurada ({formatCurrencyBRL(targetRevenue)}).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setChartType('composto')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                chartType === 'composto'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faturamento + Linha de Meta
            </button>
            <button
              type="button"
              onClick={() => setChartType('barras')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                chartType === 'barras'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Barras Comparativas
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPeriod('trimestre')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === 'trimestre'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trimestre
            </button>
            <button
              type="button"
              onClick={() => setPeriod('6meses')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === '6meses'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Meses
            </button>
            <button
              type="button"
              onClick={() => setPeriod('12meses')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === '12meses'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Meses
            </button>
          </div>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors"
              title="Ajustar valor da meta estipulada"
            >
              <Sliders className="w-4 h-4 text-[#00a2e8]" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
            Total Faturado no Período
          </span>
          <span className="text-xl font-black text-slate-900 font-mono tabular-nums">
            {formatCurrencyBRL(totalRealized)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{evolutionData.length} meses analisados</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
            Meta Acumulada
          </span>
          <span className="text-xl font-black text-slate-700 font-mono tabular-nums">
            {formatCurrencyBRL(totalTarget)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{formatCurrencyBRL(targetRevenue)} / mês</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
            Saldo Acumulado (Delta)
          </span>
          <span
            className={`text-xl font-black font-mono tabular-nums ${
              totalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {totalDelta >= 0 ? '+' : ''}
            {formatCurrencyBRL(totalDelta)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {overallAchievement}% de atingimento global
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
            Sucesso em Metas
          </span>
          <span className="text-xl font-black text-[#00a2e8] font-mono tabular-nums">
            {monthsAchievedCount} de {evolutionData.length} meses
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {Math.round((monthsAchievedCount / evolutionData.length) * 100)}% dos meses batidos
          </span>
        </div>
      </div>

      {/* Main Recharts Visualizer */}
      <div className="h-[340px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'composto' ? (
            <ComposedChart
              data={evolutionData}
              margin={{ top: 15, right: 20, left: 10, bottom: 25 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="mes"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `R$ ${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '11px' }}
                iconType="circle"
              />
              <ReferenceLine
                y={targetRevenue}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: `Meta Mensal: ${formatCurrencyBRL(targetRevenue)}`,
                  fill: '#ef4444',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Bar
                name="Faturamento Realizado"
                dataKey="faturamentoRealizado"
                radius={[6, 6, 0, 0]}
              >
                {evolutionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.metaAtingida ? '#00a2e8' : '#f59e0b'}
                  />
                ))}
              </Bar>
              <Line
                name="Meta Estipulada"
                dataKey="metaEstipulada"
                stroke="#dc2626"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#dc2626' }}
              />
            </ComposedChart>
          ) : (
            <ComposedChart
              data={evolutionData}
              margin={{ top: 15, right: 20, left: 10, bottom: 25 }}
              barCategoryGap="20%"
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="mes"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `R$ ${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '11px' }}
                iconType="circle"
              />
              <ReferenceLine
                y={targetRevenue}
                stroke="#94a3b8"
                strokeDasharray="3 3"
              />
              <Bar
                name="Faturamento Realizado"
                dataKey="faturamentoRealizado"
                fill="#00a2e8"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Meta Estipulada"
                dataKey="metaEstipulada"
                fill="#cbd5e1"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Month-by-Month Achievement Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1 border-t border-slate-100">
        {evolutionData.map((item) => (
          <div
            key={item.mes}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              item.metaAtingida
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-800">{item.mes}</div>
            <div className="font-mono font-black text-xs text-slate-900 tabular-nums mt-0.5">
              {formatCurrencyBRL(item.faturamentoRealizado)}
            </div>
            <div
              className={`text-[10px] font-mono font-bold mt-1 flex items-center justify-center space-x-0.5 ${
                item.metaAtingida ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {item.metaAtingida ? (
                <>
                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                  <span>+{item.atingimentoPercentual}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 text-amber-600" />
                  <span>{item.atingimentoPercentual}%</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
