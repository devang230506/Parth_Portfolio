import { Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';
import { AnimationService } from '../../core/services/animation.service';
import { SmoothScrollService } from '../../core/services/smooth-scroll.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="hero-section" id="top">
      <div class="hero-content container">
        <!-- Responsive headline as one single main line -->
        <h1 class="hero-headline">
          <span>{{ headlineLine1 }}</span>
        </h1>

        <!-- Subheading -->
        <p class="hero-subheading">
          {{ config.hero.subheadline }}
        </p>

        <!-- CTA Buttons -->
        <div class="hero-actions">
          <!-- Primary CTA (Book a Call) -->
          <a 
            [href]="config.hero.primaryCta.href" 
            (click)="onCtaClick($event, config.hero.primaryCta.href)"
            class="btn-rolling hero-cta hero-cta-primary"
            aria-label="Book a call with Parth"
          >
            <div class="cta-icon-wrapper" *ngIf="config.creator.buttonIconUrl">
              <img [src]="config.creator.buttonIconUrl" alt="Video Call Icon" class="cta-icon" />
            </div>
            <div class="rolling-text-wrapper">
              <div class="rolling-text-inner">
                <span>{{ config.hero.primaryCta.text }}</span>
                <span>{{ config.hero.primaryCta.text }}</span>
              </div>
            </div>
          </a>

          <!-- Secondary CTA (Let's Connect) -->
          <a 
            [href]="config.hero.secondaryCta.href" 
            (click)="onCtaClick($event, config.hero.secondaryCta.href)"
            class="btn-rolling hero-cta hero-cta-secondary"
            [attr.aria-label]="config.hero.secondaryCta.text"
          >
            <div class="cta-connect-icon-wrapper" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="rolling-text-wrapper">
              <div class="rolling-text-inner">
                <span>{{ config.hero.secondaryCta.text }}</span>
                <span>{{ config.hero.secondaryCta.text }}</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent implements OnInit, OnDestroy {
  readonly config = PORTFOLIO_CONFIG;
  private el = inject(ElementRef);
  private animationService = inject(AnimationService);
  private smoothScroll = inject(SmoothScrollService);
  private ctx?: gsap.Context;

  get headlineLine1(): string {
    if (typeof this.config.hero.headline === 'string') {
      return this.config.hero.headline;
    }
    return this.config.hero.headline.line1;
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.ctx = this.animationService.createContext(this.el.nativeElement);
      this.animationService.animateHero(this.el.nativeElement, this.ctx);
    }
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }

  onCtaClick(event: Event, href: string): void {
    if (href.startsWith('#')) {
      event.preventDefault();
      this.smoothScroll.scrollTo(href, { offset: -80 });
    }
  }
}
