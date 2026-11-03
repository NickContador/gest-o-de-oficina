import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Bell,
  Menu,
  DollarSign,
  Clock,
  ShieldCheck,
  Check,
  AlertTriangle,
  Info,
  Wrench,
  User,
} from 'lucide-react';
import { Notificacao } from '../data/mockData.ts';
import { formatCurrencyBRL } from '../utils/workshopLogic.ts';

interface TopBarProps {
  onToggleSidebar?: () => void;
  onOpenQuickTriage: () => void;
  notificacoes: Notificacao[];
  onMarkNotificationRead: (id: string) => void;
  openOSCount: number;
  totalRevenue: number;
  globalSearchTerm: string;
  onGlobalSearchChange: (val: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  onOpenQuickTriage,
  notificacoes,
  onMarkNotificationRead,
  openOSCount,
  totalRevenue,
  globalSearchTerm,
  onGlobalSearchChange,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center space-x-3 flex-1 max-w-xl">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={globalSearchTerm}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Buscar por placa (ex: BRA2E19), cliente, veículo ou OS #..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-14 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00a2e8] focus:bg-white transition-all shadow-2xs"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center space-x-0.5 text-[10px] text-slate-400 font-mono bg-slate-200/60 px-1.5 py-0.5 rounded">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Middle: Mini Quick KPI pills for quick status */}
      <div className="hidden xl:flex items-center space-x-3 text-xs border-l border-slate-200 pl-4">
        <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
          <Clock className="w-3.5 h-3.5 text-[#00a2e8]" />
          <span className="text-slate-500 font-medium">OS em Aberto:</span>
          <span className="font-bold text-slate-900 tabular-nums">{openOSCount}</span>
        </div>

        <div className="flex items-center space-x-1.5 bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-200/80">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-500 font-medium">Faturamento:</span>
          <span className="font-bold text-emerald-700 font-mono tabular-nums">
            {formatCurrencyBRL(totalRevenue)}
          </span>
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
        {/* Fast Low-Latency AI Triage */}
        <button
          onClick={onOpenQuickTriage}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#00a2e8] font-bold text-xs border border-sky-200 transition-colors shadow-2xs"
          title="Triagem Rápida Automotiva com Gemini 3.1 Flash-Lite"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Triagem IA</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors"
            aria-label="Notificações do sistema"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-[#00a2e8]" />
                  <span className="text-xs font-bold text-slate-800">Notificações da Oficina</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Postgres Realtime
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notificacoes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Nenhuma notificação registrada.
                  </div>
                ) : (
                  notificacoes.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                        !item.lida ? 'bg-[#00a2e8]/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                          {item.tipo === 'os' && <Wrench className="w-3.5 h-3.5 text-[#00a2e8]" />}
                          {item.tipo === 'alerta' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          {item.tipo === 'sistema' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                          {item.tipo === 'aviso' && <Info className="w-3.5 h-3.5 text-slate-500" />}
                          <span>{item.titulo}</span>
                        </div>
                        {!item.lida && (
                          <button
                            onClick={() => onMarkNotificationRead(item.id)}
                            className="text-[10px] text-[#00a2e8] hover:underline font-semibold ml-2"
                          >
                            Marcar lida
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-slate-600 leading-relaxed">{item.mensagem}</p>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs border border-slate-700">
            MS
          </div>
          <div className="hidden md:block text-left text-xs leading-tight">
            <div className="font-bold text-slate-900">Marcos Silveira</div>
            <div className="text-[10px] text-slate-400">Mecânico Chefe</div>
          </div>
        </div>
      </div>
    </header>
  );
};
