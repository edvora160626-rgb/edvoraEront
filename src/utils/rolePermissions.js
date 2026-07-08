import { getUserRole } from "./auth";

export const ROLE_LABELS = {
  SUPER_ADMIN: "Principal",
  SCHOOL_ADMIN: "Admin",
  OFFICE: "Office",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
};

// UI tab roles mapped to backend API roles
const UI_TO_API_ROLE = {
  OFFICE: "SCHOOL_ADMIN",
};

const FETCHABLE_ROLES = new Set([
  "OFFICE",
  "SCHOOL_ADMIN",
  "TEACHER",
  "STUDENT",
  "PARENT",
]);

const ROLE_CONFIG = {
  SUPER_ADMIN: {
    portalTitle: "Principal Portal",
    welcomeTitle: "Principal Dashboard",
    description:
      "Manage office, teacher, parent, and student requests by status.",
    requestDisplayOrder: ["OFFICE", "TEACHER", "STUDENT", "PARENT"],
    viewRoles: ["OFFICE", "TEACHER", "STUDENT", "PARENT"],
    actionRoles: ["OFFICE"],
  },
  SCHOOL_ADMIN: {
    portalTitle: "School Admin Portal",
    welcomeTitle: "School Admin Dashboard",
    description:
      "Approve teacher requests. View parent and student registrations.",
    requestDisplayOrder: ["TEACHER", "STUDENT", "PARENT"],
    viewRoles: ["TEACHER", "STUDENT", "PARENT"],
    actionRoles: ["TEACHER"],
  },
  TEACHER: {
    portalTitle: "Teacher Portal",
    welcomeTitle: "Teacher Dashboard",
    description: "Approve or reject parent and student registration requests.",
    requestDisplayOrder: ["STUDENT", "PARENT"],
    viewRoles: ["STUDENT", "PARENT"],
    actionRoles: ["STUDENT", "PARENT"],
  },
};

export function getRoleConfig(role = getUserRole()) {
  return (
    ROLE_CONFIG[role] || {
      portalTitle: "School Portal",
      welcomeTitle: "Dashboard",
      description: "Pending registration requests.",
      requestDisplayOrder: [],
      viewRoles: [],
      actionRoles: [],
    }
  );
}

export function getApiRole(uiRole) {
  return UI_TO_API_ROLE[uiRole] || uiRole;
}

export function canActOnRole(targetRole, userRole = getUserRole()) {
  const config = getRoleConfig(userRole);
  return config.actionRoles.includes(targetRole);
}

export function getViewRoles(userRole = getUserRole()) {
  return getRoleConfig(userRole).viewRoles;
}

export function getActionRoles(userRole = getUserRole()) {
  return getRoleConfig(userRole).actionRoles;
}

export function getRequestDisplayOrder(userRole = getUserRole()) {
  return getRoleConfig(userRole).requestDisplayOrder;
}

export function isFetchableRole(role) {
  return FETCHABLE_ROLES.has(role);
}

export function getFetchableRoles(roles = getViewRoles()) {
  return roles.filter(isFetchableRole);
}
