import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { OrdemServico } from '../data/mockData.ts';

interface InspectionDiagramGeneratorProps {
  ordens: OrdemServico[];
}

export const InspectionDiagramGenerator: React.FC<InspectionDiagramGeneratorProps> = ({ ordens }) => {
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [quality, setQuality] = useState<'standard' | 'studio'>('standard');
  const [prompt, setPrompt] = useState<string>(
    'Diagrama técnico de inspeção veicular automotiva com vista superior e lateral, destacando pontos de avaria e discos de freio.'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>('gemini-nano-banana-2.1');
  const [attachedOSId, setAttachedOSId] = useState<string>(ordens[0]?.id || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const aspectRatios = [
    { ratio: '1:1', label: '1:1 Quadrado', desc: 'Avatar / Peça' },
    { ratio: '2:3', label: '2:3 Vertical', desc: 'Card vertical' },
    { ratio: '3:2', label: '3:2 Clássico', desc: 'Foto técnica' },
    { ratio: '3:4', label: '3:4 Retrato', desc: 'Prancheta' },
    { ratio: '4:3', label: '4:3 Standard', desc: 'Monitor' },
    { ratio: '9:16', label: '9:16 Story', desc: 'WhatsApp' },
    { ratio: '16:9', label: '16:9 Wide', desc: 'Relatório OS' },
    { ratio: '21:9', label: '21:9 Ultra', desc: 'Banner' },
  ];

  const presets = [
    {
      title: 'Mapa de Danos na Lataria (Check-in)',
      prompt: 'Checklist de avarias na carroceria automotiva em estilo blueprint técnico. Vista aérea e lateral indicando arranhões e amassados.',
      preferredRatio: '16:9',
    },
    {
      title: 'Esquema de Freios & Pastilhas',
      prompt: 'Diagrama técnico detalhado do conjunto de freio a disco ventilado, pinça e pastilhas com indicação de espessura de desgaste.',
      preferredRatio: '4:3',
    },
    {
      title: 'Geometria & Suspensão Dianteira',
      prompt: 'Diagrama esquemático de suspensão McPherson, amortecedor, molas helicoidais e buchas de bandeja com cotas milimétricas.',
      preferredRatio: '3:2',
    },
    {
      title: 'Banner da Oficina para Cabeçalho OS',
      prompt: 'Banner corporativo para oficina mecânica moderna com ferramentas de precisão, elevador automotivo e logotipo industrial elegante.',
      preferredRatio: '21:9',
    },
    {
      title: 'Laudo de WhatsApp para o Cliente',
      prompt: 'Relatório fotográfico esquemático vertical para cliente de celular com visualização limpa do componente avariado e status aprovado.',
      preferredRatio: '9:16',
    },
  ];

  const handleGenerate = async (customPrompt?: string, customRatio?: string) => {
    const finalPrompt = customPrompt || prompt;
    const finalRatio = customRatio || aspectRatio;

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ai/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio: finalRatio,
          quality: quality === 'studio' ? 'studio' : 'standard',
        }),
      });

      const data = await response.json();

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setActiveModel(data.model || (quality === 'studio' ? 'gemini-3-pro-image-preview' : 'gemini-nano-banana-2.1'));
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      console.error('Error generating image:', err);
      setErrorMsg('Falha de conexão com a API de geração.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyImage = () => {
    if (!generatedImage) return;
    navigator.clipboard.writeText(generatedImage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `laudo-tecnico-${aspectRatio.replace(':', 'x')}.png`;
    a.click();
  };

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1':
        return 'aspect-square max-w-md';
      case '2:3':
        return 'aspect-[2/3] max-w-xs';
      case '3:2':
        return 'aspect-[3/2] max-w-xl';
      case '3:4':
        return 'aspect-[3/4] max-w-sm';
      case '4:3':
        return 'aspect-[4/3] max-w-lg';
      case '9:16':
        return 'aspect-[9/16] max-w-xs';
      case '16:9':
        return 'aspect-[16/9] max-w-2xl';
      case '21:9':
        return 'aspect-[21/9] max-w-3xl';
      default:
        return 'aspect-video max-w-2xl';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-2 shadow-xs">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold">
          <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
          <span>Controle de Aspect Ratio &amp; IA de Imagem MinhaOficina</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Gerador de Diagramas &amp; Laudos Técnicos Veiculares
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Gere ilustrações técnicas, esquemas mecânicos e laudos de inspeção com controle de proporção (
          <code className="text-[#00a2e8] font-mono font-bold">1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 21:9</code>) com os modelos{' '}
          <strong className="text-purple-700">gemini-nano-banana-2.1</strong> e{' '}
          <strong className="text-[#00a2e8]">gemini-3-pro-image-preview</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (Cols 1-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#00a2e8]" />
              <span>Configuração da Ilustração</span>
            </h2>

            {/* Aspect Ratio Selector (Mandatory Affordance) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Proporção de Tela (Aspect Ratio) *
                </label>
                <span className="text-xs font-mono text-[#00a2e8] font-bold">{aspectRatio}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {aspectRatios.map((item) => {
                  const isSelected = aspectRatio === item.ratio;
                  return (
                    <button
                      key={item.ratio}
                      type="button"
                      onClick={() => setAspectRatio(item.ratio)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#00a2e8] text-white border-[#0089c7] shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{item.ratio}</div>
                      <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Qualidade do Modelo</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setQuality('standard')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    quality === 'standard'
                      ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>Geral (Rápido)</div>
                  <div className="text-[10px] font-mono text-purple-700">gemini-nano-banana-2.1</div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuality('studio')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    quality === 'studio'
                      ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>Estúdio Pro</div>
                  <div className="text-[10px] font-mono text-sky-700">gemini-3-pro-image-preview</div>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Modelos Rápidos de Oficina</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(p.prompt);
                      setAspectRatio(p.preferredRatio);
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-colors flex items-center justify-between"
                  >
                    <span className="text-slate-800 font-medium truncate">{p.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white text-[#00a2e8] border border-slate-200">
                      {p.preferredRatio}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Descrição Personalizada</label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva o diagrama técnico veicular..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00a2e8] focus:bg-white"
              />
            </div>

            {/* Action */}
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00a2e8] hover:bg-[#0089c7] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando em {aspectRatio}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Laudo Técnico ({aspectRatio})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Column (Cols 6-12) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center min-h-[480px]">
            {generatedImage ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="w-full flex items-center justify-between text-xs border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00a2e8]/10 text-[#00a2e8] font-bold">
                      {activeModel}
                    </span>
                    <span className="text-slate-500">Proporção: <strong className="text-slate-800 font-mono">{aspectRatio}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyImage}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Copiar URL"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Baixar imagem"
                    >
                      <Download className="w-4 h-4 text-[#00a2e8]" />
                    </button>
                  </div>
                </div>

                {/* Aspect Ratio Container */}
                <div
                  className={`w-full ${getAspectRatioClass(
                    aspectRatio
                  )} bg-slate-900 rounded-xl overflow-hidden shadow-md flex items-center justify-center`}
                >
                  <img
                    src={generatedImage}
                    alt="Diagrama Técnico de Inspeção Veicular"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Anexar diagrama à OS:</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={attachedOSId}
                      onChange={(e) => setAttachedOSId(e.target.value)}
                      className="bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-800 font-medium"
                    >
                      {ordens.map((o) => (
                        <option key={o.id} value={o.id}>
                          OS #{o.numero_os}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => alert(`Diagrama vinculado com sucesso à OS selecionada!`)}
                      className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Vincular à OS
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 max-w-sm py-12">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto text-[#00a2e8]">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Gerador Pronto</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Selecione uma das 8 proporções de tela disponíveis e clique no botão para renderizar o laudo automotivo.
                </p>
                <button
                  onClick={() => handleGenerate()}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#00a2e8] hover:bg-[#0089c7] text-white font-bold text-xs shadow-md"
                >
                  Gerar Laudo de Exemplo (16:9)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
