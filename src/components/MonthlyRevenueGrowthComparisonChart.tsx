import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Sun,
  Layers,
  Info,
} from 'lucide-react';
import {
  SixMonthGrowthMetrics,
  formatCurrencyBRL,
  MonthlyFinancialRecord,
} from '../utils/workshopLogic.ts';

interface MonthlyRevenueGrowthComparisonChartProps {
  metrics: SixMonthGrowthMetrics;
  onNavigateToFinancial?: () => void;
}

export const MonthlyRevenueGrowthComparisonChart: React.FC<MonthlyRevenueGrowthComparisonChartProps> = ({
  metrics,
  onNavigateToFinancial,
}) => {
  const [viewMetric, setViewMetric] = useState<'receita_lucro' | 'crescimento_mom'>('receita_lucro');

  if (!metrics.records || metrics.records.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      {/* Header with Title and Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200 flex items-center space-x-1">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Análise Sazonal &amp; Tendência</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Semestre Móvel (Últimos 6 Meses)
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 mt-1 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#00a2e8]" />
            <span>Comparativo de Crescimento Mensal do Faturamento</span>
          </h3>
          <p className="text-xs text-slate-500">
            Acompanhe a evolução mês a mês (MoM), flutuações sazonais de demanda e lucratividade líquida.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMetric('receita_lucro')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMetric === 'receita_lucro'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Receita vs Lucro
          </button>
          <button
            type="button"
            onClick={() => setViewMetric('crescimento_mom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMetric === 'crescimento_mom'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Crescimento MoM (%)
          </button>
        </div>
      </div>

      {/* Seasonal Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Faturamento Médio</span>
          <span className="text-base font-black text-slate-900 font-mono tabular-nums">
            {formatCurrencyBRL(metrics.averageMonthlyRevenue)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Média / mês no semestre</span>
        </div>

        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60">
          <span className="text-[10px] font-bold text-amber-800 uppercase block">Pico Sazonal</span>
          <span className="text-base font-black text-amber-900 font-mono tabular-nums">
            {formatCurrencyBRL(metrics.peakMonth.receita)}
          </span>
          <span className="text-[10px] text-amber-700 font-medium block mt-0.5 truncate">
            {metrics.peakMonth.mesCompleto} (Alta)
          </span>
        </div>

        <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/60">
          <span className="text-[10px] font-bold text-sky-800 uppercase block">Crescimento Líquido</span>
          <div className="flex items-center space-x-1 text-base font-black font-mono tabular-nums">
            {metrics.netGrowth6MPercent >= 0 ? (
              <span className="text-emerald-700 flex items-center">
                <ArrowUpRight className="w-4 h-4 inline" />
                +{metrics.netGrowth6MPercent}%
              </span>
            ) : (
              <span className="text-rose-600 flex items-center">
                <ArrowDownRight className="w-4 h-4 inline" />
                {metrics.netGrowth6MPercent}%
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Início vs Fim do período</span>
        </div>

        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Lucro Médio Estimado</span>
          <span className="text-base font-black text-emerald-700 font-mono tabular-nums">
            {formatCurrencyBRL(metrics.averageMonthlyProfit)}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Margem média saudável</span>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMetric === 'receita_lucro' ? (
            <ComposedChart
              data={metrics.records}
              margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="mes"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
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
                  name === 'receitaBruta'
                    ? 'Receita Bruta'
                    : name === 'lucroLiquido'
                    ? 'Lucro Líquido'
                    : 'Mão de Obra',
                ]}
                labelFormatter={(label) => {
                  const item = metrics.records.find((r) => r.mes === label);
                  return item ? item.mesCompleto : label;
                }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine
                y={metrics.averageMonthlyRevenue}
                stroke="#64748b"
                strokeDasharray="4 4"
                label={{
                  value: `Média: ${formatCurrencyBRL(metrics.averageMonthlyRevenue)}`,
                  position: 'insideTopRight',
                  fill: '#64748b',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
              <Bar
                dataKey="receitaBruta"
                name="Receita Bruta"
                fill="#00a2e8"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {metrics.records.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.mes === metrics.peakMonth.mes ? '#f59e0b' : '#00a2e8'}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="lucroLiquido"
                name="Lucro Líquido"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          ) : (
            <ComposedChart
              data={metrics.records}
              margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="mes"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  `${value}%`,
                  name === 'crescimentoMoM' ? 'Crescimento Mês a Mês' : name,
                ]}
                labelFormatter={(label) => {
                  const item = metrics.records.find((r) => r.mes === label);
                  return item ? item.mesCompleto : label;
                }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
              <Bar
                dataKey="crescimentoMoM"
                name="Crescimento MoM (%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={42}
              >
                {metrics.records.map((entry, index) => (
                  <Cell
                    key={`growth-${index}`}
                    fill={(entry.crescimentoMoM ?? 0) >= 0 ? '#10b981' : '#f43f5e'}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="crescimentoMoM"
                stroke="#0f172a"
                strokeWidth={2}
                dot={{ r: 4, fill: '#0f172a' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Month-by-Month Growth Badge Indicators Strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
        {metrics.records.map((rec) => {
          const momGrowth = rec.crescimentoMoM ?? 0;
          const isPositive = momGrowth >= 0;
          const isPeak = rec.mes === metrics.peakMonth.mes;


          return (
            <div
              key={rec.mes}
              className={`p-2.5 rounded-xl border text-xs space-y-1 transition-colors ${
                isPeak
                  ? 'border-amber-300 bg-amber-50/70 ring-1 ring-amber-200'
                  : 'border-slate-100 bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] truncate">{rec.mes}</span>
                {isPeak && (
                  <span className="px-1 py-0.2 rounded text-[9px] font-black uppercase bg-amber-200 text-amber-900">
                    Pico
                  </span>
                )}
              </div>

              <div className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                {formatCurrencyBRL(rec.receitaBruta)}
              </div>

              <div className="flex items-center space-x-1 text-[10px] font-mono font-bold">
                {isPositive ? (
                  <span className="text-emerald-700 flex items-center">
                    <ArrowUpRight className="w-3 h-3" />
                    +{momGrowth}%
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center">
                    <ArrowDownRight className="w-3 h-3" />
                    {momGrowth}%
                  </span>
                )}
                <span className="text-slate-400 font-normal">MoM</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seasonal Intelligence Callout */}
      <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-sky-400">Diagnóstico de Inteligência Sazonal:</span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {metrics.seasonalityInsight}
            </p>
          </div>
        </div>

        {onNavigateToFinancial && (
          <button
            type="button"
            onClick={onNavigateToFinancial}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shrink-0 transition-colors cursor-pointer self-start sm:self-auto"
          >
            Ver DRE Completo &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
