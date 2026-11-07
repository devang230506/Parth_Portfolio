import { Injectable, NgZone, inject } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private ngZone = inject(NgZone);

  isReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  createContext(scope: Element): gsap.Context {
    return gsap.context(() => {}, scope);
  }

  animateHero(container: HTMLElement, ctx?: gsap.Context): void {
    if (this.isReducedMotion()) return;

    const action = () => {
      this.ngZone.runOutsideAngular(() => {
        const headline = container.querySelector('.hero-headline');
        const subhead = container.querySelector('.hero-subheading');
        const ctas = container.querySelectorAll('.hero-cta');

        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        if (headline) {
          tl.from(headline, {
            y: 20,
            opacity: 0.2,
            duration: 0.9,
            ease: 'power2.out'
          });
        }

        if (subhead) {
          tl.from(subhead, {
            y: 15,
            opacity: 0.2,
            duration: 0.7,
            ease: 'power2.out'
          }, '-=0.6');
        }

        if (ctas.length > 0) {
          tl.from(ctas, {
            y: 12,
            opacity: 0.2,
            stagger: 0.1,
            duration: 0.6,
            ease: 'power2.out'
          }, '-=0.5');
        }
      });
    };

    if (ctx) {
      ctx.add(action);
    } else {
      action();
    }
  }

  animateOnScroll(elements: HTMLElement[] | NodeListOf<Element>, options: { y?: number; stagger?: number; delay?: number } = {}, ctx?: gsap.Context): void {
    if (this.isReducedMotion()) return;

    const action = () => {
      this.ngZone.runOutsideAngular(() => {
        const yOffset = options.y ?? 35;
        const stagger = options.stagger ?? 0.15;
        const delay = options.delay ?? 0;

        elements.forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: yOffset },
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              delay,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none none'
              }
            }
          );
        });
      });
    };

    if (ctx) {
      ctx.add(action);
    } else {
      action();
    }
  }

  animateCounter(target: HTMLElement, endValue: number, duration: number = 2, ctx?: gsap.Context, decimals: number = 0): void {
    if (this.isReducedMotion()) {
      target.innerText = decimals > 0 ? endValue.toFixed(decimals) : endValue.toString();
      return;
    }

    const action = () => {
      this.ngZone.runOutsideAngular(() => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: endValue,
          duration,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: target,
            start: 'top 90%',
            once: true
          },
          onUpdate: () => {
            target.innerText = decimals > 0 
              ? obj.val.toFixed(decimals) 
              : Math.floor(obj.val).toString();
          },
          onComplete: () => {
            target.innerText = decimals > 0 
              ? endValue.toFixed(decimals) 
              : endValue.toString();
          }
        });
      });
    };

    if (ctx) {
      ctx.add(action);
    } else {
      action();
    }
  }

  refreshScrollTrigger(): void {
    if (typeof window !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }
}
