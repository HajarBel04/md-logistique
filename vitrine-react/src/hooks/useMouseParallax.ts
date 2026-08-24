import { useCallback, useEffect, useRef } from 'react';

export function useMouseParallax(enabled = true) {
  const cityRef   = useRef<HTMLDivElement>(null);
  const vanRef    = useRef<HTMLDivElement>(null);
  const cardRef   = useRef<HTMLDivElement>(null);
  const rafRef    = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const animate = useCallback(() => {
    currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, 0.08);
    currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, 0.08);
    const { x, y } = currentRef.current;
    if (cityRef.current)  cityRef.current.style.transform  = `translate(${x*3}px, ${y*3}px)`;
    if (vanRef.current)   vanRef.current.style.transform   = `translate(${x*5}px, ${y*5}px)`;
    if (cardRef.current)  cardRef.current.style.transform  = `translate(${x*8}px, ${y*8}px)`;
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!enabled || window.innerWidth < 1024) return;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth  - 0.5);
      const ny = (e.clientY / window.innerHeight - 0.5);
      targetRef.current = { x: nx, y: ny };
    };
    window.addEventListener('mousemove', onMove);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, animate]);

  return { cityRef, vanRef, cardRef };
}
