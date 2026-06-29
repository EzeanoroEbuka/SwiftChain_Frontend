'use client';
import { useLanguage } from '@/hooks/useLanguage';
import { LANGUAGE_LABELS, type Locale } from '@/contexts/LanguageContext';
import { AccordionSection } from './AccordionSection';
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
    <div>
      {/* Language selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <label
          htmlFor="language-select"
          style={{ marginRight: '0.5rem', fontWeight: 600, color: '#374151', alignSelf: 'center' }}
        >
          Language:
        </label>
        <select
          id="language-select"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            padding: '0.375rem 0.75rem',
            fontSize: '0.875rem',
            color: '#111827',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {LANGUAGE_LABELS[l]}
            </option>
          ))}
        </select>
      </div>

      {/* States */}
      {isLoading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          Loading help articles…
        </div>
      )}

      {isError && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          Failed to load FAQ. Please try again later.
        </div>
      )}

      {!isLoading && !isError && categories.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          No FAQ articles available.
        </div>
      )}

      {!isLoading && !isError && categories.length > 0 && (
        <div>
          {categories.map((category) => (
            <AccordionSection key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}