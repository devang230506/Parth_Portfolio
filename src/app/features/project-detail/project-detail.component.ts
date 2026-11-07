import { 
  AfterViewInit, 
  ChangeDetectorRef, 
  Component, 
  CUSTOM_ELEMENTS_SCHEMA, 
  ElementRef, 
  OnDestroy, 
  OnInit, 
  PLATFORM_ID, 
  ViewChild, 
  inject 
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl, Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

import { 
  PORTFOLIO_CONFIG, 
  getProjectBySlug, 
  getAdjacentProjects, 
  getCategoryById, 
  getCategoryBySlug 
} from '../../core/config/portfolio.config';
import { ProjectItem } from '../../core/models/portfolio.model';
import { WistiaService } from '../../core/services/wistia.service';
import { SmoothScrollService } from '../../core/services/smooth-scroll.service';
import { FloatingNavComponent } from '../../shared/components/floating-nav/floating-nav.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FloatingNavComponent, FooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="detail-page-wrapper">
      <!-- Ambient light fields matching home theme -->
      <div class="ambient-glow glow-top" aria-hidden="true"></div>
      <div class="ambient-glow glow-mid" aria-hidden="true"></div>
      <div class="ambient-glow glow-bottom" aria-hidden="true"></div>

      <!-- Shared Floating Nav -->
      <app-floating-nav></app-floating-nav>

      <main class="detail-main container" *ngIf="project">
        <!-- Top Action Bar: Back to projects -->
        <div class="detail-top-bar">
          <a 
            (click)="goBack($event)" 
            (keydown.enter)="goBack($event)"
            class="back-btn glass-pill" 
            role="button" 
            tabindex="0"
            aria-label="Back to projects"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to projects</span>
          </a>
        </div>

        <!-- Main Video Area (Large and Centered) -->
        <section class="player-section" [attr.aria-label]="categoryLabel + ' Video Player'">
          <div 
            class="player-stage" 
            [class.portrait-stage]="project.orientation === 'portrait'" 
            [class.landscape-stage]="project.orientation === 'landscape'"
          >
            <div class="player-aspect-box">
              <!-- Official blurred swatch image overlay -->
              <div 
                class="swatch-overlay" 
                [class.fade-out]="isPlayerReady || useIframeFallback"
                [style.background-image]="'url(' + wistiaService.getSwatchUrl(project.wistiaId) + ')'"
                aria-hidden="true"
              ></div>

              <!-- Unmute pill if browser blocked unmuted autoplay -->
              <button 
                type="button"
                *ngIf="showTapForSound && isPlayerReady && !useIframeFallback"
                (click)="unmuteVideo()" 
                class="tap-for-sound-pill glass-pill"
                aria-label="Tap to unmute video"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
                <span>Tap for sound</span>
              </button>

              <!-- Player mount host (wistia-player is created with media-id set BEFORE append) -->
              <div #playerHost class="player-mount-point" [hidden]="useIframeFallback"></div>

              <!-- Hard 4-second iframe fallback -->
              <iframe
                *ngIf="useIframeFallback"
                [src]="safeIframeUrl"
                class="detail-iframe-fallback"
                allow="autoplay; fullscreen"
                allowfullscreen
                frameborder="0"
                title="Wistia video player"
              ></iframe>
            </div>
          </div>
        </section>

        <!-- Meta Information: Category Pill + Category Name Heading Only -->
        <div class="detail-meta">
          <div class="detail-category-badge">
            <span class="category-pill glass-pill">{{ categoryLabel }}</span>
          </div>
          <h1 class="detail-category-heading">{{ categoryLabel }}</h1>
        </div>

        <!-- Bottom Navigation: Previous, Book a Call, Next -->
        <nav class="detail-bottom-nav" aria-label="Project detail navigation">
          <!-- Previous Project Link -->
          <a 
            *ngIf="adjacentProjects" 
            [routerLink]="['/projects', adjacentProjects.prev.slug || adjacentProjects.prev.id]" 
            class="adjacent-nav-btn glass-pill prev-btn" 
            [attr.aria-label]="'Previous project: ' + getCategoryName(adjacentProjects.prev.category)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Previous project</span>
          </a>

          <!-- Book a Call CTA -->
          <a 
            [routerLink]="['/']" 
            fragment="book" 
            (click)="onBookCall($event)" 
            class="btn-rolling detail-book-btn hero-cta-primary" 
            aria-label="Book a call with Parth"
          >
            <div class="cta-icon-wrapper" *ngIf="config.creator.buttonIconUrl">
              <img [src]="config.creator.buttonIconUrl" alt="Video Call Icon" class="cta-icon" />
            </div>
            <div class="rolling-text-wrapper">
              <div class="rolling-text-inner">
                <span>Book a Call</span>
                <span>Book a Call</span>
              </div>
            </div>
          </a>

          <!-- Next Project Link -->
          <a 
            *ngIf="adjacentProjects" 
            [routerLink]="['/projects', adjacentProjects.next.slug || adjacentProjects.next.id]" 
            class="adjacent-nav-btn glass-pill next-btn" 
            [attr.aria-label]="'Next project: ' + getCategoryName(adjacentProjects.next.category)"
          >
            <span>Next project</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </nav>
      </main>

      <!-- Footer -->
      <app-footer></app-footer>
    </div>
  `,
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly config = PORTFOLIO_CONFIG;
  readonly wistiaService = inject(WistiaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);
  private smoothScroll = inject(SmoothScrollService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  project?: ProjectItem;
  adjacentProjects?: { prev: ProjectItem; next: ProjectItem };
  safeIframeUrl?: SafeResourceUrl;

  isPlayerReady = false;
  useIframeFallback = false;
  showTapForSound = false;
  isMuted = false;

  private paramsSub?: Subscription;
  private fallbackTimer?: any;
  private playerPollInterval?: any;
  private activePlayerEl?: any;
  private currentHostEl?: HTMLElement;

  @ViewChild('playerHost', { static: false }) set playerHostRef(ref: ElementRef<HTMLElement> | undefined) {
    if (ref && ref.nativeElement) {
      this.currentHostEl = ref.nativeElement;
      if (this.project) {
        this.mountPlayerElement(this.currentHostEl, this.project.wistiaId, this.project.aspect);
      }
    }
  }

  get categoryLabel(): string {
    if (!this.project) return '';
    const def = getCategoryById(this.project.category) || getCategoryBySlug(this.project.category);
    return def ? def.label : this.project.category;
  }

  getCategoryName(catId: string): string {
    const def = getCategoryById(catId) || getCategoryBySlug(catId);
    return def ? def.label : catId;
  }

  ngOnInit(): void {
    this.paramsSub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (!slug) {
        this.redirectToHomeProjects();
        return;
      }
      this.loadProject(slug);
    });
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }

  ngOnDestroy(): void {
    this.cleanupCurrentPlayer();
    this.paramsSub?.unsubscribe();
  }

  private loadProject(slug: string): void {
    this.cleanupCurrentPlayer();

    const found = getProjectBySlug(slug);
    if (!found) {
      console.warn(`[ProjectDetail] Unknown slug "${slug}", redirecting to projects section.`);
      this.redirectToHomeProjects();
      return;
    }

    this.project = found;
    this.adjacentProjects = getAdjacentProjects(slug);

    // Document title
    this.titleService.setTitle(`${this.categoryLabel} | ${this.config.creator.brandName}`);

    // Scroll to top
    if (this.isBrowser) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Prepare safe iframe fallback URL
    const iframeUrl = `https://fast.wistia.net/embed/iframe/${found.wistiaId}?autoPlay=true&playsinline=true`;
    this.safeIframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(iframeUrl);

    if (!this.isBrowser) return;

    // Start 4-second hard fallback timer
    this.fallbackTimer = setTimeout(() => {
      const video = this.activePlayerEl?.shadowRoot?.querySelector('video');
      const isPlaying = this.activePlayerEl?.state === 'playing' || (video && (video.currentTime > 0 || !video.paused));

      if (!isPlaying) {
        console.warn(`[ProjectDetail] Player for ${found.wistiaId} not playing after 4s; activating iframe fallback.`);
        if (this.activePlayerEl) {
          try {
            this.activePlayerEl.pause();
            this.activePlayerEl.remove();
          } catch (e) {}
          this.activePlayerEl = null;
        }
        this.useIframeFallback = true;
        this.isPlayerReady = true;
        this.cdr.detectChanges();
      }
    }, 4000);

    // Mount player if host element is already available
    if (this.currentHostEl) {
      this.mountPlayerElement(this.currentHostEl, found.wistiaId, found.aspect);
    }
  }

  private async mountPlayerElement(host: HTMLElement, mediaId: string, aspect: number): Promise<void> {
    if (!this.isBrowser) return;

    // Load scripts
    await this.wistiaService.prepareMedia(mediaId);

    // Guard against project change while script was loading
    if (!this.project || this.project.wistiaId !== mediaId) return;

    host.innerHTML = '';

    const player = document.createElement('wistia-player') as any;

    // CRITICAL FIX: Set attributes BEFORE appending to DOM!
    // When appended, connectedCallback runs synchronously. Having media-id set here
    // avoids the "media-id attribute is required" uncaught error that breaks the player.
    player.setAttribute('media-id', mediaId);
    player.setAttribute('aspect', String(aspect));
    player.setAttribute('playsinline', 'true');
    player.setAttribute('autoplay', 'true');
    player.setAttribute('controls-visible-on-load', 'true');
    player.setAttribute('play-bar-control', 'true');
    player.setAttribute('volume-control', 'true');
    player.setAttribute('fullscreen-button', 'true');
    player.setAttribute('big-play-button', 'true');
    player.setAttribute('silent-autoplay', 'allow');
    player.className = 'detail-wistia-player';

    this.activePlayerEl = player;

    const onPlaySuccess = () => {
      this.isPlayerReady = true;
      if (this.fallbackTimer) {
        clearTimeout(this.fallbackTimer);
        this.fallbackTimer = undefined;
      }
      this.cdr.detectChanges();
    };

    player.addEventListener('play', onPlaySuccess);
    player.addEventListener('playing', onPlaySuccess);

    // Append to DOM now that attributes are populated
    host.appendChild(player);

    // Attempt playback (unmuted first, muted with "Tap for sound" on policy block)
    this.attemptPlay(player);

    // Polling fallback to check if player started playing or has video inside
    let attempts = 0;
    this.playerPollInterval = setInterval(() => {
      attempts++;
      if (player.state === 'playing' || (player.time && player.time() > 0)) {
        onPlaySuccess();
        clearInterval(this.playerPollInterval);
      } else {
        const video = player.shadowRoot?.querySelector('video');
        if (video && (video.currentTime > 0 || !video.paused)) {
          onPlaySuccess();
          clearInterval(this.playerPollInterval);
        } else if (attempts >= 40) {
          clearInterval(this.playerPollInterval);
        }
      }
    }, 100);
  }

  private async attemptPlay(player: any): Promise<void> {
    try {
      player.muted = false;
      player.volume = 1;
      await player.play();
      if (player.state === 'playing') {
        this.isPlayerReady = true;
        this.showTapForSound = false;
        this.isMuted = false;
        if (this.fallbackTimer) {
          clearTimeout(this.fallbackTimer);
          this.fallbackTimer = undefined;
        }
        this.cdr.detectChanges();
      }
    } catch (err) {
      // Browser autoplay policy rejected unmuted audio; switch to muted
      try {
        player.muted = true;
        player.volume = 0;
        await player.play();
        this.showTapForSound = true;
        this.isMuted = true;
        if (player.state === 'playing') {
          this.isPlayerReady = true;
          if (this.fallbackTimer) {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = undefined;
          }
        }
        this.cdr.detectChanges();
      } catch (muteErr) {
        // Even muted was blocked; user can press the big play button
        console.warn('[ProjectDetail] Autoplay blocked, awaiting user click:', muteErr);
      }
    }
  }

  unmuteVideo(): void {
    if (this.activePlayerEl) {
      this.activePlayerEl.muted = false;
      this.activePlayerEl.volume = 1;
      this.wistiaService.setMuted(this.activePlayerEl, false);
    }
    this.showTapForSound = false;
    this.isMuted = false;
    this.cdr.detectChanges();
  }

  private cleanupCurrentPlayer(): void {
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = undefined;
    }
    if (this.playerPollInterval) {
      clearInterval(this.playerPollInterval);
      this.playerPollInterval = undefined;
    }
    if (this.activePlayerEl) {
      try {
        this.activePlayerEl.pause();
        this.activePlayerEl.muted = true;
        this.activePlayerEl.remove();
      } catch (e) {}
      this.activePlayerEl = null;
    }
    if (this.currentHostEl) {
      this.currentHostEl.innerHTML = '';
    }
    this.isPlayerReady = false;
    this.useIframeFallback = false;
    this.showTapForSound = false;
    this.isMuted = false;
  }

  goBack(event?: Event): void {
    if (event) event.preventDefault();
    this.router.navigate(['/'], { fragment: 'projects' }).then(() => {
      setTimeout(() => {
        const el = document.getElementById('projects');
        if (el) {
          this.smoothScroll.scrollTo(el, { offset: -80 });
        }
      }, 80);
    });
  }

  onBookCall(event?: Event): void {
    if (event) event.preventDefault();
    this.router.navigate(['/'], { fragment: 'book' }).then(() => {
      setTimeout(() => {
        const el = document.getElementById('book');
        if (el) {
          this.smoothScroll.scrollTo(el, { offset: -80 });
        }
      }, 80);
    });
  }

  private redirectToHomeProjects(): void {
    this.router.navigate(['/'], { fragment: 'projects' });
  }
}

