import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_CONFIG,
  ProjectCategoryId,
  CategoryDefinition,
  CategorySlug,
  ProjectCategoryLabel,
  getCategoryBySlug,
  getCategoryByLabel
} from './portfolio.config';

export type { ProjectCategoryId, CategoryDefinition, CategorySlug, ProjectCategoryLabel };
export type ProjectCategory = ProjectCategoryLabel;

export const CATEGORIES_CONFIG = {
  /**
   * Reads from PORTFOLIO_CONFIG as single source of truth.
   * Defaults to false to showcase the comprehensive 5-discipline portfolio structure.
   */
  hideEmptyCategories: PORTFOLIO_CONFIG.hideEmptyCategories ?? false,
  categories: PORTFOLIO_CATEGORIES
};

export { getCategoryBySlug, getCategoryByLabel };


