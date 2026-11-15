import { ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';
import { SmoothScrollService } from '../../core/services/smooth-scroll.service';

@Component({
  selector: 'app-book-a-call',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="booking-header scroll-reveal">
      <span class="badge-chip">{{ chipText }}</span>
      <h2 class="booking-title">{{ title }}</h2>
    </div>

    <!-- Cal.com Interactive Booking Embed Card -->
    <div 
      class="cal-embed-wrapper" 
      [class.cal-ready]="calReady"
    >
      <!-- Mount container for Cal.com embed -->
      <div 
        [id]="containerId" 
        class="cal-container"
      ></div>

      <!-- Loading / Timeout Fallback Overlay -->
      <div class="cal-fallback" *ngIf="!calReady">
        <!-- Active Spinner (first 8s) -->
        <div *ngIf="!hasTimeoutError" class="cal-loading-state">
          <div class="cal-spinner" aria-hidden="true"></div>
          <p class="fallback-desc">Loading scheduling calendar...</p>
        </div>

        <!-- Timeout Message (after 8s) -->
        <div *ngIf="hasTimeoutError" class="cal-error-state">
          <p class="fallback-error-title">Calendar didn't load</p>
          <p class="fallback-desc">You can schedule directly on Cal.com using the link below:</p>
        </div>

        <!-- Always Available Direct Link Button -->
        <a 
          [href]="directCalUrl" 
          target="_blank" 
          rel="noopener noreferrer"
          class="cal-open-link"
          aria-label="Open Cal.com Booking Calendar in new tab"
        >
          Open Booking Calendar ↗
        </a>
      </div>
    </div>
  `,
  styleUrls: ['./book-a-call.component.scss']
})
export class BookACallComponent implements OnInit, OnDestroy {
  private zone = inject(NgZone);
  private el = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private smoothScroll = inject(SmoothScrollService);

  @Input() calLink?: string;
  @Input() calNamespace?: string;
  @Input() chipText: string = PORTFOLIO_CONFIG.booking.chipText || 'Book a Call';
  @Input() title: string = PORTFOLIO_CONFIG.booking.title || "Let's talk scope, timeline, and budget — no fluff, just clarity";

  readonly containerId = 'my-cal-inline-intro';
  calReady = false;
  hasTimeoutError = false;
  embedHeight?: string;

  private timeoutTimer?: any;
  private mutationObserver?: MutationObserver;
  private iframeStyleObserver?: MutationObserver;
  private scrollDebounceTimer?: any;
  private cancelled = false;

  get resolvedCalLink(): string {
    const raw = this.calLink || environment.calLink || PORTFOLIO_CONFIG.booking.calLink;
    return raw ? raw.replace(/^https?:\/\/(app\.)?cal\.com\//i, '').replace(/^\/+|\/+$/g, '').trim() : '';
  }

  get resolvedNamespace(): string {
    return this.calNamespace || environment.calNamespace || PORTFOLIO_CONFIG.booking.calNamespace || '30min';
  }

  get directCalUrl(): string {
    return `https://cal.com/${this.resolvedCalLink}`;
  }

  ngOnInit(): void {
    if (!environment.production) {
      console.log(`[BookACall] Configured with namespace: "${this.resolvedNamespace}", calLink: "${this.resolvedCalLink}"`);
      if (!this.resolvedCalLink) {
        console.error('[BookACall] CAL_LINK is not set! Please define CAL_LINK or NEXT_PUBLIC_CAL_LINK in .env');
      }
    }

    if (typeof window !== 'undefined') {
      this.initCal();
    }
  }

  ngOnDestroy(): void {
    this.cancelled = true;
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this.iframeStyleObserver) {
      this.iframeStyleObserver.disconnect();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleWindowMessage);
    }
  }

  private ensureCalSnippet(): void {
    const win = window as any;
    if (!win.Cal) {
      (function (C: any, A: string, L: string) {
        const p = function (a: any, ar: any) { a.q.push(ar); };
        const d = C.document;
        C.Cal = C.Cal || function () {
          const cal = C.Cal;
          const ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement('script')).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function () { p(api, arguments); };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === 'string') {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ['initNamespace', namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
      })(win, 'https://app.cal.com/embed/embed.js', 'init');
    }
  }

  private initCal(): void {
    try {
      this.ensureCalSnippet();

      const win = window as any;
      const ns = this.resolvedNamespace;
      const link = this.resolvedCalLink;

      win.Cal('init', ns, { origin: 'https://app.cal.com' });

      if (win.Cal.ns && win.Cal.ns[ns]) {
        win.Cal.ns[ns]('inline', {
          elementOrSelector: '#' + this.containerId,
          config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true', theme: 'dark' },
          calLink: link
        });

        win.Cal.ns[ns]('ui', {
          theme: 'dark',
          cssVarsPerTheme: {
            light: { 'cal-brand': '#D1FF18' },
            dark: { 'cal-brand': '#D1FF18' }
          },
          hideEventTypeDetails: false,
          layout: 'month_view'
        });

        // Event listener for linkReady
        win.Cal.ns[ns]('on', {
          action: 'linkReady',
          callback: (e: any) => {
            if (!this.cancelled) {
              this.zone.run(() => {
                this.calReady = true;
                if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
                const height = this.extractCalHeight(e);
                if (height) {
                  this.updateEmbedHeight(height);
                }
              });
            }
          }
        });

        // Event listener for __iframeReady
        win.Cal.ns[ns]('on', {
          action: '__iframeReady',
          callback: (e: any) => {
            if (!this.cancelled) {
              this.zone.run(() => {
                this.calReady = true;
                if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
                const height = this.extractCalHeight(e);
                if (height) {
                  this.updateEmbedHeight(height);
                }
              });
            }
          }
        });

        // Event listener for __dimensionChanged: auto-resize container as content steps change
        win.Cal.ns[ns]('on', {
          action: '__dimensionChanged',
          callback: (e: any) => {
            if (!this.cancelled) {
              const height = this.extractCalHeight(e);
              if (height) {
                this.updateEmbedHeight(height);
              }
            }
          }
        });

        // Event listener for dateSelected
        win.Cal.ns[ns]('on', {
          action: 'dateSelected',
          callback: () => {
            if (!this.cancelled) {
              this.onDateOrRouteChanged();
            }
          }
        });

        // Event listener for timeSelected
        win.Cal.ns[ns]('on', {
          action: 'timeSelected',
          callback: () => {
            if (!this.cancelled) {
              this.onTimeSelected();
            }
          }
        });
      }

      // Also listen to postMessage from Cal iframe for dimension and step changes
      window.addEventListener('message', this.handleWindowMessage);

      // DOM load and style observer for iframe
      const container = this.el.nativeElement.querySelector('#' + this.containerId);
      if (container) {
        const existingIframe = container.querySelector('iframe');
        if (existingIframe) {
          this.setupIframeProperties(existingIframe);
        }
        this.mutationObserver = new MutationObserver(() => {
          const iframe = container.querySelector('iframe');
          if (iframe) {
            this.setupIframeProperties(iframe);
            iframe.addEventListener('load', () => {
              if (!this.cancelled) {
                this.zone.run(() => {
                  this.calReady = true;
                  if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
                  this.setupIframeProperties(iframe);
                });
              }
            });
          }
        });
        this.mutationObserver.observe(container, { childList: true, subtree: true });
      }

      // 8-second safety timeout: spinner never spins forever
      this.timeoutTimer = setTimeout(() => {
        if (!this.cancelled && !this.calReady) {
          this.zone.run(() => {
            this.hasTimeoutError = true;
            if (!environment.production) {
              console.warn('[BookACall] Calendar did not signal ready within 8s. Showing fallback action.');
            }
          });
        }
      }, 8000);

    } catch (err) {
      if (!environment.production) {
        console.error('[BookACall] Initialization error:', err);
      }
      this.hasTimeoutError = true;
    }
  }

  private setupIframeProperties(iframe: HTMLIFrameElement): void {
    if (!iframe) return;
    try {
      iframe.setAttribute('scrolling', 'no');
      iframe.style.overflow = 'hidden';
      iframe.style.setProperty('touch-action', 'pan-y', 'important');
      iframe.style.touchAction = 'pan-y';

      // Observe iframe style changes (when embed.js adjusts height)
      if (!this.iframeStyleObserver && typeof MutationObserver !== 'undefined') {
        this.iframeStyleObserver = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'style') {
              const h = parseInt(iframe.style.height, 10);
              if (h && h > 200) {
                this.updateEmbedHeight(h);
              }
            }
          }
        });
        this.iframeStyleObserver.observe(iframe, { attributes: true, attributeFilter: ['style'] });
      }
    } catch (_) {}
  }

  private extractCalHeight(data: any): number | undefined {
    if (!data) return undefined;
    if (typeof data === 'number' && Number.isFinite(data) && data > 50) return data;

    const findHeight = (obj: any, depth = 0): number | undefined => {
      if (!obj || depth > 5 || typeof obj !== 'object') return undefined;

      const directH = obj.iframeHeight ?? obj.height;
      if (typeof directH === 'number' && Number.isFinite(directH) && directH > 50) {
        return directH;
      }

      for (const key of ['data', 'detail', 'payload', 'dimensions']) {
        if (obj[key]) {
          const res = findHeight(obj[key], depth + 1);
          if (res) return res;
        }
      }
      return undefined;
    };

    return findHeight(data);
  }

  private handleWindowMessage = (event: MessageEvent): void => {
    try {
      let data = event.data;
      if (typeof data === 'string' && (data.includes('dimensionChanged') || data.includes('__dimensionChanged') || data.includes('CAL'))) {
        try {
          data = JSON.parse(data);
        } catch (_) {}
      }
      if (data && typeof data === 'object') {
        const typeStr = String(data.type || data.action || data.fullType || '');

        // 1. Check for height dimension updates
        const height = this.extractCalHeight(data);
        if (height) {
          this.updateEmbedHeight(height);
        }

        // 2. Check for date selection or step navigation
        if (
          typeStr.includes('dateSelected') || 
          typeStr.includes('slotsFetched') || 
          typeStr === '__routeChanged' || 
          typeStr.includes('navigatedToBooker')
        ) {
          this.onDateOrRouteChanged();
        }

        // 3. Check for time slot selection
        if (typeStr.includes('timeSelected')) {
          this.onTimeSelected();
        }
      }
    } catch (_) {}
  };

  private updateEmbedHeight(height: number): void {
    if (this.cancelled) return;
    const target = Math.round(height);
    if (target < 200) return;
    this.embedHeight = `${target}px`;

    const container = this.el.nativeElement.querySelector('#' + this.containerId) as HTMLElement;
    if (container) {
      container.style.height = `${target}px`;
      container.style.minHeight = `${target}px`;
      const calInline = container.querySelector('cal-inline') as HTMLElement;
      if (calInline) {
        calInline.style.height = `${target}px`;
        calInline.style.minHeight = `${target}px`;
      }
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.style.height = `${target}px`;
        iframe.style.minHeight = `${target}px`;
        iframe.setAttribute('scrolling', 'no');
        iframe.style.overflow = 'hidden';
        iframe.style.setProperty('touch-action', 'pan-y', 'important');
        iframe.style.touchAction = 'pan-y';
      }
    }
    this.zone.run(() => {
      this.cdr.markForCheck();
    });
  }

  private onDateOrRouteChanged(): void {
    if (typeof window === 'undefined') return;
    if (this.scrollDebounceTimer) clearTimeout(this.scrollDebounceTimer);

    // Smoothly ensure time slots are visible in viewport on smaller screens without resetting scroll
    this.scrollDebounceTimer = setTimeout(() => {
      if (window.innerWidth <= 1024) {
        const container = this.el.nativeElement.querySelector('#' + this.containerId) as HTMLElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();

        // If slots loaded below visible area or container top is scrolled off
        if (rect.top < 60 || rect.top > 200) {
          this.smoothScroll.scrollTo(container, { offset: -80, duration: 0.6 });
        }
      }
    }, 250);
  }

  private onTimeSelected(): void {
    if (typeof window === 'undefined') return;
    if (this.scrollDebounceTimer) clearTimeout(this.scrollDebounceTimer);

    // Smoothly bring the booking form into view with header offset
    this.scrollDebounceTimer = setTimeout(() => {
      if (window.innerWidth <= 1024) {
        const container = this.el.nativeElement.querySelector('#' + this.containerId) as HTMLElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        if (rect.top < 60 || rect.top > 200) {
          this.smoothScroll.scrollTo(container, { offset: -80, duration: 0.6 });
        }
      }
    }, 200);
  }
}

// Named alias export for convenience
export const BookACall = BookACallComponent;
