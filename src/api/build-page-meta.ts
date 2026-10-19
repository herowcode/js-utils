import { getOffset } from "./get-offset"

export interface IPageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  offset: number
  hasNext: boolean
  hasPrev: boolean
}

export interface IBuildPageMetaInput {
  /** 1-based page number. */
  page: number
  pageSize: number
  /** Total number of rows across all pages. */
  total: number
}

/**
 * Pagination metadata for a list response; invalid numbers are clamped (page and pageSize to 1, total to 0).
 * @example buildPageMeta({ page: 2, pageSize: 10, total: 25 }) // { totalPages: 3, hasNext: true, ... }
 */
export function buildPageMeta({
  page,
  pageSize,
  total,
}: IBuildPageMetaInput): IPageMeta {
  const safePage = Math.max(1, Math.floor(page) || 1)
  const safeSize = Math.max(1, Math.floor(pageSize) || 1)
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0
  const totalPages = Math.ceil(safeTotal / safeSize)
  return {
    page: safePage,
    pageSize: safeSize,
    total: safeTotal,
    totalPages,
    offset: getOffset(safePage, safeSize),
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  }
}
