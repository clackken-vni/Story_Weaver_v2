import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WizardProvider, useWizard, STEPS } from '@/components/wizard/WizardProvider';

// Test component to access the wizard context
function TestConsumer() {
  const wizard = useWizard();
  return (
    <div>
      <span data-testid="step">{wizard.step}</span>
      <span data-testid="project-id">{wizard.currentProjectId || 'none'}</span>
      <button onClick={() => wizard.setStep('characters')}>Set Characters</button>
      <button onClick={() => wizard.nextStep()}>Next</button>
      <button onClick={() => wizard.prevStep()}>Prev</button>
      <button onClick={() => wizard.resetWizard()}>Reset</button>
      <button onClick={() => wizard.setCurrentProjectId('test-id')}>Set Project</button>
    </div>
  );
}

describe('WizardProvider', () => {
  it('provides default values', () => {
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );

    expect(screen.getByTestId('step')).toHaveTextContent('settings');
    expect(screen.getByTestId('project-id')).toHaveTextContent('none');
  });

  it('updates step when setStep is called', async () => {
    const user = userEvent.setup();
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );

    await user.click(screen.getByText('Set Characters'));
    expect(screen.getByTestId('step')).toHaveTextContent('characters');
  });

  it('navigates to next step', async () => {
    const user = userEvent.setup();
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );

    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('step')).toHaveTextContent('characters');
  });

  it('navigates to previous step', async () => {
    const user = userEvent.setup();
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );

    // First go to characters
    await user.click(screen.getByText('Set Characters'));
    expect(screen.getByTestId('step')).toHaveTextContent('characters');

    // Then go back
    await user.click(screen.getByText('Prev'));
    expect(screen.getByTestId('step')).toHaveTextContent('settings');
  });

  it('does not go below first step', async () => {
    const user = userEvent.setup();
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );

    await user.click(screen.getByText('Prev'));
    expect(screen.getByTestId('step')).toHaveTextContent('settings');
  });

  it('does not go above last step', async () => {
    const user = userEvent.setup();
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );

    // Navigate to the last step (chapters)
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByText('Next'));
    }
    expect(screen.getByTestId('step')).toHaveTextContent('chapters');

    // Try to go beyond
    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('step')).toHaveTextContent('chapters');
  });

  it('resets wizard state', async () => {
    const user = userEvent.setup();
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );

    // Set a project and navigate
    await user.click(screen.getByText('Set Project'));
    await user.click(screen.getByText('Set Characters'));

    // Reset
    await user.click(screen.getByText('Reset'));

    expect(screen.getByTestId('step')).toHaveTextContent('settings');
    expect(screen.getByTestId('project-id')).toHaveTextContent('none');
  });

  it('throws error when useWizard is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useWizard must be used within WizardProvider'
    );
    consoleError.mockRestore();
  });
});

describe('STEPS constant', () => {
  it('contains all wizard steps in correct order', () => {
    expect(STEPS).toEqual(['settings', 'characters', 'world', 'outline', 'chapters']);
  });
});