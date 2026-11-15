import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SmoothScrollService } from '../../../core/services/smooth-scroll.service';
import { PORTFOLIO_CONFIG } from '../../../core/config/portfolio.config';

type NavSection = 'home' | 'portfolio' | 'testimonials';

@Component({
  selector: 'app-floating-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="floating-nav-container" aria-label="Main Navigation">
      <div 
        #navPill
        class="floating-nav-pill" 
        [class.is-scrolled]="isScrolled" 
        (mouseleave)="onNavPillLeave()"
      >
        <!-- Sliding Active Pill Indicator -->
        <div 
          class="nav-active-pill" 
          [style.transform]="activeNavTransform"
          [style.width.px]="activeNavWidth"
          [style.opacity]="activeNavOpacity"
          aria-hidden="true"
        ></div>

        <!-- Home Tab -->
        <a 
          href="#top" 
          data-nav-section="home"
          (click)="onNavClick($event, '#top', 'home')"
          (mouseenter)="onHover('home')"
          class="nav-tab-item"
          [class.is-active]="activeSection === 'home'"
          [class.is-expanded]="isExpanded('home')"
          aria-label="Home"
        >
          <div class="nav-tab-content">
            <svg viewBox="0 0 24 24" class="nav-icon home-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M 0 7.25 L 0 17 C 0 17.552 0.448 18 1 18 L 5.5 18 C 6.052 18 6.5 17.552 6.5 17 L 6.5 11 L 11.5 11 L 11.5 17 C 11.5 17.552 11.948 18 12.5 18 L 17 18 C 17.552 18 18 17.552 18 17 L 18 7.25 C 18 6.935 17.852 6.639 17.6 6.45 L 9 0 L 0.4 6.45 C 0.148 6.639 0 6.935 0 7.25 Z" transform="translate(3 3)"/>
            </svg>
            <span class="nav-tab-label">Home</span>
          </div>
        </a>

        <!-- Divider 1 -->
        <div class="nav-separator" aria-hidden="true"></div>

        <!-- Portfolio Tab -->
        <a 
          href="#projects" 
          data-nav-section="portfolio"
          (click)="onNavClick($event, '#projects', 'portfolio')"
          (mouseenter)="onHover('portfolio')"
          class="nav-tab-item"
          [class.is-active]="activeSection === 'portfolio'"
          [class.is-expanded]="isExpanded('portfolio')"
          aria-label="Portfolio"
        >
          <div class="nav-tab-content">
            <svg viewBox="0 0 24 24" class="nav-icon briefcase-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M 14 5 L 14 2 C 14 0.895 13.105 0 12 0 L 8 0 C 6.895 0 6 0.895 6 2 L 6 5 M 20 10 L 10.392 11.922 C 10.133 11.973 9.867 11.973 9.608 11.922 L 0 10 M 2 20 L 18 20 C 19.105 20 20 19.105 20 18 L 20 7 C 20 5.895 19.105 5 18 5 L 2 5 C 0.895 5 0 5.895 0 7 L 0 18 C 0 19.105 0.895 20 2 20 Z" transform="translate(2 2)"/>
            </svg>
            <span class="nav-tab-label">Portfolio</span>
          </div>
        </a>

        <!-- Testimonials Tab (only if testimonials exist) -->
        <a 
          *ngIf="hasTestimonials"
          href="#test" 
          data-nav-section="testimonials"
          (click)="onNavClick($event, '#test', 'testimonials')"
          (mouseenter)="onHover('testimonials')"
          class="nav-tab-item"
          [class.is-active]="activeSection === 'testimonials'"
          [class.is-expanded]="isExpanded('testimonials')"
          aria-label="Testimonials"
        >
          <div class="nav-tab-content">
            <svg viewBox="0 0 24 24" class="nav-icon speech-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M 5 7 L 15 7 M 5 11 L 9 11 M 20 10 C 20 15.523 15.523 20 10 20 L 1.103 20 C 0.673 20 0.444 19.494 0.727 19.171 L 2.738 16.875 C 1.041 15.083 0 12.663 0 10 C 0 4.477 4.477 0 10 0 C 15.523 0 20 4.477 20 10 Z" transform="translate(2 2)"/>
            </svg>
            <span class="nav-tab-label">Testimonials</span>
          </div>
        </a>

        <!-- Divider 2 -->
        <div class="nav-separator" aria-hidden="true"></div>

        <!-- Book a Call CTA Button -->
        <a 
          [href]="ctaTarget" 
          (click)="onNavClick($event, ctaTarget)" 
          class="nav-cta-btn"
          aria-label="Book a Call"
        >
          <span>{{ ctaText }}</span>
        </a>
      </div>
    </nav>
  `,
  styleUrls: ['./floating-nav.component.scss']
})
export class FloatingNavComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly config = PORTFOLIO_CONFIG;
  private smoothScroll = inject(SmoothScrollService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('navPill', { static: false }) navPillRef?: ElementRef<HTMLElement>;

  activeSection: NavSection = 'home';
  hoveredSection: NavSection | null = null;
  isScrolled = false;
  private scrollListenerAdded = false;

  activeNavTransform = 'translateX(0) translateZ(0)';
  activeNavWidth = 0;
  activeNavOpacity = 0;

  get hasTestimonials(): boolean {
    return !!(this.config.testimonials && this.config.testimonials.length > 0);
  }

  get ctaTarget(): string {
    return this.config.booking.enabled ? '#book' : '#form-section';
  }

  get ctaText(): string {
    return this.config.booking.enabled ? this.config.hero.primaryCta.text : this.config.hero.secondaryCta.text;
  }

  get isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1024 || (window.matchMedia && window.matchMedia('(hover: none)').matches);
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
      this.scrollListenerAdded = true;
      this.updateActiveSection();
    }
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.updateIndicator();
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      if (this.scrollListenerAdded) {
        window.removeEventListener('scroll', this.onScroll);
      }
      window.removeEventListener('resize', this.onResize);
    }
  }

  private onScroll = (): void => {
    this.updateActiveSection();
  };

  private onResize = (): void => {
    this.updateIndicator();
  };

  private updateActiveSection(): void {
    if (typeof window === 'undefined') return;

    this.isScrolled = window.scrollY > 20;
    const scrollPos = window.scrollY + 250;
    const testEl = document.getElementById('test') || document.getElementById('testimonials');
    const projectsEl = document.getElementById('projects') || document.getElementById('ppppP');

    const getDocTop = (el: HTMLElement | null): number => {
      if (!el) return Infinity;
      return el.getBoundingClientRect().top + window.scrollY;
    };

    const testTop = getDocTop(testEl);
    const projectsTop = getDocTop(projectsEl);

    let nextSection: NavSection = 'home';
    if (scrollPos >= testTop) {
      nextSection = 'testimonials';
    } else if (scrollPos >= projectsTop) {
      nextSection = 'portfolio';
    } else {
      nextSection = 'home';
    }

    if (this.activeSection !== nextSection) {
      this.activeSection = nextSection;
      this.updateIndicator();
    }
  }

  updateIndicator(): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const pill = this.navPillRef?.nativeElement;
      if (!pill) return;
      const targetSection = this.hoveredSection || this.activeSection;
      const activeTab = pill.querySelector(`[data-nav-section="${targetSection}"]`) as HTMLElement;
      if (activeTab) {
        this.activeNavTransform = `translateX(${activeTab.offsetLeft}px) translateZ(0)`;
        this.activeNavWidth = activeTab.offsetWidth;
        this.activeNavOpacity = 1;
      } else {
        this.activeNavOpacity = 0;
      }
      this.cdr.markForCheck();
    }, 0);
  }

  onHover(section: NavSection): void {
    if (!this.isMobile) {
      this.hoveredSection = section;
      this.updateIndicator();
    }
  }

  onNavPillLeave(): void {
    if (!this.isMobile) {
      this.hoveredSection = null;
      this.updateIndicator();
    }
  }

  isExpanded(section: NavSection): boolean {
    if (this.hoveredSection) {
      return this.hoveredSection === section;
    }
    if (this.isMobile) {
      return this.activeSection === section;
    }
    return false;
  }

  onNavClick(event: Event, targetId: string, section?: NavSection): void {
    event.preventDefault();
    if (section) {
      this.activeSection = section;
      this.hoveredSection = null;
      this.updateIndicator();
    }

    if (this.router.url !== '/' && !this.router.url.startsWith('/#')) {
      const fragment = targetId.replace('#', '');
      this.router.navigate(['/'], { fragment }).then(() => {
        setTimeout(() => {
          this.smoothScroll.scrollTo(targetId, { offset: -80 });
        }, 100);
      });
      return;
    }

    this.smoothScroll.scrollTo(targetId, { offset: -80 });
  }
}
