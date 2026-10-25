import { z } from 'zod';
import { LIMITS } from '@mab/shared';

/**
 * Builds a strict schema for list query strings: search, paging, sorting and the given filters.
 * Unknown query parameters are rejected.
 */
export function listQuerySchema({ sortFields, defaultSort = sortFields[0], filters = {} }) {
  return z.strictObject({
    q: z.string().trim().max(LIMITS.SEARCH_MAX).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(LIMITS.PAGE_SIZE_MAX).default(LIMITS.PAGE_SIZE_DEFAULT),
    sort: z.enum(sortFields).default(defaultSort),
    order: z.enum(['asc', 'desc']).default('asc'),
    ...filters,
  });
}

export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Case-insensitive "contains" match on any of the given fields. */
export function searchFilter(q, fields) {
  if (!q) return {};
  const pattern = new RegExp(escapeRegex(q), 'i');
  return { $or: fields.map((field) => ({ [field]: pattern })) };
}

/**
 * Runs a paginated, sorted find and returns the page plus totals.
 * `thenBy` adds secondary sort keys (e.g. time after date) in the same direction.
 */
export async function findPage(Model, filter, { page, limit, sort, order }, { populate, thenBy = [] } = {}) {
  const direction = order === 'desc' ? -1 : 1;
  // _id as a final tie-breaker keeps the order stable across pages.
  let query = Model.find(filter)
    .sort({ [sort]: direction, ...Object.fromEntries(thenBy.map((key) => [key, direction])), _id: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  if (populate) query = query.populate(populate);

  const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
