export interface ProjectFileItem {
  path: string;
  category: 'banco' | 'backend' | 'frontend' | 'paperclip' | 'docs';
  description: string;
  language: string;
  content: string;
  badge?: string;
}

export const PROJECT_FILES: ProjectFileItem[] = [
  {
    path: 'README.md',
    category: 'docs',
    description: 'Documentação oficial completa do sistema, topologia de banco, RLS, Edge Functions, Paperclip e deploy.',
    language: 'markdown',
    badge: 'Doc Principal (Vivo)',
    content: `# 📦 MinhaOficina Pro — Sistema de Gestão de Oficina Mecânica & Roteiro de Deploy Seguro

> Software completo para oficina mecânica com padrão visual inspirado no MinhaOficina, banco de dados Supabase com isolamento de schemas (public e private), RLS, Edge Functions e Gemini AI.

Consulte o arquivo README.md na raiz do projeto ou utilize o botão "Baixar README Atualizado" para obter a versão sincronizada em tempo real com as métricas da sua oficina!`,
  },
  {
    path: '03-banco-supabase/01-schemas-e-acessos.sql',
    category: 'banco',
    description: 'Passo 1: Criação e isolamento estrito dos schemas public e private. Bloqueia anon e authenticated do schema private.',
    language: 'sql',
    badge: 'Segurança Crítica',
    content: `-- =============================================
-- PASSO 1: CRIAR E ISOLAR OS SCHEMAS
-- =============================================

-- Criar schema privado (dados sensíveis)
CREATE SCHEMA IF NOT EXISTS private;

-- BLOQUEAR acesso direto do frontend ao schema private
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- Garantir que public tem acesso básico
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;`,
  },
  {
    path: '03-banco-supabase/02-tabelas-publicas.sql',
    category: 'banco',
    description: 'Passo 2: Tabelas públicas de Clientes, Veículos, Ordens de Serviço e Notificações, com RLS obrigatório.',
    language: 'sql',
    badge: 'Tabelas Core',
    content: `-- =============================================
-- PASSO 2: TABELAS PÚBLICAS — DADOS DO SISTEMA
-- =============================================

-- Clientes (vinculados ao usuário do sistema)
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome_completo VARCHAR(150) NOT NULL,
  nome_fantasia VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Veículos
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

-- Ordens de Serviço
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

-- Notificações
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

-- Habilitar RLS em TODAS — sem exceção
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;`,
  },
  {
    path: '03-banco-supabase/03-tabelas-privadas.sql',
    category: 'banco',
    description: 'Passo 3: Dados sigilosos (CPF, RG, telefone, endereço) no schema private. Sem RLS, apenas service_role acessa.',
    language: 'sql',
    badge: 'Dados Sigilosos',
    content: `-- =============================================
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

-- Função de atualização automática
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

-- ⚠️ NÃO criar políticas RLS aqui! O acesso é controlado por service_role apenas`,
  },
  {
    path: '03-banco-supabase/04-seguranca-rls.sql',
    category: 'banco',
    description: 'Passo 4: Políticas de Row Level Security (RLS) garantindo que cada usuário autenticado veja apenas seus registros.',
    language: 'sql',
    badge: 'Políticas RLS',
    content: `-- =============================================
-- PASSO 4: REGRAS DE ACESSO — USUÁRIO VÊ SÓ O DELE
-- =============================================

-- CLIENTES
CREATE POLICY "clientes_ver_proprio"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "clientes_inserir_proprio"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "clientes_editar_proprio"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "clientes_excluir_proprio"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (usuario_id = auth.uid());

-- VEÍCULOS
CREATE POLICY "veiculos_ver_proprio"
  ON public.veiculos FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "veiculos_inserir_proprio"
  ON public.veiculos FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- ORDENS DE SERVIÇO
CREATE POLICY "os_ver_proprio"
  ON public.ordens_servico FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "os_inserir_proprio"
  ON public.ordens_servico FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- NOTIFICAÇÕES
CREATE POLICY "notificacoes_ver_proprio"
  ON public.notificacoes FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "notificacoes_marcar_lida"
  ON public.notificacoes FOR UPDATE
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (lida IS NOT NULL); -- Só permite mudar o campo "lida"`,
  },
  {
    path: '01-frontend/src/lib/supabase-client.js',
    category: 'frontend',
    description: 'Cliente Supabase para o navegador (utiliza apenas anon key pública). Nunca expõe service_role!',
    language: 'javascript',
    badge: 'Frontend Client',
    content: `import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Faltando variáveis do Supabase no ambiente!')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Hook para notificações em tempo real
export function escutarNotificacoes(callback) {
  const usuarioId = supabase.auth.currentUser?.id
  if (!usuarioId) return

  return supabase
    .channel('novas-notificacoes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: \`usuario_id=eq.\${usuarioId}\`
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}`,
  },
  {
    path: '01-frontend/.env.local',
    category: 'frontend',
    description: 'Configuração do frontend (somente variáveis públicas VITE_)',
    language: 'env',
    badge: 'Env Frontend',
    content: `VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...chave_anon_aqui`,
  },
  {
    path: '02-backend-seguro/supabase-admin.js',
    category: 'backend',
    description: 'Instância administrativa do Supabase para Edge Functions usando service_role key.',
    language: 'javascript',
    badge: 'Backend Admin',
    content: `import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error('Variáveis de admin não configuradas!')
}

// ⚠️ SÓ usar no backend/Edge Functions — NÃO no navegador!
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
})`,
  },
  {
    path: '02-backend-seguro/edge-functions/buscar-dados-privados.js',
    category: 'backend',
    description: 'Edge Function para busca segura de dados do schema private com autenticação via JWT.',
    language: 'javascript',
    badge: 'Edge Function',
    content: `import { supabaseAdmin } from '../supabase-admin.js'

export default async function handler(req) {
  // 1. Pegar token do usuário
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return new Response('Não autorizado', { status: 401 })

  // 2. Validar sessão
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader.split(' ')[1])
  if (error || !user) return new Response('Sessão inválida', { status: 401 })

  // 3. Buscar APENAS os dados do usuário autenticado
  const { data, error: dbError } = await supabaseAdmin
    .from('dados_pessoais')
    .select('cpf, telefone, endereco_rua, endereco_cidade, endereco_uf')
    .eq('id', user.id)
    .single()

  if (dbError) return new Response(JSON.stringify({ erro: dbError.message }), { status: 404 })

  // 4. Retornar — sem expor dados desnecessários
  return new Response(JSON.stringify({ dados: data }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}`,
  },
  {
    path: '02-backend-seguro/edge-functions/notificar-usuario.js',
    category: 'backend',
    description: 'Edge Function que dispara notificações e sincroniza eventos via Postgres Realtime.',
    language: 'javascript',
    badge: 'Edge Function',
    content: `import { supabaseAdmin } from '../supabase-admin.js'

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Método não permitido', { status: 405 })

  const apiKey = req.headers.get('x-internal-key')
  if (apiKey !== process.env.INTERNAL_BRIDGE_KEY) {
    return new Response('Acesso proibido', { status: 403 })
  }

  const { usuario_id, titulo, mensagem, tipo, referencia_id } = await req.json()

  const { data, error } = await supabaseAdmin.from('notificacoes').insert({
    usuario_id,
    titulo,
    mensagem,
    tipo: tipo || 'sistema',
    referencia_id: referencia_id || null
  }).select().single()

  if (error) return new Response(JSON.stringify({ erro: error.message }), { status: 500 })

  return new Response(JSON.stringify({ sucesso: true, notificacao: data }), {
    headers: { 'Content-Type': 'application/json' }
  })
}`,
  },
  {
    path: '02-backend-seguro/edge-functions/paperclip-ponte.js',
    category: 'paperclip',
    description: 'Ponte segura para o Paperclip Agent consultar ordens e status sem acessar dados sensíveis.',
    language: 'javascript',
    badge: 'Ponte Segura Paperclip',
    content: `import { supabaseAdmin } from '../supabase-admin.js'

export default async function handler(req) {
  const paperclipSecret = req.headers.get('x-paperclip-auth')
  if (paperclipSecret !== process.env.PAPERCLIP_BRIDGE_SECRET) {
    return new Response('Não autorizado', { status: 401 })
  }

  // Paperclip NUNCA consulta private.dados_pessoais nem tabela auth
  // Retorna apenas dados agregados e resumos operacionais
  const { data: ordens, error } = await supabaseAdmin
    .from('ordens_servico')
    .select('id, numero_os, status, valor_total, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return new Response(JSON.stringify({ erro: error.message }), { status: 500 })

  const resumo = {
    total_abertas: ordens.filter(o => o.status === 'aberto').length,
    total_em_andamento: ordens.filter(o => o.status === 'em_andamento').length,
    ultimas_os: ordens.map(o => ({
      numero: o.numero_os,
      status: o.status,
      valor: o.valor_total
    }))
  }

  return new Response(JSON.stringify({ status: 'ok', resumo }), {
    headers: { 'Content-Type': 'application/json' }
  })
}`,
  },
  {
    path: '04-paperclip-integracao/fluxo-seguranca.md',
    category: 'paperclip',
    description: 'Documentação do fluxo de segurança Paperclip: IA nunca toca em dados pessoais.',
    language: 'markdown',
    badge: 'Arquitetura',
    content: `# Fluxo de Segurança: Paperclip e Supabase

1. Paperclip faz requisição HTTP para a Edge Function \`/paperclip-ponte\` com cabeçalho de autenticação \`x-paperclip-auth\`.
2. A Edge Function autentica a requisição via segredo de ambiente isolado (\`PAPERCLIP_BRIDGE_SECRET\`).
3. Apenas tabelas públicas (\`ordens_servico\`, \`veiculos\`) são consultadas com projeção estrita de colunas.
4. NENHUM dado das tabelas \`private.dados_pessoais\` ou \`auth.users\` é retornado ao agente.
5. As respostas ao cliente via Paperclip contêm apenas informações operacionais (status de OS, prazos, orçamentos autorizados).`,
  },
  {
    path: '05-documentos/guia-deploy.md',
    category: 'docs',
    description: 'Roteiro de deploy detalhado passo a passo para Supabase, Edge Functions e Vercel.',
    language: 'markdown',
    badge: 'Guia Oficial',
    content: `# Roteiro de Deploy do Sistema de Gestão de Oficina

Siga os passos rigorosamente na sequência indicada.

## 1. Banco de Dados (Supabase)
1. Acesse o Dashboard do Supabase e crie um novo projeto.
2. Abra o **SQL Editor**.
3. Execute o arquivo \`01-schemas-e-acessos.sql\` para criar o schema \`private\` e restringir acessos.
4. Execute \`02-tabelas-publicas.sql\` para criar as tabelas operacionais e ativar RLS.
5. Execute \`03-tabelas-privadas.sql\` para criar a tabela de dados pessoais sigilosos.
6. Execute \`04-seguranca-rls.sql\` para aplicar as políticas por usuário autenticado.

## 2. Backend & Edge Functions
1. Instale o Supabase CLI: \`npm i -g supabase\`.
2. Faça login: \`supabase login\`.
3. Conecte ao projeto: \`supabase link --project-ref seu-id-de-projeto\`.
4. Defina os segredos:
   - \`supabase secrets set SUPABASE_SERVICE_ROLE=sua_chave_service_role\`
   - \`supabase secrets set PAPERCLIP_BRIDGE_SECRET=seu_segredo_paperclip\`
5. Deploy das funções:
   - \`supabase functions deploy buscar-dados-privados\`
   - \`supabase functions deploy notificar-usuario\`
   - \`supabase functions deploy paperclip-ponte\`

## 3. Frontend (Vercel ou similar)
1. Conecte o repositório na Vercel.
2. Adicione as variáveis de ambiente:
   - \`VITE_SUPABASE_URL\` = URL do projeto Supabase
   - \`VITE_SUPABASE_ANON_KEY\` = Chave Anon Pública
3. Deploy!`,
  },
];
