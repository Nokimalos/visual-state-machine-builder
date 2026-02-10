import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
export interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
  hasStates?: boolean;
}

const steps: Step[] = [
  {
    target: '.app__canvas-wrap',
    content: 'Welcome! This is the canvas. You can drag states and connect them with transitions.',
    disableBeacon: true,
  },
  {
    target: '.template-gallery',
    content: 'Start with a template or create from scratch. Click a template to load it.',
    disableBeacon: true,
  },
  {
    target: '[data-sidebar-states]',
    content: 'Add states and transitions here. Use the sidebar to set the initial state and edit events.',
    disableBeacon: true,
  },
  {
    target: '[data-output-format]',
    content: 'Choose how to export your code: useReducer, XState, Zustand, or TanStack Query.',
    disableBeacon: true,
  },
  {
    target: '[data-tour-export]',
    content: 'Export and use in your code! Copy code, download files, or export as PNG/Mermaid.',
    disableBeacon: true,
  },
];

export function OnboardingTour({ run, onFinish }: OnboardingTourProps) {
  const handleCallback = (data: CallBackProps) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--accent))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
          arrowColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0,0,0,0.6)',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip',
      }}
    />
  );
}
