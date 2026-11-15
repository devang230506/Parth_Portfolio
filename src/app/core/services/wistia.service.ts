import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class WistiaService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private playerScriptPromise?: Promise<void>;
  private loadedEmbeds = new Set<string>();

  /**
   * Loads https://fast.wistia.com/player.js ONCE as an async script.
   * Deduplicates by checking for an existing script tag or customElements definition.
   */
  loadPlayerScript(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();

    if (this.playerScriptPromise) {
      return this.playerScriptPromise;
    }

    this.playerScriptPromise = new Promise<void>((resolve) => {
      // Check if custom element is already defined
      if ('customElements' in window && customElements.get('wistia-player')) {
        resolve();
        return;
      }

      // Check if script tag already exists in DOM
      const existing = document.querySelector('script[src*="fast.wistia.com/player.js"]');
      if (existing) {
        if ('customElements' in window) {
          customElements.whenDefined('wistia-player').then(() => resolve()).catch(() => resolve());
        } else {
          resolve();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://fast.wistia.com/player.js';
      script.async = true;
      script.onload = () => {
        if ('customElements' in window) {
          customElements.whenDefined('wistia-player').then(() => resolve()).catch(() => resolve());
        } else {
          resolve();
        }
      };
      script.onerror = (err) => {
        console.warn('[WistiaService] player.js failed to load, falling back to swatches:', err);
        resolve(); // resolve so UI remains gracefully interactive with swatches
      };
      document.head.appendChild(script);
    });

    return this.playerScriptPromise;
  }

  /**
   * Loads https://fast.wistia.com/embed/{mediaId}.js (type="module") once per media ID.
   * Deduplicates by checking for an existing script tag or loaded set.
   */
  loadMediaEmbed(mediaId: string): Promise<void> {
    if (!this.isBrowser || !mediaId) return Promise.resolve();

    if (this.loadedEmbeds.has(mediaId)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const src = `https://fast.wistia.com/embed/${mediaId}.js`;
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        this.loadedEmbeds.add(mediaId);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.type = 'module';
      script.async = true;
      script.onload = () => {
        this.loadedEmbeds.add(mediaId);
        resolve();
      };
      script.onerror = (err) => {
        console.warn(`[WistiaService] Embed module for ${mediaId} failed to load:`, err);
        this.loadedEmbeds.add(mediaId);
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Promise that resolves when custom element 'wistia-player' is defined.
   */
  whenDefined(): Promise<void> {
    if (!this.isBrowser || !('customElements' in window)) return Promise.resolve();
    return customElements.whenDefined('wistia-player').then(() => {}).catch(() => {});
  }

  /**
   * Prepares a specific media item by loading player.js and the media embed module.
   */
  prepareMedia(mediaId: string): Promise<void> {
    if (!this.isBrowser || !mediaId) return Promise.resolve();
    return Promise.all([
      this.loadPlayerScript(),
      this.loadMediaEmbed(mediaId)
    ]).then(() => this.whenDefined());
  }

  /**
   * Creates a wistia-player custom element with all required attributes (especially media-id)
   * set BEFORE the element is ever connected to the DOM.
   * This completely prevents the fatal "media-id attribute is required at St.connectedCallback"
   * error when customElements.get('wistia-player') is already defined.
   */
  createPlayerElement(mediaId: string, aspect: number | string, options: {
    muted?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    controlsVisibleOnLoad?: boolean;
    playBarControl?: boolean;
    volumeControl?: boolean;
    fullscreenButton?: boolean;
    bigPlayButton?: boolean;
    fitStrategy?: 'cover' | 'contain';
    className?: string;
  } = {}): any {
    if (!this.isBrowser) return null;
    const player = document.createElement('wistia-player') as any;
    player.setAttribute('media-id', mediaId);
    player.setAttribute('aspect', String(aspect));
    player.setAttribute('autoplay', options.autoplay !== false ? 'true' : 'false');
    player.setAttribute('muted', options.muted !== false ? 'true' : 'false');
    player.setAttribute('playsinline', 'true');
    player.setAttribute('plays-inline', 'true');
    if (options.loop) {
      player.setAttribute('loop', 'true');
      player.setAttribute('end-video-behavior', 'loop');
    }
    player.setAttribute('controls-visible-on-load', options.controlsVisibleOnLoad ? 'true' : 'false');
    player.setAttribute('play-bar-control', options.playBarControl ? 'true' : 'false');
    player.setAttribute('volume-control', options.volumeControl ? 'true' : 'false');
    player.setAttribute('fullscreen-button', options.fullscreenButton ? 'true' : 'false');
    player.setAttribute('big-play-button', options.bigPlayButton ? 'true' : 'false');
    player.setAttribute('silent-autoplay', 'allow');
    if (options.fitStrategy) {
      player.setAttribute('fit-strategy', options.fitStrategy);
    }
    if (options.className) {
      player.className = options.className;
    }
    return player;
  }

  /**
   * Returns the official blurred swatch URL for a given Wistia media ID.
   */
  getSwatchUrl(mediaId: string): string {
    return `https://fast.wistia.com/embed/medias/${mediaId}/swatch`;
  }

  /**
   * Mute or unmute a wistia-player element using Wistia's documented properties
   * with fallback to shadowRoot HTMLVideoElement.
   */
  setMuted(container: HTMLElement, muted: boolean): void {
    if (!this.isBrowser || !container) return;
    try {
      const player = (container.tagName.toLowerCase() === 'wistia-player'
        ? container
        : container.querySelector('wistia-player')) as any;

      if (player) {
        player.muted = muted;
        if (muted) {
          player.volume = 0;
        } else {
          player.volume = 1;
        }

        // Direct audio control inside shadowRoot video
        if (player.shadowRoot) {
          const video = player.shadowRoot.querySelector('video') as HTMLVideoElement | null;
          if (video) {
            video.muted = muted;
            if (muted) {
              video.volume = 0;
            } else {
              video.volume = 1;
            }
          }
        }
      }
    } catch (e) {}
  }
}
