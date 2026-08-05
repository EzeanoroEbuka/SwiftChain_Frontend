export const dynamic = 'force-dynamic';

import { CreateDeliveryForm } from '@/features/deliveries/components/CreateDeliveryForm';
import { CurrencyConverter } from '@/features/deliveries/components/CurrencyConverter';

export default function CreateDeliveryPage() {
  return (
    <div className="space-y-6 py-6">
      <CreateDeliveryForm />
      <CurrencyConverter />
    </div>
  );
}
