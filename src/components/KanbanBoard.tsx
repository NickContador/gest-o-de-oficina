import React, { useState } from 'react';
import {
  Clock,
  Wrench,
  Package,
  CheckCircle2,
  CheckCheck,
  Plus,
  Search,
  ArrowRight,
  ArrowLeft,
  Share2,
  FileText,
  User,
  Car,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  formatCurrencyBRL,
  calculateKanbanColumnTotals,
  generateWhatsAppMessageForOS,
} from '../utils/workshopLogic.ts';
import { OrdemServicoLaudoModal } from './OrdemServicoLaudoModal.tsx';

interface KanbanBoardProps {
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  onUpdateOSStatus: (id: string, status: OrdemServico['status']) => void;
  onOpenNewOS: () => void;
  globalSearchTerm?: string;
}

interface ColumnConfig {
  id: OrdemServico['status'];
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  headerBg: string;
  badgeBg: string;
  borderAccent: string;
  accentText: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'aberto',
    title: 'Orçamento / Entrada',
    icon: Clock,
    headerBg: 'bg-amber-500/10',
    badgeBg: 'bg-amber-100 text-amber-800',
    borderAccent: 'border-t-amber-500',
    accentText: 'text-amber-700',
  },
  {
    id: 'em_andamento',
    title: 'Na Oficina / Execução',
    icon: Wrench,
    headerBg: 'bg-sky-500/10',
    badgeBg: 'bg-sky-100 text-sky-800',
    borderAccent: 'border-t-[#00a2e8]',
    accentText: 'text-[#00a2e8]',
  },
  {
    id: 'aguardando_pecas',
    title: 'Aguardando Peças',
    icon: Package,
    headerBg: 'bg-purple-500/10',
    badgeBg: 'bg-purple-100 text-purple-800',
    borderAccent: 'border-t-purple-500',
    accentText: 'text-purple-700',
  },
  {
    id: 'concluido',
    title: 'Pronto p/ Retirada',
    icon: CheckCircle2,
    headerBg: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    borderAccent: 'border-t-emerald-500',
    accentText: 'text-emerald-700',
  },
  {
    id: 'entregue',
    title: 'Entregue / Finalizado',
    icon: CheckCheck,
    headerBg: 'bg-slate-500/10',
    badgeBg: 'bg-slate-100 text-slate-700',
    borderAccent: 'border-t-slate-500',
    accentText: 'text-slate-700',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  ordens,
  clientes,
  veiculos,
  onUpdateOSStatus,
  onOpenNewOS,
  globalSearchTerm = '',
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [draggedOSId, setDraggedOSId] = useState<string | null>(null);
  const [activeDragOverColumn, setActiveDragOverColumn] = useState<string | null>(null);

  // Selected OS for A4 modal
  const [selectedOSForLaudo, setSelectedOSForLaudo] = useState<OrdemServico | null>(null);

  const effectiveSearch = (globalSearchTerm || localSearch).toLowerCase().trim();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedOSId(id);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (activeDragOverColumn !== colId) {
      setActiveDragOverColumn(colId);
    }
  };

  const handleDragLeave = () => {
    setActiveDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: OrdemServico['status']) => {
    e.preventDefault();
    setActiveDragOverColumn(null);
    const osId = e.dataTransfer.getData('text/plain') || draggedOSId;
    if (osId) {
      onUpdateOSStatus(osId, targetStatus);
    }
    setDraggedOSId(null);
  };

  const handleQuickWhatsApp = (os: OrdemServico) => {
    const client = clientes.find((c) => c.id === os.cliente_id);
    const vehicle = veiculos.find((v) => v.id === os.veiculo_id);
    const message = generateWhatsAppMessageForOS({
      osNumber: os.numero_os,
      clientName: client?.nome_completo || 'Cliente',
      vehicleModel: vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Veículo',
      vehiclePlate: vehicle?.placa || 'Placa',
      status: os.status,
      totalValue: os.valor_total,
      problemDesc: os.descricao_problema,
    });
    const phone = client?.dados_privados?.telefone?.replace(/\D/g, '') || '';
    window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  // Status progression helper
  const getNextStatus = (current: OrdemServico['status']): OrdemServico['status'] | null => {
    switch (current) {
      case 'aberto':
        return 'em_andamento';
      case 'em_andamento':
        return 'concluido';
      case 'aguardando_pecas':
        return 'em_andamento';
      case 'concluido':
        return 'entregue';
      default:
        return null;
    }
  };

  const getPreviousStatus = (current: OrdemServico['status']): OrdemServico['status'] | null => {
    switch (current) {
      case 'entregue':
        return 'concluido';
      case 'concluido':
        return 'em_andamento';
      case 'em_andamento':
        return 'aberto';
      case 'aguardando_pecas':
        return 'aberto';
      default:
        return null;
    }
  };

  const selectedClient = selectedOSForLaudo
    ? clientes.find((c) => c.id === selectedOSForLaudo.cliente_id)
    : undefined;

  const selectedVehicle = selectedOSForLaudo
    ? veiculos.find((v) => v.id === selectedOSForLaudo.veiculo_id)
    : undefined;

  return (
    <div className="space-y-4">
      {/* Top Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filtrar por placa, cliente ou modelo no Kanban..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#00a2e8] focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 font-medium px-2">
            <span>Dica: Arraste os cartões entre as colunas</span>
          </div>

          <button
            onClick={onOpenNewOS}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#00a2e8] hover:bg-[#008ecb] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova OS</span>
          </button>
        </div>
      </div>

      {/* Kanban Multi-Column Viewport */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const { count, totalValue } = calculateKanbanColumnTotals(ordens, col.id);

          const columnOrdens = ordens.filter((os) => {
            if (os.status !== col.id) return false;
            if (!effectiveSearch) return true;

            const client = clientes.find((c) => c.id === os.cliente_id);
            const vehicle = veiculos.find((v) => v.id === os.veiculo_id);

            return (
              os.numero_os.toString().includes(effectiveSearch) ||
              os.descricao_problema.toLowerCase().includes(effectiveSearch) ||
              (client && client.nome_completo.toLowerCase().includes(effectiveSearch)) ||
              (vehicle && (vehicle.placa.toLowerCase().includes(effectiveSearch) || vehicle.modelo.toLowerCase().includes(effectiveSearch)))
            );
          });

          const isOver = activeDragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col bg-slate-50 rounded-xl border-t-4 border border-slate-200 transition-colors ${
                col.borderAccent
              } ${isOver ? 'bg-sky-50/70 border-[#00a2e8] ring-2 ring-[#00a2e8]/20' : ''}`}
            >
              {/* Column Header */}
              <div className={`p-3 border-b border-slate-200/80 rounded-t-lg ${col.headerBg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${col.accentText}`} />
                    <span className="text-xs font-bold text-slate-800">{col.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${col.badgeBg}`}>
                    {count}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    {formatCurrencyBRL(totalValue)}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-2 space-y-2.5 min-h-[460px] max-h-[calc(100vh-250px)] overflow-y-auto">
                {columnOrdens.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-3 text-center text-slate-400 text-xs">
                    <span>Nenhuma OS nesta etapa</span>
                    <span className="text-[10px] text-slate-400 mt-1">Arraste para mover para cá</span>
                  </div>
                ) : (
                  columnOrdens.map((os) => {
                    const client = clientes.find((c) => c.id === os.cliente_id);
                    const vehicle = veiculos.find((v) => v.id === os.veiculo_id);
                    const next = getNextStatus(os.status);
                    const prev = getPreviousStatus(os.status);

                    return (
                      <div
                        key={os.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, os.id)}
                        className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group space-y-2.5"
                      >
                        {/* OS Number & Mercosul Plate Lockup */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-[#00a2e8] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                            #{os.numero_os}
                          </span>

                          {vehicle && (
                            <div className="w-20 h-6.5 bg-white border border-slate-900 rounded-xs shadow-2xs flex flex-col overflow-hidden">
                              <div className="bg-[#003399] text-white text-[6.5px] font-bold px-1 flex items-center justify-between leading-none py-0.5">
                                <span>BRASIL</span>
                                <span>🇧🇷</span>
                              </div>
                              <div className="flex-1 flex items-center justify-center font-black text-[10px] tracking-wider text-slate-900 font-mono leading-none">
                                {vehicle.placa}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Client and Vehicle */}
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {client?.nome_completo || 'Cliente'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Veículo não informado'}
                          </div>
                        </div>

                        {/* Problem description brief */}
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                          {os.descricao_problema}
                        </p>

                        {/* Monetary Total and Technician */}
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {os.tecnico_responsavel?.split(' ')[0] || 'Mecânico'}
                          </div>
                          <div className="text-xs font-black text-slate-900 font-mono tabular-nums">
                            {formatCurrencyBRL(os.valor_total)}
                          </div>
                        </div>

                        {/* Action buttons footer */}
                        <div className="pt-1 flex items-center justify-between gap-1">
                          {/* Open A4 Sheet Modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedOSForLaudo(os)}
                            className="flex-1 flex items-center justify-center space-x-1 py-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                            title="Visualizar laudo técnico e orçamento A4"
                          >
                            <FileText className="w-3 h-3 text-[#00a2e8]" />
                            <span>Laudo A4</span>
                          </button>

                          {/* Quick WhatsApp Dispatch */}
                          <button
                            type="button"
                            onClick={() => handleQuickWhatsApp(os)}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                            title="Disparar status no WhatsApp"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>

                          {/* Column Transitions */}
                          {prev && (
                            <button
                              type="button"
                              onClick={() => onUpdateOSStatus(os.id, prev)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                              title="Retornar para etapa anterior"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}

                          {next && (
                            <button
                              type="button"
                              onClick={() => onUpdateOSStatus(os.id, next)}
                              className="p-1 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold transition-colors"
                              title="Avançar para próxima etapa"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* A4 Sheet & WhatsApp Modal */}
      <OrdemServicoLaudoModal
        os={selectedOSForLaudo}
        cliente={selectedClient}
        veiculo={selectedVehicle}
        isOpen={!!selectedOSForLaudo}
        onClose={() => setSelectedOSForLaudo(null)}
        onUpdateStatus={(id, status) => {
          onUpdateOSStatus(id, status);
          if (selectedOSForLaudo) {
            setSelectedOSForLaudo({ ...selectedOSForLaudo, status });
          }
        }}
      />
    </div>
  );
};
