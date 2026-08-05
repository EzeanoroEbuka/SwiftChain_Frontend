// @ts-nocheck
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EVENTS, STATUS, type Step } from 'react-joyride';
import { onboardingTourService } from '@/services/onboardingTourService';

export function useOnboardingTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo<Step[]>(
    () => [
      {
        target: '[data-tour="dashboard-title"]',
        content:
          'Welcome to your dashboard. This area gives you a quick overview.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="disconnect-wallet"]',
        content: 'Use this control to safely disconnect your wallet session.',
      },
      {
        target: '[data-tour="theme-toggle"]',
        content: 'Switch between dark and light modes at any time.',
      },
      {
        target: '[data-tour="create-delivery-title"]',
        content: 'Create a new delivery from this section when you are ready.',
      },
    ],
    []
  );

  useEffect(() => {
    const savedState = onboardingTourService.getTourState();

    const [nextRun, nextStep] = (() => {
      if (savedState.completed) return [false, 0] as const;
      const bounded =
        savedState.stepIndex >= 0 && savedState.stepIndex < steps.length
          ? savedState.stepIndex
          : 0;
      return [true, bounded] as const;
    })();

    Promise.resolve().then(() => {
      setRun(nextRun);
      setStepIndex(nextStep);
    });
  }, [steps.length]);

  const completeTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    onboardingTourService.completeTour();
  }, []);

  const skipTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    onboardingTourService.skipTour();
  }, []);

  const onJoyrideEvent = useCallback(
    (event: any) => {
      const { status, type, index, action } = event;

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        completeTour();
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        const nextStepIndex = action === 'prev' ? index - 1 : index + 1;
        const normalizedNextStepIndex =
          nextStepIndex >= 0 && nextStepIndex < steps.length
            ? nextStepIndex
            : 0;

        setStepIndex(normalizedNextStepIndex);
        onboardingTourService.saveTourState({
          completed: false,
          stepIndex: normalizedNextStepIndex,
        });
      }
    },
    [completeTour, steps.length]
  );

  return {
    run,
    stepIndex,
    steps,
    onJoyrideEvent,
    skipTour,
    completeTour,
  };
}
