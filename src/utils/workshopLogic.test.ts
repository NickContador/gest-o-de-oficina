import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOSTotals,
  maskSensitiveData,
  validateRLSAccess,
  formatCurrencyBRL,
  verifyDeployChecklistCompletion,
  generateLiveReadmeMarkdown,
  generateWhatsAppMessageForOS,
  calculateKanbanColumnTotals,
  canTransitionOSStatus,
  calculateMonthlyFinancialData,
  checkProfitTargetAlert,
  calculateMoMGrowth,
  checkPartsExpenseLimit,
  checkCriticalRevenueAlert,
  getAccountsReceivableMetrics,
  generateWhatsAppBillingReminderMessage,
  calculateOSProfitMargin,
  calculateRevenueVsTargetEvolution,
  calculate12MonthsTrendSummary,
  calculateDashboardMetrics,
  serializeDatabaseBackup,
  validateDatabaseBackup,
  generateWhatsAppEstimateClosingMessage,
  generateWhatsAppPreventiveRecallMessage,
  generateCustomerRecoveryPlan,
  generateClickableWhatsAppReminderLink,
  calculate6MonthGrowthMetrics,
  DeployStepItem,
  OrdemServico,
} from './workshopLogic.ts';



test('calculateOSTotals computes sum of parts and labor and applies discount correctly', () => {
  const result = calculateOSTotals(350.5, 200, 50);
  assert.equal(result.subtotal, 550.5);
  assert.equal(result.desconto, 50);
  assert.equal(result.total, 500.5);
});

test('calculateOSTotals handles negative values and NaN gracefully without crashing', () => {
  const result = calculateOSTotals(-100, 150, 200);
  assert.equal(result.subtotal, 150);
  assert.equal(result.desconto, 200);
  assert.equal(result.total, 0); // Cannot be negative total
});

test('maskSensitiveData correctly masks CPF according to security rules', () => {
  const maskedCpf = maskSensitiveData('123.456.789-00', 'cpf');
  assert.equal(maskedCpf, '***.456.789-**');
});

test('maskSensitiveData correctly masks phone numbers', () => {
  const maskedPhone = maskSensitiveData('(11) 98765-4321', 'telefone');
  assert.equal(maskedPhone, '(11) *****-4321');
});

test('validateRLSAccess strictly blocks anon and authenticated users from private schema', () => {
  const anonPrivate = validateRLSAccess('anon', 'private', 'SELECT', false);
  assert.equal(anonPrivate.allowed, false);

  const authPrivate = validateRLSAccess('authenticated', 'private', 'SELECT', true);
  assert.equal(authPrivate.allowed, false);

  const serviceRolePrivate = validateRLSAccess('service_role', 'private', 'SELECT', false);
  assert.equal(serviceRolePrivate.allowed, true);
});

test('validateRLSAccess enforces ownership check on public schema for authenticated users', () => {
  const ownerAccess = validateRLSAccess('authenticated', 'public', 'SELECT', true);
  assert.equal(ownerAccess.allowed, true);

  const strangerAccess = validateRLSAccess('authenticated', 'public', 'SELECT', false);
  assert.equal(strangerAccess.allowed, false);
});

test('verifyDeployChecklistCompletion identifies unfulfilled mandatory items', () => {
  const items: DeployStepItem[] = [
    { id: '1', title: 'Executar 01-schemas-e-acessos.sql', mandatory: true, done: true },
    { id: '2', title: 'Ativar RLS em todas as tabelas', mandatory: true, done: false },
    { id: '3', title: 'Subir logo personalizado', mandatory: false, done: false },
  ];

  const status = verifyDeployChecklistCompletion(items);
  assert.equal(status.readyForProduction, false);
  assert.equal(status.completionPercentage, 33);
  assert.deepEqual(status.pendingMandatory, ['Ativar RLS em todas as tabelas']);
});

test('verifyDeployChecklistCompletion passes when all mandatory items are done', () => {
  const items: DeployStepItem[] = [
    { id: '1', title: 'Executar 01-schemas-e-acessos.sql', mandatory: true, done: true },
    { id: '2', title: 'Ativar RLS em todas as tabelas', mandatory: true, done: true },
    { id: '3', title: 'Subir logo opcional', mandatory: false, done: false },
  ];

  const status = verifyDeployChecklistCompletion(items);
  assert.equal(status.readyForProduction, true);
  assert.equal(status.completionPercentage, 67);
  assert.equal(status.pendingMandatory.length, 0);
});

test('generateLiveReadmeMarkdown injects dynamic metrics, checklist and SQL scripts', () => {
  const items: DeployStepItem[] = [
    { id: '1', title: 'Executar 01-schemas-e-acessos.sql', mandatory: true, done: true },
    { id: '2', title: 'Deploy Edge Functions', mandatory: true, done: false },
  ];

  const readme = generateLiveReadmeMarkdown({
    totalOS: 5,
    openOS: 2,
    inProgressOS: 1,
    completedOS: 2,
    totalClients: 4,
    totalVehicles: 4,
    totalRevenue: 4500,
    checklist: items,
    lastUpdated: '2026-10-29T16:00:00Z',
  });

  assert.ok(readme.includes('MinhaOficina Pro'));
  assert.ok(readme.includes('2026-10-29T16:00:00Z'));
  assert.ok(readme.includes('5'));
  assert.ok(readme.includes('01-schemas-e-acessos.sql'));
  assert.ok(readme.includes('04-seguranca-rls.sql'));
  assert.ok(readme.includes('DEPLOY EM ANDAMENTO'));
});

test('generateWhatsAppMessageForOS crafts properly formatted message for WhatsApp dispatch', () => {
  const msg = generateWhatsAppMessageForOS({
    osNumber: 1045,
    clientName: 'Mariana Alencar',
    vehicleModel: 'Honda Civic Touring',
    vehiclePlate: 'FGH9A88',
    status: 'concluido',
    totalValue: 1550,
    problemDesc: 'Troca de pastilhas e revisão de freios',
  });

  assert.ok(msg.includes('AUTO MECÂNICA CENTRAL'));
  assert.ok(msg.includes('Mariana Alencar'));
  assert.ok(msg.includes('#1045'));
  assert.ok(msg.includes('FGH9A88'));
  assert.ok(msg.includes('Pronto para Retirada'));
  assert.ok(msg.includes('R$'));
  assert.ok(msg.includes('90 dias'));
});

test('calculateKanbanColumnTotals calculates count and financial sum correctly', () => {
  const sampleOS = [
    { status: 'aberto', valor_total: 500 },
    { status: 'aberto', valor_total: 350 },
    { status: 'concluido', valor_total: 1200 },
  ];

  const abertoTotals = calculateKanbanColumnTotals(sampleOS, 'aberto');
  assert.equal(abertoTotals.count, 2);
  assert.equal(abertoTotals.totalValue, 850);

  const concluidoTotals = calculateKanbanColumnTotals(sampleOS, 'concluido');
  assert.equal(concluidoTotals.count, 1);
  assert.equal(concluidoTotals.totalValue, 1200);

  const emAndamentoTotals = calculateKanbanColumnTotals(sampleOS, 'em_andamento');
  assert.equal(emAndamentoTotals.count, 0);
  assert.equal(emAndamentoTotals.totalValue, 0);
});

test('canTransitionOSStatus validates allowed status changes', () => {
  assert.equal(canTransitionOSStatus('aberto', 'em_andamento'), true);
  assert.equal(canTransitionOSStatus('em_andamento', 'concluido'), true);
  assert.equal(canTransitionOSStatus('concluido', 'entregue'), true);
  assert.equal(canTransitionOSStatus('concluido', 'concluido'), true);
});

test('calculateMonthlyFinancialData aggregates monthly financial stats and supports periods', () => {
  const ordens = [
    { status: 'concluido', valor_total: 1350, pecas_valor: 890, mao_de_obra_valor: 500 },
  ];

  const data6m = calculateMonthlyFinancialData(ordens, '6meses');
  assert.equal(data6m.length, 6);
  assert.equal(data6m[data6m.length - 1].mes, 'Out/26');
  assert.ok(data6m[data6m.length - 1].receitaBruta >= 18500 + 1350);
  assert.ok(data6m[data6m.length - 1].lucroLiquido > 0);

  const dataTrimestre = calculateMonthlyFinancialData(ordens, 'trimestre');
  assert.equal(dataTrimestre.length, 3);

  const data12m = calculateMonthlyFinancialData(ordens, '12meses');
  assert.equal(data12m.length, 12);
});

test('checkProfitTargetAlert triggers deficit warning and recommendation when profit is below target', () => {
  const alert = checkProfitTargetAlert(9500, 12000);
  assert.equal(alert.isBelow, true);
  assert.equal(alert.deficit, 2500);
  assert.equal(alert.percentage, 79);
  assert.equal(alert.status, 'abaixo');
  assert.equal(alert.severity, 'warning');
  assert.ok(alert.message.includes('2.500'));
  assert.ok(alert.recommendation.length > 10);
});

test('checkProfitTargetAlert triggers severe danger when profit drops below 75% of target', () => {
  const alert = checkProfitTargetAlert(6000, 12000);
  assert.equal(alert.isBelow, true);
  assert.equal(alert.deficit, 6000);
  assert.equal(alert.percentage, 50);
  assert.equal(alert.severity, 'danger');
});

test('checkProfitTargetAlert confirms goal exceeded when profit surpasses target', () => {
  const alert = checkProfitTargetAlert(14000, 12000);
  assert.equal(alert.isBelow, false);
  assert.equal(alert.deficit, 0);
  assert.equal(alert.percentage, 117);
  assert.equal(alert.status, 'superada');
  assert.equal(alert.severity, 'success');
  assert.ok(alert.message.includes('Parabéns'));
});

test('calculateMoMGrowth computes positive growth percentage and nominal diff correctly', () => {
  const growth = calculateMoMGrowth(22000, 20000);
  assert.equal(growth.percentage, 10);
  assert.equal(growth.diff, 2000);
  assert.equal(growth.isPositive, true);
});

test('calculateMoMGrowth computes negative growth percentage with drop', () => {
  const growth = calculateMoMGrowth(18000, 20000);
  assert.equal(growth.percentage, -10);
  assert.equal(growth.diff, -2000);
  assert.equal(growth.isPositive, false);
});

test('checkPartsExpenseLimit identifies budget overrun when parts exceed ceiling', () => {
  const result = checkPartsExpenseLimit(9500, 8000);
  assert.equal(result.isExceeded, true);
  assert.equal(result.excess, 1500);
  assert.equal(result.percentage, 119);
  assert.ok(result.message.includes('ultrapassaram'));
});

test('checkPartsExpenseLimit passes when parts expense is within budget', () => {
  const result = checkPartsExpenseLimit(6400, 8000);
  assert.equal(result.isExceeded, false);
  assert.equal(result.excess, 0);
  assert.equal(result.percentage, 80);
  assert.ok(result.message.includes('sob controle'));
});

test('checkCriticalRevenueAlert flags critical condition when revenue is below 20% of target', () => {
  const mockOrders = [
    { id: '1', numero_os: 1, cliente_id: 'c1', veiculo_id: 'v1', status: 'em_andamento' as const, descricao_problema: 'Revisão', valor_total: 1800, data_entrada: '2026-10-20' },
    { id: '2', numero_os: 2, cliente_id: 'c2', veiculo_id: 'v2', status: 'concluido' as const, descricao_problema: 'Pastilhas', valor_total: 1350, data_entrada: '2026-10-21', status_pagamento: 'pendente' as const },
  ];

  // 1350 completed revenue vs 25000 target (5.4% < 20%)
  const alert = checkCriticalRevenueAlert(1350, 25000, mockOrders);
  assert.equal(alert.isCritical, true);
  assert.equal(alert.status, 'critico');
  assert.equal(alert.severity, 'danger');
  assert.equal(alert.thresholdValue, 5000);
  assert.equal(alert.deficitToThreshold, 3650);
  assert.equal(alert.percentage, 5.4);
  assert.equal(alert.unpaidCompletedCount, 1);
  assert.equal(alert.unpaidCompletedRevenue, 1350);
  assert.equal(alert.pipelineOrdersCount, 1);
  assert.equal(alert.pipelinePotentialRevenue, 1800);
  assert.ok(alert.message.includes('ALERTA CRÍTICO'));
});

test('checkCriticalRevenueAlert passes when revenue is at or above 20% threshold', () => {
  const alert = checkCriticalRevenueAlert(6500, 25000);
  assert.equal(alert.isCritical, false);
  assert.equal(alert.percentage, 26);
  assert.equal(alert.deficitToThreshold, 0);
  assert.equal(alert.status, 'atencao');
});

test('getAccountsReceivableMetrics separates unpaid completed orders into overdue and pending', () => {
  const orders: OrdemServico[] = [
    {
      id: 'os-1',
      numero_os: 1041,
      cliente_id: 'cli-1',
      veiculo_id: 'veic-1',
      status: 'concluido',
      descricao_problema: 'Freios',
      valor_total: 1350,
      data_entrada: '2026-10-20',
      status_pagamento: 'pendente',
    },
    {
      id: 'os-2',
      numero_os: 1040,
      cliente_id: 'cli-2',
      veiculo_id: 'veic-2',
      status: 'concluido',
      descricao_problema: 'Cabeçote',
      valor_total: 2180,
      data_entrada: '2026-10-18',
      status_pagamento: 'vencido',
    },
    {
      id: 'os-3',
      numero_os: 1039,
      cliente_id: 'cli-3',
      veiculo_id: 'veic-3',
      status: 'entregue',
      descricao_problema: 'Óleo',
      valor_total: 620,
      data_entrada: '2026-10-15',
      status_pagamento: 'pago',
    },
    {
      id: 'os-4',
      numero_os: 1042,
      cliente_id: 'cli-4',
      veiculo_id: 'veic-4',
      status: 'em_andamento',
      descricao_problema: 'Suspensão',
      valor_total: 800,
      data_entrada: '2026-10-24',
    },
  ];

  const metrics = getAccountsReceivableMetrics(orders);
  assert.equal(metrics.receivableOrders.length, 2);
  assert.equal(metrics.paidOrders.length, 1);
  assert.equal(metrics.totalReceivable, 3530);
  assert.equal(metrics.totalPaid, 620);
  assert.equal(metrics.overdueCount, 1);
  assert.equal(metrics.overdueTotal, 2180);
  assert.equal(metrics.pendingCount, 1);
  assert.equal(metrics.pendingTotal, 1350);
});

test('generateWhatsAppBillingReminderMessage crafts professional collection notice with Pix key', () => {
  const reminder = generateWhatsAppBillingReminderMessage({
    clientName: 'Beatriz Vasconcelos',
    osNumber: 1041,
    vehicleModel: 'Onix Plus Premier',
    vehiclePlate: 'CHV3B12',
    totalValue: 1350,
    completionDate: '2026-10-24T17:30:00Z',
  });

  assert.ok(reminder.includes('LEMBRETE DE FATURAMENTO'));
  assert.ok(reminder.includes('Beatriz Vasconcelos'));
  assert.ok(reminder.includes('#1041'));
  assert.ok(reminder.includes('CHV3B12'));
  assert.ok(reminder.includes('R$'));
  assert.ok(reminder.includes('14.882.901/0001-44'));
  assert.ok(reminder.includes('Pix'));
});

test('calculateOSProfitMargin subtracts parts and labor costs from total amount paid and computes margin %', () => {
  const os: OrdemServico = {
    id: 'os-test-1',
    numero_os: 1042,
    cliente_id: 'c1',
    veiculo_id: 'v1',
    status: 'concluido',
    descricao_problema: 'Freios e pastilhas',
    valor_total: 800,
    pecas_valor: 480,
    pecas_custo: 280,
    mao_de_obra_valor: 350,
    mao_de_obra_custo: 150,
    data_entrada: '2026-10-24',
  };

  const result = calculateOSProfitMargin(os, 'Carlos Mendes', 'Civic EXL');
  assert.equal(result.valorTotal, 800);
  assert.equal(result.custoPecas, 280);
  assert.equal(result.custoMaoDeObra, 150);
  assert.equal(result.custoTotal, 430);
  assert.equal(result.lucroLiquido, 370); // 800 - 430 = 370
  assert.equal(result.margemLucroPercentual, 46.3); // (370 / 800) * 100 = 46.25 -> 46.3%
  assert.equal(result.clienteNome, 'Carlos Mendes');
  assert.equal(result.veiculoDesc, 'Civic EXL');
});

test('calculateRevenueVsTargetEvolution compares realized revenue with target and identifies surplus or deficit', () => {
  const monthlyData = [
    { mes: 'Set/26', mesCompleto: 'Setembro 2026', receitaBruta: 22900, custoPecas: 9200, maoDeObra: 13700, lucroLiquido: 13700, margem: 60, ordensCount: 21 },
    { mes: 'Out/26', mesCompleto: 'Outubro 2026', receitaBruta: 26500, custoPecas: 9500, maoDeObra: 17000, lucroLiquido: 17000, margem: 64, ordensCount: 24 },
  ];

  const evolution = calculateRevenueVsTargetEvolution(monthlyData, 25000);
  assert.equal(evolution.length, 2);

  // Set/26: 22900 vs 25000 (-2100, 91.6%, meta não atingida)
  assert.equal(evolution[0].faturamentoRealizado, 22900);
  assert.equal(evolution[0].metaEstipulada, 25000);
  assert.equal(evolution[0].metaAtingida, false);
  assert.equal(evolution[0].superavitDeficit, -2100);
  assert.equal(evolution[0].atingimentoPercentual, 91.6);

  // Out/26: 26500 vs 25000 (+1500, 106.0%, meta atingida)
  assert.equal(evolution[1].faturamentoRealizado, 26500);
  assert.equal(evolution[1].metaAtingida, true);
  assert.equal(evolution[1].superavitDeficit, 1500);
  assert.equal(evolution[1].atingimentoPercentual, 106.0);
});

test('calculate12MonthsTrendSummary computes 3-month moving average, peak and trough months, and momentum', () => {
  const dummyOrdens: OrdemServico[] = [];
  const monthlyData = calculateMonthlyFinancialData(dummyOrdens, '12meses');
  const summary = calculate12MonthsTrendSummary(monthlyData);

  assert.equal(summary.points.length, 12);
  assert.ok(summary.totalFaturadoAno > 0);
  assert.ok(summary.totalLucroAno > 0);
  assert.ok(summary.mediaMensalReceita > 0);

  // Peak month is Agosto 2026 (Ago/26 = 23800 in base)
  assert.equal(summary.melhorMes.mes, 'Ago/26');
  assert.equal(summary.melhorMes.receita, 23800);

  // Trough month is Janeiro 2026 (Jan/26 = 14200 in base)
  assert.equal(summary.menorMes.mes, 'Jan/26');
  assert.equal(summary.menorMes.receita, 14200);

  // Check that 3-month moving average is computed
  const nov = summary.points[0]; // Nov/25: window [15400] -> 15400
  assert.equal(nov.mediaMovel3M, 15400);

  const dez = summary.points[1]; // Dez/25: window [15400, 19800] -> 17600
  assert.equal(dez.mediaMovel3M, 17600);

  const jan = summary.points[2]; // Jan/26: window [15400, 19800, 14200] -> 16466.67
  assert.equal(jan.mediaMovel3M, 16466.67);
});

test('calculateDashboardMetrics computes revenue vs target, average ticket, and most frequent services', () => {
  const sampleOrders: OrdemServico[] = [
    {
      id: 'os-1',
      numero_os: 101,
      cliente_id: 'c1',
      veiculo_id: 'v1',
      status: 'concluido',
      descricao_problema: 'Revisão de freio e pastilhas dianteiras',
      valor_total: 600,
      pecas_valor: 350,
      mao_de_obra_valor: 250,
      data_entrada: '2026-10-01',
    },
    {
      id: 'os-2',
      numero_os: 102,
      cliente_id: 'c2',
      veiculo_id: 'v2',
      status: 'concluido',
      descricao_problema: 'Troca de óleo sintético e filtro de óleo',
      valor_total: 400,
      pecas_valor: 250,
      mao_de_obra_valor: 150,
      data_entrada: '2026-10-02',
    },
    {
      id: 'os-3',
      numero_os: 103,
      cliente_id: 'c3',
      veiculo_id: 'v3',
      status: 'em_andamento',
      descricao_problema: 'Troca de pastilhas de freio traseiras',
      valor_total: 500,
      pecas_valor: 300,
      mao_de_obra_valor: 200,
      data_entrada: '2026-10-03',
    },
  ];

  const report = calculateDashboardMetrics(sampleOrders, 1000);

  // Completed revenue: 600 + 400 = 1000. Target: 1000 -> 100%
  assert.equal(report.totalRevenue, 1000);
  assert.equal(report.targetRevenue, 1000);
  assert.equal(report.revenueAchievementRate, 100);
  assert.equal(report.isTargetAchieved, true);

  // Average Ticket for completed orders: 1000 / 2 = 500
  assert.equal(report.averageTicketPrice, 500);
  assert.equal(report.averagePartsTicket, 300); // (350 + 250) / 2 = 300
  assert.equal(report.averageLaborTicket, 200); // (250 + 150) / 2 = 200

  // Most frequent services: 'Revisão de Freios & Pastilhas' (2 occurrences)
  const brakeService = report.mostFrequentServices.find(
    (s) => s.categoria === 'Revisão de Freios & Pastilhas'
  );
  assert.ok(brakeService);
  assert.equal(brakeService.contagem, 2);
  assert.equal(brakeService.receitaTotal, 1100); // 600 + 500
});

test('serializeDatabaseBackup and validateDatabaseBackup create and verify valid database payload', () => {
  const dummyOS: OrdemServico[] = [
    {
      id: 'os-1',
      numero_os: 101,
      cliente_id: 'c1',
      veiculo_id: 'v1',
      status: 'concluido',
      descricao_problema: 'Manutenção',
      valor_total: 500,
      data_entrada: '2026-10-01',
    },
  ];
  const dummyCli = [{ id: 'c1', usuario_id: 'u1', nome_completo: 'João Silva', created_at: '2026-01-01' }];
  const dummyVeic = [{ id: 'v1', usuario_id: 'u1', cliente_id: 'c1', marca: 'VW', modelo: 'Gol', ano: '2022', placa: 'ABC1D23', cor: 'Prata', created_at: '2026-01-01' }];

  const backup = serializeDatabaseBackup(dummyOS, dummyCli, dummyVeic, undefined, 'google_drive');
  assert.equal(backup.appName, 'MinhaOficina Pro ERP');
  assert.equal(backup.source, 'google_drive');

  const validation = validateDatabaseBackup(backup);
  assert.equal(validation.valid, true);
  assert.equal(validation.counts?.ordens, 1);
  assert.equal(validation.counts?.clientes, 1);
  assert.equal(validation.counts?.veiculos, 1);

  // Invalid payload test
  const invalidValidation = validateDatabaseBackup({ tables: { ordens: 'not an array' } });
  assert.equal(invalidValidation.valid, false);
});

test('generateWhatsAppEstimateClosingMessage creates persuasive text with discount and warranty', () => {
  const msg = generateWhatsAppEstimateClosingMessage({
    clientName: 'Carlos Silva',
    osNumber: 1045,
    vehicleModel: 'Honda Civic',
    vehiclePlate: 'BRA2E19',
    totalValue: 1000,
    discountPercent: 5,
  });

  assert.ok(msg.includes('Carlos Silva'));
  assert.ok(msg.includes('#1045'));
  assert.ok(msg.includes('Honda Civic'));
  assert.ok(msg.includes('5% de desconto à vista via Pix'));
  assert.ok(msg.includes('R$ 950,00') || msg.includes('950'));
});

test('generateWhatsAppPreventiveRecallMessage generates preventive checkup invitation', () => {
  const msg = generateWhatsAppPreventiveRecallMessage({
    clientName: 'Ana Souza',
    vehicleModel: 'Toyota Corolla',
    vehiclePlate: 'XYZ9876',
    estimatedPrice: 350,
  });

  assert.ok(msg.includes('Ana Souza'));
  assert.ok(msg.includes('Toyota Corolla'));
  assert.ok(msg.includes('Check-up gratuito de 30 itens'));
});

test('generateCustomerRecoveryPlan accurately flags critical revenue below 20% and maps opportunities', () => {
  const dummyOS: OrdemServico[] = [
    {
      id: 'os-1',
      numero_os: 101,
      cliente_id: 'c1',
      veiculo_id: 'v1',
      status: 'concluido',
      status_pagamento: 'pendente',
      descricao_problema: 'Freios',
      valor_total: 1500,
      data_entrada: '2026-10-01',
    },
    {
      id: 'os-2',
      numero_os: 102,
      cliente_id: 'c2',
      veiculo_id: 'v2',
      status: 'aberto',
      status_pagamento: 'pendente',
      descricao_problema: 'Revisão Motor',
      valor_total: 2000,
      data_entrada: '2026-10-05',
    },
  ];

  const dummyCli = [
    { id: 'c1', usuario_id: 'u1', nome_completo: 'Mariana Silva', dados_privados: { telefone: '(11) 99999-1111' }, created_at: '2026-01-01' },
    { id: 'c2', usuario_id: 'u1', nome_completo: 'Roberto Santos', dados_privados: { telefone: '(11) 99999-2222' }, created_at: '2026-01-01' },
    { id: 'c3', usuario_id: 'u1', nome_completo: 'Fernanda Lima', dados_privados: { telefone: '(11) 99999-3333' }, created_at: '2026-01-01' },
  ];

  const dummyVeic = [
    { id: 'v1', usuario_id: 'u1', cliente_id: 'c1', marca: 'Jeep', modelo: 'Renegade', ano: '2021', placa: 'JEP1000', cor: 'Preto', created_at: '2026-01-01' },
    { id: 'v2', usuario_id: 'u1', cliente_id: 'c2', marca: 'Ford', modelo: 'Ka', ano: '2020', placa: 'FOR2000', cor: 'Branco', created_at: '2026-01-01' },
    { id: 'v3', usuario_id: 'u1', cliente_id: 'c3', marca: 'VW', modelo: 'Nivus', ano: '2023', placa: 'NIV3000', cor: 'Cinza', created_at: '2026-01-01' },
  ];

  // Target 25.000 -> 20% floor is 5.000. Realized is 1.500 (from os-1 concluido).
  // 1.500 < 5.000 -> should be critical
  const plan = generateCustomerRecoveryPlan(dummyOS, dummyCli, dummyVeic, 25000);

  assert.equal(plan.isCritical, true);
  assert.equal(plan.currentRevenue, 1500);
  assert.equal(plan.thresholdValue, 5000);
  assert.equal(plan.deficitToThreshold, 3500);
  assert.equal(plan.percentualAtual, 6);

  // Check categories
  assert.ok(plan.resumoPorTipo.cobrancaReceber.count >= 1);
  assert.equal(plan.resumoPorTipo.cobrancaReceber.valorTotal, 1500);

  assert.ok(plan.resumoPorTipo.fechamentoOrcamento.count >= 1);
  assert.equal(plan.resumoPorTipo.fechamentoOrcamento.valorTotal, 1900); // 2000 * 0.95

  assert.ok(plan.resumoPorTipo.retornoPreventivo.count >= 1);
  assert.ok(plan.totalPotencialRecuperavel > 3500);
});

test('generateClickableWhatsAppReminderLink generates valid WhatsApp URL targeting client phone for pending OS', () => {
  const dummyOS: OrdemServico = {
    id: 'os-p1',
    numero_os: 2040,
    cliente_id: 'c-test',
    veiculo_id: 'v-test',
    status: 'concluido',
    status_pagamento: 'pendente',
    descricao_problema: 'Troca de pastilhas',
    valor_total: 650,
    data_entrada: '2026-10-10',
    data_vencimento: '2026-10-25',
  };

  const dummyCli = {
    id: 'c-test',
    nome_completo: 'Felipe Alencar',
    dados_privados: { telefone: '(11) 97766-5544' },
  };

  const dummyVeic = {
    id: 'v-test',
    cliente_id: 'c-test',
    marca: 'Hyundai',
    modelo: 'HB20',
    placa: 'HYU2020',
  };

  const reminder = generateClickableWhatsAppReminderLink(dummyOS, dummyCli, dummyVeic);

  assert.equal(reminder.isOverdue, false);
  assert.equal(reminder.statusPagamento, 'pendente');
  assert.equal(reminder.cleanPhone, '11977665544');
  assert.ok(reminder.url.startsWith('https://wa.me/5511977665544?text='));
  assert.ok(reminder.messageText.includes('Felipe Alencar'));
  assert.ok(reminder.messageText.includes('#2040'));
  assert.ok(reminder.messageText.includes('HB20'));
  assert.ok(reminder.messageText.includes('R$ 650,00') || reminder.messageText.includes('650'));
});

test('generateClickableWhatsAppReminderLink formats overdue warning when payment is vencido', () => {
  const dummyOS: OrdemServico = {
    id: 'os-v1',
    numero_os: 2041,
    cliente_id: 'c-test',
    veiculo_id: 'v-test',
    status: 'concluido',
    status_pagamento: 'vencido',
    descricao_problema: 'Embreagem',
    valor_total: 1200,
    data_entrada: '2026-09-01',
    data_vencimento: '2026-09-15',
  };

  const dummyCli = {
    id: 'c-test',
    nome_completo: 'Luciana Ramos',
    dados_privados: { telefone: '(11) 98888-7777' },
  };

  const reminder = generateClickableWhatsAppReminderLink(dummyOS, dummyCli);

  assert.equal(reminder.isOverdue, true);
  assert.equal(reminder.statusPagamento, 'vencido');
  assert.ok(reminder.messageText.includes('AVISO DE FATURA VENCIDA'));
  assert.ok(reminder.messageText.includes('em atraso'));
  assert.ok(reminder.messageText.includes('Chave Pix'));
});

test('calculate6MonthGrowthMetrics returns exactly 6 monthly records with seasonal peak and growth rate', () => {
  const dummyOS: OrdemServico[] = [
    {
      id: 'os-oct',
      numero_os: 3001,
      cliente_id: 'c1',
      veiculo_id: 'v1',
      status: 'concluido',
      descricao_problema: 'Revisão periódica',
      valor_total: 2000,
      pecas_valor: 800,
      mao_de_obra_valor: 1200,
      data_entrada: '2026-10-15',
    },
  ];

  const metrics = calculate6MonthGrowthMetrics(dummyOS);

  assert.equal(metrics.records.length, 6);
  assert.ok(metrics.totalRevenue6M > 0);
  assert.ok(metrics.averageMonthlyRevenue > 0);
  assert.ok(metrics.peakMonth.receita > 0);
  assert.ok(metrics.troughMonth.receita > 0);
  assert.ok(typeof metrics.netGrowth6MPercent === 'number');
  assert.ok(metrics.seasonalityInsight.length > 10);
});





