import type { ReactNode } from 'react';

interface FaqPageShellProps {
  children?: ReactNode;
}

export function FaqPageShell({ children }: FaqPageShellProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Support center
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-300">
            Everything you need to know about secure deliveries, escrow payouts, and onboarding
            on SwiftChain.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 px-4 py-4 text-sm text-slate-300">
          <p className="font-semibold text-white">Need a tailored answer?</p>
          <p className="mt-1">Our support team replies in under 24 hours.</p>
        </div>
      </div>

      <div className="space-y-8">{children}</div>

      <div className="mt-10 rounded-[1.75rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-violet-500/10 p-8 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Bottom CTA
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              Ready to secure your shipments?
            </h3>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Create a trusted delivery flow with escrow, transparent milestones, and instant
              support for every handoff.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/support"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Book a demo
            </a>
            <a
              href="/support"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-5 py-3 font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>SwiftChain keeps every shipment visible, verifiable, and protected.</p>
        <p>© 2026 SwiftChain • Secure logistics for modern commerce</p>
      </div>
    </section>
  );
}
