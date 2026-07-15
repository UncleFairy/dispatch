'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { MAX_BODY, MIN_BODY, type Author, type Tag, TAGS } from '@/lib/schemas';
import { useCreateMessage } from '@/features/messages/useMessageMutations';
import { TagSelect } from '@/features/messages/TagSelect';

/** Post form (design 02): body + tag selector + counter + POST, optimistic. */
export function Composer({ currentUser }: { currentUser: Author }) {
  const [body, setBody] = useState('');
  const [tag, setTag] = useState<Tag>(TAGS[0]);
  const [warning, setWarning] = useState<string | null>(null);
  const { mutate, isPending, isError, error } = useCreateMessage(currentUser);

  const overLimit = body.length > MAX_BODY;

  function onBodyChange(value: string) {
    setBody(value);
    if (warning) setWarning(null);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    const trimmed = body.trim();
    if (trimmed.length < MIN_BODY) {
      setWarning(`Write at least ${MIN_BODY} characters.`);
      return;
    }
    if (trimmed.length > MAX_BODY) {
      setWarning(`Keep it under ${MAX_BODY} characters.`);
      return;
    }

    mutate({ body: trimmed, tag }, { onSuccess: () => setBody('') });
  }

  const message =
    warning ??
    (isError
      ? error instanceof Error
        ? error.message
        : 'Failed to post. Please try again.'
      : null);

  return (
    <Card shadow="none" className="p-3.5 shadow-hard-4 md:p-[18px] md:shadow-hard-6">
      <form onSubmit={onSubmit}>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="What's happening?"
          rows={2}
          aria-label="New message"
          aria-invalid={overLimit || undefined}
          className="w-full resize-none border-none bg-transparent text-[15px] leading-6 outline-none md:text-base"
        />

        <div className="mt-3.5 flex items-center justify-between border-t-2 border-hairline pt-3.5">
          <TagSelect value={tag} onChange={setTag} id="composer-tag" />

          <div className="flex items-center gap-4">
            <span
              className={cn(
                'text-[13px]',
                overLimit ? 'font-bold text-ink' : 'text-muted',
              )}
            >
              {body.length}/{MAX_BODY}
            </span>
            <button
              type="submit"
              aria-busy={isPending}
              className="press inline-flex h-9 items-center justify-center border-[2.5px] border-ink bg-accent px-4 font-mono-ui text-[13px] font-bold uppercase shadow-hard-2 md:h-[42px] md:border-[3px] md:px-[22px] md:text-sm md:shadow-hard-3"
            >
              {isPending ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>

        {message && (
          <p role="alert" className="mt-3 text-sm font-medium">
            {message}
          </p>
        )}
      </form>
    </Card>
  );
}
