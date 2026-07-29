'use client';

import { useCallToAction } from '@/hooks/useCallToAction';
import { useEffect, useRef } from 'react';

export function CallToAction() {
  const {
    email,
    setEmail,
    isSubmitting,
    error,
    success,
    isValid,
    onSubmit,
    resetForm,
  } = useCallToAction();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error && inputRef.current) {
      inputRef.current.focus();
    }
  }, [error]);

  // ── Success State ──────────────────────────────────────────────
  if (success) {
    return (
      <section
        aria-label="Early access sign-up"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-6 py-24 text-center shadow-2xl"
      >
        {/* Decorative background orbs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold md:text-4xl">You&rsquo;re on the list!</h2>
          <p className="mt-4 text-lg text-blue-100">
            {success.message || "We'll notify you as soon as SwiftChain launches."}
          </p>

          <button
            onClick={resetForm}
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 hover:scale-[1.03] active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Register another email
          </button>
        </div>
      </section>
    );
  }

  // ── Default / Form State ───────────────────────────────────────
  return (
    <section
      aria-label="Early access sign-up"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-24 text-white shadow-2xl"
    >
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
          Ready to <span className="text-blue-200">Chain</span> Your Logistics?
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-lg text-blue-100">
          Stop settling disputes. Start shipping with confidence. Get early access
          and be the first to experience blockchain-secured deliveries.
        </p>

        {/* ── Trust Indicator ───────────────────────────────────── */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-blue-200">
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75z" clipRule="evenodd" />
            </svg>
            No spam, ever
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Your data is safe
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            2,500+ logistics professionals
          </span>
        </div>

        {/* ── Email Form ────────────────────────────────────────── */}
        <form
          onSubmit={onSubmit}
          noValidate
          className="mx-auto mt-10 flex w-full max-w-lg flex-col gap-4 sm:flex-row"
        >
          <div className="relative flex-1">
            <label htmlFor="cta-email" className="sr-only">
              Email address
            </label>
            <input
              ref={inputRef}
              id="cta-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              aria-invalid={!!error}
              aria-describedby={error ? 'cta-error' : undefined}
              className={`w-full rounded-xl border bg-white/10 px-5 py-4 text-white placeholder-blue-200/60 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${
                error
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-white/20 focus:border-white/40'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-blue-700 shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Submitting…
              </>
            ) : (
              'Get Access'
            )}
          </button>
        </form>

        {/* ── Error Message ─────────────────────────────────────── */}
        {error && (
          <div
            id="cta-error"
            role="alert"
            className="mx-auto mt-4 flex max-w-lg items-start gap-2 rounded-xl bg-red-500/20 px-5 py-3 text-left text-sm text-red-100 backdrop-blur-sm"
          >
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>
    </section>
  );
}
