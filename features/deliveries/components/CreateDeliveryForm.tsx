'use client';

import { useCreateDelivery } from '@/hooks/useCreateDelivery';

export function CreateDeliveryForm() {
  const { form, isSubmitting, isSuccess, onSubmit } = useCreateDelivery();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  return (
    <section className="rounded-xl border border-secondary/30 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Create a new logistics request
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Fill in pickup, destination, package details, and recipient contact
          information.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Pickup Address</span>
            <input
              {...register('pickupAddress')}
              placeholder="123 Main St, Lagos"
              className={`rounded-lg border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.pickupAddress
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={Boolean(errors.pickupAddress)}
            />
            {errors.pickupAddress && (
              <span className="text-xs text-red-600">
                {errors.pickupAddress.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Destination</span>
            <input
              {...register('destination')}
              placeholder="456 Victoria Island, Lagos"
              className={`rounded-lg border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.destination
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={Boolean(errors.destination)}
            />
            {errors.destination && (
              <span className="text-xs text-red-600">
                {errors.destination.message}
              </span>
            )}
          </label>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Package Size</span>
            <select
              {...register('packageSize')}
              className={`rounded-lg border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.packageSize
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={Boolean(errors.packageSize)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
            {errors.packageSize && (
              <span className="text-xs text-red-600">
                {errors.packageSize.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Description</span>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Describe the package contents and any handling notes"
              className={`rounded-lg border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && (
              <span className="text-xs text-red-600">
                {errors.description.message}
              </span>
            )}
          </label>
        </div>

        <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4">
          <h2 className="text-base font-semibold">Recipient contact details</h2>
          <p className="mt-2 text-sm text-secondary">
            We need recipient details so the driver can complete the delivery.
          </p>

          <div className="mt-4 grid gap-5 lg:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Recipient Name</span>
              <input
                {...register('recipientName')}
                placeholder="John Doe"
                className={`rounded-lg border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.recipientName
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                aria-invalid={Boolean(errors.recipientName)}
              />
              {errors.recipientName && (
                <span className="text-xs text-red-600">
                  {errors.recipientName.message}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Recipient Phone</span>
              <input
                {...register('recipientPhone')}
                type="tel"
                placeholder="+234 801 234 5678"
                className={`rounded-lg border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.recipientPhone
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                aria-invalid={Boolean(errors.recipientPhone)}
              />
              {errors.recipientPhone && (
                <span className="text-xs text-red-600">
                  {errors.recipientPhone.message}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Recipient Email</span>
              <input
                {...register('recipientEmail')}
                type="email"
                placeholder="john@example.com"
                className={`rounded-lg border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.recipientEmail
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                aria-invalid={Boolean(errors.recipientEmail)}
              />
              {errors.recipientEmail && (
                <span className="text-xs text-red-600">
                  {errors.recipientEmail.message}
                </span>
              )}
            </label>
          </div>
        </div>

        {isSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Your delivery request has been submitted successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`w-full rounded-xl px-5 py-3 text-white transition ${
            isSubmitting || !isValid
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting request…' : 'Submit delivery request'}
        </button>
      </form>
    </section>
  );
}
