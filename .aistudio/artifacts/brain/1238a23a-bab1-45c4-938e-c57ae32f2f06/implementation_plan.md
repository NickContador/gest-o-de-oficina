# Plano e Documentação — Alertas de Meta & Contas a Receber com Cobrança WhatsApp

Este documento detalha as funcionalidades de **Alertas Críticos de Meta de Faturamento (<20%)** e o módulo dedicado de **Contas a Receber com Cobrança Amigável via WhatsApp**.

---

## 1. Alertas de Meta de Faturamento (<20%)

### Objetivo
Notificar o gestor da oficina em tempo real quando o faturamento apurado com as ordens de serviço finalizadas cair abaixo de **20% da meta configurada** (ex: `< R$ 5.000` quando a meta é `R$ 25.000`).

### Componentes Implementados:
1. **`checkCriticalRevenueAlert` em `src/utils/workshopLogic.ts`**:
   - Calcula a porcentagem atingida em relação à meta mensal configurada no `localStorage`.
   - Determina se a oficina está na zona crítica (`percentage < 20%`), calculando o déficit para o piso mínimo e o déficit total.
   - Analisa o pipeline da oficina: quantidade e valor de ordens em andamento/abertas no pátio e ordens concluídas não pagas em Contas a Receber.
   - Gera diagnósticos e recomendações executivas imediatas para o gestor.

2. **`MetaAlertsBanner` em `src/components/MetaAlertsModal.tsx`**:
   - Banner de alerta visual com borda vermelha e indicador pulsante exibido no topo do painel financeiro.
   - Apresenta faturamento atual, meta e valor faltante para o piso de segurança.
   - Botões de ação rápida: *"Cobrar Contas a Receber"* e *"Ver Diagnóstico Completo"*.

3. **`MetaAlertsModal` em `src/components/MetaAlertsModal.tsx`**:
   - Modal completo de diagnóstico com termômetro visual e barra de progresso demarcando o piso de 20%.
   - Cards com cards de oportunidade imediata (Contas a Receber e Ordens em Execução).
   - Acesso direto para reajustar metas no `FinancialGoalsModal` ou navegar até o Kanban.

---

## 2. Visualização de Contas a Receber & Cobrança WhatsApp

### Objetivo
Permitir controle de ordens concluídas mas ainda não pagas pelo cliente, fornecendo automação de mensagens formatadas para o WhatsApp e quitação instantânea de caixa.

### Componentes Implementados:
1. **`getAccountsReceivableMetrics` em `src/utils/workshopLogic.ts`**:
   - Filtra ordens de serviço com status `concluido` ou `entregue` que não foram pagas (`status_pagamento !== 'pago'`).
   - Totaliza montante a receber, contas vencidas e pendentes dentro do prazo.
   - Ordena os recebíveis priorizando cobranças vencidas e ordens mais antigas.

2. **`AccountsReceivableView` em `src/components/AccountsReceivableView.tsx`**:
   - 4 Cartões KPI: *Total a Receber*, *Contas Vencidas*, *Aguardando no Prazo* e *Total Pago no Período*.
   - Barra de filtros rápidos: *Todas*, *Vencidas*, *No Prazo* e *Quitadas*.
   - Campo de busca instantânea por cliente, placa Mercosul ou número de OS.
   - Tabela detalhada com placa com badge Mercosul, telefone do cliente mascarado/formatado, data de conclusão e vencimento.
   - Botão **"Lembrete WhatsApp"** para cada OS em aberto.
   - Botão **"Dar Baixa"** com atualização reativa do faturamento em tempo real.

3. **`WhatsAppBillingModal` em `src/components/WhatsAppBillingModal.tsx`**:
   - Geração de mensagem oficial e amigável de cobrança via `generateWhatsAppBillingReminderMessage`.
   - Inclui dados completos do veículo, número da OS, valor total em aberto e **chave Pix da oficina** (CNPJ).
   - Botão para copiar texto com feedback visual.
   - Botão para abrir diretamente o **WhatsApp Web** (`https://wa.me/55...`).
   - Opção de registrar quitação direta no modal especificando método de pagamento (Pix, Cartão de Crédito, Débito, Dinheiro).

4. **Sub-abas no Painel Financeiro em `src/components/WorkshopView.tsx`**:
   - `📊 DRE & Desempenho`: Visão geral com gráficos Recharts, MoM, teto de peças e DRE.
   - `💳 Contas a Receber`: Nova visualização com badge dinâmico indicando o número de ordens pendentes.

---

## 3. Verificação de Qualidade
- **Testes Unitários**: 24 testes executados e aprovados com 100% de sucesso via `tsx --test`.
- **Validação TypeScript**: `tsc --noEmit` sem qualquer erro.
- **Compilação**: `npm run build` gerando bundle de produção sem falhas.
