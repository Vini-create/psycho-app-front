# Sinapsa. — Regras de design

**Versão:** 0.12 · **Status:** provisório

## 1. Cores

### Neutros

| Token | Hex | Uso |
|---|---:|---|
| `paper-0` | `#FCFBF9` | controles e superfícies elevadas |
| `paper-50` | `#F6F4F1` | fundo principal claro |
| `paper-100` | `#ECE9ED` | fundo alternativo neutro |
| `paper-200` | `#D8D3DA` | áreas secundárias neutras |
| `paper-300` | `#B8ADB9` | neutro malva para detalhes |
| `paper-400` | `#756878` | controle acessível sem ocre |
| `ink-500` | `#6B626D` | texto secundário |
| `ink-700` | `#403941` | texto de apoio forte |
| `ink-900` | `#1D191E` | texto principal e fundo escuro |

O bege antigo foi removido dos detalhes da interface. Bordas, superfícies de
controle, ícones, divisores, gráficos e estados usam branco, neutros malva,
roxos ou cores semânticas — nunca dourado, ocre ou âmbar.

### Roxos

| Token | Hex | Uso |
|---|---:|---|
| `purple-primary` | `#9B86C4` | cor central, gráficos e ações no dark |
| `purple-strong` | `#766093` | ações e texto de marca no light |
| `purple-dark` | `#5F4B73` | hover, pressed e superfícies escuras |
| `purple-soft` | `#C5B6DC` | destaques claros e foco no dark |
| `purple-muted` | `#DDD3E8` | seleção e cards suaves |

### Semânticas

| Estado | Cor | Fundo |
|---|---:|---:|
| Sucesso | `#2F6B58` | `#EFF7F2` |
| Atenção | `#744E68` | `#F7EDF3` |
| Erro | `#9B3D47` | `#FCF0F1` |
| Informação | `#365F7A` | `#F0F6FA` |

### Regras

- Fundo padrão: `paper-50`.
- Superfícies funcionais usam `paper-0`; branco puro não faz parte da paleta.
- Texto secundário sobre `paper-100` usa `ink-700` ou mais escuro.
- Texto padrão: `ink-900`.
- Botão primário no light: `purple-strong`; hover e pressed: `purple-dark`.
- `purple-primary`, `purple-soft` e `purple-muted` não são usados como texto
  normal sobre fundo claro.
- Texto normal precisa de contraste mínimo `4.5:1`.
- Componentes e texto grande precisam de contraste mínimo `3:1`.
- Estado nunca pode depender apenas de cor.
- Vermelho é exclusivo para erro, risco explícito e ação destrutiva.

### Light mode

| Token semântico | Valor |
|---|---:|
| `bg-canvas` | `#F6F4F1` |
| `bg-surface` | `#FCFBF9` |
| `bg-card` | `#F1EDF4` |
| `bg-subtle` | `#ECE9ED` |
| `text-primary` | `#1D191E` |
| `text-secondary` | `#6B626D` |
| `border-subtle` | `#D8CDD9` |
| `border-control` | `#756878` |
| `action-primary` | `#766093` |
| `action-primary-hover` | `#5F4B73` |
| `action-primary-pressed` | `#5F4B73` |
| `focus-ring` | `#766093` |

### Dark mode

| Token semântico | Valor |
|---|---:|
| `bg-canvas` | `#242527` |
| `bg-subtle` | `#201C22` |
| `bg-surface` | `#28222B` |
| `bg-card` | `#40344A` |
| `bg-elevated` | `#302833` |
| `text-primary` | `#F6F4F1` |
| `text-secondary` | `#C6BCC8` |
| `text-brand` | `#C5B6DC` |
| `border-subtle` | `#5F4B73` |
| `border-control` | `#9B86C4` |
| `action-primary` | `#9B86C4` |
| `action-primary-hover` | `#C5B6DC` |
| `action-primary-pressed` | `#766093` |
| `action-on-primary` | `#242527` |
| `focus-ring` | `#C5B6DC` |

### Semânticas no dark mode

| Estado | Texto/ícone | Fundo |
|---|---:|---:|
| Sucesso | `#8FC8AD` | `#1D3028` |
| Atenção | `#D5A8C5` | `#34242F` |
| Erro | `#E5A0A8` | `#382024` |
| Informação | `#9EC7DE` | `#1D2D36` |

### Regras de tema

- Componentes consomem tokens semânticos; não usam hex direto.
- Cards usam token próprio `bg-card`: `#F1EDF4` no claro e `#40344A` no escuro.
- Light mode usa papel bege; branco puro é proibido.
- Dark mode usa obsidiana quente; preto puro é proibido.
- Ação primária no dark mode usa `purple-primary` com texto `#242527`.
- Textura de papel fica restrita ao light mode e opacidade máxima de `4%`.
- Dark mode usa sombra difusa apenas em overlays; componentes no fluxo separam-se por superfície e espaçamento.
- Preferência inicial segue o sistema e pode ser alterada manualmente.
- Tema escolhido deve persistir entre sessões.
- Alteração de tema não pode mudar hierarquia, tamanho ou posição dos componentes.
- Alternância manual usa switch em cápsula, com contorno e SVG autoral de sol/lua.
- A bolinha fica à esquerda com sol no claro e desliza à direita com lua no escuro.
- O controle informa por nome acessível qual tema será ativado no clique.

## 2. Texturas

### Variantes

| Token | Base | Granulação | Uso |
|---|---|---:|---|
| `texture-paper` | `paper-50` | `1.5–4%` | canvas claro e áreas institucionais |
| `texture-paper-strong` | `paper-100` | `4–7%` | capa, manifesto e bloco editorial |
| `texture-chromatic` | purple + lavender + ink | `12–22%` | hero, campanha e destaque de marca |
| `texture-obsidian` | `ink-900` + purple | `6–12%` | bloco editorial no dark mode |

### Construção

- Ruído: `fractalNoise` monocromático.
- Frequência recomendada: `0.65–0.95`.
- Oitavas: `3–4`.
- Mistura no papel: `multiply` ou `soft-light`.
- Mistura cromática: `soft-light` + `overlay`.
- Gradientes usam transições amplas, sem bandas visíveis.
- Textura precisa ser tileable quando usada como background recorrente.

### Regras

- Textura é expressão de marca; não é padrão de toda superfície.
- `texture-chromatic` não recebe parágrafo, formulário ou tabela por cima.
- Texto sobre textura forte exige área de repouso visual e contraste validado.
- Cards, inputs e modais permanecem sem granulação.
- Light mode aceita textura de papel; dark mode aceita apenas obsidiana discreta.
- Reduzir ou remover textura em alto contraste e `prefers-reduced-transparency`.
- Exportação bitmap: AVIF/WebP, mínimo `2×`, sem marca d'água.
- Preferir geração procedural ou asset original; não usar referências sem licença.

## 3. Tipografia

### Famílias

- **Editorial:** `STIX Two Text`, serif.
- **Utilitária:** `Archivo Narrow`, sans-serif condensada.
- **Metadados:** `Source Code Pro`, monospace.
- **Fallback editorial:** `Noto Serif`, `Georgia`, serif.
- **Fallback utilitária:** `Arial Narrow`, `Noto Sans`, sans-serif.
- **Fallback metadados:** `Noto Sans Mono`, monospace.

> Archivo Narrow substituiu Nimbus Sans Narrow na v0.9. A Nimbus não está
> disponível no Google Fonts; a Archivo ocupa a mesma função — condensada,
> pesos 400 e 700 — e é servida junto do build, sem CDN.

### Escala

| Token | Mobile | Desktop | Peso | Linha | Família |
|---|---:|---:|---:|---:|---|
| `display-xl` | `48px` | `72px` | 400 | 0.96 | STIX |
| `display-lg` | `40px` | `56px` | 400 | 1.00 | STIX |
| `display-md` | `34px` | `44px` | 400 | 1.05 | STIX |
| `heading-xl` | `32px` | `40px` | 500 | 1.08 | STIX |
| `heading-lg` | `28px` | `32px` | 500 | 1.15 | STIX |
| `heading-md` | `24px` | `26px` | 600 | 1.20 | STIX |
| `utility-xl` | `30px` | `36px` | 700 | 1.00 | Archivo Narrow |
| `utility-lg` | `22px` | `24px` | 700 | 1.10 | Archivo Narrow |
| `body-lg` | `18px` | `19px` | 400 | 1.55 | STIX |
| `body-md` | `16px` | `17px` | 400 | 1.55 | STIX |
| `label-md` | `14px` | `14px` | 700 | 1.15 | Archivo Narrow |
| `caption` | `12px` | `12px` | 500 | 1.40 | Source Code Pro |

### Regras

- STIX Two Text conduz marca, títulos, cards editoriais, conversas e leitura longa.
- Archivo Narrow conduz controles, navegação, status, filtros e títulos funcionais.
- Source Code Pro conduz tokens, datas, horários, medidas e metadados técnicos.
- Corpo de conversa nunca menor que `17px`.
- Linha de leitura: `45–75` caracteres; alvo: `60–68`.
- Títulos display podem usar tracking de `-0.03em`.
- Archivo Narrow em overline usa caixa alta com tracking de `0.10em`.
- Source Code Pro usa tracking entre `0` e `0.04em`.
- Não centralizar parágrafos com mais de três linhas.

### Pesos e estilos

| Família | Estilos permitidos | Uso |
|---|---|---|
| STIX Two Text | 400, 500, 600, 400 italic | display, títulos, corpo e citações |
| Archivo Narrow | 400, 700 | labels, navegação, status e ações |
| Source Code Pro | 400, 500, 600 | tokens, datas, medidas e metadados |

### Combinações

| Elemento | Especificação |
|---|---|
| Overline | Archivo Narrow 14/700, caixa alta, `0.10em` |
| Título editorial | STIX 40–72/400–500, `-0.03em` |
| Título de card | STIX 24–28/600 |
| Corpo de leitura | STIX 17–19/400, linha `1.55` |
| Label de ação | Archivo Narrow 14–16/700 |
| Metadado | Source Code Pro 11–12/500 |

### Onde usar cada fonte

| Ocasião | Fonte | Configuração |
|---|---|---|
| Logotipo `Sinapsa.` | STIX Two Text | 400, tracking `-0.04em` |
| Hero e título editorial | STIX Two Text | 400–500, `40–72px` |
| Título de página | STIX Two Text | 500, `32–40px` |
| Título de card | STIX Two Text | 600, `24–28px` |
| Corpo, conversa e leitura longa | STIX Two Text | 400, `17–19px`, linha `1.55` |
| Citação e destaque editorial | STIX Two Text Italic | 400, `24–40px` |
| Overline e nome de seção | Archivo Narrow | 700, caixa alta, tracking `0.10em` |
| Navegação, abas e filtros | Archivo Narrow | 700, `14–16px` |
| Botões e links funcionais | Archivo Narrow | 700, `14–16px` |
| Label de campo | Archivo Narrow | 700, `14px` |
| Tag, badge e status | Archivo Narrow | 700, `12–14px` |
| Data, hora e timestamp | Source Code Pro | 500, `11–12px` |
| Token, medida e valor hexadecimal | Source Code Pro | 400–600, `11–13px` |
| Proveniência e ID técnico | Source Code Pro | 500, `11–12px` |

- STIX Two Text não é usada em botões, labels, filtros ou navegação.
- Archivo Narrow não é usada em parágrafos longos ou conversas.
- Source Code Pro não é usada em títulos, ações ou corpo de leitura.

## 4. Hierarquia

Ordem visual padrão:

1. título ou ação principal;
2. conteúdo essencial;
3. contexto e texto de apoio;
4. metadados;
5. ações secundárias.

Regras:

- Uma ação primária por região.
- Serif pode dominar a leitura; sans condensada organiza a função.
- Diferença mínima de `4px` entre níveis tipográficos vizinhos.
- Criar hierarquia primeiro por tamanho, peso e espaço; cor vem depois.
- Texto secundário não pode competir com conteúdo principal.
- Conteúdo gerado por IA deve exibir origem, período e acesso às fontes.

## 5. Espaçamento

Base: `4px`. Layouts usam principalmente múltiplos de `8px`.

| Token | Valor |
|---|---:|
| `space-1` | `4px` |
| `space-2` | `8px` |
| `space-3` | `12px` |
| `space-4` | `16px` |
| `space-5` | `20px` |
| `space-6` | `24px` |
| `space-8` | `32px` |
| `space-10` | `40px` |
| `space-12` | `48px` |
| `space-16` | `64px` |
| `space-20` | `80px` |
| `space-24` | `96px` |

- Padding de tela mobile: `20px`.
- Padding de card: `20–24px`.
- Distância entre seções: `40px` mobile; `64px` desktop.
- Alvo de toque mínimo: `44 × 44px`.
- Conteúdo intimamente relacionado usa `8–12px`; elementos irmãos usam `16px`.
- Cabeçalho e conteúdo de uma mesma seção usam `16–24px`.
- Margens externas acompanham a grade da tela: `20px`, `32px` e `64px`.
- Valores arbitrários de margem e gap são proibidos quando houver token equivalente.

## 6. Grid

| Contexto | Margem | Colunas | Gutter |
|---|---:|---:|---:|
| Mobile | `20px` | 4 | `16px` |
| Tablet | `32px` | 8 | `20px` |
| Desktop | `64px` | 12 | `24px` |

- Conteúdo institucional: máximo `1200px`.
- Formulário: máximo `480px`.
- Conversa: máximo `760px`.
- Painel profissional: máximo `1440px`.

## 7. Formas

### Raios

| Token | Valor | Uso |
|---|---:|---|
| `radius-sm` | `8px` | tags |
| `radius-md` | `12px` | inputs e botões |
| `radius-lg` | `16px` | cards |
| `radius-xl` | `24px` | painéis e cards de destaque |
| `radius-2xl` | `32px` | blocos editoriais |
| `radius-full` | `9999px` | avatar e pill |

- Superfícies aninhadas seguem a relação `raio externo = raio interno + inset`.
- Navegação flutuante: cápsula `radius-full`, inset `8px` e item ativo também em cápsula.
- Modal: raio `32px`, padding `24px`; botão de fechar é circular.
- Um agrupamento visual usa no máximo dois níveis de raio.
- Raios assimétricos `32/8px` são exclusivos de cards editoriais e gráficos de destaque.

### Bordas e sombras

- Cards, botões, badges, alerts e headers não usam contorno.
- Input no light mode: `1px solid #756878`.
- Input no dark mode: `1px solid #7C697F`.
- Foco: borda roxa + anel externo de `3px`.
- Bordas ficam restritas a campos, foco, switch, divisores editoriais e ao
  contorno óptico translúcido da navegação glass.
- Sombra difusa é reservada a menus, drawers, modais, toasts e navegação flutuante.
- Formas orgânicas são decorativas e não definem área clicável.
- Textura de papel: opacidade máxima de `4%`; nunca sobre campos ou texto longo.

## 8. Componentes

### Botões

| Tamanho | Altura | Padding X | Texto |
|---|---:|---:|---:|
| Small | `36px` | `12px` | `14px` |
| Medium | `44px` | `16px` | `14px` |
| Large | `52px` | `20px` | `16px` |

- Variantes: primary, secondary, tertiary e danger.
- Labels começam com verbo.
- Loading mantém a largura do botão.
- Disabled não substitui explicação.

### Campos

- Label sempre visível acima do campo.
- Altura mínima: `48px`.
- Raio: `12px`.
- Placeholder é exemplo, não label.
- Ajuda e erro ficam abaixo do campo.

### Cards

- **Compacto:** altura mínima `96px`; padding `16px`; gap `8px`.
- **Padrão:** altura mínima `144px`; padding `24px`; gap `12px`.
- **Editorial:** altura livre; padding `32px`; gap `16px`.
- Raio funcional: `16px`; raio editorial: `24px`.
- Sem borda ou contorno simulado.
- Superfície padrão: `paper-0`; destaque: `purple-muted`.
- Ordem: overline → título → corpo → metadado → ação.
- Título de card: STIX `24–28px`, peso `500–600`.
- Label e status: Archivo Narrow `13–14px`, peso `700`.
- Metadado: Source Code Pro `11–12px`.
- Não aninhar cards visualmente equivalentes.
- Card clicável precisa de foco visível e affordance persistente.
- Sombra não é padrão; usar apenas em superfície flutuante.
- Relatórios profissionais aparecem como um índice cronológico compacto, ordenado
  do mais recente para o mais antigo. O período analisado é a informação principal;
  títulos e resumos repetitivos não aparecem na listagem. A leitura completa abre em modal com
  título fixo e conteúdo interno rolável.

### Modais

- Superfície elevada sem borda externa ou contorno simulando borda.
- Separação do fundo acontece por sombra difusa, nunca por stroke.
- Backdrop usa obsidiana a `42%` e desfoque de `8px`.
- Conteúdo ao fundo permanece reconhecível, mas não compete com o modal.
- Clique no backdrop e tecla `Esc` fecham o modal.
- Todo modal exibe botão `X` no canto superior direito, com alvo mínimo de `44px`.
- Foco fica contido no modal enquanto ele estiver aberto.
- Modal de navegação usa grid de três colunas recorrentes:
  `minmax(0, 1fr) 32px 16px` nos destinos e
  `minmax(0, 1fr) 36px 36px` nas conversas.
- Escala de raios do modal: `28px` na superfície, `16px` no item ativo e
  círculo perfeito em ações de ícone e no seletor de tema.
- Cabeçalhos de seção usam grid `1fr auto`; ações e índices compartilham eixo.
- Modal de navegação tem altura máxima de `34rem` ou `100dvh - 3rem`, o que for
  menor. Navegação, título de “Conversas”, ação “Criar nova” e tema ficam
  estáticos; somente a lista de conversas recebe rolagem vertical.

### Chat

- Mensagem do paciente no light: fundo `purple-muted`, texto `ink-900`.
- Resposta da Sinapsa: superfície neutra, sem avatar humano.
- Composer fixo com rascunho preservado em falhas.
- Corpo das mensagens: `16–18px`, linha `1.55`.
- Chat usa shell próprio e não exibe a navegação inferior flutuante.
- Desktop: histórico de conversas em coluna lateral de `288px`.
- Mobile e tablet: histórico e demais áreas abrem em modal pelo menu hambúrguer.
- Header do chat é sobreposto à área rolável e não ocupa espaço no fluxo: não
  usa faixa, borda inferior ou título da conversa. A marca `Sinapsa.` fica
  centralizada como assinatura persistente e não exibe `™` na interface.
- Mensagens passam por trás do header durante a rolagem. Somente a região da
  marca recebe halo radial composto somente por `backdrop-blur: 9px`, sem fill.
  Assim, o halo acompanha a cor da superfície que passa por baixo e dissolve
  completamente nas bordas.
- O hambúrguer do chat usa botão circular sem borda, com superfície uniforme
  transparente e `backdrop-blur: 8px`; não aplicar fill ou gradiente.
- Coluna de mensagens: máximo `760px`, centralizada e com rolagem independente.
- Resposta da Sinapsa é prosa na página; apenas a mensagem da pessoa usa bolha.
- Composer é uma superfície flutuante única, compacta, totalmente arredondada
  e com sombra de overlay. Vazio, ocupa aproximadamente `44px`; cresce apenas
  com o texto.
- Não exibir legendas permanentes como “Escrita privada” dentro do composer.
- Envio usa botão circular de `36px`, em alto contraste, com seta ascendente e
  nome acessível “Enviar mensagem”; não usar botão textual. Enquanto a resposta
  está sendo processada, a seta é substituída por um quadrado sólido.
- O composer permanece sobreposto à área rolável para que mensagens passem por
  trás dele. Seu wrapper é totalmente transparente; somente a cápsula interna
  usa `surface`. Texto, botão e raio devem compartilhar o mesmo centro óptico.
- A coluna do chat ocupa `100%` da altura disponível e o composer usa
  `position: sticky; bottom: 0`; sua posição inferior não muda entre conversa
  vazia, curta ou longa.
- A margem inferior do composer repete a margem lateral: `16px` no mobile e
  `20px` a partir de `sm`.
- Balões usam camada de pintura isolada e recorte no raio; não podem produzir
  hairlines ou arestas residuais ao cruzar superfícies sobrepostas.
- Conversas podem ser renomeadas no histórico; título entre `1–120` caracteres.
- A ação de renomear permanece visível em touch e aparece no hover/foco no desktop.
- Conversas podem ser excluídas pelo histórico após confirmação destrutiva.
- Ao excluir a conversa aberta, o chat seleciona a próxima conversa disponível.
- A conversa aberta usa preenchimento `action-primary`, texto `action-on-primary`
  e o rótulo explícito `Conversa aberta`; diferença de cor sozinha não basta.

### Navegação do paciente

- Fora do chat, a navegação principal é um card inferior flutuante.
- Exatamente três destinos: Sinapsa, Minha rede e Conta.
- O header exibe a marca `Sinapsa.` à esquerda e menu hambúrguer à direita.
- O hambúrguer abre o modal de navegação global; não usar ponto de status decorativo.
- Telas de detalhe usam botão de voltar com seta, nunca breadcrumb sublinhado isolado.
- Superfície translúcida `bg-elevated` a `78%`, blur de `32px`, saturação de
  `150%`, contorno de `1px` com `16%` de opacidade e sombra difusa.
- Item ativo usa cápsula preenchida com `action-primary`; itens inativos não
  criam caixas individuais.
- Item ativo usa `action-primary` preenchido; os demais permanecem neutros.
- O card respeita margem mínima de `16px` nas laterais e na base.
- O conteúdo das páginas reserva no mínimo `128px` no rodapé.
- No chat, os destinos globais ficam dentro do modal aberto pelo hambúrguer.

## 9. Iconografia e movimento

- Ícones: traço arredondado, espessura `1.75–2px` em `24px`.
- Tamanhos: `16`, `20` e `24px`.
- Ícone sem texto exige tooltip e nome acessível.
- Evitar cérebro, neurônio, coração e sparkle como recurso genérico.
- Transições: `140ms` hover; `200ms` padrão; `320ms` modal/drawer.
- Movimento: `cubic-bezier(0.2, 0, 0, 1)`.
- Entrada editorial com GSAP: `600–750ms`, deslocamento máximo de `20px` e
  stagger entre `60–90ms`.
- Transições funcionais com GSAP: páginas `380ms / 7px`, modal `320–360ms / 7px`
  e entrada inicial de mensagens `380ms / 9px`. A rolagem do chat permanece
  nativa, sem cálculo de opacidade ou transformação por frame.
- A conversa exibe “Preparando seu espaço…” até dados, fontes e dois frames de
  layout estarem prontos; só então histórico e composer aparecem juntos.
- O dashboard profissional usa uma timeline GSAP coordenada: kicker `500ms`,
  hero `720ms`, gráfico `750–800ms` e contadores `1150ms` com valores inteiros.
- Seções do dashboard revelam uma única vez ao entrar no viewport; nenhuma
  animação recalcula posição, opacidade ou escala continuamente durante scroll.
- Barras crescem a partir da base e listas usam stagger máximo de `65ms`.
- Relatórios não exibem score ou tendência de humor: o backend não produz
  pontuação emocional e o produto não cria inferência clínica no frontend.
- O contexto emocional qualitativo só aparece quando a pessoa nomeou uma
  emoção; ele organiza os relatos como agradável, difícil, misto ou neutro.
- O mapa do período posiciona observações datadas em trilhas semânticas;
  observações sem data continuam visíveis como conteúdo do período.
- Gráfico de atividade explica coluna, altura, intensidade, período atual e
  diferença percentual em relação ao período anterior; cards invertidos usam
  a rampa sequencial clara → escura independentemente do tema global.
- Cards de pacientes exibem instrução antes da lista e affordance textual
  persistente `Abrir acompanhamento →`.
- O hero profissional abre com `Bom dia`, `Boa tarde` ou `Boa noite` no horário
  de São Paulo, em Archivo Narrow, antes da data editorial.
- `prefers-reduced-motion: reduce` desativa toda animação GSAP.
- Frases rotativas permanecem por pelo menos `5s`; troca usa fade e deslocamento
  máximo de `10px`.
- Scrollbar: trilho transparente, área WebKit de `10px`, thumb visual de `4px`
  com raio total e mínimo de `40px`. Firefox usa `scrollbar-width: thin`.
- Respeitar `prefers-reduced-motion`.
- Não usar bounce ou animação decorativa infinita.

## 10. Responsividade e acessibilidade

- Breakpoints: `480`, `768`, `1024`, `1280`, `1536px`.
- Meta: WCAG 2.2 AA.
- Navegação completa por teclado.
- Foco sempre visível.
- Zoom de `200%` sem perda de função.
- Layout funcional em `320 CSS px`.
- Cor, ícone ou posição nunca são o único indicador de estado.
- Conteúdo crítico não pode existir apenas em toast.
- Paciente: mobile-first e baixa densidade.
- Profissional: desktop-first e densidade moderada.

## 11. Superfícies e visibilidade de dados

### Paciente

- O produto contém apenas Sinapsa/IA, Minha rede e Conta.
- `/chat` é um workspace único; trocar de conversa não cria outra tela.
- O produto do paciente não lista, abre, revisa nem recebe relatórios completos.
- Minha rede exibe profissionais conectados e solicitações com período fechado.
- O CTA `Enviar relatório de contexto` só existe em solicitação profissional pendente.
- A pessoa não escolhe datas nem inicia geração sem uma solicitação identificada.
- A pessoa autoriza escopos por vínculo e pode revogá-los a qualquer momento.
- Mensagens brutas nunca ficam disponíveis ao profissional.

### Profissional

- Concentra dashboard, pacientes, métricas, gráficos e relatórios da LLM.
- Uma solicitação só pode ser criada com assinatura vigente, vínculo ativo e
  escopo `summaries` autorizado; criá-la não executa a IA.
- A geração começa somente após a confirmação explícita do paciente em Minha rede.
- O relatório pertence ao profissional e ao vínculo que originaram a solicitação.
- Um profissional nunca acessa relatórios gerados para outro vínculo ou conta.

### Leitura estruturada do relatório

- Usa somente `coverage`, `timeline`, `items`, `limitations` e proveniência
  presentes no contrato `journey-report-v2`, mantendo leitura de relatórios v1.
- Cobertura mostra proporção de dias ativos, mensagens e mensagens por dia ativo.
- Comparações usam proporções normalizadas e somente períodos anteriores sem
  sobreposição, evitando contar as mesmas mensagens duas vezes.
- O mapa do período agrupa observações em direção, eventos, relatos internos,
  desafios, recursos e contextos de atenção.
- Tamanho do ponto diferencia menção pontual de repetida; incerteza e contradição
  permanecem explícitas, nunca são resolvidas pelo frontend.
- A composição descreve como o relatório organizou as observações. Não representa
  frequência, intensidade, prevalência, risco ou gravidade clínica.
- `emotional_valence` existe somente em item `emotion` e aceita `pleasant`,
  `unpleasant`, `mixed` ou `neutral`; a interface traduz como agradável,
  difícil, misto ou neutro.
- A comparação emocional exige ao menos duas observações datadas em dias
  diferentes. O resultado pode ser apenas insuficiente, semelhante ou variado.
- “Variado” significa que a pessoa nomeou experiências distintas no período;
  nunca significa humor instável, oscilação clínica ou piora.
- Texto, pontuação, silêncio, frequência de uso e respostas do assistente não
  podem originar classificação emocional.
- Itens sem `occurred_at` aparecem como “sem data definida”, não são descartados.
- Ausência de conversa ou observação é ausência de dado, nunca estado emocional.
