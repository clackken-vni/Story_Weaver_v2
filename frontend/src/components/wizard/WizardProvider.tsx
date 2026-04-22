'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  WizardStep,
  StepData,
  Project,
  SettingsData,
  CharactersData,
  WorldData,
  OutlineData,
  ChaptersData,
} from '@/types';

const STEPS: WizardStep[] = ['settings', 'characters', 'world', 'outline', 'chapters'];

interface WizardContextValue {
  step: WizardStep;
  stepData: StepData;
  currentProjectId: string | null;
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateStepData: <T extends keyof StepData>(step: T, data: StepData[T]) => void;
  setCurrentProjectId: (id: string | null) => void;
  setCurrentProject: (project: Project | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetWizard: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStepState] = useState<WizardStep>('settings');
  const [stepData, setStepData] = useState<StepData>({});
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStepData = useCallback(<T extends keyof StepData>(
    step: T,
    data: StepData[T]
  ) => {
    setStepData(prev => ({
      ...prev,
      [step]: data,
    }));
  }, []);

  const setStep = useCallback((step: WizardStep) => {
    setCurrentStepState(step);
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStepState(STEPS[currentIndex + 1]);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStepState(STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  const resetWizard = useCallback(() => {
    setCurrentStepState('settings');
    setStepData({});
    setCurrentProjectId(null);
    setCurrentProject(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return (
    <WizardContext.Provider
      value={{
        step: currentStep,
        stepData,
        currentProjectId,
        currentProject,
        isLoading,
        error,
        setStep,
        nextStep,
        prevStep,
        updateStepData,
        setCurrentProjectId,
        setCurrentProject,
        setIsLoading,
        setError,
        resetWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}

export { STEPS };
export type { WizardContextValue };