# Sinapsa — Frontend

Monorepo com os dois aplicativos da plataforma, consumindo a API Go em
[`anamnesys-app-back`](../anamnesys-app-back).

```text
apps/patient          Next 16 · porta 3000 · mobile-first · o companion
apps/professional     Next 16 · porta 3001 · desktop-first · o painel
packages/ui           design system: tokens, tema, primitivos
packages/api-client    client tipado, token em memória, refresh single-flight
packages/config        eslint compartilhado
```

Stack: Next 16 (App Router) · React 19 · TypeScript · Tailwind v4 · GSAP ·
TanStack Query · Vitest.

## Superfícies do produto

- **Paciente:** workspace único da Sinapsa em `/chat`, check-in diário na tela
  inicial, Minha rede e conta.
- **Profissional:** pacientes, dashboards, métricas, relatórios, check-in diário
  e tendências de humor relatado.
- O paciente recebe apenas solicitações com profissional e período. Ao confirmar
  o envio em Minha rede, o relatório é gerado e entregue somente ao profissional.
- O check-in diário é escrito pelo profissional (cinco alternativas por
  pergunta, de 1 a 5) e exige dois aceites do paciente, em momentos diferentes:
  um para passar a responder, outro para entregar as respostas de um período.
  Médias, melhor e pior dia são calculados no backend e congelados no aceite.

## Rodar

```bash
# 1. backend
cd ../anamnesys-app-back && docker compose up -d
curl -s localhost:8080/health          # {"status":"ok"}

# 2. frontend
pnpm install
cp apps/patient/.env.example apps/patient/.env.local
cp apps/professional/.env.example apps/professional/.env.local
pnpm dev                               # sobe os dois apps
```

O backend precisa aceitar as duas origens:

```bash
AUTH_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
AUTH_WEBAUTHN_ORIGINS=http://localhost:3001
AUTH_WEBAUTHN_RP_ID=localhost
AUTH_COOKIE_SECURE=false
```

Só o app profissional usa WebAuthn. O RP ID ignora porta, então `localhost`
serve para os dois; as origens é que precisam bater exatamente.

## Verificação

```bash
pnpm test        # Vitest
pnpm lint
pnpm typecheck
pnpm build
pnpm contrast    # valida os pares de cor contra WCAG 2.2 AA
```

Revisão visual do design system: <http://localhost:3000/design-system>
(exige `NEXT_PUBLIC_DESIGN_PREVIEW=true`).

## Configuração de deploy

As variáveis `NEXT_PUBLIC_*` são embutidas no bundle no momento do build. Use
[`apps/patient/.env.production.example`](apps/patient/.env.production.example)
e
[`apps/professional/.env.production.example`](apps/professional/.env.production.example)
como referência e configure os valores na plataforma antes de executar
`pnpm build`. O build falha se `NEXT_PUBLIC_API_URL` estiver ausente ou se os
mocks estiverem ligados em produção.

### Cloudflare Workers

O monorepo usa dois Workers independentes, empacotados com OpenNext. No painel
da Cloudflare, mantenha `Root directory` como `/` para que o pnpm encontre os
pacotes compartilhados.

Paciente (`sinapsa-patient`):

```text
Build command:   pnpm --filter @sinapsa/patient cf:build
Deploy command:  pnpm --filter @sinapsa/patient cf:deploy
Version command: pnpm --filter @sinapsa/patient cf:version
Root directory:  /
```

Profissional (`sinapsa-professional`):

```text
Build command:   pnpm --filter @sinapsa/professional cf:build
Deploy command:  pnpm --filter @sinapsa/professional cf:deploy
Version command: pnpm --filter @sinapsa/professional cf:version
Root directory:  /
```

As variáveis `NEXT_PUBLIC_*` devem ser cadastradas como build variables antes
do build; elas são incorporadas ao bundle pelo Next.js.

No backend, configure no mínimo:

```bash
APP_ENV=production
AUTH_ALLOWED_ORIGINS=https://app.example.com,https://pro.example.com
AUTH_COOKIE_SECURE=true
AUTH_WEBAUTHN_RP_ID=pro.example.com
AUTH_WEBAUTHN_ORIGINS=https://pro.example.com
COMPANION_ENABLED=true
COMPANION_BASE_URL=https://ai-internal.example.com
AI_CONTEXT_WORKER_ENABLED=true
AI_PROVIDER=openai
AUTH_GOOGLE_CLIENT_ID=replace-with-google-web-client-id.apps.googleusercontent.com
EMAIL_PROVIDER=brevo
EMAIL_BREVO_API_KEY=replace-with-brevo-api-key
EMAIL_FROM_NAME=Sinapsa
EMAIL_FROM_ADDRESS=contato@example.com
EMAIL_PATIENT_APP_URL=https://app.example.com
EMAIL_PROFESSIONAL_APP_URL=https://pro.example.com
EMAIL_WORKER_ENABLED=true
```

`AI_OPENAI_API_KEY`, `COMPANION_API_KEY`, chaves de JWT/cifra e credenciais do
PostgreSQL devem vir do secret manager. Frontends e API devem permanecer sob o
mesmo site registrável (por exemplo `app.example.com`, `pro.example.com` e
`api.example.com`) para o refresh cookie `SameSite=Lax` funcionar no navegador.
Nos dois builds Next, configure também `NEXT_PUBLIC_GOOGLE_CLIENT_ID` com o mesmo
Web Client ID autorizado no Google Cloud para as origens dos dois aplicativos.

Sistema de movimento — princípios, tokens e o ciclo de vida da troca de
pasta: [MOTION.md](MOTION.md).

## Decisões que não são negociáveis

Estas vieram do contrato da API e do [design.md](design.md); mexer nelas quebra
segurança ou acessibilidade, não só estilo.

- **O access token vive só em memória.** Nada de `localStorage`,
  `sessionStorage` ou cookie criado por JavaScript. O refresh token é opaco e
  `HttpOnly` — o JS nunca o lê, só manda `credentials: "include"`.
- **Refresh é single-flight.** Vários `401` simultâneos disparam uma única
  chamada a `/refresh`.
- **Fluxo se decide por `error.code`**, nunca comparando `error.message`. O
  mapa fica em [`packages/api-client/src/errors.ts`](packages/api-client/src/errors.ts).
- **A UI do chat se guia por `assistant_status`**, nunca por `ai_model` ou
  `ai_provider` — esses existem só para rastreabilidade.
- **O rascunho do chat sobrevive a falhas de envio.**
- **Uma `Idempotency-Key` por ação de envio**, reusada nos retries de rede.
- **Componentes consomem só tokens semânticos.** Nunca um hex, nunca um
  primitivo (`paper-*`, `ink-*`, `purple-*`) direto.
- **Estado nunca depende só de cor** — sempre cor + rótulo + forma.
- **Conteúdo crítico não vive só em toast.** Para isso existe o `<Alert>`.
- **Sombra só em superfície flutuante** (modal, drawer, menu).
- **Motion é do sistema, não da tela.** Páginas marcam `.reveal` e
  `data-motion-list`; quem anima é o shell. Nada de `gsap` solto em página,
  nada de duração ou ease literal fora de
  [`packages/ui/src/motion/tokens.ts`](packages/ui/src/motion/tokens.ts).
- **Relatório exige solicitação profissional e confirmação do paciente.** A
  solicitação fixa o período e exige vínculo, escopo e assinatura vigentes.
  Somente a confirmação em Minha rede inicia a geração; o conteúdo fica apenas
  no workspace do profissional solicitante.
