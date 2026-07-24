import type { FaqCategory } from '@/services/faqService';
import { Accordion } from './Accordion';

interface AccordionSectionProps {
  category: FaqCategory;
}

/**
 * AccordionSection — renders a single FAQ category heading
 * and its list of Accordion items.
 */
export function AccordionSection({ category }: AccordionSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 sm:p-6">
      <h2 className="mb-4 border-b border-cyan-500/30 pb-3 text-lg font-semibold text-slate-100">
        {category.category}
      </h2>
      <div className="space-y-1">
        {category.items.map((item) => (
          <Accordion key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}