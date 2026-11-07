import { Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';
import { AnimationService } from '../../core/services/animation.service';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="hasTestimonials" class="testimonials-section container" id="test">
      <!-- Section Chip -->
      <div class="section-header scroll-reveal">
        <span class="badge-chip">Testimonials</span>
      </div>

      <!-- Testimonials Grid -->
      <div 
        class="testimonials-grid" 
        role="region" 
        aria-label="Client testimonials"
        (pointerleave)="onGridPointerLeave()"
      >
        <figure 
          *ngFor="let item of config.testimonials; let i = index" 
          class="testimonial-review scroll-reveal"
          [class.active]="activeIndex === i"
          [class.dimmed]="activeIndex !== null && activeIndex !== i"
          tabindex="0"
          role="article"
          [attr.aria-label]="'Testimonial by ' + item.name"
          (pointerenter)="onItemPointerEnter(i, $event)"
          (pointerleave)="onItemPointerLeave(i)"
          (click)="onItemClick(i, $event)"
          (focus)="onItemFocus(i)"
          (blur)="onItemBlur(i)"
        >
          <blockquote class="review-quote-wrap">
            <p class="review-quote-text">{{ formatQuote(item.quote) }}</p>
          </blockquote>

          <figcaption class="author-block">
            <div class="author-avatar-wrap" *ngIf="hasAvatar(item)">
              <img [src]="item.avatar || item.avatarUrl" [alt]="item.name + ' avatar'" loading="lazy" class="author-avatar-img" />
            </div>
            <div class="author-avatar-wrap placeholder-avatar" *ngIf="!hasAvatar(item)" aria-hidden="true">
              <span class="avatar-initial">{{ getInitial(item) }}</span>
            </div>
            <div class="author-details">
              <cite class="author-name">{{ item.name }}</cite>
              <span class="author-role">{{ item.company ? item.role + ' at ' + item.company : item.role }}</span>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  `,
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent implements OnInit, OnDestroy {
  readonly config = PORTFOLIO_CONFIG;
  private el = inject(ElementRef);
  private animationService = inject(AnimationService);
  private ctx?: gsap.Context;

  activeIndex: number | null = null;
  private clearTimer?: ReturnType<typeof setTimeout>;
  private docClickListener?: (e: Event) => void;

  get hasTestimonials(): boolean {
    return !!(this.config.testimonials && this.config.testimonials.length > 0);
  }

  hasAvatar(item: any): boolean {
    const a = item.avatar || item.avatarUrl;
    return !!a && a !== 'REPLACE' && !a.startsWith('REPLACE');
  }

  getInitial(item: any): string {
    return item.name && item.name !== 'REPLACE' ? item.name.charAt(0) : '★';
  }

  formatQuote(quote?: string): string {
    if (!quote) return '';
    const trimmed = quote.trim();
    if ((trimmed.startsWith('“') && trimmed.endsWith('”')) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
      const inner = trimmed.slice(1, -1).trim();
      return `“${inner}”`;
    }
    if (trimmed.startsWith('“') || trimmed.startsWith('"')) {
      return trimmed;
    }
    return `“${trimmed}”`;
  }

  onItemPointerEnter(index: number, event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = undefined;
    }
    this.activeIndex = index;
  }

  onItemPointerLeave(index: number): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }
    this.clearTimer = setTimeout(() => {
      this.activeIndex = null;
    }, 70);
  }

  onGridPointerLeave(): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }
    this.clearTimer = setTimeout(() => {
      this.activeIndex = null;
    }, 50);
  }

  onItemClick(index: number, event: MouseEvent): void {
    if (this.activeIndex === index) {
      this.activeIndex = null;
    } else {
      this.activeIndex = index;
    }
  }

  onItemFocus(index: number): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = undefined;
    }
    this.activeIndex = index;
  }

  onItemBlur(index: number): void {
    this.activeIndex = null;
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && this.hasTestimonials) {
      this.ctx = this.animationService.createContext(this.el.nativeElement);
      const reveals = this.el.nativeElement.querySelectorAll('.scroll-reveal');
      this.animationService.animateOnScroll(reveals, { y: 35, stagger: 0.15 }, this.ctx);

      this.docClickListener = (event: Event) => {
        if (!this.el.nativeElement.contains(event.target as Node)) {
          this.activeIndex = null;
        }
      };
      document.addEventListener('pointerdown', this.docClickListener, { passive: true });
    }
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }
    if (this.docClickListener && typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.docClickListener);
    }
  }
}
