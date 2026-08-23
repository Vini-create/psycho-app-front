"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Button, formatDayMark } from "@sinapsa/ui";
import { describeError, newIdempotencyKey, type Message } from "@sinapsa/api-client";
import { useMessages, useRetryMessage, useSendMessage } from "@/lib/queries";
import { useNow } from "@/lib/useNow";
import { Composer } from "./Composer";
import {
  ConversationOpening,
  DaySeparator,
  MessageBubble,
} from "./MessageBubble";

const RETRY_WINDOW_MS = 60_000;

/* Brand Book V2 §25 — "Loading: skeleton em linhas e blocos; shimmer muito
   sutil ou nenhum."

   As quatro barrinhas pulsando em GSAP saíram: era animação decorativa no
   caminho da leitura. Ficou o esqueleto do que vai aparecer — linhas na
   medida do texto, na posição do texto. */
function ConversationLoading() {
  return (
    <div className="mx-auto flex w-full max-w-(--container-conversation) flex-col gap-8 px-5 pt-10 sm:px-6">
      <span className="sr-only">Preparando seu espaço…</span>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="h-4 w-[62%] rounded-xs bg-sunken" />
        <div className="h-4 w-[88%] rounded-xs bg-sunken" />
        <div className="h-4 w-[74%] rounded-xs bg-sunken" />
      </div>
      <div aria-hidden="true" className="flex justify-end">
        <div className="h-16 w-[58%] rounded-md rounded-br-xs bg-sunken" />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="h-4 w-[80%] rounded-xs bg-sunken" />
        <div className="h-4 w-[55%] rounded-xs bg-sunken" />
      </div>
    </div>
  );
}

export function ChatConversation({ conversationId }: { conversationId: string }) {
  const { data, isPending, error } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const retry = useRetryMessage(conversationId);
  const now = useNow();
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [composerHeight, setComposerHeight] = useState(96);
  const idempotency = useRef<{ content: string; key: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const positionedConversation = useRef<string | null>(null);
  const messages = useMemo(() => data?.messages ?? [], [data]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    // Dois frames: o primeiro deixa o React pintar a mensagem nova, o
    // segundo deixa o textarea elástico terminar de medir a própria altura.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const element = scrollRef.current;
        if (!element) return;
        element.scrollTo({ top: element.scrollHeight, behavior });
      });
    });
  }, []);

  function keyFor(content: string): string {
    if (idempotency.current?.content === content) return idempotency.current.key;
    const key = newIdempotencyKey();
    idempotency.current = { content, key };
    return key;
  }

  function endsBlock(index: number): boolean {
    const current = messages[index];
    const next = messages[index + 1];
    if (!current) return false;
    if (!next) return true;
    if (next.role !== current.role) return true;
    return Date.parse(next.created_at) - Date.parse(current.created_at) > 10 * 60_000;
  }

  useEffect(() => {
    if (isPending) return;

    const behavior =
      positionedConversation.current === conversationId ? "smooth" : "auto";
    scrollToBottom(behavior);
    positionedConversation.current = conversationId;
  }, [conversationId, isPending, messages.length, scrollToBottom, send.isPending]);

  async function handleSend() {
    const content = draft.trim();
    if (!content) return;
    setSendError(null);

    try {
      const pendingResponse = send.mutateAsync({
        content,
        idempotencyKey: keyFor(content),
      });
      setDraft("");
      scrollToBottom("smooth");

      const response = await pendingResponse;
      idempotency.current = null;
      if (response.assistant_status === "failed") {
        setSendError("Sua mensagem foi guardada, mas não consegui responder agora.");
      }
    } catch (caught) {
      setDraft(content);
      setSendError(describeError(caught).message);
    }
  }

  function retryHint(message: Message): { canRetry: boolean; label: string } | null {
    if (message.role !== "user") return null;
    if (message.generation_status === "failed") {
      return { canRetry: true, label: "Não consegui responder agora." };
    }
    if (message.generation_status === "pending") {
      const remaining = Math.ceil(
        (RETRY_WINDOW_MS - (now - Date.parse(message.created_at))) / 1000,
      );
      return remaining > 0
        ? { canRetry: false, label: `Ainda pensando… (${remaining}s)` }
        : { canRetry: true, label: "Isso está demorando." };
    }
    return null;
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Área de leitura. Rola por dentro; a moldura não rola junto. */}
      <div
        ref={scrollRef}
        data-chat-scroll
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div
          className="mx-auto flex w-full max-w-(--container-conversation) flex-col gap-6 px-5 pt-[6.25rem] sm:px-6 lg:pt-10"
          style={{ paddingBottom: `${composerHeight + 24}px` }}
        >
          {error && <Alert tone="danger">{describeError(error).message}</Alert>}

          {isPending ? (
            <ConversationLoading />
          ) : (
            <ul className="flex flex-col gap-8">
              {messages.length === 0 && <ConversationOpening />}

              {messages.map((message, index) => {
                const previous = messages[index - 1];
                const showDay =
                  !previous ||
                  formatDayMark(previous.created_at) !==
                    formatDayMark(message.created_at);
                const hint = retryHint(message);

                return (
                  <Fragment key={message.id}>
                    {showDay && (
                      <DaySeparator label={formatDayMark(message.created_at)} />
                    )}
                    <MessageBubble
                      message={message}
                      showTime={endsBlock(index)}
                      footer={
                        hint && (
                          <span className="flex items-center gap-3">
                            <span className="type-meta text-tertiary">
                              {hint.label}
                            </span>
                            {hint.canRetry && (
                              <Button
                                size="sm"
                                variant="text"
                                loading={
                                  retry.isPending && retry.variables === message.id
                                }
                                onClick={() => retry.mutate(message.id)}
                              >
                                Tentar novamente
                              </Button>
                            )}
                          </span>
                        )
                      }
                    />
                  </Fragment>
                );
              })}

              {send.isPending && (
                <li className="type-meta flex items-center gap-3 text-tertiary">
                  {/* Três pontos estáticos: presença sem espetáculo (§27). */}
                  <span aria-hidden="true" className="flex gap-1">
                    <span className="size-1 rounded-full bg-accent-lavender" />
                    <span className="size-1 rounded-full bg-accent-lavender" />
                    <span className="size-1 rounded-full bg-accent-lavender" />
                  </span>
                  Sinapsa está lendo…
                </li>
              )}
            </ul>
          )}

          {sendError && (
            <Alert tone="warning" title="Não consegui responder">
              {sendError}
            </Alert>
          )}
        </div>
      </div>

      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={handleSend}
        sending={send.isPending}
        onHeightChange={setComposerHeight}
      />
    </div>
  );
}
