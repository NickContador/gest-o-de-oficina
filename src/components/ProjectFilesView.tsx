import React, { useState } from 'react';
import {
  FolderTree,
  FileCode,
  Copy,
  Check,
  Download,
  Search,
  Database,
  Server,
  Layout,
  Cpu,
  BookOpen,
  RefreshCw,
  Sparkles,
  FileText,
} from 'lucide-react';
import { PROJECT_FILES, ProjectFileItem } from '../data/projectFiles.ts';
import { generateLiveReadmeMarkdown } from '../utils/workshopLogic.ts';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';

interface ProjectFilesViewProps {
  ordens?: OrdemServico[];
  clientes?: Cliente[];
  veiculos?: Veiculo[];
  checklist?: { id: string; title: string; mandatory: boolean; done: boolean }[];
}

export const ProjectFilesView: React.FC<ProjectFilesViewProps> = ({
  ordens = [],
  clientes = [],
  veiculos = [],
  checklist = [],
}) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('README.md');
  const [copied, setCopied] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate live dynamic readme content
  const totalRevenue = ordens.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
  const openOS = ordens.filter((o) => o.status === 'aberto').length;
  const inProgressOS = ordens.filter((o) => o.status === 'em_andamento').length;
  const completedOS = ordens.filter((o) => o.status === 'concluido' || o.status === 'entregue').length;

  const dynamicReadmeContent = generateLiveReadmeMarkdown({
    totalOS: ordens.length,
    openOS,
    inProgressOS,
    completedOS,
    totalClients: clientes.length,
    totalVehicles: veiculos.length,
    totalRevenue,
    checklist,
    lastUpdated: new Date().toLocaleString('pt-BR'),
  });

  const rawSelectedFile = PROJECT_FILES.find((f) => f.path === selectedFilePath) || PROJECT_FILES[0];

  // If README.md is selected, use the live dynamic content that updates on every change
  const isReadme = rawSelectedFile.path === 'README.md';
  const fileContent = isReadme ? dynamicReadmeContent : rawSelectedFile.content;

  const filteredFiles = PROJECT_FILES.filter((f) => {
    const matchesCat = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesSearch =
      f.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fileName = rawSelectedFile.path.split('/').pop() || 'script.txt';
    const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (cat: ProjectFileItem['category']) => {
    switch (cat) {
      case 'banco':
        return <Database className="w-3.5 h-3.5 text-amber-500" />;
      case 'backend':
        return <Server className="w-3.5 h-3.5 text-purple-500" />;
      case 'frontend':
        return <Layout className="w-3.5 h-3.5 text-[#00a2e8]" />;
      case 'paperclip':
        return <Cpu className="w-3.5 h-3.5 text-emerald-500" />;
      case 'docs':
        return <BookOpen className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
            <FolderTree className="w-3.5 h-3.5 text-[#00a2e8]" />
            <span>Estrutura de Pastas &amp; Documentação Viva</span>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>README.md Atualizado em Tempo Real</span>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">
          Documentação &amp; Arquivos Prontos para Execução
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Navegue pela estrutura completa do sistema. O arquivo <code className="text-[#00a2e8] font-bold">README.md</code> é
          sincronizado automaticamente com as métricas da sua oficina, status de deploy e scripts SQL.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Tree Navigator (Cols 1-4) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar arquivos..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00a2e8]"
              />
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {['all', 'docs', 'banco', 'backend', 'frontend', 'paperclip'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-bold transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#00a2e8] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat === 'docs' ? 'README & Docs' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* File List */}
          <div className="bg-white rounded-xl border border-slate-200 p-2 space-y-1 max-h-[550px] overflow-y-auto shadow-xs">
            {filteredFiles.map((file) => {
              const isSelected = file.path === selectedFilePath;
              const fileName = file.path.split('/').pop();
              const folder = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : 'Raiz do Projeto';

              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-2.5 ${
                    isSelected
                      ? 'bg-sky-50 border border-sky-300 text-[#00a2e8] shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">{getCategoryIcon(file.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold font-mono truncate text-slate-900 flex items-center justify-between">
                      <span>{fileName}</span>
                      {file.path === 'README.md' && (
                        <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{folder}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* File Content Viewer (Cols 5-12) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Action Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-900">{rawSelectedFile.path}</span>
                  {rawSelectedFile.badge && (
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20 font-bold">
                      {rawSelectedFile.badge}
                    </span>
                  )}
                  {isReadme && (
                    <span className="px-2 py-0.2 rounded text-[10px] font-sans bg-emerald-100 text-emerald-800 font-bold">
                      Sincronizado com os dados da oficina
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">{rawSelectedFile.description}</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#00a2e8] hover:bg-[#0089c7] text-white font-bold text-xs transition-colors shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Arquivo</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors border border-slate-300 shadow-2xs"
                  title="Baixar arquivo no computador"
                >
                  <Download className="w-3.5 h-3.5 text-[#00a2e8]" />
                  <span>Baixar {rawSelectedFile.path.split('.').pop()?.toUpperCase()}</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 bg-slate-900 overflow-x-auto max-h-[550px]">
              <pre className="text-xs font-mono text-emerald-300 leading-relaxed selection:bg-slate-700">
                <code>{fileContent}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
