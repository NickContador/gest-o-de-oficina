import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  DollarSign,
  Package,
  TrendingUp,
  Percent,
  Check,
  RotateCcw,
  Building,
  Phone,
  MapPin,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import {
  FinancialGoalsSettings,
  WorkshopSystemSettings,
  DEFAULT_FINANCIAL_GOALS,
  DEFAULT_SYSTEM_SETTINGS,
  formatCurrencyBRL,
} from '../utils/workshopLogic.ts';

interface FinancialGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemSettings: WorkshopSystemSettings;
  onSaveSettings: (settings: WorkshopSystemSettings) => void;
}

export const FinancialGoalsModal: React.FC<FinancialGoalsModalProps> = ({
  isOpen,
  onClose,
  systemSettings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'metas' | 'sistema'>('metas');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Financial Goals fields
  const [faturamentoAlvo, setFaturamentoAlvo] = useState<number>(
    systemSettings.financialGoals.faturamentoAlvo
  );
  const [metaLucro, setMetaLucro] = useState<number>(
    systemSettings.financialGoals.metaLucro
  );
  const [limiteGastosPecas, setLimiteGastosPecas] = useState<number>(
    systemSettings.financialGoals.limiteGastosPecas
  );
  const [margemMinima, setMargemMinima] = useState<number>(
    systemSettings.financialGoals.margemMinima
  );

  // Workshop System fields
  const [nomeOficina, setNomeOficina] = useState<string>(systemSettings.nomeOficina);
  const [cnpj, setCnpj] = useState<string>(systemSettings.cnpj);
  const [telefone, setTelefone] = useState<string>(systemSettings.telefone);
  const [endereco, setEndereco] = useState<string>(systemSettings.endereco);
  const [diasGarantia, setDiasGarantia] = useState<number>(systemSettings.diasGarantia);

  // Keep state synced if props change
  useEffect(() => {
    if (isOpen) {
      setFaturamentoAlvo(systemSettings.financialGoals.faturamentoAlvo);
      setMetaLucro(systemSettings.financialGoals.metaLucro);
      setLimiteGastosPecas(systemSettings.financialGoals.limiteGastosPecas);
      setMargemMinima(systemSettings.financialGoals.margemMinima);

      setNomeOficina(systemSettings.nomeOficina);
      setCnpj(systemSettings.cnpj);
      setTelefone(systemSettings.telefone);
      setEndereco(systemSettings.endereco);
      setDiasGarantia(systemSettings.diasGarantia);
      setSavedSuccess(false);
    }
  }, [isOpen, systemSettings]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedGoals: FinancialGoalsSettings = {
      faturamentoAlvo: Math.max(1000, Number(faturamentoAlvo) || DEFAULT_FINANCIAL_GOALS.faturamentoAlvo),
      metaLucro: Math.max(500, Number(metaLucro) || DEFAULT_FINANCIAL_GOALS.metaLucro),
      limiteGastosPecas: Math.max(500, Number(limiteGastosPecas) || DEFAULT_FINANCIAL_GOALS.limiteGastosPecas),
      margemMinima: Math.min(100, Math.max(5, Number(margemMinima) || DEFAULT_FINANCIAL_GOALS.margemMinima)),
    };

    const updatedSettings: WorkshopSystemSettings = {
      nomeOficina: nomeOficina.trim() || DEFAULT_SYSTEM_SETTINGS.nomeOficina,
      cnpj: cnpj.trim() || DEFAULT_SYSTEM_SETTINGS.cnpj,
      telefone: telefone.trim() || DEFAULT_SYSTEM_SETTINGS.telefone,
      endereco: endereco.trim() || DEFAULT_SYSTEM_SETTINGS.endereco,
      diasGarantia: Math.max(30, Number(diasGarantia) || DEFAULT_SYSTEM_SETTINGS.diasGarantia),
      financialGoals: updatedGoals,
    };

    onSaveSettings(updatedSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleResetDefaults = () => {
    setFaturamentoAlvo(DEFAULT_FINANCIAL_GOALS.faturamentoAlvo);
    setMetaLucro(DEFAULT_FINANCIAL_GOALS.metaLucro);
    setLimiteGastosPecas(DEFAULT_FINANCIAL_GOALS.limiteGastosPecas);
    setMargemMinima(DEFAULT_FINANCIAL_GOALS.margemMinima);

    setNomeOficina(DEFAULT_SYSTEM_SETTINGS.nomeOficina);
    setCnpj(DEFAULT_SYSTEM_SETTINGS.cnpj);
    setTelefone(DEFAULT_SYSTEM_SETTINGS.telefone);
    setEndereco(DEFAULT_SYSTEM_SETTINGS.endereco);
    setDiasGarantia(DEFAULT_SYSTEM_SETTINGS.diasGarantia);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#00a2e8]/20 text-[#00a2e8] flex items-center justify-center border border-[#00a2e8]/30">
              <Sliders className="w-5 h-5 text-[#00a2e8]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configurações &amp; Metas do Sistema</h3>
              <p className="text-xs text-slate-400">
                Preferências salvas localmente no navegador (localStorage).
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

        {/* Tab Switcher */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('metas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'metas'
                ? 'bg-[#00a2e8] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>1. Metas &amp; Limites Financeiros</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sistema')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'sistema'
                ? 'bg-[#00a2e8] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>2. Dados da Oficina &amp; Laudo</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          {activeTab === 'metas' && (
            <div className="space-y-4">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-950 flex items-start space-x-2.5">
                <Target className="w-4 h-4 text-[#00a2e8] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Defina os parâmetros gerenciais da oficina</span>
                  <p className="text-[11px] text-sky-900/80 leading-relaxed">
                    Esses valores alimentam os alertas em tempo real no painel financeiro, as badges dos gráficos Recharts e as planilhas contábeis.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Faturamento Alvo Mensal */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <label className="block text-slate-700 font-bold flex items-center space-x-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                    <span>Faturamento Alvo Mensal (R$)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold">R$</span>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      value={faturamentoAlvo}
                      onChange={(e) => setFaturamentoAlvo(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-3 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-[#00a2e8]"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Receita bruta total mensal esperada da oficina.
                  </span>
                </div>

                {/* Meta de Lucro Líquido Mensal */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                  <label className="block text-emerald-900 font-bold flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Meta de Lucro Líquido (R$)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-emerald-600 font-mono font-bold">R$</span>
                    <input
                      type="number"
                      step="500"
                      min="500"
                      value={metaLucro}
                      onChange={(e) => setMetaLucro(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-emerald-300 rounded-lg py-2 pl-9 pr-3 font-mono font-bold text-emerald-900 text-sm focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-emerald-700/80 block">
                    Alimenta o alerta vermelho caso o lucro caia abaixo.
                  </span>
                </div>

                {/* Limite de Gastos para Peças */}
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
                  <label className="block text-amber-900 font-bold flex items-center space-x-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    <span>Teto de Gastos com Peças (R$)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-amber-600 font-mono font-bold">R$</span>
                    <input
                      type="number"
                      step="500"
                      min="500"
                      value={limiteGastosPecas}
                      onChange={(e) => setLimiteGastosPecas(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-amber-300 rounded-lg py-2 pl-9 pr-3 font-mono font-bold text-amber-900 text-sm focus:outline-none focus:border-amber-600"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-amber-700/80 block">
                    Limite máximo para compras e custos com fornecedores.
                  </span>
                </div>

                {/* Margem Mínima Aceitável */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <label className="block text-slate-700 font-bold flex items-center space-x-1.5">
                    <Percent className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Margem Operacional Mínima (%)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="5"
                      max="90"
                      value={margemMinima}
                      onChange={(e) => setMargemMinima(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-[#00a2e8]"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-mono font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Margem líquida de segurança para cobrir custos fixos.
                  </span>
                </div>
              </div>

              {/* Real-time Summary preview */}
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider">
                  Resumo das Metas Configuradas:
                </div>
                <div className="flex justify-between">
                  <span>Alvo de Faturamento:</span>
                  <span className="text-sky-400 font-bold">{formatCurrencyBRL(faturamentoAlvo)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Meta de Lucro Líquido:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrencyBRL(metaLucro)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teto para Peças:</span>
                  <span className="text-amber-400 font-bold">{formatCurrencyBRL(limiteGastosPecas)}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sistema' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-[#00a2e8]" />
                  <span>Configurações Oficiais da Oficina Mecânica</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Esses dados são impressos nos laudos técnicos em PDF A4, nas planilhas Excel (.xlsx) e nas mensagens de WhatsApp enviadas aos clientes.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nome da Oficina / Razão Social *
                  </label>
                  <input
                    type="text"
                    value={nomeOficina}
                    onChange={(e) => setNomeOficina(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#00a2e8]"
                    placeholder="Ex: Auto Mecânica Central"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">CNPJ da Oficina *</label>
                    <input
                      type="text"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none focus:border-[#00a2e8]"
                      placeholder="14.882.901/0001-44"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none focus:border-[#00a2e8]"
                      placeholder="(11) 3290-8844"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Endereço Completo *</label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#00a2e8]"
                    placeholder="Av. das Oficinas, 450 — Mooca, São Paulo/SP"
                    required
                  />
                </div>

                <div className="w-1/2">
                  <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Garantia Padrão (Dias) *</span>
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    value={diasGarantia}
                    onChange={(e) => setDiasGarantia(parseInt(e.target.value, 10) || 90)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#00a2e8]"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restaurar Padrões</span>
            </button>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#00a2e8] hover:bg-[#0089c7] text-white font-black shadow-md shadow-[#00a2e8]/20 transition-all active:scale-[0.98] flex items-center space-x-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Salvo com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Salvar no Navegador</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
