import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

// Self-hosted by next/font at build time — no external requests at runtime and
// no layout shift. Each call exposes a CSS variable that globals.css maps onto
// --font-sans / --font-mono.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DISPATCH — Message Board',
  description: 'A short-message board for your team. Post, tag, filter, done.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} min-h-full`}
    >
      <body className="flex min-h-screen flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
