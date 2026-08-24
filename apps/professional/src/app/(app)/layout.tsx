import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGate, MfaGate, OnboardingGate } from "@/components/Gates";

/**
 * Layout persistente das quatro pastas do profissional.
 *
 * Mesma decisão do app do paciente: a moldura e o trilho de abas montam uma
 * vez só, e a troca de pasta vira mudança de estado de um objeto que
 * permanece na tela. O grupo `(app)` não altera nenhuma URL.
 *
 * `AuthGate` fica fora da moldura — sem sessão não há produto a emoldurar.
 * `MfaGate` e `OnboardingGate` entraram para dentro: ambos esperam dados, e
 * espera pertence ao conteúdo, não à casca (§26).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AppShell>
        <MfaGate>
          <OnboardingGate>{children}</OnboardingGate>
        </MfaGate>
      </AppShell>
    </AuthGate>
  );
}
