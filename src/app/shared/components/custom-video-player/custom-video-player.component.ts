import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-video-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="ksvp-player ksvp-hover-enabled" 
      [class.ksvp-paused]="isPaused"
      [class.ksvp-hide-controls]="!controlsVisible && !isPaused"
      (mousemove)="onUserInteraction()"
      (mouseleave)="onMouseLeave()"
      (keydown)="onKeyDown($event)"
      tabindex="0"
      role="region"
      aria-label="Video player"
    >
      <!-- HTML5 Video Tag -->
      <video
        #videoElement
        [src]="src"
        [poster]="poster || ''"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        (click)="togglePlay()"
        (timeupdate)="onTimeUpdate()"
        (loadedmetadata)="onLoadedMetadata()"
        (ended)="onEnded()"
      ></video>

      <!-- Center Big Play Button (shown when paused) -->
      <button 
        type="button" 
        *ngIf="isPaused" 
        (click)="togglePlay()" 
        class="ksvp-center-play" 
        aria-label="Play video"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 5.5L19 12L8 18.5V5.5Z" fill="currentColor"/>
        </svg>
      </button>

      <!-- Bottom Floating Controls Overlay -->
      <div class="ksvp-controls" (click)="$event.stopPropagation()">
        <!-- Progress Bar -->
        <div class="ksvp-progress-wrap">
          <input 
            type="range" 
            min="0" 
            [max]="duration || 100" 
            step="0.01" 
            [value]="currentTime"
            (input)="onSeek($event)" 
            aria-label="Video progress" 
            class="ksvp-range ksvp-progress"
            [style.background]="progressBackground"
          />
        </div>

        <!-- Controls Row -->
        <div class="ksvp-row">
          <div class="ksvp-left">
            <!-- Play / Pause Toggle -->
            <button 
              type="button" 
              class="ksvp-button" 
              (click)="togglePlay()" 
              [attr.aria-label]="isPaused ? 'Play video' : 'Pause video'"
            >
              <svg *ngIf="isPaused" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 5.5L19 12L8 18.5V5.5Z" fill="currentColor"/>
              </svg>
              <svg *ngIf="!isPaused" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 5H10V19H7V5ZM14 5H17V19H14V5Z" fill="currentColor"/>
              </svg>
            </button>

            <!-- Volume Mute / Unmute & Slider -->
            <div class="ksvp-volume">
              <button 
                type="button" 
                class="ksvp-button" 
                (click)="toggleMute()" 
                [attr.aria-label]="isMuted ? 'Unmute video' : 'Mute video'"
              >
                <!-- Muted Icon -->
                <svg *ngIf="isMuted || volume === 0" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 9V15H8L13 19V5L8 9H4ZM17 9L21 13M21 9L17 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <!-- Unmuted Icon -->
                <svg *ngIf="!isMuted && volume > 0" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 9V15H8L13 19V5L8 9H4ZM16.5 7.5C17.5 8.5 18 10.2 18 12C18 13.8 17.5 15.5 16.5 16.5M19 5C20.5 6.5 21.5 9.1 21.5 12C21.5 14.9 20.5 17.5 19 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                [value]="isMuted ? 0 : volume" 
                (input)="onVolumeChange($event)" 
                aria-label="Volume" 
                class="ksvp-volume-range"
                [style.background]="volumeBackground"
              />
            </div>

            <!-- Time Display -->
            <span class="ksvp-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          </div>

          <div class="ksvp-right">
            <!-- Playback Speed Dropdown -->
            <select 
              class="ksvp-speed" 
              (change)="onSpeedChange($event)" 
              aria-label="Playback speed"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1" selected>1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="1.75">1.75x</option>
              <option value="2">2x</option>
            </select>

            <!-- Fullscreen Button -->
            <button 
              type="button" 
              class="ksvp-button" 
              (click)="toggleFullscreen()" 
              aria-label="Enter fullscreen"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 4H4V8M16 4H20V8M8 20H4V16M16 20H20V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./custom-video-player.component.scss']
})
export class CustomVideoPlayerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) src!: string;
  @Input() poster?: string;

  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;

  isPaused = false;
  isMuted = true;
  volume = 1;
  currentTime = 0;
  duration = 0;
  controlsVisible = true;

  private idleTimeout: any = null;

  ngOnInit(): void {
    this.startIdleTimer();
  }

  ngOnDestroy(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
  }

  get progressBackground(): string {
    const pct = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    return `linear-gradient(to right, rgb(255, 255, 255) ${pct}%, rgba(255, 255, 255, 0.24) ${pct}%)`;
  }

  get volumeBackground(): string {
    const currentVol = this.isMuted ? 0 : this.volume;
    const pct = currentVol * 100;
    return `linear-gradient(to right, rgb(255, 255, 255) ${pct}%, rgba(255, 255, 255, 0.25) ${pct}%)`;
  }

  togglePlay(): void {
    const video = this.videoRef.nativeElement;
    if (video.paused) {
      video.play().catch(() => {});
      this.isPaused = false;
    } else {
      video.pause();
      this.isPaused = true;
    }
    this.onUserInteraction();
  }

  toggleMute(): void {
    const video = this.videoRef.nativeElement;
    video.muted = !video.muted;
    this.isMuted = video.muted;
    this.onUserInteraction();
  }

  onVolumeChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    const val = parseFloat(target.value);
    const video = this.videoRef.nativeElement;
    this.volume = val;
    video.volume = val;
    video.muted = val === 0;
    this.isMuted = video.muted;
    this.onUserInteraction();
  }

  onSeek(e: Event): void {
    const target = e.target as HTMLInputElement;
    const seekTime = parseFloat(target.value);
    const video = this.videoRef.nativeElement;
    video.currentTime = seekTime;
    this.currentTime = seekTime;
    this.onUserInteraction();
  }

  onSpeedChange(e: Event): void {
    const target = e.target as HTMLSelectElement;
    const speed = parseFloat(target.value);
    this.videoRef.nativeElement.playbackRate = speed;
    this.onUserInteraction();
  }

  toggleFullscreen(): void {
    const container = this.videoRef.nativeElement.parentElement;
    if (!document.fullscreenElement && container) {
      container.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    this.onUserInteraction();
  }

  onTimeUpdate(): void {
    const video = this.videoRef.nativeElement;
    this.currentTime = video.currentTime;
    this.isPaused = video.paused;
  }

  onLoadedMetadata(): void {
    const video = this.videoRef.nativeElement;
    this.duration = video.duration || 0;
    this.isPaused = video.paused;
  }

  onEnded(): void {
    this.isPaused = true;
  }

  onUserInteraction(): void {
    this.controlsVisible = true;
    this.startIdleTimer();
  }

  onMouseLeave(): void {
    if (!this.isPaused) {
      this.controlsVisible = false;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'k') {
      event.preventDefault();
      this.togglePlay();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const video = this.videoRef.nativeElement;
      video.currentTime = Math.min(this.duration, video.currentTime + 5);
      this.onUserInteraction();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const video = this.videoRef.nativeElement;
      video.currentTime = Math.max(0, video.currentTime - 5);
      this.onUserInteraction();
    } else if (event.key === 'm') {
      event.preventDefault();
      this.toggleMute();
    } else if (event.key === 'f') {
      event.preventDefault();
      this.toggleFullscreen();
    }
  }

  private startIdleTimer(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    this.idleTimeout = setTimeout(() => {
      if (!this.isPaused) {
        this.controlsVisible = false;
      }
    }, 2400);
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}
