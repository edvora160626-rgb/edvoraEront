import axios from "axios";
import { getCurrentUser, getSchoolId } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001";
const CACHE_TTL_MS = 60_000;

let classCache = new Map();
let classInflight = new Map();

function cacheKey(schoolId, status) {
  return `${schoolId || ""}:${status || "ACTIVE"}`;
}

export function clearClassesCache() {
  classCache.clear();
  classInflight.clear();
}

export async function addClass({ className, section, classTeacherId }) {
  const schoolId = getSchoolId();
  const createdBy = getCurrentUser()?._id;

  const { data } = await axios.post(`${API_BASE}/class/addClasses`, {
    schoolId,
    className: className.trim(),
    section: section.trim().toUpperCase(),
    classTeacherId: classTeacherId || null,
    createdBy,
  });

  clearClassesCache();
  return data?.data;
}

export async function getClassesByStatus(status = "ACTIVE") {
  const schoolId = getSchoolId();
  const key = cacheKey(schoolId, status);

  const cached = classCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  if (classInflight.has(key)) {
    return classInflight.get(key);
  }

  const promise = (async () => {
    const { data } = await axios.post(
      `${API_BASE}/class/getActiveClassesBySchool`,
      { schoolId, status }
    );

    const result = {
      totalClasses: data?.totalClasses || 0,
      counts: {
        ACTIVE: data?.counts?.ACTIVE || 0,
        INACTIVE: data?.counts?.INACTIVE || 0,
      },
      status: data?.status || status,
      data: data?.data || [],
    };

    classCache.set(key, { data: result, at: Date.now() });
    return result;
  })().finally(() => {
    classInflight.delete(key);
  });

  classInflight.set(key, promise);
  return promise;
}

/** @deprecated Prefer getClassesByStatus("ACTIVE") */
export async function getActiveClasses() {
  return getClassesByStatus("ACTIVE");
}

export async function getClassesCount() {
  const schoolId = getSchoolId();
  const key = cacheKey(schoolId, "COUNT");

  const cached = classCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }
  if (classInflight.has(key)) return classInflight.get(key);

  const promise = (async () => {
    const { data } = await axios.post(
      `${API_BASE}/class/getActiveClassesBySchool`,
      { schoolId, flag: "COUNT" }
    );

    const result = {
      totalClasses: data?.totalClasses || 0,
      counts: {
        ACTIVE: data?.counts?.ACTIVE || 0,
        INACTIVE: data?.counts?.INACTIVE || 0,
      },
    };

    classCache.set(key, { data: result, at: Date.now() });
    return result;
  })().finally(() => {
    classInflight.delete(key);
  });

  classInflight.set(key, promise);
  return promise;
}

export async function getStudentsByClass(classId) {
  const schoolId = getSchoolId();

  if (!classId) {
    throw new Error("Class ID is required.");
  }

  const { data } = await axios.post(`${API_BASE}/class/getStudentsByClass`, {
    classId,
    schoolId,
  });

  return {
    totalStudents: data?.totalStudents || 0,
    classInfo: data?.data?.class || null,
    students: data?.data?.students || [],
  };
}
