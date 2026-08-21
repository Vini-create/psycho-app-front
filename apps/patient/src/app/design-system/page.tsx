"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import {
  AIProvenance,
  Alert,
  Badge,
  Button,
  Card,
  CardActions,
  CardBody,
  CardMeta,
  CardOverline,
  CardTitle,
  Checkbox,
  EmptyState,
  Metadata,
  Modal,
  Overline,
  PageTitle,
  Prose,
  SelectField,
  Skeleton,
  StatusPill,
  TextAreaField,
  TextField,
  TextureLayer,
  ThemeToggle,
  cx,
  type ButtonVariant,
  type TextureVariant,
  type Tone,
} from "@sinapsa/ui";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "tertiary", "danger"];
const TONES: Tone[] = ["neutral", "brand", "success", "warning", "danger", "info"];
const TEXTURES: TextureVariant[] = [
  "paper",
  "paper-strong",
  "chromatic",
  "obsidian",
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-t border-border-subtle pt-8">
      <Overline as="h2" className="text-secondary">
        {title}
      </Overline>
      {children}
    </section>
  );
}

/**
 * Ferramenta de revisão visual do design system.
 * Sem ela, regressão de design passa despercebida — e ela existe só quando
 * NEXT_PUBLIC_DESIGN_PREVIEW está ligado.
 */
export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);

  if (process.env.NEXT_PUBLIC_DESIGN_PREVIEW !== "true") notFound();

  return (
    <div className="mx-auto flex w-full max-w-(--container-institutional) flex-col gap-10 px-5 py-12">
      <header className="flex flex-col gap-4">
        <Overline>Design system</Overline>
        <PageTitle className="text-display-md">Sinapsa. — primitivos</PageTitle>
        <ThemeToggle />
      </header>

      <Section title="Tipografia">
        <div className="flex flex-col gap-4">
          <p className="font-editorial text-display-lg">Suave não é apagado.</p>
          <p className="font-editorial text-heading-xl">Título de página</p>
          <p className="font-editorial text-heading-md font-semibold">Título de card</p>
          <p className="type-overline">Overline em Archivo Narrow</p>
          <Prose>
            <p>
              Corpo de leitura em STIX Two Text, 17–19px, linha 1.55. A medida
              de leitura fica entre 45 e 75 caracteres, com alvo entre 60 e 68 —
              é o que mantém o olho confortável em texto longo.
            </p>
          </Prose>
          <Metadata>Metadado · Source Code Pro · 2026-08-21T11:00:00Z</Metadata>
        </div>
      </Section>

      <Section title="Botões">
        <div className="flex flex-col gap-4">
          {(["sm", "md", "lg"] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              {VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  Enviar mensagem
                </Button>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button loading>Carregando mantém largura</Button>
            <Button disabled>Desabilitado</Button>
          </div>
        </div>
      </Section>

      <Section title="Campos">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="E-mail" placeholder="nome@exemplo.com" />
          <TextField
            label="Senha"
            type="password"
            help="Pelo menos 12 caracteres."
          />
          <TextField label="Com erro" error="Revise este campo." />
          <SelectField label="Profissão">
            <option>Psicólogo(a)</option>
            <option>Psicanalista</option>
          </SelectField>
          <TextAreaField
            label="Apresentação"
            help="Até 2.000 caracteres."
            className="sm:col-span-2"
          />
          <Checkbox label="Li e aceito os termos" className="sm:col-span-2" />
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card variant="compact">
            <CardOverline>Compacto</CardOverline>
            <CardTitle>96px · pad 16 · gap 8</CardTitle>
          </Card>
          <Card variant="standard">
            <CardOverline>Padrão</CardOverline>
            <CardTitle>144px · pad 24 · gap 12</CardTitle>
            <CardBody>Agrupa conteúdo sem disputar atenção.</CardBody>
            <CardMeta>paper-0 · borda neutra malva · sem sombra</CardMeta>
          </Card>
          <Card variant="editorial">
            <CardOverline>Editorial</CardOverline>
            <CardTitle className="font-normal italic">Uma pausa na leitura.</CardTitle>
            <CardBody>Destaque de conteúdo, nunca ação crítica.</CardBody>
          </Card>
          <Card variant="interactive">
            <CardOverline>Interativo</CardOverline>
            <CardTitle>Título com destino claro</CardTitle>
            <CardActions>
              <Button size="sm" variant="tertiary">
                Abrir
              </Button>
            </CardActions>
          </Card>
          <Card variant="inverse" className="sm:col-span-2">
            <CardOverline>Inverso · uso restrito</CardOverline>
            <CardTitle>Contraste para uma informação.</CardTitle>
            <CardBody>Não criar uma grade inteira de cards escuros.</CardBody>
          </Card>
        </div>
      </Section>

      <Section title="Estado — cor + rótulo + forma">
        <div className="flex flex-wrap gap-3">
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {TONES.map((tone) => (
            <StatusPill key={tone} tone={tone}>
              {tone}
            </StatusPill>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {(["danger", "warning", "success", "info"] as Tone[]).map((tone) => (
            <Alert key={tone} tone={tone} title={tone}>
              Conteúdo crítico vive na página, nunca só num toast.
            </Alert>
          ))}
        </div>
      </Section>

      <Section title="Superfície flutuante">
        <div>
          <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="A única categoria com sombra"
            description="Modal, drawer e menu. Cards funcionais usam borda."
            footer={
              <Button variant="tertiary" onClick={() => setModalOpen(false)}>
                Fechar
              </Button>
            }
          />
        </div>
      </Section>

      <Section title="Texturas">
        <div className="grid gap-4 sm:grid-cols-2">
          {TEXTURES.map((variant) => (
            <div
              key={variant}
              className={cx(
                "relative h-40 overflow-hidden rounded-lg border border-border-subtle",
                variant === "paper" || variant === "paper-strong"
                  ? "bg-subtle"
                  : "bg-inverse",
              )}
            >
              <TextureLayer variant={variant} />
              <span
                className={cx(
                  "metadata absolute bottom-3 left-3",
                  variant === "paper" || variant === "paper-strong"
                    ? "text-primary"
                    : "text-on-action",
                )}
              >
                {variant}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Procedência de IA">
        <AIProvenance
          periodStart="2026-08-11T00:00:00Z"
          periodEnd="2026-08-18T00:00:00Z"
          coverage={{
            conversation_count: 3,
            user_message_count: 24,
            active_day_count: 5,
            completeness: "partial",
            note: "Cobre apenas os assuntos mencionados.",
          }}
          limitations={["Não cobre os dias sem conversa."]}
        />
      </Section>

      <Section title="Vazio e carregamento">
        <EmptyState
          overline="Sem dados"
          title="Nenhuma conversa ainda."
          description="Quando você começar, elas aparecem aqui."
          action={<Button>Começar uma conversa</Button>}
        />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20" aria-label="Carregando" />
          <Skeleton className="h-20 w-2/3" />
        </div>
      </Section>
    </div>
  );
}
