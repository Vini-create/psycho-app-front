"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import {
  Alert,
  Button,
  Spinner,
  formatDayLabel,
} from "@sinapsa/ui";
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

function ConversationLoading() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const bars = root.current.querySelectorAll("[data-loading-bar]");
    const context = gsap.context(() => {
      gsap.to(bars, {
        scaleY: 0.35,
        autoAlpha: 0.42,
        duration: 0.52,
        stagger: { each: 0.11, yoyo: true, repeat: -1 },
        transformOrigin: "center",
        ease: "sine.inOut",
      });
    }, root);

    return () => context.revert();
  }, []);

  return (
    <div ref={root} className="grid h-full min-h-[18rem] place-items-center">
      <div className="flex flex-col items-center gap-4 text-secondary">
        <div className="flex h-6 items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((bar) => (
            <span
              key={bar}
              data-loading-bar
              className="h-5 w-0.5 rounded-full bg-brand"
            />
          ))}
        </div>
        <span className="metadata">Preparando seu espaço…</span>
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
  const [isReady, setIsReady] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const idempotency = useRef<{ content: string; key: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLUListElement>(null);
  const animatedMessages = useRef(new Set<string>());
  const positionedConversation = useRef<string | null>(null);
  const messages = useMemo(() => data?.messages ?? [], [data]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    requestAnimationFrame(() => {
      // O marcador vive DEPOIS do composer. Esperar mais um frame garante que
      // mensagens, estado de envio e a altura elástica do textarea já tenham
      // sido medidos antes de definir o fim real da conversa.
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ block: "end", behavior });
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
    if (isPending || !isReady) return;

    const behavior =
      positionedConversation.current === conversationId ? "smooth" : "auto";
    scrollToBottom(behavior);
    positionedConversation.current = conversationId;
  }, [conversationId, isPending, isReady, messages.length, scrollToBottom, send.isPending]);

  useEffect(() => {
    if (isPending) return;

    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    void fontsReady.then(() => {
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          if (!cancelled) setIsReady(true);
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [isPending]);

  useLayoutEffect(() => {
    animatedMessages.current.clear();
  }, [conversationId]);

  useLayoutEffect(() => {
    if (isPending || !isReady || !messageListRef.current) return;
    const elements = Array.from(
      messageListRef.current.querySelectorAll<HTMLElement>("[data-message-id]"),
    );
    const unseen = elements.filter((element) => {
      const id = element.dataset.messageId;
      return id && !animatedMessages.current.has(id);
    });
    unseen.forEach((element) => {
      const id = element.dataset.messageId;
      if (id) animatedMessages.current.add(id);
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const parts = unseen.slice(-8).flatMap((element) =>
      Array.from(element.children),
    );
    if (parts.length === 0) return;

    gsap.fromTo(
      parts,
      { autoAlpha: 0, y: 9 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.38,
        stagger: 0.035,
        ease: "power3.out",
        clearProps: "opacity,visibility,transform",
      },
    );

    return () => {
      gsap.killTweensOf(parts);
    };
  }, [isPending, isReady, messages]);

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

  if (isPending || !isReady) return <ConversationLoading />;

  return (
    <div className="flex min-h-full flex-col gap-6 pt-24">
      {error && <Alert tone="danger">{describeError(error).message}</Alert>}

      <div className="flex-1">
        <ul ref={messageListRef} className="flex flex-col gap-6 pb-4">
          {messages.length === 0 && <ConversationOpening />}
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const showDay =
              !previous ||
              formatDayLabel(previous.created_at) !== formatDayLabel(message.created_at);
            const hint = retryHint(message);

            return (
              <Fragment key={message.id}>
                {showDay && <DaySeparator label={formatDayLabel(message.created_at)} />}
                <MessageBubble
                  message={message}
                  showTime={endsBlock(index)}
                  footer={
                    hint && (
                      <span className="flex items-center gap-2">
                        <span className="metadata text-secondary">{hint.label}</span>
                        {hint.canRetry && (
                          <Button
                            size="sm"
                            variant="tertiary"
                            loading={retry.isPending && retry.variables === message.id}
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
            <li className="flex items-center gap-4 pl-5 text-secondary">
              <Spinner />
              <span className="metadata">Sinapsa está lendo…</span>
            </li>
          )}
        </ul>
      </div>

      {sendError && (
        <Alert tone="warning" title="Não consegui responder">{sendError}</Alert>
      )}

      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={handleSend}
        sending={send.isPending}
      />

      <div ref={bottomRef} className="-mt-6 h-px shrink-0" aria-hidden="true" />
    </div>
  );
}
