import { 
  AfterViewInit, 
  ChangeDetectorRef,
  Component, 
  CUSTOM_ELEMENTS_SCHEMA, 
  ElementRef, 
  EventEmitter, 
  HostListener, 
  Input, 
  NgZone,
  OnDestroy, 
  OnInit, 
  Output, 
  PLATFORM_ID, 
  inject 
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjectItem } from '../../../core/models/portfolio.model';
import { getCategoryById, getCategoryByLabel } from '../../../core/config/portfolio.config';
import { WistiaService } from '../../../core/services/wistia.service';

@Component({
  selector: 'app-video-modal',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div 
      class="video-modal-backdrop" 
      (click)="close()" 
      role="dialog" 
      aria-modal="true" 
      [attr.aria-label]="categoryLabel + ' video preview modal'"
    >
      <div 
        class="video-modal-content" 
        [class.portrait-modal]="isPortrait"
        [class.landscape-modal]="!isPortrait"
        (click)="$event.stopPropagation()"
      >
        <!-- Close Button -->
        <button 
          #closeButton
          class="modal-close-btn glass-pill" 
          (click)="close()" 
          aria-label="Close video modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Video Player: Wistia, YouTube Iframe, or Native HTML5 Video -->
        <div class="modal-video-wrapper" [class.portrait-wrapper]="isPortrait">
          <!-- Subtle Loading State (Poster / Swatch / Skeleton) -->
          <div 
            class="modal-loading-placeholder" 
            *ngIf="!isVideoReady"
            [style.background-image]="swatchUrl ? 'url(' + swatchUrl + ')' : null"
            aria-hidden="true"
          >
            <div class="modal-spinner-glow"></div>
          </div>

          <!-- Wistia Player (Web Component with sound and full controls) -->
          <wistia-player
            *ngIf="isPlayerMounted && project?.wistiaId"
            [attr.media-id]="project?.wistiaId"
            [attr.aspect]="project?.aspect"
            autoplay="true"
            playsinline="true"
            plays-inline="true"
            controls-visible-on-load="true"
            silent-autoplay="allow"
            class="modal-wistia-player"
            [class.player-visible]="isVideoReady"
          ></wistia-player>

          <!-- Fallback Unmute Pill (only shown if browser blocks unmuted playback) -->
          <button 
            type="button" 
            class="modal-unmute-pill glass-pill" 
            *ngIf="isMutedFallback && isVideoReady"
            (click)="unmute()"
            aria-label="Unmute video sound"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
            <span>Tap for Sound</span>
          </button>

          <iframe 
            *ngIf="!project?.wistiaId && youtubeUrl"
            [src]="youtubeUrl" 
            title="Video Reel Preview" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen
          ></iframe>

          <video 
            *ngIf="!project?.wistiaId && !youtubeUrl && activeVideoSrc" 
            [src]="activeVideoSrc" 
            controls 
            autoplay 
            playsinline
          ></video>
        </div>

        <!-- Project Details Card (Category, Role, Description) -->
        <div class="modal-info-panel" *ngIf="project">
          <div class="modal-info-header">
            <div class="header-left">
              <div class="modal-badges">
                <span class="modal-category-tag glass-pill" *ngIf="project.category">{{ categoryLabel }}</span>
                <span class="modal-role-tag" *ngIf="project.projectRole">{{ project.projectRole }}</span>
              </div>
              <h3 class="modal-project-title">{{ categoryLabel }}</h3>
              <p class="modal-client-note" *ngIf="project.clientName">Client: <span>{{ project.clientName }}</span></p>
            </div>
            <div class="header-right" *ngIf="project.fullVideoUrl">
              <a [href]="project.fullVideoUrl" target="_blank" rel="noopener noreferrer" class="watch-full-link">
                <span>Watch Full Edit</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <p class="modal-project-desc" *ngIf="project.description">{{ project.description }}</p>

          <div class="modal-software-row" *ngIf="project.softwareUsed && project.softwareUsed.length > 0">
            <span class="software-label">Tools & Pipeline:</span>
            <div class="software-tags">
              <span *ngFor="let tool of project.softwareUsed" class="software-tag">{{ tool }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./video-modal.component.scss']
})
export class VideoModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() project?: ProjectItem;
  @Input() videoSrc?: string;
  @Input() set youtubeId(id: string | undefined) {
    if (id) {
      this.youtubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
      );
    } else {
      this.youtubeUrl = null;
    }
  }

  @Output() closeRequested = new EventEmitter<void>();

  youtubeUrl: SafeResourceUrl | null = null;
  isPlayerMounted = false;
  isVideoReady = false;
  isMutedFallback = false;

  private isDestroyed = false;
  private wistiaVideoApi?: any;
  private previouslyFocusedElement?: HTMLElement | null;
  private playTimeout?: any;

  private el = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private sanitizer = inject(DomSanitizer);
  private wistiaService = inject(WistiaService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  get isPortrait(): boolean {
    if (this.project?.orientation === 'portrait') return true;
    if (this.project?.aspect && this.project.aspect < 1) return true;
    return false;
  }

  get categoryLabel(): string {
    if (!this.project?.category) return '';
    const def = getCategoryById(this.project.category) || getCategoryByLabel(this.project.category);
    return def ? def.label : this.project.category;
  }

  get activeVideoSrc(): string | undefined {
    return this.videoSrc || this.project?.videoSrc || this.project?.previewVideo;
  }

  get swatchUrl(): string | undefined {
    if (this.project?.wistiaId) {
      return this.wistiaService.getSwatchUrl(this.project.wistiaId);
    }
    return this.project?.posterSrc || undefined;
  }

  ngOnInit(): void {
    if (this.isBrowser && typeof document !== 'undefined') {
      this.previouslyFocusedElement = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      if (this.project?.wistiaId) {
        this.initWistiaPlayer(this.project.wistiaId);
      } else {
        this.isVideoReady = true;
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      const closeBtn = this.el.nativeElement.querySelector('.modal-close-btn') as HTMLElement;
      closeBtn?.focus();
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.playTimeout) {
      clearTimeout(this.playTimeout);
    }
    this.stopPlayback();
    if (this.isBrowser && typeof document !== 'undefined') {
      document.body.style.overflow = '';
      this.previouslyFocusedElement?.focus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Tab') {
      const focusable = Array.from(
        this.el.nativeElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ) as HTMLElement[];

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  }

  close(): void {
    this.stopPlayback();
    this.closeRequested.emit();
  }

  unmute(): void {
    this.isMutedFallback = false;
    if (this.wistiaVideoApi) {
      try {
        this.wistiaVideoApi.unmute();
        this.wistiaVideoApi.volume(1);
      } catch (e) {}
    }
    const playerEl = this.el.nativeElement.querySelector('wistia-player') as any;
    if (playerEl) {
      playerEl.muted = false;
      playerEl.volume = 1;
      if (playerEl.shadowRoot) {
        const vid = playerEl.shadowRoot.querySelector('video') as HTMLVideoElement | null;
        if (vid) {
          vid.muted = false;
          vid.volume = 1;
        }
      }
    }
    this.cdr.detectChanges();
  }

  private initWistiaPlayer(mediaId: string): void {
    // 1. Ensure scripts & custom element are fully defined before mounting
    this.wistiaService.prepareMedia(mediaId).then(() => {
      if (this.isDestroyed) return;

      this.zone.run(() => {
        this.isPlayerMounted = true;
        this.cdr.detectChanges();
      });

      // 2. Next tick: bind Wistia API and initiate playback
      this.playTimeout = setTimeout(() => {
        if (this.isDestroyed) return;
        this.bindAndPlay(mediaId);
      }, 50);
    }).catch(err => {
      console.warn('[VideoModal] Error preparing Wistia media:', err);
      if (!this.isDestroyed) {
        this.zone.run(() => {
          this.isPlayerMounted = true;
          this.isVideoReady = true;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private bindAndPlay(mediaId: string): void {
    const win = window as any;
    const playerEl = this.el.nativeElement.querySelector('wistia-player') as any;

    // Use Wistia's official JavaScript API queue
    win._wq = win._wq || [];
    win._wq.push({
      id: mediaId,
      onReady: (video: any) => {
        if (this.isDestroyed) {
          try { video.pause(); } catch (e) {}
          return;
        }
        this.wistiaVideoApi = video;

        this.zone.run(() => {
          this.isVideoReady = true;
          this.cdr.detectChanges();
        });

        // Attempt playback with sound enabled
        try {
          video.unmute();
          video.volume(1);
          const p = video.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {
              // Browser blocked unmuted autoplay -> fall back to muted and show unmute pill
              this.zone.run(() => {
                this.isMutedFallback = true;
                try {
                  video.mute();
                  video.play();
                } catch (e) {}
                this.cdr.detectChanges();
              });
            });
          }
        } catch (err) {
          this.zone.run(() => {
            this.isMutedFallback = true;
            try {
              video.mute();
              video.play();
            } catch (e) {}
            this.cdr.detectChanges();
          });
        }
      }
    });

    // Also attach to player custom element events
    if (playerEl) {
      const onReadyOrPlay = () => {
        if (!this.isVideoReady && !this.isDestroyed) {
          this.zone.run(() => {
            this.isVideoReady = true;
            this.cdr.detectChanges();
          });
        }
      };
      playerEl.addEventListener('play', onReadyOrPlay, { once: true });
      playerEl.addEventListener('ready', onReadyOrPlay, { once: true });

      // Direct method call if available on element
      if (typeof playerEl.play === 'function') {
        try {
          playerEl.muted = false;
          playerEl.volume = 1;
          const p = playerEl.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {
              this.zone.run(() => {
                this.isMutedFallback = true;
                playerEl.muted = true;
                playerEl.play?.().catch?.(() => {});
                this.cdr.detectChanges();
              });
            });
          }
        } catch (e) {}
      }
    }

    // Safety timeout: ensure loading state clears within 1s even if slow network
    setTimeout(() => {
      if (!this.isDestroyed && !this.isVideoReady) {
        this.zone.run(() => {
          this.isVideoReady = true;
          this.cdr.detectChanges();
        });
      }
    }, 1000);
  }

  private stopPlayback(): void {
    if (!this.isBrowser) return;
    try {
      if (this.wistiaVideoApi) {
        this.wistiaVideoApi.pause();
        this.wistiaVideoApi.mute();
      }
      const wistiaPlayer = this.el.nativeElement.querySelector('wistia-player') as any;
      if (wistiaPlayer) {
        if (typeof wistiaPlayer.pause === 'function') {
          wistiaPlayer.pause();
        }
        wistiaPlayer.muted = true;
      }

      const nativeVideo = this.el.nativeElement.querySelector('video') as HTMLVideoElement;
      if (nativeVideo) {
        nativeVideo.pause();
        nativeVideo.currentTime = 0;
      }
    } catch (e) {}
    this.isPlayerMounted = false;
    this.isVideoReady = false;
    this.isMutedFallback = false;
  }
}