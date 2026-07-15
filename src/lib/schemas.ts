import { z } from 'zod';

/**
 * The single source of truth for DISPATCH's data shapes and validation rules.
 *
 * Every schema here is used at runtime (to validate untrusted input from the
 * network, the URL, forms, and the JSON store) and at build time (types are
 * derived with `z.infer`, so a value and its type can never drift apart).
 * These schemas are the contract shared by the route handlers and the client.
 */

/** The fixed set of message categories, per the reference design. */
export const TAGS = ['PRODUCT', 'DESIGN', 'RANDOM', 'ANNOUNCE'] as const;
export const TagSchema = z.enum(TAGS);
export type Tag = z.infer<typeof TagSchema>;

/** Message body length bounds — enforced on client and server. */
export const MIN_BODY = 10;
export const MAX_BODY = 240;

/** A seeded account. `email` is only ever used server-side (login lookup). */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  handle: z.string(), // without the leading "@"
  email: z.email(),
  initial: z.string().length(1), // avatar letter
});
export type User = z.infer<typeof UserSchema>;

/** Public author projection embedded in messages — never leaks the email. */
export const AuthorSchema = UserSchema.pick({
  id: true,
  name: true,
  handle: true,
  initial: true,
});
export type Author = z.infer<typeof AuthorSchema>;

/** How a message is persisted in the store (author kept as a foreign key). */
export const StoredMessageSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  body: z.string().min(1).max(MAX_BODY),
  tag: TagSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type StoredMessage = z.infer<typeof StoredMessageSchema>;

/** How a message is returned to clients: the stored row + denormalized author. */
export const MessageSchema = StoredMessageSchema.extend({
  author: AuthorSchema,
  edited: z.boolean(), // true when updatedAt differs from createdAt
});
export type Message = z.infer<typeof MessageSchema>;

/** Body of `POST /api/messages`. Trims whitespace before length checks. */
export const CreateMessageInput = z.object({
  body: z
    .string()
    .trim()
    .min(MIN_BODY, `Write at least ${MIN_BODY} characters`)
    .max(MAX_BODY, `Keep it under ${MAX_BODY} characters`),
  tag: TagSchema,
});
export type CreateMessageInput = z.infer<typeof CreateMessageInput>;

/** Body of `PATCH /api/messages/:id`. Both fields optional, but at least one required. */
export const EditMessageInput = z
  .object({
    body: z
      .string()
      .trim()
      .min(MIN_BODY, `Write at least ${MIN_BODY} characters`)
      .max(MAX_BODY, `Keep it under ${MAX_BODY} characters`)
      .optional(),
    tag: TagSchema.optional(),
  })
  .refine((v) => v.body !== undefined || v.tag !== undefined, {
    message: 'Nothing to update',
  });
export type EditMessageInput = z.infer<typeof EditMessageInput>;

/** Accepts any string a `Date` can parse (ISO date or datetime from the URL). */
const DateLike = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date');

/**
 * Filters + pagination for `GET /api/messages`, sourced from the URL query.
 * `limit` is coerced from its string form and clamped to a sane range.
 */
export const MessagesQuerySchema = z.object({
  tag: TagSchema.optional(),
  userId: z.string().optional(),
  from: DateLike.optional(),
  to: DateLike.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type MessagesQuery = z.infer<typeof MessagesQuerySchema>;

/** One page of the cursor-paginated feed. */
export const MessagesPageSchema = z.object({
  items: z.array(MessageSchema),
  nextCursor: z.string().nullable(),
});
export type MessagesPage = z.infer<typeof MessagesPageSchema>;

/** Body of `POST /api/auth/login`. */
export const LoginInput = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginInput>;
