import axios from "axios";
import { getSchoolId, getUserRole } from "./auth";
import {
  getApiRole,
  getFetchableRoles,
  getViewRoles,
  isFetchableRole,
} from "./rolePermissions";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const LIST_CACHE_TTL_MS = 30_000; // 30 seconds

export const REQUEST_STATUSES = [
  { id: "REQUESTED", label: "Pending" },
  { id: "ACTIVE", label: "Approved" },
  { id: "INACTIVE", label: "Rejected" },
];


let schoolIdsCache = null;
let schoolIdsPromise = null;
let countsCache = null;
let countsPromise = null;
let listCache = new Map();
let listInflight = new Map();

function normalizeSchoolId(id) {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object") {
    return id._id?.toString?.() || id.toString?.() || "";
  }
  return String(id);
}

async function fetchAllSchoolIds() {
  if (schoolIdsCache) return schoolIdsCache;
  if (schoolIdsPromise) return schoolIdsPromise;

  schoolIdsPromise = axios
    .get(`${API_BASE}/auth/getAllSchools`)
    .then(({ data }) => {
      schoolIdsCache = (data?.data || [])
        .map((school) => normalizeSchoolId(school._id))
        .filter(Boolean);
      return schoolIdsCache;
    })
    .finally(() => {
      schoolIdsPromise = null;
    });

  return schoolIdsPromise;
}

/** Resolve which schoolIds to query for the current user. */
async function resolveSchoolIds() {
  const ownSchoolId = getSchoolId();
  const isSuperAdmin = getUserRole() === "SUPER_ADMIN";

  if (isSuperAdmin) {
    const allIds = await fetchAllSchoolIds();
    if (allIds.length) return allIds;
    return ownSchoolId ? [ownSchoolId] : [];
  }

  return ownSchoolId ? [ownSchoolId] : [];
}

function emptyStatusCounts(roles = getViewRoles()) {
  const counts = {};
  for (const role of roles) {
    counts[role] = { REQUESTED: 0, ACTIVE: 0, INACTIVE: 0 };
  }
  return counts;
}

/**
 * Map API count keys (SCHOOL_ADMIN → OFFICE for Principal UI).
 * Supports both nested { REQUESTED, ACTIVE, INACTIVE } and legacy flat numbers.
 */
function mapApiCountsToUi(apiCounts = {}, roles = getViewRoles()) {
  const counts = emptyStatusCounts(roles);

  for (const role of roles) {
    const apiRole = getApiRole(role);
    const raw = apiCounts[apiRole];

    if (raw && typeof raw === "object") {
      counts[role] = {
        REQUESTED: Number(raw.REQUESTED || 0),
        ACTIVE: Number(raw.ACTIVE || 0),
        INACTIVE: Number(raw.INACTIVE || 0),
      };
    } else {
      counts[role] = {
        REQUESTED: Number(raw || 0),
        ACTIVE: 0,
        INACTIVE: 0,
      };
    }
  }

  return counts;
}

function sumUiCounts(target, source) {
  for (const role of Object.keys(source)) {
    if (!target[role]) {
      target[role] = { REQUESTED: 0, ACTIVE: 0, INACTIVE: 0 };
    }
    target[role].REQUESTED += source[role].REQUESTED || 0;
    target[role].ACTIVE += source[role].ACTIVE || 0;
    target[role].INACTIVE += source[role].INACTIVE || 0;
  }
  return target;
}

async function fetchCountsForSchool(schoolId) {
  if (!schoolId) return {};

  const { data } = await axios.post(`${API_BASE}/auth/pendingRequests`, {
    schoolId,
  });

  return data?.counts || {};
}

/**
 * Initial stage: NO role → API returns per-role status counts.
 * Dedupes concurrent calls. Use refresh=true after approve/reject.
 */
export async function fetchPendingCounts(
  roles = getViewRoles(),
  { refresh = false } = {}
) {
  if (!refresh && countsCache) return countsCache;
  // Share in-flight work even when refresh=true (Strict Mode / double mount)
  if (countsPromise) return countsPromise;

  const viewRoles = roles.length ? roles : getViewRoles();

  countsPromise = (async () => {
    const schoolIds = await resolveSchoolIds();
    if (!schoolIds.length) {
      countsCache = emptyStatusCounts(viewRoles);
      return countsCache;
    }

    const schoolCounts = await Promise.all(
      schoolIds.map((id) => fetchCountsForSchool(id))
    );

    countsCache = schoolCounts.reduce(
      (acc, apiCounts) =>
        sumUiCounts(acc, mapApiCountsToUi(apiCounts, viewRoles)),
      emptyStatusCounts(viewRoles)
    );

    return countsCache;
  })().finally(() => {
    countsPromise = null;
  });

  return countsPromise;
}

export function clearRequestsCache() {
  countsCache = null;
  schoolIdsCache = null;
  listCache.clear();
}

/**
 * Role-based: WITH role (+ status) → API returns user list.
 * Uses short TTL cache + in-flight dedupe.
 */
export async function fetchRequestsByRole(
  role,
  status = "REQUESTED",
  schoolId = getSchoolId()
) {
  if (!isFetchableRole(role)) return [];
  if (!schoolId || !role) return [];

  const apiRole = getApiRole(role);
  const key = `${schoolId}:${apiRole}:${status}`;

  const cached = listCache.get(key);
  if (cached && Date.now() - cached.at < LIST_CACHE_TTL_MS) {
    return cached.data;
  }

  if (listInflight.has(key)) {
    return listInflight.get(key);
  }

  const promise = (async () => {
    const { data } = await axios.post(`${API_BASE}/auth/pendingRequests`, {
      schoolId,
      role: apiRole,
      status,
    });

    const users = (data?.data || []).map((user) => ({
      ...user,
      role,
    }));

    listCache.set(key, { data: users, at: Date.now() });
    return users;
  })().finally(() => {
    listInflight.delete(key);
  });

  listInflight.set(key, promise);
  return promise;
}

/**
 * Fetch users for one UI role across the user's school(s).
 */
export async function fetchRequestsForRole(
  role,
  status = "REQUESTED",
  schoolId = getSchoolId()
) {
  if (!role) return [];

  const isSuperAdmin = getUserRole() === "SUPER_ADMIN";
  const schoolIds = isSuperAdmin
    ? await resolveSchoolIds()
    : schoolId
      ? [schoolId]
      : [];

  if (!schoolIds.length) return [];

  // Single school: one request
  if (schoolIds.length === 1) {
    return fetchRequestsByRole(role, status, schoolIds[0]);
  }

  const aggregateKey = `multi:${schoolIds.join(",")}:${getApiRole(role)}:${status}`;
  const cached = listCache.get(aggregateKey);
  if (cached && Date.now() - cached.at < LIST_CACHE_TTL_MS) {
    return cached.data;
  }
  if (listInflight.has(aggregateKey)) {
    return listInflight.get(aggregateKey);
  }

  const promise = (async () => {
    const results = await Promise.all(
      schoolIds.map((id) => fetchRequestsByRole(role, status, id))
    );

    const byId = new Map();
    for (const users of results) {
      for (const user of users) {
        byId.set(user._id, user);
      }
    }
    const merged = Array.from(byId.values());
    listCache.set(aggregateKey, { data: merged, at: Date.now() });
    return merged;
  })().finally(() => {
    listInflight.delete(aggregateKey);
  });

  listInflight.set(aggregateKey, promise);
  return promise;
}

/**
 * Fetch lists for multiple roles (dashboard recent preview).
 */
export async function fetchAllViewableRequests(
  schoolId = getSchoolId(),
  roles = getViewRoles(),
  status = "REQUESTED"
) {
  const fetchableRoles = getFetchableRoles(roles);
  if (!fetchableRoles.length) {
    return roles.map((role) => ({ role, users: [] }));
  }

  const schoolIds =
    getUserRole() === "SUPER_ADMIN"
      ? await resolveSchoolIds()
      : schoolId
        ? [schoolId]
        : [];

  if (!schoolIds.length) {
    return roles.map((role) => ({ role, users: [] }));
  }

  const byRole = new Map(fetchableRoles.map((role) => [role, new Map()]));

  const results = await Promise.all(
    schoolIds.flatMap((id) =>
      fetchableRoles.map(async (role) => ({
        role,
        users: await fetchRequestsByRole(role, status, id),
      }))
    )
  );

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

export async function fetchCategoryStatusCounts(roles = getViewRoles()) {
  return fetchPendingCounts(roles);
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
  clearRequestsCache();
}

export function getStatusLabel(status) {
  return (
    REQUEST_STATUSES.find((item) => item.id === status)?.label || status
  );
}
