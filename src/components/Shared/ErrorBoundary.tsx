import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced to the browser console only — this is a client-side demo app,
    // there is no telemetry/logging backend to report to.
    console.error(`[CyberLab] ${this.props.label ?? 'component'} crashed:`, error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-md border border-alert-red/40 bg-[#05070d] p-4 text-center">
          <AlertTriangle size={22} className="text-alert-red" />
          <p className="text-xs font-semibold text-alert-red">
            {this.props.label ?? 'This panel'} hit an unexpected error.
          </p>
          <p className="max-w-xs text-[10.5px] text-slate-500">{this.state.error.message}</p>
          <button
            onClick={this.reset}
            className="flex items-center gap-1.5 rounded bg-alert-red/15 px-3 py-1.5 text-[11px] font-semibold text-alert-red hover:bg-alert-red/25"
          >
            <RotateCcw size={12} />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
