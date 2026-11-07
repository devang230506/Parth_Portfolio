import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FloatingNavComponent } from '../../shared/components/floating-nav/floating-nav.component';
import { HeroComponent } from '../../features/hero/hero.component';
import { MarqueeComponent } from '../../features/marquee/marquee.component';
import { ShowreelComponent } from '../../features/showreel/showreel.component';
import { ProjectsComponent } from '../../features/projects/projects.component';
import { TestimonialsComponent } from '../../features/testimonials/testimonials.component';
import { StatisticsComponent } from '../../features/statistics/statistics.component';
import { ContactComponent } from '../../features/contact/contact.component';
import { FooterComponent } from '../../features/footer/footer.component';
import { SmoothScrollService } from '../../core/services/smooth-scroll.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FloatingNavComponent,
    HeroComponent,
    MarqueeComponent,
    ShowreelComponent,
    ProjectsComponent,
    TestimonialsComponent,
    StatisticsComponent,
    ContactComponent,
    FooterComponent
  ],
  template: `
    <div class="page-wrapper">
      <!-- Ambient light fields for liquid glass refraction -->
      <div class="ambient-glow glow-top" aria-hidden="true"></div>
      <div class="ambient-glow glow-mid" aria-hidden="true"></div>
      <div class="ambient-glow glow-bottom" aria-hidden="true"></div>

      <!-- Fixed Floating Top Island Nav -->
      <app-floating-nav></app-floating-nav>

      <!-- Main Page Flow -->
      <main class="page-main">
        <app-hero></app-hero>
        <app-marquee></app-marquee>
        <app-showreel></app-showreel>
        <app-projects></app-projects>
        <app-testimonials></app-testimonials>
        <app-statistics></app-statistics>
        <app-contact></app-contact>
      </main>

      <!-- Footer -->
      <app-footer></app-footer>
    </div>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private smoothScroll = inject(SmoothScrollService);

  ngOnInit(): void {
    this.smoothScroll.init();
  }

  ngOnDestroy(): void {
    this.smoothScroll.destroy();
  }
}
