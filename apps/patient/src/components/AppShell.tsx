"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  AppFrame,
  Button,
  FolderDock,
  Icon,
  IconButton,
  Modal,
  TextField,
  cx,
  formatDayMark,
  useActiveIndicator,
  type FolderDefinition,
} from "@sinapsa/ui";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useRenameConversation,
} from "@/lib/queries";
import { Logo } from "./Logo";
import { InstallAppButton } from "./InstallAppButton";

/* Brand Book V2 §09 e §30.

   O que saiu daqui, e por quê:

   - a pill flutuante de vidro na base foi removida. O brandbook proíbe
     nominalmente "bottom navigation genérica dentro de uma grande pill" e
     glassmorphism (§01, §09). No lugar entrou o FolderDock, que informa o
     destino ativo por geometria — a aba sobe e vira pasta.
   - o header sticky com blur deu lugar ao trilho de abas integrado à
     moldura: a navegação passou a ser parte do frame, não uma barra que
     paira sobre o conteúdo.
   - a navegação principal e a lista de conversas deixaram de dividir o
     mesmo modal. Uma é global, a outra é local (§09). */

/* Quatro destinos — o teto do §09.

   "Início" existe porque o produto precisa de um motivo de abertura que não
   seja digitar: é o índice do caderno da própria pessoa. Sem ele a rota `/`
   ficaria órfã, alcançável só pelo logotipo. */
const FOLDERS: FolderDefinition[] = [
  { id: "/", href: "/", label: "Início", icon: "context", tone: "sage" },
  { id: "/chat", href: "/chat", label: "Si", icon: "ai", tone: "dark" },
  {
    id: "/vinculos",
    href: "/vinculos",
    label: "Minha rede",
    icon: "relation",
    tone: "lavender",
  },
  { id: "/conta", href: "/conta", label: "Conta", icon: "person", tone: "clay" },
];

function activeFolder(pathname: string): string {
  const match = FOLDERS.find((folder) =>
    folder.id === "/" ? pathname === "/" : pathname.startsWith(folder.id),
  );
  return match?.id ?? "/";
}

/* --------------------------------------------------------------------------
   Conversas — navegação local do chat.
   -------------------------------------------------------------------------- */

function ConversationList({
  activeId,
  onNavigate,
}: {
  activeId: string | null;
  onNavigate?: () => void;
}) {
  const conversations = useConversations();
  const rename = useRenameConversation();
  const remove = useDeleteConversation();
  const router = useRouter();

  const listRef = useRef<HTMLUListElement>(null);
  /* A régua da conversa aberta viaja entre itens de alturas diferentes —
     o único movimento do produto que precisa medir geometria. Ver
     motion/useActiveIndicator.ts. */
  useActiveIndicator(listRef, "conversation-rail", activeId);

  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const items = conversations.data?.conversations ?? [];

  async function submitRename() {
    if (!renaming || !renameTitle.trim()) return;
    await rename.mutateAsync({
      conversationId: renaming.id,
      title: renameTitle.trim(),
    });
    setRenaming(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const wasActive = deleting.id === activeId;
    const fallback = items.find((item) => item.id !== deleting.id);

    await remove.mutateAsync(deleting.id);
    setDeleting(null);

    if (wasActive) {
      router.replace(fallback ? `/chat?c=${fallback.id}` : "/chat");
    }
  }

  return (
    <>
      <ul ref={listRef} className="flex flex-col">
        {items.map((conversation) => {
          const active = conversation.id === activeId;

          return (
            <li
              key={conversation.id}
              className={cx(
                "group relative grid grid-cols-[minmax(0,1fr)_auto_auto] items-center border-b border-hairline",
                active && "bg-sunken",
              )}
            >
              {/* Ativo por régua lateral, não por preenchimento: a mesma
                  gramática de "forma antes de cor" da pilha de pastas. */}
              {active && (
                <span
                  aria-hidden="true"
                  data-flip-id="conversation-rail"
                  className="absolute inset-y-0 left-0 w-0.5 bg-accent-lavender"
                />
              )}

              <Link
                href={`/chat?c=${conversation.id}`}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className="flex min-h-14 min-w-0 flex-col justify-center gap-1 py-3 pl-4"
              >
                <span
                  className={cx(
                    "line-clamp-2 font-editorial text-body leading-snug",
                    active ? "text-primary" : "text-secondary",
                  )}
                >
                  {conversation.title}
                </span>
                <span className="type-meta text-tertiary">
                  {formatDayMark(conversation.updated_at)}
                </span>
              </Link>

              {/* Ações ficam silenciosas até hover/foco no desktop — §18. */}
              <IconButton
                icon="edit"
                size="sm"
                label={`Renomear ${conversation.title}`}
                onClick={() => {
                  setRenaming({ id: conversation.id, title: conversation.title });
                  setRenameTitle(conversation.title);
                  rename.reset();
                }}
                className="lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
              />
              <IconButton
                icon="remove"
                size="sm"
                label={`Excluir ${conversation.title}`}
                onClick={() => {
                  setDeleting({ id: conversation.id, title: conversation.title });
                  remove.reset();
                }}
                className="mr-2 hover:text-destructive lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
              />
            </li>
          );
        })}
      </ul>

      <Modal
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Renomear conversa"
        footer={
          <>
            <Button variant="text" onClick={() => setRenaming(null)}>
              Cancelar
            </Button>
            <Button
              loading={rename.isPending}
              disabled={!renameTitle.trim() || renameTitle.trim() === renaming?.title}
              onClick={submitRename}
            >
              Salvar nome
            </Button>
          </>
        }
      >
        <TextField
          label="Nome da conversa"
          value={renameTitle}
          maxLength={120}
          autoFocus
          onChange={(event) => setRenameTitle(event.target.value)}
          error={rename.error ? "Não foi possível renomear agora." : undefined}
        />
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Excluir conversa?"
        description={
          deleting
            ? `“${deleting.title}” sairá do seu histórico. Esta ação não pode ser desfeita pelo aplicativo.`
            : undefined
        }
        footer={
          <>
            <Button variant="text" onClick={() => setDeleting(null)}>
              Manter conversa
            </Button>
            <Button variant="danger-solid" loading={remove.isPending} onClick={confirmDelete}>
              Excluir conversa
            </Button>
          </>
        }
      >
        {remove.error && <Alert tone="danger">Não foi possível excluir agora.</Alert>}
      </Modal>
    </>
  );
}

function ConversationPanel({
  activeId,
  onNavigate,
}: {
  activeId: string | null;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const create = useCreateConversation();

  async function startConversation() {
    const conversation = await create.mutateAsync(undefined);
    onNavigate?.();
    router.push(`/chat?c=${conversation.id}`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <p className="type-eyebrow text-tertiary">Suas conversas</p>
        <Button
          size="sm"
          variant="secondary"
          loading={create.isPending}
          startIcon={<Icon name="add" size={16} />}
          onClick={startConversation}
        >
          Nova
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ConversationList activeId={activeId} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Shell
   -------------------------------------------------------------------------- */

function ChatShell({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c");
  const [listOpen, setListOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1">
      {/* sidebar.local — 280–340px do §32. */}
      <aside className="hidden w-(--size-sidebar-local) shrink-0 flex-col border-r border-hairline lg:flex">
        <ConversationPanel activeId={activeId} />
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Barra local do mobile: abre a lista de conversas. Distinta da
            navegação global, que vive na doca inferior. */}
        <div
          className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-page/70 px-5 py-2 lg:hidden"
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-full h-4"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--surface-page) 70%, transparent), transparent)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              maskImage: "linear-gradient(to bottom, black, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
            }}
          />
          {/* A assinatura NÃO se repete aqui. Ela vive na bancada, acima da
              pilha, e esta barra é local — só abre a lista de conversas.
              Enquanto o logotipo estava nas duas, o mobile mostrava dois
              "Sinapsa." empilhados, um preto e um translúcido. */}
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="type-ui mr-auto flex min-h-11 items-center gap-2 text-ui text-secondary transition-colors hover:text-primary"
          >
            <Icon name="context" size={20} />
            Conversas
          </button>
          <InstallAppButton className="sm:hidden" />
        </div>

        <div className="min-h-0 flex-1">{children}</div>
      </div>

      <Modal
        open={listOpen}
        onClose={() => setListOpen(false)}
        title="Suas conversas"
        className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden"
        contentClassName="max-h-[min(32rem,calc(100dvh-6rem))] gap-0 overflow-hidden p-0"
      >
        <ConversationPanel activeId={activeId} onNavigate={() => setListOpen(false)} />
      </Modal>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = activeFolder(pathname);
  const isChat = pathname === "/chat";

  return (
    <AppFrame
      folders={FOLDERS}
      activeId={active}
      motionKey={pathname}
      linkComponent={Link}
      fill={isChat}
      brand={
        <Link
          href="/"
          aria-label="Início da Sinapsa"
          className="touch-target rounded-xs"
        >
          <Logo className="text-[1.35rem]" />
        </Link>
      }
      account={<InstallAppButton />}
      dock={
        <FolderDock items={FOLDERS} activeId={active} linkComponent={Link} />
      }
    >
      {isChat ? (
        /* `useSearchParams` lê a conversa aberta dentro do ChatShell; o
           App Router exige a fronteira de Suspense para isso. */
        <Suspense fallback={<div className="min-h-0 flex-1" />}>
          <ChatShell>{children}</ChatShell>
        </Suspense>
      ) : (
        <main className="mx-auto w-full max-w-(--container-frame) flex-1 px-5 pt-10 pb-16 sm:px-10 sm:pb-20 lg:px-14 xl:px-20">
          {children}
        </main>
      )}
    </AppFrame>
  );
}
