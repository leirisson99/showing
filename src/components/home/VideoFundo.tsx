"use client";

import { useEffect, useRef } from "react";

// Vídeo decorativo de fundo, sem camada escura por cima. Com "reduzir movimento"
// fica parado no primeiro quadro.
export function VideoFundo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) ref.current?.pause();
  }, []);

  return <video ref={ref} className={className} src={src} autoPlay loop muted playsInline preload="auto" aria-hidden tabIndex={-1} />;
}
