import type {
  CreateMessageInput,
  EditMessageInput,
  Message,
  MessagesPage,
  MessagesQuery,
  User,
} from '@/lib/schemas';

/**
 * The storage seam. Everything above this line (route handlers, hooks, UI)
 * depends only on these interfaces — never on how data is actually stored.
 * Swapping the file-backed mock for a real database means writing one new
 * implementation; nothing else changes.
 */
export interface MessageRepo {
  /** Filtered, newest-first, cursor-paginated feed. */
  list(query: MessagesQuery): Promise<MessagesPage>;
  /** A single message (with author), or null if it doesn't exist. */
  getById(id: string): Promise<Message | null>;
  /** Create a message authored by `authorId`. */
  create(input: CreateMessageInput, authorId: string): Promise<Message>;
  /** Edit a message. Throws ForbiddenError unless `userId` is the author. */
  update(id: string, input: EditMessageInput, userId: string): Promise<Message>;
  /** Delete a message. Throws ForbiddenError unless `userId` is the author. */
  delete(id: string, userId: string): Promise<void>;
}

export interface UserRepo {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
