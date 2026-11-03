import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wrench,
  Headphones,
  Check,
} from 'lucide-react';
import { MinhaOficinaLogo } from './MinhaOficinaLogo.tsx';
import { Notificacao } from '../data/mockData.ts';

interface HeaderProps {
  notificacoes: Notificacao[];
  onMarkNotificationRead: (id: string) => void;
  onOpenQuickTriage: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  deployProgress: number;
}

export const Header: React.FC<HeaderProps> = ({
  notificacoes,
  onMarkNotificationRead,
  onOpenQuickTriage,
  activeTab,
  setActiveTab,
  deployProgress,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top microbar with infrastructure & workshop context */}
      <div className="bg-slate-900 text-slate-300 px-4 sm:px-6 lg:px-8 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 select-none">
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span className="font-semibold text-white">Supabase Cloud</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-400 font-mono">sa-east-1 (SP)</span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <div className="hidden sm:flex items-center space-x-1 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Schemas isolados: <span className="text-emerald-400 font-mono font-medium">public</span> / <span className="text-amber-400 font-mono font-medium">private</span></span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Headphones className="w-3 h-3 text-[#00a2e8]" />
            <span>Suporte:</span>
            <span className="text-slate-200 font-medium">suporte@minhaoficina.net</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="text-slate-300">
            Unidade: <strong className="text-white font-medium">Auto Mecânica Central</strong>
          </div>
        </div>
      </div>

      {/* Main 3-Zone Header Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Authentic Brand */}
          <div
            className="cursor-pointer flex items-center space-x-3 group"
            onClick={() => setActiveTab('oficina')}
            title="Ir para o Painel da Oficina"
          >
            <MinhaOficinaLogo size="md" />
            <div className="hidden md:block pl-3 border-l border-slate-200">
              <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400 block">
                Software para Oficina
              </span>
              <span className="text-xs text-slate-700 font-medium">
                Gestão Automotiva Profissional
              </span>
            </div>
          </div>

          {/* Zone 3: Direct Actions & Identity */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Deploy Progress Checklist Link */}
            <button
              onClick={() => setActiveTab('deploy')}
              className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 transition-colors"
              title="Ver roteiro e progresso de deploy"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-600">Deploy Supabase:</span>
              <span className="font-bold text-emerald-600 tabular-nums">{deployProgress}%</span>
            </button>

            {/* Quick AI Triage (gemini-3.1-flash-lite) */}
            <button
              onClick={onOpenQuickTriage}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-[#00a2e8] hover:bg-[#008ecb] active:bg-[#007cb3] text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Triagem Rápida IA</span>
              <span className="sm:hidden">Triagem IA</span>
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
          </div>
        </div>
      </div>
    </header>
  );
};
