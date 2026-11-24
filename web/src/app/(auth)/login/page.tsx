"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Car, Lock, Mail, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

const DEMO_PERSONAS = [
  {
    role: "Organization Admin",
    name: "Anil Deshmukh",
    email: "admin@speedcheck.in",
    org: "SpeedCheck Valuers",
    badge: "Full Admin",
  },
  {
    role: "Senior Valuer",
    name: "Suresh Sharma",
    email: "valuer.sharma@speedcheck.in",
    org: "SpeedCheck Valuers",
    badge: "Approver",
  },
  {
    role: "Field Inspector",
    name: "Rajesh Kumar",
    email: "inspector.rajesh@speedcheck.in",
    org: "SpeedCheck Valuers",
    badge: "Field Ops",
  },
  {
    role: "Competitor Inspector",
    name: "Vikram More",
    email: "inspector.vikram@apex.in",
    org: "Apex Surveyors",
    badge: "Cross-Tenant Test",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("admin@speedcheck.in");
  const [password, setPassword] = useState("SecretPass@2026");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaStep, setMfaStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handlePersonaSelect = (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword("SecretPass@2026");
    setError(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate authentication call to /api/v1/auth/login
    setTimeout(() => {
      setIsLoading(false);
      if (email === "valuer.sharma@speedcheck.in") {
        // Trigger MFA flow for valuer
        setMfaStep(true);
      } else {
        window.location.href = "/";
      }
    }, 600);
  };

  const handleMfaVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode === "123456" || otpCode.length === 6) {
      window.location.href = "/";
    } else {
      setError("Invalid verification code. Use demo code: 123456");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand text-white shadow-lg mb-4">
          <Car className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Vahan<span className="text-blue-400">Check</span> Enterprise
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Vehicle Intelligence, Ground Inspection & Valuation SaaS Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-8 border border-slate-200">
          {!mfaStep ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Work Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@organization.com"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand text-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-brand hover:text-brand-hover"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand text-slate-900"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-semantic-red flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-brand hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-colors disabled:opacity-50"
              >
                {isLoading ? "Authenticating..." : "Sign in to Enterprise Desk"}
              </button>
            </form>
          ) : (
            // MFA Challenge Drawer
            <form className="space-y-4" onSubmit={handleMfaVerify}>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-brand flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Multi-Factor Authentication</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the 6-digit security code sent to your registered mobile ending in <strong>...765</strong>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-slate-900 font-bold"
                />
                <p className="text-[11px] text-slate-400 text-center mt-1">Demo Code: 123456</p>
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-semantic-red">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-brand text-white font-bold text-sm rounded-lg hover:bg-brand-hover transition-colors"
              >
                Verify & Continue
              </button>
            </form>
          )}

          {/* Persona Switcher for Quick Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Fast Demo Switcher:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handlePersonaSelect(p.email)}
                  className={`p-2 text-left rounded-lg border text-xs transition-colors ${
                    email === p.email
                      ? "border-brand bg-blue-50/50"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50"
                  }`}
                >
                  <div className="font-bold text-slate-800 text-[11px] truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{p.role}</div>
                  <span className="inline-block mt-1 text-[9px] px-1 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                    {p.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Regulatory Notice */}
        <div className="mt-4 text-center text-xs text-slate-500">
          <span>Protected by AES-256 Tenant Encryption & DPDP Act 2023 Compliance.</span>
        </div>
      </div>
    </div>
  );
}
