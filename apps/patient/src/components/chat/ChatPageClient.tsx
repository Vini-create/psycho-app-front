"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, EmptyState, Skeleton, VisuallyHidden } from "@sinapsa/ui";
import { useConversations, useCreateConversation } from "@/lib/queries";
import { ChatConversation } from "./ChatConversation";

export function ChatPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversations = useConversations();
  const create = useCreateConversation();
  const items = useMemo(
    () => conversations.data?.conversations ?? [],
    [conversations.data?.conversations],
  );
  const requestedId = searchParams.get("c");
  const activeId = items.some((item) => item.id === requestedId)
    ? requestedId
    : null;

  useEffect(() => {
    if (!conversations.isPending && !activeId && items[0]) {
      router.replace(`/chat?c=${items[0].id}`);
    }
  }, [activeId, conversations.isPending, items, router]);

  async function startConversation() {
    const conversation = await create.mutateAsync(undefined);
    router.replace(`/chat?c=${conversation.id}`);
  }

  if (conversations.isPending || (!activeId && items.length > 0)) {
    return <Skeleton className="mt-8 h-96" aria-label="Abrindo seu espaço" />;
  }

  if (!activeId) {
    return (
      <div className="pt-8">
        <EmptyState
          overline="Seu espaço de IA"
          title="Comece sua primeira conversa."
          description="A Sinapsa organiza a conversa enquanto você escreve, sem exigir que o pensamento chegue pronto."
          action={
            <Button loading={create.isPending} onClick={startConversation}>
              Começar conversa
            </Button>
          }
        />
      </div>
    );
  }

  const activeTitle =
    items.find((item) => item.id === activeId)?.title ?? "Conversa";

  return (
    <>
      {/* Toda tela precisa de um h1. Aqui ele é o nome da conversa: visível
          para leitor de tela, ausente do desenho — o título já está na
          navegação local, e repeti-lo acima da conversa roubaria a abertura
          editorial da página. */}
      <VisuallyHidden as="h1">{activeTitle}</VisuallyHidden>
      <ChatConversation key={activeId} conversationId={activeId} />
    </>
  );
}
