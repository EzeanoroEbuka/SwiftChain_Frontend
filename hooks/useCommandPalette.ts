'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { commandPaletteService, DeliverySummary } from '@/services/commandPaletteService';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  path: string;
  type: 'delivery' | 'static';
}

export function useCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [deliveries, setDeliveries] = useState<DeliverySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hasLoadedDeliveries, setHasLoadedDeliveries] = useState(false);

  const staticItems = useMemo<CommandItem[]>(
    () => [
      {
        id: 'settings',
        title: 'Open settings',
        description: 'Go to app settings',
        path: '/settings',
        type: 'static',
      },
      {
        id: 'faq',
        title: 'Jump to FAQ',
        description: 'Read support and docs',
        path: '/faq',
        type: 'static',
      },
    ],
    [],
  );

  const deliveryItems = useMemo<CommandItem[]>(
    () =>
      deliveries.map((delivery) => ({
        id: delivery.id,
        title: delivery.title,
        description: delivery.status ?? 'Delivery record',
        path: `/deliveries/${delivery.id}`,
        type: 'delivery',
      })),
    [deliveries],
  );

  const filteredItems = useMemo<CommandItem[]>(() => {
    const allItems = [...staticItems, ...deliveryItems];
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return allItems;
    }

    return allItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, staticItems, deliveryItems]);

  const actionItems = useMemo<CommandItem[]>(
    () => filteredItems.filter((item) => item.type === 'static'),
    [filteredItems],
  );

  const deliverySectionItems = useMemo<CommandItem[]>(
    () => filteredItems.filter((item) => item.type === 'delivery'),
    [filteredItems],
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const isCmdK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isCmdK) {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();

    if (hasLoadedDeliveries) {
      return;
    }

    let active = true;

    commandPaletteService
      .fetchDeliveries()
      .then((data) => {
        if (!active) return;
        setLoading(false);
        setError(null);
        setDeliveries(data);
        setHasLoadedDeliveries(true);
      })
      .catch((fetchError) => {
        if (!active) return;
        setLoading(false);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Unable to load deliveries',
        );
      });

    // Show loading only after initiating the request (inside a microtask)
    Promise.resolve().then(() => { if (active) setLoading(true); });

    return () => {
      active = false;
    };
  }, [open, hasLoadedDeliveries]);

  const onSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return {
    open,
    setOpen,
    query,
    setQuery,
    actionItems,
    deliverySectionItems,
    loading,
    error,
    inputRef,
    onSelect,
  };
}
