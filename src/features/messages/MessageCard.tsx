import { Avatar, Card, TagPill } from '@/components/ui';
import { absoluteTime, relativeTime } from '@/lib/time';
import type { Message } from '@/lib/schemas';

/**
 * A single feed entry (design 02). Presentational — `isOwn` decides whether
 * EDIT/DELETE render at all (server-enforced ownership means hiding them here
 * is a UX nicety, not the security boundary). Handlers are wired in a later
 * phase; omitting them for now just renders inert buttons.
 */
export function MessageCard({
  message,
  isOwn,
  onEdit,
  onDelete,
}: {
  message: Message;
  isOwn: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card className="p-[18px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar initial={message.author.initial} size="md" />
          <div>
            <p className="text-[15px] leading-tight font-bold">{message.author.name}</p>
            <p className="text-xs leading-tight text-muted">@{message.author.handle}</p>
          </div>
        </div>
        <time
          dateTime={message.createdAt}
          title={absoluteTime(message.createdAt)}
          className="shrink-0 text-xs text-muted"
        >
          {relativeTime(message.createdAt)}
          {message.edited && ' · edited'}
        </time>
      </div>

      <p className="mt-4 text-base leading-6 break-words">{message.body}</p>

      <div className="mt-4 flex items-center justify-between">
        <TagPill active>{message.tag}</TagPill>
        {isOwn && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onEdit}
              className="press border-2 border-ink bg-surface px-3 py-1.5 font-mono-ui text-xs font-bold uppercase"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="press border-2 border-ink bg-surface px-3 py-1.5 font-mono-ui text-xs font-bold uppercase"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
