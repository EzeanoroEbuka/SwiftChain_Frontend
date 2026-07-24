'use client';
import { useLanguage } from '@/hooks/useLanguage';
import { LANGUAGE_LABELS, type Locale } from '@/contexts/LanguageContext';
import { AccordionSection } from './AccordionSection';
import { FaqPageShell } from './FaqPageShell';
import { useFaq } from '@/hooks/useFaq';

const LOCALES = Object.keys(LANGUAGE_LABELS) as Locale[];

/**
 * FaqHelpCenter — top-level FAQ component.
 * Consumes useFaq hook, handles loading/error/empty states,
 * and renders categorised AccordionSection components.
 * Includes a language dropdown for Pidgin/Hausa/Yoruba/Igbo/English.
 */
export function FaqHelpCenter() {
  const { locale, setLocale } = useLanguage();
  const { categories, isLoading, isError } = useFaq(locale);

  return (
    <FaqPageShell>
      <div className="flex justify-end">
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
          <label htmlFor="language-select" className="font-medium text-slate-200">
            Language:
          </label>
          <select
            id="language-select"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-medium text-slate-100 outline-none ring-0"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-300">
          Loading help articles…
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-300">
          Failed to load FAQ. Please try again later.
        </div>
      )}

      {!isLoading && !isError && categories.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-300">
          No FAQ articles available.
        </div>
      )}

      {!isLoading && !isError && categories.length > 0 && (
        <div className="space-y-6">
          {categories.map((category) => (
            <AccordionSection key={category.id} category={category} />
          ))}
        </div>
      )}
    </FaqPageShell>
  );
}