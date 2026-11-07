import { Component, ElementRef, Input, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';

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
      class="cal-embed-wrapper scroll-reveal" 
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
  private cancelled = false;

  get resolvedCalLink(): string {
    const raw = this.calLink || environment.calLink || PORTFOLIO_CONFIG.booking.calLink || 'devang-panchal-k5bhsg/30min';
    return raw.replace(/^https?:\/\/(app\.)?cal\.com\//i, '').replace(/^\/+/, '').trim();
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
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
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
                if (!environment.production) {
                  console.log('[BookACall] Event "linkReady" received. Calendar loaded.');
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
                if (!environment.production) {
                  console.log('[BookACall] Event "__iframeReady" received. Calendar ready.');
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
      }

      // Also listen to postMessage from Cal iframe for dimension changes
      window.addEventListener('message', this.handleWindowMessage);

      // Secondary DOM load listener for iframe
      const container = this.el.nativeElement.querySelector('#' + this.containerId);
      if (container) {
        this.mutationObserver = new MutationObserver(() => {
          const iframe = container.querySelector('iframe');
          if (iframe) {
            iframe.addEventListener('load', () => {
              if (!this.cancelled) {
                this.zone.run(() => {
                  this.calReady = true;
                  if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
                });
              }
            });
            this.mutationObserver?.disconnect();
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

  private extractCalHeight(data: any): number | undefined {
    if (!data) return undefined;
    if (typeof data === 'number' && Number.isFinite(data) && data > 0) return data;

    const candidates = [
      data.iframeHeight,
      data.data?.iframeHeight,
      data.data?.data?.iframeHeight,
      data.payload?.iframeHeight,
      data.height,
      data.data?.height,
      data.data?.data?.height,
      data.payload?.height,
      data.detail?.height,
      data.detail?.iframeHeight
    ];

    for (const val of candidates) {
      if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
        return val;
      }
    }
    return undefined;
  }

  private handleWindowMessage = (event: MessageEvent): void => {
    try {
      let data = event.data;
      if (typeof data === 'string' && (data.includes('dimensionChanged') || data.includes('__dimensionChanged'))) {
        try {
          data = JSON.parse(data);
        } catch (_) {}
      }
      if (data && typeof data === 'object') {
        const isDimEvent = 
          data.type === '__dimensionChanged' || 
          data.action === '__dimensionChanged' || 
          data.type === 'CAL:dimensionChanged' || 
          data.type === 'dimensionChanged' ||
          (typeof data.type === 'string' && data.type.includes('dimensionChanged')) ||
          (typeof data.action === 'string' && data.action.includes('dimensionChanged'));

        if (isDimEvent) {
          const height = this.extractCalHeight(data);
          if (height) {
            this.updateEmbedHeight(height);
          }
        }
      }
    } catch (_) {}
  };

  private updateEmbedHeight(height: number): void {
    if (this.cancelled) return;
    this.zone.run(() => {
      const target = Math.round(height);
      this.embedHeight = `${target}px`;

      const container = this.el.nativeElement.querySelector('#' + this.containerId) as HTMLElement;
      if (container) {
        container.style.height = `${target}px`;
        const calInline = container.querySelector('cal-inline') as HTMLElement;
        if (calInline) {
          calInline.style.height = `${target}px`;
        }
        const iframe = container.querySelector('iframe') as HTMLIFrameElement;
        if (iframe) {
          iframe.style.height = `${target}px`;
        }
      }
    });
  }
}

// Named alias export for convenience
export const BookACall = BookACallComponent;
