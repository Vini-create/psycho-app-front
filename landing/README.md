# Landing da Siouve

A página pública de `siouve.com`. Ela é a porta de entrada dos dois públicos:
quem chega no domínio raiz sai daqui para `app.siouve.com` ou para
`pro.siouve.com`.

```
npm install
npm run dev        # servidor de desenvolvimento — http://localhost:3002
npm run build      # tsc -b && vite build  →  dist/
npm run preview    # serve o dist/ na mesma porta
npm run fonts      # rebaixa as fontes e reescreve src/styles/fonts.css
npm run cf:preview # build + wrangler dev, o runtime real da Cloudflare
npm run cf:deploy  # build + wrangler deploy
```

Da raiz do repositório, `pnpm dev:design` sobe os três de uma vez:

| | |
| --- | --- |
| `localhost:3000` | app do paciente |
| `localhost:3001` | painel profissional |
| `localhost:3002` | **esta landing** |

A porta mora na `vite.config.ts`, não nos scripts, para que rodar daqui e
rodar da raiz dêem no mesmo lugar. Como a landing está fora do workspace, ela
tem `node_modules` próprio: `landing/scripts/dev.mjs` instala sozinho na
primeira vez, para que um `pnpm install` na raiz não deixe o `dev:design`
quebrado com um "vite: not found".

## Por que fora do workspace

A pasta está deliberadamente fora de `apps/*` e não participa do
`pnpm-workspace.yaml`. Isso significa que ela **não resolve `@sinapsa/ui`**, e
que tudo que vem do design system existe aqui como cópia declarada:

| Arquivo | Origem |
| --- | --- |
| `src/styles/tokens.css` | `packages/ui/src/styles/tokens.css`, recorte dark |
| `src/styles/base.css` | `packages/ui/src/styles/base.css` |
| `src/lib/folder-shape.ts` | `packages/ui/src/components/shell/folder-shape.ts` |
| `src/lib/symbol-path.ts` | extraído de `packages/ui/src/components/BrandLogo.tsx` |
| `src/components/BrandLogo.tsx` | `packages/ui/src/components/BrandLogo.tsx` |

São cópias, não adaptações livres: os valores são os mesmos do produto.
**Se o design system mudar, estes cinco arquivos precisam ser trazidos à mão.**

## Decisões

**Dark-only.** Não é omissão: é compromisso de arte. O material de referência
é todo escuro e o cromo do WebGL só tem leitura sobre carvão. Os pastéis são
os profundos do §28 — superfícies próprias do dark, não os do light
escurecidos.

**A marca é lida, não redesenhada.** O mesmo `d` aprovado alimenta o logotipo
em DOM e a peça 3D. A única licença está documentada em
`src/webgl/symbolGeometry.ts`: a malha usa o contorno simplificado com desvio
máximo de 0,096% do viewBox, porque o traçado original é um bitmap vetorizado
e o bevel transformava cada degrau de 1px numa faceta que o cromo reflete
como chiado. O logotipo em DOM usa o path original, sem simplificação.

**A animação nunca esconde conteúdo.** O estado escondido do `.reveal` só
existe sob `[data-anim="ready"]`, atributo que o JS escreve depois de decidir
que vai animar. Com JS lento ou sob `prefers-reduced-motion`, a página inteira
está visível — MOTION.md §6.

Isso é sobre a camada de MOVIMENTO, não sobre renderização. A landing é um SPA
Vite renderizado no cliente: sem JavaScript o `#root` fica vazio. O que cobre
esse caso é um `<noscript>` no `index.html` com a marca, a tese, o aviso de
limite e — o que mais importa — os dois links de entrada, que são âncoras
comuns e funcionam sem script. Se a página existe para encaminhar aos
aplicativos, essa função não pode depender de JS.

*Se um dia o SEO exigir HTML com o texto real no primeiro byte, o caminho é
pré-renderizar no build com `react-dom/server`. Os componentes já são
compatíveis (todo acesso a `document` vive em efeito), e o `Stage` é `lazy`.
Não foi feito.*

**A tela de abertura não pode prender ninguém.** Três camadas garantem isso: o
`Preloader` sai quando as fontes e o primeiro quadro do WebGL chegam; um teto
de 4,5s dentro dele dispara mesmo que uma das etapas trave; e um `setTimeout`
inline de 8s no `index.html` a remove mesmo que o bundle nunca execute.

**Sob movimento reduzido a peça 3D não é desenhada.** O canvas é `fixed`: um
quadro estático dela ficaria parado sobre a página inteira e cobriria o texto
das seções seguintes, já que o fade da rolagem nunca dispara. O campo de
orbes fica, porque campo parado continua sendo fundo.

**As fontes são auto-hospedadas.** As quatro famílias vivem em
`public/fonts/` e são declaradas em `src/styles/fonts.css` — arquivo gerado
por `npm run fonts`, não editável à mão. Zero requisição a CDN em runtime,
como nos apps. `index.html` faz preload dos quatro arquivos `latin` que a
primeira dobra desenha; `latin-ext` fica sob demanda pelo `unicode-range`.

**A imagem de Open Graph é gerada de um molde versionado.** `scripts/og.html`
é a arte; `public/og.jpg` é o resultado em 1200×630. Para regerar, abra o
molde num navegador em viewport 1200×630 e exporte como JPEG qualidade 92
(ou use qualquer runner headless). É JPEG e não PNG por medição: o gradiente
escuro custa 395kB em PNG e 67kB em JPEG 92, sem banding visível.

## Deploy

`wrangler.jsonc` configura um Worker de **assets puros** — a landing é um
build estático, então não há `main` nem OpenNext. Os apps precisam do OpenNext
porque são Next com SSR; aqui o runtime de assets da Cloudflare serve tudo
sozinho.

`not_found_handling` é `"none"` de propósito: caminho inexistente devolve 404
de verdade. A alternativa (`single-page-application`) responderia 200 com o
index em qualquer URL, transformando erro de digitação em página indexável.
A navegação interna desta página é por âncora, não por rota.

`public/_headers` define o cache. As fontes têm nome estável, então ficam em
uma semana com revalidação em vez de um ano imutável — um `npm run fonts`
reescreve o conteúdo sob o mesmo nome, e um cache longo serviria a versão
velha. O JS e o CSS não aparecem lá porque o Vite já carimba hash no nome
deles e o runtime os marca como imutáveis sozinho.

**O que ainda não foi feito, e é decisão sua:** nenhum `wrangler deploy` foi
executado, e DNS e rota de `siouve.com` não foram configurados. `workers_dev`
está `false`, como nos dois apps — o domínio é ligado no painel.
