import { Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';
import { AnimationService } from '../../core/services/animation.service';
import { SmoothScrollService } from '../../core/services/smooth-scroll.service';
import { BookACallComponent } from './book-a-call.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, BookACallComponent],
  template: `
    <section class="contact-section container" id="book">
      <!-- Secondary Anchor for backward compatibility -->
      <div id="call" style="position: absolute; top: -80px;"></div>

      <!-- Top Booking Section (BookACall Component) -->
      <ng-container *ngIf="config.booking.enabled">
        <app-book-a-call></app-book-a-call>

        <!-- Divider: or DM me here pill -->
        <div class="contact-divider scroll-reveal">
          <div class="divider-line"></div>
          <button 
            type="button" 
            class="dm-here-pill" 
            (click)="scrollToForm()"
            aria-label="Scroll to project request form"
          >
            <span class="dm-dot"></span>
            <span>{{ config.contact.dmPillText }}</span>
          </button>
          <div class="divider-line"></div>
        </div>
      </ng-container>

      <!-- Request Project Section -->
      <div class="request-project-wrapper scroll-reveal" id="form-section">
        <div class="request-header">
          <span class="badge-chip">{{ config.contact.badgeText }}</span>
          <span class="contact-subtitle-label">CONTACT</span>
          <p class="contact-intro">{{ config.contact.subtitle }}</p>

          <!-- Direct Quick-Contact Badges -->
          <div class="direct-contact-bar" *ngIf="config.creator.email || config.creator.whatsapp">
            <a 
              *ngIf="config.creator.email" 
              [href]="'mailto:' + config.creator.email" 
              class="direct-pill glass-pill"
              [attr.aria-label]="'Email ' + config.creator.email"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
              <span>{{ config.creator.email }}</span>
            </a>
            <a 
              *ngIf="config.creator.whatsapp" 
              [href]="whatsappUrl" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="direct-pill glass-pill"
              aria-label="Chat on WhatsApp"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        <!-- Form Card -->
        <form class="project-form" (ngSubmit)="onSubmit()" #contactForm="ngForm" novalidate>
          <!-- Success State -->
          <div *ngIf="formSubmitted" class="form-alert success" role="alert">
            <span>✓ Message confirmed! I will review your project brief and reply within 24 hours.</span>
          </div>

          <!-- Error State -->
          <div *ngIf="submitError" class="form-alert error" role="alert">
            <span>⚠️ {{ errorMessage }}</span>
            <div class="direct-contact-fallback">
              <a [href]="'mailto:' + config.creator.email" class="fallback-link">
                ✉ Email Directly: {{ config.creator.email }}
              </a>
              <a *ngIf="config.creator.whatsapp" [href]="whatsappUrl" target="_blank" rel="noopener noreferrer" class="fallback-link">
                💬 WhatsApp Directly
              </a>
            </div>
          </div>

          <!-- Client-side Mailto Notification (Honest State) -->
          <div *ngIf="submitNotice" class="form-alert notice" role="status">
            <span>ℹ️ {{ submitNotice }}</span>
          </div>

          <!-- Name and Email Row (2 Columns) -->
          <div class="form-row-two">
            <div class="form-group">
              <label for="contact-name" class="visually-hidden">Your Name</label>
              <input 
                id="contact-name"
                type="text" 
                name="name" 
                [(ngModel)]="formData.name" 
                placeholder="Name" 
                required 
                aria-label="Your Name"
                class="form-input" 
                [disabled]="isSubmitting"
              />
            </div>
            <div class="form-group">
              <label for="contact-email" class="visually-hidden">Your Email</label>
              <input 
                id="contact-email"
                type="email" 
                name="email" 
                [(ngModel)]="formData.email" 
                placeholder="Email" 
                required 
                email
                aria-label="Your Email"
                class="form-input" 
                [disabled]="isSubmitting"
              />
            </div>
          </div>

          <!-- Message Textarea -->
          <div class="form-group">
            <label for="contact-message" class="visually-hidden">Your Message</label>
            <textarea 
              id="contact-message"
              name="message" 
              [(ngModel)]="formData.message" 
              placeholder="Tell me about your project, raw footage length, and turnaround goals..." 
              rows="5" 
              required 
              aria-label="Your Message"
              class="form-input form-textarea"
              [disabled]="isSubmitting"
              (keydown.enter)="onEnterKey($event)"
            ></textarea>
          </div>

          <!-- Submit Button Row -->
          <div class="form-submit-row">
            <button 
              type="submit" 
              class="submit-button" 
              [disabled]="!contactForm.form.valid || isSubmitting"
            >
              <span>{{ isSubmitting ? 'Sending Brief...' : config.contact.submitText }}</span>
            </button>
            <span class="submit-hint">or ↵ Enter to send</span>
          </div>
        </form>

        <!-- Dynamic Social Links Rows -->
        <div class="social-links-list">
          <a 
            *ngFor="let social of config.socialLinks" 
            [href]="social.url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="social-row-link"
            [attr.aria-label]="social.name + ': ' + social.handle"
          >
            <div class="social-left">
              <span class="social-icon">
                <!-- YouTube Icon -->
                <svg *ngIf="social.platform === 'youtube'" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>

                <!-- X / Twitter Icon -->
                <ng-container *ngIf="social.platform === 'x'">𝕏</ng-container>

                <!-- Instagram Icon -->
                <svg *ngIf="social.platform === 'instagram'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>

                <!-- LinkedIn Icon -->
                <svg *ngIf="social.platform === 'linkedin'" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3m1.39 9.74v-8.37H5.07v8.37h2.78z"/>
                </svg>
              </span>
              <span class="social-title">{{ social.name }}</span>
            </div>
            <div class="social-right">
              <span class="social-handle">{{ social.handle }}</span>
              <span class="social-arrow" aria-hidden="true">↗</span>
            </div>
          </a>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit, OnDestroy {
  readonly config = PORTFOLIO_CONFIG;
  private el = inject(ElementRef);
  private animationService = inject(AnimationService);
  private smoothScroll = inject(SmoothScrollService);
  private ctx?: gsap.Context;

  isSubmitting = false;
  formSubmitted = false;
  submitError = false;
  errorMessage = '';
  submitNotice = '';

  formData = {
    name: '',
    email: '',
    message: ''
  };

  get whatsappUrl(): string {
    const raw = this.config.creator.whatsapp || '';
    const clean = raw.replace(/[^\d+]/g, '');
    const text = encodeURIComponent(`Hi ${this.config.creator.name}, I'm interested in discussing a video editing project.`);
    return `https://wa.me/${clean}?text=${text}`;
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.ctx = this.animationService.createContext(this.el.nativeElement);
      const reveals = this.el.nativeElement.querySelectorAll('.scroll-reveal');
      this.animationService.animateOnScroll(reveals, { y: 35, stagger: 0.12 }, this.ctx);
    }
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }

  scrollToForm(): void {
    this.smoothScroll.scrollTo('#form-section', { offset: -80 });
  }

  onSubmit(): void {
    if (!this.formData.name || !this.formData.email || !this.formData.message) return;

    this.submitError = false;
    this.submitNotice = '';
    this.errorMessage = '';

    const endpoint = this.config.contact.formEndpoint?.trim();

    if (endpoint) {
      this.isSubmitting = true;
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: this.formData.name,
          email: this.formData.email,
          message: this.formData.message,
          _subject: `New Video Project Request from ${this.formData.name}`
        })
      })
        .then(res => {
          this.isSubmitting = false;
          if (res.ok) {
            this.formSubmitted = true;
            this.formData = { name: '', email: '', message: '' };
          } else {
            this.submitError = true;
            this.errorMessage = 'The submission service returned an error. Please contact me directly using email or WhatsApp below.';
          }
        })
        .catch(() => {
          this.isSubmitting = false;
          this.submitError = true;
          this.errorMessage = 'Network connection failed. Please contact me directly using email or WhatsApp below.';
        });
    } else {
      // Truthful client-side fallback: no false "sent" message
      this.submitNotice = `Opening your email client to send your brief directly to ${this.config.creator.email}...`;
      const subject = encodeURIComponent(`Project Brief from ${this.formData.name}`);
      const body = encodeURIComponent(
        `Hi ${this.config.creator.name},\n\nName: ${this.formData.name}\nEmail: ${this.formData.email}\n\nProject Brief:\n${this.formData.message}`
      );
      window.location.href = `mailto:${this.config.creator.email}?subject=${subject}&body=${body}`;
    }
  }

  onEnterKey(event: Event): void {
    const kbEvent = event as KeyboardEvent;
    if (!kbEvent.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }
}
