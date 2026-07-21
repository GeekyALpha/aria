"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Conversation } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DebtorInboxProps {
  messages: Conversation[];
  thinking: boolean;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function DebtorInbox({ messages, thinking, onSend, disabled }: DebtorInboxProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  return (
    <div className="flex h-[440px] flex-col">
      <div ref={scrollRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && !thinking && (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            Run Aria to start the conversation.
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages
            .filter((m) => m.role !== "system")
            .map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
        </AnimatePresence>
        {thinking && <TypingBubble />}
      </div>

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = draftRef.current?.value.trim();
          if (!v) return;
          onSend(v);
          if (draftRef.current) draftRef.current.value = "";
        }}
      >
        <Textarea
          ref={draftRef}
          rows={1}
          placeholder="Reply as the debtor…"
          disabled={disabled}
          className="min-h-[42px] resize-none border-white/10 bg-white/5 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
            }
          }}
        />
        <Button type="submit" size="sm" disabled={disabled} variant="secondary">
          Send
        </Button>
      </form>
    </div>
  );
}

function Bubble({ message }: { message: Conversation }) {
  const isAgent = message.role === "agent";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex items-end gap-2", isAgent ? "justify-start" : "justify-end")}
    >
      {isAgent && <Avatar tone="emerald" icon={<Sparkles className="h-3 w-3" />} />}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap",
          isAgent
            ? "rounded-bl-md bg-white/[0.06] text-foreground"
            : "rounded-br-md bg-emerald-500/90 text-[#052e22]",
        )}
      >
        {message.content}
        <div
          className={cn(
            "mt-1 text-[10px]",
            isAgent ? "text-muted-foreground" : "text-[#052e22]/70",
          )}
        >
          {message.channel} · {relativeTime(message.created_at)}
        </div>
      </div>
      {!isAgent && <Avatar tone="slate" icon={<User className="h-3 w-3" />} />}
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div layout className="flex items-end gap-2">
      <Avatar tone="emerald" icon={<Sparkles className="h-3 w-3" />} />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white/[0.06] px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function Avatar({ tone, icon }: { tone: "emerald" | "slate"; icon: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1",
        tone === "emerald"
          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20"
          : "bg-white/5 text-muted-foreground ring-white/10",
      )}
    >
      {icon}
    </span>
  );
}
