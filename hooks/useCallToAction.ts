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
import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { z } from 'zod';
import { ctaService } from '@/services/ctaService';
import type { CtaRegistrationResponse } from '@/types/cta';

export const ctaFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type CtaFormValues = z.infer<typeof ctaFormSchema>;

export interface UseCallToActionReturn {
  form: ReturnType<typeof useForm<CtaFormValues>>;
  isSubmitting: boolean;
  isSuccess: boolean;
  responseMessage: string | null;
  error: string | null;
  onSubmit: (values: CtaFormValues) => Promise<void>;
  resetForm: () => void;
}

/**
 * useCallToAction — orchestrates the landing page "Ready to Chain" email
 * signup flow. Validates with Zod, calls ctaService, and manages
 * submission / success / error state.
 *
 * Components consume this hook; they never call ctaService directly.
 */
export function useCallToAction(): UseCallToActionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CtaFormValues>({
    resolver: zodResolver(ctaFormSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });

  // AbortController ref to cancel in-flight requests on unmount
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const onSubmit = useCallback(
    async (values: CtaFormValues) => {
      setIsSubmitting(true);
      setError(null);
      setResponseMessage(null);

      // Abort any previous in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response: CtaRegistrationResponse =
          await ctaService.registerEmail(values, controller.signal);

        setIsSuccess(true);
        setResponseMessage(response.message);
        form.reset();
      } catch (err: unknown) {
        if (axios.isCancel(err)) return;

        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Something went wrong. Please try again.';
        setError(message);
        setIsSuccess(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [form],
  );

  const resetForm = useCallback(() => {
    setIsSuccess(false);
    setResponseMessage(null);
    setError(null);
    form.reset();
  }, [form]);

  return {
    form,
    isSubmitting,
    isSuccess,
    responseMessage,
    error,
    onSubmit,
    resetForm,
  };
}
