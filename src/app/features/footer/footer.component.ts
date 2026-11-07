import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer-section container">
      <div class="footer-content">
        <div class="footer-left">
          <span>Built by </span>
          <span class="footer-author">{{ config.footer.builtBy }}</span>
        </div>
        <div class="footer-right">
          <span>© {{ config.footer.year }} {{ config.footer.rights }}</span>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  readonly config = PORTFOLIO_CONFIG;
}

