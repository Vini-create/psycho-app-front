"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Overline,
  PageTitle,
  Prose,
  SelectField,
  Skeleton,
  TextAreaField,
  TextField,
} from "@sinapsa/ui";
import {
  describeError,
  type ProfessionType,
  type ProfessionalProfile,
} from "@sinapsa/api-client";
import { AuthGate, MfaGate } from "@/components/Gates";
import { useProfile, useUpsertProfile } from "@/lib/queries";

const PROFESSIONS: { value: ProfessionType; label: string }[] = [
  { value: "psychologist", label: "Psicólogo(a)" },
  { value: "psychiatrist", label: "Psiquiatra" },
  { value: "psychoanalyst", label: "Psicanalista" },
  { value: "therapist", label: "Terapeuta" },
  { value: "psychotherapist", label: "Psicoterapeuta" },
  { value: "occupational_therapist", label: "Terapeuta ocupacional" },
  { value: "counselor", label: "Orientador(a)" },
  { value: "other", label: "Outro" },
];

const MAX_BIO = 2_000;
const MAX_CERTIFICATIONS = 50;

/**
 * O formulário só monta depois que o perfil chega.
 *
 * Se ele montasse antes, os `useState` abaixo inicializariam com o perfil
 * ainda `undefined` e nunca mais seriam reatribuídos — quem abrisse "editar
 * perfil" veria os campos vazios e apagaria os próprios dados ao salvar.
 */
function ProfileForm({ profile }: { profile: ProfessionalProfile | null }) {
  const router = useRouter();
  const upsert = useUpsertProfile();

  const [professionType, setProfessionType] = useState<ProfessionType>(
    profile?.profession_type ?? "psychologist",
  );
  const [country, setCountry] = useState(
    profile?.registration_country_code ?? "BR",
  );
  const [region, setRegion] = useState(profile?.registration_region ?? "");
  const [number, setNumber] = useState(profile?.registration_number ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [certifications, setCertifications] = useState(
    (profile?.certifications ?? []).join("\n"),
  );

  const certificationList = certifications
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const tooManyCertifications = certificationList.length > MAX_CERTIFICATIONS;
  const certificationTooLong = certificationList.some(
    (item) => item.length > 200,
  );
  const countryInvalid = country.trim().length !== 2;
  const regionMissing = region.trim() === "";
  const numberMissing = number.trim() === "";
  const profileInvalid =
    countryInvalid ||
    regionMissing ||
    numberMissing ||
    tooManyCertifications ||
    certificationTooLong;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (profileInvalid) return;

    // A primeira chamada provisiona organização, membership e trial de uma vez.
    await upsert.mutateAsync({
      profession_type: professionType,
      registration_country_code: country.toUpperCase(),
      registration_region: region,
      registration_number: number,
      bio,
      certifications: certificationList,
    });
    router.replace("/");
  }

  const editing = profile !== null && profile !== undefined;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-(--container-form) flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <Overline>{editing ? "Perfil" : "Primeiros passos"}</Overline>
        <PageTitle>
          {editing ? "Seu perfil profissional." : "Complete seu perfil."}
        </PageTitle>
        <Prose>
          <p>
            Seus pacientes veem seu nome, profissão e organização ao receber um
            convite.
          </p>
        </Prose>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {upsert.error && (
          <Alert tone="danger">{describeError(upsert.error).message}</Alert>
        )}

        <SelectField
          label="Profissão"
          value={professionType}
          onChange={(event) =>
            setProfessionType(event.target.value as ProfessionType)
          }
          required
        >
          {PROFESSIONS.map((profession) => (
            <option key={profession.value} value={profession.value}>
              {profession.label}
            </option>
          ))}
        </SelectField>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="País do registro"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            maxLength={2}
            required
            help="Código de duas letras, como BR."
            error={countryInvalid ? "Informe um código de país com duas letras." : undefined}
          />
          <TextField
            label="Estado ou região"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            required
            placeholder="SP"
            error={regionMissing ? "Informe o estado ou região do registro." : undefined}
          />
        </div>

        <TextField
          label="Número de registro"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          required
          placeholder="06/123456"
          error={numberMissing ? "Informe o número do registro profissional." : undefined}
        />

        <TextAreaField
          label="Apresentação"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={MAX_BIO}
          rows={5}
          help={`${MAX_BIO - bio.length} caracteres restantes.`}
        />

        <TextAreaField
          label="Formações"
          value={certifications}
          onChange={(event) => setCertifications(event.target.value)}
          rows={4}
          help={`Uma por linha. Até ${MAX_CERTIFICATIONS} formações de 200 caracteres.`}
          error={
            tooManyCertifications
              ? `Máximo de ${MAX_CERTIFICATIONS} formações.`
              : certificationTooLong
                ? "Alguma formação passa de 200 caracteres."
                : undefined
          }
        />

        <Button
          type="submit"
          size="lg"
          loading={upsert.isPending}
          disabled={profileInvalid}
        >
          {editing ? "Salvar perfil" : "Concluir cadastro"}
        </Button>
      </form>
    </div>
  );
}

function Onboarding() {
  const { data: profile, isPending } = useProfile();

  if (isPending) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-(--container-form) flex-col gap-6 px-6 py-12">
        <Skeleton className="h-12 w-2/3" aria-label="Carregando perfil" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return <ProfileForm profile={profile ?? null} />;
}

export default function OnboardingPage() {
  return (
    <AuthGate>
      <MfaGate>
        <Onboarding />
      </MfaGate>
    </AuthGate>
  );
}
