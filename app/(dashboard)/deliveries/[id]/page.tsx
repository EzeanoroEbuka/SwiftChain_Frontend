import { CancelShipment } from '@/features/deliveries/components/CancelShipment';

export default function DeliveryDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="p-6">
      <h1
        data-tour="delivery-details-title"
        className="text-2xl font-semibold"
      >
        Delivery Details: {params.id}
      </h1>

      {/* Delivery status and tracking placeholder */}

      <CancelShipment shipmentId={params.id} />
    </div>
  );
}
