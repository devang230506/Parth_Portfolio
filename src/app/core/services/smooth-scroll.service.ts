import { Injectable, NgZone, inject } from '@angular/core';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Injectable({
  providedIn: 'root'
})
export class SmoothScrollService {
  private lenis: Lenis | null = null;
  private ngZone = inject(NgZone);
  private tickerCallback: ((time: number) => void) | null = null;

  init(): void {
    if (typeof window === 'undefined') return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    this.ngZone.runOutsideAngular(() => {
      this.lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.8
      });

      // Synchronize Lenis scroll with GSAP ScrollTrigger
      this.lenis.on('scroll', () => {
        ScrollTrigger.update();
      });

      // Drive Lenis RAF from GSAP ticker for frame-locked synchronization
      this.tickerCallback = (time: number) => {
        this.lenis?.raf(time * 1000);
      };

      gsap.ticker.add(this.tickerCallback);
      gsap.ticker.lagSmoothing(0);
    });
  }

  scrollTo(target: string | HTMLElement, options?: { offset?: number; duration?: number }): void {
    if (this.lenis) {
      this.lenis.scrollTo(target, options);
    } else if (typeof window !== 'undefined') {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  destroy(): void {
    if (this.tickerCallback) {
      gsap.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
  }
}
