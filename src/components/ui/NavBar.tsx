'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import type { Author } from '@/lib/schemas';

/** Top nav (design 02): brand mark, current user, and log-out — every screen behind auth. */
export function NavBar({ user }: { user: Author }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogOut() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <div className="flex h-[60px] items-center justify-between border-b-[3px] border-ink bg-surface px-[18px] md:h-[72px] md:px-8">
      <span className="font-mono-ui text-lg font-bold tracking-tight md:text-[22px]">
        ◆ DISPATCH
      </span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Avatar
            initial={user.initial}
            size="sm"
            className="h-8 w-8 md:h-[34px] md:w-[34px]"
          />
          <span className="hidden text-sm sm:inline">@{user.handle}</span>
        </div>
        <button
          type="button"
          onClick={onLogOut}
          disabled={loggingOut}
          aria-busy={loggingOut}
          className="press inline-flex h-10 items-center justify-center border-2 border-ink bg-surface px-4 font-mono-ui text-[13px] font-bold tracking-wide uppercase disabled:cursor-not-allowed disabled:opacity-60"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
