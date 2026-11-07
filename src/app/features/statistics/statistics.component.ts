import { Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';
import { AnimationService } from '../../core/services/animation.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="hasStats" class="stats-section container">
      <!-- Top Separator Line -->
      <div class="stats-separator-line scroll-reveal"></div>

      <!-- 3 Metrics Columns with Vertical Dividers -->
      <div class="stats-grid">
        <ng-container *ngFor="let stat of config.statistics; let i = index; let last = last">
          <div class="stat-card scroll-reveal">
            <div class="stat-number-wrapper">
              <span class="stat-number" [attr.data-target]="stat.value">{{ stat.value }}</span>
              <span class="stat-suffix" *ngIf="stat.suffix">{{ stat.suffix }}</span>
            </div>
            <span class="stat-label">{{ stat.label }}</span>
          </div>

          <!-- Vertical separator line between stat items (desktop) -->
          <div *ngIf="!last" class="stat-divider-wrapper" aria-hidden="true">
            <div class="stat-divider"></div>
          </div>
        </ng-container>
      </div>
    </section>
  `,
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit, OnDestroy {
  readonly config = PORTFOLIO_CONFIG;
  private el = inject(ElementRef);
  private animationService = inject(AnimationService);
  private ctx?: gsap.Context;

  get hasStats(): boolean {
    return !!(this.config.statistics && this.config.statistics.length > 0);
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && this.hasStats) {
      this.ctx = this.animationService.createContext(this.el.nativeElement);
      const reveals = this.el.nativeElement.querySelectorAll('.scroll-reveal');
      this.animationService.animateOnScroll(reveals, { y: 30, stagger: 0.1 }, this.ctx);

      const numberEls = this.el.nativeElement.querySelectorAll('.stat-number');
      numberEls.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        const targetStr = htmlEl.getAttribute('data-target') || '0';
        const target = parseFloat(targetStr);
        const decimals = targetStr.includes('.') ? targetStr.split('.')[1].length : 0;
        this.animationService.animateCounter(htmlEl, target, 1.8, this.ctx, decimals);
      });
    }
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
