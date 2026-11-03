import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { WorkshopView } from './components/WorkshopView.tsx';
import { KanbanBoard } from './components/KanbanBoard.tsx';
import { Checklist360View } from './components/Checklist360View.tsx';
import { EstoqueView } from './components/EstoqueView.tsx';
import { DeployGuideView } from './components/DeployGuideView.tsx';
import { SecurityRLSView } from './components/SecurityRLSView.tsx';
import { InspectionDiagramGenerator } from './components/InspectionDiagramGenerator.tsx';
import { ProjectFilesView } from './components/ProjectFilesView.tsx';
import { QuickAITriageModal } from './components/QuickAITriageModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { DatabaseBackupModal } from './components/DatabaseBackupModal.tsx';
import {
  INITIAL_CLIENTES,
  INITIAL_VEICULOS,
  INITIAL_ORDENS,
  INITIAL_NOTIFICACOES,
  INITIAL_CHECKLIST,
  Cliente,
  Veiculo,
  OrdemServico,
  Notificacao,
} from './data/mockData.ts';
import {
  verifyDeployChecklistCompletion,
  serializeDatabaseBackup,
  validateDatabaseBackup,
} from './utils/workshopLogic.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isNewOSModalOpen, setIsNewOSModalOpen] = useState(false);
  const [isDatabaseBackupOpen, setIsDatabaseBackupOpen] = useState(false);

  const [ordens, setOrdens] = useState<OrdemServico[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('minhaoficina_db_backup');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.tables?.ordens?.length) return parsed.tables.ordens;
        }
      } catch (e) {
        console.error('Erro ao ler ordens do cache local', e);
      }
    }
    return INITIAL_ORDENS;
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('minhaoficina_db_backup');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.tables?.clientes?.length) return parsed.tables.clientes;
        }
      } catch (e) {
        console.error('Erro ao ler clientes do cache local', e);
      }
    }
    return INITIAL_CLIENTES;
  });

  const [veiculos, setVeiculos] = useState<Veiculo[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('minhaoficina_db_backup');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.tables?.veiculos?.length) return parsed.tables.veiculos;
        }
      } catch (e) {
        console.error('Erro ao ler veículos do cache local', e);
      }
    }
    return INITIAL_VEICULOS;
  });

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(INITIAL_NOTIFICACOES);
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [isQuickTriageOpen, setIsQuickTriageOpen] = useState(false);

  const handleRestoreDatabase = (restored: {
    ordens: OrdemServico[];
    clientes: Cliente[];
    veiculos: Veiculo[];
  }) => {
    setOrdens(restored.ordens);
    setClientes(restored.clientes);
    setVeiculos(restored.veiculos);
    try {
      const payload = serializeDatabaseBackup(restored.ordens, restored.clientes, restored.veiculos, undefined, 'local');
      localStorage.setItem('minhaoficina_db_backup', JSON.stringify(payload));
    } catch (e) {
      console.error('Erro ao sincronizar backup local', e);
    }

    const restoreNotification: Notificacao = {
      id: `notif-${Date.now()}`,
      usuario_id: 'usr-oficina-7729-uuid',
      titulo: 'Banco de Dados Restaurado',
      mensagem: `${restored.ordens.length} OS, ${restored.clientes.length} clientes e ${restored.veiculos.length} veículos carregados com sucesso.`,
      lida: false,
      tipo: 'sistema',
      referencia_id: 'backup-restore',
      created_at: new Date().toISOString(),
    };
    setNotificacoes((prev) => [restoreNotification, ...prev]);
  };

  // Deploy progress metric
  const deployStatus = verifyDeployChecklistCompletion(checklist);

  // Global Keyboard Shortcuts (F2 for New OS, Escape to close modals, Ctrl+K to search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('oficina');
        setIsNewOSModalOpen(true);
      } else if (e.key === 'Escape') {
        setIsNewOSModalOpen(false);
        setIsQuickTriageOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleCreateOS = (newOSData: Omit<OrdemServico, 'id' | 'numero_os' | 'created_at'>) => {
    const nextNumber = Math.max(...ordens.map((o) => o.numero_os), 1040) + 1;
    const newId = `os-${Date.now()}`;

    const createdOS: OrdemServico = {
      ...newOSData,
      id: newId,
      numero_os: nextNumber,
    };

    setOrdens((prev) => [createdOS, ...prev]);

    // Push simulated Postgres Realtime notification
    const client = clientes.find((c) => c.id === newOSData.cliente_id);
    const vehicle = veiculos.find((v) => v.id === newOSData.veiculo_id);

    const newNotification: Notificacao = {
      id: `notif-${Date.now()}`,
      usuario_id: 'usr-oficina-7729-uuid',
      titulo: `Nova OS Emitida #${nextNumber}`,
      mensagem: `${vehicle?.marca} ${vehicle?.modelo} (${vehicle?.placa}) para o cliente ${client?.nome_completo}.`,
      lida: false,
      tipo: 'os',
      referencia_id: newId,
      created_at: new Date().toISOString(),
    };

    setNotificacoes((prev) => [newNotification, ...prev]);
  };

  const handleUpdateOSStatus = (id: string, newStatus: OrdemServico['status']) => {
    setOrdens((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );

    const targetOS = ordens.find((o) => o.id === id);
    if (targetOS) {
      const statusLabels: Record<OrdemServico['status'], string> = {
        aberto: 'Em Aberto',
        em_andamento: 'Em Execução',
        aguardando_pecas: 'Aguardando Peças',
        concluido: 'Finalizada',
        entregue: 'Entregue ao Cliente',
      };

      const newNotification: Notificacao = {
        id: `notif-${Date.now()}`,
        usuario_id: 'usr-oficina-7729-uuid',
        titulo: `Status Atualizado: OS #${targetOS.numero_os}`,
        mensagem: `A ordem de serviço mudou para o status "${statusLabels[newStatus]}".`,
        lida: false,
        tipo: 'os',
        referencia_id: id,
        created_at: new Date().toISOString(),
      };

      setNotificacoes((prev) => [newNotification, ...prev]);
    }
  };

  const handleUpdateOSPaymentStatus = (
    id: string,
    newPaymentStatus: 'pago' | 'pendente' | 'vencido',
    paymentMethod: string = 'Pix'
  ) => {
    setOrdens((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status_pagamento: newPaymentStatus,
              forma_pagamento: newPaymentStatus === 'pago' ? paymentMethod : o.forma_pagamento,
            }
          : o
      )
    );

    const targetOS = ordens.find((o) => o.id === id);
    if (targetOS && newPaymentStatus === 'pago') {
      const newNotification: Notificacao = {
        id: `notif-${Date.now()}`,
        usuario_id: 'usr-oficina-7729-uuid',
        titulo: `Pagamento Confirmado: OS #${targetOS.numero_os}`,
        mensagem: `Valor de R$ ${(targetOS.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebido com sucesso via ${paymentMethod}.`,
        lida: false,
        tipo: 'aviso',
        referencia_id: id,
        created_at: new Date().toISOString(),
      };

      setNotificacoes((prev) => [newNotification, ...prev]);
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const handleOpenNewOSFromSidebar = () => {
    setActiveTab('oficina');
    setIsNewOSModalOpen(true);
    setIsSidebarOpenMobile(false);
  };

  const totalRevenue = ordens.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
  const openOSCount = ordens.filter((o) => o.status === 'aberto').length;

  return (
    <div className="h-screen w-screen flex bg-slate-100 text-slate-800 font-sans selection:bg-[#00a2e8] selection:text-white overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex h-full shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          osCount={ordens.length}
          onOpenNewOS={handleOpenNewOSFromSidebar}
          deployProgress={deployStatus.completionPercentage}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsSidebarOpenMobile(false)}
          />
          <div className="relative z-10 w-64 h-full">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsSidebarOpenMobile(false);
              }}
              osCount={ordens.length}
              onOpenNewOS={handleOpenNewOSFromSidebar}
              deployProgress={deployStatus.completionPercentage}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* TopBar with Global Search and Quick Actions */}
        <TopBar
          onToggleSidebar={() => setIsSidebarOpenMobile(true)}
          onOpenQuickTriage={() => setIsQuickTriageOpen(true)}
          notificacoes={notificacoes}
          onMarkNotificationRead={handleMarkNotificationRead}
          openOSCount={openOSCount}
          totalRevenue={totalRevenue}
          globalSearchTerm={globalSearchTerm}
          onGlobalSearchChange={setGlobalSearchTerm}
        />

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {(activeTab === 'dashboard' || activeTab === 'banco_dados') && (
            <DashboardView
              ordens={ordens}
              clientes={clientes}
              veiculos={veiculos}
              onNavigateTab={setActiveTab}
              onOpenNewOS={handleOpenNewOSFromSidebar}
              onOpenDatabaseBackup={() => setIsDatabaseBackupOpen(true)}
            />
          )}

          {activeTab === 'oficina' && (
            <WorkshopView
              ordens={ordens}
              clientes={clientes}
              veiculos={veiculos}
              onCreateOS={handleCreateOS}
              onUpdateOSStatus={handleUpdateOSStatus}
              onUpdateOSPaymentStatus={handleUpdateOSPaymentStatus}
              isExternalNewOSOpen={isNewOSModalOpen}
              onCloseExternalNewOS={() => setIsNewOSModalOpen(false)}
              activeSubSection="os"
              globalSearchTerm={globalSearchTerm}
            />
          )}

          {activeTab === 'kanban' && (
            <KanbanBoard
              ordens={ordens}
              clientes={clientes}
              veiculos={veiculos}
              onUpdateOSStatus={handleUpdateOSStatus}
              onOpenNewOS={() => {
                setActiveTab('oficina');
                setIsNewOSModalOpen(true);
              }}
              globalSearchTerm={globalSearchTerm}
            />
          )}

          {activeTab === 'checklist360' && (
            <Checklist360View
              ordens={ordens}
              veiculos={veiculos}
              clientes={clientes}
              onOpenQuickTriage={() => setIsQuickTriageOpen(true)}
            />
          )}

          {activeTab === 'clientes' && (
            <WorkshopView
              ordens={ordens}
              clientes={clientes}
              veiculos={veiculos}
              onCreateOS={handleCreateOS}
              onUpdateOSStatus={handleUpdateOSStatus}
              onUpdateOSPaymentStatus={handleUpdateOSPaymentStatus}
              activeSubSection="clientes"
              globalSearchTerm={globalSearchTerm}
            />
          )}

          {activeTab === 'estoque' && <EstoqueView />}

          {activeTab === 'financeiro' && (
            <WorkshopView
              ordens={ordens}
              clientes={clientes}
              veiculos={veiculos}
              onCreateOS={handleCreateOS}
              onUpdateOSStatus={handleUpdateOSStatus}
              onUpdateOSPaymentStatus={handleUpdateOSPaymentStatus}
              activeSubSection="financeiro"
              globalSearchTerm={globalSearchTerm}
            />
          )}

          {activeTab === 'configuracao' && (
            <WorkshopView
              ordens={ordens}
              clientes={clientes}
              veiculos={veiculos}
              onCreateOS={handleCreateOS}
              onUpdateOSStatus={handleUpdateOSStatus}
              onUpdateOSPaymentStatus={handleUpdateOSPaymentStatus}
              activeSubSection="financeiro"
              isExternalGoalsOpen={true}
              onCloseExternalGoals={() => setActiveTab('financeiro')}
              globalSearchTerm={globalSearchTerm}
            />
          )}

          {activeTab === 'diagramas' && (
            <InspectionDiagramGenerator ordens={ordens} />
          )}

          {activeTab === 'seguranca' && <SecurityRLSView />}

          {activeTab === 'deploy' && (
            <DeployGuideView
              checklist={checklist}
              onToggleChecklistItem={handleToggleChecklistItem}
              onOpenQuickTriage={() => setIsQuickTriageOpen(true)}
            />
          )}

          {activeTab === 'arquivos' && (
            <ProjectFilesView
              ordens={ordens}
              clientes={clientes}
              veiculos={veiculos}
              checklist={checklist}
            />
          )}
        </main>
      </div>

      {/* Ultra-low latency Gemini AI Modal */}
      <QuickAITriageModal
        isOpen={isQuickTriageOpen}
        onClose={() => setIsQuickTriageOpen(false)}
      />

      {/* Database & Google Drive Backup Modal */}
      <DatabaseBackupModal
        isOpen={isDatabaseBackupOpen || activeTab === 'banco_dados'}
        onClose={() => {
          setIsDatabaseBackupOpen(false);
          if (activeTab === 'banco_dados') {
            setActiveTab('dashboard');
          }
        }}
        ordens={ordens}
        clientes={clientes}
        veiculos={veiculos}
        onRestoreDatabase={handleRestoreDatabase}
      />
    </div>
  );
}
