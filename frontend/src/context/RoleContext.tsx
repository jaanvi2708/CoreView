"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

export type UserRole = 
  | "admin"
  | "production_lead"
  | "packaging_tech"
  | "warehouse_lead"
  | "utilities_eng"
  | "quality_analyst";

export interface RoleInfo {
  id: UserRole;
  userName: string;
  userTitle: string;
  stationCode: string;
  assignedZoneId: string | null; // null means global access across all zones
  assignedZoneName: string;
  badge: string;
  clearanceLevel: number;
  description: string;
  canAcknowledgeAlerts: boolean;
  canDispatchWorkOrders: boolean;
  canApproveAIPrescriptions: boolean;
  canRetrainAIModels: boolean;
  canCalibrateThresholds: boolean;
  canInjectFaults: boolean;
}

export interface AuthAccount {
  username: string;
  passwords: string[];
  role: UserRole;
}

export const AUTH_ACCOUNTS: AuthAccount[] = [
  { username: "admin", passwords: ["admin", "factory123", "password"], role: "admin" },
  { username: "op01", passwords: ["op01", "factory123", "password"], role: "production_lead" },
  { username: "op02", passwords: ["op02", "factory123", "password"], role: "packaging_tech" },
  { username: "op03", passwords: ["op03", "factory123", "password"], role: "warehouse_lead" },
  { username: "eng04", passwords: ["eng04", "factory123", "password"], role: "utilities_eng" },
  { username: "qa05", passwords: ["qa05", "factory123", "password"], role: "quality_analyst" }
];

export const ROLES_DATA: Record<UserRole, RoleInfo> = {
  admin: {
    id: "admin",
    userName: "System Administrator",
    userTitle: "Plant SCADA Administrator",
    stationCode: "[SYS-ADMIN]",
    assignedZoneId: null,
    assignedZoneName: "Global Factory Access (All Zones)",
    badge: "GLOBAL ADMIN",
    clearanceLevel: 4,
    description: "Unrestricted SCADA root authority: All 5 zones, threshold calibration, and emergency dispatch.",
    canAcknowledgeAlerts: true,
    canDispatchWorkOrders: true,
    canApproveAIPrescriptions: true,
    canRetrainAIModels: true,
    canCalibrateThresholds: true,
    canInjectFaults: true
  },
  production_lead: {
    id: "production_lead",
    userName: "Production Specialist [OP-01]",
    userTitle: "Production & Machining Operator",
    stationCode: "[OP-01]",
    assignedZoneId: "production",
    assignedZoneName: "Zone 01: Production & Machining",
    badge: "Z01 PRODUCTION",
    clearanceLevel: 2,
    description: "Authorized for CNC Milling (CNC-01, CNC-02), Hydraulic Press (PRS-01), and Robotic Cell (ROB-01).",
    canAcknowledgeAlerts: true,
    canDispatchWorkOrders: true,
    canApproveAIPrescriptions: true,
    canRetrainAIModels: false,
    canCalibrateThresholds: false,
    canInjectFaults: false
  },
  packaging_tech: {
    id: "packaging_tech",
    userName: "Packaging Operator [OP-02]",
    userTitle: "Packaging & Bottling Operator",
    stationCode: "[OP-02]",
    assignedZoneId: "packaging",
    assignedZoneName: "Zone 02: Packaging & Bottling",
    badge: "Z02 PACKAGING",
    clearanceLevel: 2,
    description: "Authorized for Flow Wrapper (WRP-01), Gantry Palletizer (PLT-01), and Cartoner (CRT-01).",
    canAcknowledgeAlerts: true,
    canDispatchWorkOrders: true,
    canApproveAIPrescriptions: true,
    canRetrainAIModels: false,
    canCalibrateThresholds: false,
    canInjectFaults: false
  },
  warehouse_lead: {
    id: "warehouse_lead",
    userName: "Logistics Tech [OP-03]",
    userTitle: "AS/RS High-Bay Logistics Operator",
    stationCode: "[OP-03]",
    assignedZoneId: "warehouse",
    assignedZoneName: "Zone 03: Warehouse & Logistics",
    badge: "Z03 LOGISTICS",
    clearanceLevel: 2,
    description: "Authorized for Stacker Cranes (ASRS-01, ASRS-02), Conveyor Loop (CNV-01), and AGVs (AGV-01).",
    canAcknowledgeAlerts: true,
    canDispatchWorkOrders: true,
    canApproveAIPrescriptions: true,
    canRetrainAIModels: false,
    canCalibrateThresholds: false,
    canInjectFaults: false
  },
  utilities_eng: {
    id: "utilities_eng",
    userName: "Utilities Engineer [ENG-04]",
    userTitle: "Utilities & Power Plant Engineer",
    stationCode: "[ENG-04]",
    assignedZoneId: "utilities",
    assignedZoneName: "Zone 04: Utilities & Power",
    badge: "Z04 UTILITIES",
    clearanceLevel: 3,
    description: "Authorized for Compressors (CMP-01, CMP-02), Chiller (CHL-01), Boiler (BLR-01), and Substation (TX-01).",
    canAcknowledgeAlerts: true,
    canDispatchWorkOrders: true,
    canApproveAIPrescriptions: true,
    canRetrainAIModels: true,
    canCalibrateThresholds: false,
    canInjectFaults: true
  },
  quality_analyst: {
    id: "quality_analyst",
    userName: "QA Specialist [QA-05]",
    userTitle: "Quality Assurance & Metrology Lead",
    stationCode: "[QA-05]",
    assignedZoneId: "quality",
    assignedZoneName: "Zone 05: Quality Assurance",
    badge: "Z05 QUALITY",
    clearanceLevel: 3,
    description: "Authorized for 4K AI Vision Gantry (VSN-01) and Laser Metrology Micrometer (LSR-01).",
    canAcknowledgeAlerts: true,
    canDispatchWorkOrders: true,
    canApproveAIPrescriptions: true,
    canRetrainAIModels: true,
    canCalibrateThresholds: false,
    canInjectFaults: false
  }
};

interface RoleContextType {
  role: UserRole;
  roleInfo: RoleInfo;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  canAccessZone: (zoneId: string) => boolean;
  hasPermission: (permission: keyof Omit<RoleInfo, "id" | "userName" | "userTitle" | "stationCode" | "assignedZoneId" | "assignedZoneName" | "badge" | "clearanceLevel" | "description">) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRoleState] = useState<UserRole>("admin");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load session from localStorage on initial client mount
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("coreview_auth");
      const savedRole = localStorage.getItem("coreview_role") as UserRole;
      if (savedAuth === "true" && savedRole && ROLES_DATA[savedRole]) {
        setIsAuthenticated(true);
        setRoleState(savedRole);
      } else if (savedAuth === "false") {
        setIsAuthenticated(false);
      } else {
        // Default initialized session
        setIsAuthenticated(true);
        setRoleState("admin");
      }
    } catch {
      setIsAuthenticated(true);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const login = async (username: string, password = ""): Promise<{ success: boolean; error?: string }> => {
    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Check matching account
    const matchedAccount = AUTH_ACCOUNTS.find(
      a => a.username.toLowerCase() === trimmedUser || a.role.toLowerCase() === trimmedUser
    );

    if (!matchedAccount) {
      return { success: false, error: "Invalid Station Username. Try 'admin', 'op01', 'op02', 'eng04', etc." };
    }

    if (trimmedPass && !matchedAccount.passwords.includes(trimmedPass)) {
      return { success: false, error: "Invalid password for this station. Default is 'factory123'." };
    }

    setRoleState(matchedAccount.role);
    setIsAuthenticated(true);

    try {
      localStorage.setItem("coreview_auth", "true");
      localStorage.setItem("coreview_role", matchedAccount.role);
    } catch (e) {
      console.error(e);
    }

    router.push("/");
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem("coreview_auth", "false");
      localStorage.removeItem("coreview_role");
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem("coreview_role", newRole);
    } catch (e) {
      console.error(e);
    }
  };

  const roleInfo = ROLES_DATA[role];

  const canAccessZone = (zoneId: string): boolean => {
    if (!roleInfo.assignedZoneId) return true; // admin has global access
    return roleInfo.assignedZoneId === zoneId;
  };

  const hasPermission = (permission: keyof Omit<RoleInfo, "id" | "userName" | "userTitle" | "stationCode" | "assignedZoneId" | "assignedZoneName" | "badge" | "clearanceLevel" | "description">) => {
    return Boolean(roleInfo[permission]);
  };

  return (
    <RoleContext.Provider value={{ 
      role, 
      roleInfo, 
      isAuthenticated, 
      login, 
      logout, 
      setRole, 
      canAccessZone, 
      hasPermission 
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
