"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.fallback) {
        return this.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-white rounded-xl border border-red-200 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-semantic-red flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Application Error Encountered</h2>
          <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
            {this.state.error?.message || "An unexpected rendering error occurred. The system has prevented a full crash."}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
