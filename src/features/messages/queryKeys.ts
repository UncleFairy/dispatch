import type { MessagesQuery } from '@/lib/schemas';

export type MessagesFilters = Pick<MessagesQuery, 'tag' | 'userId' | 'from' | 'to'>;

/** One cache entry per distinct filter combination. */
export function messagesKey(filters: MessagesFilters) {
  return ['messages', filters] as const;
}
