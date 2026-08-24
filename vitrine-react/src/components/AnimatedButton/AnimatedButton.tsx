import { useRef, type MouseEvent as RMouseEvent } from 'react';
import './AnimatedButton.css';

interface Props {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  children: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function AnimatedButton({ variant, children, href, icon, delay = 0, className = '' }: Props) {
  const btnRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null);

  const handleMouseMove = (e: RMouseEvent<HTMLElement>) => {
    if (window.innerWidth < 1024) return;
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    el.style.transform = `translate(${dx * 4}px, ${dy * 3}px)`;
  };

  const handleMouseLeave = () => {
    if (btnRef.current) btnRef.current.style.transform = '';
  };

  const props = {
    ref: btnRef as any,
    className: `anim-btn anim-btn--${variant} ${className}`,
    style: { animationDelay: `${delay}ms` } as React.CSSProperties,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };

  const inner = (
    <>
      {icon && <span className="anim-btn__icon">{icon}</span>}
      <span>{children}</span>
    </>
  );

  return href
    ? <a href={href} {...props}>{inner}</a>
    : <button {...props}>{inner}</button>;
}
