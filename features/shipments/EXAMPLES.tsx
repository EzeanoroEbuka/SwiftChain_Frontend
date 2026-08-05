/**
 * Example: Delivery Driver Dashboard Integration
 *
 * This file shows how to integrate the HandoffQR component
 * into a real delivery driver dashboard page.
 */

'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { HandoffQR } from '@/features/shipments/components';
import { useDelivery } from '@/hooks/useDeliveries';
import { useUser } from '@/hooks/useUser';
import { HandoffQRData } from '@/types/shipment';

/**
 * Example 1: Simple QR Display in Delivery Detail Page
 */
export function DeliveryDetailPage() {
  const params = useParams();
  const deliveryId = params?.id as string;
  const { data: delivery, isLoading, error } = useDelivery(deliveryId);

  if (isLoading) return <div className="p-4">Loading delivery...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading delivery</div>;
  if (!delivery) return <div className="p-4">Delivery not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Delivery #{delivery.trackingNumber}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">{delivery.status}</span>
            </div>
            <div>
              <span className="text-gray-600">From:</span>
              <span className="ml-2">{delivery.origin}</span>
            </div>
            <div>
              <span className="text-gray-600">To:</span>
              <span className="ml-2">{delivery.destination}</span>
            </div>
            <div>
              <span className="text-gray-600">Amount:</span>
              <span className="ml-2 font-medium">${delivery.amount}</span>
            </div>
          </div>
        </div>

        {/* Handoff QR Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Package Handoff</h2>
          <HandoffQR 
            deliveryId={deliveryId}
            size={256}
            includeLabel={true}
          />
          <p className="text-xs text-gray-600 mt-4 text-center">
            Show this QR code to the recipient to confirm receipt
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 2: Auto-Generating QR on Delivery Arrival
 */
export function ArrivalNotificationPage() {
  const params = useParams();
  const deliveryId = params?.id as string;
  const { data: user } = useUser();
  const [qrGenerated, setQrGenerated] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">You&apos;ve Arrived!</h1>
          <p className="text-gray-600 mt-2">Package is ready for handoff</p>
        </div>

        {/* Auto-generating QR */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <HandoffQR
            deliveryId={deliveryId}
            driverId={user?.id}
            autoGenerate={true}
            size={220}
            includeLabel={true}
            onQRGenerated={(data: HandoffQRData) => {
              setQrGenerated(true);
              console.log('QR generated:', data);
            }}
            onError={(error: Error) => {
              console.error('QR generation error:', error);
            }}
          />
        </div>

        {qrGenerated && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
            ✅ QR code generated successfully. Ready for handoff!
          </div>
        )}

        <button className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Mark as Delivered
        </button>
      </div>
    </div>
  );
}

/**
 * Example 3: Modal for Quick QR Generation
 */
export function QuickHandoffModal({ deliveryId, onClose }: { deliveryId: string; onClose: () => void }) {
  const [qrData, setQrData] = useState<HandoffQRData | null>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Generate Handoff QR</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 flex justify-center">
          <HandoffQR
            deliveryId={deliveryId}
            size={200}
            includeLabel={false}
            onQRGenerated={(data) => {
              setQrData(data);
              console.log('QR data:', data);
            }}
          />
        </div>

        {qrData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700">
              <strong>Token:</strong> {qrData.token.substring(0, 20)}...
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Expires: {new Date(qrData.expiresAt).toLocaleTimeString()}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Send to Recipient
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 4: Delivery List with Quick QR Access
 */
export function DeliveryListWithQR() {
  const { data: deliveries = [], isLoading } = useDeliveries();
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  if (isLoading) return <div className="p-4">Loading deliveries...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Active Deliveries</h1>

      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <div key={delivery.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{delivery.trackingNumber}</h3>
                <p className="text-sm text-gray-600">
                  {delivery.origin} → {delivery.destination}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                delivery.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {delivery.status}
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedDeliveryId(delivery.id)}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Generate QR
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedDeliveryId && (
        <QuickHandoffModal
          deliveryId={selectedDeliveryId}
          onClose={() => setSelectedDeliveryId(null)}
        />
      )}
    </div>
  );
}

/**
 * Example 5: Using the Hook Directly for Custom UI
 */
import { useHandoffQR, useGenerateHandoffQR, useVerifyHandoffQR } from '@/hooks/useHandoffQR';

export function CustomQRUI({ deliveryId }: { deliveryId: string }) {
  const { data: qrData, isLoading } = useHandoffQR(deliveryId);
  const generateQR = useGenerateHandoffQR();
  const verifyQR = useVerifyHandoffQR();

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="font-bold mb-4">Custom QR Implementation</h3>

      {isLoading && <p>Loading QR...</p>}

      {qrData && (
        <div>
          <p className="mb-2">Token: {qrData.token}</p>
          <p className="text-sm text-gray-600">
            Expires: {new Date(qrData.expiresAt).toLocaleString()}
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => generateQR.mutate(deliveryId)}
          disabled={generateQR.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {generateQR.isPending ? 'Generating...' : 'Generate QR'}
        </button>

        {qrData && (
          <button
            onClick={() => verifyQR.mutate({ deliveryId, token: qrData.token })}
            disabled={verifyQR.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
          >
            {verifyQR.isPending ? 'Verifying...' : 'Verify Handoff'}
          </button>
        )}
      </div>
    </div>
  );
}
