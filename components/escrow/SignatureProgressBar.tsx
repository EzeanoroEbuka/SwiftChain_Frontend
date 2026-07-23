'use client';

export function SignatureProgressBar({
  current,
  required,
}: {
  current: number;
  required: number;
}) {
  if (required <= 0) {
    return (
      <p className="mt-2 text-sm text-gray-500">
        Multi-signature not required for this escrow.
      </p>
    );
  }
  const percentage = Math.min((current / required) * 100, 100);
  const isComplete = current >= required;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">Signatures Received</span>
        <span className={`font-medium ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {current} of {required}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-blue-600'}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Signature progress"
        ></div>
      </div>
    </div>
  );
}