import React, { useState } from 'react';
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Share2,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { OrdemServico, Veiculo, Cliente } from '../data/mockData.ts';

interface DamageMark {
  id: string;
  zone: string;
  type: 'risco' | 'amassado' | 'quebrado' | 'desgaste';
  obs: string;
}

interface Checklist360ViewProps {
  ordens: OrdemServico[];
  veiculos: Veiculo[];
  clientes: Cliente[];
  onOpenQuickTriage: () => void;
}

export const Checklist360View: React.FC<Checklist360ViewProps> = ({
  ordens,
  veiculos,
  clientes,
}) => {
  const [selectedOSId, setSelectedOSId] = useState<string>(ordens[0]?.id || '');
  const [kmAtual, setKmAtual] = useState<number>(52300);
  const [fuelLevel, setFuelLevel] = useState<'r' | '1/4' | '1/2' | '3/4' | '1/1'>('1/2');
  
  // Inventory check items
  const [itemsCheck, setItemsCheck] = useState<{
    estepe: boolean;
    macaco: boolean;
    chaveRoda: boolean;
    triangulo: boolean;
    manual: boolean;
    antena: boolean;
    calotas: boolean;
    pertences: boolean;
  }>({
    estepe: true,
    macaco: true,
    chaveRoda: true,
    triangulo: true,
    manual: true,
    antena: true,
    calotas: true,
    pertences: false,
  });

  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([
    { id: '1', zone: 'Para-choque Dianteiro', type: 'risco', obs: 'Pequeno arranhão superficial do lado direito' },
    { id: '2', zone: 'Porta Traseira Direita', type: 'amassado', obs: 'Mossa de estacionamento na chapa' },
  ]);

  const [selectedDamageType, setSelectedDamageType] = useState<DamageMark['type']>('risco');
  const [customZone, setCustomZone] = useState('');
  const [customObs, setCustomObs] = useState('');
  const [savedNotification, setSavedNotification] = useState(false);

  const activeOS = ordens.find((o) => o.id === selectedOSId) || ordens[0];
  const activeVehicle = veiculos.find((v) => v.id === activeOS?.veiculo_id) || veiculos[0];
  const activeClient = clientes.find((c) => c.id === activeOS?.cliente_id) || clientes[0];

  const handleAddDamageZone = (zoneName: string) => {
    const newMark: DamageMark = {
      id: `dmg-${Date.now()}`,
      zone: zoneName,
      type: selectedDamageType,
      obs: customObs || `Avaria registrada na região: ${zoneName}`,
    };
    setDamageMarks((prev) => [...prev, newMark]);
    setCustomObs('');
  };

  const handleRemoveDamage = (id: string) => {
    setDamageMarks((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveChecklist = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(
      `*AUTO MECÂNICA CENTRAL — CHECKLIST DE ENTRADA*\n\n` +
      `Olá ${activeClient?.nome_completo || 'Cliente'}, confirmamos a entrada do veículo:\n` +
      `🚗 *${activeVehicle?.marca} ${activeVehicle?.modelo}* (Placa: ${activeVehicle?.placa})\n` +
      `📋 *OS Nº:* #${activeOS?.numero_os}\n` +
      `⏱️ *KM Entrada:* ${kmAtual} km | *Combustível:* ${fuelLevel}\n` +
      `🔍 *Avarias mapeadas na vistoria:* ${damageMarks.length} item(ns)\n` +
      damageMarks.map((d, i) => `  ${i + 1}. [${d.type.toUpperCase()}] ${d.zone} (${d.obs})`).join('\n') +
      `\n\nQualquer dúvida estamos à disposição!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-[#00a2e8]/10 text-[#00a2e8] text-xs font-bold border border-[#00a2e8]/20">
            <Car className="w-3.5 h-3.5" />
            <span>Vistoria de Recepção &amp; Check-in</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Checklist 360° do Veículo na Entrada
          </h2>
          <p className="text-xs text-slate-500">
            Mapeie o estado da lataria, vidros, estepe e combustível para garantir transparência total e evitar contestações com o cliente.
          </p>
        </div>

        {/* OS Selector */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block font-medium">Ordem de Serviço Ativa:</span>
            <select
              value={selectedOSId}
              onChange={(e) => setSelectedOSId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00a2e8]"
            >
              {ordens.map((os) => {
                const v = veiculos.find((vec) => vec.id === os.veiculo_id);
                return (
                  <option key={os.id} value={os.id}>
                    OS #{os.numero_os} — {v?.marca} {v?.modelo} ({v?.placa})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={handleSaveChecklist}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors whitespace-nowrap flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Salvar Vistoria</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="px-3.5 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition-colors whitespace-nowrap flex items-center space-x-1.5"
            title="Enviar laudo de entrada direto para o WhatsApp do cliente"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>
      </div>

      {savedNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Vistoria e Checklist gravados com sucesso na OS #{activeOS?.numero_os}!</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono">Sincronizado Supabase</span>
        </div>
      )}

      {/* Grid: 360 Vehicle Canvas & Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Car Silhouette (Cols 1-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Mapeamento Visual de Avarias ({activeVehicle?.marca} {activeVehicle?.modelo})
              </h3>
              <p className="text-[11px] text-slate-500">
                Clique nas regiões da carroceria abaixo para registrar riscos, mossas ou quebras.
              </p>
            </div>

            {/* Damage Type Selector */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-[11px] text-slate-400 mr-1">Tipo:</span>
              <button
                type="button"
                onClick={() => setSelectedDamageType('risco')}
                className={`px-2 py-1 rounded text-[11px] font-bold border ${
                  selectedDamageType === 'risco'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Risco
              </button>
              <button
                type="button"
                onClick={() => setSelectedDamageType('amassado')}
                className={`px-2 py-1 rounded text-[11px] font-bold border ${
                  selectedDamageType === 'amassado'
                    ? 'bg-orange-100 text-orange-800 border-orange-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Amassado
              </button>
              <button
                type="button"
                onClick={() => setSelectedDamageType('quebrado')}
                className={`px-2 py-1 rounded text-[11px] font-bold border ${
                  selectedDamageType === 'quebrado'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Quebrado
              </button>
            </div>
          </div>

          {/* Interactive Car Blueprint Container */}
          <div className="relative bg-slate-50 rounded-xl border border-slate-200 p-6 min-h-[340px] flex items-center justify-center">
            {/* Visual vehicle top-down representation */}
            <div className="w-full max-w-md relative select-none">
              <svg viewBox="0 0 400 240" className="w-full h-auto drop-shadow-sm">
                {/* Car Main Body */}
                <rect x="70" y="45" width="260" height="150" rx="36" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />
                
                {/* Windshield Front */}
                <path d="M 115 65 L 145 75 L 145 165 L 115 175 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
                
                {/* Windshield Rear */}
                <path d="M 285 65 L 255 75 L 255 165 L 285 175 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
                
                {/* Roof */}
                <rect x="155" y="72" width="90" height="96" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                
                {/* Hood Front */}
                <path d="M 70 85 Q 50 120 70 155 Z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
                
                {/* Trunk Rear */}
                <path d="M 330 85 Q 350 120 330 155 Z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />

                {/* Wheels */}
                <rect x="95" y="32" width="42" height="16" rx="4" fill="#334155" />
                <rect x="95" y="192" width="42" height="16" rx="4" fill="#334155" />
                <rect x="260" y="32" width="42" height="16" rx="4" fill="#334155" />
                <rect x="260" y="192" width="42" height="16" rx="4" fill="#334155" />

                {/* Side Mirrors */}
                <polygon points="120,44 135,44 130,36" fill="#64748b" />
                <polygon points="120,196 135,196 130,204" fill="#64748b" />

                {/* Labels */}
                <text x="50" y="125" fontSize="11" fontWeight="bold" fill="#64748b" textAnchor="middle">FRENTE</text>
                <text x="350" y="125" fontSize="11" fontWeight="bold" fill="#64748b" textAnchor="middle">TRASEIRA</text>
              </svg>

              {/* Clickable Quick Zones on the vehicle */}
              <div className="absolute inset-0 flex flex-wrap items-center justify-around pointer-events-none p-4">
                <button
                  type="button"
                  onClick={() => handleAddDamageZone('Para-choque Dianteiro')}
                  className="pointer-events-auto absolute left-6 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-white/90 hover:bg-[#00a2e8] hover:text-white border border-slate-300 text-[10px] font-bold shadow-xs transition-colors"
                >
                  + P-Choque Diant.
                </button>

                <button
                  type="button"
                  onClick={() => handleAddDamageZone('Capô Dianteiro')}
                  className="pointer-events-auto absolute left-28 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-white/90 hover:bg-[#00a2e8] hover:text-white border border-slate-300 text-[10px] font-bold shadow-xs transition-colors"
                >
                  + Capô
                </button>

                <button
                  type="button"
                  onClick={() => handleAddDamageZone('Lateral Esquerda')}
                  className="pointer-events-auto absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-white/90 hover:bg-[#00a2e8] hover:text-white border border-slate-300 text-[10px] font-bold shadow-xs transition-colors"
                >
                  + Lateral Esq.
                </button>

                <button
                  type="button"
                  onClick={() => handleAddDamageZone('Teto')}
                  className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-white/90 hover:bg-[#00a2e8] hover:text-white border border-slate-300 text-[10px] font-bold shadow-xs transition-colors"
                >
                  + Teto
                </button>

                <button
                  type="button"
                  onClick={() => handleAddDamageZone('Lateral Direita')}
                  className="pointer-events-auto absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-white/90 hover:bg-[#00a2e8] hover:text-white border border-slate-300 text-[10px] font-bold shadow-xs transition-colors"
                >
                  + Lateral Dir.
                </button>

                <button
                  type="button"
                  onClick={() => handleAddDamageZone('Para-choque Traseiro')}
                  className="pointer-events-auto absolute right-6 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-white/90 hover:bg-[#00a2e8] hover:text-white border border-slate-300 text-[10px] font-bold shadow-xs transition-colors"
                >
                  + P-Choque Tras.
                </button>
              </div>
            </div>
          </div>

          {/* List of registered damages */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-800">
              Avarias Mapeadas ({damageMarks.length}):
            </h4>
            {damageMarks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma avaria marcada. O veículo está íntegro.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {damageMarks.map((dmg) => (
                  <div
                    key={dmg.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dmg.type === 'risco'
                              ? 'bg-amber-500'
                              : dmg.type === 'amassado'
                              ? 'bg-orange-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <strong className="text-slate-800">{dmg.zone}</strong>
                        <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                          [{dmg.type}]
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{dmg.obs}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveDamage(dmg.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remover avaria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: KM, Fuel & Inventory Checklist (Cols 8-12) */}
        <div className="lg:col-span-5 space-y-4">
          {/* KM and Fuel Container */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
              Hodômetro &amp; Combustível
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quilometragem Atual (KM)
              </label>
              <input
                type="number"
                value={kmAtual}
                onChange={(e) => setKmAtual(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-[#00a2e8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nível do Tanque de Combustível
              </label>
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                {(['r', '1/4', '1/2', '3/4', '1/1'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFuelLevel(lvl)}
                    className={`py-2 rounded-lg border font-mono font-bold transition-all ${
                      fuelLevel === lvl
                        ? 'bg-[#00a2e8] text-white border-[#0089c7] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {lvl === 'r' ? 'Reserva' : lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mandatory Equipment Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Equipamentos Presentes</span>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">Conferência no Balcão</span>
            </h3>

            <div className="space-y-2 text-xs">
              {[
                { key: 'estepe', label: 'Pneu Estepe (com pressão)' },
                { key: 'macaco', label: 'Macaco mecânico / hidráulico' },
                { key: 'chaveRoda', label: 'Chave de roda' },
                { key: 'triangulo', label: 'Triângulo de sinalização' },
                { key: 'manual', label: 'Manual & Chave reserva' },
                { key: 'antena', label: 'Antena de teto' },
                { key: 'calotas', label: '4 Calotas ou rodas de liga originais' },
                { key: 'pertences', label: 'Pertences de valor no interior (carteira, óculos)' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={(itemsCheck as any)[item.key]}
                    onChange={() =>
                      setItemsCheck((prev) => ({
                        ...prev,
                        [item.key]: !(prev as any)[item.key],
                      }))
                    }
                    className="w-4 h-4 text-[#00a2e8] rounded border-slate-300 focus:ring-[#00a2e8]"
                  />
                  <span className={`text-slate-700 ${(itemsCheck as any)[item.key] ? 'font-medium' : 'text-slate-400 line-through'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
