import { Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';
import { CustomVideoPlayerComponent } from '../../shared/components/custom-video-player/custom-video-player.component';
import { AnimationService } from '../../core/services/animation.service';

@Component({
  selector: 'app-showreel',
  standalone: true,
  imports: [CommonModule, CustomVideoPlayerComponent],
  template: `
    <section class="showreel-section container" id="ppppP">
      <div class="showreel-wrapper scroll-reveal">
        <app-custom-video-player
          [src]="config.showreel.videoSrc"
          [poster]="config.showreel.posterSrc"
        ></app-custom-video-player>
      </div>
    </section>
  `,
  styleUrls: ['./showreel.component.scss']
})
export class ShowreelComponent implements OnInit, OnDestroy {
  readonly config = PORTFOLIO_CONFIG;
  private el = inject(ElementRef);
  private animationService = inject(AnimationService);
  private ctx?: gsap.Context;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.ctx = this.animationService.createContext(this.el.nativeElement);
      const reveals = this.el.nativeElement.querySelectorAll('.scroll-reveal');
      this.animationService.animateOnScroll(reveals, { y: 40 }, this.ctx);
    }
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
