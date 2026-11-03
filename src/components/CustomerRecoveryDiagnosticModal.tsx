import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  X,
  TrendingDown,
  TrendingUp,
  DollarSign,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Car,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sliders,
  Calendar,
  Share2,
} from 'lucide-react';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  CustomerRecoveryPlan,
  CustomerRecoverySuggestion,
  formatCurrencyBRL,
  generateCustomerRecoveryPlan,
} from '../utils/workshopLogic.ts';

interface CustomerRecoveryDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  targetRevenue: number;
  onNavigateTab?: (tab: string) => void;
}

export const CustomerRecoveryDiagnosticModal: React.FC<CustomerRecoveryDiagnosticModalProps> = ({
  isOpen,
  onClose,
  ordens,
  clientes,
  veiculos,
  targetRevenue,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const [activeFilter, setActiveFilter] = useState<'todos' | 'cobranca' | 'orcamento' | 'preventiva'>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPlan, setCopiedPlan] = useState(false);
  const [actionStatuses, setActionStatuses] = useState<Record<string, 'pendente' | 'contatado' | 'recuperado'>>({});

  const plan: CustomerRecoveryPlan = useMemo(() => {
    return generateCustomerRecoveryPlan(ordens, clientes, veiculos, targetRevenue);
  }, [ordens, clientes, veiculos, targetRevenue]);

  // Handle WhatsApp action: Open chat or copy
  const handleOpenWhatsApp = (suggestion: CustomerRecoverySuggestion) => {
    const rawPhone = suggestion.clienteTelefone.replace(/\D/g, '');
    const encoded = encodeURIComponent(suggestion.mensagemWhatsApp);
    const targetUrl = rawPhone.length >= 10
      ? `https://wa.me/55${rawPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    
    // Mark as contatado automatically on dispatch
    setActionStatuses((prev) => ({
      ...prev,
      [suggestion.id]: prev[suggestion.id] === 'recuperado' ? 'recuperado' : 'contatado',
    }));

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = async (suggestion: CustomerRecoverySuggestion) => {
    try {
      await navigator.clipboard.writeText(suggestion.mensagemWhatsApp);
      setCopiedId(suggestion.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error('Falha ao copiar mensagem', err);
    }
  };

  const handleToggleStatus = (id: string) => {
    setActionStatuses((prev) => {
      const current = prev[id] || 'pendente';
      const next = current === 'pendente' ? 'contatado' : current === 'contatado' ? 'recuperado' : 'pendente';
      return { ...prev, [id]: next };
    });
  };

  // Dynamic simulation of recovered money
  const recoveredSimulatedAmount = useMemo(() => {
    return plan.sugestoes.reduce((acc, curr) => {
      if (actionStatuses[curr.id] === 'recuperado') {
        return acc + curr.potencialRecuperacao;
      }
      return acc;
    }, 0);
  }, [plan.sugestoes, actionStatuses]);

  const projectedTotalRevenue = plan.currentRevenue + recoveredSimulatedAmount;
  const projectedPercentage = Number(((projectedTotalRevenue / plan.targetRevenue) * 100).toFixed(1));
  const isNowSafe = projectedTotalRevenue >= plan.thresholdValue;

  // Filtered list
  const filteredSuggestions = useMemo(() => {
    if (activeFilter === 'cobranca') {
      return plan.sugestoes.filter((s) => s.tipo === 'cobranca_receber');
    }
    if (activeFilter === 'orcamento') {
      return plan.sugestoes.filter((s) => s.tipo === 'fechamento_orcamento');
    }
    if (activeFilter === 'preventiva') {
      return plan.sugestoes.filter((s) => s.tipo === 'retorno_preventivo');
    }
    return plan.sugestoes;
  }, [plan.sugestoes, activeFilter]);

  const handleCopyFullPlanSummary = async () => {
    const text = [
      `🎯 PLANO DE RECUPERAÇÃO DE FATURAMENTO — AUTO MECÂNICA CENTRAL`,
      `Situação Atual: ${formatCurrencyBRL(plan.currentRevenue)} (${plan.percentualAtual}% da meta de ${formatCurrencyBRL(plan.targetRevenue)})`,
      `Piso de Segurança (20%): ${formatCurrencyBRL(plan.thresholdValue)} | Déficit: ${formatCurrencyBRL(plan.deficitToThreshold)}`,
      `Potencial Identificado: ${formatCurrencyBRL(plan.totalPotencialRecuperavel)}`,
      ``,
      `--- AÇÕES RECOMENDADAS ---`,
      ...plan.sugestoes.map((s, i) => `${i + 1}. [${s.tipo.toUpperCase()}] ${s.clienteNome} (${s.veiculoDesc} - ${s.veiculoPlaca}) — Potencial: ${formatCurrencyBRL(s.potencialRecuperacao)}\n   Estratégia: ${s.estrategia}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlan(true);
      setTimeout(() => setCopiedPlan(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar plano', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-rose-300 w-full max-w-4xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* 1. Header Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-white text-rose-800">
                  Diagnóstico Crítico de Gestão
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/80 text-rose-100 border border-rose-400">
                  Faturamento &lt; 20% da Meta
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Plano de Recuperação &amp; Reativação de Clientes
              </h2>

              <p className="text-xs text-rose-100/90 leading-relaxed max-w-2xl">
                O faturamento de ordens finalizadas ({formatCurrencyBRL(plan.currentRevenue)}) atingiu apenas{' '}
                <strong className="underline decoration-white/60">{plan.percentualAtual}% da meta mensal</strong>. Abaixo estão listadas as ações práticas com abordagem direta via WhatsApp para reverter o déficit de {formatCurrencyBRL(plan.deficitToThreshold)} hoje mesmo.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Interactive Thermometer / "Recuperômetro" */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 shrink-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Recuperômetro Financeiro
                </span>
                {recoveredSimulatedAmount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>+{formatCurrencyBRL(recoveredSimulatedAmount)} em Recuperação</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Piso mínimo de segurança: <strong>20% ({formatCurrencyBRL(plan.thresholdValue)})</strong>. Meta cheia: <strong>{formatCurrencyBRL(plan.targetRevenue)}</strong>.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`text-base font-black font-mono tabular-nums ${isNowSafe ? 'text-emerald-700' : 'text-rose-600'}`}>
                {projectedPercentage}% da meta
              </span>
              <span className="text-xs text-slate-400">({formatCurrencyBRL(projectedTotalRevenue)})</span>
            </div>
          </div>

          {/* Segmented Visual Progress Bar */}
          <div className="relative w-full h-5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            {/* 20% Threshold Marker Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-slate-900 z-30"
              style={{ left: '20%' }}
              title="Linha Crítica: 20% da Meta"
            />

            {/* Base Current Realized Revenue */}
            <div
              className="h-full bg-rose-600 absolute left-0 top-0 z-10 transition-all duration-500"
              style={{ width: `${Math.min(100, plan.percentualAtual)}%` }}
            />

            {/* Simulated Recovered Boost */}
            {recoveredSimulatedAmount > 0 && (
              <div
                className="h-full bg-emerald-500 absolute top-0 z-20 transition-all duration-500 opacity-90"
                style={{
                  left: `${Math.min(100, plan.percentualAtual)}%`,
                  width: `${Math.min(100 - plan.percentualAtual, (recoveredSimulatedAmount / plan.targetRevenue) * 100)}%`,
                }}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>R$ 0,00</span>
            <span className="font-bold text-slate-800 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              <span>Piso 20%: {formatCurrencyBRL(plan.thresholdValue)}</span>
            </span>
            <span>Meta 100%: {formatCurrencyBRL(plan.targetRevenue)}</span>
          </div>

          {/* KPI Mini-Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/70">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Faturado Atual</span>
              <span className="text-base font-black text-rose-700 font-mono tabular-nums">
                {formatCurrencyBRL(plan.currentRevenue)}
              </span>
              <span className="text-[10px] text-rose-600/80 block mt-0.5">{plan.percentualAtual}% da meta</span>
            </div>

            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Déficit p/ Piso 20%</span>
              <span className="text-base font-black text-amber-700 font-mono tabular-nums">
                {formatCurrencyBRL(plan.deficitToThreshold)}
              </span>
              <span className="text-[10px] text-amber-600/80 block mt-0.5">Margem urgente de caixa</span>
            </div>

            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Potencial Localizado</span>
              <span className="text-base font-black text-emerald-700 font-mono tabular-nums">
                {formatCurrencyBRL(plan.totalPotencialRecuperavel)}
              </span>
              <span className="text-[10px] text-emerald-600/80 block mt-0.5">{plan.sugestoes.length} oportunidades</span>
            </div>

            <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/70">
              <span className="text-[10px] font-bold text-sky-800 uppercase block">Projeção c/ Resgate</span>
              <span className="text-base font-black text-sky-700 font-mono tabular-nums">
                {formatCurrencyBRL(projectedTotalRevenue)}
              </span>
              <span className="text-[10px] text-sky-600/80 block mt-0.5">{projectedPercentage}% da meta</span>
            </div>
          </div>
        </div>

        {/* 3. Action Filters & Tabs */}
        <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'todos'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({plan.sugestoes.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('cobranca')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
                activeFilter === 'cobranca'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span>Contas a Receber ({plan.resumoPorTipo.cobrancaReceber.count})</span>
              <span className="text-[10px] font-mono font-bold opacity-80">
                · {formatCurrencyBRL(plan.resumoPorTipo.cobrancaReceber.valorTotal)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('orcamento')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
                activeFilter === 'orcamento'
                  ? 'bg-sky-700 text-white'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
              }`}
            >
              <span>Orçamentos Abertos ({plan.resumoPorTipo.fechamentoOrcamento.count})</span>
              <span className="text-[10px] font-mono font-bold opacity-80">
                · {formatCurrencyBRL(plan.resumoPorTipo.fechamentoOrcamento.valorTotal)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('preventiva')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
                activeFilter === 'preventiva'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              <span>Recall Preventivo ({plan.resumoPorTipo.retornoPreventivo.count})</span>
              <span className="text-[10px] font-mono font-bold opacity-80">
                · {formatCurrencyBRL(plan.resumoPorTipo.retornoPreventivo.valorTotal)}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyFullPlanSummary}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
            title="Copiar relatório completo de ações para o clipboard"
          >
            {copiedPlan ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPlan ? 'Plano Copiado!' : 'Copiar Plano'}</span>
          </button>
        </div>

        {/* 4. Scrollable List of Customer Recovery Opportunities */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
          {filteredSuggestions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhuma oportunidade restante neste filtro.</p>
              <p className="text-xs text-slate-400">Verifique outros filtros ou o resumo geral.</p>
            </div>
          ) : (
            filteredSuggestions.map((item) => {
              const currentStatus = actionStatuses[item.id] || 'pendente';
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-4 transition-all shadow-2xs space-y-3 ${
                    currentStatus === 'recuperado'
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : currentStatus === 'contatado'
                      ? 'border-sky-300 bg-sky-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.tipo === 'cobranca_receber' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                            Contas a Receber
                          </span>
                        )}
                        {item.tipo === 'fechamento_orcamento' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 uppercase tracking-wide">
                            Orçamento Aberto
                          </span>
                        )}
                        {item.tipo === 'retorno_preventivo' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide">
                            Recall Preventivo
                          </span>
                        )}

                        {item.numeroOs && (
                          <span className="text-xs font-mono font-bold text-slate-700">
                            OS #{item.numeroOs}
                          </span>
                        )}

                        <span className="text-slate-300">·</span>

                        <span className="text-xs font-bold text-slate-900">
                          {item.clienteNome}
                        </span>

                        <span className="text-xs text-slate-500 font-mono">
                          {item.clienteTelefone}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-slate-600">
                        <Car className="w-3.5 h-3.5 text-[#00a2e8]" />
                        <span>{item.veiculoDesc}</span>
                        <span className="text-slate-300">·</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[11px] font-mono font-bold text-slate-700">
                          {item.veiculoPlaca}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        {item.descricao}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Potencial</span>
                      <div className="text-lg font-black text-slate-900 font-mono tabular-nums">
                        {formatCurrencyBRL(item.potencialRecuperacao)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id)}
                        className={`mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          currentStatus === 'recuperado'
                            ? 'bg-emerald-600 text-white'
                            : currentStatus === 'contatado'
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Clique para alternar: Pendente -> Contatado -> Recuperado"
                      >
                        {currentStatus === 'recuperado'
                          ? '✓ Recuperado'
                          : currentStatus === 'contatado'
                          ? '💬 Em Contato'
                          : '○ Pendente'}
                      </button>
                    </div>
                  </div>

                  {/* Strategic Suggestion Box */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">Estratégia Recomendada: </span>
                      <span className="text-slate-600">{item.estrategia}</span>
                    </div>
                  </div>

                  {/* Direct Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(item)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        title="Abrir WhatsApp com mensagem pré-formatada"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Disparar WhatsApp</span>
                        <ExternalLink className="w-3 h-3 text-emerald-200" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyMessage(item)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                        title="Copiar texto da mensagem"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copiada' : 'Copiar Texto'}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.tipo === 'cobranca_receber' && onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateTab('financeiro');
                          }}
                          className="text-[11px] font-bold text-[#00a2e8] hover:underline flex items-center space-x-0.5 cursor-pointer"
                        >
                          <span>Ver em Contas a Receber</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {item.tipo === 'fechamento_orcamento' && onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateTab('kanban');
                          }}
                          className="text-[11px] font-bold text-[#00a2e8] hover:underline flex items-center space-x-0.5 cursor-pointer"
                        >
                          <span>Ver no Pátio/Kanban</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Impacto Estimado:</span>
            <span>Resgatar {plan.sugestoes.length} clientes gera <strong>+{formatCurrencyBRL(plan.totalPotencialRecuperavel)}</strong> no caixa imediato.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Fechar Diagnóstico
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
