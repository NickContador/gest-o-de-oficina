export interface Cliente {
  id: string;
  usuario_id: string;
  nome_completo: string;
  nome_fantasia?: string;
  created_at: string;
  // Private sensitive data (only accessible via simulated Edge Function)
  dados_privados?: {
    cpf: string;
    rg: string;
    telefone: string;
    endereco_rua: string;
    endereco_numero: string;
    endereco_bairro: string;
    endereco_cidade: string;
    endereco_uf: string;
    endereco_cep: string;
  };
}

export interface Veiculo {
  id: string;
  usuario_id: string;
  cliente_id: string;
  marca: string;
  modelo: string;
  ano: string;
  placa: string;
  cor: string;
  created_at: string;
}

export interface OrdemServico {
  id: string;
  usuario_id: string;
  cliente_id: string;
  veiculo_id: string;
  numero_os: number;
  status: 'aberto' | 'em_andamento' | 'aguardando_pecas' | 'concluido' | 'entregue';
  descricao_problema: string;
  pecas_valor: number;
  mao_de_obra_valor: number;
  pecas_custo?: number;
  mao_de_obra_custo?: number;
  desconto_valor: number;
  valor_total: number;
  data_entrada: string;
  data_saida?: string | null;
  tecnico_responsavel?: string;
  status_pagamento?: 'pago' | 'pendente' | 'vencido';
  data_vencimento?: string | null;
  forma_pagamento?: string;
}

export interface Notificacao {
  id: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  tipo: 'sistema' | 'os' | 'alerta' | 'aviso';
  referencia_id?: string;
  created_at: string;
}

export const CURRENT_USER_ID = 'usr-oficina-7729-uuid';

export const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli-001',
    usuario_id: CURRENT_USER_ID,
    nome_completo: 'Carlos Eduardo Mendes',
    nome_fantasia: 'Transportes Mendes ME',
    created_at: '2026-10-15T09:30:00Z',
    dados_privados: {
      cpf: '284.918.472-09',
      rg: 'MG-14.882.109',
      telefone: '(11) 98844-1234',
      endereco_rua: 'Rua das Oficinas',
      endereco_numero: '450',
      endereco_bairro: 'Mooca',
      endereco_cidade: 'São Paulo',
      endereco_uf: 'SP',
      endereco_cep: '03102-000',
    },
  },
  {
    id: 'cli-002',
    usuario_id: CURRENT_USER_ID,
    nome_completo: 'Mariana Alencar Ribeiro',
    nome_fantasia: '',
    created_at: '2026-10-18T14:15:00Z',
    dados_privados: {
      cpf: '391.029.384-55',
      rg: 'SP-32.991.021',
      telefone: '(11) 97722-9988',
      endereco_rua: 'Avenida Santo Amaro',
      endereco_numero: '1280',
      endereco_bairro: 'Vila Nova Conceição',
      endereco_cidade: 'São Paulo',
      endereco_uf: 'SP',
      endereco_cep: '04505-001',
    },
  },
  {
    id: 'cli-003',
    usuario_id: CURRENT_USER_ID,
    nome_completo: 'Rodrigo Silveira Pinto',
    nome_fantasia: 'Auto Peças Rápido',
    created_at: '2026-10-20T11:00:00Z',
    dados_privados: {
      cpf: '119.827.443-12',
      rg: 'RJ-21.902.441',
      telefone: '(11) 99123-5566',
      endereco_rua: 'Rua Vergueiro',
      endereco_numero: '3100',
      endereco_bairro: 'Vila Mariana',
      endereco_cidade: 'São Paulo',
      endereco_uf: 'SP',
      endereco_cep: '04101-300',
    },
  },
  {
    id: 'cli-004',
    usuario_id: CURRENT_USER_ID,
    nome_completo: 'Beatriz Vasconcelos',
    nome_fantasia: '',
    created_at: '2026-10-22T16:45:00Z',
    dados_privados: {
      cpf: '542.819.330-91',
      rg: 'SP-44.120.301',
      telefone: '(11) 98321-4477',
      endereco_rua: 'Rua Teodoro Sampaio',
      endereco_numero: '890',
      endereco_bairro: 'Pinheiros',
      endereco_cidade: 'São Paulo',
      endereco_uf: 'SP',
      endereco_cep: '05406-000',
    },
  },
];

export const INITIAL_VEICULOS: Veiculo[] = [
  {
    id: 'veic-001',
    usuario_id: CURRENT_USER_ID,
    cliente_id: 'cli-001',
    marca: 'Volkswagen',
    modelo: 'Gol 1.6 MSI Flex',
    ano: '2021',
    placa: 'BRA2E19',
    cor: 'Prata Sirius',
    created_at: '2026-10-15T09:35:00Z',
  },
  {
    id: 'veic-002',
    usuario_id: CURRENT_USER_ID,
    cliente_id: 'cli-002',
    marca: 'Honda',
    modelo: 'Civic Touring 1.5 Turbo',
    ano: '2022',
    placa: 'FGH9A88',
    cor: 'Preto Cristal',
    created_at: '2026-10-18T14:20:00Z',
  },
  {
    id: 'veic-003',
    usuario_id: CURRENT_USER_ID,
    cliente_id: 'cli-003',
    marca: 'Toyota',
    modelo: 'Hilux SRV 2.8 4x4 Diesel',
    ano: '2023',
    placa: 'TRK4D90',
    cor: 'Branco Polar',
    created_at: '2026-10-20T11:05:00Z',
  },
  {
    id: 'veic-004',
    usuario_id: CURRENT_USER_ID,
    cliente_id: 'cli-004',
    marca: 'Chevrolet',
    modelo: 'Onix Plus Premier 1.0 Turbo',
    ano: '2022',
    placa: 'CHV3B12',
    cor: 'Azul Seeker',
    created_at: '2026-10-22T16:50:00Z',
  },
];

export const INITIAL_ORDENS: OrdemServico[] = [
  {
    id: 'os-001',
    usuario_id: CURRENT_USER_ID,
    cliente_id: 'cli-001',
    veiculo_id: 'veic-001',
    numero_os: 1042,
    status: 'em_andamento',
    descricao_problema: 'Barulho agudo ao frear, vibração no pedal e revisão geral dos 50.000 km.',
    pecas_valor: 480.0,
    pecas_custo: 280.0,
    mao_de_obra_valor: 350.0,
    mao_de_obra_custo: 150.0,
    desconto_valor: 30.0,
    valor_total: 800.0,
    data_entrada: '2026-10-24T08:30:00Z',
    data_saida: null,
    tecnico_responsavel: 'Marcos Silveira (Mecânico Chefe)',
  },
  {
    id: 'os-002',
    usuario_id: CURRENT_USER_ID,
    cliente_id: 'cli-002',
    veiculo_id: 'veic-002',
    numero_os: 1043,
    status: 'aguardando_pecas',
    descricao_problema: 'Luz de injeção eletrônica intermitente, falha na partida a frio e sensor de oxigênio primário.',
    pecas_valor: 1150.0,
    pecas_custo: 720.0,
    mao_de_obra_valor: 450.0,
    mao_de_obra_custo: 200.0,
    desconto_valor: 50.0,
    valor_total: 1550.0,
    data_entrada: '2026-10-25T10:15:00Z',
    data_saida: null,
    tecnico_responsavel: 'Rafael Santos (Eletricista)',
  },
  {
    id: 'os-003',
    usuario_id: CURRENT_USER_ID,
    cliente_id: 'cli-003',
    veiculo_id: 'veic-003',
    numero_os: 1044,
    status: 'aberto',
    descricao_problema: 'Troca de óleo sintético 5W30, filtro de óleo, filtro de combustível e alinhamento 3D.',
    pecas_valor: 620.0,
    pecas_custo: 380.0,
    mao_de_obra_valor: 220.0,
    mao_de_obra_custo: 90.0,
    desconto_valor: 0.0,
    valor_total: 840.0,
    data_entrada: '2026-10-26T08:00:00Z',
    data_saida: null,
    tecnico_responsavel: 'Lucas Prado (Trainee)',
  },
  {
    id: 'os-004',
    usuario_id: CURRENT_USER_ID,
    cliente_id: 'cli-004',
    veiculo_id: 'veic-004',
    numero_os: 1041,
    status: 'concluido',
    descricao_problema: 'Substituição das correias dentadas e bomba d\'água com sangria do líquido de arrefecimento.',
    pecas_valor: 890.0,
    pecas_custo: 510.0,
    mao_de_obra_valor: 500.0,
    mao_de_obra_custo: 220.0,
    desconto_valor: 40.0,
    valor_total: 1350.0,
    data_entrada: '2026-10-22T14:00:00Z',
    data_saida: '2026-10-24T17:30:00Z',
    data_vencimento: '2026-10-29T18:00:00Z',
    status_pagamento: 'pendente',
    tecnico_responsavel: 'Marcos Silveira (Mecânico Chefe)',
  },
  {
    id: 'os-005',
    usuario_id: CURRENT_USER_ID,
    cliente_id: 'cli-002',
    veiculo_id: 'veic-002',
    numero_os: 1040,
    status: 'concluido',
    descricao_problema: 'Retífica de cabeçote, troca de junta de vedação, plaina e parafusos de expansão.',
    pecas_valor: 1400.0,
    pecas_custo: 880.0,
    mao_de_obra_valor: 850.0,
    mao_de_obra_custo: 360.0,
    desconto_valor: 70.0,
    valor_total: 2180.0,
    data_entrada: '2026-10-18T10:00:00Z',
    data_saida: '2026-10-21T15:00:00Z',
    data_vencimento: '2026-10-25T18:00:00Z',
    status_pagamento: 'vencido',
    tecnico_responsavel: 'Rafael Santos (Eletricista & Motor)',
  },
  {
    id: 'os-006',
    usuario_id: CURRENT_USER_ID,
    cliente_id: 'cli-001',
    veiculo_id: 'veic-001',
    numero_os: 1039,
    status: 'entregue',
    descricao_problema: 'Troca de pastilhas dianteiras, fluido DOT 4 e regulagem do freio de estacionamento.',
    pecas_valor: 380.0,
    pecas_custo: 210.0,
    mao_de_obra_valor: 240.0,
    mao_de_obra_custo: 100.0,
    desconto_valor: 0.0,
    valor_total: 620.0,
    data_entrada: '2026-10-16T08:00:00Z',
    data_saida: '2026-10-17T17:00:00Z',
    data_vencimento: '2026-10-17T17:00:00Z',
    status_pagamento: 'pago',
    forma_pagamento: 'Pix',
    tecnico_responsavel: 'Marcos Silveira (Mecânico Chefe)',
  },
];

export const INITIAL_NOTIFICACOES: Notificacao[] = [
  {
    id: 'notif-1',
    usuario_id: CURRENT_USER_ID,
    titulo: 'Nova OS Aberta #1044',
    mensagem: 'Toyota Hilux placa TRK4D90 deu entrada para troca de óleo e alinhamento.',
    lida: false,
    tipo: 'os',
    referencia_id: 'os-003',
    created_at: '2026-10-26T08:02:00Z',
  },
  {
    id: 'notif-2',
    usuario_id: CURRENT_USER_ID,
    titulo: 'Alerta de Peças: OS #1043',
    mensagem: 'Sensor de oxigênio genuíno Honda encomendado junto à distribuidora com previsão de entrega hoje às 16h.',
    lida: false,
    tipo: 'alerta',
    referencia_id: 'os-002',
    created_at: '2026-10-25T11:45:00Z',
  },
  {
    id: 'notif-3',
    usuario_id: CURRENT_USER_ID,
    titulo: 'RLS e Schemas Seguros Ativos',
    mensagem: 'Políticas de Row Level Security verificadas. Nenhum dado privado exposto ao canal anônimo.',
    lida: true,
    tipo: 'sistema',
    created_at: '2026-10-25T07:00:00Z',
  },
];

export const INITIAL_CHECKLIST = [
  { id: 'sql-1', title: 'Executar 01-schemas-e-acessos.sql (Isolar schema private)', mandatory: true, done: true },
  { id: 'sql-2', title: 'Executar 02-tabelas-publicas.sql (Criar tabelas e habilitar RLS)', mandatory: true, done: true },
  { id: 'sql-3', title: 'Executar 03-tabelas-privadas.sql (Dados sensíveis)', mandatory: true, done: true },
  { id: 'sql-4', title: 'Executar 04-seguranca-rls.sql (Políticas por usuario_id = auth.uid())', mandatory: true, done: true },
  { id: 'sec-1', title: 'Verificar anon SEM permissão no schema private', mandatory: true, done: true },
  { id: 'sec-2', title: 'Conferir .env do backend no .gitignore (service_role protegida)', mandatory: true, done: true },
  { id: 'edge-1', title: 'Deploy da Edge Function buscar-dados-privados', mandatory: true, done: false },
  { id: 'edge-2', title: 'Deploy da Edge Function paperclip-ponte', mandatory: true, done: false },
  { id: 'front-1', title: 'Configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel', mandatory: true, done: false },
  { id: 'audit-1', title: 'Executar teste de intrusão local no console (RLS Guard)', mandatory: true, done: false },
];

export interface PecaEstoque {
  id: string;
  codigo: string;
  descricao: string;
  categoria: 'oleos' | 'freios' | 'filtros' | 'motor' | 'suspensao' | 'eletrica';
  quantidade: number;
  estoque_minimo: number;
  preco_custo: number;
  preco_venda: number;
  fornecedor: string;
  localizacao: string;
}

export const INITIAL_ESTOQUE: PecaEstoque[] = [
  {
    id: 'peca-1',
    codigo: 'OL-5W30-MAG',
    descricao: 'Óleo de Motor Sintético 5W30 Castrol Magnatec (1L)',
    categoria: 'oleos',
    quantidade: 34,
    estoque_minimo: 10,
    preco_custo: 38.5,
    preco_venda: 65.0,
    fornecedor: 'Distribuidora Lubrax & Castrol SP',
    localizacao: 'Prateleira A1',
  },
  {
    id: 'peca-2',
    codigo: 'PF-BOS-094',
    descricao: 'Jogo de Pastilhas de Freio Dianteiro Bosch Cerâmica',
    categoria: 'freios',
    quantidade: 8,
    estoque_minimo: 4,
    preco_custo: 110.0,
    preco_venda: 195.0,
    fornecedor: 'Auto Peças Fras-le & Bosch',
    localizacao: 'Prateleira B3',
  },
  {
    id: 'peca-3',
    codigo: 'FL-FRAM-5949',
    descricao: 'Filtro de Óleo Blindado Fram PH5949 / Gol / Polo / Fox',
    categoria: 'filtros',
    quantidade: 19,
    estoque_minimo: 8,
    preco_custo: 18.0,
    preco_venda: 35.0,
    fornecedor: 'Wega & Fram Filtros',
    localizacao: 'Prateleira A2',
  },
  {
    id: 'peca-4',
    codigo: 'CD-CONT-846',
    descricao: 'Kit Correia Dentada + Tensor Continental Contitech CT846',
    categoria: 'motor',
    quantidade: 3,
    estoque_minimo: 4,
    preco_custo: 210.0,
    preco_venda: 380.0,
    fornecedor: 'Continental Brasil',
    localizacao: 'Prateleira C1',
  },
  {
    id: 'peca-5',
    codigo: 'AM-COFAP-TG',
    descricao: 'Par Amortecedor Dianteiro Cofap Turbogás GP30132',
    categoria: 'suspensao',
    quantidade: 5,
    estoque_minimo: 2,
    preco_custo: 420.0,
    preco_venda: 690.0,
    fornecedor: 'Marelli Cofap',
    localizacao: 'Prateleira D2',
  },
  {
    id: 'peca-6',
    codigo: 'BAT-MOU-60',
    descricao: 'Bateria Automotiva Selada Moura 60Ah M60GD com 24m Garantia',
    categoria: 'eletrica',
    quantidade: 6,
    estoque_minimo: 3,
    preco_custo: 390.0,
    preco_venda: 580.0,
    fornecedor: 'Baterias Moura Distribuição SP',
    localizacao: 'Bancada Baterias',
  },
  {
    id: 'peca-7',
    codigo: 'FL-DOT4-VARGA',
    descricao: 'Fluido de Freio Hidráulico DOT 4 TRW Varga 500ml',
    categoria: 'freios',
    quantidade: 22,
    estoque_minimo: 6,
    preco_custo: 21.0,
    preco_venda: 42.0,
    fornecedor: 'ZF Aftermarket Brasil',
    localizacao: 'Prateleira B1',
  },
  {
    id: 'peca-8',
    codigo: 'VELA-NGK-IR',
    descricao: 'Jogo de Velas de Ignição Iridium NGK BKR6EIX-11 (4 un)',
    categoria: 'motor',
    quantidade: 7,
    estoque_minimo: 3,
    preco_custo: 165.0,
    preco_venda: 280.0,
    fornecedor: 'NGK Spark Plugs Brasil',
    localizacao: 'Gaveteiro C4',
  },
];

