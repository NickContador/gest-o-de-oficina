import React from 'react';
import {
  AlertTriangle,
  X,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  DollarSign,
  Clock,
  CheckCircle2,
  Bell,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { RevenueGoalAlert, formatCurrencyBRL } from '../utils/workshopLogic.ts';

interface MetaAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: RevenueGoalAlert;
  onGoToReceivables?: () => void;
  onGoToKanban?: () => void;
  onOpenSettings?: () => void;
}

export const MetaAlertsModal: React.FC<MetaAlertsModalProps> = ({
  isOpen,
  onClose,
  alert,
  onGoToReceivables,
  onGoToKanban,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-rose-300 w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header with High-Impact Warning Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-white text-rose-800">
                  Alerta Crítico de Faturamento
                </span>
                <span className="text-rose-200 text-xs font-mono font-bold">
                  Piso de Segurança 20%
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight mt-0.5">
                Faturamento Abaixo de 20% da Meta
              </h2>
            </div>
          </div>

          <p className="text-xs text-rose-100/90 leading-relaxed max-w-xl">
            O faturamento apurado com as ordens de serviço finalizadas da oficina caiu abaixo do limite de segurança operacional configurado.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Visual Thermometer / Progress Bar */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center space-x-1.5">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>Progresso em Relação à Meta</span>
              </span>
              <span className="font-mono text-rose-600 font-black tabular-nums text-sm">
                {alert.percentage}% da meta
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="relative w-full h-4 bg-slate-200 rounded-full overflow-hidden">
              {/* 20% Threshold Marker Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-20"
                style={{ left: '20%' }}
                title="Piso mínimo de 20%"
              />

              {/* Current Progress */}
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
                style={{ width: `${Math.min(100, alert.percentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>R$ 0,00</span>
              <span className="font-bold text-rose-700">Piso 20%: {formatCurrencyBRL(alert.thresholdValue)}</span>
              <span>Meta 100%: {formatCurrencyBRL(alert.targetRevenue)}</span>
            </div>
          </div>

          {/* Key Metric Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60">
              <span className="text-[11px] font-semibold text-rose-800 block">Faturamento Realizado</span>
              <span className="text-lg font-black text-rose-700 font-mono tabular-nums">
                {formatCurrencyBRL(alert.currentRevenue)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Ordens finalizadas</span>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60">
              <span className="text-[11px] font-semibold text-amber-800 block">Déficit p/ Piso de 20%</span>
              <span className="text-lg font-black text-amber-700 font-mono tabular-nums">
                {formatCurrencyBRL(alert.deficitToThreshold)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Falta para sair da zona crítica</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-600 block">Meta Mensal Configurada</span>
              <span className="text-lg font-black text-slate-900 font-mono tabular-nums">
                {formatCurrencyBRL(alert.targetRevenue)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Alvo do mês</span>
            </div>
          </div>

          {/* Recovery Opportunities & Action Plan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Oportunidades Imediatas de Recuperação de Caixa</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Contas a Receber Action Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-colors space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                      Contas a Receber
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {alert.unpaidCompletedCount} OS
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-mono tabular-nums mt-1.5">
                    {formatCurrencyBRL(alert.unpaidCompletedRevenue)}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Ordens concluídas aguardando pagamento do cliente. Dispare lembretes via WhatsApp para receber hoje.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToReceivables?.();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <span>Cobrar Contas a Receber</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Pátio / Kanban Action Card */}
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 hover:bg-sky-50 transition-colors space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 uppercase">
                      Em Execução no Pátio
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-700">
                      {alert.pipelineOrdersCount} OS
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-mono tabular-nums mt-1.5">
                    {formatCurrencyBRL(alert.pipelinePotentialRevenue)}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Potencial de receita em ordens abertas ou em andamento. Priorize a entrega dos carros prontos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToKanban?.();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <span>Ver Pátio / Kanban</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Recommendations List */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 block">Diagnóstico do Gestor:</span>
            <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px] leading-relaxed">
              {alert.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-[#00a2e8]" />
            <span>Reajustar Meta Mensal</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Entendido, Fechar Alerta
          </button>
        </div>
      </div>
    </div>
  );
};

interface MetaAlertsBannerProps {
  alert: RevenueGoalAlert;
  onOpenModal: () => void;
  onGoToReceivables?: () => void;
}

export const MetaAlertsBanner: React.FC<MetaAlertsBannerProps> = ({
  alert,
  onOpenModal,
  onGoToReceivables,
}) => {
  if (!alert.isCritical) return null;

  return (
    <div className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50 text-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
      <div className="flex items-start space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-black text-rose-950 uppercase tracking-wide">
              {alert.title}
            </h4>
            <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-200 text-rose-900 font-mono">
              {alert.percentage}% da meta alcançada (Piso: 20%)
            </span>
          </div>
          <p className="text-xs text-rose-900/90 font-medium">
            Faturamento apurado: <strong className="font-mono text-rose-950">{formatCurrencyBRL(alert.currentRevenue)}</strong> de{' '}
            <strong className="font-mono text-slate-800">{formatCurrencyBRL(alert.targetRevenue)}</strong>. Faltam{' '}
            <strong className="font-mono text-rose-950">{formatCurrencyBRL(alert.deficitToThreshold)}</strong> para atingir o piso de segurança de 20%.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start md:self-center shrink-0">
        {alert.unpaidCompletedCount > 0 && onGoToReceivables && (
          <button
            type="button"
            onClick={onGoToReceivables}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
            title="Cobrar ordens concluídas não pagas"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cobrar {alert.unpaidCompletedCount} a Receber</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenModal}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-colors"
        >
          <span>Ver Diagnóstico Completo</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
