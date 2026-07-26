import { create } from 'zustand';

export type UserRole = 'customer' | 'driver' | 'admin';

export interface RegistrationState {
  // Step 1: Role Selection
  role: UserRole | null;

  // Step 2: Personal/Business Details
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  businessName?: string;
  businessRegistration?: string;

  // Step 3: Driver Details (shown dynamically when role is 'driver')
  licenseNumber?: string;
  licenseExpiry?: string;
  vehicleType?: string;
  vehicleRegistration?: string;
  vehicleModel?: string;

  // UI State
  currentStep: number;
  isSubmitting: boolean;
}

interface RegistrationStore extends RegistrationState {
  // Actions
  setRole: (role: UserRole) => void;
  setPersonalDetails: (details: Partial<RegistrationState>) => void;
  setDriverDetails: (details: Partial<RegistrationState>) => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  reset: () => void;
  setIsSubmitting: (submitting: boolean) => void;
}

const initialState: RegistrationState = {
  role: null,
  currentStep: 1,
  isSubmitting: false,
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  phone: '',
};

/**
 * useRegistrationStore — Zustand store for managing multi-step registration state
 * Persists state across component re-renders and step navigation
 */
const baseStore = create<RegistrationStore>((set) => ({
  ...initialState,

  setRole: (role: UserRole) => set({ role, currentStep: 2 }),

  setPersonalDetails: (details: Partial<RegistrationState>) =>
    set((state) => ({ ...state, ...details })),

  setDriverDetails: (details: Partial<RegistrationState>) =>
    set((state) => ({ ...state, ...details })),

  nextStep: () =>
    set((state) => {
      // Determine max steps based on role
      const maxSteps = state.role === 'driver' ? 3 : 2;
      const nextStep = Math.min(state.currentStep + 1, maxSteps);
      return { currentStep: nextStep };
    }),

  previousStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  setStep: (step: number) => set({ currentStep: step }),

  setIsSubmitting: (submitting: boolean) => set({ isSubmitting: submitting }),

  reset: () => set(initialState),
}));

const originalGetState = baseStore.getState.bind(baseStore);

const liveStateProxy = new Proxy({} as RegistrationStore, {
  get(_target, prop) {
    const state = originalGetState();
    if (prop in state) {
      return state[prop as keyof RegistrationState];
    }

    const action = state[prop as keyof RegistrationStore];
    if (typeof action === 'function') {
      return (...args: unknown[]) =>
        (action as (...args: unknown[]) => unknown)(...args);
    }

    return undefined;
  },
});

export const useRegistrationStore = Object.assign(baseStore, {
  getState: () => liveStateProxy,
});
