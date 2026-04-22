import { Wizard, WizardStep, WizardStepType } from '../models/wizard.js';

export interface WizardRepository {
  save(wizard: Wizard): void;
  findById(id: string): Wizard | undefined;
  findByUserId(userId: string): Wizard[];
  delete(id: string): void;
}

export class WizardService {
  constructor(private repository: WizardRepository) {}

  createWizard(userId: string, title: string): Wizard {
    const wizard = new Wizard(userId, title);
    this.repository.save(wizard);
    return wizard;
  }

  getWizard(id: string): Wizard | undefined {
    return this.repository.findById(id);
  }

  getUserWizards(userId: string): Wizard[] {
    return this.repository.findByUserId(userId);
  }

  updateWizard(id: string, updates: Partial<{ title: string; status: string }>): Wizard | undefined {
    const wizard = this.repository.findById(id);
    if (!wizard) return undefined;

    if (updates.title) wizard.title = updates.title;
    if (updates.status) wizard.status = updates.status as any;
    wizard.updatedAt = new Date();

    this.repository.save(wizard);
    return wizard;
  }

  deleteWizard(id: string): boolean {
    const wizard = this.repository.findById(id);
    if (!wizard) return false;

    this.repository.delete(id);
    return true;
  }

  addStep(wizardId: string, type: WizardStepType, data: Record<string, unknown>): Wizard | undefined {
    const wizard = this.repository.findById(wizardId);
    if (!wizard) return undefined;

    const step = new WizardStep(type, data);
    wizard.steps.push(step);
    wizard.updatedAt = new Date();

    this.repository.save(wizard);
    return wizard;
  }
}