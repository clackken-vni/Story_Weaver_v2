export enum WizardStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum WizardStepType {
  CHOOSE_GENRE = 'choose_genre',
  DEFINE_CHARACTERS = 'define_characters',
  SET_PLOT = 'set_plot',
  CONFIGURE_STYLE = 'configure_style',
  GENERATE_STORY = 'generate_story'
}

export class WizardStep {
  constructor(
    public type: WizardStepType,
    public data: Record<string, unknown> = {},
    public completed = false
  ) {}
}

export class Wizard {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    public userId: string,
    public title: string,
    public status: WizardStatus = WizardStatus.DRAFT,
    public steps: WizardStep[] = [],
    public currentStep = 0
  ) {
    this.id = this.generateId();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  private generateId(): string {
    return `wizard-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  addStep(step: WizardStep): void {
    this.steps.push(step);
    this.updatedAt = new Date();
  }

  completeStep(index: number): void {
    if (this.steps[index]) {
      this.steps[index].completed = true;
      this.updatedAt = new Date();
    }
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      status: this.status,
      steps: this.steps,
      currentStep: this.currentStep,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export const NewWizardSchema = {
  parse: (data: unknown) => {
    if (!data || typeof data !== 'object') throw new Error('Invalid data');
    const obj = data as Record<string, unknown>;
    if (!obj.userId || typeof obj.userId !== 'string') throw new Error('userId required');
    if (!obj.title || typeof obj.title !== 'string') throw new Error('title required');
    return { userId: obj.userId, title: obj.title };
  }
};