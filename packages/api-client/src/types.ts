/**
 * Tipos do contrato v1 (FRONTEND_API_CONTRACT.md).
 * JSON é snake_case e o backend REJEITA campos desconhecidos — por isso
 * nunca espalhe (`...`) um objeto de resposta dentro de um corpo de request.
 */

export type Audience = "app" | "professional";

export type IssuedToken = {
  access_token: string;
  token_type: "Bearer";
  expires_at: string;
};

export type Session = {
  id: string;
  created_ip: string;
  last_used_ip: string;
  user_agent: string;
  mfa_verified: boolean;
  expires_at: string;
  last_used_at: string;
  created_at: string;
  revoked_at: string | null;
  current_session: boolean;
};

export type Account = {
  id: string;
  email: string;
  display_name: string;
  status: string;
  email_verified_at: string | null;
  audience: Audience;
  mfa_verified: boolean;
  created_at?: string;
  updated_at?: string;
  plan?: string;
  google_connected?: boolean;
};

export type RegisterResponse = {
  account_id: string;
  email: string;
  verification_required: boolean;
  /** Só existe em development. Nunca exibir fora dele. */
  development_token?: string;
};

export type GenericAcceptedResponse = {
  message: string;
  development_token?: string;
};

export type GoogleChallenge = {
  challenge_id: string;
  nonce: string;
  expires_at: string;
};

/* ---------------------------------------------------------------- passkeys */

export type PasskeyCeremony = {
  ceremony_token: string;
  /** Payload opaco produzido pelo backend; entregar direto ao WebAuthn. */
  public_key: Record<string, unknown>;
  /** Tokens opacos e efêmeros. O scan_token vai apenas no QR; o poll_token fica em memória no desktop. */
  device_authorization?: DeviceAuthorizationChallenge;
};

export type DeviceAuthorizationChallenge = {
  scan_token: string;
  poll_token: string;
  confirmation_code: string;
  expires_at: string;
};

export type DeviceAuthorizationPreview = {
  public_key: Record<string, unknown>;
  confirmation_code: string;
  expires_at: string;
};

export type DeviceAuthorizationPollResponse =
  | { status: "pending" }
  | IssuedToken;

export type Passkey = {
  id: string;
  label: string;
  created_at: string;
  last_used_at?: string | null;
};

export type PasskeyRegistrationResult = {
  passkey: Passkey;
  /** Só no cadastro da primeira passkey. Exibir uma vez, nunca persistir. */
  recovery_codes?: string[];
  access_token: string;
  token_type: "Bearer";
  expires_at: string;
};

/**
 * Login profissional é uma união de estados, não um objeto fixo.
 * Ver FRONTEND_API_CONTRACT.md §"Passkeys dos profissionais".
 */
export type ProfessionalLoginResponse =
  | {
      passkey_required: true;
      passkey_ceremony: PasskeyCeremony;
      tokens?: undefined;
    }
  | {
      passkey_required: false;
      passkey_enrollment_needed?: boolean;
      tokens: IssuedToken;
    };

export type AppLoginResponse = {
  tokens: IssuedToken;
  passkey_required: false;
};

/* ------------------------------------------------------------- consentimentos */

export type ConsentType = "terms" | "privacy" | "ai_processing";

export type Consent = {
  type: ConsentType;
  policy_version: string;
  granted_at: string;
};

/* ------------------------------------------------------------------ conversas */

export type Conversation = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type MessageRole = "user" | "assistant";

export type GenerationStatus = "completed" | "pending" | "failed" | "blocked";

export type Message = {
  id: string;
  conversation_id: string;
  sequence: number;
  role: MessageRole;
  content: string;
  in_reply_to_message_id?: string;
  generation_status: GenerationStatus;
  /** Rastreabilidade apenas. A UI NUNCA decide nada por estes campos. */
  ai_provider?: string;
  ai_model?: string;
  prompt_version?: string;
  failure_code?: string;
  created_at: string;
};

export type AssistantStatus = "completed" | "blocked" | "failed" | "pending";

export type SendMessageResponse = {
  user_message: Message;
  assistant_message?: Message;
  assistant_status: AssistantStatus;
};

/* -------------------------------------------------------- convites e vínculos */

export type ConsentScope = "summaries" | "events" | "marked_topics";

export type Invitation = {
  id: string;
  email: string;
  invitation_token?: string;
  invitation_url?: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export type InvitationPreview = {
  professional_display_name: string;
  profession_type: string;
  organization_name: string;
  masked_email: string;
  expires_at: string;
};

export type Connection = {
  id: string;
  connection_id?: string;
  status: string;
  organization_name?: string;
  patient_display_name?: string;
  patient_email?: string;
  professional_display_name?: string;
  profession_type?: string;
  consent_scopes: ConsentScope[];
  activated_at: string | null;
  ended_at: string | null;
  created_at: string;
};

/* ------------------------------------------------------------- profissional */

export type ProfessionType =
  | "psychologist"
  | "psychiatrist"
  | "psychoanalyst"
  | "therapist"
  | "psychotherapist"
  | "occupational_therapist"
  | "counselor"
  | "other";

export type ProfessionalProfileInput = {
  profession_type: ProfessionType;
  registration_country_code: string;
  registration_region: string;
  registration_number: string;
  bio: string;
  certifications: string[];
};

export type ProfessionalProfile = ProfessionalProfileInput & {
  id?: string;
  onboarding_complete?: boolean;
  organization?: { id: string; name: string } | null;
  membership?: { role: string } | null;
  plan?: { code: string; status: string } | null;
};

/* ---------------------------------------------------------------- relatórios */

export type ReportCoverage = {
  conversation_count: number;
  user_message_count: number;
  active_day_count: number;
  completeness: "limited" | "partial" | "substantial" | (string & {});
  note?: string | null;
};

export type TimelineEntry = {
  id: string;
  description: string;
  occurred_at?: string | null;
};

export type ContextItemKind =
  | "priority"
  | "event"
  | "challenge"
  | "emotion"
  | "thought"
  | "behavior"
  | "strategy"
  | "support"
  | "change"
  | "open_topic"
  | "safety_context"
  | (string & {});

export type EvidenceStrength =
  | "explicit_once"
  | "explicit_repeated"
  | "uncertain"
  | "contradictory"
  | (string & {});

export type EmotionalValence =
  | "pleasant"
  | "unpleasant"
  | "mixed"
  | "neutral";

export type ContextItem = {
  id: string;
  kind: ContextItemKind;
  title: string;
  description: string;
  impact?: string;
  evidence_strength: EvidenceStrength;
  emotional_valence?: EmotionalValence;
  occurred_at?: string | null;
  limitations: string[];
  included: boolean;
};

export type ContextReport = {
  id: string;
  connection_id: string;
  schema_version: string;
  title: string;
  period_start: string;
  period_end: string;
  coverage: ReportCoverage;
  summary: string;
  timeline: TimelineEntry[];
  items: ContextItem[];
  limitations: string[];
  provider: string;
  model: string;
  prompt_version: string;
  graph_version: string;
  review_status:
    | "pending_review"
    | "approved"
    | "rejected"
    | (string & {});
  reviewed_at?: string | null;
  created_at: string;
};

export type ContextReportRequestStatus =
  | "pending"
  | "processing"
  | "sent"
  | "declined"
  | "expired"
  | "failed";

/**
 * Metadados da solicitação. O produto do paciente recebe apenas este objeto,
 * nunca o ContextReport produzido a partir dele.
 */
export type ContextReportRequest = {
  id: string;
  connection_id: string;
  professional_display_name?: string;
  patient_display_name?: string;
  period_start: string;
  period_end: string;
  status: ContextReportRequestStatus;
  requested_at: string;
  sent_at: string | null;
};

/* ------------------------------------------------------------- check-ins */

/**
 * Check-in diário. O profissional autora uma escala; o paciente responde um
 * dia por vez. Datas de check-in são dia local (`YYYY-MM-DD`), nunca
 * timestamp: o dia é do paciente, e o fuso de quem lê não pode deslocá-lo.
 */
export type CheckinOption = {
  id: string;
  position: number;
  label: string;
  score: number;
};

export type CheckinQuestion = {
  id: string;
  position: number;
  prompt: string;
  /** Texto de apoio que o paciente lê na hora de responder. */
  legend?: string;
  options: CheckinOption[];
};

export type CheckinTemplateStatus = "draft" | "published" | "archived";

export type CheckinTemplate = {
  id: string;
  title: string;
  legend?: string;
  status: CheckinTemplateStatus;
  questions: CheckinQuestion[];
  published_at?: string;
  created_at: string;
  updated_at: string;
};

/**
 * Corpo de criação/edição. Só rascunho aceita edição.
 *
 * A escala é fixa: exatamente cinco alternativas por pergunta. A nota não vai
 * no corpo — ela é a posição do rótulo, então a ordem importa: o primeiro é o
 * extremo mais baixo, o quinto é o mais alto.
 */
export const CHECKIN_OPTIONS_PER_QUESTION = 5;

export type CheckinTemplateInput = {
  title: string;
  legend: string;
  questions: {
    prompt: string;
    legend: string;
    options: { label: string }[];
  }[];
};

export type CheckinAssignmentStatus =
  | "pending"
  | "active"
  | "declined"
  | "revoked"
  | "ended";

export type CheckinAnswer = {
  question_id: string;
  option_id: string;
  score: number;
};

export type CheckinEntry = {
  id: string;
  assignment_id: string;
  /** `YYYY-MM-DD` no dia local de quem respondeu. */
  entry_date: string;
  answers: CheckinAnswer[];
  submitted_at: string;
  updated_at: string;
};

/**
 * O check-in entregue a um vínculo. `professional_display_name` é o rótulo
 * obrigatório na interface do paciente: ele pode ter vários check-ins ativos,
 * de profissionais diferentes, e precisa saber para quem responde cada um.
 *
 * Os campos de resposta (`answered_today`, `today_entry`, `answered_days`)
 * chegam apenas ao paciente. O profissional nunca lê resposta fora de uma
 * colheita autorizada.
 */
export type CheckinAssignment = {
  id: string;
  connection_id: string;
  status: CheckinAssignmentStatus;
  professional_display_name?: string;
  patient_display_name?: string;
  template: CheckinTemplate;
  requested_at: string;
  responded_at?: string;
  ended_at?: string;
  answered_today: boolean;
  today_entry?: CheckinEntry;
  last_entry_date?: string;
  answered_days: number;
};

export type CheckinCollectionRequestStatus =
  | "pending"
  | "sent"
  | "declined"
  | "expired";

export type CheckinCollectionRequest = {
  id: string;
  connection_id: string;
  professional_display_name?: string;
  patient_display_name?: string;
  period_start: string;
  period_end: string;
  status: CheckinCollectionRequestStatus;
  requested_at: string;
  responded_at?: string;
};

/**
 * `normalized` (0 a 1) existe porque escalas diferentes não dividem um mesmo
 * radar sem serem trazidas à mesma régua. Desenhe pelo `normalized`; rotule
 * com `average` e os limites da escala.
 */
export type CheckinQuestionAggregate = {
  question_id: string;
  prompt: string;
  position: number;
  average: number;
  normalized: number;
  score_min: number;
  score_max: number;
  answer_count: number;
};

export type CheckinDayScore = {
  date: string;
  average: number;
  normalized: number;
  answer_count: number;
};

/**
 * Todo número aqui já vem calculado pelo backend. A UI desenha, não deriva.
 * `authored_by_you` distingue o check-in que este profissional mandou; quem
 * autorou um check-in de outro vínculo nunca é nomeado.
 */
export type CheckinCollectionCheckin = {
  assignment_id: string;
  title: string;
  legend?: string;
  authored_by_you: boolean;
  period_day_count: number;
  answered_day_count: number;
  average: number;
  normalized: number;
  questions: CheckinQuestionAggregate[];
  days: CheckinDayScore[];
  best_day?: CheckinDayScore;
  worst_day?: CheckinDayScore;
};

export type CheckinCollection = {
  id: string;
  connection_id: string;
  request_id: string;
  period_start: string;
  period_end: string;
  shared_at: string;
  checkins: CheckinCollectionCheckin[];
};

export type SendCheckinCollectionResult = {
  request_id: string;
  status: string;
  checkin_count: number;
};
