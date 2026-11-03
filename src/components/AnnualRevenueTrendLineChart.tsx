import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
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
  Calendar,
  DollarSign,
  Award,
  AlertCircle,
  Percent,
  Sliders,
  Printer,
  Layers,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { OrdemServico } from '../data/mockData.ts';
import {
  calculateMonthlyFinancialData,
  calculate12MonthsTrendSummary,
  formatCurrencyBRL,
  AnnualTrendPoint,
} from '../utils/workshopLogic.ts';

interface AnnualRevenueTrendLineChartProps {
  ordens: OrdemServico[];
  onOpenSettings?: () => void;
  onExportPDF?: () => void;
}

export const AnnualRevenueTrendLineChart: React.FC<AnnualRevenueTrendLineChartProps> = ({
  ordens,
  onOpenSettings,
  onExportPDF,
}) => {
  // Line Visibility Toggles
  const [showProfitLine, setShowProfitLine] = useState(true);
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [showAverageReference, setShowAverageReference] = useState(true);

  // Compute 12-month financial records and trend summary
  const monthlyData = useMemo(() => {
    return calculateMonthlyFinancialData(ordens, '12meses');
  }, [ordens]);

  const summary = useMemo(() => {
    return calculate12MonthsTrendSummary(monthlyData);
  }, [monthlyData]);

  // Custom Recharts Tooltip for 12-Month Line Trend
  const CustomLineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: AnnualTrendPoint = payload[0].payload;
      const isPeak = data.mes === summary.melhorMes.mes;
      const isTrough = data.mes === summary.menorMes.mes;

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-2.5 min-w-[240px]">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-100 text-sm">{data.mesCompleto}</span>
              <div className="text-[10px] text-slate-400 font-mono">
                {data.ordensCount} ordens concluídas
              </div>
            </div>
            {isPeak && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                Pico Anual
              </span>
            )}
            {isTrough && (
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/40">
                Mínimo Anual
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-mono">
            {/* Receita Bruta */}
            <div className="flex items-center justify-between text-sky-400">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00a2e8]" />
                <span className="font-sans">Faturamento:</span>
              </span>
              <span className="font-bold tabular-nums">
                {formatCurrencyBRL(data.receitaBruta)}
              </span>
            </div>

            {/* Lucro Líquido */}
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-sans">Lucro Líquido:</span>
              </span>
              <span className="font-bold tabular-nums">
                {formatCurrencyBRL(data.lucroLiquido)}
              </span>
            </div>

            {/* Média Móvel 3M */}
            <div className="flex items-center justify-between text-purple-300">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="font-sans">Média Móvel (3M):</span>
              </span>
              <span className="font-bold tabular-nums">
                {formatCurrencyBRL(data.mediaMovel3M)}
              </span>
            </div>
          </div>

          {/* MoM Performance Badge */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Variação vs Mês Anterior:</span>
            {data.crescimentoMoM !== 0 ? (
              <span
                className={`font-mono font-bold flex items-center space-x-0.5 ${
                  data.isPositiveGrowth ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {data.isPositiveGrowth ? (
                  <ArrowUp className="w-3 h-3 stroke-[3]" />
                ) : (
                  <ArrowDown className="w-3 h-3 stroke-[3]" />
                )}
                <span>
                  {data.crescimentoMoM > 0 ? `+${data.crescimentoMoM}%` : `${data.crescimentoMoM}%`}
                </span>
              </span>
            ) : (
              <span className="text-slate-400 font-mono">Base inicial</span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-[#00a2e8] text-xs font-bold border border-sky-200 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Análise Temporal Recharts</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">12 Meses Consecutivos</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            Tendência Anual de Faturamento &amp; Rentabilidade
          </h3>
          <p className="text-xs text-slate-500">
            Acompanhe visualmente a trajetória histórica de receitas, volatilidade e momentum da oficina mecânica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggles for Chart Series */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs gap-1">
            <button
              type="button"
              onClick={() => setShowProfitLine(!showProfitLine)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                showProfitLine
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exibir ou ocultar linha de lucro líquido real"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              <span>Lucro Real</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMovingAverage(!showMovingAverage)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                showMovingAverage
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exibir ou ocultar linha de média móvel suavizada (3 meses)"
            >
              <span className="w-2 h-2 rounded-full bg-purple-300" />
              <span>Média Móvel 3M</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAverageReference(!showAverageReference)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                showAverageReference
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exibir linha pontilhada da média anual"
            >
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span>Média Anual</span>
            </button>
          </div>

          {onExportPDF && (
            <button
              type="button"
              onClick={onExportPDF}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
              title="Baixar relatório financeiro impresso em PDF"
            >
              <Printer className="w-4 h-4 text-[#00a2e8]" />
              <span>Exportar PDF</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Ajustar metas financeiras"
            >
              <Sliders className="w-4 h-4 text-slate-700" />
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Cards (5 Benchmarks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Faturado Ano */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Faturamento 12 Meses</span>
            <DollarSign className="w-4 h-4 text-[#00a2e8]" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tabular-nums">
            {formatCurrencyBRL(summary.totalFaturadoAno)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {summary.totalOrdensAno} ordens finalizadas
          </div>
        </div>

        {/* Média Mensal Realizada */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Média Mensal</span>
            <BarChart2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tabular-nums">
            {formatCurrencyBRL(summary.mediaMensalReceita)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Lucro médio: {formatCurrencyBRL(summary.mediaMensalLucro)}/mês
          </div>
        </div>

        {/* Melhor Mês (Pico) */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-medium">
            <span className="flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Melhor Mês (Pico)</span>
            </span>
            <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded">
              {summary.melhorMes.mes}
            </span>
          </div>
          <div className="text-xl font-black text-amber-900 font-mono tabular-nums">
            {formatCurrencyBRL(summary.melhorMes.receita)}
          </div>
          <div className="text-[11px] text-amber-700">
            {summary.melhorMes.mesCompleto}
          </div>
        </div>

        {/* Menor Mês (Mínimo) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Menor Desempenho</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded">
              {summary.menorMes.mes}
            </span>
          </div>
          <div className="text-xl font-black text-slate-700 font-mono tabular-nums">
            {formatCurrencyBRL(summary.menorMes.receita)}
          </div>
          <div className="text-[11px] text-slate-400">
            {summary.menorMes.mesCompleto}
          </div>
        </div>

        {/* Crescimento Anual (Momentum) */}
        <div
          className={`p-4 rounded-xl border shadow-2xs space-y-1 ${
            summary.crescimentoAnualPercentual >= 0
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-rose-200 bg-rose-50/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span
              className={
                summary.crescimentoAnualPercentual >= 0
                  ? 'text-emerald-800'
                  : 'text-rose-800'
              }
            >
              Momentum 12 Meses
            </span>
            {summary.crescimentoAnualPercentual >= 0 ? (
              <ArrowUp className="w-4 h-4 text-emerald-600 stroke-[3]" />
            ) : (
              <ArrowDown className="w-4 h-4 text-rose-600 stroke-[3]" />
            )}
          </div>
          <div
            className={`text-xl font-black font-mono tabular-nums ${
              summary.crescimentoAnualPercentual >= 0
                ? 'text-emerald-900'
                : 'text-rose-900'
            }`}
          >
            {summary.crescimentoAnualPercentual > 0
              ? `+${summary.crescimentoAnualPercentual}%`
              : `${summary.crescimentoAnualPercentual}%`}
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            {summary.points[0]?.mes} &rarr; {summary.points[summary.points.length - 1]?.mes}
          </div>
        </div>
      </div>

      {/* 3. Main Recharts Line Chart Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Curva de Desempenho e Tendência Operacional</span>
            </h4>
            <p className="text-xs text-slate-500">
              Visualização de linha contínua com suavização de médias e dispersão mensal
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-slate-700">
              <span className="w-3 h-1 bg-[#00a2e8] rounded-full" />
              <span>Receita Bruta</span>
            </div>
            {showProfitLine && (
              <div className="flex items-center space-x-1.5 text-emerald-700">
                <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                <span>Lucro Líquido</span>
              </div>
            )}
            {showMovingAverage && (
              <div className="flex items-center space-x-1.5 text-purple-700">
                <span className="w-3 h-1 bg-purple-500 rounded-full border-dashed" />
                <span>Média Móvel (3M)</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={summary.points}
              margin={{ top: 15, right: 30, left: 15, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

              <XAxis
                dataKey="mes"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                dy={8}
              />

              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                dx={-8}
              />

              <Tooltip content={<CustomLineTooltip />} />

              {/* Annual Average Reference Line */}
              {showAverageReference && (
                <ReferenceLine
                  y={summary.mediaMensalReceita}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Média Anual: ${formatCurrencyBRL(summary.mediaMensalReceita)}`,
                    position: 'insideTopRight',
                    fill: '#475569',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
              )}

              {/* Primary Line: Monthly Gross Revenue */}
              <Line
                type="monotone"
                dataKey="receitaBruta"
                name="Faturamento Bruto"
                stroke="#00a2e8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#00a2e8', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, stroke: '#00a2e8', strokeWidth: 3, fill: '#ffffff' }}
              />

              {/* Secondary Line: Net Profit */}
              {showProfitLine && (
                <Line
                  type="monotone"
                  dataKey="lucroLiquido"
                  name="Lucro Líquido"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                />
              )}

              {/* Tertiary Line: 3-Month Moving Average */}
              {showMovingAverage && (
                <Line
                  type="monotone"
                  dataKey="mediaMovel3M"
                  name="Média Móvel (3M)"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2, fill: '#ffffff' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Month-by-Month Annual Timeline Strip */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#00a2e8]" />
              <span>Cronograma Mensal de Desempenho (12 Meses)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Margem Média Anual: <strong className="text-slate-900">{summary.margemMediaAnual}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {summary.points.map((p) => {
              const isPeak = p.mes === summary.melhorMes.mes;
              const isTrough = p.mes === summary.menorMes.mes;

              return (
                <div
                  key={p.mes}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isPeak
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/40'
                      : isTrough
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-[10px] font-bold text-slate-600 uppercase font-mono">
                      {p.mes}
                    </span>
                    {isPeak && <Award className="w-3 h-3 text-amber-500 shrink-0" />}
                  </div>

                  <div className="text-xs font-mono font-bold text-slate-900 tabular-nums my-0.5">
                    {formatCurrencyBRL(p.receitaBruta)}
                  </div>

                  <div className="text-[10px] font-mono text-emerald-700 font-semibold tabular-nums">
                    Lucro: {formatCurrencyBRL(p.lucroLiquido)}
                  </div>

                  {p.crescimentoMoM !== 0 ? (
                    <div className="pt-1 flex items-center justify-center">
                      <span
                        className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-full inline-flex items-center space-x-0.5 ${
                          p.isPositiveGrowth
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.isPositiveGrowth ? '+' : ''}
                        {p.crescimentoMoM}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-mono block pt-1">
                      Início
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-3 gap-1">
          <span>* A linha de média móvel trimestral (3M) suaviza variações sazonais de curto prazo na oficina.</span>
          <span className="font-mono text-slate-500">Recharts Line Engine · MinhaOficina ERP</span>
        </div>
      </div>
    </div>
  );
};
