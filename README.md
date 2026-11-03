# 📦 MinhaOficina Pro — Sistema de Gestão de Oficina Mecânica & Roteiro de Deploy Seguro

> **Software completo de gestão para oficina mecânica e auto elétrica** com padrão visual inspirado no [MinhaOficina](https://minhaoficina.net/programa-para-oficina-mecanica/), **banco de dados Supabase com isolamento estrito de schemas (`public` e `private`)**, políticas **Row Level Security (RLS)**, **Edge Functions serverless**, integração segura com **Paperclip Agents** e **IA Generativa Gemini** (`gemini-3.1-flash-lite` para triagem rápida e `gemini-nano-banana-2.1` para laudos com controle de aspect ratio).

---

## ⚡ Status do Sistema em Tempo Real (Atualizado)

- **Última Atualização Registrada:** `29/10/2026, 20:14:00`
- **Progresso de Deploy & Go-Live:** **60%** (6 de 10 etapas concluídas)
- **Status de Homologação:** 🟡 **DEPLOY EM ANDAMENTO (4 etapas pendentes)**
- **Ordens de Serviço Ativas:** **4** (1 em aberto · 1 em execução · 2 finalizadas)
- **Faturamento Mensal Acumulado:** **R$ 4.540,00** (Peças: R$ 3.140,00 · Mão de Obra: R$ 1.520,00)
- **Clientes Cadastrados:** **4** (Todos com conformidade LGPD e dados sensíveis protegidos)
- **Frota Atendida:** **4 veículos** (Toyota Hilux, VW Gol, Honda Civic, Chevrolet Onix)
- **Design System:** Padrão MinhaOficina (Silhueta escura `#1e293b`, ciano `#00a2e8`, layout em 3 zonas, zero-pill e impressão A4)

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
7. [Integração Paperclip (Ponte Segura de Agentes)](#-integração-paperclip-ponte-segura)
8. [Recursos de Inteligência Artificial Gemini](#-recursos-de-inteligência-artificial-gemini)
9. [Sistema de Design & UX/UI (Padrão MinhaOficina)](#-sistema-de-design--uxui-padrão-minhaoficina)
10. [Roteiro Detalhado de Deploy Passo a Passo](#-roteiro-detalhado-de-deploy-passo-a-passo)
11. [Checklist Oficial de Go-Live & Homologação](#-checklist-oficial-de-go-live--homologação)
12. [Comandos de Desenvolvimento e Testes](#-comandos-de-desenvolvimento-e-testes)
13. [Política de Atualização Contínua deste README](#-política-de-atualização-contínua-deste-readme)

---

## 🏛️ Visão Geral da Arquitetura

O sistema adota uma separação rigorosa em camadas com o princípio do menor privilégio (*least privilege*):

```
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
```

---

## 📁 Estrutura Completa de Pastas & Arquivos

```
sistema-oficina/
├── 01-frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase-client.js        ← Cliente público (anon key)
│   │   ├── telas/
│   │   │   ├── OrdensServico.jsx         ← Grid e gestão de OS
│   │   │   ├── DetalhesOSModal.jsx       ← 6 Abas (Cliente, Serviços, Peças, Pgto, Lucro, A4)
│   │   │   ├── Clientes.jsx              ← Cadastro com proteção LGPD
│   │   │   └── Financeiro.jsx            ← DRE e rentabilidade
│   │   ├── componentes/
│   │   │   ├── Cabecalho.jsx             ← 3 zonas com logo MinhaOficina
│   │   │   └── GeradorLaudos.jsx         ← Aspect ratio (1:1 a 21:9)
│   │   └── notificacoes/
│   │       └── NotificacoesRealtime.jsx  ← Postgres Realtime
│   ├── .env.local                        ← SÓ: URL + ANON_KEY
│   ├── .gitignore
│   └── package.json
│
├── 02-backend-seguro/
│   ├── edge-functions/
│   │   ├── buscar-dados-privados.js      ← Valida JWT e busca schema private
│   │   ├── notificar-usuario.js          ← Dispara alertas operacionais
│   │   └── paperclip-ponte.js            ← Ponte segura com dados higienizados
│   ├── supabase-admin.js                 ← Conexão administrativa (service_role)
│   ├── .env                              ← SERVICE_ROLE — NUNCA SUBIR AO GIT!
│   ├── .gitignore
│   └── package.json
│
├── 03-banco-supabase/
│   ├── 01-schemas-e-acessos.sql          ← Criação e isolamento do schema private
│   ├── 02-tabelas-publicas.sql           ← Tabelas públicas com RLS
│   ├── 03-tabelas-privadas.sql           ← Tabela dados_pessoais e triggers
│   ├── 04-seguranca-rls.sql              ← Políticas restritivas por auth.uid()
│   └── README-importacao.md              ← Ordem exata de execução no SQL Editor
│
├── 04-paperclip-integracao/
│   ├── agentes/
│   │   ├── agente-atendimento.md         ← Instruções de recepção de clientes
│   │   └── agente-gestor-os.md           ← Atualização e acompanhamento de OS
│   └── fluxo-seguranca.md                ← Regras de não exposição de CPF/RG
│
└── 05-documentos/
    ├── README.md                         ← Este documento auto-sincronizado
    ├── guia-deploy.md                    ← Runbook completo de produção
    └── changelog.md                      ← Histórico de versões
```

---

## 🔒 Segurança & Isolamento de Schemas (LGPD)

O grande diferencial de arquitetura é o **isolamento físico de schemas** no PostgreSQL:

1. **Schema `public`**:
   - Contém dados operacionais do dia a dia da oficina (nome do cliente, modelo do veículo, placa, serviços e peças da OS).
   - O acesso anônimo (`anon`) é bloqueado por padrão.
   - Usuários autenticados (`authenticated`) só visualizam linhas vinculadas ao seu `usuario_id = auth.uid()`.

2. **Schema `private`**:
   - Contém dados sensíveis e sigilosos sob a LGPD (`cpf`, `rg`, `telefone`, `endereco completo`).
   - Todos os acessos de `anon` e `authenticated` foram expressamente revogados via `REVOKE ALL ON SCHEMA private`.
   - **Nenhuma query executada diretamente pelo frontend consegue acessar o schema `private`** — mesmo que o usuário tente inspecionar o código e forjar chamadas via DevTools.
   - O único canal de acesso é através da Edge Function `buscar-dados-privados`, que valida o token JWT do usuário antes de realizar a consulta com a credencial `service_role`.

---

## 🗄️ Banco de Dados: Scripts SQL Prontos

Execute os scripts abaixo no **SQL Editor** do Supabase estritamente nesta ordem sequencial:

### `01-schemas-e-acessos.sql`
```sql
-- =============================================
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
GRANT USAGE ON SCHEMA public TO authenticated;
```

---

### `02-tabelas-publicas.sql`
```sql
-- =============================================
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
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
```

---

### `03-tabelas-privadas.sql`
```sql
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

-- ⚠️ NÃO criar políticas RLS aqui! O acesso é controlado por service_role apenas
```

---

### `04-seguranca-rls.sql`
```sql
-- =============================================
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
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

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

CREATE POLICY "os_editar_proprio"
  ON public.ordens_servico FOR UPDATE
  TO authenticated
  USING (usuario_id = auth.uid())
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
  WITH CHECK (lida IS NOT NULL);
```

---

## 💻 Frontend & Conexão Supabase

O frontend Vite se comunica com o Supabase utilizando exclusivamente as credenciais públicas em `.env.local`:

```javascript
// src/lib/supabase-client.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

---

## 🛡️ Backend Seguro & Edge Functions

As Edge Functions residem no diretório `supabase/functions/` e executam sob Deno/Node:

1. **`buscar-dados-privados`**:
   Valida o cabeçalho `Authorization: Bearer <token>` e extrai o ID do usuário autenticado antes de consultar a tabela `private.dados_pessoais` com a chave administrativa.
2. **`notificar-usuario`**:
   Dispara eventos do Postgres Realtime para alertar mecânicos e clientes quando uma OS muda de fase.
3. **`paperclip-ponte`**:
   Conexão segura para agentes autônomos de IA (atendimento e orçamentação) retornando apenas dados higienizados e nunca dados de cartões ou documentos sigilosos.

---

## 🤖 Recursos de Inteligência Artificial Gemini

1. **Triagem Rápida Automotiva (`gemini-3.1-flash-lite`)**:
   - Diagnóstico em tempo real para sintomas de avarias mecânicas e dúvidas de arquitetura com latência inferior a 800ms.
2. **Laudos & Diagramas Técnicos (`gemini-nano-banana-2.1` / `gemini-3-pro-image-preview`)**:
   - Geração de ilustrações técnicas com seleção estrita de proporção de tela (`1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `9:16`, `16:9`, `21:9`).

---

## 🎨 Sistema de Design & UX/UI (Padrão MinhaOficina ERP)

O sistema segue rigorosamente o padrão visual de ERP automotivo de alta produtividade inspirado no [minhaoficina.net](https://minhaoficina.net/programa-para-oficina-mecanica/):
- **Quadro Kanban Interativo com Drag-and-Drop**: Visualização ágil do fluxo de oficina dividido em 5 estágios (`Orçamento / Entrada`, `Na Oficina / Execução`, `Aguardando Peças`, `Pronto p/ Retirada` e `Entregue / Finalizado`), com totalizadores monetários (`tabular-nums`), contadores e movimentação suave por arraste ou botões rápidos.
- **Laudo Técnico & Orçamento A4 com WhatsApp**: Visualizador completo de ordens de serviço com cabeçalho oficial da oficina, dados de identificação veicular com placa no padrão Mercosul, resumo de checklist 360°, tabela discriminada de mão de obra e peças, termos de garantia legal (90 dias conforme Art. 26 do CDC), linhas de assinatura e botão para disparo de mensagem estruturada no WhatsApp do cliente.
- **Layout Desktop ERP com Sidebar Lateral**: Barra de navegação vertical escura (`#0f172a`), com logotipo em alto contraste, botão de ação rápida *+ Emitir Nova OS (F2)*, seções segmentadas (Operação, Inteligência, Supabase & DevOps) e rodapé com status de nuvem e atalhos.
- **TopBar de Produtividade**: Barra de busca global com acionamento por teclado (`Ctrl + K`) para placas, clientes e números de OS, métricas em tempo real de faturamento e ordens abertas, e acionador de *Triagem IA*.
- **Vistoria & Checklist 360° Interativo**: Diagrama de lataria com zonas clicáveis para marcação de avarias (*riscos*, *amassados*, *quebras*), conferência de itens de segurança (estepe, macaco, chave de roda, triângulo) e nível de combustível.
- **Módulo de Peças & Estoque**: Controle de inventário com alertas visuais de estoque baixo, cálculo automático de preço de custo, preço de venda e margem bruta real (markup).
- **Gráfico de Barras Financeiro com Recharts & Meta Dinâmica**: Comparativo dinâmico de evolução mensal entre *Receita Bruta*, *Custo de Peças* e *Lucro Líquido Real*, com seletor de período (*Últimos 6 meses*, *Ano Corrente* e *Trimestre*), linha de meta gerencial tracejada (`ReferenceLine`), tooltips analíticos e badges individuais de status por mês.
- **Visualização de Crescimento Mês a Mês (MoM %) com Setas Visuais**: Modo de visualização comparativo no Recharts que plota lado a lado a *Receita Mês Vigente* vs *Receita Mês Anterior (Base MoM)*, com cálculo automatizado de taxa de crescimento percentual e setas coloridas em destaque:
  - 🟢 **Setas Verdes (`▲ +%`)**: Indicam expansão e superação de receita em relação ao mês imediatamente anterior.
  - 🔴 **Setas Vermelhas (`▼ -%`)**: Destacam retração de faturamento, alertando a equipe para reforçar prospecção e liberação de boxes.
  - Faixa de mini-cards com badges circulares de variação percentual para cada mês do período analisado.
- **Modal de Configuração de Metas & Sistema (`localStorage`)**: Painel de governança corporativa onde o gestor define:
  - *Faturamento Alvo Mensal (R$)* e *Meta de Lucro Líquido (R$)*.
  - *Teto de Gastos com Peças & Insumos (R$)*: Com alerta automático caso o somatório de compras de reposição exceda o limite.
  - *Margem Operacional Mínima (%)*: Parâmetro de rentabilidade saudável.
  - *Dados Cadastrais da Oficina*: Nome/Razão Social, CNPJ, Telefone/WhatsApp, Endereço e Prazo de Garantia (dias), refletidos automaticamente nos laudos A4 e planilhas Excel.
  - Persistência automática no `localStorage` do navegador com recurso para restaurar valores de fábrica.
- **Sistema de Alertas de Lucro Líquido & Metas Gerenciais**: Monitoramento contínuo da meta de rentabilidade mensal definida pela oficina (ex: R$ 12.000/mês). Exibe banner de alerta inteligente caso o lucro caia abaixo da meta, com cálculo preciso de déficit, percentual atingido, sugestões gerenciais de recuperação de margem e badge de status visual no gráfico. Permite ajuste rápido da meta em tempo real (`R$ 9k`, `R$ 12k`, `R$ 15k`, `R$ 18k`).
- **Exportação de Dados Contábeis em Planilha Excel (`.xlsx` via `xlsx`)**: Exportação completa em formato de planilha para conciliação contábil com múltiplas abas:
  - *Aba 1 (Resumo Gerencial)*: Metadados da oficina, indicadores KPIs consolidados, controle de cumprimento da meta de lucro e histórico mensal discriminado.
  - *Aba 2 (Detalhamento OS)*: Relação minuciosa de cada ordem com número, datas, cliente, CPF mascarado (LGPD), veículo, placa, status operacional, discriminação de mão de obra vs peças, descontos, total faturado, lucro líquido e técnico responsável.
- **Exportação de Resumo Financeiro em PDF (jsPDF + AutoTable)**: Geração de documento vetorial A4 para impressão contábil da oficina, com cabeçalho oficial, indicadores-chave de rentabilidade, tabela completa de ordens finalizadas e termos para assinatura gerencial.
- **Placas Padrão Mercosul Autênticas**: Renderização visual de placas veiculares brasileiras com faixa superior azul Mercosul (`#003399`), identificação `BR` e tipografia de segurança.
- **Controle Preciso de Aspect Ratio**: Seletor intuitivo de proporções de imagem (`1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `9:16`, `16:9`, `21:9`) com IA Gemini.

---

## 🚀 Roteiro Detalhado de Deploy Passo a Passo

### Etapa 1: Provisionamento do Supabase
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e clique em **New project**.
2. Nomeie como `sistema-oficina` e selecione a região **South America (São Paulo) - sa-east-1**.
3. Em **Project Settings > API**, copie a **Project URL**, a **anon public key** e a **service_role secret key**.

### Etapa 2: Execução dos Scripts SQL
1. Abra o **SQL Editor** no painel do Supabase.
2. Execute os 4 scripts na ordem `01` → `02` → `03` → `04`.
3. Validação: Execute `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` e certifique-se de que todas retornam `true`.

### Etapa 3: Deploy das Edge Functions
1. Instale a CLI: `npm install -g supabase`.
2. Autentique e vincule ao projeto:
   ```bash
   supabase login
   supabase link --project-ref <seu-project-id>
   ```
3. Defina os segredos protegidos:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE="sua_chave_service_role"
   supabase secrets set PAPERCLIP_BRIDGE_SECRET="seu_segredo_paperclip"
   ```
4. Publique as funções:
   ```bash
   supabase functions deploy buscar-dados-privados --no-verify-jwt
   supabase functions deploy notificar-usuario
   supabase functions deploy paperclip-ponte
   ```

### Etapa 4: Deploy do Frontend (Vercel)
1. Importe o repositório na Vercel.
2. Configure **apenas** as 2 variáveis públicas de ambiente:
   - `VITE_SUPABASE_URL` = `https://<seu-projeto>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<sua-chave-anon>`
3. Build Command: `npm run build` | Output Directory: `dist`.

---

## ✅ Checklist Oficial de Go-Live & Homologação

- [x] **Executar 01-schemas-e-acessos.sql (Isolar schema private)** *(Obrigatório)*
- [x] **Executar 02-tabelas-publicas.sql (Criar tabelas e habilitar RLS)** *(Obrigatório)*
- [x] **Executar 03-tabelas-privadas.sql (Dados sensíveis)** *(Obrigatório)*
- [x] **Executar 04-seguranca-rls.sql (Políticas por usuario_id = auth.uid())** *(Obrigatório)*
- [x] **Verificar anon SEM permissão no schema private** *(Obrigatório)*
- [x] **Conferir .env do backend no .gitignore (service_role protegida)** *(Obrigatório)*
- [ ] **Deploy da Edge Function buscar-dados-privados** *(Obrigatório)*
- [ ] **Deploy da Edge Function paperclip-ponte** *(Obrigatório)*
- [ ] **Configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel** *(Obrigatório)*
- [ ] **Executar teste de intrusão local no console (RLS Guard)** *(Obrigatório)*

---

## 🛠️ Comandos de Desenvolvimento e Testes

```bash
# Instalação de dependências
npm install

# Iniciar servidor full-stack de desenvolvimento (Porta 3000)
npm run dev

# Executar suíte de testes unitários de lógica pura (Node test runner)
npm test

# Verificar integridade de tipos TypeScript
npm run lint

# Build de produção do aplicativo
npm run build
```

---

## 🔄 Política de Atualização Contínua deste README

Este documento é gerado e mantido em tempo real pelo núcleo do **MinhaOficina Pro**:
- Sempre que houver novas ordens de serviço, novos clientes cadastrados, mudanças no checklist de deploy ou novas rotas, o README pode ser baixado ou copiado em sua versão mais recente diretamente na interface (*Arquivos & Scripts*).
- O arquivo físico `/README.md` na raiz do projeto permanece como documentação base oficial.

---

*Sistema desenvolvido com arquitetura Supabase Segura, Interface MinhaOficina e Modelos Gemini AI.*
