/**
 * AutoManager / MinhaOficina Workshop Pure Logic & Security Validation Utilities
 */
export interface Cliente {
  id: string;
  usuario_id?: string;
  nome_completo: string;
  nome_fantasia?: string;
  created_at?: string;
  dados_privados?: {
    cpf?: string;
    rg?: string;
    telefone?: string;
    endereco_rua?: string;
    endereco_numero?: string;
    endereco_bairro?: string;
    endereco_cidade?: string;
    endereco_uf?: string;
    endereco_cep?: string;
  };
}

export interface Veiculo {
  id: string;
  usuario_id?: string;
  cliente_id: string;
  marca: string;
  modelo: string;
  ano?: string;
  placa: string;
  cor?: string;
  created_at?: string;
}

export interface OrdemServico {

  id: string;
  usuario_id?: string;
  numero_os: number;
  cliente_id: string;
  veiculo_id: string;
  status: 'aberto' | 'em_andamento' | 'aguardando_pecas' | 'concluido' | 'entregue';
  descricao_problema: string;
  pecas_valor?: number;
  mao_de_obra_valor?: number;
  pecas_custo?: number;
  mao_de_obra_custo?: number;
  desconto_valor?: number;
  valor_total: number;
  data_entrada: string;
  data_saida?: string | null;
  tecnico_responsavel?: string;
  status_pagamento?: 'pago' | 'pendente' | 'vencido';
  data_vencimento?: string | null;
  forma_pagamento?: string;
}

export interface DeployStepItem {
  id: string;
  title: string;
  mandatory: boolean;
  done: boolean;
}

/**
 * Calculates financial totals for an Ordem de Serviço
 */
export function calculateOSTotals(pecas: number = 0, maoDeObra: number = 0, desconto: number = 0): {
  subtotal: number;
  desconto: number;
  total: number;
} {
  const safePecas = Math.max(0, Number(pecas) || 0);
  const safeMaoDeObra = Math.max(0, Number(maoDeObra) || 0);
  const safeDesconto = Math.max(0, Number(desconto) || 0);

  const subtotal = safePecas + safeMaoDeObra;
  const total = Math.max(0, subtotal - safeDesconto);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    desconto: Number(safeDesconto.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

export interface OSProfitMarginCalculation {
  osId: string;
  numeroOS: number;
  clienteNome: string;
  veiculoDesc: string;
  status: string;
  statusPagamento?: string;
  valorTotal: number;
  custoPecas: number;
  custoMaoDeObra: number;
  custoTotal: number;
  lucroLiquido: number;
  margemLucroPercentual: number;
}

/**
 * Calculates profit and profit margin for a specific work order by subtracting
 * parts cost and direct labor cost from total amount paid / billed.
 */
export function calculateOSProfitMargin(
  os: OrdemServico,
  clienteNome: string = 'Cliente da Oficina',
  veiculoDesc: string = 'Veículo'
): OSProfitMarginCalculation {
  const valorTotal = Math.max(0, Number(os.valor_total) || 0);

  // Cost of parts: explicit pecas_custo or 60% of pecas_valor
  const custoPecas = os.pecas_custo !== undefined
    ? Math.max(0, Number(os.pecas_custo))
    : Math.max(0, Number(((os.pecas_valor || 0) * 0.60).toFixed(2)));

  // Cost of direct labor / technician: explicit mao_de_obra_custo or 45% of mao_de_obra_valor
  const custoMaoDeObra = os.mao_de_obra_custo !== undefined
    ? Math.max(0, Number(os.mao_de_obra_custo))
    : Math.max(0, Number(((os.mao_de_obra_valor || 0) * 0.45).toFixed(2)));

  const custoTotal = Number((custoPecas + custoMaoDeObra).toFixed(2));
  const lucroLiquido = Number((valorTotal - custoTotal).toFixed(2));
  const margemLucroPercentual = valorTotal > 0
    ? Number(((lucroLiquido / valorTotal) * 100).toFixed(1))
    : 0;

  return {
    osId: os.id,
    numeroOS: os.numero_os,
    clienteNome,
    veiculoDesc,
    status: os.status,
    statusPagamento: os.status_pagamento,
    valorTotal,
    custoPecas,
    custoMaoDeObra,
    custoTotal,
    lucroLiquido,
    margemLucroPercentual,
  };
}

export interface RevenueVsTargetPoint {
  mes: string;
  mesCompleto: string;
  faturamentoRealizado: number;
  metaEstipulada: number;
  atingimentoPercentual: number;
  superavitDeficit: number;
  metaAtingida: boolean;
  ordensCount: number;
  lucroLiquido: number;
}

/**
 * Generates monthly revenue evolution compared with stipulated revenue targets
 */
export function calculateRevenueVsTargetEvolution(
  monthlyData: MonthlyFinancialRecord[],
  targetRevenue: number = 25000
): RevenueVsTargetPoint[] {
  const safeTarget = Math.max(1, Number(targetRevenue) || 25000);

  return monthlyData.map((item) => {
    const faturamento = item.receitaBruta;
    const atingimento = Number(((faturamento / safeTarget) * 100).toFixed(1));
    const superavitDeficit = Number((faturamento - safeTarget).toFixed(2));
    const metaAtingida = faturamento >= safeTarget;

    return {
      mes: item.mes,
      mesCompleto: item.mesCompleto,
      faturamentoRealizado: faturamento,
      metaEstipulada: safeTarget,
      atingimentoPercentual: atingimento,
      superavitDeficit,
      metaAtingida,
      ordensCount: item.ordensCount,
      lucroLiquido: item.lucroLiquido,
    };
  });
}

export interface AnnualTrendPoint {
  mes: string;
  mesCompleto: string;
  receitaBruta: number;
  custoPecas: number;
  maoDeObra: number;
  lucroLiquido: number;
  margem: number;
  ordensCount: number;
  mediaMovel3M: number;
  crescimentoMoM: number;
  crescimentoValor: number;
  isPositiveGrowth: boolean;
}

export interface AnnualTrendSummary {
  points: AnnualTrendPoint[];
  totalFaturadoAno: number;
  totalLucroAno: number;
  totalCustosAno: number;
  mediaMensalReceita: number;
  mediaMensalLucro: number;
  margemMediaAnual: number;
  melhorMes: { mes: string; mesCompleto: string; receita: number };
  menorMes: { mes: string; mesCompleto: string; receita: number };
  crescimentoAnualPercentual: number;
  totalOrdensAno: number;
}

/**
 * Computes 12-month revenue trend analysis, including 3-month moving average,
 * annual aggregates, best/worst performance months, and year-over-year momentum.
 */
export function calculate12MonthsTrendSummary(
  monthlyData: MonthlyFinancialRecord[]
): AnnualTrendSummary {
  if (!monthlyData || monthlyData.length === 0) {
    return {
      points: [],
      totalFaturadoAno: 0,
      totalLucroAno: 0,
      totalCustosAno: 0,
      mediaMensalReceita: 0,
      mediaMensalLucro: 0,
      margemMediaAnual: 0,
      melhorMes: { mes: '-', mesCompleto: '-', receita: 0 },
      menorMes: { mes: '-', mesCompleto: '-', receita: 0 },
      crescimentoAnualPercentual: 0,
      totalOrdensAno: 0,
    };
  }

  // Calculate 3-month moving average for each point
  const points: AnnualTrendPoint[] = monthlyData.map((item, index, array) => {
    const windowStart = Math.max(0, index - 2);
    const windowSlice = array.slice(windowStart, index + 1);
    const sumWindow = windowSlice.reduce((acc, curr) => acc + curr.receitaBruta, 0);
    const mediaMovel3M = Number((sumWindow / windowSlice.length).toFixed(2));

    return {
      mes: item.mes,
      mesCompleto: item.mesCompleto,
      receitaBruta: item.receitaBruta,
      custoPecas: item.custoPecas,
      maoDeObra: item.maoDeObra,
      lucroLiquido: item.lucroLiquido,
      margem: item.margem,
      ordensCount: item.ordensCount,
      mediaMovel3M,
      crescimentoMoM: item.crescimentoMoM || 0,
      crescimentoValor: item.crescimentoValor || 0,
      isPositiveGrowth: item.isPositiveGrowth ?? true,
    };
  });

  const totalFaturadoAno = Number(
    points.reduce((acc, curr) => acc + curr.receitaBruta, 0).toFixed(2)
  );
  const totalLucroAno = Number(
    points.reduce((acc, curr) => acc + curr.lucroLiquido, 0).toFixed(2)
  );
  const totalCustosAno = Number(
    points.reduce((acc, curr) => acc + curr.custoPecas + curr.maoDeObra, 0).toFixed(2)
  );
  const totalOrdensAno = points.reduce((acc, curr) => acc + curr.ordensCount, 0);

  const mediaMensalReceita = points.length > 0
    ? Number((totalFaturadoAno / points.length).toFixed(2))
    : 0;

  const mediaMensalLucro = points.length > 0
    ? Number((totalLucroAno / points.length).toFixed(2))
    : 0;

  const margemMediaAnual = totalFaturadoAno > 0
    ? Number(((totalLucroAno / totalFaturadoAno) * 100).toFixed(1))
    : 0;

  let melhorMes = { mes: points[0].mes, mesCompleto: points[0].mesCompleto, receita: points[0].receitaBruta };
  let menorMes = { mes: points[0].mes, mesCompleto: points[0].mesCompleto, receita: points[0].receitaBruta };

  for (const p of points) {
    if (p.receitaBruta > melhorMes.receita) {
      melhorMes = { mes: p.mes, mesCompleto: p.mesCompleto, receita: p.receitaBruta };
    }
    if (p.receitaBruta < menorMes.receita) {
      menorMes = { mes: p.mes, mesCompleto: p.mesCompleto, receita: p.receitaBruta };
    }
  }

  // Momentum: growth between first month and last month
  const primeiroMes = points[0].receitaBruta;
  const ultimoMes = points[points.length - 1].receitaBruta;
  const crescimentoAnualPercentual = primeiroMes > 0
    ? Number((((ultimoMes - primeiroMes) / primeiroMes) * 100).toFixed(1))
    : 0;

  return {
    points,
    totalFaturadoAno,
    totalLucroAno,
    totalCustosAno,
    mediaMensalReceita,
    mediaMensalLucro,
    margemMediaAnual,
    melhorMes,
    menorMes,
    crescimentoAnualPercentual,
    totalOrdensAno,
  };
}

export interface ServiceCategoryStat {
  categoria: string;
  contagem: number;
  receitaTotal: number;
  ticketMedio: number;
  percentual: number;
}

export interface DashboardBIReport {
  totalRevenue: number;
  targetRevenue: number;
  revenueAchievementRate: number;
  revenueSurplusDeficit: number;
  isTargetAchieved: boolean;
  averageTicketPrice: number;
  averagePartsTicket: number;
  averageLaborTicket: number;
  totalOrdersCount: number;
  completedOrdersCount: number;
  activeOrdersCount: number;
  mostFrequentServices: ServiceCategoryStat[];
  statusDistribution: Array<{ status: string; label: string; count: number; valor: number }>;
}

/**
 * Aggregates visual business intelligence performance data for DashboardView:
 * Total Revenue vs Target, Average Ticket Price, and Most Frequent Services
 */
export function calculateDashboardMetrics(
  ordens: OrdemServico[],
  targetRevenue: number = 25000
): DashboardBIReport {
  const safeTarget = Math.max(1, Number(targetRevenue) || 25000);
  const totalOrdersCount = ordens.length;

  const completedOrders = ordens.filter(
    (o) => o.status === 'concluido' || o.status === 'entregue'
  );
  const activeOrders = ordens.filter(
    (o) => o.status !== 'concluido' && o.status !== 'entregue'
  );

  const completedRevenue = completedOrders.reduce(
    (acc, curr) => acc + (Number(curr.valor_total) || 0),
    0
  );

  const revenueAchievementRate = Number(((completedRevenue / safeTarget) * 100).toFixed(1));
  const revenueSurplusDeficit = Number((completedRevenue - safeTarget).toFixed(2));
  const isTargetAchieved = completedRevenue >= safeTarget;

  // Average Ticket Calculation
  const denominator = completedOrders.length > 0 ? completedOrders.length : (ordens.length > 0 ? ordens.length : 1);
  const averageTicketPrice = Number((completedRevenue / denominator).toFixed(2));

  const totalParts = completedOrders.reduce((acc, curr) => acc + (Number(curr.pecas_valor) || 0), 0);
  const totalLabor = completedOrders.reduce((acc, curr) => acc + (Number(curr.mao_de_obra_valor) || 0), 0);

  const averagePartsTicket = Number((totalParts / denominator).toFixed(2));
  const averageLaborTicket = Number((totalLabor / denominator).toFixed(2));

  // Service Categorization & Frequency
  const categoryMap: Record<string, { count: number; receita: number }> = {
    'Revisão de Freios & Pastilhas': { count: 0, receita: 0 },
    'Troca de Óleo & Filtros': { count: 0, receita: 0 },
    'Suspensão & Amortecedores': { count: 0, receita: 0 },
    'Injeção Eletrônica & Scanner': { count: 0, receita: 0 },
    'Motor & Transmissão': { count: 0, receita: 0 },
    'Ar-Condicionado & Elétrica': { count: 0, receita: 0 },
    'Alinhamento & Geometria': { count: 0, receita: 0 },
  };

  ordens.forEach((os) => {
    const desc = (os.descricao_problema || '').toLowerCase();
    const val = Number(os.valor_total) || 0;

    if (desc.includes('freio') || desc.includes('pastilha') || desc.includes('disco') || desc.includes('fluido')) {
      categoryMap['Revisão de Freios & Pastilhas'].count += 1;
      categoryMap['Revisão de Freios & Pastilhas'].receita += val;
    } else if (desc.includes('óleo') || desc.includes('oleo') || desc.includes('filtro') || desc.includes('lubrific')) {
      categoryMap['Troca de Óleo & Filtros'].count += 1;
      categoryMap['Troca de Óleo & Filtros'].receita += val;
    } else if (desc.includes('suspens') || desc.includes('amortecedor') || desc.includes('pivô') || desc.includes('batente')) {
      categoryMap['Suspensão & Amortecedores'].count += 1;
      categoryMap['Suspensão & Amortecedores'].receita += val;
    } else if (desc.includes('inje') || desc.includes('vela') || desc.includes('scanner') || desc.includes('bico')) {
      categoryMap['Injeção Eletrônica & Scanner'].count += 1;
      categoryMap['Injeção Eletrônica & Scanner'].receita += val;
    } else if (desc.includes('motor') || desc.includes('cabeçote') || desc.includes('correia') || desc.includes('embreagem')) {
      categoryMap['Motor & Transmissão'].count += 1;
      categoryMap['Motor & Transmissão'].receita += val;
    } else if (desc.includes('ar') || desc.includes('climat') || desc.includes('alternador') || desc.includes('bateria') || desc.includes('farol')) {
      categoryMap['Ar-Condicionado & Elétrica'].count += 1;
      categoryMap['Ar-Condicionado & Elétrica'].receita += val;
    } else {
      categoryMap['Alinhamento & Geometria'].count += 1;
      categoryMap['Alinhamento & Geometria'].receita += val;
    }
  });

  const totalCategorizedCount = Object.values(categoryMap).reduce((acc, c) => acc + c.count, 0) || 1;

  const mostFrequentServices: ServiceCategoryStat[] = Object.entries(categoryMap)
    .map(([categoria, stat]) => ({
      categoria,
      contagem: stat.count,
      receitaTotal: Number(stat.receita.toFixed(2)),
      ticketMedio: stat.count > 0 ? Number((stat.receita / stat.count).toFixed(2)) : 0,
      percentual: Number(((stat.count / totalCategorizedCount) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.contagem - a.contagem || b.receitaTotal - a.receitaTotal);

  // Status Distribution
  const statusLabels: Record<string, string> = {
    aberto: 'Orçamento Aberto',
    em_andamento: 'Em Execução',
    aguardando_pecas: 'Aguardando Peças',
    concluido: 'Pronto p/ Retirada',
    entregue: 'Entregue / Finalizada',
  };

  const statusDistribution = Object.entries(statusLabels).map(([statusKey, label]) => {
    const list = ordens.filter((o) => o.status === statusKey);
    const valor = list.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
    return {
      status: statusKey,
      label,
      count: list.length,
      valor: Number(valor.toFixed(2)),
    };
  });

  return {
    totalRevenue: Number(completedRevenue.toFixed(2)),
    targetRevenue: safeTarget,
    revenueAchievementRate,
    revenueSurplusDeficit,
    isTargetAchieved,
    averageTicketPrice,
    averagePartsTicket,
    averageLaborTicket,
    totalOrdersCount,
    completedOrdersCount: completedOrders.length,
    activeOrdersCount: activeOrders.length,
    mostFrequentServices,
    statusDistribution,
  };
}

export interface DatabaseBackupPayload {
  version: string;
  appName: string;
  exportedAt: string;
  source: 'local' | 'google_drive';
  tables: {
    ordens: OrdemServico[];
    clientes: any[];
    veiculos: any[];
    systemSettings?: WorkshopSystemSettings;
  };
}

/**
 * Serializes database into portable JSON backup payload compatible with Local storage and Google Drive
 */
export function serializeDatabaseBackup(
  ordens: OrdemServico[],
  clientes: any[],
  veiculos: any[],
  systemSettings?: WorkshopSystemSettings,
  source: 'local' | 'google_drive' = 'local'
): DatabaseBackupPayload {
  return {
    version: '1.0.0',
    appName: 'MinhaOficina Pro ERP',
    exportedAt: new Date().toISOString(),
    source,
    tables: {
      ordens,
      clientes,
      veiculos,
      systemSettings,
    },
  };
}

/**
 * Validates integrity of uploaded/restored database backup payload
 */
export function validateDatabaseBackup(payload: any): {
  valid: boolean;
  message: string;
  counts?: { ordens: number; clientes: number; veiculos: number };
} {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'Arquivo de backup inválido ou corrompido.' };
  }
  if (!payload.tables || typeof payload.tables !== 'object') {
    return { valid: false, message: 'Estrutura de tabelas ausente no arquivo de backup.' };
  }
  const { ordens, clientes, veiculos } = payload.tables;
  if (!Array.isArray(ordens) || !Array.isArray(clientes) || !Array.isArray(veiculos)) {
    return { valid: false, message: 'As coleções de ordens, clientes ou veículos estão inválidas.' };
  }
  return {
    valid: true,
    message: 'Backup validado com sucesso.',
    counts: {
      ordens: ordens.length,
      clientes: clientes.length,
      veiculos: veiculos.length,
    },
  };
}

/**
 * Generates an official WhatsApp dispatch message for a Work Order / Estimate
 */
export function generateWhatsAppMessageForOS(options: {
  osNumber: number;
  clientName: string;
  vehicleModel: string;
  vehiclePlate: string;
  status: string;
  totalValue: number;
  problemDesc: string;
  workshopName?: string;
  workshopPhone?: string;
}): string {
  const workshop = options.workshopName || 'Auto Mecânica Central';
  const phone = options.workshopPhone || '(11) 3290-8844';
  const statusLabels: Record<string, string> = {
    aberto: 'Orçamento Aberto',
    em_andamento: 'Em Execução na Oficina',
    aguardando_pecas: 'Aguardando Peças',
    concluido: 'Pronto para Retirada',
    entregue: 'Entregue ao Cliente',
  };

  const statusLabel = statusLabels[options.status] || options.status;

  return (
    `*${workshop.toUpperCase()} — LAUDO E ORÇAMENTO*\n\n` +
    `Olá, *${options.clientName}*!\n` +
    `Segue a atualização da sua Ordem de Serviço:\n\n` +
    `📋 *OS Nº:* #${options.osNumber}\n` +
    `🚗 *Veículo:* ${options.vehicleModel} — Placa: *${options.vehiclePlate}*\n` +
    `⚡ *Status Atual:* ${statusLabel}\n` +
    `💰 *Valor Total:* ${formatCurrencyBRL(options.totalValue)}\n` +
    `🔧 *Serviços/Diagnóstico:* ${options.problemDesc}\n\n` +
    `✅ *Garantia:* 90 dias conforme CDC.\n` +
    `Para aprovar ou tirar dúvidas, responda aqui ou ligue para ${phone}.\n` +
    `Agradecemos a confiança!`
  );
}

/**
 * Generates an official, polite and formatted WhatsApp collection / billing reminder message
 */
export function generateWhatsAppBillingReminderMessage(options: {
  clientName: string;
  osNumber: number;
  vehicleModel: string;
  vehiclePlate: string;
  totalValue: number;
  completionDate?: string;
  dueDate?: string;
  workshopName?: string;
  workshopPhone?: string;
  pixKey?: string;
}): string {
  const workshop = options.workshopName || 'Auto Mecânica Central';
  const phone = options.workshopPhone || '(11) 3290-8844';
  const pix = options.pixKey || '14.882.901/0001-44';
  const completion = options.completionDate
    ? new Date(options.completionDate).toLocaleDateString('pt-BR')
    : 'recente';

  return (
    `*${workshop.toUpperCase()} — LEMBRETE DE FATURAMENTO*\n\n` +
    `Olá, *${options.clientName}*! Tudo bem?\n\n` +
    `Passando para informar que os serviços do seu veículo foram *concluídos com sucesso* pela nossa equipe técnica:\n\n` +
    `📋 *Ordem de Serviço:* #${options.osNumber}\n` +
    `🚗 *Veículo:* ${options.vehicleModel} — Placa: *${options.vehiclePlate}*\n` +
    `📅 *Data de Conclusão:* ${completion}\n` +
    `💰 *Valor Pendente:* *${formatCurrencyBRL(options.totalValue)}*\n\n` +
    `🔑 *Chave Pix para Pagamento:* \`${pix}\`\n` +
    `💳 Também aceitamos cartões de crédito/débito no balcão da oficina.\n\n` +
    `Caso o pagamento já tenha sido realizado, por favor desconsidere este aviso ou envie o comprovante por aqui.\n\n` +
    `Para dúvidas ou agendar retirada, responda nesta conversa ou ligue: ${phone}.\n` +
    `Agradecemos a preferência! 🔧`
  );
}

export interface WhatsAppReminderLinkInfo {
  url: string;
  encodedMessage: string;
  cleanPhone: string;
  formattedPhone: string;
  clientName: string;
  osNumber: number;
  vehicleModel: string;
  vehiclePlate: string;
  totalValue: number;
  statusPagamento: 'pendente' | 'vencido';
  isOverdue: boolean;
  messageText: string;
}

/**
 * Generates a direct clickable WhatsApp reminder link for work orders marked as 'pendente' or 'vencido'
 */
export function generateClickableWhatsAppReminderLink(
  order: OrdemServico,
  client?: Cliente,
  vehicle?: Veiculo,
  workshopInfo?: { name?: string; phone?: string; pixKey?: string }
): WhatsAppReminderLinkInfo {
  const workshop = workshopInfo?.name || 'Auto Mecânica Central';
  const workshopPhone = workshopInfo?.phone || '(11) 3290-8844';
  const pix = workshopInfo?.pixKey || '14.882.901/0001-44';

  const clientName = client?.nome_completo || 'Cliente';
  const rawPhone = client?.dados_privados?.telefone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const formattedPhone = rawPhone || '(11) 98844-0000';

  const vehicleModel = vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Veículo em Manutenção';
  const vehiclePlate = vehicle?.placa || 'BRA2E19';
  const totalValue = Number(order.valor_total) || 0;

  const statusPagamento = (order.status_pagamento === 'vencido' ? 'vencido' : 'pendente') as 'pendente' | 'vencido';
  const isOverdue = statusPagamento === 'vencido';

  const completion = order.data_saida || order.data_entrada
    ? new Date(order.data_saida || order.data_entrada).toLocaleDateString('pt-BR')
    : 'recente';

  const dueDateText = order.data_vencimento
    ? new Date(order.data_vencimento).toLocaleDateString('pt-BR')
    : null;

  let messageText = '';
  if (isOverdue) {
    messageText =
      `*${workshop.toUpperCase()} — AVISO DE FATURA VENCIDA*\n\n` +
      `Olá, *${clientName}*! Tudo bem?\n\n` +
      `Identificamos em nosso sistema financeiro que a fatura referente à manutenção do seu veículo está *em atraso*:\n\n` +
      `📋 *Ordem de Serviço:* #${order.numero_os}\n` +
      `🚗 *Veículo:* ${vehicleModel} — Placa: *${vehiclePlate}*\n` +
      (dueDateText ? `⚠️ *Vencimento:* ${dueDateText}\n` : '') +
      `💰 *Valor Pendente:* *${formatCurrencyBRL(totalValue)}*\n\n` +
      `🔑 *Chave Pix para Regularização Imediata:* \`${pix}\`\n\n` +
      `Para sua comodidade, também aceitamos cartão ou parcelamento no balcão.\n` +
      `Caso já tenha efetuado o pagamento nas últimas 24h, por gentileza responda com o comprovante para darmos baixa.\n\n` +
      `Para dúvidas ou acordos, estamos à disposição: ${workshopPhone}.\n` +
      `Atenciosamente, equipe ${workshop}! 🔧`;
  } else {
    messageText =
      `*${workshop.toUpperCase()} — LEMBRETE DE PAGAMENTO*\n\n` +
      `Olá, *${clientName}*! Tudo bem?\n\n` +
      `Passando para lembrar sobre a ordem de serviço do seu veículo realizada em nossa oficina:\n\n` +
      `📋 *Ordem de Serviço:* #${order.numero_os}\n` +
      `🚗 *Veículo:* ${vehicleModel} — Placa: *${vehiclePlate}*\n` +
      `📅 *Data do Serviço:* ${completion}\n` +
      (dueDateText ? `📅 *Vencimento Previsto:* ${dueDateText}\n` : '') +
      `💰 *Valor Total:* *${formatCurrencyBRL(totalValue)}*\n\n` +
      `🔑 *Chave Pix para Pagamento:* \`${pix}\`\n\n` +
      `Também aceitamos cartões no balcão da oficina.\n` +
      `Se já efetuou o pagamento, pode desconsiderar esta mensagem.\n\n` +
      `Agradecemos a confiança e preferência! Dúvidas: ${workshopPhone}. 🚗💨`;
  }

  const encodedMessage = encodeURIComponent(messageText);
  const url = cleanPhone.length >= 10
    ? `https://wa.me/55${cleanPhone}?text=${encodedMessage}`
    : `https://api.whatsapp.com/send?text=${encodedMessage}`;

  return {
    url,
    encodedMessage,
    cleanPhone,
    formattedPhone,
    clientName,
    osNumber: order.numero_os,
    vehicleModel,
    vehiclePlate,
    totalValue,
    statusPagamento,
    isOverdue,
    messageText,
  };
}

/**
 * Calculates count and financial sum for a specific Kanban column

 */
export function calculateKanbanColumnTotals(
  ordens: Array<{ status: string; valor_total?: number }>,
  targetStatus: string
): { count: number; totalValue: number } {
  const filtered = ordens.filter((o) => o.status === targetStatus);
  const totalValue = filtered.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
  return {
    count: filtered.length,
    totalValue: Number(totalValue.toFixed(2)),
  };
}

/**
 * Validates allowed status transitions for workflow sanity
 */
export function canTransitionOSStatus(current: string, target: string): boolean {
  if (current === target) return true;
  const allowedTransitions: Record<string, string[]> = {
    aberto: ['em_andamento', 'aguardando_pecas', 'concluido', 'entregue'],
    em_andamento: ['aguardando_pecas', 'concluido', 'entregue', 'aberto'],
    aguardando_pecas: ['em_andamento', 'concluido', 'aberto'],
    concluido: ['entregue', 'em_andamento'],
    entregue: ['concluido'],
  };
  return allowedTransitions[current]?.includes(target) ?? true;
}

export interface MonthlyFinancialRecord {
  mes: string;
  mesCompleto: string;
  receitaBruta: number;
  custoPecas: number;
  maoDeObra: number;
  lucroLiquido: number;
  margem: number;
  ordensCount: number;
  receitaMesAnterior?: number;
  crescimentoMoM?: number;
  crescimentoValor?: number;
  isPositiveGrowth?: boolean;
}

/**
 * Calculates Month-over-Month (MoM) percentage growth and nominal diff
 */
export function calculateMoMGrowth(current: number, previous: number): {
  percentage: number;
  diff: number;
  isPositive: boolean;
} {
  const safeCurr = Number(current) || 0;
  const safePrev = Number(previous) || 0;

  if (safePrev === 0) {
    return {
      percentage: safeCurr > 0 ? 100 : 0,
      diff: safeCurr,
      isPositive: safeCurr >= 0,
    };
  }

  const diff = safeCurr - safePrev;
  const percentage = Number((((safeCurr - safePrev) / safePrev) * 100).toFixed(1));

  return {
    percentage,
    diff: Number(diff.toFixed(2)),
    isPositive: diff >= 0,
  };
}

/**
 * Evaluates whether parts expense exceeded predefined spending ceiling
 */
export function checkPartsExpenseLimit(partsExpense: number, limit: number): {
  isExceeded: boolean;
  excess: number;
  percentage: number;
  message: string;
} {
  const safeExpense = Math.max(0, Number(partsExpense) || 0);
  const safeLimit = Math.max(1, Number(limit) || 8000);
  const percentage = Math.round((safeExpense / safeLimit) * 100);
  const diff = safeExpense - safeLimit;

  if (diff > 0) {
    return {
      isExceeded: true,
      excess: Number(diff.toFixed(2)),
      percentage,
      message: `Gastos com peças (${formatCurrencyBRL(safeExpense)}) ultrapassaram o teto estipulado de ${formatCurrencyBRL(safeLimit)} em ${formatCurrencyBRL(diff)} (${percentage}% do limite).`,
    };
  }

  return {
    isExceeded: false,
    excess: 0,
    percentage,
    message: `Gastos com peças sob controle (${percentage}% do teto de ${formatCurrencyBRL(safeLimit)}).`,
  };
}

/**
 * Computes monthly financial breakdown for chart visualization and reporting
 */
export function calculateMonthlyFinancialData(
  ordens: Array<{
    status: string;
    valor_total?: number;
    pecas_valor?: number;
    mao_de_obra_valor?: number;
    data_entrada?: string;
  }>,
  period: '6meses' | '12meses' | 'trimestre' = '6meses'
): MonthlyFinancialRecord[] {
  const baseData: Record<string, { mesCompleto: string; receita: number; pecas: number; maoDeObra: number; count: number }> = {
    'Nov/25': { mesCompleto: 'Novembro 2025', receita: 15400, pecas: 6200, maoDeObra: 9200, count: 14 },
    'Dez/25': { mesCompleto: 'Dezembro 2025', receita: 19800, pecas: 7900, maoDeObra: 11900, count: 18 },
    'Jan/26': { mesCompleto: 'Janeiro 2026', receita: 14200, pecas: 5800, maoDeObra: 8400, count: 12 },
    'Fev/26': { mesCompleto: 'Fevereiro 2026', receita: 16100, pecas: 6400, maoDeObra: 9700, count: 15 },
    'Mar/26': { mesCompleto: 'Março 2026', receita: 17500, pecas: 7100, maoDeObra: 10400, count: 16 },
    'Abr/26': { mesCompleto: 'Abril 2026', receita: 18900, pecas: 7600, maoDeObra: 11300, count: 17 },
    'Mai/26': { mesCompleto: 'Maio 2026', receita: 20200, pecas: 8100, maoDeObra: 12100, count: 19 },
    'Jun/26': { mesCompleto: 'Junho 2026', receita: 22400, pecas: 8900, maoDeObra: 13500, count: 21 },
    'Jul/26': { mesCompleto: 'Julho 2026', receita: 21100, pecas: 8500, maoDeObra: 12600, count: 20 },
    'Ago/26': { mesCompleto: 'Agosto 2026', receita: 23800, pecas: 9600, maoDeObra: 14200, count: 22 },
    'Set/26': { mesCompleto: 'Setembro 2026', receita: 22900, pecas: 9200, maoDeObra: 13700, count: 21 },
    'Out/26': { mesCompleto: 'Outubro 2026', receita: 18500, pecas: 7400, maoDeObra: 11100, count: 18 },
  };

  const completedOS = ordens.filter((o) => o.status === 'concluido' || o.status === 'entregue');
  const realReceita = completedOS.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
  const realPecas = completedOS.reduce((acc, curr) => acc + (Number(curr.pecas_valor) || 0), 0);
  const realMaoDeObra = completedOS.reduce((acc, curr) => acc + (Number(curr.mao_de_obra_valor) || 0), 0);

  if (baseData['Out/26']) {
    baseData['Out/26'].receita += realReceita;
    baseData['Out/26'].pecas += realPecas;
    baseData['Out/26'].maoDeObra += realMaoDeObra;
    baseData['Out/26'].count += completedOS.length;
  }

  const allMonths = Object.keys(baseData);
  let selectedMonths: string[];

  if (period === 'trimestre') {
    selectedMonths = allMonths.slice(-3);
  } else if (period === '12meses') {
    selectedMonths = allMonths;
  } else {
    selectedMonths = allMonths.slice(-6);
  }

  return selectedMonths.map((mesKey, idx, arr) => {
    const item = baseData[mesKey];
    const pecasCustoReal = item.pecas * 0.65;
    const lucroLiquido = item.receita - pecasCustoReal;
    const margem = item.receita > 0 ? Math.round((lucroLiquido / item.receita) * 100) : 0;

    // Month-over-Month calculation against preceding month in series
    let receitaMesAnterior = 0;
    let crescimentoMoM = 0;
    let crescimentoValor = 0;
    let isPositiveGrowth = true;

    // Look up previous month in allMonths
    const fullIdx = allMonths.indexOf(mesKey);
    if (fullIdx > 0) {
      const prevKey = allMonths[fullIdx - 1];
      const prevItem = baseData[prevKey];
      receitaMesAnterior = Number(prevItem.receita.toFixed(2));
      const growth = calculateMoMGrowth(item.receita, prevItem.receita);
      crescimentoMoM = growth.percentage;
      crescimentoValor = growth.diff;
      isPositiveGrowth = growth.isPositive;
    }

    return {
      mes: mesKey,
      mesCompleto: item.mesCompleto,
      receitaBruta: Number(item.receita.toFixed(2)),
      custoPecas: Number(pecasCustoReal.toFixed(2)),
      maoDeObra: Number(item.maoDeObra.toFixed(2)),
      lucroLiquido: Number(lucroLiquido.toFixed(2)),
      margem,
      ordensCount: item.count,
      receitaMesAnterior,
      crescimentoMoM,
      crescimentoValor,
      isPositiveGrowth,
    };
  });
}

export interface SixMonthGrowthMetrics {
  records: MonthlyFinancialRecord[];
  totalRevenue6M: number;
  totalProfit6M: number;
  averageMonthlyRevenue: number;
  averageMonthlyProfit: number;
  peakMonth: { mes: string; mesCompleto: string; receita: number };
  troughMonth: { mes: string; mesCompleto: string; receita: number };
  netGrowth6MPercent: number;
  netGrowth6MValue: number;
  seasonalityInsight: string;
}

/**
 * Calculates 6-month monthly revenue growth trends, comparison metrics,
 * and seasonal performance insights for the workshop dashboard.
 */
export function calculate6MonthGrowthMetrics(
  ordens: Array<{
    status: string;
    valor_total?: number;
    pecas_valor?: number;
    mao_de_obra_valor?: number;
    data_entrada?: string;
  }> = []
): SixMonthGrowthMetrics {
  const records = calculateMonthlyFinancialData(ordens, '6meses');

  if (!records || records.length === 0) {
    return {
      records: [],
      totalRevenue6M: 0,
      totalProfit6M: 0,
      averageMonthlyRevenue: 0,
      averageMonthlyProfit: 0,
      peakMonth: { mes: '-', mesCompleto: '-', receita: 0 },
      troughMonth: { mes: '-', mesCompleto: '-', receita: 0 },
      netGrowth6MPercent: 0,
      netGrowth6MValue: 0,
      seasonalityInsight: 'Sem dados suficientes para análise sazonal.',
    };
  }

  const totalRevenue6M = Number(
    records.reduce((acc, curr) => acc + curr.receitaBruta, 0).toFixed(2)
  );
  const totalProfit6M = Number(
    records.reduce((acc, curr) => acc + curr.lucroLiquido, 0).toFixed(2)
  );
  const averageMonthlyRevenue = Number((totalRevenue6M / records.length).toFixed(2));
  const averageMonthlyProfit = Number((totalProfit6M / records.length).toFixed(2));

  // Identify peak and trough months
  let peakMonth = { mes: records[0].mes, mesCompleto: records[0].mesCompleto, receita: records[0].receitaBruta };
  let troughMonth = { mes: records[0].mes, mesCompleto: records[0].mesCompleto, receita: records[0].receitaBruta };

  records.forEach((rec) => {
    if (rec.receitaBruta > peakMonth.receita) {
      peakMonth = { mes: rec.mes, mesCompleto: rec.mesCompleto, receita: rec.receitaBruta };
    }
    if (rec.receitaBruta < troughMonth.receita) {
      troughMonth = { mes: rec.mes, mesCompleto: rec.mesCompleto, receita: rec.receitaBruta };
    }
  });

  // Net growth over 6-month horizon (first month of semester to last)
  const firstMonth = records[0];
  const lastMonth = records[records.length - 1];
  const netGrowth6MValue = Number((lastMonth.receitaBruta - firstMonth.receitaBruta).toFixed(2));
  const netGrowth6MPercent = firstMonth.receitaBruta > 0
    ? Number((((lastMonth.receitaBruta - firstMonth.receitaBruta) / firstMonth.receitaBruta) * 100).toFixed(1))
    : 0;

  // Derive intelligent seasonal insight
  let seasonalityInsight = '';
  if (peakMonth.mes.includes('Ago') || peakMonth.mes.includes('Jul')) {
    seasonalityInsight = `Pico sazonal em ${peakMonth.mesCompleto} (${formatCurrencyBRL(peakMonth.receita)}), típico de revisões pré-viagens de férias escolares e inverno.`;
  } else if (peakMonth.mes.includes('Dez')) {
    seasonalityInsight = `Forte demanda de final de ano em ${peakMonth.mesCompleto} (${formatCurrencyBRL(peakMonth.receita)}) com preparação de veículos para viagens e 13º salário.`;
  } else {
    seasonalityInsight = `Maior faturamento registrado em ${peakMonth.mesCompleto} (${formatCurrencyBRL(peakMonth.receita)}), com média semestral de ${formatCurrencyBRL(averageMonthlyRevenue)}.`;
  }

  return {
    records,
    totalRevenue6M,
    totalProfit6M,
    averageMonthlyRevenue,
    averageMonthlyProfit,
    peakMonth,
    troughMonth,
    netGrowth6MPercent,
    netGrowth6MValue,
    seasonalityInsight,
  };
}

export interface FinancialGoalsSettings {

  faturamentoAlvo: number;
  metaLucro: number;
  limiteGastosPecas: number;
  margemMinima: number;
}

export interface WorkshopSystemSettings {
  nomeOficina: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  diasGarantia: number;
  financialGoals: FinancialGoalsSettings;
}

export const DEFAULT_FINANCIAL_GOALS: FinancialGoalsSettings = {
  faturamentoAlvo: 25000,
  metaLucro: 12000,
  limiteGastosPecas: 8000,
  margemMinima: 40,
};

export const DEFAULT_SYSTEM_SETTINGS: WorkshopSystemSettings = {
  nomeOficina: 'Auto Mecânica Central',
  cnpj: '14.882.901/0001-44',
  telefone: '(11) 3290-8844',
  endereco: 'Av. das Oficinas, 450 — Mooca, São Paulo/SP',
  diasGarantia: 90,
  financialGoals: DEFAULT_FINANCIAL_GOALS,
};

export function loadFinancialGoalsFromStorage(): FinancialGoalsSettings {
  if (typeof window === 'undefined') return DEFAULT_FINANCIAL_GOALS;
  try {
    const saved = localStorage.getItem('minhaoficina_financial_targets');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        faturamentoAlvo: Number(parsed.faturamentoAlvo) || DEFAULT_FINANCIAL_GOALS.faturamentoAlvo,
        metaLucro: Number(parsed.metaLucro) || DEFAULT_FINANCIAL_GOALS.metaLucro,
        limiteGastosPecas: Number(parsed.limiteGastosPecas) || DEFAULT_FINANCIAL_GOALS.limiteGastosPecas,
        margemMinima: Number(parsed.margemMinima) || DEFAULT_FINANCIAL_GOALS.margemMinima,
      };
    }
  } catch (e) {
    console.error('Erro ao ler metas financeiras do localStorage', e);
  }
  return DEFAULT_FINANCIAL_GOALS;
}

export function saveFinancialGoalsToStorage(goals: FinancialGoalsSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('minhaoficina_financial_targets', JSON.stringify(goals));
  } catch (e) {
    console.error('Erro ao salvar metas financeiras no localStorage', e);
  }
}

export function loadSystemSettingsFromStorage(): WorkshopSystemSettings {
  if (typeof window === 'undefined') return DEFAULT_SYSTEM_SETTINGS;
  try {
    const saved = localStorage.getItem('minhaoficina_system_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SYSTEM_SETTINGS,
        ...parsed,
        financialGoals: {
          ...DEFAULT_FINANCIAL_GOALS,
          ...(parsed.financialGoals || {}),
        },
      };
    }
  } catch (e) {
    console.error('Erro ao ler configuracoes do sistema', e);
  }
  return DEFAULT_SYSTEM_SETTINGS;
}

export function saveSystemSettingsToStorage(settings: WorkshopSystemSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('minhaoficina_system_settings', JSON.stringify(settings));
    // Also sync financial targets key for compatibility
    if (settings.financialGoals) {
      saveFinancialGoalsToStorage(settings.financialGoals);
    }
  } catch (e) {
    console.error('Erro ao salvar configuracoes do sistema', e);
  }
}

export interface ProfitTargetAlert {
  isBelow: boolean;
  deficit: number;
  percentage: number;
  status: 'abaixo' | 'atingida' | 'superada';
  message: string;
  recommendation: string;
  severity: 'danger' | 'warning' | 'success';
}

/**
 * Evaluates monthly net profit against a managerial target and generates an alert status
 */
export function checkProfitTargetAlert(currentProfit: number, targetProfit: number): ProfitTargetAlert {
  const safeProfit = Number(currentProfit) || 0;
  const safeTarget = Math.max(1, Number(targetProfit) || 12000);

  const percentage = Math.round((safeProfit / safeTarget) * 100);
  const diff = safeProfit - safeTarget;

  if (diff < 0) {
    const deficit = Math.abs(diff);
    const severity = percentage < 75 ? 'danger' : 'warning';

    return {
      isBelow: true,
      deficit: Number(deficit.toFixed(2)),
      percentage,
      status: 'abaixo',
      message: `Lucro líquido do mês atual (${formatCurrencyBRL(safeProfit)}) está ${formatCurrencyBRL(deficit)} abaixo da meta de ${formatCurrencyBRL(safeTarget)} (${percentage}% atingido).`,
      recommendation: 'Priorize a liberação de ordens em execução, agilize aprovação de orçamentos pendentes e promova serviços preventivos de alto valor agregado (como revisão de freios e suspensão) para recuperar a margem.',
      severity,
    };
  }

  const surplus = diff;
  const isSuperada = percentage >= 110;

  return {
    isBelow: false,
    deficit: 0,
    percentage,
    status: isSuperada ? 'superada' : 'atingida',
    message: isSuperada
      ? `Parabéns! Meta mensal superada em ${formatCurrencyBRL(surplus)} (${percentage}% da meta alcançada com lucro de ${formatCurrencyBRL(safeProfit)}).`
      : `Meta mensal de lucro atingida com sucesso (${percentage}% alcançado, ${formatCurrencyBRL(safeProfit)} apurados).`,
    recommendation: 'Manter a cadência de entrada e saída dos boxes para manter a rentabilidade estável.',
    severity: 'success',
  };
}

export interface RevenueGoalAlert {
  isCritical: boolean;
  percentage: number;
  currentRevenue: number;
  targetRevenue: number;
  thresholdValue: number;
  deficitToThreshold: number;
  deficitToTarget: number;
  pipelineOrdersCount: number;
  pipelinePotentialRevenue: number;
  unpaidCompletedCount: number;
  unpaidCompletedRevenue: number;
  status: 'critico' | 'atencao' | 'saudavel';
  severity: 'danger' | 'warning' | 'success';
  title: string;
  message: string;
  recommendations: string[];
}

/**
 * Checks if current workshop revenue from completed work orders fell below 20% of target
 */
export function checkCriticalRevenueAlert(
  completedRevenue: number,
  targetRevenue: number,
  ordens: Array<{ status: string; valor_total?: number; status_pagamento?: string }> = []
): RevenueGoalAlert {
  const safeRevenue = Math.max(0, Number(completedRevenue) || 0);
  const safeTarget = Math.max(1, Number(targetRevenue) || 25000);
  const thresholdValue = Number((safeTarget * 0.20).toFixed(2));

  const percentage = Number(((safeRevenue / safeTarget) * 100).toFixed(1));
  const isCritical = safeRevenue < thresholdValue;
  const deficitToThreshold = Math.max(0, Number((thresholdValue - safeRevenue).toFixed(2)));
  const deficitToTarget = Math.max(0, Number((safeTarget - safeRevenue).toFixed(2)));

  // Pipeline orders (em_andamento, aguardando_pecas, aberto)
  const pipelineOrders = ordens.filter(
    (o) => o.status === 'aberto' || o.status === 'em_andamento' || o.status === 'aguardando_pecas'
  );
  const pipelinePotentialRevenue = pipelineOrders.reduce(
    (acc, curr) => acc + (Number(curr.valor_total) || 0),
    0
  );

  // Unpaid completed orders (concluido, entregue) but not pago
  const unpaidCompleted = ordens.filter(
    (o) => (o.status === 'concluido' || o.status === 'entregue') && o.status_pagamento !== 'pago'
  );
  const unpaidCompletedRevenue = unpaidCompleted.reduce(
    (acc, curr) => acc + (Number(curr.valor_total) || 0),
    0
  );

  let status: 'critico' | 'atencao' | 'saudavel' = 'saudavel';
  let severity: 'danger' | 'warning' | 'success' = 'success';
  let title = 'Faturamento Dentro do Esperado';
  let message = `Faturamento atual de ${formatCurrencyBRL(safeRevenue)} representa ${percentage}% da meta mensal de ${formatCurrencyBRL(safeTarget)}.`;

  if (isCritical) {
    status = 'critico';
    severity = 'danger';
    title = 'ALERTA CRÍTICO: Faturamento Abaixo de 20% da Meta';
    message = `ALERTA CRÍTICO: O faturamento realizado das ordens finalizadas (${formatCurrencyBRL(safeRevenue)}) atingiu apenas ${percentage}% da meta de ${formatCurrencyBRL(safeTarget)}, situando-se abaixo da linha de segurança de 20% (${formatCurrencyBRL(thresholdValue)}). Faltam ${formatCurrencyBRL(deficitToThreshold)} para o patamar mínimo.`;
  } else if (percentage < 50) {
    status = 'atencao';
    severity = 'warning';
    title = 'Atenção ao Ritmo de Faturamento';
    message = `Faturamento em ${percentage}% da meta mensal (${formatCurrencyBRL(safeRevenue)} de ${formatCurrencyBRL(safeTarget)}).`;
  }

  const recommendations: string[] = [];
  if (unpaidCompleted.length > 0) {
    recommendations.push(
      `Cobrança Imediata: Há ${unpaidCompleted.length} OS concluídas não pagas totalizando ${formatCurrencyBRL(unpaidCompletedRevenue)} em Contas a Receber. Dispare lembretes via WhatsApp para converter em caixa.`
    );
  }
  if (pipelineOrders.length > 0) {
    recommendations.push(
      `Acelerar Oficina: Existem ${pipelineOrders.length} ordens abertas/em execução com potencial de ${formatCurrencyBRL(pipelinePotentialRevenue)}. Priorize a finalização dos veículos prontos.`
    );
  }
  recommendations.push(
    `Revisar Metas: Caso o mês tenha sazonalidade baixa, reavalie os parâmetros no modal de Configuração de Metas.`
  );

  return {
    isCritical,
    percentage,
    currentRevenue: safeRevenue,
    targetRevenue: safeTarget,
    thresholdValue,
    deficitToThreshold,
    deficitToTarget,
    pipelineOrdersCount: pipelineOrders.length,
    pipelinePotentialRevenue: Number(pipelinePotentialRevenue.toFixed(2)),
    unpaidCompletedCount: unpaidCompleted.length,
    unpaidCompletedRevenue: Number(unpaidCompletedRevenue.toFixed(2)),
    status,
    severity,
    title,
    message,
    recommendations,
  };
}

export interface AccountsReceivableMetrics<T = OrdemServico> {
  totalReceivable: number;
  totalPaid: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
  overdueTotal: number;
  pendingTotal: number;
  receivableOrders: T[];
  paidOrders: T[];
}

/**
 * Calculates accounts receivable metrics, filtering completed/delivered orders not paid
 */
export function getAccountsReceivableMetrics<T extends OrdemServico>(ordens: T[]): AccountsReceivableMetrics<T> {
  const completedOrDelivered = ordens.filter(
    (o) => o.status === 'concluido' || o.status === 'entregue'
  );

  const receivableOrders = completedOrDelivered.filter((o) => o.status_pagamento !== 'pago');
  const paidOrders = completedOrDelivered.filter((o) => o.status_pagamento === 'pago');

  let overdueCount = 0;
  let overdueTotal = 0;
  let pendingCount = 0;
  let pendingTotal = 0;

  receivableOrders.forEach((order) => {
    const val = Number(order.valor_total) || 0;
    const isExplicitOverdue = order.status_pagamento === 'vencido';

    if (isExplicitOverdue) {
      overdueCount++;
      overdueTotal += val;
    } else {
      pendingCount++;
      pendingTotal += val;
    }
  });

  const totalReceivable = overdueTotal + pendingTotal;
  const totalPaid = paidOrders.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);

  // Sort: overdue first, then by OS number ascending
  const sortedReceivables = [...receivableOrders].sort((a, b) => {
    const aOverdue = a.status_pagamento === 'vencido' ? 1 : 0;
    const bOverdue = b.status_pagamento === 'vencido' ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;
    return (a.numero_os || 0) - (b.numero_os || 0);
  });

  return {
    totalReceivable: Number(totalReceivable.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    pendingCount,
    overdueCount,
    paidCount: paidOrders.length,
    overdueTotal: Number(overdueTotal.toFixed(2)),
    pendingTotal: Number(pendingTotal.toFixed(2)),
    receivableOrders: sortedReceivables,
    paidOrders,
  };
}

/**
 * Masks sensitive personal data (CPF, RG, Phones) according to LGPD / Supabase Security Rules
 */
export function maskSensitiveData(value: string, type: 'cpf' | 'telefone' | 'rg'): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');

  if (type === 'cpf') {
    if (digits.length !== 11) return '***.***.***-**';
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }

  if (type === 'telefone') {
    if (digits.length < 8) return '(**) *****-****';
    const lastDigits = digits.slice(-4);
    const ddd = digits.length >= 10 ? digits.slice(0, 2) : '**';
    return `(${ddd}) *****-${lastDigits}`;
  }

  if (type === 'rg') {
    if (digits.length < 6) return '**.***.***-*';
    return `**.***.${digits.slice(-4)}-*`;
  }

  return '***';
}

/**
 * Enforces Supabase Schema Access and RLS matrix
 */
export function validateRLSAccess(
  role: 'anon' | 'authenticated' | 'service_role',
  schema: 'public' | 'private',
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  isOwner: boolean = false
): { allowed: boolean; reason: string } {
  // 1. Private schema is restricted exclusively to service_role
  if (schema === 'private') {
    if (role === 'service_role') {
      return { allowed: true, reason: 'Acesso total concedido via service_role (Edge Functions seguras).' };
    }
    return {
      allowed: false,
      reason: `Bloqueado: Schema 'private' rejeita acessos diretos de '${role}'. Somente service_role tem permissão.`,
    };
  }

  // 2. Public schema with RLS enabled
  if (role === 'service_role') {
    return { allowed: true, reason: 'Acesso administrativo de backend.' };
  }

  if (role === 'anon') {
    return {
      allowed: false,
      reason: "Bloqueado por RLS: Usuário não autenticado (anon) não tem permissão para acessar registros privados da oficina.",
    };
  }

  if (role === 'authenticated') {
    if (isOwner) {
      return { allowed: true, reason: 'Permitido por RLS: Usuário autenticado acessando seus próprios registros (usuario_id = auth.uid()).' };
    }
    return {
      allowed: false,
      reason: 'Bloqueado por RLS: Usuário autenticado tentando acessar dados de outro usuário (usuario_id != auth.uid()).',
    };
  }

  return { allowed: false, reason: 'Acesso negado por padrão.' };
}

/**
 * Format numbers to Brazilian Real currency format
 */
export function formatCurrencyBRL(value: number): string {
  const safe = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safe);
}

/**
 * Validates deploy readiness based on mandatory checklist
 */
export function verifyDeployChecklistCompletion(checklist: DeployStepItem[]): {
  readyForProduction: boolean;
  completionPercentage: number;
  pendingMandatory: string[];
} {
  if (!checklist || checklist.length === 0) {
    return { readyForProduction: false, completionPercentage: 0, pendingMandatory: [] };
  }

  const completedCount = checklist.filter((item) => item.done).length;
  const percentage = Math.round((completedCount / checklist.length) * 100);

  const pendingMandatory = checklist
    .filter((item) => item.mandatory && !item.done)
    .map((item) => item.title);

  return {
    readyForProduction: pendingMandatory.length === 0,
    completionPercentage: percentage,
    pendingMandatory,
  };
}

/**
 * Dynamically generates a fully up-to-date README.md reflecting current system state,
 * active work orders, checklist progress and schemas.
 */
export function generateLiveReadmeMarkdown(options: {
  totalOS: number;
  openOS: number;
  inProgressOS: number;
  completedOS: number;
  totalClients: number;
  totalVehicles: number;
  totalRevenue: number;
  checklist: DeployStepItem[];
  lastUpdated?: string;
}): string {
  const status = verifyDeployChecklistCompletion(options.checklist);
  const now = options.lastUpdated || new Date().toISOString();

  return `# 📦 MinhaOficina Pro — Sistema de Gestão de Oficina Mecânica & Roteiro de Deploy Seguro

> **Software completo de gestão para oficina mecânica e auto elétrica** com padrão visual inspirado no [MinhaOficina](https://minhaoficina.net/programa-para-oficina-mecanica/), **banco de dados Supabase com isolamento estrito de schemas (\`public\` e \`private\`)**, políticas **Row Level Security (RLS)**, **Edge Functions serverless**, integração segura com **Paperclip Agents** e **IA Generativa Gemini** (\`gemini-3.1-flash-lite\` para triagem rápida e \`gemini-nano-banana-2.1\` para laudos com controle de aspect ratio).

---

## ⚡ Status do Sistema em Tempo Real (Atualizado Dinamicamente)

- **Última Atualização Registrada:** \`${now}\`
- **Progresso de Deploy & Go-Live:** **${status.completionPercentage}%** (${options.checklist.filter(c => c.done).length} de ${options.checklist.length} itens validados)
- **Status de Produção:** ${status.readyForProduction ? '🟢 **PRONTO PARA PRODUÇÃO**' : '🟡 **DEPLOY EM ANDAMENTO (Pendente: ' + status.pendingMandatory.length + ' item(ns))**'}
- **Ordens de Serviço Ativas:** **${options.totalOS}** (${options.openOS} em aberto | ${options.inProgressOS} em execução | ${options.completedOS} finalizadas)
- **Faturamento Acumulado:** **${formatCurrencyBRL(options.totalRevenue)}**
- **Clientes Cadastrados:** **${options.totalClients}**
- **Frota de Veículos:** **${options.totalVehicles}**

---

## 📑 Sumário

1. [Visão Geral da Arquitetura](#-visão-geral-da-arquitetura)
2. [Estrutura Completa de Pastas & Arquivos](#-estrutura-completa-de-pastas--arquivos)
3. [Segurança & Isolamento de Schemas (LGPD)](#-segurança--isolamento-de-schemas-lgpd)
4. [Banco de Dados: Scripts SQL Prontos (Execução Sequencial)](#-banco-de-dados-scripts-sql-prontos)
   - [01-schemas-e-acessos.sql](#01-schemas-e-acessossql)
   - [02-tabelas-publicas.sql](#02-tabelas-publicassql)
   - [03-tabelas-privadas.sql](#03-tabelas-privadassql)
   - [04-seguranca-rls.sql](#04-seguranca-rlssql)
5. [Frontend & Conexão Supabase](#-frontend--conexão-supabase)
6. [Backend Seguro & Edge Functions](#-backend-seguro--edge-functions)
7. [Integração Paperclip (Ponte Segura)](#-integração-paperclip-ponte-segura)
8. [Recursos de Inteligência Artificial Gemini](#-recursos-de-inteligência-artificial-gemini)
9. [Roteiro Detalhado de Deploy Passo a Passo](#-roteiro-detalhado-de-deploy-passo-a-passo)
10. [Checklist Oficial de Go-Live & Homologação](#-checklist-oficial-de-go-live--homologação)
11. [Comandos de Desenvolvimento e Testes](#-comandos-de-desenvolvimento-e-testes)
12. [Política de Atualização Contínua deste README](#-política-de-atualização-contínua-deste-readme)

---

## 🏛️ Visão Geral da Arquitetura

O sistema adota uma separação rigorosa em camadas com princípio de privilégio mínimo (*least privilege*):

\`\`\`
┌────────────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR / CLIENTE VITE                        │
│   • UI MinhaOficina (OS, Clientes, Veículos, Financeiro, Laudo A4)     │
│   • Usa exclusivamente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY      │
│   • NUNCA possui acesso à chave service_role                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
              Consultas às         │  Chamadas autenticadas via JWT
            tabelas públicas       │  para dados confidenciais
                   │               ▼
                   │      ┌───────────────────────────────────┐
                   │      │   SUPABASE EDGE FUNCTIONS         │
                   │      │   • /buscar-dados-privados        │
                   │      │   • /notificar-usuario            │
                   │      │   • /paperclip-ponte              │
                   │      │   (Usa service_role protegida)    │
                   │      └─────────────────┬─────────────────┘
                   ▼                        ▼
┌───────────────────────────────────────────┴────────────────────────────┐
│                    POSTGRESQL SUPABASE (sa-east-1)                     │
│                                                                        │
│  [SCHEMA public] — Com Row Level Security (RLS)                        │
│  ├── clientes        (nome_completo, nome_fantasia, usuario_id)        │
│  ├── veiculos        (marca, modelo, placa, ano, cor, cliente_id)      │
│  ├── ordens_servico  (numero_os, status, serviços, peças, valores)     │
│  └── notificacoes    (avisos, status de OS, alertas realtime)         │
│                                                                        │
│  [SCHEMA private] — BLOQUEADO PARA anon E authenticated                │
│  └── dados_pessoais  (cpf, rg, telefone, endereco completo)            │
│      * Apenas service_role possui permissão de leitura/escrita         │
└────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## 📁 Estrutura Completa de Pastas & Arquivos

\`\`\`
sistema-oficina/
├── 01-frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase-client.js        ← Cliente Supabase (apenas chave anon)
│   │   ├── componentes/                  ← Componentes e modais da oficina
│   │   ├── telas/                        ← Telas do MinhaOficina
│   │   └── notificacoes/                 ← Subscrição a Postgres Changes
│   ├── .env.local                        ← SOMENTE VITE_SUPABASE_URL + ANON_KEY
│   ├── .gitignore                        ← Ignora .env, node_modules, dist
│   └── package.json
│
├── 02-backend-seguro/
│   ├── edge-functions/
│   │   ├── buscar-dados-privados.js      ← Valida JWT e retorna dados pessoais
│   │   ├── notificar-usuario.js          ← Dispara notificações realtime
│   │   └── paperclip-ponte.js            ← Ponte com dados agregados (sem CPF)
│   ├── supabase-admin.js                 ← Cliente admin (service_role)
│   ├── .env                              ← SERVICE_ROLE — NUNCA SUBIR PRO GIT!
│   ├── .gitignore
│   └── package.json
│
├── 03-banco-supabase/
│   ├── 01-schemas-e-acessos.sql          ← Cria schema private e revoga anon
│   ├── 02-tabelas-publicas.sql           ← Tabelas públicas com RLS obrigatório
│   ├── 03-tabelas-privadas.sql           ← Tabela private.dados_pessoais
│   ├── 04-seguranca-rls.sql              ← Políticas usuario_id = auth.uid()
│   └── README-importacao.md
│
├── 04-paperclip-integracao/
│   ├── agentes/
│   │   ├── agente-atendimento.md         ← Instruções de atendimento
│   │   └── agente-gestor-os.md           ← Gestão de prazos e peças
│   └── fluxo-seguranca.md                ← Blindagem de dados do agente
│
└── 05-documentos/
    ├── README.md                         ← Este arquivo dinâmico
    ├── guia-deploy.md                    ← Runbook passo a passo
    └── changelog.md                      ← Histórico de atualizações
\`\`\`

---

## 🔒 Segurança & Isolamento de Schemas (LGPD)

O sistema implementa uma defesa em profundidade:

1. **Schema \`private\` vs \`public\`**:
   - \`REVOKE ALL ON SCHEMA private FROM anon;\`
   - \`REVOKE ALL ON SCHEMA private FROM authenticated;\`
   - Usuários do frontend recebem \`403 Forbidden\` imediato se tentarem fazer query direta no schema \`private\`.
2. **Políticas de Row Level Security (RLS)**:
   - Em todas as tabelas públicas (\`clientes\`, \`veiculos\`, \`ordens_servico\`, \`notificacoes\`), cada linha só é acessível quando \`usuario_id = auth.uid()\`.
   - Um usuário nunca acessa os dados de outra oficina mecânica.
3. **Ponte de Dados Privados**:
   - O frontend faz requisição \`POST /buscar-dados-privados\` enviando o token JWT no cabeçalho \`Authorization: Bearer <token>\`.
   - A Edge Function valida a sessão do usuário com \`supabaseAdmin.auth.getUser()\`.
   - Retorna unicamente os dados do usuário autenticado, mascarando o que for desnecessário.

---

## 🗄️ Banco de Dados: Scripts SQL Prontos

> ⚠️ **Importante**: Execute os 4 scripts no **SQL Editor do Supabase rigorosamente na ordem sequencial abaixo (1 → 2 → 3 → 4)**.

### \`01-schemas-e-acessos.sql\`
\`\`\`sql
-- =============================================
-- PASSO 1: CRIAR E ISOLAR OS SCHEMAS
-- =============================================

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
\`\`\`

---

### \`02-tabelas-publicas.sql\`
\`\`\`sql
-- =============================================
-- PASSO 2: TABELAS PÚBLICAS — DADOS DO SISTEMA
-- =============================================

CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome_completo VARCHAR(150) NOT NULL,
  nome_fantasia VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  marca VARCHAR(80) NOT NULL,
  modelo VARCHAR(80) NOT NULL,
  ano VARCHAR(10),
  placa VARCHAR(10),
  cor VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE CASCADE NOT NULL,
  numero_os SERIAL UNIQUE,
  status VARCHAR(30) DEFAULT 'aberto',
  descricao_problema TEXT,
  data_entrada TIMESTAMPTZ DEFAULT now(),
  data_saida TIMESTAMPTZ,
  valor_total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  tipo VARCHAR(30) CHECK (tipo IN ('sistema','os','alerta','aviso')),
  referencia_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
\`\`\`

---

### \`03-tabelas-privadas.sql\`
\`\`\`sql
-- =============================================
-- PASSO 3: DADOS SIGILOSOS — SÓ ACESSO ADMIN
-- =============================================

CREATE TABLE IF NOT EXISTS private.dados_pessoais (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf VARCHAR(14) UNIQUE,
  rg VARCHAR(20),
  telefone VARCHAR(20),
  endereco_rua VARCHAR(200),
  endereco_numero VARCHAR(20),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_uf CHAR(2),
  endereco_cep VARCHAR(10),
  data_nascimento DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION private.atualiza_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualiza_dados_pessoais
BEFORE UPDATE ON private.dados_pessoais
FOR EACH ROW EXECUTE FUNCTION private.atualiza_timestamp();
\`\`\`

---

### \`04-seguranca-rls.sql\`
\`\`\`sql
-- =============================================
-- PASSO 4: REGRAS DE ACESSO — USUÁRIO VÊ SÓ O DELE
-- =============================================

CREATE POLICY "clientes_ver_proprio" ON public.clientes FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "clientes_inserir_proprio" ON public.clientes FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "clientes_editar_proprio" ON public.clientes FOR UPDATE TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "clientes_excluir_proprio" ON public.clientes FOR DELETE TO authenticated USING (usuario_id = auth.uid());

CREATE POLICY "veiculos_ver_proprio" ON public.veiculos FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "veiculos_inserir_proprio" ON public.veiculos FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "os_ver_proprio" ON public.ordens_servico FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "os_inserir_proprio" ON public.ordens_servico FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "notificacoes_ver_proprio" ON public.notificacoes FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "notificacoes_marcar_lida" ON public.notificacoes FOR UPDATE TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (lida IS NOT NULL);
\`\`\`

---

## 🚀 Roteiro Detalhado de Deploy Passo a Passo

### Etapa 1: Provisionamento do Supabase
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e clique em **New project**.
2. Nomeie como \`sistema-oficina\` e selecione a região **South America (São Paulo) - sa-east-1**.
3. Em **Project Settings > API**, copie a **Project URL**, a **anon public key** e a **service_role secret key**.

### Etapa 2: Execução dos Scripts SQL
1. Abra o **SQL Editor** no painel do Supabase.
2. Execute os 4 scripts na ordem \`01\` → \`02\` → \`03\` → \`04\`.
3. Validação: Execute \`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';\` e certifique-se de que todas retornam \`true\`.

### Etapa 3: Deploy das Edge Functions
1. Instale a CLI: \`npm install -g supabase\`.
2. Autentique e vincule ao projeto:
   \`\`\`bash
   supabase login
   supabase link --project-ref <seu-project-id>
   \`\`\`
3. Defina os segredos protegidos:
   \`\`\`bash
   supabase secrets set SUPABASE_SERVICE_ROLE="sua_chave_service_role"
   supabase secrets set PAPERCLIP_BRIDGE_SECRET="seu_segredo_paperclip"
   \`\`\`
4. Publique as funções:
   \`\`\`bash
   supabase functions deploy buscar-dados-privados --no-verify-jwt
   supabase functions deploy notificar-usuario
   supabase functions deploy paperclip-ponte
   \`\`\`

### Etapa 4: Deploy do Frontend (Vercel)
1. Importe o repositório na Vercel.
2. Configure **apenas** as 2 variáveis públicas de ambiente:
   - \`VITE_SUPABASE_URL\` = \`https://<seu-projeto>.supabase.co\`
   - \`VITE_SUPABASE_ANON_KEY\` = \`<sua-chave-anon>\`
3. Build Command: \`npm run build\` | Output Directory: \`dist\`.

---

## ✅ Checklist Atual de Homologação

${options.checklist.map(item => `- [${item.done ? 'x' : ' '}] **${item.title}** ${item.mandatory ? '*(Obrigatório)*' : '*(Opcional)*'}`).join('\n')}

---

## 🎨 Sistema de Design & UX/UI (Padrão MinhaOficina)

O sistema segue rigorosamente a constituição de design frontend corporativo e o fluxo operacional do [minhaoficina.net](https://minhaoficina.net/programa-para-oficina-mecanica/):
- **Quadro Kanban Interativo com Drag-and-Drop**: Visualização ágil do fluxo de oficina dividido em 5 estágios (\`Orçamento / Entrada\`, \`Na Oficina / Execução\`, \`Aguardando Peças\`, \`Pronto p/ Retirada\` e \`Entregue / Finalizado\`), com totalizadores monetários (\`tabular-nums\`), contadores e movimentação suave.
- **Laudo Técnico & Orçamento A4 com WhatsApp**: Visualizador completo de ordens de serviço com cabeçalho oficial, dados de identificação veicular com placa no padrão Mercosul, resumo de checklist 360°, tabela detalhada de serviços e peças, termos de garantia legal (90 dias conforme Art. 26 do CDC), linhas de assinatura e botão para disparo de mensagem estruturada no WhatsApp do cliente.
- **Identidade Visual Autêntica**: Silhueta automotiva escura \`#0f172a\` com chave ciano elétrico \`#00a2e8\`, tipografia sem serifa limpa (\`system-ui\`) e superfícies nítidas com sombras suaves (\`shadow-xs\`).
- **Contrato de Cabeçalho em 3 Zonas**: Zona 1 (Logotipo e entidade da oficina), Zona 2 (Contexto e status de infraestrutura), Zona 3 (Ações diretas: Triagem IA com \`gemini-3.1-flash-lite\`, progresso de deploy e notificações realtime).
- **Disciplina Zero-Pill & Tipografia**: Eliminação de balões e "pills" empilhados desnecessários; uso de metadados desencaixados com separadores tipográficos \`·\` e numerais tabulares (\`tabular-nums\`) para todas as moedas, quantidades, placas e datas.
- **Controle Preciso de Aspect Ratio**: Seletor intuitivo de proporções de imagem (\`1:1\`, \`2:3\`, \`3:2\`, \`3:4\`, \`4:3\`, \`9:16\`, \`16:9\`, \`21:9\`) para geração de laudos visuais com IA.

---

## 🛠️ Comandos de Desenvolvimento e Testes

\`\`\`bash
# Instalação de dependências
npm install

# Iniciar servidor full-stack de desenvolvimento (Porta 3000)
npm run dev

# Executar suíte de testes unitários de lógica pura
npm test

# Verificar integridade de tipos TypeScript
npm run lint

# Build de produção do aplicativo
npm run build
\`\`\`

---

## 🔄 Política de Atualização Contínua deste README

Este documento é gerado e mantido em tempo real pelo núcleo do **MinhaOficina Pro**:
- Sempre que houver novas ordens de serviço, novos clientes cadastrados, mudanças no checklist de deploy ou novas rotas, o README pode ser baixado ou copiado em sua versão mais recente diretamente na interface.
- O arquivo físico \`/README.md\` na raiz do projeto permanece como documentação base oficial.

---
*Gerado dinamicamente para o Sistema de Gestão de Oficina MinhaOficina Pro.*
`;
}

export type CustomerRecoveryType = 'cobranca_receber' | 'fechamento_orcamento' | 'retorno_preventivo';

export interface CustomerRecoverySuggestion {
  id: string;
  tipo: CustomerRecoveryType;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  veiculoDesc: string;
  veiculoPlaca: string;
  osId?: string;
  numeroOs?: number;
  valor: number;
  titulo: string;
  descricao: string;
  estrategia: string;
  potencialRecuperacao: number;
  mensagemWhatsApp: string;
  status: 'pendente' | 'contatado' | 'recuperado';
}

export interface CustomerRecoveryPlan {
  isCritical: boolean;
  currentRevenue: number;
  targetRevenue: number;
  thresholdValue: number;
  deficitToThreshold: number;
  deficitToTarget: number;
  percentualAtual: number;
  totalPotencialRecuperavel: number;
  sugestoes: CustomerRecoverySuggestion[];
  resumoPorTipo: {
    cobrancaReceber: { count: number; valorTotal: number };
    fechamentoOrcamento: { count: number; valorTotal: number };
    retornoPreventivo: { count: number; valorTotal: number };
  };
}

/**
 * Generates an official WhatsApp closing incentive for pending/open estimates
 */
export function generateWhatsAppEstimateClosingMessage(options: {
  clientName: string;
  osNumber: number;
  vehicleModel: string;
  vehiclePlate: string;
  totalValue: number;
  problemDesc?: string;
  workshopName?: string;
  workshopPhone?: string;
  pixKey?: string;
  discountPercent?: number;
}): string {
  const workshop = options.workshopName || 'Auto Mecânica Central';
  const phone = options.workshopPhone || '(11) 3290-8844';
  const discount = options.discountPercent || 5;
  const discountedValue = options.totalValue * (1 - discount / 100);

  return (
    `*${workshop.toUpperCase()} — CONDIÇÃO ESPECIAL DE FECHAMENTO*\n\n` +
    `Olá, *${options.clientName}*! Tudo bem?\n\n` +
    `Estamos finalizando a programação da oficina para esta semana e temos uma condição exclusiva para o seu veículo:\n\n` +
    `🚗 *Veículo:* ${options.vehicleModel} — Placa: *${options.vehiclePlate}*\n` +
    `📋 *Orçamento Nº:* #${options.osNumber}\n` +
    `💰 *Valor Original:* ${formatCurrencyBRL(options.totalValue)}\n` +
    `🔥 *Com ${discount}% de desconto à vista via Pix:* *${formatCurrencyBRL(discountedValue)}*\n\n` +
    `⚡ *Benefício Extra:* Encaixe prioritário no box e garantia estendida de 90 dias.\n\n` +
    `Podemos confirmar a autorização dos serviços para iniciarmos hoje mesmo?\n` +
    `Basta responder *"Aprovado"* por aqui ou ligar para ${phone}.\n\n` +
    `Estamos à disposição!`
  );
}

/**
 * Generates an official WhatsApp recall / preventive maintenance checkup invitation
 */
export function generateWhatsAppPreventiveRecallMessage(options: {
  clientName: string;
  vehicleModel: string;
  vehiclePlate: string;
  serviceCategory?: string;
  estimatedPrice?: number;
  workshopName?: string;
  workshopPhone?: string;
}): string {
  const workshop = options.workshopName || 'Auto Mecânica Central';
  const phone = options.workshopPhone || '(11) 3290-8844';
  const category = options.serviceCategory || 'Revisão Preventiva & Troca de Óleo';
  const price = options.estimatedPrice || 350;

  return (
    `*${workshop.toUpperCase()} — AVISO DE REVISÃO PREVENTIVA*\n\n` +
    `Olá, *${options.clientName}*! Tudo bem?\n\n` +
    `Nosso sistema preventivo identificou que já está na hora da verificação periódica do seu carro:\n\n` +
    `🚗 *Veículo:* ${options.vehicleModel} — Placa: *${options.vehiclePlate}*\n` +
    `🔧 *Serviço Recomendado:* ${category}\n` +
    `🎁 *Cortesia Especial:* Check-up gratuito de 30 itens de segurança (freios, suspensão e bateria).\n` +
    `💰 *Condição Promocional:* A partir de *${formatCurrencyBRL(price)}* em até 3x sem juros.\n\n` +
    `Rodar com a manutenção em dia evita quebras inesperadas e economiza combustível.\n` +
    `Qual o melhor dia para agendar seu encaixe nesta semana? Responda aqui ou ligue para ${phone}.\n\n` +
    `Abraços da equipe ${workshop}!`
  );
}

/**
 * Diagnoses workshop financial health and generates a concrete Customer Recovery Action Plan
 * when revenue is below 20% or to accelerate monthly target attainment.
 */
export function generateCustomerRecoveryPlan(
  ordens: OrdemServico[],
  clientes: Cliente[],
  veiculos: Veiculo[],
  targetRevenue: number = 25000,
  workshopInfo?: { name?: string; phone?: string; pix?: string }
): CustomerRecoveryPlan {
  const safeTarget = Math.max(1, Number(targetRevenue) || 25000);
  const thresholdValue = Number((safeTarget * 0.20).toFixed(2));

  // Current completed revenue
  const completedOrders = ordens.filter(
    (o) => o.status === 'concluido' || o.status === 'entregue'
  );
  const currentRevenue = completedOrders.reduce(
    (acc, curr) => acc + (Number(curr.valor_total) || 0),
    0
  );

  const percentualAtual = Number(((currentRevenue / safeTarget) * 100).toFixed(1));
  const isCritical = currentRevenue < thresholdValue;
  const deficitToThreshold = Math.max(0, Number((thresholdValue - currentRevenue).toFixed(2)));
  const deficitToTarget = Math.max(0, Number((safeTarget - currentRevenue).toFixed(2)));

  const suggestions: CustomerRecoverySuggestion[] = [];

  // Track 1: Contas a Receber (Completed/Delivered OS unpaid)
  const unpaidCompleted = ordens.filter(
    (o) => (o.status === 'concluido' || o.status === 'entregue') && o.status_pagamento !== 'pago'
  );

  unpaidCompleted.forEach((order) => {
    const client = clientes.find((c) => c.id === order.cliente_id);
    const vehicle = veiculos.find((v) => v.id === order.veiculo_id);
    const clientName = client?.nome_completo || 'Cliente';
    const clientPhone = client?.dados_privados?.telefone || workshopInfo?.phone || '(11) 98844-0000';
    const veiculoDesc = vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Veículo';
    const vehiclePlate = vehicle?.placa || 'BRA2E19';
    const val = Number(order.valor_total) || 0;

    const msg = generateWhatsAppBillingReminderMessage({
      clientName,
      osNumber: order.numero_os,
      vehicleModel: veiculoDesc,
      vehiclePlate,
      totalValue: val,
      completionDate: order.data_saida || order.data_entrada,
      workshopName: workshopInfo?.name,
      workshopPhone: workshopInfo?.phone,
      pixKey: workshopInfo?.pix,
    });

    suggestions.push({
      id: `rec-cobranca-${order.id}`,
      tipo: 'cobranca_receber',
      clienteId: order.cliente_id,
      clienteNome: clientName,
      clienteTelefone: clientPhone,
      veiculoDesc,
      veiculoPlaca: vehiclePlate,
      osId: order.id,
      numeroOs: order.numero_os,
      valor: val,
      titulo: `Cobrança Imediata OS #${order.numero_os}`,
      descricao: `Serviço já concluído/entregue para ${clientName}. Pagamento pendente (${formatCurrencyBRL(val)}).`,
      estrategia: 'Lembrete amigável via WhatsApp com chave Pix para conversão em caixa no mesmo dia.',
      potencialRecuperacao: val,
      mensagemWhatsApp: msg,
      status: 'pendente',
    });
  });

  // Track 2: Orçamentos em Aberto / Aguardando Peças (Pipeline conversion)
  const openOrPendingOrders = ordens.filter(
    (o) => o.status === 'aberto' || o.status === 'aguardando_pecas'
  );

  openOrPendingOrders.forEach((order) => {
    const client = clientes.find((c) => c.id === order.cliente_id);
    const vehicle = veiculos.find((v) => v.id === order.veiculo_id);
    const clientName = client?.nome_completo || 'Cliente';
    const clientPhone = client?.dados_privados?.telefone || workshopInfo?.phone || '(11) 98844-0000';
    const veiculoDesc = vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Veículo';
    const vehiclePlate = vehicle?.placa || 'BRA2E19';
    const val = Number(order.valor_total) || 0;

    const msg = generateWhatsAppEstimateClosingMessage({
      clientName,
      osNumber: order.numero_os,
      vehicleModel: veiculoDesc,
      vehiclePlate,
      totalValue: val,
      problemDesc: order.descricao_problema,
      workshopName: workshopInfo?.name,
      workshopPhone: workshopInfo?.phone,
      pixKey: workshopInfo?.pix,
      discountPercent: 5,
    });

    suggestions.push({
      id: `rec-orcamento-${order.id}`,
      tipo: 'fechamento_orcamento',
      clienteId: order.cliente_id,
      clienteNome: clientName,
      clienteTelefone: clientPhone,
      veiculoDesc,
      veiculoPlaca: vehiclePlate,
      osId: order.id,
      numeroOs: order.numero_os,
      valor: val,
      titulo: `Acelerar Aprovação OS #${order.numero_os}`,
      descricao: `Orçamento aguardando autorização de ${clientName} (${formatCurrencyBRL(val)}).`,
      estrategia: 'Oferecer 5% de desconto para fechamento à vista via Pix ou garantia estendida de 90 dias.',
      potencialRecuperacao: Number((val * 0.95).toFixed(2)),
      mensagemWhatsApp: msg,
      status: 'pendente',
    });
  });

  // Track 3: Retorno Preventivo / Clientes Inativos (Recall de Manutenção)
  // Look for clients whose vehicles don't have an active or recent open OS
  const activeClientIds = new Set(ordens.map((o) => o.cliente_id));
  const candidateClients = clientes.filter((c) => !activeClientIds.has(c.id));

  // If all clients have orders, take up to 2 clients with completed orders for preventive recall
  const recallCandidates = candidateClients.length > 0
    ? candidateClients
    : clientes.slice(0, 2);

  recallCandidates.forEach((client, idx) => {
    const clientVehicle = veiculos.find((v) => v.cliente_id === client.id) || veiculos[idx % veiculos.length];
    const clientPhone = client.dados_privados?.telefone || workshopInfo?.phone || '(11) 98844-0000';
    const veiculoDesc = clientVehicle ? `${clientVehicle.marca} ${clientVehicle.modelo}` : 'Veículo';
    const vehiclePlate = clientVehicle?.placa || 'BRA2E19';
    const estimatedTicket = 390;

    const msg = generateWhatsAppPreventiveRecallMessage({
      clientName: client.nome_completo,
      vehicleModel: veiculoDesc,
      vehiclePlate,
      serviceCategory: 'Troca de Óleo, Filtros e Revisão de Freios',
      estimatedPrice: estimatedTicket,
      workshopName: workshopInfo?.name,
      workshopPhone: workshopInfo?.phone,
    });

    suggestions.push({
      id: `rec-preventiva-${client.id}`,
      tipo: 'retorno_preventivo',
      clienteId: client.id,
      clienteNome: client.nome_completo,
      clienteTelefone: clientPhone,
      veiculoDesc,
      veiculoPlaca: vehiclePlate,
      valor: estimatedTicket,
      titulo: `Recall Preventivo: ${client.nome_completo}`,
      descricao: `Cliente com ${veiculoDesc} pronto para revisão periódica de óleo, filtros e suspensão.`,

      estrategia: 'Convite cordial de revisão com cortesia de check-up de 30 itens e agendamento prioritário.',
      potencialRecuperacao: estimatedTicket,
      mensagemWhatsApp: msg,
      status: 'pendente',
    });
  });

  // Aggregate summaries
  const cobrancaReceber = suggestions
    .filter((s) => s.tipo === 'cobranca_receber')
    .reduce(
      (acc, curr) => ({ count: acc.count + 1, valorTotal: acc.valorTotal + curr.potencialRecuperacao }),
      { count: 0, valorTotal: 0 }
    );

  const fechamentoOrcamento = suggestions
    .filter((s) => s.tipo === 'fechamento_orcamento')
    .reduce(
      (acc, curr) => ({ count: acc.count + 1, valorTotal: acc.valorTotal + curr.potencialRecuperacao }),
      { count: 0, valorTotal: 0 }
    );

  const retornoPreventivo = suggestions
    .filter((s) => s.tipo === 'retorno_preventivo')
    .reduce(
      (acc, curr) => ({ count: acc.count + 1, valorTotal: acc.valorTotal + curr.potencialRecuperacao }),
      { count: 0, valorTotal: 0 }
    );

  const totalPotencialRecuperavel = Number(
    (cobrancaReceber.valorTotal + fechamentoOrcamento.valorTotal + retornoPreventivo.valorTotal).toFixed(2)
  );

  return {
    isCritical,
    currentRevenue: Number(currentRevenue.toFixed(2)),
    targetRevenue: safeTarget,
    thresholdValue,
    deficitToThreshold,
    deficitToTarget,
    percentualAtual,
    totalPotencialRecuperavel,
    sugestoes: suggestions,
    resumoPorTipo: {
      cobrancaReceber: { count: cobrancaReceber.count, valorTotal: Number(cobrancaReceber.valorTotal.toFixed(2)) },
      fechamentoOrcamento: { count: fechamentoOrcamento.count, valorTotal: Number(fechamentoOrcamento.valorTotal.toFixed(2)) },
      retornoPreventivo: { count: retornoPreventivo.count, valorTotal: Number(retornoPreventivo.valorTotal.toFixed(2)) },
    },
  };
}

