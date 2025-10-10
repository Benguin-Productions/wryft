import { useEffect, useRef, useState } from 'react';

// useFadeMount keeps a component mounted during exit to allow fade-out animations.
// Returns: mounted flag and an animation class: 'fade-enter' when opening, 'fade-exit' when closing.
export default function useFadeMount(isOpen: boolean, durationMs = 180) {
  const [mounted, setMounted] = useState(isOpen);
  const [animClass, setAnimClass] = useState<string>(isOpen ? 'fade-enter' : '');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      // mount and play enter
      setMounted(true);
      // next tick to ensure transition applies
      requestAnimationFrame(() => setAnimClass('fade-enter'));
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } else if (mounted) {
      // play exit
      setAnimClass('fade-exit');
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setMounted(false);
        setAnimClass('');
      }, durationMs) as unknown as number;
    }
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, mounted, durationMs]);

  return { mounted, animClass } as const;
}
