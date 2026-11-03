import { OrdemServico, Cliente, Veiculo } from '../data/mockData.ts';

/**
 * Escapes a cell value for standard RFC 4180 CSV
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(';') || str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers a browser download of a CSV file with UTF-8 BOM for Microsoft Excel / Sheets compatibility
 */
function downloadCSV(csvContent: string, filename: string): void {
  // \uFEFF is the UTF-8 Byte Order Mark to ensure Excel interprets accents correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all Work Orders (Ordens de Serviço) to CSV
 */
export function exportOrdersToCSV(
  ordens: OrdemServico[],
  clientes: Cliente[],
  veiculos: Veiculo[]
): void {
  const headers = [
    'Numero_OS',
    'Data_Entrada',
    'Data_Saida',
    'Cliente',
    'Telefone_Cliente',
    'Veiculo_Marca',
    'Veiculo_Modelo',
    'Veiculo_Placa',
    'Status_Operacional',
    'Status_Pagamento',
    'Forma_Pagamento',
    'Pecas_Valor_R$',
    'Mao_de_Obra_Valor_R$',
    'Desconto_R$',
    'Valor_Total_R$',
    'Custo_Pecas_R$',
    'Custo_Mao_de_Obra_R$',
    'Tecnico_Responsavel',
    'Descricao_Problema',
  ];

  const rows = ordens.map((os) => {
    const client = clientes.find((c) => c.id === os.cliente_id);
    const vehicle = veiculos.find((v) => v.id === os.veiculo_id);
    const phone = client?.dados_privados?.telefone || '(11) 98765-4321';

    return [
      os.numero_os,
      os.data_entrada,
      os.data_saida || '',
      client?.nome_completo || 'Cliente',
      phone,
      vehicle?.marca || '',
      vehicle?.modelo || '',
      vehicle?.placa || '',
      os.status,
      os.status_pagamento || 'pendente',
      os.forma_pagamento || '',
      (os.pecas_valor || 0).toFixed(2),
      (os.mao_de_obra_valor || 0).toFixed(2),
      (os.desconto_valor || 0).toFixed(2),
      (os.valor_total || 0).toFixed(2),
      (os.pecas_custo !== undefined ? os.pecas_custo : (os.pecas_valor || 0) * 0.6).toFixed(2),
      (os.mao_de_obra_custo !== undefined ? os.mao_de_obra_custo : (os.mao_de_obra_valor || 0) * 0.45).toFixed(2),
      os.tecnico_responsavel || 'Equipe Geral',
      os.descricao_problema,
    ].map(escapeCSV).join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `Ordens_de_Servico_Oficina_${dateStr}.csv`);
}

/**
 * Exports Clients registry to CSV
 */
export function exportClientsToCSV(
  clientes: Cliente[],
  veiculos: Veiculo[],
  ordens: OrdemServico[]
): void {
  const headers = [
    'ID_Cliente',
    'Nome_Completo',
    'Nome_Fantasia',
    'Data_Cadastro',
    'CPF',
    'RG',
    'Telefone',
    'Endereco',
    'Bairro',
    'Cidade',
    'UF',
    'CEP',
    'Qtd_Veiculos',
    'Qtd_Ordens_Servico',
    'Total_Gasto_R$',
  ];

  const rows = clientes.map((cli) => {
    const cliVehicles = veiculos.filter((v) => v.cliente_id === cli.id);
    const cliOrders = ordens.filter((o) => o.cliente_id === cli.id);
    const totalGasto = cliOrders.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
    const dados = cli.dados_privados;

    return [
      cli.id,
      cli.nome_completo,
      cli.nome_fantasia || '',
      cli.created_at,
      dados?.cpf || '',
      dados?.rg || '',
      dados?.telefone || '',
      dados ? `${dados.endereco_rua}, ${dados.endereco_numero}` : '',
      dados?.endereco_bairro || '',
      dados?.endereco_cidade || '',
      dados?.endereco_uf || '',
      dados?.endereco_cep || '',
      cliVehicles.length,
      cliOrders.length,
      totalGasto.toFixed(2),
    ].map(escapeCSV).join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `Clientes_Oficina_${dateStr}.csv`);
}

/**
 * Exports Vehicles fleet to CSV
 */
export function exportVehiclesToCSV(
  veiculos: Veiculo[],
  clientes: Cliente[],
  ordens: OrdemServico[]
): void {
  const headers = [
    'ID_Veiculo',
    'Placa',
    'Marca',
    'Modelo',
    'Ano',
    'Cor',
    'Proprietario',
    'Qtd_Ordens_Servico',
    'Total_Manutencao_R$',
    'Data_Cadastro',
  ];

  const rows = veiculos.map((v) => {
    const owner = clientes.find((c) => c.id === v.cliente_id);
    const vOrders = ordens.filter((o) => o.veiculo_id === v.id);
    const totalManutencao = vOrders.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);

    return [
      v.id,
      v.placa,
      v.marca,
      v.modelo,
      v.ano,
      v.cor,
      owner?.nome_completo || 'Cliente',
      vOrders.length,
      totalManutencao.toFixed(2),
      v.created_at,
    ].map(escapeCSV).join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `Veiculos_Oficina_${dateStr}.csv`);
}

/**
 * Exports a combined complete workshop master dataset to CSV
 */
export function exportAllWorkshopDataToCSV(
  ordens: OrdemServico[],
  clientes: Cliente[],
  veiculos: Veiculo[]
): void {
  exportOrdersToCSV(ordens, clientes, veiculos);
  setTimeout(() => exportClientsToCSV(clientes, veiculos, ordens), 300);
  setTimeout(() => exportVehiclesToCSV(veiculos, clientes, ordens), 600);
}
