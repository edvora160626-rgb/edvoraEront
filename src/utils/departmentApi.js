import axios from "axios";
import { getCurrentUser, getSchoolId } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const CACHE_TTL_MS = 60_000;

export const DEPARTMENT_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

let deptCache = new Map();
let deptInflight = new Map();

function cacheKey(schoolId, status) {
  return `${schoolId || ""}:${status || "ACTIVE"}`;
}

function emptyResult(status = "ACTIVE") {
  return {
    totalDepartments: 0,
    counts: { ACTIVE: 0, INACTIVE: 0 },
    status,
    data: [],
  };
}

export function clearDepartmentsCache() {
  deptCache.clear();
  deptInflight.clear();
}

export async function createDepartment(payload) {
  const schoolId = getSchoolId();
  const createdBy = getCurrentUser()?._id;

  if (!schoolId) {
    throw new Error("School ID is missing. Please sign in again.");
  }

  const { data } = await axios.post(`${API_BASE}/department/createDepartment`, {
    ...payload,
    schoolId,
    createdBy,
  });

  clearDepartmentsCache();
  return data?.data;
}

export async function getDepartmentsByStatus(status = "ACTIVE") {
  const schoolId = getSchoolId();
  if (!schoolId) {
    return emptyResult(status);
  }

  const key = cacheKey(schoolId, status);

  const cached = deptCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  if (deptInflight.has(key)) {
    return deptInflight.get(key);
  }

  const promise = (async () => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/department/getActiveDepartmentsBySchool`,
        { schoolId, status }
      );

      const result = {
        totalDepartments: data?.totalDepartments || 0,
        counts: {
          ACTIVE: data?.counts?.ACTIVE || 0,
          INACTIVE: data?.counts?.INACTIVE || 0,
        },
        status: data?.status || status,
        data: data?.data || [],
      };

      deptCache.set(key, { data: result, at: Date.now() });
      return result;
    } catch (error) {
      deptCache.delete(key);
      throw error;
    } finally {
      deptInflight.delete(key);
    }
  })();

  deptInflight.set(key, promise);
  return promise;
}

/** @deprecated Prefer getDepartmentsByStatus("ACTIVE") */
export async function getActiveDepartments() {
  return getDepartmentsByStatus("ACTIVE");
}

export async function getDepartmentsCount() {
  const schoolId = getSchoolId();
  if (!schoolId) {
    return emptyResult();
  }

  const key = cacheKey(schoolId, "COUNT");

  const cached = deptCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }
  if (deptInflight.has(key)) return deptInflight.get(key);

  const promise = (async () => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/department/getActiveDepartmentsBySchool`,
        { schoolId, flag: "COUNT" }
      );

      const result = {
        totalDepartments: data?.totalDepartments || 0,
        counts: {
          ACTIVE: data?.counts?.ACTIVE || 0,
          INACTIVE: data?.counts?.INACTIVE || 0,
        },
      };

      deptCache.set(key, { data: result, at: Date.now() });
      return result;
    } catch (error) {
      deptCache.delete(key);
      throw error;
    } finally {
      deptInflight.delete(key);
    }
  })();

  deptInflight.set(key, promise);
  return promise;
}

export async function getTeachersByDepartment(departmentId) {
  const schoolId = getSchoolId();

  if (!departmentId) {
    throw new Error("Department ID is required.");
  }

  const { data } = await axios.post(
    `${API_BASE}/department/getTeachersByDepartment`,
    { departmentId, schoolId }
  );

  return {
    totalStaff: data?.totalStaff || 0,
    department: data?.data?.department || null,
    staff: data?.data?.staff || [],
  };
}

export async function assignStaffToDepartment(departmentId, teacherId) {
  if (!departmentId || !teacherId) {
    throw new Error("Department and staff are required.");
  }

  const { data } = await axios.post(
    `${API_BASE}/department/teachersToDepartment`,
    {
      departmentId,
      teacherId,
    }
  );

  return data;
}
