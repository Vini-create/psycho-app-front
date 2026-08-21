import { Suspense } from "react";
import { Skeleton } from "@sinapsa/ui";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { ConsentGate } from "@/components/ConsentGate";
import { ChatPageClient } from "@/components/chat/ChatPageClient";

export default function ChatPage() {
  return (
    <AuthGate>
      <ConsentGate>
        <Suspense fallback={<Skeleton className="h-dvh" aria-label="Abrindo chat" />}>
          <AppShell flush>
            <ChatPageClient />
          </AppShell>
        </Suspense>
      </ConsentGate>
    </AuthGate>
  );
}
