import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-8 bg-background">
          <div className="panel-card p-12 md:p-16 max-w-md w-full text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft mb-6">
              <AlertCircle className="h-8 w-8 text-danger" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-text-muted font-medium mb-2">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <p className="text-xs text-text-soft mb-8">
              Don't worry — your data is safe. Try again or head back.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={this.handleReset} className="rounded-full font-bold px-6">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
              <Button
                variant="ghost"
                className="rounded-full font-bold px-6 text-text-soft"
                onClick={() => {
                  this.handleReset();
                  window.location.href = "/";
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
