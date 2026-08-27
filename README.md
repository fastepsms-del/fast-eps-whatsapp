# Fast EPS · Atendimento WhatsApp com IA

Automação de atendimento via WhatsApp para a **Fast EPS** (molduras em EPS e painéis
monolíticos). Um sistema 24/7 que recebe leads, dá boas-vindas, tira dúvidas, qualifica o
cliente e conduz para orçamento — de forma natural e humanizada — usando o Claude como
"cérebro" comercial, com transferência para atendimento humano quando necessário.

## Arquitetura

```
WhatsApp Cloud API (Meta)
        │  webhook (mensagens/status)
        ▼
POST /api/webhook/whatsapp  ──┐
        │                     │ 1. valida assinatura HMAC
        │                     │ 2. identifica/cria o lead (telefone)
        │                     │ 3. grava a mensagem recebida
        │                     │ 4. (se não estiver em atendimento humano)
        ▼                     │    monta o prompt com a base de conhecimento
  Claude (tool use)  ─────────┘    + histórico da conversa e chama a IA
        │
        │ ferramentas: classify_message / update_lead / set_lead_status /
        │              request_human_handoff
        ▼
   Banco (Postgres via Prisma): leads, mensagens, base de conhecimento, logs
        │
        ▼
  Resposta enviada de volta via WhatsApp Cloud API
```

Componentes principais:

- **`src/app/api/webhook/whatsapp`** — recebe mensagens/status do WhatsApp, orquestra o fluxo.
- **`src/lib/ai`** — prompt da IA, definição das ferramentas (tools) e chamada ao Claude.
- **`src/lib/config`** — base de conhecimento configurável (empresa, produtos, preços,
  entrega, instalação, FAQ, horário comercial, follow-up, transferência humana), com
  defaults em código e overrides editáveis no banco pelo painel administrativo.
- **`src/lib/whatsapp`** — cliente da WhatsApp Cloud API (enviar texto/template, baixar
  mídia) e verificação de assinatura do webhook.
- **`src/lib/leads` / `src/lib/conversation`** — CRM simplificado do lead e histórico de
  mensagens.
- **`src/lib/followup`** + **`/api/cron/followups`** — follow-up automático sem parecer spam.
- **`src/app/admin`** — painel administrativo (leads, conversas, configurações, logs).
- **`prisma/schema.prisma`** — modelo de dados (Postgres).

## Por que a IA nunca inventa informação

O prompt (`src/lib/ai/systemPrompt.ts`) é montado dinamicamente a partir da base de
conhecimento (`src/lib/config`). Campos não confirmados (preço, tempo de mercado, frete,
instalação, cidades atendidas etc.) ficam `null`/vazios nos defaults, e o prompt instrui
explicitamente a IA a nunca inventar esses dados — apenas dizer que vai confirmar com a
equipe e, quando fizer sentido, acionar a ferramenta de transferência para humano.

## Passo a passo de configuração

### 1. Banco de dados (PostgreSQL)

Use qualquer Postgres gerenciado (recomendado para começar rápido: [Neon](https://neon.tech)
ou [Supabase](https://supabase.com), ambos com plano gratuito). Copie a connection string
para `DATABASE_URL`.

```bash
cp .env.example .env
# edite o .env com os valores reais
npm install
npx prisma migrate deploy   # cria as tabelas
npm run db:seed             # popula a base de conhecimento padrão da Fast EPS
```

### 2. App da Meta e WhatsApp Cloud API

1. Crie um app em [developers.facebook.com/apps](https://developers.facebook.com/apps) do
   tipo "Business" e adicione o produto **WhatsApp**.
2. Em **WhatsApp > API Setup**, anote o `Phone Number ID` e o `WhatsApp Business Account ID`
   → variáveis `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_BUSINESS_ACCOUNT_ID`.
3. Gere um **token permanente**: Meta Business Suite → Configurações do negócio → Usuários
   do sistema → crie um usuário do sistema com acesso ao app e ao número de WhatsApp, gere
   um token sem validade (`WHATSAPP_ACCESS_TOKEN`).
4. Em **App settings > Basic**, copie o **App Secret** → `WHATSAPP_APP_SECRET` (usado para
   validar a assinatura HMAC dos webhooks — não pule esta etapa em produção).
5. Escolha um valor qualquer para `WHATSAPP_VERIFY_TOKEN` (você mesmo define esse segredo).
6. Depois do deploy (passo 4 abaixo), em **WhatsApp > Configuration > Webhook**, configure:
   - Callback URL: `https://SEU-DOMINIO/api/webhook/whatsapp`
   - Verify Token: o mesmo valor de `WHATSAPP_VERIFY_TOKEN`
   - Assine os campos `messages` (e opcionalmente `message_template_status_update`).

> **Importante — janela de 24h:** a API do WhatsApp só permite mensagens de texto livre
> dentro de 24h após a última mensagem do cliente. Fora dessa janela (ex: follow-up depois
> de 1 dia sem resposta), é obrigatório usar um **template de mensagem aprovado** pela Meta.
> Crie um template (Meta Business Manager → WhatsApp Manager → Message Templates) com o
> nome configurado em `FOLLOW_UP_SETTINGS.messageTemplateName` (editável no painel em
> `/admin/settings`) antes de habilitar o follow-up automático.

### 3. IA (Anthropic / Claude)

Crie uma chave em [console.anthropic.com](https://console.anthropic.com) →
`ANTHROPIC_API_KEY`. O modelo padrão é `claude-sonnet-5` (`ANTHROPIC_MODEL`).

### 4. Deploy (recomendado: Vercel)

Como ainda não há servidor definido, a forma mais simples de colocar em produção é a
Vercel (grátis para começar), pois já suporta Next.js e Cron Jobs nativamente:

```bash
npm i -g vercel
vercel link
vercel env add DATABASE_URL
vercel env add WHATSAPP_PHONE_NUMBER_ID
vercel env add WHATSAPP_BUSINESS_ACCOUNT_ID
vercel env add WHATSAPP_ACCESS_TOKEN
vercel env add WHATSAPP_VERIFY_TOKEN
vercel env add WHATSAPP_APP_SECRET
vercel env add ANTHROPIC_API_KEY
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
vercel env add ADMIN_SESSION_SECRET
vercel env add CRON_SECRET
vercel deploy --prod
```

O arquivo `vercel.json` já registra o cron de follow-up (`/api/cron/followups`, a cada
hora). A Vercel envia automaticamente o header `Authorization: Bearer $CRON_SECRET` nessas
chamadas quando a env var `CRON_SECRET` está definida — não é preciso configurar nada além
disso.

Depois do primeiro deploy, rode as migrações e o seed contra o banco de produção
(`DATABASE_URL` apontando pro banco real):

```bash
npx prisma migrate deploy
npm run db:seed
```

### 5. Testar localmente antes do deploy

```bash
npm run dev
# em outro terminal, exponha a porta 3000 publicamente para o webhook da Meta, ex:
ngrok http 3000
```

Use a URL do ngrok como Callback URL do webhook durante os testes.

## Painel administrativo

Acesse `/admin` (protegido por login simples via `ADMIN_USERNAME`/`ADMIN_PASSWORD`):

- **Leads** — lista com filtros por status, produto, cidade, temperatura e "aguardando
  atendimento humano"; ao abrir um lead, você vê a conversa completa, os dados capturados
  pela IA, pode editar campos manualmente, pausar follow-up, transferir/reativar o
  atendimento automático e enviar uma mensagem manual (ex: um vendedor respondendo direto).
- **Configurações** — edição da base de conhecimento (empresa, produtos, preços, entrega,
  instalação, informações técnicas, horário comercial, follow-up, transferência humana,
  mensagens de saudação) sem precisar mexer em código ou redeployar.
- **Logs** — eventos e erros de integração (WhatsApp, IA, webhook, banco, cron) para
  diagnóstico.

## Regras de negócio implementadas (resumo)

- Atendimento 24/7 pela IA; horário humano configurado das **7h às 18h**
  (`BUSINESS_HOURS` em `/admin/settings`, fuso `America/Sao_Paulo`).
- Uma pergunta de qualificação por vez, nunca uma lista inteira de uma vez.
- Nunca inventa preço, prazo, medidas, garantias, tempo de mercado, frete, instalação ou
  qualquer dado não cadastrado — sempre indica que vai confirmar com a equipe.
- Reconhece intenção mesmo fora de um menu numérico (ex: cliente já manda "quero orçamento
  de moldura para janela").
- Classifica internamente a intenção de cada mensagem (uso interno, nunca exposto ao
  cliente) para facilitar filtros no painel.
- Analisa fotos enviadas pelo cliente (quando suportado) sem inventar medidas a partir da
  imagem.
- Identifica lead quente x frio e ajusta a condução da conversa.
- Transfere para atendimento humano nos casos previstos (negociação de preço, reclamação,
  dúvida técnica complexa, análise de projeto, pergunta fora da base de conhecimento etc.)
  e para de responder automaticamente até a equipe reativar pelo painel.
- Follow-up automático (cron horário) para leads sem resposta, respeitando limite de
  tentativas, intervalo mínimo entre elas e horário comercial — nunca em leads pausados ou
  em atendimento humano, e interrompido automaticamente assim que o cliente responde.

## Testes

```bash
npm test
```

Cobre: cálculo de horário comercial, verificação de assinatura HMAC do webhook, montagem
do histórico de conversa para a IA (merge de mensagens consecutivas, placeholders de
mídia) e o prompt da IA (nunca inventa tempo de mercado/preço, reflete dados já
conhecidos do lead, indica corretamente dentro/fora do horário comercial).

## Limitações conhecidas / próximos passos

- O webhook processa a mensagem e chama a IA de forma síncrona antes de responder à Meta.
  Isso é adequado para o volume inicial; em alto volume, considere mover o processamento
  para uma fila (ex: Upstash QStash, Inngest) e responder ao webhook imediatamente.
- Login administrativo é single-user via variáveis de ambiente. Para múltiplos atendentes
  com permissões distintas, adicionar um modelo `AdminUser` com senha hasheada (bcrypt) e
  registro de autoria por usuário é o próximo passo natural.
- Mensagens de áudio/vídeo recebidas não são transcritas/analisadas — a IA pede
  educadamente que o cliente escreva o que precisa. Para transcrever áudio, integrar um
  serviço de speech-to-text no `inboundMapper`.
- O template de follow-up (`FOLLOW_UP_SETTINGS.messageTemplateName`) precisa existir e
  estar aprovado no WhatsApp Manager antes de ativar follow-up fora da janela de 24h.
