import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';
import {
  formatCurrencyBRL,
  calculateOSProfitMargin,
  getAccountsReceivableMetrics,
} from '../utils/workshopLogic.ts';

interface ExportFinancialPDFOptions {
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  totalRevenue: number;
  workshopName?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
}

export function exportFinancialSummaryPDF({
  ordens,
  clientes,
  veiculos,
  totalRevenue,
  workshopName = 'AUTO MECÂNICA CENTRAL',
  cnpj = '14.882.901/0001-44',
  phone = '(11) 3290-8844',
  address = 'Av. das Oficinas, 450 — Mooca, São Paulo/SP',
}: ExportFinancialPDFOptions) {
  // Create jsPDF document (A4 portrait, mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Top Decorative Header Bar
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Accent Line
  doc.setFillColor(0, 162, 232); // #00a2e8
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(workshopName, margin, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`CNPJ: ${cnpj}  |  Tel/WhatsApp: ${phone}  |  ${address}`, margin, 19);

  // Right Side Header Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('DEMONSTRATIVO FINANCEIRO', pageWidth - margin, 12, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const now = new Date();
  doc.text(
    `Emissão: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin,
    19,
    { align: 'right' }
  );

  // 2. Executive Summary Metrics Calculation
  const completedOS = ordens.filter((o) => o.status === 'concluido' || o.status === 'entregue');
  const openOS = ordens.filter((o) => o.status === 'aberto' || o.status === 'em_andamento' || o.status === 'aguardando_pecas');

  const pecasTotal = ordens.reduce((acc, curr) => acc + (curr.pecas_valor || 0), 0);
  const maoDeObraTotal = ordens.reduce((acc, curr) => acc + (curr.mao_de_obra_valor || 0), 0);
  const pecasCustoEstimado = pecasTotal * 0.65; // ~35% parts gross margin
  const lucroLiquidoEstimado = totalRevenue - pecasCustoEstimado;
  const margemPercentual = totalRevenue > 0 ? Math.round((lucroLiquidoEstimado / totalRevenue) * 100) : 0;
  const ticketMedio = ordens.length > 0 ? totalRevenue / ordens.length : 0;

  // 3. Section Title
  let currentY = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. RESUMO EXECUTIVO DE FATURAMENTO & RENTABILIDADE', margin, currentY);

  // 4. KPI Summary Cards (4 Cards Grid)
  currentY += 5;
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 22;

  const kpis = [
    { label: 'RECEITA TOTAL BRUTA', val: formatCurrencyBRL(totalRevenue), sub: `${ordens.length} ordens registradas` },
    { label: 'CUSTO ESTIMADO PEÇAS', val: formatCurrencyBRL(pecasCustoEstimado), sub: 'Preço de custo reposição' },
    { label: 'LUCRO LÍQUIDO REAL', val: formatCurrencyBRL(lucroLiquidoEstimado), sub: `Margem média: ${margemPercentual}%` },
    { label: 'TICKET MÉDIO POR OS', val: formatCurrencyBRL(ticketMedio), sub: `${completedOS.length} finalizadas` },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 3);

    // Card background
    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    // Label
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 3, currentY + 6);

    // Value
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, cardX + 3, currentY + 13);

    // Subtext
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 3, currentY + 18);
  });

  // 5. Itemized Table of Work Orders
  currentY += cardHeight + 8;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DISCRIMINAÇÃO DETALHADA DAS ORDENS DE SERVIÇO', margin, currentY);

  const tableRows = ordens.map((os) => {
    const client = clientes.find((c) => c.id === os.cliente_id);
    const vehicle = veiculos.find((v) => v.id === os.veiculo_id);

    const statusLabels: Record<string, string> = {
      aberto: 'Aberto',
      em_andamento: 'Em Execução',
      aguardando_pecas: 'Aguard. Peças',
      concluido: 'Concluído',
      entregue: 'Entregue',
    };

    return [
      `#${os.numero_os}`,
      new Date(os.data_entrada).toLocaleDateString('pt-BR'),
      client?.nome_completo || 'Cliente',
      vehicle ? `${vehicle.modelo} (${vehicle.placa})` : 'Veículo',
      statusLabels[os.status] || os.status,
      formatCurrencyBRL(os.mao_de_obra_valor || 0),
      formatCurrencyBRL(os.pecas_valor || 0),
      formatCurrencyBRL(os.valor_total),
    ];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [['OS Nº', 'Entrada', 'Cliente', 'Veículo / Placa', 'Status', 'Mão de Obra', 'Peças', 'Total']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 38 },
      3: { cellWidth: 38 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 24, fontStyle: 'bold', halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  // 6. Signatures and Audit Footer Block
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : pageHeight - 35;

  // Verify page overflow before printing signatures
  if (finalY > pageHeight - 40) {
    doc.addPage();
  }

  const sigY = Math.min(finalY, pageHeight - 32);

  // Disclaimer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Demonstrativo contábil gerado para fins de conciliação financeira interna, conferência de estoque e prestação de contas da oficina.',
    margin,
    sigY
  );

  // Signatures
  const sigColWidth = 70;
  const sigLeftX = margin + 10;
  const sigRightX = pageWidth - margin - sigColWidth - 10;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(sigLeftX, sigY + 14, sigLeftX + sigColWidth, sigY + 14);
  doc.line(sigRightX, sigY + 14, sigRightX + sigColWidth, sigY + 14);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Marcos Silveira — Responsável Técnico', sigLeftX + sigColWidth / 2, sigY + 18, { align: 'center' });
  doc.text('Gestão Financeira & Diretoria', sigRightX + sigColWidth / 2, sigY + 18, { align: 'center' });

  // 7. Footer Page Number
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `MinhaOficina Pro ERP  ·  Página ${i} de ${totalPages}  ·  Relatório Seguro Gerencial`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Trigger browser download
  const dateStr = now.toISOString().split('T')[0];
  doc.save(`Relatorio_Financeiro_Oficina_${dateStr}.pdf`);
}

export interface ExportAccountsReceivablePDFOptions {
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  filterStatus?: 'todos' | 'vencidos' | 'pendentes' | 'pagos';
  workshopName?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  pixKey?: string;
}

/**
 * Exports Accounts Receivable list and collection status report in formatted A4 PDF
 */
export function exportAccountsReceivablePDF({
  ordens,
  clientes,
  veiculos,
  filterStatus = 'todos',
  workshopName = 'AUTO MECÂNICA CENTRAL',
  cnpj = '14.882.901/0001-44',
  phone = '(11) 3290-8844',
  address = 'Av. das Oficinas, 450 — Mooca, São Paulo/SP',
  pixKey = '14.882.901/0001-44 (CNPJ)',
}: ExportAccountsReceivablePDFOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const now = new Date();

  // 1. Header Bar
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Accent Line
  doc.setFillColor(245, 158, 11); // #f59e0b (amber for receivables)
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(workshopName, margin, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`CNPJ: ${cnpj}  |  Tel/WhatsApp: ${phone}  |  ${address}`, margin, 19);

  // Right Header Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('CONTAS A RECEBER & COBRANÇA', pageWidth - margin, 12, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Emissão: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin,
    19,
    { align: 'right' }
  );

  // 2. Metrics calculation
  const metrics = getAccountsReceivableMetrics(ordens);

  let targetList: OrdemServico[] = [];
  if (filterStatus === 'vencidos') {
    targetList = metrics.receivableOrders.filter((o) => o.status_pagamento === 'vencido');
  } else if (filterStatus === 'pendentes') {
    targetList = metrics.receivableOrders.filter((o) => o.status_pagamento !== 'vencido');
  } else if (filterStatus === 'pagos') {
    targetList = metrics.paidOrders;
  } else {
    targetList = [...metrics.receivableOrders, ...metrics.paidOrders];
  }

  // 3. Section Title & Filter Indicator
  let currentY = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. RESUMO EXECUTIVO DE CRÉDITOS & INADIMPLÊNCIA', margin, currentY);

  const filterLabels: Record<string, string> = {
    todos: 'Todas as Ordens (Pendentes + Pagas)',
    vencidos: 'Apenas Contas Vencidas em Atraso',
    pendentes: 'Apenas Pendentes no Prazo',
    pagos: 'Apenas Ordens Já Liquidadas',
  };
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Escopo do Relatório: ${filterLabels[filterStatus] || filterStatus}`, pageWidth - margin, currentY, { align: 'right' });

  // 4. KPI Cards
  currentY += 5;
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 22;

  const kpis = [
    { label: 'TOTAL A RECEBER', val: formatCurrencyBRL(metrics.totalReceivable), sub: `${metrics.receivableOrders.length} ordens em aberto` },
    { label: 'TOTAL EM ATRASO', val: formatCurrencyBRL(metrics.overdueTotal), sub: `${metrics.overdueCount} faturas vencidas` },
    { label: 'PENDENTE NO PRAZO', val: formatCurrencyBRL(metrics.pendingTotal), sub: `${metrics.pendingCount} ordens no vencimento` },
    { label: 'VALOR TOTAL PAGO', val: formatCurrencyBRL(metrics.totalPaid), sub: `${metrics.paidOrders.length} ordens liquidadas` },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 3, currentY + 6);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, cardX + 3, currentY + 13);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 3, currentY + 18);
  });

  // 5. Itemized Table of Receivables
  currentY += cardHeight + 8;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DISCRIMINAÇÃO DAS CONTAS & POSIÇÃO DE COBRANÇA', margin, currentY);

  const tableRows = targetList.map((os) => {
    const client = clientes.find((c) => c.id === os.cliente_id);
    const vehicle = veiculos.find((v) => v.id === os.veiculo_id);

    const paymentStatusLabels: Record<string, string> = {
      pago: 'LIQUIDADO',
      pendente: 'PENDENTE',
      vencido: 'VENCIDO (COBRAR)',
    };

    const dueDateStr = os.data_vencimento
      ? new Date(os.data_vencimento).toLocaleDateString('pt-BR')
      : new Date(os.data_entrada).toLocaleDateString('pt-BR');

    const clientPhone = client?.dados_privados?.telefone || '(11) 98765-4321';

    return [
      `#${os.numero_os}`,
      client?.nome_completo || 'Cliente',
      clientPhone,
      vehicle ? `${vehicle.modelo} (${vehicle.placa})` : 'Veículo',
      dueDateStr,
      paymentStatusLabels[os.status_pagamento || 'pendente'] || (os.status_pagamento || 'pendente').toUpperCase(),
      os.forma_pagamento || 'PIX / Cartão',
      formatCurrencyBRL(os.valor_total),
    ];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [['OS Nº', 'Cliente', 'WhatsApp / Tel', 'Veículo / Placa', 'Vencimento', 'Status Pagto', 'Forma', 'Valor']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 15, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 34 },
      2: { cellWidth: 26 },
      3: { cellWidth: 34 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 26, fontStyle: 'bold', halign: 'center' },
      6: { cellWidth: 22 },
      7: { cellWidth: 23, fontStyle: 'bold', halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  // 6. Bank & PIX Instructions & Signatures
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : pageHeight - 40;
  if (finalY > pageHeight - 40) {
    doc.addPage();
  }

  const sigY = Math.min(finalY, pageHeight - 34);

  // Bank Info Box
  doc.setFillColor(254, 243, 199); // #fef3c7
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(margin, sigY, pageWidth - margin * 2, 14, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('DADOS BANCÁRIOS PARA LIQUIDAÇÃO E COBRANÇA:', margin + 3, sigY + 5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 53, 15);
  doc.text(`Chave PIX Oficial: ${pixKey}  |  Banco: Itaú Unibanco (341) Ag: 0450 C/C: 29844-1  |  Titular: Auto Mecânica Central Ltda`, margin + 3, sigY + 10);

  // Signatures
  const sigColWidth = 65;
  const sigLeftX = margin + 10;
  const sigRightX = pageWidth - margin - sigColWidth - 10;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(sigLeftX, sigY + 22, sigLeftX + sigColWidth, sigY + 22);
  doc.line(sigRightX, sigY + 22, sigRightX + sigColWidth, sigY + 22);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Setor de Cobrança & Atendimento', sigLeftX + sigColWidth / 2, sigY + 25.5, { align: 'center' });
  doc.text('Gerência Financeira da Oficina', sigRightX + sigColWidth / 2, sigY + 25.5, { align: 'center' });

  // 7. Page numbering
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `MinhaOficina Pro ERP  ·  Contas a Receber  ·  Página ${i} de ${totalPages}  ·  Documento Interno Confidencial`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  const dateStr = now.toISOString().split('T')[0];
  doc.save(`Contas_a_Receber_Oficina_${dateStr}.pdf`);
}

export interface ExportProfitabilityPDFOptions {
  ordens: OrdemServico[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  targetMargin?: number;
  workshopName?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
}

/**
 * Exports unit profit margin and overall profitability report in formatted A4 PDF
 */
export function exportProfitabilityReportPDF({
  ordens,
  clientes,
  veiculos,
  targetMargin = 40,
  workshopName = 'AUTO MECÂNICA CENTRAL',
  cnpj = '14.882.901/0001-44',
  phone = '(11) 3290-8844',
  address = 'Av. das Oficinas, 450 — Mooca, São Paulo/SP',
}: ExportProfitabilityPDFOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const now = new Date();

  // 1. Header Bar
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Accent Line
  doc.setFillColor(16, 185, 129); // #10b981 (emerald for profit)
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(workshopName, margin, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`CNPJ: ${cnpj}  |  Tel/WhatsApp: ${phone}  |  ${address}`, margin, 19);

  // Right Header Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE LUCRATIVIDADE & MARGEM', pageWidth - margin, 12, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Emissão: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin,
    19,
    { align: 'right' }
  );

  // 2. Compute Profitability for each OS
  const profitabilityList = ordens.map((os) => {
    const client = clientes.find((c) => c.id === os.cliente_id);
    const vehicle = veiculos.find((v) => v.id === os.veiculo_id);
    const clientName = client?.nome_completo || 'Cliente';
    const vehicleDesc = vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.placa})` : 'Veículo';

    return calculateOSProfitMargin(os, clientName, vehicleDesc);
  });

  const totalReceita = profitabilityList.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const totalCustoPecas = profitabilityList.reduce((acc, curr) => acc + curr.custoPecas, 0);
  const totalCustoMO = profitabilityList.reduce((acc, curr) => acc + curr.custoMaoDeObra, 0);
  const totalCustos = profitabilityList.reduce((acc, curr) => acc + curr.custoTotal, 0);
  const totalLucro = profitabilityList.reduce((acc, curr) => acc + curr.lucroLiquido, 0);
  const margemMediaGlobal = totalReceita > 0 ? Number(((totalLucro / totalReceita) * 100).toFixed(1)) : 0;

  // 3. Section Title
  let currentY = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. RESUMO EXECUTIVO DE RENTABILIDADE OPERACIONAL', margin, currentY);

  // 4. KPI Cards
  currentY += 5;
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 22;

  const kpis = [
    { label: 'RECEITA TOTAL COBRADA', val: formatCurrencyBRL(totalReceita), sub: `${profitabilityList.length} OS calculadas` },
    { label: 'CUSTOS DEDUZIDOS (PÇS+MO)', val: formatCurrencyBRL(totalCustos), sub: `Pçs: ${formatCurrencyBRL(totalCustoPecas)}` },
    { label: 'LUCRO LÍQUIDO REAL', val: formatCurrencyBRL(totalLucro), sub: `Margem Média: ${margemMediaGlobal}%` },
    { label: 'META DE MARGEM MÍNIMA', val: `${targetMargin}%`, sub: margemMediaGlobal >= targetMargin ? 'Meta superada' : 'Abaixo da meta' },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 3, currentY + 6);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, cardX + 3, currentY + 13);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 3, currentY + 18);
  });

  // 5. Itemized Table of Profitability
  currentY += cardHeight + 8;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DEMONSTRATIVO DE MARGEM LÍQUIDA POR ORDEM DE SERVIÇO', margin, currentY);

  const tableRows = profitabilityList.map((item) => {
    return [
      `#${item.numeroOS}`,
      item.clienteNome,
      item.veiculoDesc,
      formatCurrencyBRL(item.valorTotal),
      formatCurrencyBRL(item.custoPecas),
      formatCurrencyBRL(item.custoMaoDeObra),
      formatCurrencyBRL(item.lucroLiquido),
      `${item.margemLucroPercentual}%`,
    ];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [['OS Nº', 'Cliente', 'Veículo', 'Total Cobrado', 'Custo Peças', 'Custo M.O.', 'Lucro Líquido', 'Margem (%)']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 15, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 22, fontStyle: 'bold', halign: 'right' },
      7: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  // 6. Signatures & Auditor Block
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : pageHeight - 35;
  if (finalY > pageHeight - 38) {
    doc.addPage();
  }

  const sigY = Math.min(finalY, pageHeight - 32);

  // Disclaimer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'O cálculo de margem desconta o custo unitário de peças de reposição e o custo de mão de obra direta de mecânicos e preparadores.',
    margin,
    sigY
  );

  const sigColWidth = 70;
  const sigLeftX = margin + 10;
  const sigRightX = pageWidth - margin - sigColWidth - 10;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(sigLeftX, sigY + 14, sigLeftX + sigColWidth, sigY + 14);
  doc.line(sigRightX, sigY + 14, sigRightX + sigColWidth, sigY + 14);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Auditoria de Custos & Estoque', sigLeftX + sigColWidth / 2, sigY + 18, { align: 'center' });
  doc.text('Gestão Financeira & Diretoria', sigRightX + sigColWidth / 2, sigY + 18, { align: 'center' });

  // 7. Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `MinhaOficina Pro ERP  ·  Relatório de Lucratividade por OS  ·  Página ${i} de ${totalPages}  ·  Documento Interno`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const dateStr = now.toISOString().split('T')[0];
  doc.save(`Relatorio_Lucratividade_Margem_OS_${dateStr}.pdf`);
}
