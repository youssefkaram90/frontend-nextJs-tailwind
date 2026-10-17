/**
 * The shape a list endpoint returns once `page` and `pageSize` are sent.
 *
 * `Backend/src/common/pagination.ts` documents the bargain: without those two
 * params an endpoint answers a plain array (backwards compatible); with them it
 * answers this envelope, which is what lets a screen page instead of downloading
 * a whole season in one response.
 *
 * The phone already has this shape; `types/crop-care.ts` and `types/harvest.ts`
 * still declare their own copies — those two belong here when their modules are
 * swept.
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
