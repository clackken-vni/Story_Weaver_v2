import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WizardProvider, useWizard } from '@/components/wizard/WizardProvider';

// Mock API
const mockUpdateProjectStep = jest.fn().mockResolvedValue({});
const mockCreateProject = jest.fn().mockResolvedValue({ id: 'test-id', title: 'Test Story' });

jest.mock('@/lib/api', () => ({
  api: {
    createProject: (...args: unknown[]) => mockCreateProject(...args),
    updateProjectStep: (...args: unknown[]) => mockUpdateProjectStep(...args),
  },
}));

// Test helper component that renders children based on step
const WizardTestHelper = ({ children }: { children?: React.ReactNode }) => {
  const wizard = useWizard();

  return (
    <div>
      <span data-testid="current-step">{wizard.step}</span>
      <span data-testid="project-id">{wizard.currentProjectId || 'none'}</span>
      <div data-testid="step-data">
        {JSON.stringify(wizard.stepData)}
      </div>
      {children}
    </div>
  );
};

// Test the provider without rendering full wizard page
describe('WizardProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('State Management', () => {
    it('provides default wizard state', () => {
      render(
        <WizardProvider>
          <WizardTestHelper />
        </WizardProvider>
      );

      expect(screen.getByTestId('current-step')).toHaveTextContent('settings');
      expect(screen.getByTestId('project-id')).toHaveTextContent('none');
    });

    it('updates step data correctly', async () => {
      const user = userEvent.setup();

      const TestStepUpdater = () => {
        const wizard = useWizard();
        return (
          <div>
            <button onClick={() => wizard.updateStepData('settings', { genre: 'fantasy' })}>
              Update Settings
            </button>
            <button onClick={() => wizard.updateStepData('characters', { characters: [] })}>
              Update Characters
            </button>
          </div>
        );
      };

      render(
        <WizardProvider>
          <WizardTestHelper />
          <TestStepUpdater />
        </WizardProvider>
      );

      await user.click(screen.getByText('Update Settings'));

      const stepData = JSON.parse(screen.getByTestId('step-data').textContent || '{}');
      expect(stepData.settings).toEqual({ genre: 'fantasy' });
    });
  });

  describe('Navigation Functions', () => {
    it('nextStep advances to next step', async () => {
      const user = userEvent.setup();

      const TestNav = () => {
        const wizard = useWizard();
        return (
          <button onClick={wizard.nextStep}>Next Step</button>
        );
      };

      render(
        <WizardProvider>
          <WizardTestHelper />
          <TestNav />
        </WizardProvider>
      );

      expect(screen.getByTestId('current-step')).toHaveTextContent('settings');

      await user.click(screen.getByText('Next Step'));
      expect(screen.getByTestId('current-step')).toHaveTextContent('characters');
    });

    it('prevStep goes to previous step', async () => {
      const user = userEvent.setup();

      const TestNav = () => {
        const wizard = useWizard();
        return (
          <div>
            <button onClick={wizard.nextStep}>Next</button>
            <button onClick={wizard.prevStep}>Prev</button>
          </div>
        );
      };

      render(
        <WizardProvider>
          <WizardTestHelper />
          <TestNav />
        </WizardProvider>
      );

      // Go to characters
      await user.click(screen.getByText('Next'));
      expect(screen.getByTestId('current-step')).toHaveTextContent('characters');

      // Go back
      await user.click(screen.getByText('Prev'));
      expect(screen.getByTestId('current-step')).toHaveTextContent('settings');
    });

    it('prevStep does not go below first step', async () => {
      const user = userEvent.setup();

      const TestNav = () => {
        const wizard = useWizard();
        return <button onClick={wizard.prevStep}>Prev</button>;
      };

      render(
        <WizardProvider>
          <WizardTestHelper />
          <TestNav />
        </WizardProvider>
      );

      expect(screen.getByTestId('current-step')).toHaveTextContent('settings');

      await user.click(screen.getByText('Prev'));

      // Should still be at first step
      expect(screen.getByTestId('current-step')).toHaveTextContent('settings');
    });

    it('nextStep does not go above last step', async () => {
      const user = userEvent.setup();

      const TestNav = () => {
        const wizard = useWizard();
        return <button onClick={wizard.nextStep}>Next</button>;
      };

      render(
        <WizardProvider>
          <WizardTestHelper />
          <TestNav />
        </WizardProvider>
      );

      // Navigate to last step (chapters) - need 4 next clicks
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByText('Next'));
      }

      expect(screen.getByTestId('current-step')).toHaveTextContent('chapters');

      // Try one more
      await user.click(screen.getByText('Next'));
      expect(screen.getByTestId('current-step')).toHaveTextContent('chapters');
    });
  });

  describe('Project ID Management', () => {
    it('sets current project id', async () => {
      const user = userEvent.setup();

      const TestSetter = () => {
        const wizard = useWizard();
        return (
          <button onClick={() => wizard.setCurrentProjectId('proj-123')}>
            Set Project
          </button>
        );
      };

      render(
        <WizardProvider>
          <WizardTestHelper />
          <TestSetter />
        </WizardProvider>
      );

      expect(screen.getByTestId('project-id')).toHaveTextContent('none');

      await user.click(screen.getByText('Set Project'));
      expect(screen.getByTestId('project-id')).toHaveTextContent('proj-123');
    });

    it('can clear project id', async () => {
      const user = userEvent.setup();

      const TestSetter = () => {
        const wizard = useWizard();
        return (
          <div>
            <button onClick={() => wizard.setCurrentProjectId('proj-123')}>
              Set Project
            </button>
            <button onClick={() => wizard.setCurrentProjectId(null)}>
              Clear Project
            </button>
          </div>
        );
      };

      render(
        <WizardProvider>
          <WizardTestHelper />
          <TestSetter />
        </WizardProvider>
      );

      await user.click(screen.getByText('Set Project'));
      expect(screen.getByTestId('project-id')).toHaveTextContent('proj-123');

      await user.click(screen.getByText('Clear Project'));
      expect(screen.getByTestId('project-id')).toHaveTextContent('none');
    });
  });

  describe('Error Handling', () => {
    it('can set error state', async () => {
      const TestError = () => {
        const wizard = useWizard();
        return (
          <div>
            <span data-testid="error">{wizard.error || 'no-error'}</span>
            <button onClick={() => wizard.setError('Something went wrong')}>
              Set Error
            </button>
            <button onClick={() => wizard.setError(null)}>
              Clear Error
            </button>
          </div>
        );
      };

      render(
        <WizardProvider>
          <WizardTestHelper />
          <TestError />
        </WizardProvider>
      );

      expect(screen.getByTestId('error')).toHaveTextContent('no-error');

      await userEvent.click(screen.getByText('Set Error'));
      expect(screen.getByTestId('error')).toHaveTextContent('Something went wrong');

      await userEvent.click(screen.getByText('Clear Error'));
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('can set loading state', async () => {
      const TestLoader = () => {
        const wizard = useWizard();
        return (
          <div>
            <span data-testid="loading">{wizard.isLoading ? 'loading' : 'idle'}</span>
            <button onClick={() => wizard.setIsLoading(true)}>Start Loading</button>
            <button onClick={() => wizard.setIsLoading(false)}>Stop Loading</button>
          </div>
        );
      };

      render(
        <WizardProvider>
          <WizardTestHelper />
          <TestLoader />
        </WizardProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('idle');

      await userEvent.click(screen.getByText('Start Loading'));
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      await userEvent.click(screen.getByText('Stop Loading'));
      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    });
  });

  describe('Reset Wizard', () => {
    it('resets all wizard state to initial values', async () => {
      const user = userEvent.setup();

      const TestResetter = () => {
        const wizard = useWizard();
        return (
          <div>
            <button onClick={() => wizard.setCurrentProjectId('proj-123')}>
              Set Project
            </button>
            <button onClick={wizard.nextStep}>Next</button>
            <button onClick={wizard.resetWizard}>Reset</button>
          </div>
        );
      };

      render(
        <WizardProvider>
          <WizardTestHelper />
          <TestResetter />
        </WizardProvider>
      );

      await user.click(screen.getByText('Set Project'));
      await user.click(screen.getByText('Next'));

      expect(screen.getByTestId('project-id')).toHaveTextContent('proj-123');
      expect(screen.getByTestId('current-step')).toHaveTextContent('characters');

      await user.click(screen.getByText('Reset'));

      expect(screen.getByTestId('project-id')).toHaveTextContent('none');
      expect(screen.getByTestId('current-step')).toHaveTextContent('settings');
    });
  });
});

describe('WizardContext Value Structure', () => {
  it('provides all required context values', () => {
    const TestContextCheck = () => {
      const wizard = useWizard();
      // Verify all properties exist
      const requiredProps = [
        'step',
        'stepData',
        'currentProjectId',
        'currentProject',
        'isLoading',
        'error',
        'setStep',
        'nextStep',
        'prevStep',
        'updateStepData',
        'setCurrentProjectId',
        'setCurrentProject',
        'setIsLoading',
        'setError',
        'resetWizard',
      ];

      const missing = requiredProps.filter(prop => !(prop in wizard));

      if (missing.length > 0) {
        throw new Error(`Missing props: ${missing.join(', ')}`);
      }

      return <span data-testid="all-props">All props present</span>;
    };

    render(
      <WizardProvider>
        <TestContextCheck />
      </WizardProvider>
    );

    expect(screen.getByTestId('all-props')).toHaveTextContent('All props present');
  });
});