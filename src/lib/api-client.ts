import { MessagesPageSchema, type MessagesPage, type MessagesQuery } from '@/lib/schemas';

/**
 * Typed fetch wrappers for the client. Every response is parsed through the
 * same Zod schema the server validates against, so a shape drift between
 * client and server fails loudly instead of producing a silent runtime bug.
 */

function toSearchParams(query: Partial<MessagesQuery>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

export async function fetchMessages(
  query: Partial<MessagesQuery>,
  init?: RequestInit,
): Promise<MessagesPage> {
  const qs = toSearchParams(query);
  const res = await fetch(`/api/messages${qs ? `?${qs}` : ''}`, init);
  if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
  return MessagesPageSchema.parse(await res.json());
}
