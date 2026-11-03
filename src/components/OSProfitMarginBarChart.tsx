import React, { useState, useMemo } from 'react';
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
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Percent,
  DollarSign,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Car,
  User,
  Wrench,
  Package,
  Layers,
  Printer,
} from 'lucide-react';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  calculateOSProfitMargin,
  formatCurrencyBRL,
  OSProfitMarginCalculation,
} from '../utils/workshopLogic.ts';
import { exportProfitabilityReportPDF } from '../services/financialPdfService.ts';

interface OSProfitMarginBarChartProps {
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  targetMargin?: number;
}

export const OSProfitMarginBarChart: React.FC<OSProfitMarginBarChartProps> = ({
  ordens,
  clientes,
  veiculos,
  targetMargin = 40,
}) => {
  const [filterMode, setFilterMode] = useState<'todas' | 'concluidas' | 'andamento'>('todas');
  const [sortMode, setSortMode] = useState<'os' | 'lucro' | 'margem'>('os');
  const [metricView, setMetricView] = useState<'valores' | 'margem'>('valores');

  // Calculate profit margin for each work order
  const calculatedData = useMemo(() => {
    let list = ordens.map((os) => {
      const client = clientes.find((c) => c.id === os.cliente_id);
      const vehicle = veiculos.find((v) => v.id === os.veiculo_id);
      const clientName = client?.nome_completo || 'Cliente';
      const vehicleDesc = vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Veículo';

      return calculateOSProfitMargin(os, clientName, vehicleDesc);
    });

    // Apply status filter
    if (filterMode === 'concluidas') {
      list = list.filter((item) => item.status === 'concluido' || item.status === 'entregue');
    } else if (filterMode === 'andamento') {
      list = list.filter((item) => item.status !== 'concluido' && item.status !== 'entregue');
    }

    // Apply sort
    return [...list].sort((a, b) => {
      if (sortMode === 'lucro') {
        return b.lucroLiquido - a.lucroLiquido;
      }
      if (sortMode === 'margem') {
        return b.margemLucroPercentual - a.margemLucroPercentual;
      }
      return a.numeroOS - b.numeroOS;
    });
  }, [ordens, clientes, veiculos, filterMode, sortMode]);

  // Aggregate stats
  const totalBilled = calculatedData.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const totalCosts = calculatedData.reduce((acc, curr) => acc + curr.custoTotal, 0);
  const totalProfit = calculatedData.reduce((acc, curr) => acc + curr.lucroLiquido, 0);
  const avgMargin = totalBilled > 0
    ? Number(((totalProfit / totalBilled) * 100).toFixed(1))
    : 0;

  const highestMarginOS = calculatedData.length > 0
    ? [...calculatedData].sort((a, b) => b.margemLucroPercentual - a.margemLucroPercentual)[0]
    : null;

  // Custom Tooltip for OS Profit Margin Bar Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: OSProfitMarginCalculation = payload[0].payload;
      const isAboveTarget = data.margemLucroPercentual >= targetMargin;

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-2.5 min-w-[260px] animate-in fade-in duration-100">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <div>
              <span className="font-mono font-black text-sky-400 text-sm">OS #{data.numeroOS}</span>
              <span className="text-[11px] text-slate-400 block">{data.clienteNome}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                isAboveTarget ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {data.margemLucroPercentual}% margem
            </span>
          </div>

          <div className="text-[11px] text-slate-300 font-medium">
            <span className="text-slate-500 block text-[10px]">Veículo:</span>
            <span>{data.veiculoDesc}</span>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-800 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00a2e8]" />
                <span>Valor Total Pago:</span>
              </span>
              <span className="font-mono font-bold tabular-nums text-white">
                {formatCurrencyBRL(data.valorTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>(-) Custo Peças:</span>
              </span>
              <span className="font-mono tabular-nums">
                {formatCurrencyBRL(data.custoPecas)}
              </span>
            </div>

            <div className="flex items-center justify-between text-orange-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>(-) Custo Mão de Obra:</span>
              </span>
              <span className="font-mono tabular-nums">
                {formatCurrencyBRL(data.custoMaoDeObra)}
              </span>
            </div>

            <div className="flex items-center justify-between text-rose-300 pt-0.5 border-t border-slate-800">
              <span>Total Custos Subtraídos:</span>
              <span className="font-mono font-bold tabular-nums">
                -{formatCurrencyBRL(data.custoTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-emerald-400 pt-1 border-t border-slate-800 font-bold">
              <span>(=) Lucro Líquido da OS:</span>
              <span className="font-mono text-sm tabular-nums">
                {formatCurrencyBRL(data.lucroLiquido)}
              </span>
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
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-[#00a2e8] text-xs font-bold border border-sky-100">
            <Percent className="w-3.5 h-3.5" />
            <span>Rentabilidade Unitária por Ordem de Serviço</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            Cálculo de Margem de Lucro por Ordem de Serviço
          </h3>
          <p className="text-xs text-slate-500">
            Subtração dos custos diretos de peças e mão de obra técnica do valor total pago pelo cliente.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric View Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setMetricView('valores')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                metricView === 'valores'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Receita vs Custos vs Lucro
            </button>
            <button
              type="button"
              onClick={() => setMetricView('margem')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                metricView === 'margem'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Margem de Lucro (%)
            </button>
          </div>

          {/* Filter Status */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#00a2e8]"
          >
            <option value="todas">Todas as OS ({ordens.length})</option>
            <option value="concluidas">Somente Finalizadas / Pagas</option>
            <option value="andamento">Em Andamento / Pátio</option>
          </select>

          {/* Sort Mode */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#00a2e8]"
          >
            <option value="os">Ordem: Nº OS</option>
            <option value="lucro">Maior Lucro (R$)</option>
            <option value="margem">Maior Margem (%)</option>
          </select>

          <button
            type="button"
            onClick={() =>
              exportProfitabilityReportPDF({
                ordens,
                clientes,
                veiculos,
                targetMargin,
              })
            }
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            title="Exportar demonstrativo completo de rentabilidade e margens em PDF A4"
          >
            <Printer className="w-3.5 h-3.5 text-[#00a2e8]" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
            Margem Média das OS
          </span>
          <span className="text-xl font-black text-emerald-600 font-mono tabular-nums">
            {avgMargin}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Meta: {targetMargin}%</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
            Lucro Líquido Acumulado
          </span>
          <span className="text-xl font-black text-slate-900 font-mono tabular-nums">
            {formatCurrencyBRL(totalProfit)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Após subtrair custos</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
            Custos Totais Deduzidos
          </span>
          <span className="text-xl font-black text-amber-700 font-mono tabular-nums">
            {formatCurrencyBRL(totalCosts)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Peças + Mão de Obra</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
            Maior Margem de OS
          </span>
          <span className="text-xl font-black text-[#00a2e8] font-mono tabular-nums">
            {highestMarginOS ? `${highestMarginOS.margemLucroPercentual}%` : '0%'}
          </span>
          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
            {highestMarginOS ? `OS #${highestMarginOS.numeroOS} (${highestMarginOS.clienteNome})` : 'Nenhuma'}
          </span>
        </div>
      </div>

      {/* Main Recharts Bar Chart */}
      <div className="h-[340px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricView === 'valores' ? (
            <BarChart
              data={calculatedData}
              margin={{ top: 15, right: 20, left: 10, bottom: 25 }}
              barCategoryGap="20%"
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="numeroOS"
                tickFormatter={(val) => `OS #${val}`}
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
              <Bar
                name="Valor Total Pago"
                dataKey="valorTotal"
                fill="#00a2e8"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Custos (Peças + MO)"
                dataKey="custoTotal"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Lucro Líquido Real"
                dataKey="lucroLiquido"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <BarChart
              data={calculatedData}
              margin={{ top: 15, right: 20, left: 10, bottom: 25 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="numeroOS"
                tickFormatter={(val) => `OS #${val}`}
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
                tickFormatter={(val) => `${val}%`}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={targetMargin}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: `Meta de Margem (${targetMargin}%)`,
                  fill: '#ef4444',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Bar
                name="Margem de Lucro (%)"
                dataKey="margemLucroPercentual"
                radius={[6, 6, 0, 0]}
              >
                {calculatedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.margemLucroPercentual >= targetMargin ? '#10b981' : '#f59e0b'}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Breakdown Table of OS Margins */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">OS Nº</th>
              <th className="py-2.5 px-3">Cliente / Veículo</th>
              <th className="py-2.5 px-3 text-right">Valor Total</th>
              <th className="py-2.5 px-3 text-right">Custo Peças</th>
              <th className="py-2.5 px-3 text-right">Custo MO</th>
              <th className="py-2.5 px-3 text-right">Custo Total</th>
              <th className="py-2.5 px-3 text-right">Lucro Líquido</th>
              <th className="py-2.5 px-3 text-center">Margem %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {calculatedData.map((item) => {
              const isGood = item.margemLucroPercentual >= targetMargin;
              return (
                <tr key={item.osId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-[#00a2e8]">
                    #{item.numeroOS}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-slate-900">{item.clienteNome}</div>
                    <div className="text-[10px] text-slate-500">{item.veiculoDesc}</div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrencyBRL(item.valorTotal)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-amber-700 tabular-nums">
                    {formatCurrencyBRL(item.custoPecas)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-orange-700 tabular-nums">
                    {formatCurrencyBRL(item.custoMaoDeObra)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600 font-semibold tabular-nums">
                    {formatCurrencyBRL(item.custoTotal)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 tabular-nums">
                    {formatCurrencyBRL(item.lucroLiquido)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isGood
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.margemLucroPercentual}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
