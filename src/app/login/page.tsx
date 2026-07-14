import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = { title: 'Log in — DISPATCH' };

/**
 * Login (design 01). A static server-rendered shell — brand panel + headings —
 * with a small client <LoginForm> island for the interactive part. The `next`
 * destination is read from the URL on the server and passed down, so the shell
 * needs no client-side searchParams hook.
 *
 * The frame fills the viewport (full width + height) with the 3px ink border and
 * 8px offset shadow from the reference. A thin 12px surround is the minimum room
 * for the offset shadow to render (a true 0px edge would clip it off-screen);
 * the design's grey canvas is not a prod colour, so the surround is plain white.
 * Layout: desktop = yellow brand column beside the form; mobile = stacked band.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen w-full bg-surface p-3">
      <div className="flex w-full flex-col overflow-hidden border-[3px] border-ink shadow-hard-8 md:flex-row">
        {/* Brand panel */}
        <div className="flex flex-col border-b-[3px] border-ink bg-accent px-7 py-8 md:w-[45%] md:border-r-[3px] md:border-b-0 md:px-14 md:py-14">
          <div className="font-mono-ui text-sm tracking-[0.12em]">◆ DISPATCH</div>
          <div className="md:flex md:flex-1 md:flex-col md:justify-center">
            <h1 className="mt-9 text-[52px] leading-[0.95] font-bold tracking-[-0.03em] md:mt-0 md:text-[88px] md:tracking-[-0.04em]">
              Say it in
              <br />
              240.
            </h1>
            <p className="mt-6 hidden max-w-sm text-[15px] leading-relaxed md:block">
              A short-message board for your team. Post, tag, filter, done.
            </p>
          </div>
        </div>

        {/* Form panel — top-aligned on mobile (no centered white gap), centered on desktop */}
        <div className="flex flex-1 items-start justify-center bg-surface px-7 py-8 md:items-center md:px-8 md:py-10">
          <div className="w-full max-w-[380px]">
            <h2 className="text-[26px] font-bold tracking-[-0.02em] md:text-3xl">
              Log in
            </h2>
            <p className="mt-1.5 text-sm text-muted">Use a seeded account to continue.</p>
            <LoginForm next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}
