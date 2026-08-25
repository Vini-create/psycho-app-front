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
| `duration.folder` | 0.36s | troca de pasta (a mais longa do produto) |
| `duration.page` | 0.30s | entrada de conteúdo |

| Ease | Curva | Uso |
| --- | --- | --- |
| `ease.enter` | `power3.out` | tudo que entra em cena |
| `ease.exit` | `power2.in` | tudo que recua |
| `ease.folder` | `power3.inOut` | objeto pesado saindo e voltando ao repouso |
| `ease.ui` | `power2.out` | microinteração |

`distance` (1/2/4/6/8px), `scale` (0.985–0.995), `stagger` (30–55ms) e
`layer` (z-index de `base` a `toast`) completam o conjunto.

A geometria física da pasta — altura da aba, raios, ombro, degrau da pilha —
não mora aqui: ela é desenho, não movimento, e vive em
`packages/ui/src/components/shell/folder-shape.ts`.

Os tokens CSS equivalentes (`--duration-tab`, `--ease-sinapsa`) continuam em
`packages/ui/src/styles/tokens.css` e governam o que é feito por CSS.

---

## 3. Arquitetura

```
apps/*/src/app/(app)/layout.tsx    shell persistente (não desmonta na troca de rota)
  └── AppShell                     resolve pathname → pasta ativa
        └── AppFrame               a bancada: fundo, cabeçalho, margem negativa
              ├── FolderStack            a pilha: profundidade, z-index, coreografia
              │     └── FolderSheet ×4   uma pasta = uma silhueta = aba + corpo
              └── FolderDock             doca do mobile, abaixo de `sm`
```

```
packages/ui/src/motion/
├── gsap.ts               registro único de plugins (Flip, useGSAP)
├── tokens.ts             durações, eases, amplitudes, camadas
├── media.ts              desktop | mobile | reduced
├── stack-motion.ts       coreografia da pilha + entrada do conteúdo
├── useLateReveals.ts     conteúdo que chega depois do skeleton
├── useActiveIndicator.ts indicador que viaja entre itens (Flip)
├── useEnterOnMount.ts    entrada de um elemento novo (mensagem)
└── useDialogMotion.ts    abertura e fechamento de <dialog>
```

Uma página não importa GSAP. Ela marca blocos com `.reveal` e listas com
`data-motion-list`, e o shell cuida do resto.

---

## 4. Ciclo de vida da troca de pasta

A troca é o gesto de puxar uma pasta da pilha para a frente. Como aba, corpo,
textura, sombra e conteúdo vivem dentro do MESMO elemento (`FolderSheet`), a
timeline só escreve `y` e `scale` na raiz de cada folha — não existe caminho
pelo qual a aba possa se descolar do corpo no meio do movimento.

```
t = 0     pointerdown na aba
          └─ a pasta de destino sobe 3px: a intenção, antes da rota

t ≈ 40ms  o router navega. O React comita a rota nova e, no mesmo frame,
          o z-index e a ordem do DOM já colocam a pasta escolhida na frente

          ├─ FASE 1  ela se desprende: y -7px, scale 1.004 (72ms, power2.out)
          ├─ FASE 2  as demais recuam para seus degraus (238ms, power3.inOut)
          ├─ FASE 3  ela desce à frente, passando 1.2px do repouso (230ms)
          └─ FASE 4  assenta o 1.2px de volta (65ms, power2.out) — peso

t ≈ 137ms o conteúdo fica disponível: opacity 0.35 → 1, y 5px → 0
t ≈ 165ms blocos `.reveal` entram com stagger de 55ms
t ≈ 180ms itens de `data-motion-list`, stagger somando no máximo 200ms
t ≈ 360ms idle. Todos os inline styles de transform removidos por clearProps.
```

O total fica em ~360ms. Peso não se comunica com duração — se comunica com a
curva e com o assentamento do fim. Uma pasta que leva meio segundo para
chegar não parece mais pesada, parece mais lenta, e esta é a interação que
mais se repete no dia de quem usa o produto.

### Por que o conteúdo entra depois, e nunca antes

O protagonista do movimento é a pasta. Se o texto animasse junto, a leitura
voltaria a ser "página trocando" — que é exatamente o que a pilha existe para
não ser. O conteúdo só aparece quando a folha já está quase parada.

### Por que a aba não é animada separadamente

Ela não é um objeto. Não há "abrir a aba": há mover a pasta, e a aba vai
junto porque está dentro dela.

A PINTURA da folha, essa sim, são duas peças — por custo, não por forma. A
faixa de topo tem altura fixa e concentra tudo o que a silhueta tem de
complicado (aba, ombros côncavos, cantos de cima), recortada por
`clip-path`; daí para baixo a pasta é um retângulo que um `border-radius`
resolve. As duas compartilham `paperSurface()`: mesma cor, mesmo recurso de
ladrilho de granulado, mesmo blend, com a fase vertical deslocada pela altura
da aba. A junção é invisível porque as duas superfícies são literalmente o
mesmo papel.

A versão anterior desenhava a folha inteira como um SVG do tamanho da página.
Era mais simples de explicar e igualmente bonita, mas toda mudança de altura
do conteúdo mandava rasterizar quatro silhuetas do tamanho do documento —
justamente no frame em que a troca começava. Medido: quatro frames acima de
24ms por navegação, o pior em 121ms. Depois da separação, o pior frame ficou
em 27ms, idêntico ao piso medido com a pintura das pastas desligada.

Flip continua reservado para onde a geometria é de fato desconhecida: **o
indicador da conversa ativa** (`useActiveIndicator`), que viaja entre itens de
alturas diferentes ditadas pelo texto.

### Interrupção

Cliques rápidos não acumulam nada:

- cada troca começa matando as tweens das folhas (`gsap.killTweensOf`) e
  parte da posição em que os objetos estão, não de uma origem imaginária;
- os deslocamentos da fase 1 são relativos (`y: "-=7"`), o que torna o gesto
  interrompível sem salto;
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
