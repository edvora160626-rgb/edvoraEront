import axios from "axios";
import { getSchoolId, getUserRole } from "./auth";
import {
  getApiRole,
  getFetchableRoles,
  getViewRoles,
  isFetchableRole,
} from "./rolePermissions";

const API_BASE = "http://localhost:4001";

export const REQUEST_STATUSES = [
  { id: "REQUESTED", label: "Pending" },
  { id: "ACTIVE", label: "Approved" },
  { id: "INACTIVE", label: "Rejected" },
];

let inflightFetches = new Map();

function getFetchKey(schoolId, roles, status, isSuperAdmin = false) {
  const statusKey = status || "ALL";
  if (isSuperAdmin) {
    return `super-admin:${statusKey}:${roles.join(",")}`;
  }
  return `${schoolId || ""}:${statusKey}:${roles.join(",")}`;
}

async function fetchAllSchoolIds() {
  const { data } = await axios.get(`${API_BASE}/auth/getAllSchools`);
  return (data?.data || []).map((school) => school._id);
}

function mergeByRole(results, roles) {
  const byRole = new Map(roles.map((role) => [role, new Map()]));

  for (const { role, users } of results) {
    const userMap = byRole.get(role);
    if (!userMap) continue;

    for (const user of users) {
      userMap.set(user._id, user);
    }
  }

  return roles.map((role) => ({
    role,
    users: Array.from(byRole.get(role)?.values() || []),
  }));
}

function buildGroupedResults(roles, fetchedGroups) {
  const usersByRole = new Map(
    fetchedGroups.map(({ role, users }) => [role, users])
  );

  return roles.map((role) => ({
    role,
    users: usersByRole.get(role) || [],
  }));
}

export async function fetchRequestsByRole(
  role,
  status = "REQUESTED",
  schoolId = getSchoolId()
) {
  if (!isFetchableRole(role)) return [];
  if (!schoolId || !role) return [];

  const apiRole = getApiRole(role);

  const { data } = await axios.post(`${API_BASE}/auth/pendingRequests`, {
    schoolId,
    role: apiRole,
    status,
  });

  return (data?.data || []).map((user) => ({
    ...user,
    role,
  }));
}

async function fetchRolesForSchools(roles, schoolIds, status) {
  const fetchableRoles = getFetchableRoles(roles);
  if (!fetchableRoles.length) {
    return buildGroupedResults(roles, []);
  }

  const results = await Promise.all(
    schoolIds.flatMap((schoolId) =>
      fetchableRoles.map(async (role) => ({
        role,
        users: await fetchRequestsByRole(role, status, schoolId),
      }))
    )
  );

  return buildGroupedResults(roles, mergeByRole(results, fetchableRoles));
}

export async function fetchAllViewableRequests(
  schoolId = getSchoolId(),
  roles = getViewRoles(),
  status = "REQUESTED"
) {
  const isSuperAdmin = getUserRole() === "SUPER_ADMIN";
  const key = getFetchKey(schoolId, roles, status, isSuperAdmin);

  if (inflightFetches.has(key)) {
    return inflightFetches.get(key);
  }

  const promise = (async () => {
    const fetchableRoles = getFetchableRoles(roles);

    if (isSuperAdmin) {
      const schoolIds = await fetchAllSchoolIds();
      if (!schoolIds.length || !fetchableRoles.length) {
        return buildGroupedResults(roles, []);
      }
      return fetchRolesForSchools(roles, schoolIds, status);
    }

    if (!schoolId || !fetchableRoles.length) {
      return buildGroupedResults(roles, []);
    }

    const fetched = await Promise.all(
      fetchableRoles.map(async (role) => ({
        role,
        users: await fetchRequestsByRole(role, status, schoolId),
      }))
    );

    return buildGroupedResults(roles, fetched);
  })().finally(() => {
    inflightFetches.delete(key);
  });

  inflightFetches.set(key, promise);
  return promise;
}

export async function fetchCategoryStatusCounts(roles = getViewRoles()) {
  const statuses = REQUEST_STATUSES.map((item) => item.id);
  const results = await Promise.all(
    statuses.map(async (status) => {
      const groups = await fetchAllViewableRequests(undefined, roles, status);
      return { status, groups };
    })
  );

  const counts = {};

  for (const role of roles) {
    counts[role] = { REQUESTED: 0, ACTIVE: 0, INACTIVE: 0 };
  }

  for (const { status, groups } of results) {
    for (const { role, users } of groups) {
      if (counts[role]) {
        counts[role][status] = users.length;
      }
    }
  }

  return counts;
}

/** @deprecated Use fetchRequestsByRole */
export async function fetchPendingByRole(role, schoolId = getSchoolId()) {
  return fetchRequestsByRole(role, "REQUESTED", schoolId);
}

export async function updateRequestStatus(userId, status, role) {
  await axios.post(`${API_BASE}/auth/acceptOrRejectRequest`, {
    userId,
    status,
    role: getApiRole(role),
  });
}

export function getStatusLabel(status) {
  return (
    REQUEST_STATUSES.find((item) => item.id === status)?.label || status
  );
}
