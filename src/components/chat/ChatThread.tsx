import { ArrowUp, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { MAX_QUESTION_LENGTH, type ChatMessage } from "@/lib/chat/conversations";
import { cn } from "@/lib/utils";

import { MessageBlockView } from "./MessageBlocks";

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-fade-up">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-surface-raised px-4 py-2.5 text-[0.9375rem] leading-relaxed text-foreground">
        {text}
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex gap-3 animate-fade-up">
      <LogoMark className="mt-0.5 size-7 shrink-0" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="prose-agent">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
        {message.blocks.map((b, i) => (
          <MessageBlockView key={i} block={b} />
        ))}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <LogoMark className="size-7 shrink-0" />
      <div className="flex items-center gap-1 rounded-full border bg-surface px-3 py-2" aria-label="Analisando seus dados">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">Analisando seus dados…</span>
      </div>
    </div>
  );
}

export function Composer({ onSend, busy }: { onSend: (q: string) => void; busy: boolean }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const text = value.trim();
    if (!text || busy) return;
    if (text.length > MAX_QUESTION_LENGTH) {
      toast.error(`Sua mensagem passou de ${MAX_QUESTION_LENGTH} caracteres. Tente encurtá-la.`);
      return;
    }
    onSend(text);
    setValue("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="surface-card flex items-end gap-2 p-2 pl-4 focus-within:shadow-glow">
      <label htmlFor="chat-input" className="sr-only">
        Pergunte sobre suas finanças
      </label>
      <textarea
        id="chat-input"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Pergunte sobre suas finanças…"
        className="max-h-[180px] min-h-[2.5rem] flex-1 resize-none bg-transparent py-2 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground"
      />
      <Button type="submit" size="icon" disabled={busy || !value.trim()} aria-label="Enviar pergunta" className="shrink-0 rounded-lg">
        {busy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
      </Button>
    </form>
  );
}

export function ChatThread({
  messages,
  pending,
  onSend,
  empty,
}: {
  messages: ChatMessage[];
  pending: string | null;
  onSend: (q: string) => void;
  empty?: ReactNode;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  const isEmpty = messages.length === 0 && pending === null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={cn("mx-auto w-full max-w-3xl px-4 py-6 sm:px-6", isEmpty && "flex h-full flex-col justify-center")}>
          {isEmpty ? (
            empty
          ) : (
            <div className="space-y-7">
              {messages.map((m) => (m.role === "user" ? <UserBubble key={m.id} text={m.content} /> : <AssistantMessage key={m.id} message={m} />))}
              {pending !== null && (
                <>
                  <UserBubble text={pending} />
                  <Thinking />
                </>
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
      <div className="border-t bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 pb-3 pt-3 sm:px-6">
          <Composer onSend={onSend} busy={pending !== null} />
          <p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
            Modo demonstração: respostas calculadas sobre dados fictícios. O agente apenas consulta — não faz transferências.
          </p>
        </div>
      </div>
    </div>
  );
}
