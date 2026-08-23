"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  AppFrame,
  FolderDock,
  FolderNav,
  type FolderNavItem,
} from "@sinapsa/ui";
import { Logo } from "./Logo";
import { useSession } from "@/lib/session";

/* Brand Book V2 §09.

   Navegação primária do profissional: Painel, Pacientes, Convites, Conta.
   Quatro destinos, o teto do brandbook. A navegação local dentro de um
   paciente (Visão geral, Período, Timeline, Para sessão) usa <LocalNav />,
   com peso visual menor — "uma navegação principal + uma local".

   Saíram daqui a pill de vidro flutuante e o header sticky com blur, pelos
   mesmos motivos do app do paciente. */

const NAV: FolderNavItem[] = [
  { href: "/", label: "Painel", icon: "context", color: "sage" },
  { href: "/pacientes", label: "Pacientes", icon: "people", color: "dark" },
  { href: "/convites", label: "Convites", icon: "mail", color: "clay" },
  { href: "/conta", label: "Conta", icon: "person", color: "lavender" },
];

function activeHref(pathname: string): string {
  if (pathname === "/") return "/";
  const match = NAV.find(
    (item) => item.href !== "/" && pathname.startsWith(item.href),
  );
  return match?.href ?? "";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { account } = useSession();
  const active = activeHref(pathname);
  const tone = NAV.find((item) => item.href === active)?.color ?? "dark";

  return (
    <AppFrame
      tone={tone}
      motionKey={pathname}
      rail={
        <FolderNav
          items={NAV}
          activeHref={active}
          linkComponent={Link}
          leading={
            <Link href="/" aria-label="Painel profissional da Sinapsa" className="touch-target rounded-xs">
              <Logo className="text-[1.35rem]" />
            </Link>
          }
          trailing={
            <>
              {account && (
                <span className="type-meta hidden max-w-48 truncate text-secondary lg:block">
                  {account.email}
                </span>
              )}
            </>
          }
        />
      }
      dock={<FolderDock items={NAV} activeHref={active} linkComponent={Link} />}
      mobileBar={
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3 sm:hidden">
          <Link href="/" aria-label="Painel profissional da Sinapsa" className="touch-target rounded-xs">
            <Logo className="text-[1.25rem]" />
          </Link>
        </div>
      }
    >
      <main className="mx-auto w-full max-w-(--container-frame) flex-1 px-5 pt-8 pb-16 sm:px-8 sm:pb-20 lg:px-12 xl:px-16">
        {children}
      </main>
    </AppFrame>
  );
}
