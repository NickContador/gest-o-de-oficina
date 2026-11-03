import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  generateClickableWhatsAppReminderLink,
  WhatsAppReminderLinkInfo,
} from '../utils/workshopLogic.ts';

interface WhatsAppReminderButtonProps {
  ordem: OrdemServico;
  cliente?: Cliente;
  veiculo?: Veiculo;
  workshopName?: string;
  workshopPhone?: string;
  pixKey?: string;
  variant?: 'compact' | 'full' | 'icon';
  className?: string;
  onBeforeOpen?: () => void;
}

export const WhatsAppReminderButton: React.FC<WhatsAppReminderButtonProps> = ({
  ordem,
  cliente,
  veiculo,
  workshopName,
  workshopPhone,
  pixKey,
  variant = 'compact',
  className = '',
  onBeforeOpen,
}) => {
  const [copied, setCopied] = useState(false);

  const reminder: WhatsAppReminderLinkInfo = useMemo(() => {
    return generateClickableWhatsAppReminderLink(ordem, cliente, veiculo, {
      name: workshopName,
      phone: workshopPhone,
      pixKey,
    });
  }, [ordem, cliente, veiculo, workshopName, workshopPhone, pixKey]);

  // Only render if payment is pendente or vencido
  const isEligible = ordem.status_pagamento === 'pendente' || ordem.status_pagamento === 'vencido';
  if (!isEligible) {
    return null;
  }

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(reminder.messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar texto do lembrete WhatsApp', err);
    }
  };

  const handleClickLink = () => {
    if (onBeforeOpen) {
      onBeforeOpen();
    }
  };

  if (variant === 'icon') {
    return (
      <a
        href={reminder.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClickLink}
        className={`p-1.5 rounded-lg border transition-all inline-flex items-center justify-center cursor-pointer ${
          reminder.isOverdue
            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
        } ${className}`}
        title={`Enviar lembrete WhatsApp para ${reminder.clientName} (${reminder.formattedPhone})`}
      >
        <MessageCircle className="w-3.5 h-3.5" />
      </a>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`p-4 rounded-xl border space-y-3 ${
        reminder.isOverdue
          ? 'bg-rose-50/70 border-rose-200'
          : 'bg-emerald-50/60 border-emerald-200'
      } ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              reminder.isOverdue ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider block ${
                reminder.isOverdue ? 'text-rose-800' : 'text-emerald-800'
              }`}>
                {reminder.isOverdue ? 'Cobrança de Vencido' : 'Lembrete de Pagamento'}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {reminder.clientName} · {reminder.formattedPhone}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold transition-colors cursor-pointer"
            title="Copiar texto formatado"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px]">
          {reminder.messageText.slice(0, 160)}...
        </p>

        <a
          href={reminder.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClickLink}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer ${
            reminder.isOverdue
              ? 'bg-rose-700 hover:bg-rose-800'
              : 'bg-emerald-700 hover:bg-emerald-800'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Disparar Lembrete WhatsApp para {reminder.formattedPhone}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // Default: 'compact' button
  return (
    <div className="inline-flex items-center gap-1">
      <a
        href={reminder.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClickLink}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs transition-all active:scale-[0.97] cursor-pointer ${
          reminder.isOverdue
            ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
        } ${className}`}
        title={`Clique para abrir o WhatsApp Web/App e enviar lembrete para ${reminder.clientName} (${reminder.formattedPhone})`}
      >
        <MessageCircle className={`w-3.5 h-3.5 ${reminder.isOverdue ? 'text-rose-600' : 'text-emerald-600'}`} />
        <span>{reminder.isOverdue ? 'Lembrete Vencido' : 'Lembrete WhatsApp'}</span>
        <ExternalLink className="w-3 h-3 opacity-60" />
      </a>

      <button
        type="button"
        onClick={handleCopyLink}
        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Copiar texto da mensagem"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
