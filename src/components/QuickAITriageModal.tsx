import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Send,
  X,
  Copy,
  Check,
  Bot,
  RotateCcw,
} from 'lucide-react';
import { MinhaOficinaLogo } from './MinhaOficinaLogo.tsx';

interface QuickAITriageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAITriageModal: React.FC<QuickAITriageModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    'Carro falhando em aceleração com luz EPC acesa',
    'Freio fazendo barulho metálico e pedal trepidando',
    'Como confirmar que o schema private está protegido do anon?',
    'Comando correto para subir as 3 Edge Functions no Supabase',
    'Qual a variável pública correta para o frontend na Vercel?',
  ];

  const handleSendQuery = async (queryText?: string) => {
    const text = queryText || prompt;
    if (!text.trim()) return;

    setLoading(true);
    setResponse(null);
    const startTime = performance.now();

    try {
      const res = await fetch('/api/ai/quick-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setResponse(data.response || 'Sem resposta disponível.');
    } catch (err: any) {
      setResponse('Erro ao conectar ao assistente de triagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <MinhaOficinaLogo size="sm" showText={false} />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold">Triagem Rápida MinhaOficina IA</h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#00a2e8] text-white font-bold">
                  gemini-3.1-flash-lite
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Diagnóstico de ultra-baixa latência para mecânica e arquitetura Supabase
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-500 flex items-center space-x-1 whitespace-nowrap pl-1">
            <Sparkles className="w-3 h-3 text-[#00a2e8]" />
            <span>Sugestões:</span>
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(q);
                handleSendQuery(q);
              }}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] whitespace-nowrap transition-colors font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Body & Output */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {response ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-[#00a2e8]" />
                  <span className="font-semibold text-slate-800">Parecer Técnico Instantâneo</span>
                  {latencyMs && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold tabular-nums">
                      {latencyMs}ms de latência
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={() => setResponse(null)}
                    className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nova consulta</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-sans whitespace-pre-line text-xs">
                {response}
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <Zap className="w-6 h-6 text-[#00a2e8] animate-bounce" />
              <div className="text-xs font-semibold text-slate-800">
                Processando com gemini-3.1-flash-lite...
              </div>
              <span className="text-[11px] text-slate-400">Tempo de resposta em menos de 800ms</span>
            </div>
          ) : (
            <div className="py-12 text-center space-y-2 text-slate-500 max-w-md mx-auto">
              <Sparkles className="w-8 h-8 mx-auto text-[#00a2e8]" />
              <h4 className="text-sm font-bold text-slate-900">Triagem Técnica em Segundos</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Digite os sintomas do veículo ou a dúvida sobre SQL/Deploy Supabase para obter um diagnóstico imediato e conciso.
              </p>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Digite o sintoma veicular ou dúvida de deploy..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00a2e8]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="p-2.5 rounded-xl bg-[#00a2e8] hover:bg-[#0089c7] text-white font-bold transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
