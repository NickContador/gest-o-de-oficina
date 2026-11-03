import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Database,
  ShieldCheck,
  AlertCircle,
  Download,
  Play,
  FileCode,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DEPLOY_STAGES } from '../data/deployGuide.ts';
import { PROJECT_FILES } from '../data/projectFiles.ts';

interface DeployGuideViewProps {
  checklist: { id: string; title: string; mandatory: boolean; done: boolean }[];
  onToggleChecklistItem: (id: string) => void;
  onOpenQuickTriage: () => void;
}

export const DeployGuideView: React.FC<DeployGuideViewProps> = ({
  checklist,
  onToggleChecklistItem,
  onOpenQuickTriage,
}) => {
  const [activeStageId, setActiveStageId] = useState<string>('stage-supabase-setup');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [simulatedExecution, setSimulatedExecution] = useState<Record<string, boolean>>({});
  const [activeSqlTab, setActiveSqlTab] = useState<number>(0);

  const activeStage = DEPLOY_STAGES.find((s) => s.id === activeStageId) || DEPLOY_STAGES[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSimulateSql = (scriptName: string) => {
    setSimulatedExecution((prev) => ({ ...prev, [scriptName]: true }));
  };

  const sqlFiles = PROJECT_FILES.filter((f) => f.category === 'banco');

  const completedMandatory = checklist.filter((i) => i.mandatory && i.done).length;
  const totalMandatory = checklist.filter((i) => i.mandatory).length;
  const progressPercent = Math.round((completedMandatory / totalMandatory) * 100);

  const generateRunbookMarkdown = () => {
    const lines = [
      '# RUNBOOK OFICIAL DE DEPLOY — MINHAOFICINA & SUPABASE',
      `Data de emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
      `Status do Checklist: ${completedMandatory}/${totalMandatory} obrigatórios concluídos (${progressPercent}%)\n`,
      '## 1. Topologia de Schemas',
      '- public: Tabelas operacionais com RLS ativado (clientes, veiculos, ordens_servico, notificacoes)',
      '- private: Tabela sigilosa (dados_pessoais) com acesso exclusivo por service_role via Edge Functions\n',
      '## 2. Checklist de Segurança & Go-Live',
      ...checklist.map((item) => `- [${item.done ? 'x' : ' '}] ${item.title} ${item.mandatory ? '(Obrigatório)' : '(Opcional)'}`),
      '\n## 3. URLs e Endpoints de Produção',
      '- Supabase URL: Configurado em VITE_SUPABASE_URL',
      '- Supabase Anon Key: Configurado em VITE_SUPABASE_ANON_KEY',
      '- Edge Functions:',
      '  * /buscar-dados-privados (Validação JWT + Service Role)',
      '  * /paperclip-ponte (Ponte Restrita de Agentes IA)',
      '  * /notificar-usuario (Disparador Postgres Realtime)\n',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'runbook-deploy-minhaoficina.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Hero (MinhaOficina Clean Style) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#00a2e8]/10 text-[#00a2e8] text-xs font-bold border border-[#00a2e8]/20">
              <Rocket className="w-3.5 h-3.5" />
              <span>Roteiro de Deploy Passo a Passo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Como Colocar o Sistema MinhaOficina no Ar
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Execute as 6 etapas na ordem exata para configurar seu banco <strong className="text-slate-900">Supabase</strong> com isolamento total de schemas (public &amp; private), segurança RLS ativada e backend serverless.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[220px]">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1.5">
                <span>Progresso do Deploy</span>
                <span className="font-bold text-emerald-600 font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#00a2e8] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                {completedMandatory} de {totalMandatory} itens críticos validados
              </span>
            </div>

            <button
              onClick={generateRunbookMarkdown}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-[#00a2e8]" />
              <span>Baixar Runbook .md</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Stages Navigator + Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stages Sidebar (Cols 1-4) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">6 Etapas do Deploy</h2>
            <span className="text-xs text-[#00a2e8] font-bold">Sequência Estrita</span>
          </div>

          <div className="space-y-2">
            {DEPLOY_STAGES.map((stage) => {
              const isSelected = stage.id === activeStageId;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-sky-50/70 border-[#00a2e8] text-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#00a2e8] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {stage.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-[#00a2e8]' : 'text-slate-800'}`}>
                        {stage.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{stage.summary}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick AI Callout */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <div className="flex items-center space-x-1.5 text-slate-900 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-[#00a2e8]" />
              <span>Dúvida durante o deploy?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consulte o assistente de baixa latência com <strong className="text-slate-900">gemini-3.1-flash-lite</strong> para suporte imediato sobre comandos ou SQL.
            </p>
            <button
              onClick={onOpenQuickTriage}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 font-bold transition-colors flex items-center justify-center space-x-1"
            >
              <span>Abrir Assistente de Deploy</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#00a2e8]" />
            </button>
          </div>
        </div>

        {/* Stage Content Workspace (Cols 5-12) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
            {/* Stage Header */}
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-xs font-bold bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20 rounded">
                    Etapa {activeStage.number} de 6
                  </span>
                  <span className="text-xs text-slate-500 font-medium">• {activeStage.estimatedTime}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{activeStage.title}</h2>
                <p className="text-xs text-slate-600">{activeStage.summary}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Pré-requisitos:</span>
                {activeStage.prerequisites.map((p, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-slate-600 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Section for Stage 2: SQL Scripts Execution */}
            {activeStage.id === 'stage-sql-execution' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-[#00a2e8]" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Scripts SQL Prontos (Execute na Ordem no SQL Editor)
                    </h3>
                  </div>
                </div>

                {/* SQL Tab Selector */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                  {sqlFiles.map((sql, idx) => {
                    const isTabActive = activeSqlTab === idx;
                    const fileName = sql.path.split('/').pop() || '';
                    const isSimulated = simulatedExecution[fileName];
                    return (
                      <button
                        key={sql.path}
                        onClick={() => setActiveSqlTab(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center space-x-2 border whitespace-nowrap ${
                          isTabActive
                            ? 'bg-[#00a2e8] text-white border-[#008cc9] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{fileName}</span>
                        {isSimulated && <Check className="w-3.5 h-3.5 text-emerald-300" />}
                      </button>
                    );
                  })}
                </div>

                {/* Active SQL Viewer Box */}
                {sqlFiles[activeSqlTab] && (
                  <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden text-slate-100">
                    <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        {sqlFiles[activeSqlTab].path}
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleCopy(sqlFiles[activeSqlTab].content, `sql-${activeSqlTab}`)
                          }
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#00a2e8] hover:bg-[#0090ce] text-white font-bold text-xs transition-colors"
                        >
                          {copiedCodeId === `sql-${activeSqlTab}` ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar SQL</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() =>
                            handleSimulateSql(sqlFiles[activeSqlTab].path.split('/').pop() || '')
                          }
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                        >
                          <Play className="w-3 h-3 text-emerald-400" />
                          <span>Marcar Executado</span>
                        </button>
                      </div>
                    </div>

                    <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
                      <code>{sqlFiles[activeSqlTab].content}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Steps in the stage */}
            <div className="space-y-4">
              {activeStage.steps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#00a2e8] text-white text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pl-8">
                    {step.description}
                  </p>

                  {/* Terminal Snippet Box */}
                  {step.terminalSnippet && (
                    <div className="ml-8 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
                      <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <div className="flex items-center space-x-2">
                          <Terminal className="w-3.5 h-3.5 text-amber-400" />
                          <span>Terminal</span>
                        </div>
                        <button
                          onClick={() => handleCopy(step.terminalSnippet!, `term-${idx}`)}
                          className="text-xs text-[#00a2e8] hover:underline"
                        >
                          {copiedCodeId === `term-${idx}` ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <pre className="p-3 text-xs font-mono text-amber-300 overflow-x-auto">
                        <code>{step.terminalSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* Code Snippet Box */}
                  {step.codeSnippet && (
                    <div className="ml-8 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
                      <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Código / SQL</span>
                        <button
                          onClick={() => handleCopy(step.codeSnippet!, `code-${idx}`)}
                          className="text-xs text-[#00a2e8] hover:underline"
                        >
                          {copiedCodeId === `code-${idx}` ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <pre className="p-3 text-xs font-mono text-sky-300 overflow-x-auto">
                        <code>{step.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {step.warning && (
                    <div className="ml-8 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span>{step.warning}</span>
                    </div>
                  )}

                  {step.tip && (
                    <div className="ml-8 p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-[#00a2e8] flex-shrink-0 mt-0.5" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Checklist Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Checklist Oficial de Go-Live</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Marque cada validação</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    item.done
                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => onToggleChecklistItem(item.id)}
                    className="mt-0.5 rounded border-slate-300 text-[#00a2e8] focus:ring-[#00a2e8]"
                  />
                  <div className="space-y-0.5 text-xs">
                    <span className={item.done ? 'line-through text-slate-500' : 'font-medium'}>
                      {item.title}
                    </span>
                    {item.mandatory && (
                      <span className="block text-[10px] text-amber-700 font-semibold font-mono">
                        (Obrigatório para Produção)
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
