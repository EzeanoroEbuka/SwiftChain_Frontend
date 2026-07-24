export const dynamic = 'force-dynamic';

import { FaqHelpCenter } from '@/components/support/FaqHelpCenter';

export const metadata = {
  title: 'FAQ & Help Center | SwiftChain',
  description: 'Find answers to common questions about SwiftChain.',
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_40%),linear-gradient(135deg,_#020617_0%,_#0f172a_70%,_#111827_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Support Hub
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            FAQ & Help Center
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Find clear answers about escrows, deliveries, driver onboarding, and secure payments
            on the SwiftChain platform.
          </p>
        </header>

        <FaqHelpCenter />
      </div>
    </main>
  );
}