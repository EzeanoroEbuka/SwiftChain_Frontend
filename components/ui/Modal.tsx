// @ts-nocheck

/**
 * Modal Component
 * Reusable, accessible modal with focus trap, backdrop blur, and animations
 * Uses React Portals for rendering outside DOM tree
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ModalConfig, ModalSize, ModalPosition } from '@/services/modalService';

interface ModalProps extends ModalConfig {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Get size classes based on ModalSize type
 */
function getSizeClasses(size: ModalSize = 'md'): string {
  const sizes: Record<ModalSize, string> = {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-md',
    lg: 'w-full max-w-lg',
    xl: 'w-full max-w-xl',
    full: 'w-[calc(100%-2rem)]',
  };
  return sizes[size];
}

/**
 * Get position classes based on ModalPosition type
 */
function getPositionClasses(position: ModalPosition = 'center'): string {
  const positions: Record<ModalPosition, string> = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-12',
    bottom: 'items-end justify-center pb-12',
  };
  return positions[position];
}

/**
 * Focus Trap utility - manages focus within modal
 */
function useFocusTrap(
  ref: React.RefObject<HTMLDivElement>,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled || !ref.current) return;

    const modal = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement;

    // Get all focusable elements
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleKeyDown);

    // Restore focus on unmount
    return () => {
      modal.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  }, [ref, enabled]);
}

/**
 * Body Scroll Lock utility
 */
function useBodyScrollLock(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Cleanup
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
}

/**
 * Modal Component - main reusable modal
 */
export default function Modal({
  id,
  title,
  content,
  size = 'md',
  position = 'center',
  closeable = true,
  backdrop = true,
  focusTrap: enableFocusTrap = true,
  isOpen,
  onClose,
  onConfirm,
  confirmLabel,
  cancelLabel,
  isLoading,
}: ModalProps): React.ReactPortal | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  // Initialize on mount (for SSR compatibility)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Use focus trap
  useFocusTrap(modalRef, enableFocusTrap && isOpen);

  // Lock body scroll
  useBodyScrollLock(isOpen);

  /**
   * Handle ESC key to close
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && closeable && !isLoading) {
        onClose();
      }
    },
    [closeable, onClose, isLoading]
  );

  /**
   * Handle backdrop click to close
   */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && closeable && !isLoading) {
        onClose();
      }
    },
    [closeable, onClose, isLoading]
  );

  /**
   * Handle confirm action
   */
  const handleConfirm = useCallback(async () => {
    if (onConfirm && !isLoading) {
      try {
        await onConfirm();
      } catch (error) {
        console.error('Modal confirm error:', error);
      }
    }
  }, [onConfirm, isLoading]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key={`modal-backdrop-${id}`}
          className="fixed inset-0 z-50 flex overflow-y-auto"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop with blur */}
          <motion.div
            className={`
              fixed inset-0 bg-black/40 backdrop-blur-sm
              ${!backdrop ? 'hidden' : ''}
            `}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal container */}
          <div
            className={`relative w-full h-full flex ${getPositionClasses(position)} p-4`}
          >
            {/* Modal content */}
            <motion.div
              ref={modalRef}
              key={`modal-content-${id}`}
              className={`
                ${getSizeClasses(size)}
                bg-white dark:bg-slate-900 rounded-xl shadow-2xl
                border border-slate-200 dark:border-slate-800
                max-h-[calc(100vh-3rem)] overflow-y-auto
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                dark:focus:ring-offset-slate-950
              `}
              role="dialog"
              aria-labelledby={`modal-title-${id}`}
              aria-modal="true"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                {title && (
                  <h2
                    id={`modal-title-${id}`}
                    className="text-lg font-semibold text-slate-900 dark:text-white"
                  >
                    {title}
                  </h2>
                )}
                {closeable && !isLoading && (
                  <button
                    onClick={onClose}
                    className="ml-auto inline-flex items-center justify-center rounded-lg p-2
                      hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                      dark:focus:ring-offset-slate-900"
                    aria-label="Close modal"
                  >
                    <X
                      size={20}
                      className="text-slate-600 dark:text-slate-400"
                    />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="px-6 py-6 text-slate-700 dark:text-slate-300">
                {typeof content === 'string' ? (
                  <p className="text-sm leading-relaxed">{content}</p>
                ) : (
                  content
                )}
              </div>

              {/* Footer with actions */}
              {(onConfirm || onClose) && (
                <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-end gap-3">
                  {onClose && (
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                        bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                        hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                        dark:focus:ring-offset-slate-900"
                    >
                      {cancelLabel || 'Cancel'}
                    </button>
                  )}
                  {onConfirm && (
                    <button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg bg-primary text-white
                        hover:bg-primary/90 transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                        dark:focus:ring-offset-slate-900
                        flex items-center gap-2"
                    >
                      {isLoading && (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      )}
                      {confirmLabel || 'Confirm'}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    // Portal target: append to body or modal container
    typeof document !== 'undefined'
      ? document.querySelector('#modal-root') || document.body
      : document.body
  );
}
