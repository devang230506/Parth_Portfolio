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
        <!-- Responsive headline supporting both string or 2-line object -->
        <h1 class="hero-headline">
          <span>{{ headlineLine1 }}</span>
          <span *ngIf="headlineLine2">{{ headlineLine2 }}</span>
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

          <!-- Secondary CTA (Let's Chat with X logo) -->
          <a 
            [href]="config.hero.secondaryCta.href" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn-rolling hero-cta hero-cta-secondary"
            aria-label="Chat with Parth on X"
          >
            <div class="cta-x-icon-wrapper">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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

  get headlineLine2(): string {
    if (typeof this.config.hero.headline === 'string') {
      return '';
    }
    return this.config.hero.headline.line2;
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
      this.smoothScroll.scrollTo(href, { offset: -60 });
    }
  }
}
