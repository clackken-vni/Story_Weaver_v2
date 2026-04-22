import { describe, it, expect, beforeEach } from '@jest/globals';
import { WizardService } from '../services/wizardService.js';
import { Wizard, WizardStatus, WizardStepType } from '../models/wizard.js';

class MockWizardStore {
  wizards: Map<string, Wizard> = new Map();

  save(wizard: Wizard): void {
    this.wizards.set(wizard.id, wizard);
  }

  findById(id: string): Wizard | undefined {
    return this.wizards.get(id);
  }

  findByUserId(userId: string): Wizard[] {
    return Array.from(this.wizards.values()).filter(w => w.userId === userId);
  }

  delete(id: string): void {
    this.wizards.delete(id);
  }
}

describe('WizardService', () => {
  let service: WizardService;
  let store: MockWizardStore;

  beforeEach(() => {
    store = new MockWizardStore();
    service = new WizardService(store as any);
  });

  describe('createWizard', () => {
    it('should create a new wizard', () => {
      const wizard = service.createWizard('user-123', 'My Story');

      expect(wizard.userId).toBe('user-123');
      expect(wizard.title).toBe('My Story');
      expect(wizard.status).toBe(WizardStatus.DRAFT);
      expect(wizard.id).toBeDefined();
    });

    it('should store wizard in repository', () => {
      const wizard = service.createWizard('user-123', 'My Story');
      const found = store.findById(wizard.id);

      expect(found).toBeDefined();
      expect(found?.title).toBe('My Story');
    });
  });

  describe('getWizard', () => {
    it('should return wizard by id', () => {
      const created = service.createWizard('user-123', 'My Story');
      const found = service.getWizard(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return undefined for non-existent wizard', () => {
      const found = service.getWizard('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('getUserWizards', () => {
    it('should return all wizards for user', () => {
      service.createWizard('user-123', 'Story 1');
      service.createWizard('user-123', 'Story 2');

      const wizards = service.getUserWizards('user-123');

      expect(wizards).toHaveLength(2);
    });

    it('should return empty array for user with no wizards', () => {
      const wizards = service.getUserWizards('user-with-no-wizards');

      expect(wizards).toHaveLength(0);
    });
  });

  describe('updateWizard', () => {
    it('should update wizard title', () => {
      const wizard = service.createWizard('user-123', 'Original Title');

      const updated = service.updateWizard(wizard.id, { title: 'New Title' });

      expect(updated?.title).toBe('New Title');
    });

    it('should update wizard status', () => {
      const wizard = service.createWizard('user-123', 'My Story');

      const updated = service.updateWizard(wizard.id, { status: WizardStatus.IN_PROGRESS });

      expect(updated?.status).toBe(WizardStatus.IN_PROGRESS);
    });

    it('should return undefined for non-existent wizard', () => {
      const updated = service.updateWizard('non-existent-id', { title: 'New' });

      expect(updated).toBeUndefined();
    });
  });

  describe('deleteWizard', () => {
    it('should delete wizard', () => {
      const wizard = service.createWizard('user-123', 'My Story');

      const result = service.deleteWizard(wizard.id);

      expect(result).toBe(true);
      expect(store.findById(wizard.id)).toBeUndefined();
    });

    it('should return false for non-existent wizard', () => {
      const result = service.deleteWizard('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('addStep', () => {
    it('should add step to wizard', () => {
      const wizard = service.createWizard('user-123', 'My Story');

      const updated = service.addStep(wizard.id, WizardStepType.CHOOSE_GENRE, { genre: 'fantasy' });

      expect(updated?.steps).toHaveLength(1);
      expect(updated?.steps[0].type).toBe(WizardStepType.CHOOSE_GENRE);
    });
  });
});