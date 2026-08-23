"use client";

import {
  Alert,
  Badge,
  BarStrip,
  Button,
  ComparisonNote,
  EditorialList,
  EditorialRow,
  Icon,
  IconButton,
  Masthead,
  MetaStrip,
  PaperPanel,
  ProvenanceBlock,
  ProvenanceLabel,
  PullQuote,
  SectionIndex,
  Skeleton,
  SourceTrace,
  StatBlock,
  StoryBlock,
  Tag,
  TextField,
  TimelineEvent,
  TimelineRail,
  cx,
  type ButtonVariant,
  type PanelFamily,
  type ProvenanceKind,
  type TagFamily,
  type Tone,
} from "@sinapsa/ui";

/* Especificação viva do Sinapsa Design System V2.

   Esta página não é vitrine: é o lugar onde as regras do brandbook ficam
   verificáveis a olho nu, lado a lado, no tema atual. Se uma decisão de
   design não sobrevive aqui — em light, em dark, em 390px — ela não
   sobrevive no produto. */

const BUTTON_VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "text",
  "danger",
  "danger-solid",
];

const TONES: Tone[] = ["neutral", "brand", "success", "warning", "danger", "info"];

const PANELS: PanelFamily[] = [
  "lavender",
  "sage",
  "clay",
  "apricot",
  "ochre",
  "fogblue",
  "dustrose",
  "neutral",
];

const TAG_FAMILIES: TagFamily[] = [
  "lavender",
  "sage",
  "clay",
  "apricot",
  "ochre",
  "fogblue",
  "dustrose",
];

const PROVENANCE: ProvenanceKind[] = ["reported", "organized", "marked", "system"];

const SURFACES = [
  ["surface-page", "bg-page", "Fundo da folha"],
  ["surface-raised", "bg-raised", "Superfície elevada"],
  ["surface-sunken", "bg-sunken", "Superfície recuada"],
  ["surface-inset", "bg-inset", "Superfície embutida"],
] as const;

const TYPE_SCALE = [
  ["display.2xl", "type-display text-display-2xl", "52 → 120"],
  ["display.xl", "type-display text-display-xl", "44 → 88"],
  ["h1.editorial", "font-editorial text-h1-editorial", "38 → 64"],
  ["h1.system", "type-display text-h1-system", "36 → 60"],
  ["h2", "font-editorial text-h2", "28 → 44"],
  ["h3", "type-ui text-h3 font-semibold", "22 → 30"],
  ["body.l", "text-body-l", "18 → 20"],
  ["body", "text-body", "16 → 17"],
  ["ui", "type-ui text-ui", "14"],
  ["meta", "type-meta", "11"],
] as const;

function Spec({
  index,
  title,
  rule,
  children,
}: {
  index: string;
  title: string;
  /** A regra do brandbook que esta seção torna verificável. */
  rule: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <SectionIndex index={index} meta={rule}>
        {title}
      </SectionIndex>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-dvh bg-page px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-(--container-frame) flex-col gap-16">
        <Masthead
          eyebrow="Sinapsa / Design System V2"
          tone="display"
          size="lg"
          deck="Editorial Clinical Modernism. Cada bloco abaixo existe para tornar uma regra do brandbook verificável em light, em dark e em 390px."
          meta={<MetaStrip items={["uso interno", "não é rota de produto"]} />}
        >
          Especificação
        </Masthead>

        {/* ---------------------------------------------------------------- */}
        <Spec index="01" title="Superfícies" rule="§04 base neutra em 55–70% da tela">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SURFACES.map(([token, bg, label]) => (
              <div key={token} className="flex flex-col gap-2">
                <div
                  className={cx(
                    "h-20 rounded-md border border-hairline",
                    bg,
                  )}
                />
                <p className="type-ui text-ui-sm text-primary">{label}</p>
                <p className="type-meta text-tertiary">{token}</p>
              </div>
            ))}
          </div>
        </Spec>

        <Spec
          index="02"
          title="Painéis pastel"
          rule="§04 máximo três famílias por viewport"
        >
          <p className="measure text-body text-secondary">
            Pastel classifica natureza de conteúdo e cria ritmo. Nunca afirma
            melhora, piora, risco ou qualquer leitura clínica.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PANELS.map((family) => (
              <PaperPanel key={family} family={family} eyebrow={family}>
                <p className="text-body">
                  Texto de corpo sobre o painel, no contraste real de uso.
                </p>
              </PaperPanel>
            ))}
          </div>
        </Spec>

        <Spec index="03" title="Escala tipográfica" rule="§05 contraste real de escala">
          <div className="flex flex-col divide-y divide-hairline">
            {TYPE_SCALE.map(([token, className, size]) => (
              <div
                key={token}
                className="grid gap-2 py-5 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-6"
              >
                <div className="flex flex-col gap-1">
                  <span className="type-meta text-tertiary">{token}</span>
                  <span className="type-meta text-tertiary">{size} px</span>
                </div>
                <p className={cx("text-primary", className)}>
                  Um arquivo vivo de contexto humano
                </p>
              </div>
            ))}
          </div>
        </Spec>

        <Spec index="04" title="Ações" rule="§15 uma ação principal por zona">
          <div className="flex flex-wrap items-center gap-4">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">pequeno</Button>
            <Button size="md">médio</Button>
            <Button size="lg">grande</Button>
            <Button loading>carregando</Button>
            <Button disabled>desabilitado</Button>
            <IconButton icon="more" label="Mais opções" />
            <IconButton icon="close" label="Fechar" variant="bordered" />
          </div>
        </Spec>

        <Spec index="05" title="Entrada" rule="§15 label acima, 44–48px, borda 1px">
          <div className="grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
            <TextField label="Campo comum" placeholder="Digite aqui" />
            <TextField
              label="Campo com erro"
              defaultValue="valor inválido"
              error="Não foi possível validar este valor."
            />
          </div>
        </Spec>

        <Spec
          index="06"
          title="Estado e natureza"
          rule="§16 cor nunca é portadora única de significado"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="type-meta text-tertiary">
                Badge: estado operacional. Cor + ponto + rótulo.
              </p>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => (
                  <Badge key={tone} tone={tone}>
                    {tone}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="type-meta text-tertiary">
                Tag: natureza do conteúdo. Nunca rotula pessoa nem estado clínico.
              </p>
              <div className="flex flex-wrap gap-2">
                {TAG_FAMILIES.map((family) => (
                  <Tag key={family} family={family}>
                    {family}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        </Spec>

        <Spec
          index="07"
          title="Rastreabilidade"
          rule="§28 a IA não é fonte da verdade"
        >
          <p className="measure text-body text-secondary">
            Cada origem é marcada por três coisas ao mesmo tempo: rótulo,
            ícone e régua. A distinção sobrevive em grayscale.
          </p>
          <div className="flex flex-col gap-6 lg:max-w-2xl">
            {PROVENANCE.map((kind) => (
              <ProvenanceBlock
                key={kind}
                kind={kind}
                source={<SourceTrace count={3} onClick={() => {}} />}
              >
                Conteúdo de exemplo com a origem declarada acima.
              </ProvenanceBlock>
            ))}
          </div>
        </Spec>

        <Spec index="08" title="Feedback" rule="§25 estados secundários também são Sinapsa">
          <div className="flex flex-col gap-4 lg:max-w-2xl">
            <Alert tone="danger" title="Não foi possível carregar">
              Não conseguimos carregar este período. Tente novamente.
            </Alert>
            <Alert tone="warning" title="Sem autorização">
              Esta pessoa não autoriza o compartilhamento de contextos.
            </Alert>
            <Alert tone="success" title="Solicitação enviada">
              O período foi enviado. Nada é preparado antes da confirmação.
            </Alert>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          </div>
        </Spec>

        <Spec index="09" title="História" rule="§17 a unidade é uma história, não um card">
          <div className="lg:max-w-3xl">
            <StoryBlock
              index="01 / 19 AGO"
              headline="Uma reunião mudou o tom da semana."
              provenance={<ProvenanceLabel kind="organized" />}
              meta={<MetaStrip items={["TRABALHO", "3 relatos relacionados"]} />}
              source={<SourceTrace count={3} onClick={() => {}} />}
              flush
            >
              Relatou ter saído da apresentação acreditando que tinha falado
              mal, e ter passado dois dias remoendo a ausência de retorno.
            </StoryBlock>
          </div>
        </Spec>

        <Spec index="10" title="Tempo" rule="§20 o evento se ancora à linha, não flutua">
          <div className="lg:max-w-2xl">
            <TimelineRail>
              <TimelineEvent
                date="19 AGO"
                title="Apresentação sem retorno imediato"
                provenance={<ProvenanceLabel kind="organized" />}
              >
                Relatou apresentar uma proposta em reunião e não receber
                retorno na hora.
              </TimelineEvent>
              <TimelineEvent date="20 AGO" marker="bookmark" title="Guardado para a sessão">
                Sinalizou querer conversar sobre a reunião de quarta.
              </TimelineEvent>
              <TimelineEvent date="22 AGO" marker="session" title="Sessão" last>
                Encontro com o profissional.
              </TimelineEvent>
            </TimelineRail>
          </div>
        </Spec>

        <Spec index="11" title="Dados" rule="§24 poucos gráficos, escolhidos por pergunta">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="grid grid-cols-3 gap-6">
              <StatBlock size="sm" label="Ativos" value={3} context="acompanhamentos" />
              <StatBlock size="sm" label="Contextos" value={10} context="recebidos" />
              <StatBlock size="sm" label="Dias" value={6} context="de 14 no período" />
            </div>
            <div className="flex flex-col gap-6">
              <BarStrip
                label="Dias com registro por período"
                family="fogblue"
                points={[
                  { label: "11 JUL", value: 3 },
                  { label: "18 JUL", value: 7 },
                  { label: "25 JUL", value: 5 },
                  { label: "01 AGO", value: 8 },
                  { label: "08 AGO", value: 4 },
                  { label: "15 AGO", value: 6 },
                ]}
              />
              <ComparisonNote basis="15–22 AGO · anterior: 08–15 AGO">
                O período anterior registrou 5 dias com registro e 7 pontos
                observados. A comparação é de cobertura, não de estado.
              </ComparisonNote>
            </div>
          </div>
        </Spec>

        <Spec index="12" title="Listas" rule="§18 densidade editorial sem virar planilha">
          <EditorialList>
            <EditorialRow
              lead="15–22 AGO"
              title="Helena Marques"
              meta={<MetaStrip className="md:justify-end" items={["conversas regulares"]} />}
            >
              Relatou uma sequência de acontecimentos ligados ao trabalho.
            </EditorialRow>
            <EditorialRow
              lead="08–15 AGO"
              title="Caio Ferraz"
              badge={<Badge tone="neutral">sem contexto</Badge>}
              meta={<MetaStrip className="md:justify-end" items={["poucas conversas"]} />}
            >
              Período com menos registros.
            </EditorialRow>
          </EditorialList>
        </Spec>

        <Spec index="13" title="Citação" rule="§17 a palavra literal nunca vira síntese">
          <PullQuote attribution="Relato de 19 AGO">
            Fiquei o resto do dia remoendo, achando que tinha falado besteira.
          </PullQuote>
        </Spec>

        <Spec index="14" title="Ícones" rule="§10 grid 24, stroke 1.5, currentColor">
          <div className="flex flex-wrap gap-6">
            {(
              [
                "context",
                "timeline",
                "for-session",
                "relation",
                "privacy",
                "source",
                "ai",
                "context-search",
              ] as const
            ).map((name) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <Icon name={name} size={24} className="text-primary" />
                <span className="type-meta text-tertiary">{name}</span>
              </div>
            ))}
          </div>
        </Spec>
      </div>
    </div>
  );
}
