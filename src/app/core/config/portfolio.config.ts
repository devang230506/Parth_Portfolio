import { PortfolioConfig } from '../models/portfolio.model';
import { environment } from '../../../environments/environment';

export type ProjectCategoryId =
  | 'advertisements-commercials'
  | 'youtube'
  | 'vsl'
  | 'shorts'
  | 'saas-explainer';

export interface CategoryDefinition {
  id: ProjectCategoryId;
  label: string;
  slug: string;
  order: number;
}

/**
 * Authoritative single source of truth for portfolio project categories.
 * In exact order: Advertisements & Commercials, YouTube, VSL, Shorts, SaaS Explainer.
 */
export const PORTFOLIO_CATEGORIES: readonly CategoryDefinition[] = [
  {
    id: 'advertisements-commercials',
    label: 'Advertisements & Commercials',
    slug: 'advertisements-commercials',
    order: 1
  },
  {
    id: 'youtube',
    label: 'YouTube',
    slug: 'youtube',
    order: 2
  },
  {
    id: 'vsl',
    label: 'VSL',
    slug: 'vsl',
    order: 3
  },
  {
    id: 'shorts',
    label: 'Shorts',
    slug: 'shorts',
    order: 4
  },
  {
    id: 'saas-explainer',
    label: 'SaaS Explainer',
    slug: 'saas-explainer',
    order: 5
  }
] as const;

export type CategorySlug = typeof PORTFOLIO_CATEGORIES[number]['slug'];
export type ProjectCategoryLabel = typeof PORTFOLIO_CATEGORIES[number]['label'];

export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return PORTFOLIO_CATEGORIES.find(c => c.slug.toLowerCase() === slug.toLowerCase());
}

export function getCategoryByLabel(label: string): CategoryDefinition | undefined {
  return PORTFOLIO_CATEGORIES.find(c => c.label.toLowerCase() === label.toLowerCase());
}

export function getCategoryById(id: ProjectCategoryId | string): CategoryDefinition | undefined {
  return PORTFOLIO_CATEGORIES.find(c => c.id === id);
}

export function getProjectBySlug(slug: string): (typeof PORTFOLIO_CONFIG.projects)[number] | undefined {
  if (!slug) return undefined;
  const normalized = slug.trim().toLowerCase();
  return PORTFOLIO_CONFIG.projects.find(p => (p.slug || p.id).toLowerCase() === normalized);
}

export function getAdjacentProjects(slug: string): { 
  prev: (typeof PORTFOLIO_CONFIG.projects)[number]; 
  next: (typeof PORTFOLIO_CONFIG.projects)[number] 
} | undefined {
  const projects = PORTFOLIO_CONFIG.projects;
  if (!projects.length) return undefined;
  const index = projects.findIndex(p => (p.slug || p.id).toLowerCase() === slug.trim().toLowerCase());
  if (index === -1) return undefined;
  const prevIndex = (index - 1 + projects.length) % projects.length;
  const nextIndex = (index + 1) % projects.length;
  return {
    prev: projects[prevIndex],
    next: projects[nextIndex]
  };
}

export const PORTFOLIO_CONFIG: PortfolioConfig = {
  /**
   * Set to true to automatically hide categories that have zero active projects.
   * Defaults to false to showcase the comprehensive 5-discipline portfolio structure.
   */
  hideEmptyCategories: false,
  categories: PORTFOLIO_CATEGORIES,
  creator: {
    name: 'Parth',
    brandName: 'Parth Films & Post',
    professionalTitle: 'Professional Video Editor & Post-Production Specialist',
    introduction: 'Specializing in retention-engineered YouTube editing, viral short-form pacing, commercial color grading, and cinematic storytelling.',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    buttonIconUrl: 'https://framerusercontent.com/images/crFI6QWSAh3udwJztJVauKe2o.png',
    email: 'contact@parthfilms.com'
  },
  hero: {
    headline: 'Edits that make a story unforgettable.',
    subheadline: 'Crafting high-retention video edits, viral pacing, and cinematic visual experiences for creators and global brands.',
    primaryCta: {
      text: 'Book a Call',
      href: '#book'
    },
    secondaryCta: {
      text: "Let's Connect",
      href: '#form-section'
    }
  },
  showreel: {
    videoSrc: 'https://framerusercontent.com/assets/xPW5xSslxJD33FdDfQtRhp2F8sM.webm',
    posterSrc: 'https://framerusercontent.com/images/Bq1pvD771XDewNXdUlqp1EoSj9M.png',
    badgeText: 'Featured Showreel 2026'
  },
  /*
   * Project Showcase:
   * 6 real projects hosted on Wistia across 5 editing disciplines.
   */
  projects: [
    {
      id: 'motion-graphics',
      slug: 'motion-graphics',
      title: 'Motion Graphics',
      category: 'saas-explainer',
      wistiaId: '97p1m4awwh',
      aspect: 1.7777777777777777,
      orientation: 'landscape',
      order: 1
    },
    {
      id: 'swati-cosmetics',
      slug: 'swati-cosmetics',
      title: 'Swati Cosmetics',
      category: 'advertisements-commercials',
      wistiaId: 'nhtqnf7d9f',
      aspect: 0.5625,
      orientation: 'portrait',
      order: 2
    },
    {
      id: 'nathan-bently',
      slug: 'nathan-bently',
      title: 'Nathan Bently',
      category: 'youtube',
      wistiaId: 'sgxi8up560',
      aspect: 1.7777777777777777,
      orientation: 'landscape',
      order: 3
    },
    {
      id: 'joel-kaplan',
      slug: 'joel-kaplan',
      title: 'Joel Kaplan',
      category: 'vsl',
      wistiaId: 'lpvnhme2vb',
      aspect: 1.7777777777777777,
      orientation: 'landscape',
      order: 4
    },
    {
      id: 'huberman-lab',
      slug: 'huberman-lab',
      title: 'HubermanLab',
      category: 'shorts',
      wistiaId: 'exdk2eu1hy',
      aspect: 0.5625,
      orientation: 'portrait',
      order: 5
    },
    {
      id: 'the-editing-task',
      slug: 'the-editing-task',
      title: 'The editing task',
      category: 'shorts',
      wistiaId: 'ujy3rwgrhi',
      aspect: 0.5625,
      orientation: 'portrait',
      order: 6
    }
  ],
  /*
   * Client Testimonials:
   * Clearly marked placeholder array awaiting your genuine client reviews.
   * Shape: { id, quote, name, role, avatar }
   */
  testimonials: [
    {
      id: '1',
      quote: 'REPLACE WITH REAL CLIENT QUOTE',
      name: 'REPLACE',
      role: 'REPLACE',
      avatar: 'REPLACE'
    },
    {
      id: '2',
      quote: 'REPLACE WITH REAL CLIENT QUOTE',
      name: 'REPLACE',
      role: 'REPLACE',
      avatar: 'REPLACE'
    },
    {
      id: '3',
      quote: 'REPLACE WITH REAL CLIENT QUOTE',
      name: 'REPLACE',
      role: 'REPLACE',
      avatar: 'REPLACE'
    }
  ],
  /*
   * Performance Statistics:
   * Restored to exact values: 55 Videos Edited, 1.5M Organic Views Driven, 48h Average Turnaround.
   */
  statistics: [
    {
      id: 'stat-projects',
      value: 55,
      suffix: '',
      label: 'Videos Edited'
    },
    {
      id: 'stat-views',
      value: 1.5,
      suffix: 'M',
      label: 'Organic Views Driven'
    },
    {
      id: 'stat-turnaround',
      value: 48,
      suffix: 'h',
      label: 'Average Turnaround'
    }
  ],
  booking: {
    enabled: true,
    chipText: 'Book a Call',
    title: "Let's talk scope, timeline, and budget — no fluff, just clarity",
    calLink: environment.calLink,
    calNamespace: environment.calNamespace
  },
  contact: {
    badgeText: 'START A PROJECT',
    title: 'Request Video Edit',
    subtitle: 'Share your project brief, raw footage details, or turnaround requirements.',
    dmPillText: 'or Direct Message',
    submitText: 'Send Project Brief',
    formEndpoint: '' // Optional: Formspree, Getform, or custom backend URL
  },
  socialLinks: [
    {
      platform: 'instagram',
      name: 'Instagram',
      handle: '@parth.editor',
      url: 'https://instagram.com'
    },
    {
      platform: 'x',
      name: 'X.com',
      handle: '@parth_edits',
      url: 'https://x.com'
    },
    {
      platform: 'linkedin',
      name: 'LinkedIn',
      handle: 'parth-editor',
      url: 'https://linkedin.com'
    }
  ],
  footer: {
    builtBy: 'Parth Films & Post',
    rights: 'All rights reserved',
    year: 2026
  }
};
