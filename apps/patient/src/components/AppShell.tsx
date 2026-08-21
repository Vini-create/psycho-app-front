"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from "react";
import { gsap } from "gsap";
import {
  Alert,
  Button,
  Metadata,
  Modal,
  Overline,
  TextField,
  ThemeToggle,
  cx,
  formatDayLabel,
} from "@sinapsa/ui";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useRenameConversation,
} from "@/lib/queries";
import { Logo } from "./Logo";

const NAV = [
  { href: "/chat", label: "Sinapsa", index: "01", icon: BookIcon },
  { href: "/vinculos", label: "Minha rede", index: "02", icon: PeopleIcon },
  { href: "/conta", label: "Conta", index: "03", icon: PersonIcon },
];

function MotionMenu({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const element = root.current;
    const items = Array.from(element.children);
    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { autoAlpha: 0, y: 7, scale: 0.99 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.32,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
        },
      );
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 6 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.36,
          stagger: 0.045,
          delay: 0.035,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
        },
      );
    }, element);

    return () => context.revert();
  }, [open]);

  return <div ref={root} className={className}>{children}</div>;
}

function MotionPage({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tween = gsap.fromTo(
      root.current,
      { autoAlpha: 0.88, y: 7 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.38,
        ease: "power3.out",
        clearProps: "opacity,visibility,transform",
      },
    );
    return () => {
      tween.revert();
    };
  }, [routeKey]);

  return <div ref={root}>{children}</div>;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function IconBase({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

function BookIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" /></IconBase>;
}

function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.4-4 2.1-6 5.5-6s5.1 2 5.5 6" /><path d="M15.5 5.5a3 3 0 0 1 0 5.5M17 14c2.4.5 3.5 2.4 3.5 5" /></IconBase>;
}

function PersonIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><circle cx="12" cy="8" r="3.5" /><path d="M5 21c.5-4.6 2.7-7 7-7s6.5 2.4 7 7" /></IconBase>;
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="M4 7h16M4 12h11M4 17h16" /></IconBase>;
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="M12 5v14M5 12h14" /></IconBase>;
}

function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="m4 20 4.2-1 10.6-10.6a2 2 0 0 0-2.8-2.8L5.4 16.2z" /><path d="m14.5 7.1 2.8 2.8" /></IconBase>;
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></IconBase>;
}

function FloatingNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Seções" className="glass-nav fixed inset-x-4 bottom-4 z-30 mx-auto max-w-[28rem] rounded-full p-2">
      <ul className="grid grid-cols-3 gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className={cx("group flex min-h-13 flex-col items-center justify-center gap-1 rounded-full px-2", "font-utility text-caption font-bold transition-[background-color,color,transform] duration-200 ease-sinapsa active:scale-[0.97]", active ? "bg-action text-on-action shadow-[0_8px_20px_-12px_rgb(29_25_30/0.75)]" : "text-secondary hover:bg-surface/55 hover:text-primary")}>
                <Icon className="size-4.5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SectionLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ol className="divide-y divide-border-subtle border-y border-border-subtle">
      {NAV.map((item) => (
        <li key={item.href}>
          <Link href={item.href} onClick={onNavigate} className="group grid min-h-14 grid-cols-[minmax(0,1fr)_2rem_1rem] items-center gap-2 py-3">
            <span className="font-editorial text-heading-md group-hover:italic">{item.label}</span>
            <span className="metadata justify-self-end text-secondary">{item.index}</span>
            <span aria-hidden="true" className="justify-self-end font-mono text-caption text-secondary">→</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function ChatShortcuts() {
  const shortcuts = NAV.filter((item) => item.href !== "/chat");

  return (
    <nav aria-label="Atalhos do seu espaço" className="px-3 pb-4">
      <ul className="flex flex-col gap-1">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex min-h-11 items-center gap-3 rounded-lg px-3 font-utility text-label-md font-bold text-secondary transition-colors hover:bg-subtle hover:text-primary"
              >
                <Icon className="size-4.5 shrink-0" />
                <span>{item.label}</span>
                <span
                  aria-hidden="true"
                  className="ml-auto font-mono text-caption font-medium opacity-0 transition-opacity group-hover:opacity-100"
                >
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ChatShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const conversations = useConversations();
  const create = useCreateConversation();
  const remove = useDeleteConversation();
  const rename = useRenameConversation();
  const activeId = searchParams.get("c");
  const items = conversations.data?.conversations ?? [];
  async function startConversation() {
    const conversation = await create.mutateAsync(undefined);
    setMenuOpen(false);
    router.push(`/chat?c=${conversation.id}`);
  }

  function openRename(id: string, title: string) {
    setMenuOpen(false);
    setRenaming({ id, title });
    setRenameTitle(title);
    rename.reset();
  }

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
    const deletingActive = deleting.id === activeId;
    const fallback = items.find((item) => item.id !== deleting.id);

    await remove.mutateAsync(deleting.id);
    setDeleting(null);

    if (deletingActive) {
      router.replace(fallback ? `/chat?c=${fallback.id}` : "/chat");
    }
  }

  const conversationList = (
    <ul className="flex flex-col gap-1">
      {items.map((conversation) => {
        const active = conversation.id === activeId;
        return (
          <li
            key={conversation.id}
            className={cx(
              "group grid grid-cols-[minmax(0,1fr)_2.25rem_2.25rem] items-center rounded-lg transition-colors",
              active
                ? "bg-action text-on-action"
                : "text-secondary hover:bg-subtle hover:text-primary",
            )}
          >
            <Link href={`/chat?c=${conversation.id}`} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined} className="flex min-h-14 min-w-0 flex-col justify-center gap-1 py-2.5 pl-3">
              <span className="line-clamp-2 font-editorial text-body-md leading-snug">{conversation.title}</span>
              {active ? (
                <span className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-on-action">
                  Conversa aberta
                </span>
              ) : (
                <Metadata className="text-[0.66rem]">{formatDayLabel(conversation.updated_at)}</Metadata>
              )}
            </Link>
            <button
              type="button"
              onClick={() => openRename(conversation.id, conversation.title)}
              className={cx(
                "grid size-8 place-items-center justify-self-center rounded-full opacity-100 transition-[opacity,background-color,color] lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100",
                active
                  ? "text-on-action hover:bg-action-hover"
                  : "text-secondary hover:bg-surface hover:text-primary",
              )}
              aria-label={`Renomear ${conversation.title}`}
            >
              <PencilIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setDeleting({ id: conversation.id, title: conversation.title });
                remove.reset();
              }}
              className={cx(
                "grid size-8 place-items-center justify-self-center rounded-full opacity-100 transition-[opacity,background-color,color] lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100",
                active
                  ? "text-on-action hover:bg-action-hover"
                  : "text-secondary hover:bg-danger-surface hover:text-danger",
              )}
              aria-label={`Excluir ${conversation.title}`}
            >
              <TrashIcon className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-canvas">
      <aside className="hidden w-72 shrink-0 flex-col bg-surface lg:flex">
        <div className="flex items-center justify-between px-5 py-4">
          <Logo className="text-[1.65rem]" />
          <button type="button" onClick={() => setMenuOpen(true)} className="touch-target grid size-10 place-items-center rounded-md text-secondary transition-colors hover:bg-subtle hover:text-primary" aria-label="Abrir menu">
            <MenuIcon className="size-5" />
          </button>
        </div>

        <div className="p-4">
          <Button fullWidth variant="secondary" loading={create.isPending} startIcon={<PlusIcon className="size-4" />} onClick={startConversation}>Nova conversa</Button>
        </div>

        <ChatShortcuts />

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border-subtle px-3 pb-4 pt-4">
          <Overline className="px-3 pb-3 text-secondary">Recentes</Overline>
          {conversationList}
        </div>

        <div className="border-t border-border-subtle px-5 py-4"><Metadata>Privado por princípio.</Metadata></div>
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
          <div className="relative mx-auto flex h-16 w-full max-w-(--container-conversation) items-center px-4 sm:px-5">
            <button type="button" onClick={() => setMenuOpen(true)} className="pointer-events-auto grid size-10 shrink-0 place-items-center rounded-full bg-transparent text-primary backdrop-blur-[8px] transition-transform active:scale-95 lg:invisible lg:pointer-events-none" aria-label="Abrir menu e conversas">
              <MenuIcon className="size-5" />
            </button>

            <div aria-hidden="true" className="absolute top-1/2 left-1/2 h-16 w-48 -translate-x-1/2 -translate-y-1/2 bg-transparent backdrop-blur-[9px] [mask-image:radial-gradient(ellipse_at_center,black_38%,transparent_76%)]" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Logo className="relative text-[1.45rem]" />
            </div>
          </div>
        </header>

        <main
          data-chat-scroll
          className="min-h-0 flex-1 overscroll-contain overflow-y-auto"
        >
          <div className="mx-auto h-full w-full max-w-(--container-conversation) px-4 sm:px-5">{children}</div>
        </main>
      </div>

      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Navegar pelo seu espaço"
        className="w-[min(20rem,calc(100vw-2rem))] !rounded-2xl overflow-hidden"
        contentClassName="max-h-[min(34rem,calc(100dvh-3rem))] gap-6 overflow-hidden p-6"
      >
        <MotionMenu open={menuOpen} className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-6">
          <SectionLinks onNavigate={() => setMenuOpen(false)} />
          <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <Overline as="h3" className="text-secondary">Conversas</Overline>
              <Button size="sm" variant="tertiary" loading={create.isPending} onClick={startConversation}>Criar nova</Button>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain pr-1">
              {conversationList}
            </div>
          </section>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-t border-border-subtle pt-4">
            <Metadata>Tema</Metadata>
            <ThemeToggle />
          </div>
        </MotionMenu>
      </Modal>

      <Modal
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Renomear conversa"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setRenaming(null)}>
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
            <Button variant="tertiary" onClick={() => setDeleting(null)}>
              Manter conversa
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={confirmDelete}>
              Excluir conversa
            </Button>
          </>
        }
      >
        {remove.error && (
          <Alert tone="danger">Não foi possível excluir agora.</Alert>
        )}
      </Modal>
    </div>
  );
}

export function AppShell({ children, flush = false }: { children: ReactNode; flush?: boolean }) {
  const pathname = usePathname();
  const [globalMenuOpen, setGlobalMenuOpen] = useState(false);

  if (pathname === "/chat") return <ChatShell>{children}</ChatShell>;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <header className="sticky top-0 z-20 bg-canvas/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-(--container-institutional) items-center justify-between px-5 sm:px-8">
          <Link href="/" className="rounded-sm" aria-label="Página inicial da Sinapsa">
            <Logo className="text-[1.9rem] sm:text-[2.1rem]" />
          </Link>
          <button
            type="button"
            onClick={() => setGlobalMenuOpen(true)}
            className="grid size-11 place-items-center rounded-lg bg-surface text-primary transition-colors hover:bg-subtle"
            aria-label="Abrir menu"
            aria-expanded={globalMenuOpen}
          >
            <MenuIcon className="size-5" />
          </button>
        </div>
      </header>

      <main className={cx("mx-auto w-full flex-1 px-5 pt-5 sm:px-8 sm:pt-8", pathname === "/" ? "max-w-(--container-institutional)" : "max-w-[64rem]", flush ? "pb-0" : "pb-32 sm:pb-36")}>
        <MotionPage routeKey={pathname}>{children}</MotionPage>
      </main>
      <FloatingNav pathname={pathname} />

      <Modal
        open={globalMenuOpen}
        onClose={() => setGlobalMenuOpen(false)}
        title="Navegar pelo seu espaço"
      >
        <MotionMenu open={globalMenuOpen} className="flex flex-col gap-7">
          <SectionLinks onNavigate={() => setGlobalMenuOpen(false)} />
          <ThemeToggle />
        </MotionMenu>
      </Modal>
    </div>
  );
}
