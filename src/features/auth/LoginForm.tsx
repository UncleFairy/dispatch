'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { LoginInput } from '@/lib/schemas';

/** Only accept same-origin relative paths as the post-login destination. */
function safeNext(next: string | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/feed';
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Reuse the same schema the server enforces for instant client feedback.
    const parsed = LoginInput.safeParse({ email, password });
    if (!parsed.success) {
      setError('Enter a valid email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Login failed.');
        return;
      }
      // Cookie is set; go where the proxy wanted us, and refresh server state.
      router.replace(safeNext(next));
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8" noValidate>
      <div>
        <label
          htmlFor="email"
          className="mb-2 block font-mono-ui text-xs font-bold tracking-wide uppercase"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="ada@dispatch.dev"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-[52px]"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
          required
          autoFocus
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="password"
          className="mb-2 block font-mono-ui text-xs font-bold tracking-wide uppercase"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-[52px]"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
          required
        />
      </div>

      {error && (
        <p
          id="login-error"
          role="alert"
          className="mt-4 border-[2.5px] border-ink bg-surface px-3 py-2 text-sm font-medium"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="mt-8 w-full"
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting ? 'Logging in…' : 'Log in →'}
      </Button>

      <p className="mt-4 font-mono-ui text-xs text-muted">
        Seeded accounts share the password “dispatch”.
      </p>
    </form>
  );
}
