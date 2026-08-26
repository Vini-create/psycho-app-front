# Modo de desenho — TEMPORÁRIO

Roda os dois apps com dados falsos e sem passar por login, para validar
design, fluxo e componentes antes de ligar o backend.

```bash
npm run dev:design          # os dois apps
npm run design:patient      # só o paciente  · :3000
npm run design:professional # só o profissional · :3001
```

## A regra que este modo respeita

**A tela é a mesma da produção.** O mock entra só no `fetch` do api-client, e
em nenhum outro lugar. Acima dele tudo roda igual: o single-flight do refresh,
o mapa de `error.code`, o TanStack Query, os gates de auth/MFA/consentimento,
cada componente e cada página.

Nenhum arquivo de página, componente ou gate tem qualquer condicional de modo
de desenho. Se você vir um `if (designMock)` dentro de uma tela, é bug.

Auth não é *contornado* — é *satisfeito*: o mock responde ao `/refresh` e ao
`/me` com uma conta válida, então os gates aprovam pelo caminho normal.

## O que dá para exercitar

Os fixtures foram montados para cobrir estados, não só o caminho feliz:

- conversa com separador de dia, resposta longa e **uma geração que falhou**
  (mostra a afordância de "Tentar novamente");
- relatórios profissionais com timeline, pontos observados e gráfico de humor;
- paciente que **revogou** o consentimento de relatórios (`conn-teresa`),
  que faz a tela do profissional explicar em vez de travar;
- solicitação de relatório pendente em Minha rede, com período fechado e envio
  explícito pelo paciente;
- convites aceito / pendente / expirado; acompanhamento encerrado.
- **check-in diário** em todos os estados: dois check-ins ativos de
  profissionais diferentes (Rui e Marta — é o que torna visível o rótulo com
  o nome e o seletor da colheita), o dia de hoje sempre em aberto na tela
  inicial, três semanas de série com queda no meio e dias sem resposta, um
  check-in **pendente de aceite** em Minha rede, um pedido de colheita
  aguardando decisão e um retrato já entregue no painel profissional.

O estado é mutável em memória: enviar mensagem, renomear conversa, solicitar e
enviar relatório, criar convite, encerrar vínculo, responder check-in, aceitar
ou recusar um check-in novo e autorizar a colheita mudam as telas. Recarregar
a página zera tudo.

As médias, o melhor e o pior dia do check-in são calculados pelo mock com a
mesma conta do backend (`buildCollection` em `packages/mocks/src/store.ts`).
No produto real esse cálculo nunca acontece no cliente — o mock só o repete
para o modo de desenho ver números coerentes com a série das respostas.

### Forçar o estado da assinatura

Solicitação de contexto só pode ser criada por profissional assinante. A geração
só ocorre após o paciente confirmar o envio em Minha rede. Para revisar as telas
bloqueadas sem backend nem cobrança real,
o app profissional aceita `?plano=` em qualquer rota:

| Parâmetro | Estado |
|---|---|
| `?plano=ativo` | assinatura ativa |
| `?plano=trial` | período de avaliação (padrão) |
| `?plano=pendente` | pagamento pendente |
| `?plano=inativo` | cancelada |
| `?plano=nenhum` | sem assinatura |

Exemplo: <http://localhost:3001/pacientes/conn-rui?plano=inativo>.

Há latência artificial (220ms, 900ms no envio de mensagem) — sem ela os
skeletons e spinners nunca apareceriam.

## Por que produção não corre risco

`@sinapsa/mocks` resolve para um **stub vazio** por padrão. Só o `dev:design`
liga o pacote real, via `resolveAlias` no `next.config.ts` de cada app.

A inversão é deliberada: esquecer a flag produz um build **sem** mocks, em vez
de um build com dados falsos de paciente. Não dependemos de tree-shaking —
um chunk de produção com "Helena Marques" dentro é um risco, não uma questão
de tamanho.

Verificação:

```bash
pnpm build
grep -rl "Helena Marques" apps/*/.next/static | wc -l   # precisa dar 0
```

## Como remover, quando o backend entrar

```bash
rm -rf packages/mocks
rm apps/patient/src/lib/mocks-stub.ts apps/professional/src/lib/mocks-stub.ts
rm DESIGN_MODE.md
```

Depois, em cada app:

1. `package.json` — apagar o script `dev:design` e a devDependency
   `@sinapsa/mocks`; no `package.json` da raiz, apagar `dev:design`,
   `design:patient` e `design:professional`.
2. `next.config.ts` — apagar `designMock`, `mocksAlias`, o bloco `turbopack`,
   o bloco `webpack`, e tirar `"@sinapsa/mocks"` de `transpilePackages`.
3. `src/lib/api.ts` — apagar o `import { createMockFetch }`, o bloco
   `designMock` com o `console.info`, e a linha `fetchImpl:`.

Opcional: `fetchImpl` em
[`packages/api-client/src/client.ts`](packages/api-client/src/client.ts) pode
ficar. É um ponto de injeção de três linhas, sem custo, e serve para testes de
integração depois.

Nenhum outro arquivo precisa mudar — é essa a vantagem de ter mocado só o
transporte.
