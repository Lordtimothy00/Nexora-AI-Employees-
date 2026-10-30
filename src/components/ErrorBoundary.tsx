import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this is where you would forward to your error reporter.
    console.error('Nexora UI error', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#100e0d] px-6 text-center">
          <Logo />
          <h1 className="mt-8 font-display text-2xl font-semibold text-white">Something went sideways.</h1>
          <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-[#aab8cc]">
            Your workspace hit an unexpected error. Reloading usually fixes it — nothing you have
            hired or assigned is lost.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Reload the page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
