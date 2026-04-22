export type WizardStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

export type WizardStepType = 'choose_genre' | 'define_characters' | 'set_plot' | 'configure_style' | 'generate_story';

export interface WizardStep {
  type: WizardStepType;
  data: Record<string, unknown>;
  completed: boolean;
}

export interface WizardState {
  id: string;
  userId: string;
  title: string;
  status: WizardStatus;
  steps: WizardStep[];
  currentStep: number;
  createdAt: Date;
  updatedAt: Date;
}

export function createWizard(userId: string, title: string): WizardState {
  return {
    id: `wizard-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    title,
    status: 'draft',
    steps: [],
    currentStep: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function updateWizard(wizard: WizardState, updates: Partial<WizardState>): WizardState {
  return {
    ...wizard,
    ...updates,
    updatedAt: new Date()
  };
}

export function addStep(wizard: WizardState, step: WizardStep): WizardState {
  return {
    ...wizard,
    steps: [...wizard.steps, step],
    updatedAt: new Date()
  };
}

export function completeStep(wizard: WizardState, stepIndex: number): WizardState {
  const newSteps = [...wizard.steps];
  if (newSteps[stepIndex]) {
    newSteps[stepIndex] = { ...newSteps[stepIndex], completed: true };
  }
  return {
    ...wizard,
    steps: newSteps,
    currentStep: stepIndex + 1,
    updatedAt: new Date()
  };
}