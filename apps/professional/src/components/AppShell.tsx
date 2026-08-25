"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppFrame, FolderDock, type FolderDefinition } from "@sinapsa/ui";
import { Logo } from "./Logo";
import { useSession } from "@/lib/session";

/* Brand Book V2 §09.

   Navegação primária do profissional: Painel, Pacientes, Convites, Conta.
   Quatro destinos, o teto do brandbook — e, desde a reformulação da casca,
   quatro pastas físicas empilhadas sobre a bancada. Não existe mais uma
   navbar: a navegação É a pilha, e abrir uma seção é puxar uma pasta para a
   frente. A navegação local dentro de um paciente (Visão geral, Período,
   Timeline, Para sessão) usa <LocalNav />, com peso visual menor — "uma
   navegação principal + uma local".

   As URLs não mudaram. Cada pasta é exatamente uma rota, e `activeId` é
   derivado do pathname a cada render: deep link, refresh, back e forward do
   navegador continuam sendo a mesma coisa que um clique na aba. */

const FOLDERS: FolderDefinition[] = [
  { id: "/", href: "/", label: "Painel", icon: "context", tone: "sage" },
  {
    id: "/pacientes",
    href: "/pacientes",
    label: "Pacientes",
    icon: "people",
    tone: "dark",
  },
  {
    id: "/convites",
    href: "/convites",
    label: "Convites",
    icon: "mail",
    tone: "clay",
  },
  {
    id: "/conta",
    href: "/conta",
    label: "Conta",
    icon: "person",
    tone: "lavender",
  },
];

function activeFolder(pathname: string): string {
  if (pathname === "/") return "/";
  const match = FOLDERS.find(
    (folder) => folder.id !== "/" && pathname.startsWith(folder.id),
  );
  return match?.id ?? "/";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { account } = useSession();
  const active = activeFolder(pathname);

  return (
    <AppFrame
      folders={FOLDERS}
      activeId={active}
      motionKey={pathname}
      linkComponent={Link}
      brand={
        <Link
          href="/"
          aria-label="Painel profissional da Sinapsa"
          className="touch-target rounded-xs"
        >
          <Logo className="text-[1.35rem]" />
        </Link>
      }
      account={
        account && (
          <span className="type-meta hidden max-w-64 truncate text-secondary sm:block">
            {account.email}
          </span>
        )
      }
      dock={
        <FolderDock items={FOLDERS} activeId={active} linkComponent={Link} />
      }
    >
      <main className="mx-auto w-full max-w-(--container-frame) flex-1 px-5 pt-10 pb-16 sm:px-10 sm:pb-20 lg:px-14 xl:px-20">
        {children}
      </main>
    </AppFrame>
  );
}
