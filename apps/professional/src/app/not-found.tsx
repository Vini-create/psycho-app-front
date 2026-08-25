"use client";

import Link from "next/link";
import { MissingPage } from "@sinapsa/ui";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <MissingPage
      brand={<Logo className="text-[1.35rem]" />}
      contextLabel="Espaço profissional"
      homeLabel="Voltar ao painel"
      tone="sage"
      linkComponent={Link}
    />
  );
}
