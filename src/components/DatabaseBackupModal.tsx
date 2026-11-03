import React, { useState } from 'react';
import {
  Database,
  HardDrive,
  Cloud,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  RefreshCw,
  FileText,
  ShieldCheck,
  ExternalLink,
  Save,
} from 'lucide-react';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  serializeDatabaseBackup,
  validateDatabaseBackup,
  DatabaseBackupPayload,
} from '../utils/workshopLogic.ts';
import { exportAllWorkshopDataToCSV } from '../services/csvExportService.ts';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  onRestoreDatabase: (restoredData: {
    ordens: OrdemServico[];
    clientes: Cliente[];
    veiculos: Veiculo[];
  }) => void;
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  ordens,
  clientes,
  veiculos,
  onRestoreDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'googledrive' | 'restaurar'>('local');
  const [restoreStatus, setRestoreStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [isSavedLocal, setIsSavedLocal] = useState(false);

  if (!isOpen) return null;

  // 1. Export complete JSON database locally
  const handleExportLocalJSON = () => {
    const payload = serializeDatabaseBackup(ordens, clientes, veiculos, undefined, 'local');
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `backup_minhaoficina_local_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Export complete JSON database for Google Drive
  const handleExportGoogleDriveJSON = () => {
    const payload = serializeDatabaseBackup(ordens, clientes, veiculos, undefined, 'google_drive');
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `GoogleDrive_Backup_MinhaOficina_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Open Google Drive in new window/tab for the user to upload
    window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer');
  };

  // 3. Save into Browser LocalStorage
  const handleSaveToLocalStorage = () => {
    try {
      const payload = serializeDatabaseBackup(ordens, clientes, veiculos, undefined, 'local');
      localStorage.setItem('minhaoficina_db_backup', JSON.stringify(payload));
      setIsSavedLocal(true);
      setTimeout(() => setIsSavedLocal(false), 3000);
    } catch (e) {
      console.error('Erro ao salvar no localStorage', e);
    }
  };

  // 4. Handle file upload restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateDatabaseBackup(parsed);

        if (!validation.valid) {
          setRestoreStatus({ success: false, message: validation.message });
          return;
        }

        onRestoreDatabase({
          ordens: parsed.tables.ordens,
          clientes: parsed.tables.clientes,
          veiculos: parsed.tables.veiculos,
        });

        setRestoreStatus({
          success: true,
          message: `Restauração concluída! ${validation.counts?.ordens} ordens, ${validation.counts?.clientes} clientes e ${validation.counts?.veiculos} veículos restaurados.`,
        });
      } catch (err: any) {
        setRestoreStatus({
          success: false,
          message: `Falha ao ler arquivo de backup: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#00a2e8]/20 text-[#00a2e8] flex items-center justify-center border border-[#00a2e8]/30">
              <Database className="w-5 h-5 text-[#00a2e8]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Gestão de Banco de Dados &amp; Backups</span>
              </h3>
              <p className="text-xs text-slate-400">
                Sincronização local no navegador e cópias seguras para o Google Drive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center px-5 pt-3 border-b border-slate-200 bg-slate-50 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all flex items-center space-x-1.5 border-b-2 ${
              activeTab === 'local'
                ? 'border-[#00a2e8] text-[#00a2e8]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Banco Local</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('googledrive')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all flex items-center space-x-1.5 border-b-2 ${
              activeTab === 'googledrive'
                ? 'border-[#00a2e8] text-[#00a2e8]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-amber-500" />
            <span>Google Drive</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restaurar')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all flex items-center space-x-1.5 border-b-2 ${
              activeTab === 'restaurar'
                ? 'border-[#00a2e8] text-[#00a2e8]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurar Banco</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: BANCO LOCAL */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              {/* Status Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Integridade da Base Local:</span>
                  </span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Online &amp; Seguro
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">ORDENS</span>
                    <strong className="text-slate-900 text-sm">{ordens.length}</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">CLIENTES</span>
                    <strong className="text-slate-900 text-sm">{clientes.length}</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">VEÍCULOS</span>
                    <strong className="text-slate-900 text-sm">{veiculos.length}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveToLocalStorage}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all space-y-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-slate-900 font-bold text-xs">
                    <span className="flex items-center space-x-1.5">
                      <Save className="w-4 h-4 text-[#00a2e8]" />
                      <span>Salvar no Armazenamento Local</span>
                    </span>
                    {isSavedLocal && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Salvo!</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Persiste todos os dados no cache seguro do navegador para manter o estado entre sessões.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleExportLocalJSON}
                  className="p-4 rounded-xl border border-slate-200 hover:border-[#00a2e8] hover:bg-sky-50/50 text-left transition-all space-y-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-slate-900 font-bold text-xs">
                    <span className="flex items-center space-x-1.5">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Baixar Backup Completo (.json)</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gera um arquivo portable com todas as tabelas (OS, clientes, veículos e histórico).
                  </p>
                </button>
              </div>

              {/* CSV Export Option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => exportAllWorkshopDataToCSV(ordens, clientes, veiculos)}
                  className="w-full p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-900 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Exportar Todos os Registros em Planilhas CSV (.csv)</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-mono">Compatível com Excel &rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeTab === 'googledrive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                  <Cloud className="w-4 h-4 text-amber-600" />
                  <span>Sincronização &amp; Armazenamento no Google Drive</span>
                </div>
                <p className="text-xs text-amber-800">
                  Salve os backups estruturados da sua oficina diretamente na sua conta do Google Drive para acesso remoto, proteção contra perda de dados físicos e compartilhamento contábil.
                </p>
              </div>

              {/* Step 1 & 2 Cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center font-mono">
                        1
                      </span>
                      <span>Exportar Arquivo de Backup para Google Drive</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleExportGoogleDriveJSON}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar &amp; Abrir Google Drive</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gera o pacote formatado com os carimbos de data e abre automaticamente a sua pasta do Google Drive em uma nova aba para salvar com 1 clique.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center font-mono">
                        2
                      </span>
                      <span>Planilhas no Google Drive (Google Sheets)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        exportAllWorkshopDataToCSV(ordens, clientes, veiculos);
                        window.open('https://sheets.google.com', '_blank', 'noopener,noreferrer');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Baixar CSV &amp; Abrir Sheets</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Exporta os dados em formato CSV puro (compatível nativamente com o Google Planilhas) para auditoria contábil e gráficos no Workspace.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESTAURAR BANCO */}
          {activeTab === 'restaurar' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Upload className="w-4 h-4 text-[#00a2e8]" />
                  <span>Restauração a partir de Arquivo JSON (.json)</span>
                </span>
                <p className="text-xs text-slate-500">
                  Selecione um arquivo de backup previamente exportado (local ou baixado do Google Drive) para restaurar os cadastros de ordens de serviço, clientes e veículos.
                </p>
              </div>

              {/* Upload Input Box */}
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#00a2e8] bg-slate-50/50 text-center space-y-3 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <label
                    htmlFor="backup-file-input"
                    className="cursor-pointer inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    <span>Selecionar Arquivo de Backup</span>
                  </label>
                  <input
                    id="backup-file-input"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Formatos suportados: .json gerados pelo MinhaOficina Pro ERP
                  </p>
                </div>
              </div>

              {/* Status Alert */}
              {restoreStatus && (
                <div
                  className={`p-4 rounded-xl border text-xs font-medium space-y-1 ${
                    restoreStatus.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold">
                    {restoreStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{restoreStatus.success ? 'Sucesso!' : 'Atenção'}</span>
                  </div>
                  <p>{restoreStatus.message}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>MinhaOficina Pro ERP · Backup Seguro RFC 4180</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
