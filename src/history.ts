import { useEffect, useRef, useState } from 'react';

/**
 * View state backed by the browser history so the Back button moves between
 * in-app views instead of leaving the site. Call the returned `navigate`
 * for user-initiated changes; Back/Forward restore previous views.
 */
export function useHistoryNav<T>(initial: T, key: string): [T, (v: T) => void] {
  const [view, setView] = useState<T>(initial);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    history.replaceState({ ...(history.state || {}), [key]: initial }, '');
    const onPop = (e: PopStateEvent) => {
      const v = e.state?.[key];
      if (v !== undefined && v !== viewRef.current) setView(v as T);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = (v: T) => {
    if (v === viewRef.current) return;
    history.pushState({ ...(history.state || {}), [key]: v }, '');
    setView(v);
  };

  return [view, navigate];
}

/**
 * Makes the Back button close an open overlay/modal instead of navigating away.
 * Pushes a throwaway history entry while `open` is true and calls `onClose` on Back.
 */
export function useModalHistory(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    history.pushState({ ...(history.state || {}), _modal: Date.now() }, '');
    const onPop = () => onCloseRef.current();
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // If closed by UI (not Back), drop the entry we pushed.
      if (history.state?._modal) history.back();
    };
  }, [open]);
}
