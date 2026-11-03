import React, { useState } from 'react';
import {
  MessageCircle,
  X,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  Calendar,
  Car,
  User,
  ShieldCheck,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  generateWhatsAppBillingReminderMessage,
  formatCurrencyBRL,
} from '../utils/workshopLogic.ts';

interface WhatsAppBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordem: OrdemServico | null;
  cliente?: Cliente;
  veiculo?: Veiculo;
  workshopName?: string;
  workshopPhone?: string;
  pixKey?: string;
  onMarkAsPaid?: (orderId: string, paymentMethod?: string) => void;
}

export const WhatsAppBillingModal: React.FC<WhatsAppBillingModalProps> = ({
  isOpen,
  onClose,
  ordem,
  cliente,
  veiculo,
  workshopName = 'Auto Mecânica Central',
  workshopPhone = '(11) 3290-8844',
  pixKey = '14.882.901/0001-44',
  onMarkAsPaid,
}) => {
  if (!isOpen || !ordem) return null;

  const [copied, setCopied] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Pix');

  const clientName = cliente?.nome_completo || 'Cliente da Oficina';
  const rawPhone = cliente?.dados_privados?.telefone || workshopPhone;
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const vehicleDesc = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veículo em Manutenção';
  const vehiclePlate = veiculo?.placa || 'BRA2E19';

  const defaultMessage = generateWhatsAppBillingReminderMessage({
    clientName,
    osNumber: ordem.numero_os,
    vehicleModel: vehicleDesc,
    vehiclePlate,
    totalValue: ordem.valor_total,
    completionDate: ordem.data_saida || ordem.data_entrada,
    dueDate: ordem.data_vencimento || undefined,
    workshopName,
    workshopPhone,
    pixKey,
  });

  const [messageText, setMessageText] = useState(defaultMessage);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar mensagem', err);
    }
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar Pix', err);
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    const targetUrl = cleanPhone.length >= 10
      ? `https://wa.me/55${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const isOverdue = ordem.status_pagamento === 'vencido';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header with WhatsApp Brand Identity */}
        <div className="bg-emerald-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Contas a Receber · Lembrete
                </span>
                <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                  isOverdue ? 'bg-rose-500 text-white' : 'bg-amber-400 text-amber-950'
                }`}>
                  {isOverdue ? 'Vencida' : 'Aguardando Pagamento'}
                </span>
              </div>
              <h3 className="text-base font-black">
                Cobrança Amigável via WhatsApp (OS #{ordem.numero_os})
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Summary Box with Order & Client Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold flex items-center space-x-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Destinatário:</span>
              </span>
              <div className="font-bold text-slate-900 text-xs truncate">{clientName}</div>
              <div className="text-[11px] font-mono text-slate-600">{rawPhone}</div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold flex items-center space-x-1">
                <Car className="w-3 h-3 text-slate-400" />
                <span>Veículo &amp; Placa:</span>
              </span>
              <div className="font-bold text-slate-900 text-xs truncate">{vehicleDesc}</div>
              <div className="inline-flex items-center space-x-1 px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded font-mono font-bold text-[10px] border border-blue-200">
                <span>{vehiclePlate}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 col-span-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Valor Total da Ordem:</span>
              <span className="font-mono text-base font-black text-slate-900 tabular-nums">
                {formatCurrencyBRL(ordem.valor_total)}
              </span>
            </div>
          </div>

          {/* Pix Key Quick Copy Box */}
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-emerald-900 uppercase block">Chave Pix da Oficina (CNPJ):</span>
                <span className="font-mono font-bold text-emerald-800 text-xs">{pixKey}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyPix}
              className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300 transition-colors shadow-2xs"
            >
              {copiedPix ? 'Copiada!' : 'Copiar Pix'}
            </button>
          </div>

          {/* Message Preview and Editable Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 text-xs">
                Texto do Lembrete Formatado para WhatsApp:
              </label>
              <span className="text-[10px] text-slate-400">Você pode editar antes de enviar</span>
            </div>

            <textarea
              rows={8}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] leading-relaxed rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
          </div>

          {/* Mark as Paid Direct Action */}
          {onMarkAsPaid && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">O cliente já pagou?</span>
                  <span className="text-[10px] text-slate-500">Dê baixa imediata e atualize o faturamento</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-medium text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Boleto">Boleto</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    onMarkAsPaid(ordem.id, selectedPaymentMethod);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                >
                  Confirmar Baixa
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Mensagem Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copiar Mensagem</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all active:scale-[0.98]"
            >
              <ExternalLink className="w-4 h-4 text-emerald-200" />
              <span>Abrir no WhatsApp Web</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
