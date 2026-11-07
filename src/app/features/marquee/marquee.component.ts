import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';

@Component({
  selector: 'app-marquee',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="hasLogos" class="marquee-section" aria-label="Client Brand Logos">
      <div class="marquee-track">
        <!-- First Loop Set -->
        <div class="marquee-group">
          <div *ngFor="let logo of config.clientLogos" class="marquee-item">
            <img [src]="logo.url" [alt]="logo.alt" loading="lazy" class="logo-img" />
          </div>
        </div>

        <!-- Duplicated Loop Set for Continuous Infinite Marquee -->
        <div class="marquee-group" aria-hidden="true">
          <div *ngFor="let logo of config.clientLogos" class="marquee-item">
            <img [src]="logo.url" [alt]="logo.alt" loading="lazy" class="logo-img" />
          </div>
        </div>

        <!-- Triplicated Set to Guarantee Seamless Loop on Ultra-Wide Monitors -->
        <div class="marquee-group" aria-hidden="true">
          <div *ngFor="let logo of config.clientLogos" class="marquee-item">
            <img [src]="logo.url" [alt]="logo.alt" loading="lazy" class="logo-img" />
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./marquee.component.scss']
})
export class MarqueeComponent {
  readonly config = PORTFOLIO_CONFIG;

  get hasLogos(): boolean {
    return !!(this.config.clientLogos && this.config.clientLogos.length > 0);
  }
}
