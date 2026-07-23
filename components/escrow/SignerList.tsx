'use client';

import { useState } from 'react';
import { Copy, Check, ListX } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface SignerListProps {
  signers: string[];
  requiredSignatures: number;
}

export function SignerList({ signers, requiredSignatures }: SignerListProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (signers.length === 0) {
    if (requiredSignatures <= 0) {
      return null; // Don't show the list if no signers are expected
    }
    return (
      <div className="mt-4 flex flex-col items-center justify-center gap-2 border-t border-gray-100 py-6 text-center text-sm text-gray-500">
        <ListX className="h-8 w-8 text-gray-400" />
        <span>No signatures have been recorded yet.</span>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Signers ({signers.length})
      </h3>
      <ul className="space-y-1 max-h-36 overflow-y-auto pr-2">
        {signers.map((signer, index) => (
          <li
            key={index}
            className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                {index + 1}
              </span>
              <Tooltip content={signer} placement="top">
                <code className="truncate text-xs text-gray-600 cursor-help">
                  {signer.slice(0, 8)}...{signer.slice(-8)}
                </code>
              </Tooltip>
            </div>
            <button
              onClick={() => handleCopy(signer)}
              className="p-1 text-gray-400 transition-colors hover:text-gray-600"
              title="Copy public key"
            >
              {copiedKey === signer ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}