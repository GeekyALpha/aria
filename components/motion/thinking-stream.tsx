"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

interface ThinkingStreamProps {
  text: string;
  className?: string;
  /** Re-trigger the reveal whenever this key changes (parent should also key the component). */
  triggerKey?: string | number;
  speedMs?: number;
}

/**
 * Live agent "thinking" stream — reveals the LLM reasoning token-by-token with a
 * particle field, so judges visibly watch intelligence happen.
 */
export function ThinkingStream({
  text,
  className,
  triggerKey,
  speedMs = 14,
}: ThinkingStreamProps) {
  const reduced = usePrefersReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let i = 0;
    const id = setInterval(() => {
      i += Math.max(1, Math.round(text.length / 240));
      setCount(i);
      if (i >= text.length) clearInterval(id);
    }, speedMs);
    return () => clearInterval(id);
  }, [text, triggerKey, speedMs, reduced]);

  const shown = reduced ? text : text.slice(0, count);
  const done = shown.length >= text.length;
  const particles = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);

  return (
    <div className={className}>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center gap-1.5 opacity-60">
          {particles.map((i) => (
            <motion.span
              key={i}
              className="h-1 w-1 rounded-full bg-[var(--success)]"
              animate={{ y: [0, -6, 0], opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: i * 0.16,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <p className="relative whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground/90">
          {shown}
          <AnimatePresence>
            {!done && (
              <motion.span
                className="ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] bg-[var(--success)]"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, repeatType: "reverse" }}
              />
            )}
          </AnimatePresence>
        </p>
      </div>
    </div>
  );
}

const reduceQuery = "(prefers-reduced-motion: reduce)";

function subscribeReduce(callback: () => void) {
  const mq = window.matchMedia(reduceQuery);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function readReduce() {
  return window.matchMedia(reduceQuery).matches;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduce,
    readReduce,
    () => false,
  );
}
