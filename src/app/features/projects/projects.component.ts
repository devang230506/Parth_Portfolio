import { 
  AfterViewInit, 
  ChangeDetectorRef,
  Component, 
  CUSTOM_ELEMENTS_SCHEMA, 
  ElementRef, 
  EventEmitter, 
  Input,
  OnDestroy, 
  OnInit, 
  Output, 
  PLATFORM_ID, 
  ViewChild, 
  inject 
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { gsap } from 'gsap';
import { 
  PORTFOLIO_CONFIG, 
  PORTFOLIO_CATEGORIES,
  CategoryDefinition, 
  getCategoryBySlug, 
  getCategoryByLabel,
  getCategoryById
} from '../../core/config/portfolio.config';
import { ProjectItem } from '../../core/models/portfolio.model';
import { AnimationService } from '../../core/services/animation.service';
import { WistiaService } from '../../core/services/wistia.service';

interface MountedCardInfo {
  projectId: string;
  wistiaId: string;
  aspect: number;
  host: HTMLElement;
  player?: any;
  retryCount: number;
  isPlaying: boolean;
  selfHealTimer?: any;
  pollTimer?: any;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <section class="projects-section container" id="projects">
      <!-- Section Chip (matching live: • Projects) -->
      <div class="section-header scroll-reveal">
        <span class="badge-chip">Projects</span>
      </div>

      <!-- Category Filter Pills (Single Source of Truth, horizontally scrollable on mobile) -->
      <div class="category-filters-container scroll-reveal" *ngIf="categoriesList.length > 0">
        <div class="category-filters-row" #filterRow role="tablist" aria-label="Project category filters">
          <!-- Sliding Active Background Pill Indicator -->
          <div 
            class="filter-active-pill" 
            [style.transform]="activeFilterTransform"
            [style.width.px]="activeFilterWidth"
            [style.opacity]="activeFilterOpacity"
            aria-hidden="true"
          ></div>

          <!-- All Projects Tab -->
          <button 
            type="button"
            role="tab"
            class="category-pill glass-pill" 
            [class.active]="selectedCategoryId === 'all'"
            [attr.aria-selected]="selectedCategoryId === 'all'"
            (click)="onCategoryClick($event, 'all', 'all')"
          >
            <span>All</span>
            <span class="pill-count">({{ totalProjectsCount }})</span>
          </button>

          <!-- 5 Specific Disciplines in Exact Order -->
          <button 
            type="button"
            role="tab"
            *ngFor="let cat of categoriesList; trackBy: trackCategory"
            class="category-pill glass-pill" 
            [class.active]="selectedCategoryId === cat.id"
            [attr.aria-selected]="selectedCategoryId === cat.id"
            (click)="onCategoryClick($event, cat.id, cat.slug)"
          >
            <span>{{ cat.label }}</span>
            <span class="pill-count">({{ getCategoryCount(cat.id) }})</span>
          </button>
        </div>
      </div>

      <!-- Asymmetric Bento Grid matching signature layout (when All is selected) -->
      <div class="projects-asymmetric-grid" *ngIf="selectedCategoryId === 'all'">
        <!-- Tier 1: Left 2 Landscape Cards, Right 1 Tall Portrait Card -->
        <div class="bento-tier tier-1">
          <!-- Left Column: 2 Stacked Landscape Cards -->
          <div class="projects-left-col">
            <!-- Card 1: Motion Graphics -->
            <ng-container *ngIf="project1">
              <ng-container *ngTemplateOutlet="projectCardTpl; context: { $implicit: project1, layoutClass: 'landscape-card' }"></ng-container>
            </ng-container>

            <!-- Card 3: Nathan Bently -->
            <ng-container *ngIf="project3">
              <ng-container *ngTemplateOutlet="projectCardTpl; context: { $implicit: project3, layoutClass: 'landscape-card' }"></ng-container>
            </ng-container>
          </div>

          <!-- Right Column: 1 Tall Portrait Card (Swati Cosmetics) -->
          <div class="projects-right-col" *ngIf="project2">
            <ng-container *ngTemplateOutlet="projectCardTpl; context: { $implicit: project2, layoutClass: 'portrait-card tall-media' }"></ng-container>
          </div>
        </div>

        <!-- Tier 2: Left 1 Landscape Card (Joel Kaplan), Right 2 Portrait Shorts side-by-side -->
        <div class="bento-tier tier-2">
          <!-- Left Column: 1 Landscape Card (Joel Kaplan) -->
          <div class="tier-2-landscape-col" *ngIf="project4">
            <ng-container *ngTemplateOutlet="projectCardTpl; context: { $implicit: project4, layoutClass: 'landscape-card' }"></ng-container>
          </div>

          <!-- Right Column: 2 Portrait Shorts side-by-side (HubermanLab & The editing task) -->
          <div class="tier-2-shorts-col">
            <!-- Card 5: HubermanLab -->
            <ng-container *ngIf="project5">
              <ng-container *ngTemplateOutlet="projectCardTpl; context: { $implicit: project5, layoutClass: 'portrait-card' }"></ng-container>
            </ng-container>

            <!-- Card 6: The editing task -->
            <ng-container *ngIf="project6">
              <ng-container *ngTemplateOutlet="projectCardTpl; context: { $implicit: project6, layoutClass: 'portrait-card' }"></ng-container>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Filtered View Grid (when a specific category is active) -->
      <div class="filtered-projects-grid" *ngIf="selectedCategoryId !== 'all' && filteredProjects.length > 0">
        <div 
          class="filtered-projects-container"
          [class.single-landscape]="filteredProjects.length === 1 && filteredProjects[0].orientation === 'landscape'"
          [class.single-portrait]="filteredProjects.length === 1 && filteredProjects[0].orientation === 'portrait'"
          [class.dual-portrait]="filteredProjects.length === 2 && filteredProjects[0].orientation === 'portrait'"
        >
          <ng-container *ngFor="let project of filteredProjects; trackBy: trackProject">
            <ng-container *ngTemplateOutlet="projectCardTpl; context: { $implicit: project, layoutClass: project.orientation === 'portrait' ? 'portrait-card' : 'landscape-card' }"></ng-container>
          </ng-container>
        </div>
      </div>

      <!-- Tasteful Empty State Card for future categories with zero items -->
      <div class="empty-category-state glass" *ngIf="selectedCategoryId !== 'all' && filteredProjects.length === 0">
        <div class="empty-icon-wrap" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h3 class="empty-title">New work coming soon</h3>
        <p class="empty-desc">
          Projects in this discipline are currently in post-production or under client NDA.
          Request private work samples or schedule an intro call below.
        </p>
        <a href="#book" class="empty-cta-btn glass-pill">
          <span>Request Private Samples ↗</span>
        </a>
      </div>

      <!-- Reusable Project Card Template -->
      <ng-template #projectCardTpl let-project let-layoutClass="layoutClass">
        <a 
          #cardEl
          [routerLink]="['/projects', project.slug || project.id]"
          [attr.data-project-id]="project.id"
          [attr.data-wistia-id]="project.wistiaId"
          class="project-card {{ layoutClass }} scroll-reveal"
          [attr.aria-label]="'Open ' + getCategoryLabel(project.category) + ' project: ' + project.title"
          (click)="onProjectClick($event, project)"
          (keydown.enter)="onProjectClick($event, project)"
          (mouseenter)="onHover(cardEl, true)"
          (mouseleave)="onHover(cardEl, false)"
        >
          <div class="card-media-wrapper" [class.tall-media]="layoutClass && layoutClass.includes('tall-media')">
            <!-- Official Blurred Swatch Placeholder Fallback with cross-fade -->
            <div 
              class="swatch-bg" 
              [class.fade-out]="readyMediaIds.has(project.id)"
              [style.background-image]="'url(' + wistiaService.getSwatchUrl(project.wistiaId) + ')'"
              aria-hidden="true"
            ></div>

            <!-- Programmatic Mount Host for Wistia Web Component Player -->
            <div class="card-player-host" [attr.data-player-host]="project.id"></div>

            <div class="card-overlay" aria-hidden="true"></div>

            <!-- Glass Blur Hover Overlay & Centred See More! ↗ Pill -->
            <div class="card-hover-overlay" aria-hidden="true">
              <div class="see-more-pill">
                <span>See More!</span>
                <span class="arrow-glyph">↗</span>
              </div>
            </div>

            <!-- Top Category Badge ONLY (e.g. "Shorts", "YouTube", "VSL") -->
            <div class="card-top-badges">
              <span class="category-tag glass-pill">{{ getCategoryLabel(project.category) }}</span>
            </div>

            <!-- Bottom Cluster (Right-aligned): Sound Toggle & Arrow Circle -->
            <div class="card-bottom-row">
              <!-- Sound Toggle Button -->
              <button 
                type="button"
                class="card-sound-btn glass-pill"
                [class.sound-active]="unmutedProjectId === project.id"
                [attr.aria-label]="unmutedProjectId === project.id ? 'Mute ' + getCategoryLabel(project.category) : 'Unmute ' + getCategoryLabel(project.category)"
                [attr.aria-pressed]="unmutedProjectId === project.id"
                (click)="toggleSound(project, cardEl, $event)"
                (keydown.enter)="toggleSound(project, cardEl, $event)"
                (keydown.space)="toggleSound(project, cardEl, $event)"
              >
                <!-- Muted Speaker Icon -->
                <svg *ngIf="unmutedProjectId !== project.id" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>

                <!-- Unmuted Speaker Icon (Sound Waves) -->
                <svg *ngIf="unmutedProjectId === project.id" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </button>

              <!-- Arrow Circle Button -->
              <div class="card-arrow-circle glass-pill" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </a>
      </ng-template>
    </section>
  `,
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly config = PORTFOLIO_CONFIG;
  readonly wistiaService = inject(WistiaService);
  private el = inject(ElementRef);
  private animationService = inject(AnimationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private ctx?: gsap.Context;
  private querySub?: Subscription;
  private isDestroyed = false;

  // Active category filter state
  selectedCategoryId: string = 'all';

  @ViewChild('filterRow', { static: false }) filterRowRef?: ElementRef<HTMLElement>;

  activeFilterTransform = 'translateX(0) translateZ(0)';
  activeFilterWidth = 0;
  activeFilterOpacity = 0;

  // Set of project IDs whose video is actively playing (cross-fades swatch)
  readyMediaIds = new Set<string>();

  // ID of currently unmuted project (only ONE allowed at a time)
  unmutedProjectId: string | null = null;

  // Active programmatic card player records
  private activeCards = new Map<string, MountedCardInfo>();

  // Queue of currently playing cards (max 3 at once)
  private playingQueue: HTMLElement[] = [];
  private mountObserver?: IntersectionObserver;
  private playbackObserver?: IntersectionObserver;
  private docListeners: Array<{ event: string; handler: EventListenerOrEventListenerObject }> = [];

  get isReducedMotion(): boolean {
    if (!this.isBrowser) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  get categoriesList(): readonly CategoryDefinition[] {
    const list = this.config.categories || PORTFOLIO_CATEGORIES;
    if (this.config.hideEmptyCategories) {
      return list.filter(c => this.getCategoryCount(c.id) > 0);
    }
    return list;
  }

  get totalProjectsCount(): number {
    return this.config.projects.length;
  }

  getCategoryCount(catId: string): number {
    return this.config.projects.filter(p => p.category === catId).length;
  }

  get filteredProjects(): ProjectItem[] {
    if (this.selectedCategoryId === 'all') {
      return this.config.projects;
    }
    return this.config.projects.filter(p => p.category === this.selectedCategoryId);
  }

  // 6 Authoritative Projects
  get project1(): ProjectItem | undefined {
    return this.config.projects.find(p => p.id === 'motion-graphics') || this.config.projects[0];
  }

  get project2(): ProjectItem | undefined {
    return this.config.projects.find(p => p.id === 'swati-cosmetics') || this.config.projects[1];
  }

  get project3(): ProjectItem | undefined {
    return this.config.projects.find(p => p.id === 'nathan-bently') || this.config.projects[2];
  }

  get project4(): ProjectItem | undefined {
    return this.config.projects.find(p => p.id === 'joel-kaplan') || this.config.projects[3];
  }

  get project5(): ProjectItem | undefined {
    return this.config.projects.find(p => p.id === 'huberman-lab') || this.config.projects[4];
  }

  get project6(): ProjectItem | undefined {
    return this.config.projects.find(p => p.id === 'the-editing-task') || this.config.projects[5];
  }

  getCategoryLabel(catId: string): string {
    const def = getCategoryById(catId) || getCategoryByLabel(catId) || getCategoryBySlug(catId);
    return def ? def.label : catId;
  }

  trackCategory(index: number, cat: CategoryDefinition): string {
    return cat.id;
  }

  trackProject(index: number, project: ProjectItem): string {
    return project.id;
  }

  ngOnInit(): void {
    this.isDestroyed = false;

    // Upfront preload of core player.js so custom element definition is ready early
    if (this.isBrowser) {
      this.wistiaService.loadPlayerScript().catch(() => {});
    }

    // Listen for ?category=<slug> query parameter
    this.querySub = this.route.queryParams.subscribe(params => {
      const slug = params['category'];
      if (slug) {
        if (slug.toLowerCase() === 'all') {
          this.selectedCategoryId = 'all';
        } else {
          const match = getCategoryBySlug(slug) || getCategoryById(slug);
          if (match) {
            this.selectedCategoryId = match.id;
          } else {
            this.selectedCategoryId = 'all';
          }
        }
      } else {
        this.selectedCategoryId = 'all';
      }

      if (this.isBrowser) {
        setTimeout(() => this.setupCardObservers(), 50);
        this.syncFilterIndicator(true);
      }
    });

    if (this.isBrowser) {
      window.addEventListener('resize', this.onFilterResize, { passive: true });
      this.ctx = this.animationService.createContext(this.el.nativeElement);
      const reveals = this.el.nativeElement.querySelectorAll('.scroll-reveal');
      this.animationService.animateOnScroll(reveals, { y: 35, stagger: 0.15 }, this.ctx);
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.setupCardObservers();
      this.setupVisibilityListener();
      this.syncFilterIndicator(false);
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.querySub?.unsubscribe();
    this.ctx?.revert();
    this.cleanupObservers();
    if (this.isBrowser) {
      window.removeEventListener('resize', this.onFilterResize);
    }
    this.docListeners.forEach(l => document.removeEventListener(l.event, l.handler));
    this.docListeners = [];
    this.destroyAllCardPlayers();
  }

  onCategoryClick(event: MouseEvent | TouchEvent, catId: string, slug?: string): void {
    const target = (event.currentTarget || event.target) as HTMLElement;
    const pill = target.closest('.category-pill') as HTMLElement;
    this.filterCategory(catId, slug);
    if (pill) {
      this.updateFilterIndicator(pill);
      this.centerPill(pill);
    }
  }

  private centerPill(pill: HTMLElement): void {
    if (!this.isBrowser || !pill) return;
    pill.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }

  private updateFilterIndicator(pill: HTMLElement): void {
    if (!this.isBrowser || !pill) return;
    this.activeFilterTransform = `translateX(${pill.offsetLeft}px) translateZ(0)`;
    this.activeFilterWidth = pill.offsetWidth;
    this.activeFilterOpacity = 1;
    this.cdr.markForCheck();
  }

  private syncFilterIndicator(autoScroll = false): void {
    if (!this.isBrowser) return;
    setTimeout(() => {
      const row = this.filterRowRef?.nativeElement || this.el.nativeElement.querySelector('.category-filters-row');
      if (!row) return;
      const activePill = row.querySelector('.category-pill.active') as HTMLElement;
      if (activePill) {
        this.updateFilterIndicator(activePill);
        if (autoScroll) {
          this.centerPill(activePill);
        }
      }
    }, 60);
  }

  private onFilterResize = (): void => {
    this.syncFilterIndicator(false);
  };

  filterCategory(catId: string, slug?: string): void {
    if (this.selectedCategoryId === catId) return;

    // Reset all audio to muted on category filter change
    this.muteAllCards();
    this.selectedCategoryId = catId;

    // Sync shareable URL parameter (?category=slug or null for All)
    const categorySlug = (catId === 'all' || slug === 'all')
      ? null 
      : (slug || getCategoryById(catId)?.slug);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: categorySlug },
      queryParamsHandling: 'merge'
    });

    if (this.isBrowser) {
      setTimeout(() => {
        this.setupCardObservers();
        const grid = this.el.nativeElement.querySelector('.filtered-projects-grid, .projects-asymmetric-grid, .empty-category-state');
        if (grid) {
          gsap.fromTo(grid, 
            { opacity: 0, y: 14 }, 
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
          );
        }
      }, 50);
    }
  }

  onProjectClick(event: Event, project: ProjectItem): void {
    const target = event.target as HTMLElement;
    if (target && target.closest('.card-sound-btn')) {
      return;
    }
    // Mute and pause all preview cards before navigating to detail page
    this.muteAllCards();
    this.playingQueue.forEach(card => this.pauseCard(card));
    this.playingQueue = [];
  }

  onHover(card: HTMLElement, isHover: boolean): void {
    if (!this.isBrowser || this.isReducedMotion) return;
    if (isHover) {
      this.playCard(card);
    }
  }

  /**
   * Sound toggle button handler:
   * Toggles audio for this project only. Unmuting one automatically mutes all others.
   */
  toggleSound(project: ProjectItem, cardEl: HTMLElement, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.unmutedProjectId === project.id) {
      // Mute this project
      this.wistiaService.setMuted(cardEl, true);
      this.unmutedProjectId = null;
    } else {
      // Mute every other card first (only 1 unmuted at a time)
      this.muteAllCards();

      // Unmute this project
      this.wistiaService.setMuted(cardEl, false);
      this.unmutedProjectId = project.id;

      // Ensure this card is currently playing
      this.playCard(cardEl);
    }

    this.cdr.detectChanges();
  }

  /**
   * Mutes every card and resets unmuted state.
   */
  muteAllCards(): void {
    if (!this.isBrowser) return;
    this.activeCards.forEach(cardInfo => {
      if (cardInfo.player) {
        this.wistiaService.setMuted(cardInfo.player, true);
      }
    });
    this.unmutedProjectId = null;
    this.cdr.detectChanges();
  }

  /**
   * Sets up IntersectionObserver for lazy mounting (rootMargin: 350px)
   * and visibility-based autoplay/pause (threshold 0.25, max 3 playing at once).
   */
  private setupCardObservers(): void {
    if (!this.isBrowser || this.isDestroyed) return;

    this.cleanupObservers();

    const cards = Array.from(this.el.nativeElement.querySelectorAll('.project-card')) as HTMLElement[];
    if (cards.length === 0) return;

    // Immediately mount cards that are already near or in viewport
    cards.forEach(card => {
      const projectId = card.getAttribute('data-project-id');
      if (projectId && this.isCardNearView(card, 800)) {
        this.mountCard(projectId);
      }
    });

    // 1. Lazy Mount Observer: loads embed module when near viewport (~600px)
    if ('IntersectionObserver' in window) {
      this.mountObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            const projectId = card.getAttribute('data-project-id');
            if (projectId) {
              this.mountCard(projectId);
              this.mountObserver?.unobserve(card);
            }
          }
        });
      }, { rootMargin: '600px' });

      cards.forEach(card => {
        const projectId = card.getAttribute('data-project-id');
        const host = card.querySelector('[data-player-host]') as HTMLElement;
        const alreadyHasPlayer = host && host.querySelector('wistia-player');
        if (projectId && !alreadyHasPlayer) {
          this.mountObserver?.observe(card);
        }
      });
    }

    if (this.isReducedMotion) return;

    // 2. Playback Observer: plays when >= 25% visible, pauses when offscreen
    if ('IntersectionObserver' in window) {
      this.playbackObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const card = entry.target as HTMLElement;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            this.onCardEnterView(card);
          } else if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
            this.onCardLeaveView(card);
          }
        });
      }, { threshold: [0, 0.25] });

      cards.forEach(card => this.playbackObserver?.observe(card));
    }
  }

  /**
   * Mounts a fresh, robust programmatic <wistia-player> inside the card's host element.
   * Attributes (especially media-id) are guaranteed to be set BEFORE appendChild, preventing
   * the synchronous "media-id attribute is required" error when customElements is already defined.
   */
  private mountCard(projectId: string): void {
    if (this.isDestroyed || !this.isBrowser) return;

    const host = this.el.nativeElement.querySelector(`[data-player-host="${projectId}"]`) as HTMLElement;
    if (!host) return;

    // If already mounted in this exact host element, do nothing
    const existing = this.activeCards.get(projectId);
    if (existing && existing.host === host && host.querySelector('wistia-player')) {
      return;
    }

    const project = this.config.projects.find(p => p.id === projectId);
    if (!project) return;

    // Clean any previous player record for this project if host changed
    this.destroyCardPlayer(projectId);

    const cardInfo: MountedCardInfo = {
      projectId,
      wistiaId: project.wistiaId,
      aspect: project.aspect,
      host,
      retryCount: 0,
      isPlaying: false
    };

    this.activeCards.set(projectId, cardInfo);

    // Wait for player.js, embed module, and custom element definition
    this.wistiaService.prepareMedia(project.wistiaId).then(() => {
      if (this.isDestroyed || !this.activeCards.has(projectId)) return;
      if (!document.body.contains(host)) return;
      this.attachPlayer(cardInfo);
    }).catch(err => {
      console.warn(`[Projects] Error preparing media-id "${project.wistiaId}":`, err);
    });
  }

  private attachPlayer(cardInfo: MountedCardInfo): void {
    if (this.isDestroyed || !document.body.contains(cardInfo.host)) return;

    cardInfo.host.innerHTML = '';

    const isUnmuted = this.unmutedProjectId === cardInfo.projectId;
    const player = this.wistiaService.createPlayerElement(cardInfo.wistiaId, cardInfo.aspect, {
      autoplay: true,
      muted: !isUnmuted,
      loop: true,
      controlsVisibleOnLoad: false,
      playBarControl: false,
      volumeControl: false,
      fullscreenButton: false,
      bigPlayButton: false,
      fitStrategy: 'cover',
      className: 'card-wistia-player'
    });

    if (!player) return;

    cardInfo.player = player;
    cardInfo.isPlaying = false;

    const onPlaySuccess = () => {
      if (this.isDestroyed) return;
      cardInfo.isPlaying = true;
      if (cardInfo.selfHealTimer) {
        clearTimeout(cardInfo.selfHealTimer);
        cardInfo.selfHealTimer = undefined;
      }
      
      const video = player.shadowRoot?.querySelector('video');
      if (!video || video.currentTime >= 0.12) {
        if (!this.readyMediaIds.has(cardInfo.projectId)) {
          this.readyMediaIds.add(cardInfo.projectId);
          this.cdr.detectChanges();
        }
        if (cardInfo.pollTimer) {
          clearInterval(cardInfo.pollTimer);
          cardInfo.pollTimer = undefined;
        }
      }
    };

    player.addEventListener('play', onPlaySuccess);
    player.addEventListener('playing', onPlaySuccess);

    // Append to DOM now that attributes are fully set
    cardInfo.host.appendChild(player);

    // If card is already in view or in playing queue, prompt playback
    const cardEl = cardInfo.host.closest('.project-card') as HTMLElement;
    if (cardEl && (this.playingQueue.includes(cardEl) || this.isCardNearView(cardEl, 0))) {
      this.playCard(cardEl);
    }

    // Video poll check to catch play events across all browsers
    let pollAttempts = 0;
    cardInfo.pollTimer = setInterval(() => {
      pollAttempts++;
      const video = player.shadowRoot?.querySelector('video');
      const hasStarted = player.state === 'playing' || (video && (video.currentTime > 0 || !video.paused));
      
      if (hasStarted) {
        cardInfo.isPlaying = true;
        if (cardInfo.selfHealTimer) {
          clearTimeout(cardInfo.selfHealTimer);
          cardInfo.selfHealTimer = undefined;
        }
        // Cross-fade swatch once video has rendered past initial zero/black frame
        if (!video || video.currentTime >= 0.12 || pollAttempts >= 15) {
          if (!this.readyMediaIds.has(cardInfo.projectId)) {
            this.readyMediaIds.add(cardInfo.projectId);
            this.cdr.detectChanges();
          }
          clearInterval(cardInfo.pollTimer);
          cardInfo.pollTimer = undefined;
        }
      } else if (pollAttempts >= 40) {
        clearInterval(cardInfo.pollTimer);
        cardInfo.pollTimer = undefined;
      }
    }, 100);

    // Self-healing: if card has not started playing within 3 seconds, destroy and remount (up to 2 retries)
    cardInfo.selfHealTimer = setTimeout(() => {
      if (this.isDestroyed) return;
      const video = player.shadowRoot?.querySelector('video');
      const isActuallyPlaying = cardInfo.isPlaying || player.state === 'playing' || (video && (video.currentTime > 0 || !video.paused));

      if (!isActuallyPlaying && cardInfo.retryCount < 2) {
        cardInfo.retryCount++;
        console.warn(`[Projects] Card "${cardInfo.projectId}" did not start playing after 3s; self-healing (attempt ${cardInfo.retryCount}/2)...`);
        
        if (cardInfo.pollTimer) {
          clearInterval(cardInfo.pollTimer);
          cardInfo.pollTimer = undefined;
        }

        try {
          player.pause?.();
          player.remove?.();
        } catch (_) {}
        cardInfo.host.innerHTML = '';

        setTimeout(() => {
          if (!this.isDestroyed && document.body.contains(cardInfo.host)) {
            this.attachPlayer(cardInfo);
          }
        }, 50);
      } else if (isActuallyPlaying) {
        onPlaySuccess();
      }
    }, 3000);
  }

  private destroyCardPlayer(projectId: string): void {
    const cardInfo = this.activeCards.get(projectId);
    if (!cardInfo) return;

    if (cardInfo.selfHealTimer) {
      clearTimeout(cardInfo.selfHealTimer);
      cardInfo.selfHealTimer = undefined;
    }
    if (cardInfo.pollTimer) {
      clearInterval(cardInfo.pollTimer);
      cardInfo.pollTimer = undefined;
    }
    if (cardInfo.player) {
      try {
        cardInfo.player.pause?.();
        cardInfo.player.remove?.();
      } catch (_) {}
      cardInfo.player = undefined;
    }
    if (cardInfo.host) {
      cardInfo.host.innerHTML = '';
    }
    this.activeCards.delete(projectId);
    this.readyMediaIds.delete(projectId);
  }

  private destroyAllCardPlayers(): void {
    this.activeCards.forEach((_, id) => this.destroyCardPlayer(id));
    this.activeCards.clear();
    this.readyMediaIds.clear();
  }

  private onCardEnterView(card: HTMLElement): void {
    if (this.isReducedMotion) return;

    const projectId = card.getAttribute('data-project-id');
    if (projectId) {
      this.mountCard(projectId);
    }

    if (!this.playingQueue.includes(card)) {
      this.playingQueue.push(card);
    }

    this.playCard(card);
  }

  private onCardLeaveView(card: HTMLElement): void {
    const idx = this.playingQueue.indexOf(card);
    if (idx !== -1) {
      this.playingQueue.splice(idx, 1);
    }
    this.pauseCard(card);

    // Reset sound if the unmuted card leaves the viewport
    const projectId = card.getAttribute('data-project-id');
    if (projectId && this.unmutedProjectId === projectId) {
      this.wistiaService.setMuted(card, true);
      this.unmutedProjectId = null;
      this.cdr.detectChanges();
    }
  }

  private playCard(card: HTMLElement): void {
    const projectId = card.getAttribute('data-project-id');
    if (!projectId) return;

    const cardInfo = this.activeCards.get(projectId);
    if (!cardInfo || !cardInfo.player) {
      this.mountCard(projectId);
      return;
    }

    const player = cardInfo.player;
    if (player && typeof player.play === 'function') {
      try {
        const isThisUnmuted = this.unmutedProjectId === projectId;
        if (!isThisUnmuted) {
          this.wistiaService.setMuted(player, true);
        }
        const p = player.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch (e) {}
    }
  }

  private pauseCard(card: HTMLElement): void {
    const projectId = card.getAttribute('data-project-id');
    if (!projectId) return;

    const cardInfo = this.activeCards.get(projectId);
    if (cardInfo && cardInfo.player && typeof cardInfo.player.pause === 'function') {
      try {
        cardInfo.player.pause();
      } catch (e) {}
    }
  }

  private cleanupObservers(): void {
    this.mountObserver?.disconnect();
    this.playbackObserver?.disconnect();
    this.playingQueue.forEach(c => this.pauseCard(c));
    this.playingQueue = [];
  }

  private setupVisibilityListener(): void {
    if (!this.isBrowser || typeof document === 'undefined') return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        this.muteAllCards();
        this.playingQueue.forEach(card => this.pauseCard(card));
      } else {
        // Resume currently queued cards that are in view
        this.playingQueue.forEach(card => {
          if (this.isCardNearView(card, 0)) {
            this.playCard(card);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    this.docListeners.push({ event: 'visibilitychange', handler: onVisibilityChange });
  }

  private isCardNearView(card: HTMLElement, margin = 200): boolean {
    if (!this.isBrowser) return false;
    const rect = card.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < (windowHeight + margin) && rect.bottom > -margin;
  }
}
