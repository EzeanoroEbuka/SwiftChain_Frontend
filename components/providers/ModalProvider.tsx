/**
 * ModalProvider Component
 * Global provider that manages modal state and rendering
 * Wraps the app to provide modal context
 */

'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { modalService, ModalConfig } from '@/services/modalService';

interface ModalProviderProps {
  children: React.ReactNode;
}

/**
 * ModalProvider component - manages global modal state
 */
export default function ModalProvider({
  children,
}: ModalProviderProps): React.ReactElement {
  const [mounted, setMounted] = useState(false);
  const [currentModal, setCurrentModal] = useState<ModalConfig | null>(null);

  /**
   * Subscribe to modal state changes on mount
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // Subscribe to modal events
    const unsubscribe = modalService.subscribe((config) => {
      setCurrentModal(config);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Handle modal close
   */
  const handleClose = () => {
    modalService.close();
  };

  /**
   * Handle modal confirm
   */
  const handleConfirm = async () => {
    if (currentModal?.onConfirm) {
      await currentModal.onConfirm();
    }
    // Don't auto-close - let the callback decide
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Modal root element for portals */}
      <div id="modal-root" />

      {/* Render current modal */}
      {currentModal && (
        <Modal
          {...currentModal}
          isOpen={currentModal !== null}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      )}

      {/* Children */}
      {children}
    </>
  );
}
