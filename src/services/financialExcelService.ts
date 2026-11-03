import * as XLSX from 'xlsx';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  calculateMonthlyFinancialData,
  checkProfitTargetAlert,
  formatCurrencyBRL,
  maskSensitiveData,
} from '../utils/workshopLogic.ts';

export interface ExportFinancialExcelOptions {
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  totalRevenue: number;
  profitTarget?: number;
  workshopName?: string;
  cnpj?: string;
  phone?: string;
}

/**
 * Generates and downloads a multi-sheet Microsoft Excel (.xlsx) spreadsheet
 * containing complete managerial and itemized accounting control data.
 */
export function exportFinancialSummaryExcel({
  ordens,
  clientes,
  veiculos,
  totalRevenue,
  profitTarget = 12000,
  workshopName = 'AUTO MECÂNICA CENTRAL',
  cnpj = '14.882.901/0001-44',
  phone = '(11) 3290-8844',
}: ExportFinancialExcelOptions): void {
  const wb = XLSX.utils.book_new();

  // 1. Calculations
  const completedOS = ordens.filter((o) => o.status === 'concluido' || o.status === 'entregue');
  const openOS = ordens.filter((o) => o.status === 'aberto' || o.status === 'em_andamento' || o.status === 'aguardando_pecas');
  
  const totalPecas = ordens.reduce((acc, curr) => acc + (curr.pecas_valor || 0), 0);
  const totalMaoDeObra = ordens.reduce((acc, curr) => acc + (curr.mao_de_obra_valor || 0), 0);
  const totalDescontos = ordens.reduce((acc, curr) => acc + (curr.desconto_valor || 0), 0);
  const custoPecasTotal = totalPecas * 0.65;
  const lucroLiquidoTotal = totalRevenue - custoPecasTotal;
  const margemMediaPercentual = totalRevenue > 0 ? Math.round((lucroLiquidoTotal / totalRevenue) * 100) : 0;
  const ticketMedio = ordens.length > 0 ? Number((totalRevenue / ordens.length).toFixed(2)) : 0;

  // Monthly breakdown for the year
  const monthlyData = calculateMonthlyFinancialData(ordens, '12meses');
  const currentMonthRecord = monthlyData[monthlyData.length - 1];
  const currentMonthProfit = currentMonthRecord ? currentMonthRecord.lucroLiquido : 0;
  const targetAlert = checkProfitTargetAlert(currentMonthProfit, profitTarget);

  const now = new Date();
  const emissionDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  // ==========================================
  // SHEET 1: RESUMO GERENCIAL & CONTÁBIL
  // ==========================================
  const summaryAoa: any[][] = [
    [`${workshopName} — DEMONSTRATIVO FINANCEIRO E CONTÁBIL`],
    [`CNPJ: ${cnpj} | Telefone: ${phone} | Emissão: ${emissionDate}`],
    [],
    ['1. INDICADORES GERAIS DE DESEMPENHO (KPIs)', 'VALOR', 'OBSERVAÇÃO'],
    ['Faturamento Bruto Total (R$)', totalRevenue, 'Soma total de serviços e peças faturadas'],
    ['Custo Direto de Peças & Insumos (R$)', Number(custoPecasTotal.toFixed(2)), 'Base de custo de reposição com fornecedores (~65%)'],
    ['Mão de Obra Líquida Faturada (R$)', totalMaoDeObra, 'Receita direta de horas técnicas da oficina'],
    ['Total de Descontos Concedidos (R$)', totalDescontos, 'Descontos aplicados na negociação de pagamentos'],
    ['Lucro Líquido Acumulado Estimado (R$)', Number(lucroLiquidoTotal.toFixed(2)), 'Receita Total menos Custos Diretos de Peças'],
    ['Margem Líquida Operacional Média', `${margemMediaPercentual}%`, 'Rentabilidade líquida percentual sobre a receita'],
    ['Ticket Médio por Ordem de Serviço (R$)', ticketMedio, 'Média faturada por veículo atendido'],
    ['Total de Ordens de Serviço', ordens.length, `${completedOS.length} finalizadas / entregues e ${openOS.length} em andamento`],
    [],
    ['2. CONTROLE DA META MENSAL DE LUCRO LÍQUIDO', 'VALOR', 'STATUS'],
    ['Meta Mensal Estabelecida (R$)', profitTarget, 'Definida pela diretoria da oficina'],
    ['Lucro Líquido Apurado no Mês Vigente (R$)', currentMonthProfit, currentMonthRecord?.mesCompleto || 'Mês Atual'],
    ['Percentual da Meta Atingido', `${targetAlert.percentage}%`, targetAlert.status === 'abaixo' ? 'ALERTA: ABAIXO DA META' : 'META ATINGIDA / SUPERADA'],
    ['Déficit / Superávit Financeiro (R$)', targetAlert.isBelow ? -targetAlert.deficit : (currentMonthProfit - profitTarget), targetAlert.message],
    ['Recomendação Gerencial', targetAlert.recommendation, ''],
    [],
    ['3. EVOLUÇÃO MENSAL CONSOLIDADA'],
    ['Mês', 'Período Completo', 'Receita Bruta (R$)', 'Custo Peças (R$)', 'Mão de Obra (R$)', 'Lucro Líquido (R$)', 'Margem (%)', 'Ordens Concluídas', 'Status Meta'],
  ];

  monthlyData.forEach((m) => {
    const isBelowMeta = m.lucroLiquido < profitTarget;
    summaryAoa.push([
      m.mes,
      m.mesCompleto,
      m.receitaBruta,
      m.custoPecas,
      m.maoDeObra,
      m.lucroLiquido,
      `${m.margem}%`,
      m.ordensCount,
      isBelowMeta ? `Abaixo da Meta (-${formatCurrencyBRL(profitTarget - m.lucroLiquido)})` : 'Meta Atingida ✓',
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);

  // Column widths for Sheet 1
  wsSummary['!cols'] = [
    { wch: 38 }, // A
    { wch: 25 }, // B
    { wch: 45 }, // C
    { wch: 18 }, // D
    { wch: 18 }, // E
    { wch: 18 }, // F
    { wch: 14 }, // G
    { wch: 18 }, // H
    { wch: 28 }, // I
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Gerencial');

  // ==========================================
  // SHEET 2: DETALHAMENTO DE ORDENS DE SERVIÇO
  // ==========================================
  const osHeaders = [
    'Nº OS',
    'Data Entrada',
    'Data Saída',
    'Cliente',
    'CPF (LGPD)',
    'Telefone',
    'Veículo',
    'Placa',
    'Ano',
    'Status Operacional',
    'Descrição dos Serviços / Diagnóstico',
    'Mão de Obra (R$)',
    'Peças (R$)',
    'Desconto (R$)',
    'Valor Total OS (R$)',
    'Custo Est. Peças (R$)',
    'Lucro Estimado OS (R$)',
    'Margem Est. (%)',
    'Técnico Responsável',
  ];

  const statusMap: Record<string, string> = {
    aberto: 'Orçamento Aberto',
    em_andamento: 'Em Execução',
    aguardando_pecas: 'Aguardando Peças',
    concluido: 'Finalizada / Pronta',
    entregue: 'Entregue ao Cliente',
  };

  const osRows = ordens.map((os) => {
    const client = clientes.find((c) => c.id === os.cliente_id);
    const vehicle = veiculos.find((v) => v.id === os.veiculo_id);

    const maoDeObra = os.mao_de_obra_valor || 0;
    const pecas = os.pecas_valor || 0;
    const desconto = os.desconto_valor || 0;
    const total = os.valor_total || 0;
    const custoPecas = Number((pecas * 0.65).toFixed(2));
    const lucroOS = Number((total - custoPecas).toFixed(2));
    const margemOS = total > 0 ? Math.round((lucroOS / total) * 100) : 0;

    return [
      `#${os.numero_os}`,
      new Date(os.data_entrada).toLocaleDateString('pt-BR'),
      os.data_saida ? new Date(os.data_saida).toLocaleDateString('pt-BR') : '—',
      client?.nome_completo || 'Cliente Não Identificado',
      maskSensitiveData(client?.dados_privados?.cpf || '', 'cpf'),
      maskSensitiveData(client?.dados_privados?.telefone || '', 'telefone'),
      vehicle ? `${vehicle.marca} ${vehicle.modelo}` : '—',
      vehicle?.placa || '—',
      vehicle?.ano || '—',
      statusMap[os.status] || os.status,
      os.descricao_problema || '—',
      maoDeObra,
      pecas,
      desconto,
      total,
      custoPecas,
      lucroOS,
      `${margemOS}%`,
      os.tecnico_responsavel || 'Mecânica Central',
    ];
  });

  const wsOS = XLSX.utils.aoa_to_sheet([osHeaders, ...osRows]);

  // Column widths for Sheet 2
  wsOS['!cols'] = [
    { wch: 10 }, // Nº OS
    { wch: 14 }, // Entrada
    { wch: 14 }, // Saída
    { wch: 28 }, // Cliente
    { wch: 18 }, // CPF
    { wch: 18 }, // Telefone
    { wch: 24 }, // Veículo
    { wch: 12 }, // Placa
    { wch: 8 },  // Ano
    { wch: 20 }, // Status
    { wch: 45 }, // Descrição
    { wch: 16 }, // M.O.
    { wch: 14 }, // Peças
    { wch: 14 }, // Desconto
    { wch: 18 }, // Total
    { wch: 18 }, // Custo Peças
    { wch: 18 }, // Lucro OS
    { wch: 14 }, // Margem
    { wch: 22 }, // Técnico
  ];

  XLSX.utils.book_append_sheet(wb, wsOS, 'Detalhamento OS');

  // 3. Save File
  const fileDate = now.toISOString().split('T')[0];
  const fileName = `Controle_Financeiro_Oficina_${fileDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
