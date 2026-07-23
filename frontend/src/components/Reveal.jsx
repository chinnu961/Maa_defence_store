import { useEffect, useRef, useState } from 'react';

/**
 * Wraps children in a div that fades/slides into view the first time
 * it crosses into the viewport (mirrors the original .animate-on-scroll
 * + IntersectionObserver behavior).
 */
export default function Reveal({ as: Tag = 'div', className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`animate-on-scroll${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
