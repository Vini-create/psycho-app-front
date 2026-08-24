import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { ConsentGate } from "@/components/ConsentGate";

/**
 * Layout persistente das quatro pastas.
 *
 * Este arquivo é a peça de arquitetura que torna a metáfora possível: no App
 * Router, um layout não desmonta quando a rota muda dentro dele. Moldura,
 * trilho de abas e corpo da pasta são montados uma única vez; a troca de
 * pasta passa a ser uma mudança de estado de um objeto que continua na tela,
 * e não uma página inteira sumindo para outra aparecer.
 *
 * O grupo `(app)` não aparece na URL: `/`, `/chat`, `/vinculos` e `/conta`
 * continuam exatamente onde estavam. Fora dele ficam as telas que não têm
 * pasta nenhuma — entrar, criar conta, consentimentos, convite.
 *
 * A ordem dos portões também mudou de propósito. `AuthGate` fica fora da
 * moldura, porque antes de haver sessão não há produto a moldurar. O
 * `ConsentGate`, que só espera uma query, ficou dentro: o carregamento
 * pertence ao conteúdo, não à casca (§26) — a pasta permanece aberta
 * enquanto ele resolve.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AppShell>
        <ConsentGate>{children}</ConsentGate>
      </AppShell>
    </AuthGate>
  );
}
