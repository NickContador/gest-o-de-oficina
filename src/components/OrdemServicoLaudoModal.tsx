import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Car,
  User,
  Calendar,
  Wrench,
  Package,
  ShieldCheck,
  Check,
  Copy,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  formatCurrencyBRL,
  generateWhatsAppMessageForOS,
} from '../utils/workshopLogic.ts';
import { MinhaOficinaLogo } from './MinhaOficinaLogo.tsx';

interface OrdemServicoLaudoModalProps {
  os: OrdemServico | null;
  cliente?: Cliente;
  veiculo?: Veiculo;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, newStatus: OrdemServico['status']) => void;
}

export const OrdemServicoLaudoModal: React.FC<OrdemServicoLaudoModalProps> = ({
  os,
  cliente,
  veiculo,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !os) return null;

  const clientName = cliente?.nome_completo || 'Cliente Não Identificado';
  const clientPhone = cliente?.dados_privados?.telefone || '(11) 98844-1234';
  const clientCity = cliente?.dados_privados
    ? `${cliente.dados_privados.endereco_cidade}/${cliente.dados_privados.endereco_uf}`
    : 'São Paulo/SP';

  const vehiclePlate = veiculo?.placa || 'BRA2E19';
  const vehicleModel = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veículo não cadastrado';
  const vehicleYearColor = veiculo ? `${veiculo.ano} · ${veiculo.cor}` : '';

  // Standard items for high-fidelity technical report
  const pecasItems = [
    {
      codigo: 'PF-BOS-094',
      descricao: 'Jogo de Pastilhas de Freio Cerâmica Bosch',
      garantia: '12 meses',
      qtd: 1,
      unitario: (os.pecas_valor || 480) * 0.45,
      total: (os.pecas_valor || 480) * 0.45,
    },
    {
      codigo: 'FL-FRAM-5949',
      descricao: 'Filtro de Óleo Blindado Fram e Lubrificante 5W30',
      garantia: '6 meses',
      qtd: 1,
      unitario: (os.pecas_valor || 480) * 0.55,
      total: (os.pecas_valor || 480) * 0.55,
    },
  ];

  const servicosItems = [
    {
      descricao: 'Mão de Obra Técnica Especializada / Desmontagem e Montagem',
      tempo: '2.5h',
      unitario: (os.mao_de_obra_valor || 350) * 0.7,
      total: (os.mao_de_obra_valor || 350) * 0.7,
    },
    {
      descricao: 'Diagnóstico Computadorizado com Scanner OBD-II e Teste de Rodagem',
      tempo: '1.0h',
      unitario: (os.mao_de_obra_valor || 350) * 0.3,
      total: (os.mao_de_obra_valor || 350) * 0.3,
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppSend = () => {
    const rawMessage = generateWhatsAppMessageForOS({
      osNumber: os.numero_os,
      clientName: clientName,
      vehicleModel: vehicleModel,
      vehiclePlate: vehiclePlate,
      status: os.status,
      totalValue: os.valor_total,
      problemDesc: os.descricao_problema,
      workshopName: 'Auto Mecânica Central',
      workshopPhone: '(11) 3290-8844',
    });

    const cleanPhone = clientPhone.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(rawMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText('14.882.901/0001-44');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleCopyPublicLink = () => {
    const currentOrigin = window.location.origin;
    navigator.clipboard.writeText(`${currentOrigin}/#os-${os.numero_os}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const statusBadge = {
    aberto: { label: 'Orçamento Aberto', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    em_andamento: { label: 'Em Execução na Oficina', bg: 'bg-sky-100 text-sky-800 border-sky-300' },
    aguardando_pecas: { label: 'Aguardando Peças', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
    concluido: { label: 'Pronto para Retirada', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    entregue: { label: 'Entregue ao Cliente', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
  }[os.status] || { label: os.status, bg: 'bg-slate-100 text-slate-800 border-slate-200' };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Toolbar (Hidden during Print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold bg-[#00a2e8] text-white px-2 py-0.5 rounded">
              OS #{os.numero_os}
            </span>
            <span className="text-sm font-semibold text-slate-200">
              Laudo Técnico & Orçamento A4
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* WhatsApp Send Button */}
            <button
              onClick={handleWhatsAppSend}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
              title="Disparar laudo estruturado pelo WhatsApp do cliente"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar WhatsApp</span>
            </button>

            {/* Print A4 Button */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold transition-colors"
              title="Imprimir folha A4 oficial para assinatura"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Imprimir A4</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Viewport */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 print:overflow-visible print:p-6 print:text-black">
          {/* Official Workshop Letterhead */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center space-x-2">
                <MinhaOficinaLogo size="md" theme="light" />
              </div>
              <p className="mt-1 text-xs text-slate-600 font-medium">
                Razão Social: AUTO MECÂNICA CENTRAL LTDA · CNPJ: 14.882.901/0001-44
              </p>
              <p className="text-xs text-slate-500">
                Av. das Oficinas, 450 — Mooca, São Paulo/SP · Telefone/WhatsApp: (11) 3290-8844
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-xl font-black text-slate-900 tracking-tight font-mono">
                ORDEM DE SERVIÇO Nº {os.numero_os}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Emissão: {new Date(os.data_entrada).toLocaleDateString('pt-BR')} às{' '}
                {new Date(os.data_entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border print:border-black">
                <span className={`px-2 py-0.5 rounded ${statusBadge.bg}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Client & Vehicle Side-by-Side Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 print:bg-white print:border-slate-400">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-slate-700" />
                <span>Dados do Cliente</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{clientName}</div>
              <div className="text-xs text-slate-600">
                <span className="font-medium">Telefone:</span> {clientPhone}
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-medium">Localidade:</span> {clientCity}
              </div>
              {cliente?.dados_privados?.cpf && (
                <div className="text-xs text-slate-500">
                  <span className="font-medium">Documento:</span> {cliente.dados_privados.cpf}
                </div>
              )}
            </div>

            {/* Vehicle Card with Mercosul Plate */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 print:bg-white print:border-slate-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Car className="w-3.5 h-3.5 text-slate-700" />
                  <span>Identificação do Veículo</span>
                </div>
                {/* Official Mercosul Vehicle Plate Styling */}
                <div className="w-24 h-8 bg-white border-2 border-slate-900 rounded-sm shadow-xs flex flex-col overflow-hidden shrink-0">
                  <div className="bg-[#003399] text-white text-[8px] font-bold px-1 flex items-center justify-between leading-none py-0.5">
                    <span>BRASIL</span>
                    <span>🇧🇷</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center font-black text-xs tracking-wider text-slate-900 font-mono">
                    {vehiclePlate}
                  </div>
                </div>
              </div>

              <div className="text-sm font-bold text-slate-900">{vehicleModel}</div>
              <div className="text-xs text-slate-600">
                <span className="font-medium">Ano/Cor:</span> {vehicleYearColor}
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-medium">Responsável Técnico:</span>{' '}
                {os.tecnico_responsavel || 'Mecânico da Oficina'}
              </div>
            </div>
          </div>

          {/* Problem & Diagnostic Statement */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 print:bg-white print:border-slate-400">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <Wrench className="w-3.5 h-3.5 text-slate-700" />
              <span>Diagnóstico & Reclamação do Cliente</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {os.descricao_problema}
            </p>
          </div>

          {/* Checklist 360 Visual Status Strip */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Checklist de Entrada 360° (Inspeção Física)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Conforme Laudo de Check-in</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Óleo e Filtro Verificados</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Freios e Pastilhas Avaliados</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Elétrica e Bateria 12.6V</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pneus calibrados / Estepe OK</span>
              </div>
            </div>
          </div>

          {/* Itemized Table of Services (Mão de Obra) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#00a2e8]" />
                <span>1. Serviços Executados & Mão de Obra</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
                Total Mão de Obra: {formatCurrencyBRL(os.mao_de_obra_valor || 0)}
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Descrição do Serviço</th>
                    <th className="py-2 px-3 font-semibold text-center w-24">Tempo</th>
                    <th className="py-2 px-3 font-semibold text-right w-28">Valor</th>
                    <th className="py-2 px-3 font-semibold text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {servicosItems.map((serv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-800">{serv.descricao}</td>
                      <td className="py-2 px-3 text-center text-slate-500 font-mono">{serv.tempo}</td>
                      <td className="py-2 px-3 text-right text-slate-600 font-mono tabular-nums">
                        {formatCurrencyBRL(serv.unitario)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900 font-mono tabular-nums">
                        {formatCurrencyBRL(serv.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Table of Parts (Peças & Insumos) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Peças & Componentes Substituídos</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
                Total Peças: {formatCurrencyBRL(os.pecas_valor || 0)}
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 font-semibold w-28">Código</th>
                    <th className="py-2 px-3 font-semibold">Descrição da Peça</th>
                    <th className="py-2 px-3 font-semibold text-center w-24">Garantia</th>
                    <th className="py-2 px-3 font-semibold text-center w-16">Qtd</th>
                    <th className="py-2 px-3 font-semibold text-right w-28">Valor Unit.</th>
                    <th className="py-2 px-3 font-semibold text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pecasItems.map((peca, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-slate-500">{peca.codigo}</td>
                      <td className="py-2 px-3 text-slate-800 font-medium">{peca.descricao}</td>
                      <td className="py-2 px-3 text-center text-emerald-700 font-semibold">{peca.garantia}</td>
                      <td className="py-2 px-3 text-center text-slate-600 font-mono tabular-nums">{peca.qtd}</td>
                      <td className="py-2 px-3 text-right text-slate-600 font-mono tabular-nums">
                        {formatCurrencyBRL(peca.unitario)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900 font-mono tabular-nums">
                        {formatCurrencyBRL(peca.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals & Payment Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-2">
            {/* Payment Conditions and PIX */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="font-bold text-slate-800">Condições de Pagamento:</div>
              <div className="space-y-1 text-slate-600">
                <div>• <strong>PIX à vista:</strong> 5% de desconto no total da OS.</div>
                <div>• <strong>Cartões de Crédito:</strong> Em até 6x sem juros (Visa/Master/Elo).</div>
                <div>• <strong>Boleto Faturado:</strong> Disponível para empresas cadastradas (PJ).</div>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-500">Chave PIX: 14.882.901/0001-44</span>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#00a2e8] hover:underline"
                >
                  {copiedPix ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPix ? 'Copiado!' : 'Copiar Chave'}</span>
                </button>
              </div>
            </div>

            {/* Total Balance Card */}
            <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-900 text-white space-y-2 print:bg-white print:text-slate-900 print:border-black">
              <div className="flex justify-between text-xs text-slate-300 print:text-slate-600">
                <span>Subtotal Serviços:</span>
                <span className="font-mono tabular-nums font-semibold">
                  {formatCurrencyBRL(os.mao_de_obra_valor || 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-300 print:text-slate-600">
                <span>Subtotal Peças:</span>
                <span className="font-mono tabular-nums font-semibold">
                  {formatCurrencyBRL(os.pecas_valor || 0)}
                </span>
              </div>
              {os.desconto_valor ? (
                <div className="flex justify-between text-xs text-emerald-400 print:text-emerald-700">
                  <span>Desconto Concedido:</span>
                  <span className="font-mono tabular-nums font-semibold">
                    - {formatCurrencyBRL(os.desconto_valor)}
                  </span>
                </div>
              ) : null}
              <div className="pt-2 border-t border-slate-700 print:border-black flex justify-between items-baseline">
                <span className="text-sm font-bold tracking-tight uppercase">Valor Total Líquido:</span>
                <span className="text-2xl font-black font-mono tracking-tight text-[#00a2e8] print:text-slate-900 tabular-nums">
                  {formatCurrencyBRL(os.valor_total)}
                </span>
              </div>
            </div>
          </div>

          {/* Legal Terms & Warranty */}
          <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-200 pt-3">
            <strong>Termo de Garantia:</strong> Os serviços executados e peças novas aplicadas contam com garantia legal de <strong>90 (noventa) dias</strong> a contar da data de entrega, conforme Artigo 26, Inciso II da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor). A garantia não cobre avarias decorrentes de mau uso, sinistros externos ou intervenção de terceiros.
          </div>

          {/* Signature Lines */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-slate-900 pt-2 space-y-0.5">
              <div className="font-bold text-slate-900">{clientName}</div>
              <div className="text-[10px] text-slate-500">Assinatura do Cliente / De acordo</div>
            </div>

            <div className="border-t border-slate-900 pt-2 space-y-0.5">
              <div className="font-bold text-slate-900">
                {os.tecnico_responsavel || 'Marcos Silveira — Chefe de Oficina'}
              </div>
              <div className="text-[10px] text-slate-500">Auto Mecânica Central — Responsável Técnico</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar (Hidden in Print) */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyPublicLink}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link da OS'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {onUpdateStatus && os.status === 'aberto' && (
              <button
                onClick={() => onUpdateStatus(os.id, 'em_andamento')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <span>Aprovar & Iniciar Oficina</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onUpdateStatus && os.status === 'em_andamento' && (
              <button
                onClick={() => onUpdateStatus(os.id, 'concluido')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <span>Concluir Serviço</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
