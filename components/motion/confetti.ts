"use client";

import confetti from "canvas-confetti";
import { useCallback } from "react";

export function fireConfetti() {
  const colors = ["#34d399", "#6ee7b7", "#60a5fa", "#f8fafc"];
  confetti({
    particleCount: 90,
    spread: 78,
    startVelocity: 42,
    origin: { y: 0.62 },
    colors,
    scalar: 0.9,
    ticks: 220,
  });
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors,
    });
  }, 160);
}

export function useConfetti() {
  return useCallback(() => fireConfetti(), []);
}
