import type { 
  ProjectCategoryId, 
  CategoryDefinition, 
  CategorySlug, 
  ProjectCategoryLabel 
} from '../config/portfolio.config';

export type { ProjectCategoryId, CategoryDefinition, CategorySlug, ProjectCategoryLabel };
export type ProjectCategory = ProjectCategoryLabel;

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: 'home' | 'briefcase' | 'message-square';
}

export interface ClientLogo {
  name: string;
  url: string;
  alt: string;
  aspectRatio?: string;
}

export interface ProjectItem {
  id: string;
  slug?: string;
  title: string;
  category: ProjectCategoryId;
  categoryLabel?: string;
  wistiaId: string;
  aspect: number;
  orientation: 'landscape' | 'portrait';
  order: number;
  description?: string;
  previewVideo?: string;
  videoSrc?: string; // backwards compatibility
  thumbnail?: string;
  posterSrc?: string;
  fullVideoUrl?: string;
  youtubeId?: string;
  externalUrl?: string;
  clientName?: string;
  softwareUsed?: string[];
  projectRole?: string;
  featured?: boolean;
  aspectRatio?: 'landscape' | 'portrait';
}

export interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  role: string;
  company?: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface StatItem {
  id: string;
  value: number;
  suffix: string;
  label: string;
}

export interface SocialLink {
  platform: 'x' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp' | 'behance';
  name: string;
  handle: string;
  url: string;
}

export interface PortfolioConfig {
  hideEmptyCategories?: boolean;
  categories?: readonly CategoryDefinition[];
  creator: {
    name: string;
    brandName: string;
    professionalTitle: string;
    introduction: string;
    profilePhoto: string;
    buttonIconUrl?: string;
    email: string;
    whatsapp?: string;
  };
  hero: {
    headline: string | {
      line1: string;
      line2: string;
    };
    subheadline: string;
    primaryCta: {
      text: string;
      href: string;
    };
    secondaryCta: {
      text: string;
      href: string;
    };
  };
  showreel: {
    videoSrc: string;
    posterSrc?: string;
    badgeText?: string;
  };
  clientLogos: ClientLogo[];
  projects: ProjectItem[];
  testimonials: TestimonialItem[];
  statistics: StatItem[];
  booking: {
    enabled: boolean;
    chipText: string;
    title: string;
    calLink?: string;
    calNamespace?: string;
  };
  contact: {
    badgeText: string;
    title: string;
    subtitle: string;
    dmPillText: string;
    submitText: string;
    formEndpoint?: string;
  };
  socialLinks: SocialLink[];
  footer: {
    builtBy: string;
    rights: string;
    year: number;
  };
}
