import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Typefully — Write, schedule & grow on 𝕏, LinkedIn, Threads & Bluesky',
  description:
    'The distraction-free social publishing workspace with multi-platform threads, Smart Queue scheduling, Vesper AI, and creator analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-stone-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased selection:bg-orange-500/20 selection:text-orange-600 dark:selection:text-orange-400">
        {children}
      </body>
    </html>
  );
}
