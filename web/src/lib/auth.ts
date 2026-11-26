"use client";

import { useState, useEffect } from "react";

export type UserRole =
  | "SUPER_ADMIN"
  | "ORG_ADMIN"
  | "MANAGER"
  | "VALUER"
  | "INSPECTOR"
  | "CLIENT_VIEWER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  organization: string;
  branch: string;
  initials: string;
  walletCredits?: number;
}

export const PRESET_USERS: Record<string, AuthUser> = {
  superadmin: {
    id: "usr-super-001",
    name: "Vikramaditya Roy",
    email: "root@vahancheck.com",
    role: "SUPER_ADMIN",
    roleTitle: "Platform Super Admin",
    organization: "VahanCheck Systems (Global)",
    branch: "Central Operations",
    initials: "VR",
    walletCredits: 99999,
  },
  admin: {
    id: "usr-admin-001",
    name: "Anil Deshmukh",
    email: "admin@speedcheck.in",
    role: "ORG_ADMIN",
    roleTitle: "Organization Admin",
    organization: "SpeedCheck Valuers",
    branch: "Pune Main Branch",
    initials: "AD",
    walletCredits: 950,
  },
  manager: {
    id: "usr-mgr-001",
    name: "Pooja Patil",
    email: "manager.patil@speedcheck.in",
    role: "MANAGER",
    roleTitle: "Operations Manager (QC)",
    organization: "SpeedCheck Valuers",
    branch: "Pune Main Branch",
    initials: "PP",
    walletCredits: 950,
  },
  valuer: {
    id: "usr-val-001",
    name: "Suresh Sharma",
    email: "valuer.sharma@speedcheck.in",
    role: "VALUER",
    roleTitle: "Senior Valuer (HDFC Desk)",
    organization: "SpeedCheck Valuers",
    branch: "Pune Main Branch",
    initials: "SS",
    walletCredits: 950,
  },
  inspector: {
    id: "usr-insp-001",
    name: "Rajesh Kumar",
    email: "inspector.rajesh@speedcheck.in",
    role: "INSPECTOR",
    roleTitle: "Field Surveyor",
    organization: "SpeedCheck Valuers",
    branch: "Pune Hub (West)",
    initials: "RK",
    walletCredits: 950,
  },
  client: {
    id: "usr-cli-001",
    name: "Meera Nair",
    email: "viewer.hdfc@bank.com",
    role: "CLIENT_VIEWER",
    roleTitle: "HDFC Auto Loan Underwriter",
    organization: "HDFC Bank Ltd",
    branch: "Auto Loan Operations",
    initials: "MN",
    walletCredits: 0,
  },
};

export const ROLE_ROUTE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    "/",
    "/vehicles",
    "/challans",
    "/inspections",
    "/valuation",
    "/fleet",
    "/clients",
    "/billing",
    "/audit",
    "/settings/branches",
    "/admin",
    "/admin/organizations",
    "/admin/users",
    "/admin/providers",
    "/admin/feature-flags",
    "/admin/report-settings",
  ],
  ORG_ADMIN: [
    "/",
    "/vehicles",
    "/challans",
    "/inspections",
    "/valuation",
    "/fleet",
    "/clients",
    "/billing",
    "/audit",
    "/settings/branches",
  ],
  MANAGER: [
    "/",
    "/vehicles",
    "/challans",
    "/inspections",
    "/fleet",
    "/clients",
    "/billing",
    "/settings/branches",
  ],
  VALUER: [
    "/",
    "/vehicles",
    "/challans",
    "/inspections",
    "/valuation",
    "/fleet",
    "/settings/branches",
  ],
  INSPECTOR: [
    "/",
    "/vehicles",
    "/challans",
    "/inspections",
  ],
  CLIENT_VIEWER: [
    "/",
    "/inspections",
  ],
};

const STORAGE_KEY = "vahan_user";
const AUTH_EVENT = "vahan-auth-change";

export function getInitialUser(): AuthUser {
  if (typeof window === "undefined") {
    return PRESET_USERS.admin;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }
  return PRESET_USERS.admin;
}

export function setActiveUser(user: AuthUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser>(getInitialUser);

  useEffect(() => {
    setUser(getInitialUser());

    const handleAuthChange = () => {
      setUser(getInitialUser());
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const switchRole = (roleKey: keyof typeof PRESET_USERS) => {
    const target = PRESET_USERS[roleKey];
    if (target) {
      setActiveUser(target);
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("vahan_auth_token");
      sessionStorage.clear();
      window.location.href = "/login";
    }
  };

  return { user, switchRole, logout };
}
