import {StrictMode, useEffect, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import Lenis from 'lenis';
import './index.css';

/**
 * Lenis smooth scroll — initialised once at the app root.
 *
 * On every frame Lenis updates the scroll position and writes transforms to
 * the wrapper so the browser doesn't jump. We call `lenis.resize()` on
 * viewport changes and `lenis.destroy()` on unmount.
 */
function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,          // lower = smoother / slower catch-up
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });
    // Expose Lenis so overlays (e.g. the product detail panel) can pause it
    // while they are open — otherwise Lenis keeps scrolling the background
    // even when the body is locked with overflow-hidden.
    (window as any).lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync Lenis with GSAP ScrollTrigger (if used elsewhere) and with
    // generic ResizeObserver so it picks up height changes.
    const ro = new ResizeObserver(() => lenis.resize());
    ro.observe(document.body);

    return () => {
      ro.disconnect();
      lenis.destroy();
      delete (window as any).lenis;
    };
  }, []);

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <LenisProvider>
        <App />
      </LenisProvider>
    </LanguageProvider>
  </StrictMode>,
);
