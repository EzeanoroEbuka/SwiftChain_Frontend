'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { ctaService } from '@/services/ctaService';
import type { CtaResponse } from '@/types/cta';

interface UseCallToActionReturn {
  email: string;
  setEmail: (value: string) => void;
  isSubmitting: boolean;
  error: string | null;
  success: CtaResponse | null;
  isValid: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export function useCallToAction(): UseCallToActionReturn {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CtaResponse | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length > 0;

  const resetForm = useCallback(() => {
    setEmail('');
    setError(null);
    setSuccess(null);
    setIsSubmitting(false);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isValid) {
        setError('Please enter a valid email address.');
        return;
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await ctaService.registerEmail({ email }, controller.signal);
        setSuccess(response);
        setEmail('');
      } catch (err: unknown) {
        if (axios.isCancel(err)) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setError(message);
      } finally {
        setIsSubmitting(false);
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [email, isValid],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    email,
    setEmail,
    isSubmitting,
    error,
    success,
    isValid,
    onSubmit,
    resetForm,
  };
}
