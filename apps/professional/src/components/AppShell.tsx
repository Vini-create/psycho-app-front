"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode, type SVGProps } from "react";
import { Metadata, Modal, ThemeToggle, cx } from "@sinapsa/ui";
import { Logo } from "./Logo";
import { useSession } from "@/lib/session";

const NAV = [
  { href: "/", label: "Painel", index: "01", icon: PanelIcon },
  { href: "/pacientes", label: "Pacientes", index: "02", icon: PatientsIcon },
  { href: "/convites", label: "Convites", index: "03", icon: InviteIcon },
  { href: "/conta", label: "Conta", index: "04", icon: PersonIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function IconBase({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="M4 7h16M4 12h11M4 17h16" /></IconBase>;
}

function PanelIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z" /></IconBase>;
}

function PatientsIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.4-4 2.1-6 5.5-6s5.1 2 5.5 6M15.5 5.5a3 3 0 0 1 0 5.5M17 14c2.4.5 3.5 2.4 3.5 5" /></IconBase>;
}

function InviteIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6M18 2v6M15 5h6" /></IconBase>;
}

function PersonIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><circle cx="12" cy="8" r="3.5" /><path d="M5 21c.5-4.6 2.7-7 7-7s6.5 2.4 7 7" /></IconBase>;
}

function SectionLinks({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <ol className="divide-y divide-border-subtle border-y border-border-subtle">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cx(
                "grid min-h-14 grid-cols-[minmax(0,1fr)_2rem_1rem] items-center gap-2 py-3 transition-colors duration-140 ease-sinapsa",
                active ? "text-brand" : "text-primary hover:text-brand",
              )}
            >
              <span className="font-editorial text-[1.35rem] font-semibold">{item.label}</span>
              <span className="metadata text-right text-secondary">{item.index}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function FloatingNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Seções" className="glass-nav fixed inset-x-4 bottom-4 z-30 mx-auto max-w-[32rem] rounded-full p-2">
      <ul className="grid grid-cols-4 gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group flex min-h-13 flex-col items-center justify-center gap-1 rounded-full px-1 font-utility text-caption font-bold transition-[background-color,color,transform] duration-200 ease-sinapsa active:scale-[0.97]",
                  active ? "bg-action text-on-action shadow-[0_8px_20px_-12px_rgb(29_25_30/0.75)]" : "text-secondary hover:bg-surface/55 hover:text-primary",
                )}
              >
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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { account } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <header className="sticky top-0 z-20 bg-canvas/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-(--container-institutional) items-center justify-between px-5 sm:px-8">
          <Link href="/" className="rounded-sm" aria-label="Painel profissional da Sinapsa">
            <Logo className="text-[1.9rem] sm:text-[2.1rem]" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid size-11 place-items-center rounded-lg bg-surface text-primary transition-colors hover:bg-subtle active:scale-95"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            <MenuIcon className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[64rem] flex-1 px-5 pb-32 pt-5 sm:px-8 sm:pb-36 sm:pt-8 lg:px-12">
        {children}
      </main>

      <FloatingNav pathname={pathname} />

      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Navegar pelo espaço profissional"
        className="w-[min(22rem,calc(100vw-2rem))] !rounded-2xl overflow-hidden"
        contentClassName="gap-6 p-6"
      >
        <SectionLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-border-subtle pt-4">
          <div className="min-w-0">
            <Metadata>Tema</Metadata>
            {account && <p className="metadata mt-1 truncate text-secondary">{account.email}</p>}
          </div>
          <ThemeToggle />
        </div>
      </Modal>
    </div>
  );
}
