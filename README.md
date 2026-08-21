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

- **Paciente:** workspace único da Sinapsa em `/chat`, Minha rede e conta.
- **Profissional:** pacientes, dashboards, métricas, relatórios e tendências de
  humor relatado.
- O paciente recebe apenas solicitações com profissional e período. Ao confirmar
  o envio em Minha rede, o relatório é gerado e entregue somente ao profissional.

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
- **Relatório exige solicitação profissional e confirmação do paciente.** A
  solicitação fixa o período e exige vínculo, escopo e assinatura vigentes.
  Somente a confirmação em Minha rede inicia a geração; o conteúdo fica apenas
  no workspace do profissional solicitante.
