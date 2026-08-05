import React from 'react';
import { useAddressAutocomplete } from '@/hooks/useAddressAutocomplete';

type Props = {
  label?: string;
  placeholder?: string;
  onSelect?: (data: { latitude: number; longitude: number; city?: string | null; postcode?: string | null; place_name: string }) => void;
  hiddenLatName?: string;
  hiddenLngName?: string;
};

export default function AddressAutocomplete({
  label = 'Delivery address',
  placeholder = 'Start typing an address...',
  onSelect,
  hiddenLatName = 'delivery_latitude',
  hiddenLngName = 'delivery_longitude',
}: Props) {
  const { query, setQuery, loading, suggestions, selected, select } = useAddressAutocomplete();

  React.useEffect(() => {
    if (selected && onSelect) {
      onSelect({
        latitude: selected.latitude,
        longitude: selected.longitude,
        city: selected.city,
        postcode: selected.postcode,
        place_name: selected.place_name,
      });
    }
  }, [selected, onSelect]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
      />

      {loading && <div className="text-sm text-gray-500 mt-1">Searching...</div>}

      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border rounded mt-1 max-h-56 overflow-auto">
          {suggestions.map((s) => (
            <li
              key={s.id}
              onClick={() => select(s)}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              <div className="font-medium">{s.place_name}</div>
              <div className="text-xs text-gray-500">{[s.city, s.postcode].filter(Boolean).join(' • ')}</div>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="mt-2 text-sm text-green-700">Selected: {selected.place_name}</div>
      )}

      <input type="hidden" name={hiddenLatName} value={selected?.latitude ?? ''} />
      <input type="hidden" name={hiddenLngName} value={selected?.longitude ?? ''} />
    </div>
  );
}
