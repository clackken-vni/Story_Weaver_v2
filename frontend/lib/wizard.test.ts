import { describe, it, expect } from '@jest/globals';
import { addStep, completeStep } from '../lib/wizard';

describe('addStep', () => {
  it('should add step to wizard', () => {
    const { createWizard } = require('../lib/wizard');
    const wizard = createWizard('user-123', 'Test');
    const step = { type: 'choose_genre' as const, data: { genre: 'fantasy' }, completed: false };

    const updated = addStep(wizard, step);

    expect(updated.steps).toHaveLength(1);
    expect(updated.steps[0].type).toBe('choose_genre');
  });

  it('should preserve existing steps', () => {
    const { createWizard } = require('../lib/wizard');
    const wizard = createWizard('user-123', 'Test');
    const step1 = { type: 'choose_genre' as const, data: {}, completed: false };
    const step2 = { type: 'define_characters' as const, data: {}, completed: false };

    const after1 = addStep(wizard, step1);
    const after2 = addStep(after1, step2);

    expect(after2.steps).toHaveLength(2);
  });
});

describe('completeStep', () => {
  it('should mark step as completed', () => {
    const { createWizard, addStep } = require('../lib/wizard');
    const wizard = createWizard('user-123', 'Test');
    const step = { type: 'choose_genre' as const, data: {}, completed: false };
    const withStep = addStep(wizard, step);

    const completed = completeStep(withStep, 0);

    expect(completed.steps[0].completed).toBe(true);
    expect(completed.currentStep).toBe(1);
  });

  it('should update currentStep', () => {
    const { createWizard, addStep } = require('../lib/wizard');
    const wizard = createWizard('user-123', 'Test');
    const step = { type: 'choose_genre' as const, data: {}, completed: false };
    const withStep = addStep(wizard, step);

    const completed = completeStep(withStep, 0);

    expect(completed.currentStep).toBe(1);
  });

  it('should handle invalid step index', () => {
    const { createWizard } = require('../lib/wizard');
    const wizard = createWizard('user-123', 'Test');

    const result = completeStep(wizard, 999);

    expect(result.steps).toHaveLength(0);
    expect(result.currentStep).toBe(1000); // stepIndex + 1
  });
});

describe('WizardState immutability', () => {
  it('should not mutate original wizard', () => {
    const { createWizard, updateWizard } = require('../lib/wizard');
    const original = createWizard('user-123', 'Original');
    const originalTitle = original.title;

    updateWizard(original, { title: 'Updated' });

    expect(original.title).toBe(originalTitle);
  });

  it('should not mutate steps array', () => {
    const { createWizard, addStep } = require('../lib/wizard');
    const wizard = createWizard('user-123', 'Test');
    const step = { type: 'choose_genre' as const, data: {}, completed: false };

    const updated = addStep(wizard, step);

    expect(wizard.steps).toHaveLength(0);
    expect(updated.steps).toHaveLength(1);
  });
});