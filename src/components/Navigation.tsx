import React from 'react';
import {
  FileText,
  Rocket,
  ShieldCheck,
  ImageIcon,
  FolderTree,
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  osCount: number;
  unreadNotifs: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  osCount,
}) => {
  const tabs = [
    {
      id: 'oficina',
      label: 'Ordens de Serviço',
      count: osCount,
      icon: FileText,
    },
    {
      id: 'deploy',
      label: 'Roteiro de Deploy',
      icon: Rocket,
    },
    {
      id: 'seguranca',
      label: 'Segurança & RLS',
      icon: ShieldCheck,
    },
    {
      id: 'diagramas',
      label: 'Laudos & Diagramas',
      icon: ImageIcon,
    },
    {
      id: 'arquivos',
      label: 'Arquivos & Scripts',
      icon: FolderTree,
    },
  ];

  return (
    <nav className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2">
      <div className="max-w-7xl mx-auto flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#00a2e8] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

