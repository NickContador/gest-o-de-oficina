import React from 'react';
import {
  FileText,
  Kanban,
  Car,
  Users,
  Package,
  DollarSign,
  ImageIcon,
  ShieldCheck,
  Rocket,
  FolderTree,
  Plus,
  Headphones,
  Keyboard,
  TrendingUp,
  Sliders,
  LayoutDashboard,
  Database,
} from 'lucide-react';
import { MinhaOficinaLogo } from './MinhaOficinaLogo.tsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  osCount: number;
  lowStockCount?: number;
  onOpenNewOS: () => void;
  deployProgress: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  osCount,
  lowStockCount = 1,
  onOpenNewOS,
  deployProgress,
}) => {
  const menuSections = [
    {
      title: 'OPERAÇÃO DA OFICINA',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard & BI',
          icon: LayoutDashboard,
          badge: 'BI',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        },
        {
          id: 'oficina',
          label: 'Ordens de Serviço',
          icon: FileText,
          badge: osCount,
          badgeColor: 'bg-[#00a2e8] text-white',
        },
        {
          id: 'kanban',
          label: 'Quadro Kanban',
          icon: Kanban,
          badge: 'Fluxo',
          badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        },
        {
          id: 'checklist360',
          label: 'Vistoria & Checklist 360°',
          icon: Car,
          badge: 'Check-in',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        },
        {
          id: 'clientes',
          label: 'Clientes & Veículos',
          icon: Users,
        },
        {
          id: 'estoque',
          label: 'Peças & Estoque',
          icon: Package,
          badge: lowStockCount > 0 ? `${lowStockCount} reposição` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        },
        {
          id: 'financeiro',
          label: 'Caixa & Financeiro',
          icon: DollarSign,
          badge: 'Receber & DRE',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'configuracao',
          label: 'Metas & Sistema',
          icon: Sliders,
          badge: 'Metas',
          badgeColor: 'bg-[#00a2e8]/20 text-[#00a2e8] border border-[#00a2e8]/30',
        },
        {
          id: 'banco_dados',
          label: 'Banco & Google Drive',
          icon: Database,
          badge: 'Backup',
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        },
      ],
    },
    {
      title: 'INTELIGÊNCIA & LAUDOS',
      items: [
        {
          id: 'diagramas',
          label: 'Laudos com IA',
          icon: ImageIcon,
          badge: 'Aspect Ratio',
          badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        },
      ],
    },
    {
      title: 'SUPABASE & ARQUITETURA',
      items: [
        {
          id: 'seguranca',
          label: 'Segurança & RLS',
          icon: ShieldCheck,
        },
        {
          id: 'deploy',
          label: 'Roteiro de Deploy',
          icon: Rocket,
          badge: `${deployProgress}%`,
          badgeColor: 'bg-emerald-600 text-white font-mono',
        },
        {
          id: 'arquivos',
          label: 'Arquivos & Scripts',
          icon: FolderTree,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none">
      {/* Brand Top Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div
          className="cursor-pointer"
          onClick={() => setActiveTab('oficina')}
          title="MinhaOficina — Gestão Automotiva"
        >
          <MinhaOficinaLogo size="md" theme="dark" />
        </div>
      </div>

      {/* Primary Action Button (F2 Shortcut) */}
      <div className="p-3">
        <button
          onClick={onOpenNewOS}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#00a2e8] to-[#008ecb] hover:from-[#0092d1] hover:to-[#007cb3] text-white font-bold text-xs shadow-md shadow-[#00a2e8]/20 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Emitir Nova OS</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-black/25 text-[10px] font-mono text-white/90">
            F2
          </span>
        </button>
      </div>

      {/* Menu Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-2.5 text-[10px] font-bold tracking-wider uppercase text-slate-500">
              {section.title}
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#00a2e8] text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#00a2e8]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums shrink-0 ${
                        isActive ? 'bg-black/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-800 text-[11px] space-y-2 bg-slate-950/50">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="font-semibold text-slate-200">Supabase Cloud</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">sa-east-1</span>
        </div>

        <div className="text-slate-400 truncate">
          Oficina: <span className="text-slate-200 font-medium">Auto Mecânica Central</span>
        </div>

        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <span>Atalhos: F2, Ctrl+K</span>
          <span className="font-mono text-slate-400">v2.4 Pro</span>
        </div>
      </div>
    </aside>
  );
};
