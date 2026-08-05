'use client';

import { useState, useCallback } from 'react';
import { registrationService, RegistrationData } from '@/services/registrationService';
import { useRegistrationStore } from '@/store/registrationStore';
import { useRouter } from 'next/navigation';

interface UseRegistrationReturn {
  handleRoleSelect: (role: 'customer' | 'driver' | 'admin') => void;
  handlePersonalDetailsSubmit: (details: any) => Promise<boolean>;
  handleDriverDetailsSubmit: (details: any) => Promise<boolean>;
  handleFinalSubmit: () => Promise<void>;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

/**
 * useRegistration — Custom hook for handling multi-step registration.
 * Follows the Strict Layered Architecture: Component -> Hook -> Service.
 */
export function useRegistration(): UseRegistrationReturn {
  const router = useRouter();
  const {
    role,
    email,
    password,
    confirmPassword,
    fullName,
    phone,
    businessName,
    businessRegistration,
    licenseNumber,
    licenseExpiry,
    vehicleType,
    vehicleRegistration,
    vehicleModel,
    currentStep,
    setRole,
    setPersonalDetails,
    setDriverDetails,
    nextStep,
    setIsSubmitting,
  } = useRegistrationStore();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRoleSelect = useCallback(
    (selectedRole: 'customer' | 'driver' | 'admin') => {
      setRole(selectedRole);
      setErrors({});
    },
    [setRole]
  );

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback((password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }, []);

  const handleFinalSubmit = useCallback(async () => {
    if (!role) {
      setErrors({ form: 'Please select a role' });
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationData: RegistrationData = {
        role,
        email,
        password,
        fullName,
        phone,
        ...(role === 'driver'
          ? {
              licenseNumber,
              licenseExpiry,
              vehicleType,
              vehicleRegistration,
              vehicleModel,
            }
          : {
              businessName,
              businessRegistration,
            }),
      };

      const response = await registrationService.register(registrationData);

      if (response.success) {
        // Redirect to login page after successful registration
        router.push('/login?registered=true');
      } else {
        setErrors({ form: response.message || 'Registration failed' });
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'An error occurred during registration';
      setErrors({ form: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    role,
    email,
    password,
    fullName,
    phone,
    businessName,
    businessRegistration,
    licenseNumber,
    licenseExpiry,
    vehicleType,
    vehicleRegistration,
    vehicleModel,
    setIsSubmitting,
    router,
  ]);

  const handlePersonalDetailsSubmit = useCallback(
    async (details: any): Promise<boolean> => {
      const newErrors: Record<string, string> = {};

      // Validate required fields
      if (!details.email || details.email.trim() === '') {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(details.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!details.password || details.password.trim() === '') {
        newErrors.password = 'Password is required';
      } else if (!validatePassword(details.password)) {
        newErrors.password =
          'Password must be at least 8 characters with uppercase, lowercase, and number';
      }

      if (!details.confirmPassword || details.confirmPassword.trim() === '') {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (details.password !== details.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!details.fullName || details.fullName.trim() === '') {
        newErrors.fullName = 'Full name is required';
      }

      if (!details.phone || details.phone.trim() === '') {
        newErrors.phone = 'Phone number is required';
      }

      if (role === 'driver') {
        if (!details.licenseNumber || details.licenseNumber.trim() === '') {
          newErrors.licenseNumber = 'License number is required';
        }
      } else if (role !== 'customer') {
        if (!details.businessName || details.businessName.trim() === '') {
          newErrors.businessName = 'Business name is required';
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return false;
      }

      // Update store
      setPersonalDetails(details);
      setErrors({});

      if (role === 'driver') {
        nextStep();
      } else {
        // For non-drivers, submit directly
        await handleFinalSubmit();
      }

      return true;
    },
    [role, validateEmail, validatePassword, setPersonalDetails, nextStep]
  );

  const handleDriverDetailsSubmit = useCallback(
    async (details: any): Promise<boolean> => {
      const newErrors: Record<string, string> = {};

      if (!details.licenseExpiry || details.licenseExpiry.trim() === '') {
        newErrors.licenseExpiry = 'License expiry date is required';
      }

      if (!details.vehicleType || details.vehicleType.trim() === '') {
        newErrors.vehicleType = 'Vehicle type is required';
      }

      if (!details.vehicleRegistration || details.vehicleRegistration.trim() === '') {
        newErrors.vehicleRegistration = 'Vehicle registration is required';
      }

      if (!details.vehicleModel || details.vehicleModel.trim() === '') {
        newErrors.vehicleModel = 'Vehicle model is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return false;
      }

      setDriverDetails(details);
      setErrors({});
      nextStep();
      return true;
    },
    [setDriverDetails, nextStep]
  );

  return {
    handleRoleSelect,
    handlePersonalDetailsSubmit,
    handleDriverDetailsSubmit,
    handleFinalSubmit,
    errors,
    setErrors,
  };
}
