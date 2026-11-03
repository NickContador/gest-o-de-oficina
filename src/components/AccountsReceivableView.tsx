import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  Share2,
  Calendar,
  Search,
  Filter,
  Check,
  TrendingUp,
  CreditCard,
  MessageCircle,
  FileText,
  AlertTriangle,
  Printer,
} from 'lucide-react';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  getAccountsReceivableMetrics,
  formatCurrencyBRL,
} from '../utils/workshopLogic.ts';
import { exportAccountsReceivablePDF } from '../services/financialPdfService.ts';
import { WhatsAppReminderButton } from './WhatsAppReminderButton.tsx';


interface AccountsReceivableViewProps {
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  onOpenWhatsAppBilling: (ordem: OrdemServico) => void;
  onMarkAsPaid: (orderId: string, paymentMethod?: string) => void;
  onViewOrder: (ordem: OrdemServico) => void;
}

export const AccountsReceivableView: React.FC<AccountsReceivableViewProps> = ({
  ordens,
  clientes,
  veiculos,
  onOpenWhatsAppBilling,
  onMarkAsPaid,
  onViewOrder,
}) => {
  const [filterStatus, setFilterStatus] = useState<'todos' | 'vencidos' | 'pendentes' | 'pagos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const metrics = useMemo(() => getAccountsReceivableMetrics(ordens), [ordens]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    let list: OrdemServico[] = [];

    if (filterStatus === 'pagos') {
      list = metrics.paidOrders;
    } else if (filterStatus === 'vencidos') {
      list = metrics.receivableOrders.filter((o) => o.status_pagamento === 'vencido');
    } else if (filterStatus === 'pendentes') {
      list = metrics.receivableOrders.filter((o) => o.status_pagamento !== 'vencido');
    } else {
      // 'todos': show active receivables first, plus recently paid
      list = [...metrics.receivableOrders, ...metrics.paidOrders];
    }

    if (!searchTerm.trim()) return list;

    const query = searchTerm.toLowerCase();
    return list.filter((order) => {
      const cli = clientes.find((c) => c.id === order.cliente_id);
      const veic = veiculos.find((v) => v.id === order.veiculo_id);
      return (
        String(order.numero_os).includes(query) ||
        (cli?.nome_completo || '').toLowerCase().includes(query) ||
        (veic?.placa || '').toLowerCase().includes(query) ||
        (veic?.modelo || '').toLowerCase().includes(query)
      );
    });
  }, [metrics, filterStatus, searchTerm, clientes, veiculos]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Cards: Contas a Receber */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total a Receber */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total a Receber</span>
            <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
              {metrics.receivableOrders.length} ordens
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {formatCurrencyBRL(metrics.totalReceivable)}
          </div>
          <p className="text-[11px] text-slate-500">Serviços concluídos aguardando quitação</p>
        </div>

        {/* Total Vencido */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Contas Vencidas</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
              {metrics.overdueCount} atrasadas
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono tabular-nums">
            {formatCurrencyBRL(metrics.overdueTotal)}
          </div>
          <p className="text-[11px] text-rose-800/80">Requerem cobrança ativa imediata</p>
        </div>

        {/* Pendentes no Prazo */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Aguardando no Prazo</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
              {metrics.pendingCount} pendentes
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono tabular-nums">
            {formatCurrencyBRL(metrics.pendingTotal)}
          </div>
          <p className="text-[11px] text-amber-800/80">Dentro da data prevista de pagamento</p>
        </div>

        {/* Total Quitado / Pago */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Pago / Quitado</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
              {metrics.paidCount} pagas
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums">
            {formatCurrencyBRL(metrics.totalPaid)}
          </div>
          <p className="text-[11px] text-emerald-800/80">Recursos já convertidos em caixa</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtrar:</span>
          </span>

          <button
            type="button"
            onClick={() => setFilterStatus('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas as Contas ({metrics.receivableOrders.length + metrics.paidOrders.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('vencidos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              filterStatus === 'vencidos'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span>Vencidas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
              {metrics.overdueCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('pendentes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              filterStatus === 'pendentes'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>No Prazo</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
              {metrics.pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('pagos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              filterStatus === 'pagos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span>Quitadas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
              {metrics.paidCount}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, OS ou placa..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00a2e8] focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              exportAccountsReceivablePDF({
                ordens,
                clientes,
                veiculos,
                filterStatus,
              })
            }
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98] shrink-0 cursor-pointer"
            title="Exportar listagem de Contas a Receber formatada em PDF A4 para cobrança e conciliação"
          >
            <Printer className="w-3.5 h-3.5 text-[#00a2e8]" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Accounts Receivable Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Listagem de Contas a Receber</h4>
            <p className="text-xs text-slate-500">
              Controle de pendências financeiras e disparos diretos de cobrança para WhatsApp
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {filteredOrders.length} registros exibidos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">OS Nº</th>
                <th className="py-3 px-4">Cliente &amp; Telefone</th>
                <th className="py-3 px-4">Veículo / Placa</th>
                <th className="py-3 px-4">Conclusão</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Status Pagamento</th>
                <th className="py-3 px-4 text-right">Ações de Cobrança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                    <span>Nenhuma conta a receber encontrada para os filtros selecionados.</span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((os) => {
                  const client = clientes.find((c) => c.id === os.cliente_id);
                  const vehicle = veiculos.find((v) => v.id === os.veiculo_id);
                  const isPaid = os.status_pagamento === 'pago';
                  const isOverdue = os.status_pagamento === 'vencido';

                  const completionDate = os.data_saida
                    ? new Date(os.data_saida).toLocaleDateString('pt-BR')
                    : new Date(os.data_entrada).toLocaleDateString('pt-BR');

                  const dueDate = os.data_vencimento
                    ? new Date(os.data_vencimento).toLocaleDateString('pt-BR')
                    : 'À vista';

                  return (
                    <tr
                      key={os.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* OS Number */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onViewOrder(os)}
                          className="font-mono font-bold text-[#00a2e8] hover:underline"
                        >
                          #{os.numero_os}
                        </button>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{client?.nome_completo || 'Cliente Desconhecido'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {client?.dados_privados?.telefone || '(11) 3290-8844'}
                        </div>
                      </td>

                      {/* Vehicle & Plate */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">
                          {vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Veículo'}
                        </div>
                        <div className="inline-flex items-center space-x-1 px-1.5 py-0.2 bg-blue-50 text-blue-900 rounded font-mono font-bold text-[10px] border border-blue-200">
                          <span>{vehicle?.placa || 'PLACA'}</span>
                        </div>
                      </td>

                      {/* Completion Date */}
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {completionDate}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className={isOverdue ? 'text-rose-700 font-bold' : 'text-slate-600'}>
                          {dueDate}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrencyBRL(os.valor_total)}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Pago ({os.forma_pagamento || 'Pix'})</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Vencido</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Aguardando</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {!isPaid && (
                            <>
                              <WhatsAppReminderButton
                                ordem={os}
                                cliente={client}
                                veiculo={vehicle}
                                variant="compact"
                              />

                              <button
                                type="button"
                                onClick={() => onMarkAsPaid(os.id, 'Pix')}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[11px] shadow-2xs transition-colors"
                                title="Dar baixa nesta OS e marcar como recebido"
                              >
                                <span>Dar Baixa</span>
                              </button>
                            </>
                          )}

                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => onViewOrder(os)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] transition-colors"
                            >
                              Ver Detalhes
                            </button>
                          )}
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
    </div>
  );
};
