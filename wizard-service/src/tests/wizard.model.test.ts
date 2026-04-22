import { describe, it, expect } from '@jest/globals';
import { Wizard, WizardStatus, WizardStep, WizardStepType, NewWizardSchema } from '../models/wizard.js';

describe('Wizard Model', () => {
  describe('constructor', () => {
    it('should create wizard with default values', () => {
      const wizard = new Wizard('user-123', 'Test Story');

      expect(wizard.userId).toBe('user-123');
      expect(wizard.title).toBe('Test Story');
      expect(wizard.status).toBe(WizardStatus.DRAFT);
      expect(wizard.steps).toEqual([]);
      expect(wizard.currentStep).toBe(0);
    });

    it('should create wizard with id', () => {
      const wizard = new Wizard('user-123', 'Test Story');
      expect(wizard.id).toBeDefined();
      expect(wizard.id.length).toBeGreaterThan(0);
    });
  });

  describe('WizardStatus', () => {
    it('should have correct status values', () => {
      expect(WizardStatus.DRAFT).toBe('draft');
      expect(WizardStatus.IN_PROGRESS).toBe('in_progress');
      expect(WizardStatus.COMPLETED).toBe('completed');
      expect(WizardStatus.ARCHIVED).toBe('archived');
    });
  });

  describe('WizardStep', () => {
    it('should create step with correct structure', () => {
      const step = new WizardStep(WizardStepType.CHOOSE_GENRE, { genre: 'fantasy' });

      expect(step.type).toBe(WizardStepType.CHOOSE_GENRE);
      expect(step.data).toEqual({ genre: 'fantasy' });
      expect(step.completed).toBe(false);
    });
  });

  describe('NewWizardSchema', () => {
    it('should validate required fields', () => {
      const validSchema = NewWizardSchema.parse({
        userId: 'user-123',
        title: 'My Story'
      });

      expect(validSchema.userId).toBe('user-123');
      expect(validSchema.title).toBe('My Story');
    });

    it('should reject missing userId', () => {
      expect(() => {
        NewWizardSchema.parse({ title: 'My Story' });
      }).toThrow();
    });

    it('should reject missing title', () => {
      expect(() => {
        NewWizardSchema.parse({ userId: 'user-123' });
      }).toThrow();
    });

    it('should reject non-object data', () => {
      expect(() => {
        NewWizardSchema.parse('string' as unknown);
      }).toThrow();
      expect(() => {
        NewWizardSchema.parse(123 as unknown);
      }).toThrow();
      expect(() => {
        NewWizardSchema.parse(null);
      }).toThrow();
    });
  });

  describe('addStep', () => {
    it('should add step to wizard', () => {
      const wizard = new Wizard('user-123', 'Test Story');
      const step = new WizardStep(WizardStepType.CHOOSE_GENRE, { genre: 'fantasy' });

      wizard.addStep(step);

      expect(wizard.steps).toHaveLength(1);
      expect(wizard.steps[0]).toBe(step);
    });

    it('should update updatedAt when adding step', () => {
      const wizard = new Wizard('user-123', 'Test Story');
      const originalUpdatedAt = wizard.updatedAt;
      const step = new WizardStep(WizardStepType.CHOOSE_GENRE);

      wizard.addStep(step);

      expect(wizard.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('completeStep', () => {
    it('should mark step as completed', () => {
      const wizard = new Wizard('user-123', 'Test Story');
      wizard.addStep(new WizardStep(WizardStepType.CHOOSE_GENRE));

      wizard.completeStep(0);

      expect(wizard.steps[0].completed).toBe(true);
    });

    it('should update updatedAt when completing step', () => {
      const wizard = new Wizard('user-123', 'Test Story');
      wizard.addStep(new WizardStep(WizardStepType.CHOOSE_GENRE));
      const originalUpdatedAt = wizard.updatedAt;

      wizard.completeStep(0);

      expect(wizard.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should not throw for invalid index', () => {
      const wizard = new Wizard('user-123', 'Test Story');
      wizard.addStep(new WizardStep(WizardStepType.CHOOSE_GENRE));

      expect(() => {
        wizard.completeStep(99);
      }).not.toThrow();
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON structure', () => {
      const wizard = new Wizard('user-123', 'Test Story');
      const json = wizard.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('userId', 'user-123');
      expect(json).toHaveProperty('title', 'Test Story');
      expect(json).toHaveProperty('status', WizardStatus.DRAFT);
      expect(json).toHaveProperty('steps');
      expect(json).toHaveProperty('currentStep', 0);
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });

    it('should include steps in JSON', () => {
      const wizard = new Wizard('user-123', 'Test Story');
      wizard.addStep(new WizardStep(WizardStepType.CHOOSE_GENRE, { genre: 'fantasy' }));
      const json = wizard.toJSON();

      expect(json.steps).toHaveLength(1);
      expect(json.steps[0].type).toBe(WizardStepType.CHOOSE_GENRE);
    });
  });
});