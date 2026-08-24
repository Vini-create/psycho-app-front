# Motion system

O movimento do Sinapsa tem um único assunto: **a pasta**.

A aplicação é um arquivo de pastas físicas apoiado sobre uma mesa. Trocar de
área não é carregar outra página — é colocar uma pasta para trás e trazer
outra para a frente. Toda animação existe para sustentar essa leitura ou para
sair da frente dela.

Implementação: GSAP 3 + `@gsap/react`, em `packages/ui/src/motion/`.

---

## 1. Princípios

1. **Movimento é profundidade, não deslocamento.** As amplitudes vivem entre
   1px e 8px. Acima disso o cérebro lê "slide", não "objeto físico".
2. **Rápido.** Nada passa de 420ms, e só a troca de pasta chega perto disso.
3. **A URL manda.** A pasta desenhada é derivada do `pathname`. Não existe
   estado paralelo de "aba ativa".
4. **A navegação nunca espera a animação.** O clique dispara o recuo e a rota
   ao mesmo tempo.
5. **GSAP move; os tokens do design system colorem.** Nenhuma timeline
   escreve cor. Identidade cromática é CSS var, e continua funcionando em
   claro, escuro e movimento reduzido.
6. **Repouso é CSS.** Sem JavaScript, com JS lento ou sob `prefers-reduced-
   motion`, a interface está correta e legível. O GSAP só faz a ponte entre
   dois estados que o CSS já sabe desenhar.
7. **Sem decoração.** Nada de parallax, glow, blur animado, tilt, texto
   digitando ou animação infinita. Isto é uma ferramenta de saúde mental.

---

## 2. Tokens — `motion/tokens.ts`

Nenhum arquivo do produto escreve duração, ease ou amplitude literal.

| Token | Valor | Uso |
| --- | --- | --- |
| `duration.instant` | 0.12s | press, feedback tátil |
| `duration.fast` | 0.18s | hover, foco, saída de overlay |
| `duration.ui` | 0.26s | seleção, indicador, mensagem nova |
| `duration.folder` | 0.42s | troca de pasta (a mais longa do produto) |
| `duration.page` | 0.30s | entrada de conteúdo |

| Ease | Curva | Uso |
| --- | --- | --- |
| `ease.enter` | `power3.out` | tudo que entra em cena |
| `ease.exit` | `power2.in` | tudo que recua |
| `ease.folder` | `power3.inOut` | objeto pesado saindo e voltando ao repouso |
| `ease.ui` | `power2.out` | microinteração |

`distance` (1/2/4/6/8px), `scale` (0.985–0.995), `stagger` (30–55ms),
`folderGeometry` (46/38px no trilho, 64/56px na doca) e `layer` (z-index de
`base` a `toast`) completam o conjunto.

Os tokens CSS equivalentes (`--duration-tab`, `--ease-sinapsa`) continuam em
`packages/ui/src/styles/tokens.css` e governam o que é feito por CSS.

---

## 3. Arquitetura

```
apps/*/src/app/(app)/layout.tsx    shell persistente (não desmonta na troca de rota)
  └── AppShell                     resolve pathname → pasta ativa + tom
        └── AppFrame               moldura + folha colorida + corpo da pasta
              ├── FolderMotionProvider   controlador da transição
              ├── FolderNav / FolderDock abas (trilho no desktop, doca no mobile)
              └── [data-folder-body]     onde o conteúdo da rota entra
```

```
packages/ui/src/motion/
├── gsap.ts               registro único de plugins (Flip, useGSAP)
├── tokens.ts             durações, eases, amplitudes, camadas
├── media.ts              desktop | mobile | reduced
├── folder-motion.ts      timelines de entrada/saída da pasta
├── tab-motion.ts         abrir e fechar aba
├── FolderMotion.tsx      provider + contexto + ciclo de vida
├── useLateReveals.ts     conteúdo que chega depois do skeleton
├── useActiveIndicator.ts indicador que viaja entre itens (Flip)
├── useEnterOnMount.ts    entrada de um elemento novo (mensagem)
└── useDialogMotion.ts    abertura e fechamento de <dialog>
```

Uma página não importa GSAP. Ela marca blocos com `.reveal` e listas com
`data-motion-list`, e o shell cuida do resto.

---

## 4. Ciclo de vida da troca de pasta

```
t = 0     clique na aba
          ├─ requestFolder(destino): o corpo da pasta atual recua
          │  (opacity → 0, y +4px, scaleY 0.997, 180ms, power2.in)
          └─ o router navega em paralelo — nada é adiado

t ≈ 60ms  a rota resolve. Em um layout effect, antes do paint:
          ├─ a folha assume o tom da nova pasta (troca direta, sem
          │  interpolação de background)
          ├─ ABA:  a que sai volta à altura de repouso (power3.inOut, 260ms)
          │        a que entra cresce de 38 → 46px presa à base
          │        (power3.out, 360ms) — a aba lidera a troca
          ├─ OMBROS: os filetes côncavos que costuram aba e folha entram
          │        em 260ms, depois de a aba já ter subido
          └─ CORPO: opacity 0 → 1, y 6px → 0, scaleY 0.994 → 1 com
                   transform-origin no topo (dobradiça), +4px de deriva
                   lateral no sentido da pasta de destino

t ≈ 180ms blocos `.reveal` entram com stagger de 55ms
t ≈ 220ms itens de `data-motion-list`, stagger somando no máximo 200ms
t ≈ 420ms idle. Todos os inline styles removidos por clearProps.
```

Se a rota não vier (um portão redirecionou, a navegação foi cancelada), um
temporizador de 900ms devolve o corpo ao repouso. O conteúdo nunca fica preso
em `opacity: 0`.

### Por que o corpo, e não a folha

A folha (`sheet`) carrega a cor da pasta e encosta na moldura. Escalá-la
abriria uma fresta com a cor da mesa aparecendo por meio segundo. O corpo
(`[data-folder-body]`) é transparente sobre ela: qualquer folga que sua escala
produza mostra a própria cor da pasta. É o que faz a leitura ser "folha
assentando sob a aba", e não "div encolhendo".

### Por que as abas não usam Flip

A geometria de repouso das duas posições é conhecida e constante — 46px
aberta, 38px fechada, `folderGeometry`. Não há o que medir: uma razão entre
dois números do design system anima sem tocar no layout, sem `position:
absolute` temporário, e continua correta se a fonte terminar de carregar ou a
viewport mudar de tamanho no meio do movimento.

Flip é usado onde a geometria é de fato desconhecida: **o indicador da
conversa ativa** (`useActiveIndicator`), que viaja entre itens de alturas
diferentes ditadas pelo texto.

### Interrupção

Cliques rápidos não acumulam nada:

- `useGSAP` reverte o contexto anterior antes de montar o próximo — a pasta
  interrompida volta ao estado de CSS e a nova animação parte dali;
- todas as tweens usam `overwrite: "auto"`;
- o `clearProps` do fim garante que o DOM não fique dependente de inline
  styles transitórios.

---

## 5. Como adicionar uma pasta nova

1. Acrescente o destino em `NAV`, no `AppShell` da app
   (`href`, `label`, `icon`, `color`).
2. Crie a rota dentro do grupo `(app)` — ela herda o shell persistente.
3. Se a cor for nova, declare o tom em `tokens.css`
   (`[data-folder-tone="…"]`) e em `FOLDER_COLORS`.

Não há nada de motion a escrever: `FOLDER_ORDER` sai de `NAV` e governa o
sentido do deslocamento; a coreografia é a mesma para todas as pastas.

## 6. Como animar um componente

| Situação | Ferramenta |
| --- | --- |
| bloco que entra com a página | classe `.reveal` |
| lista que entra com stagger | `data-motion-list` no container |
| elemento que aparece sozinho | `useEnterOnMount(ref)` |
| indicador que viaja entre itens | `useActiveIndicator(scope, flipId, key)` |
| modal / drawer | `useDialogMotion(ref, open)` |
| hover, press, foco | CSS, com `--duration-hover` e `--ease-sinapsa` |

Regra prática: se a animação couber em uma transição CSS de um estado para
outro, ela é CSS. GSAP entra quando há sequência, coordenação entre elementos
ou necessidade de interromper.

Uma coisa a nunca fazer: aplicar `transition` no mesmo elemento e na mesma
propriedade que uma timeline GSAP escreve. É por isso que hover e press das
abas moram no `<a>` externo, e não na forma colorida.

---

## 7. Responsividade

`resolveMotionVariant()` devolve `desktop`, `mobile` ou `reduced` no instante
em que a animação começa.

- **desktop** — amplitudes de 4–8px, deriva lateral direcional, hover.
- **mobile** — 2–4px, sem deriva lateral, sem hover, durações menores; a doca
  cresce para baixo em vez de para cima.
- **reduced** — ver abaixo.

A leitura é pontual, e não um contexto de `gsap.matchMedia()`, porque as
coreografias do shell são disparos únicos: dentro de um contexto de
matchMedia, atravessar o breakpoint de 640px reencenaria a entrada da página
inteira. Nenhuma delas guarda medida de layout — são transform e opacity,
limpos ao final —, então redimensionar durante a transição não deixa resíduo
e o CSS volta a ser a autoridade sobre o layout.

## 8. Movimento reduzido

`prefers-reduced-motion: reduce` remove **todo** deslocamento espacial,
escala e stagger. Sobra uma troca de opacidade de 120ms na pasta e nada mais.

A navegação continua idêntica: a aba muda de altura pela regra de CSS, os
ombros aparecem, a cor da folha troca. A metáfora de pasta é geométrica —
ela não depende da animação para existir.

## 9. Acessibilidade

- As abas continuam sendo `<a>` reais dentro de `<nav>`, com `aria-current="page"`.
  Teclado, leitor de tela e clique do meio funcionam sem passar por JavaScript.
- Nenhuma animação toma foco, e nenhuma bloqueia digitação.
- O estado ativo é forma + posição + `aria-current` — nunca só cor.
- O handler de clique ignora ctrl/cmd/shift/alt e botão do meio: abrir em
  outra aba não faz esta recuar.

## 10. Performance

- Só `transform` e `opacity` são animados.
- Nenhum `will-change` global.
- Uma única leitura de layout, no `Flip` do indicador de conversa.
- `clearProps` ao final de cada timeline: o DOM em repouso não carrega inline
  styles.
- Skeletons animam junto com a pasta; quando os dados chegam, um
  `MutationObserver` (`useLateReveals`) anima só os blocos novos, uma vez
  cada.

## 11. O que NÃO deve ser animado

Formulários inteiros, histórico de conversa ao abrir, gradientes,
backgrounds em interpolação longa, tabelas, valores numéricos, ícones em
loop, o cursor, a rolagem. E nada em 3D: sem `rotateX`, `perspective` ou
cartão girando.
