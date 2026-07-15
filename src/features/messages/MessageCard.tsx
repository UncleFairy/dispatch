'use client';

import { useState } from 'react';
import { Avatar, Card, TagPill } from '@/components/ui';
import { cn } from '@/lib/cn';
import { absoluteTime, relativeTime } from '@/lib/time';
import {
  MAX_BODY,
  MIN_BODY,
  type EditMessageInput,
  type Message,
  type Tag,
} from '@/lib/schemas';
import { TagSelect } from '@/features/messages/TagSelect';

/**
 * A single feed entry (design 02). `isOwn` decides whether EDIT/DELETE render
 * at all (server-enforced ownership means hiding them here is a UX nicety,
 * not the security boundary). Edit switches the card into an inline form;
 * delete requires a second click ("Confirm?") before it fires, so a stray
 * tap can't destroy a message.
 */
export function MessageCard({
  message,
  isOwn,
  onUpdate,
  isUpdating,
  onDelete,
  isDeleting,
}: {
  message: Message;
  isOwn: boolean;
  onUpdate?: (input: EditMessageInput, options?: { onSuccess?: () => void }) => void;
  isUpdating?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [body, setBody] = useState(message.body);
  const [tag, setTag] = useState<Tag>(message.tag);
  const [warning, setWarning] = useState<string | null>(null);

  const overLimit = body.length > MAX_BODY;

  function startEditing() {
    setBody(message.body);
    setTag(message.tag);
    setWarning(null);
    setIsEditing(true);
  }

  function onSave(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (trimmed.length < MIN_BODY) {
      setWarning(`Write at least ${MIN_BODY} characters.`);
      return;
    }
    if (trimmed.length > MAX_BODY) {
      setWarning(`Keep it under ${MAX_BODY} characters.`);
      return;
    }
    onUpdate?.({ body: trimmed, tag }, { onSuccess: () => setIsEditing(false) });
  }

  function onDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setConfirmingDelete(false);
    onDelete?.();
  }

  if (isEditing) {
    return (
      <Card className="p-[18px]">
        <form onSubmit={onSave}>
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (warning) setWarning(null);
            }}
            autoFocus
            rows={2}
            aria-label="Edit message"
            aria-invalid={overLimit || undefined}
            className="w-full resize-none border-none bg-transparent text-base leading-6 outline-none"
          />

          <div className="mt-3.5 flex items-center justify-between border-t-2 border-hairline pt-3.5">
            <TagSelect value={tag} onChange={setTag} id={`edit-tag-${message.id}`} />

            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'text-[13px]',
                  overLimit ? 'font-bold text-ink' : 'text-muted',
                )}
              >
                {body.length}/{MAX_BODY}
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="press border-2 border-ink bg-surface px-3 py-1.5 font-mono-ui text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                aria-busy={isUpdating}
                className="press inline-flex h-[38px] items-center justify-center border-[3px] border-ink bg-accent px-4 font-mono-ui text-xs font-bold uppercase shadow-hard-3"
              >
                {isUpdating ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {warning && (
            <p role="alert" className="mt-3 text-sm font-medium">
              {warning}
            </p>
          )}
        </form>
      </Card>
    );
  }

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
              onClick={startEditing}
              className="press border-2 border-ink bg-surface px-3 py-1.5 font-mono-ui text-xs font-bold uppercase"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDeleteClick}
              onBlur={() => setConfirmingDelete(false)}
              aria-busy={isDeleting}
              className={cn(
                'press border-2 border-ink px-3 py-1.5 font-mono-ui text-xs font-bold uppercase',
                confirmingDelete ? 'bg-accent' : 'bg-surface',
              )}
            >
              {isDeleting ? 'Deleting…' : confirmingDelete ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
