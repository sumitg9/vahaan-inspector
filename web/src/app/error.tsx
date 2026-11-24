"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 text-semantic-red border border-red-200 flex items-center justify-center mb-4 shadow-sm">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 tracking-tight">Something went wrong</h1>
      <p className="text-xs text-slate-500 max-w-md mt-1 mb-6">
        {error.message || "An unexpected error occurred while loading this view. You can try refreshing or returning to the dashboard."}
      </p>
      <div className="flex items-center gap-3">
        <Button variant="default" size="sm" onClick={() => reset()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" size="sm">
            <Home className="w-3.5 h-3.5 mr-1.5" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
