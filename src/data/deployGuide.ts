export interface DeployStage {
  id: string;
  number: number;
  title: string;
  badge: string;
  summary: string;
  estimatedTime: string;
  prerequisites: string[];
  steps: {
    title: string;
    description: string;
    codeSnippet?: string;
    terminalSnippet?: string;
    warning?: string;
    tip?: string;
  }[];
  verificationCommands?: { command: string; expectedOutput: string; explanation: string }[];
}

export const DEPLOY_STAGES: DeployStage[] = [
  {
    id: 'stage-supabase-setup',
    number: 1,
    title: 'Provisionamento & Configuração do Supabase',
    badge: 'Infraestrutura Cloud',
    summary: 'Criação do projeto no Supabase, seleção de região brasileira (São Paulo / sa-east-1) e extração segura das chaves de API.',
    estimatedTime: '5 minutos',
    prerequisites: ['Conta gratuita ou Pro no supabase.com', 'Navegador com acesso ao dashboard'],
    steps: [
      {
        title: 'Criar Novo Projeto no Supabase',
        description: 'Acesse https://supabase.com/dashboard/projects e clique em "New project". Defina o nome como "sistema-oficina", escolha uma senha forte para o banco de dados Postgres e armazene-a no seu gerenciador de senhas.',
        tip: 'Selecione a região "South America (São Paulo) - sa-east-1" para garantir latência inferior a 25ms para clientes no Brasil.',
      },
      {
        title: 'Coletar as Credenciais de API',
        description: 'Navegue até Project Settings > API. Copie os 3 valores fundamentais:\n1. Project URL (ex: https://xyzcompany.supabase.co)\n2. Project API Keys > anon (public)\n3. Project API Keys > service_role (secret)',
        warning: 'NUNCA adicione a chave service_role ao código frontend ou ao GitHub! Ela ignora todo o RLS e só pode ser usada no backend/Edge Functions.',
      },
      {
        title: 'Habilitar Extensões Recomendadas',
        description: 'No menu Database > Extensions, verifique se a extensão pgcrypto ou uuid-ossp está habilitada para geração de identificadores UUID nativos.',
        terminalSnippet: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\nCREATE EXTENSION IF NOT EXISTS "pgcrypto";',
      },
    ],
  },
  {
    id: 'stage-sql-execution',
    number: 2,
    title: 'Execução Sequencial dos Scripts SQL',
    badge: 'Banco & Schemas',
    summary: 'Aplicação dos 4 scripts na ordem estrita no SQL Editor para criar os schemas, tabelas operacionais, tabela privada sigilosa e políticas RLS.',
    estimatedTime: '8 minutos',
    prerequisites: ['Projeto Supabase ativo', 'Acesso ao menu SQL Editor'],
    steps: [
      {
        title: 'Passo 2.1 — Criar e Isolar Schemas (01-schemas-e-acessos.sql)',
        description: 'Cria o schema private e revoga explicitamente permissões de anon e authenticated, concedendo uso apenas ao service_role.',
        codeSnippet: `CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;`,
        tip: 'Clique em "Run" no SQL Editor do Supabase e certifique-se de receber "Success. No rows returned".',
      },
      {
        title: 'Passo 2.2 — Tabelas Públicas da Oficina (02-tabelas-publicas.sql)',
        description: 'Cria as tabelas clientes, veiculos, ordens_servico e notificacoes vinculadas ao auth.users, e ativa Row Level Security (RLS) em 100% delas.',
        codeSnippet: `-- Habilitar RLS em TODAS — sem exceção
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;`,
      },
      {
        title: 'Passo 2.3 — Tabela de Dados Sensíveis (03-tabelas-privadas.sql)',
        description: 'Cria a tabela private.dados_pessoais (CPF, RG, endereço, telefone) com trigger automático de timestamp. Nenhuma política RLS é criada pois ela nunca é acessada pelo client.',
        warning: 'Não adicione políticas RLS nesta tabela privada. O isolamento de schema em nível de banco já impede conexões anônimas e públicas.',
      },
      {
        title: 'Passo 2.4 — Políticas RLS Granulares (04-seguranca-rls.sql)',
        description: 'Cria políticas que garantem que mecânicos/usuários autenticados só visualizem, insiram e editem clientes e OS vinculadas ao seu usuario_id = auth.uid().',
        codeSnippet: `CREATE POLICY "clientes_ver_proprio" ON public.clientes FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "os_ver_proprio" ON public.ordens_servico FOR SELECT TO authenticated USING (usuario_id = auth.uid());`,
      },
    ],
    verificationCommands: [
      {
        command: 'SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\';',
        expectedOutput: 'clientes: true | veiculos: true | ordens_servico: true | notificacoes: true',
        explanation: 'Confirma que todas as tabelas públicas estão com RLS devidamente ativado.',
      },
      {
        command: 'SELECT has_schema_privilege(\'anon\', \'private\', \'USAGE\');',
        expectedOutput: 'false',
        explanation: 'Garante que usuários anônimos não possuem permissão de leitura no schema private.',
      },
    ],
  },
  {
    id: 'stage-edge-functions',
    number: 3,
    title: 'Deploy das Edge Functions Seguras',
    badge: 'Backend Serverless',
    summary: 'Publicação das funções serverless no Supabase via CLI, configurando segredos de ambiente e o proxy administrativo.',
    estimatedTime: '10 minutos',
    prerequisites: ['Node.js 18+ instalado', 'Supabase CLI instalada'],
    steps: [
      {
        title: 'Instalar e Autenticar no Supabase CLI',
        description: 'Abra seu terminal no computador e instale a CLI oficial do Supabase caso ainda não possua.',
        terminalSnippet: `# 1. Instalar CLI globalmente
npm install -g supabase

# 2. Login na conta Supabase
supabase login

# 3. Vincular ao seu projeto (substitua pelo seu Project Reference ID)
supabase link --project-ref seu-project-id`,
      },
      {
        title: 'Configurar Segredos de Ambiente das Funções',
        description: 'As Edge Functions precisam da service_role para acessar o schema private, além de um segredo compartilhado para a ponte Paperclip.',
        terminalSnippet: `supabase secrets set SUPABASE_SERVICE_ROLE="sua_chave_service_role_aqui"
supabase secrets set PAPERCLIP_BRIDGE_SECRET="gerar_hash_aleatorio_32_chars"
supabase secrets set INTERNAL_BRIDGE_KEY="sua_chave_interna_notificacoes"`,
        warning: 'Nunca faça commit de arquivos .env contendo a chave service_role.',
      },
      {
        title: 'Fazer Deploy das 3 Edge Functions',
        description: 'Execute o comando de deploy para cada uma das funções criadas na pasta 02-backend-seguro/edge-functions:',
        terminalSnippet: `# Deploy das 3 funções principais
supabase functions deploy buscar-dados-privados --no-verify-jwt
supabase functions deploy notificar-usuario
supabase functions deploy paperclip-ponte`,
        tip: 'A função buscar-dados-privados valida manualmente o token JWT recebido no header Authorization para garantir granularidade de mensagens de erro amigáveis.',
      },
    ],
  },
  {
    id: 'stage-frontend-deploy',
    number: 4,
    title: 'Deploy do Frontend (Vercel ou Cloudflare)',
    badge: 'Produção Web',
    summary: 'Compilação e publicação do aplicativo cliente na Vercel com apenas as duas variáveis públicas no ambiente.',
    estimatedTime: '5 minutos',
    prerequisites: ['Conta no GitHub', 'Conta na Vercel (vercel.com)'],
    steps: [
      {
        title: 'Configurar Variáveis no Dashboard da Vercel',
        description: 'Ao importar o repositório na Vercel (ou via painel Settings > Environment Variables), adicione EXCLUSIVAMENTE as variáveis públicas prefixadas com VITE_:',
        codeSnippet: `VITE_SUPABASE_URL = https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`,
      },
      {
        title: 'Comando de Build e Diretório de Saída',
        description: 'Nas configurações de Build & Development Settings:\n- Build Command: npm run build\n- Output Directory: dist\n- Install Command: npm install',
      },
      {
        title: 'Verificar Cabeçalhos de Segurança (vercel.json)',
        description: 'Adicione um arquivo vercel.json na raiz do frontend com políticas anti-clickjacking e HSTS:',
        codeSnippet: `{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}`,
      },
    ],
  },
  {
    id: 'stage-paperclip-bridge',
    number: 5,
    title: 'Integração Segura com Paperclip Agents',
    badge: 'Agentes & Automação',
    summary: 'Configuração da ponte HTTP segura para que agentes de atendimento e gestor de OS interajam sem expor dados confidenciais.',
    estimatedTime: '6 minutos',
    prerequisites: ['Edge Function paperclip-ponte publicada', 'Acesso ao painel do Paperclip'],
    steps: [
      {
        title: 'Configurar Webhook no Paperclip',
        description: 'No painel de integrações do Paperclip, crie um conector HTTP apontando para o endpoint da Edge Function:\nURL: https://seu-projeto.supabase.co/functions/v1/paperclip-ponte\nHeader: x-paperclip-auth: seu_segredo_paperclip',
      },
      {
        title: 'Instruir Agente de Atendimento',
        description: 'Configure o prompt de sistema do agente no Paperclip para consultar apenas o resumo operacional:',
        codeSnippet: `Você é o Agente de Atendimento da Oficina.
Ao consultar a API, você receberá apenas número de OS, status e prazos.
Você NUNCA tem acesso a CPF, telefone ou endereço de clientes.
Se o cliente perguntar sobre prazos, consulte a OS pelo número fornecido.`,
      },
      {
        title: 'Testar Chamada de Validação',
        description: 'Faça um teste enviando uma requisição POST sem o cabeçalho para confirmar que a Edge Function responde com status 401 Unauthorized.',
        terminalSnippet: 'curl -i -X POST https://seu-projeto.supabase.co/functions/v1/paperclip-ponte',
      },
    ],
  },
  {
    id: 'stage-final-audit',
    number: 6,
    title: 'Auditoria Final & Homologação em Produção',
    badge: 'Go-Live Checklist',
    summary: 'Verificação dos 8 pontos críticos de segurança, teste de penetração simulated e validação de ponta a ponta.',
    estimatedTime: '4 minutos',
    prerequisites: ['Frontend e Backend em execução'],
    steps: [
      {
        title: 'Auditoria de Vazamento (Schema Leak Test)',
        description: 'No console do navegador do frontend em produção, tente executar uma query direta ao schema private:\nsupabase.from(\'private.dados_pessoais\').select(\'*\')\nA resposta OBRIGATORIAMENTE deve ser um erro de permissão (403 ou 404).',
      },
      {
        title: 'Verificação do Fluxo de Criação de OS',
        description: 'Crie um cliente de teste, associe um veículo e gere uma Ordem de Serviço. Verifique se o cálculo de subtotal, peças, mão de obra e total é persistido com sucesso.',
      },
      {
        title: 'Disparo de Notificação em Tempo Real',
        description: 'Atualize o status da OS de "aberto" para "em_andamento" e verifique se o evento Postgres Realtime aciona a central de notificações.',
      },
    ],
  },
];
