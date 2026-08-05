import React, { useEffect } from 'react';
import { useFederationResolver } from '@/hooks/useFederationResolver';

type Props = {
  label?: string;
  placeholder?: string;
  onResolved?: (accountId: string) => void;
};

export default function FederationInput({ label = 'Federation Address', placeholder = 'name*domain.com', onResolved }: Props) {
  const { value, setValue, loading, result, error } = useFederationResolver();

  useEffect(() => {
    if (result?.account_id && onResolved) onResolved(result.account_id);
  }, [result, onResolved]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 relative">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="mt-2 text-sm">
        {result?.account_id && (
          <div className="text-green-700">Resolved: {result.account_id}</div>
        )}
        {error && <div className="text-red-600">{error}</div>}
      </div>
    </div>
  );
}
