import axios from "axios";
import { getCurrentUser, getSchoolId } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001";
const CACHE_TTL_MS = 45_000;

let attendanceCache = new Map();
let attendanceInflight = new Map();

function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const ATTENDANCE_STATUSES = [
  { value: "PRESENT", label: "Present", short: "P", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "ABSENT", label: "Absent", short: "A", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "LATE", label: "Late", short: "L", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "HALF_DAY", label: "Half Day", short: "HD", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "LEAVE", label: "Leave", short: "LV", color: "bg-sky-50 text-sky-700 border-sky-200" },
];

const STATUS_META_MAP = Object.fromEntries(
  ATTENDANCE_STATUSES.map((item) => [item.value, item])
);

export function getStatusMeta(status) {
  return (
    STATUS_META_MAP[status] || {
      value: status,
      label: status || "—",
      short: "—",
      color: "bg-slate-50 text-slate-600 border-slate-200",
    }
  );
}

export function clearAttendanceCache() {
  attendanceCache.clear();
  attendanceInflight.clear();
}

async function cachedRequest(key, runner) {
  const cached = attendanceCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  if (attendanceInflight.has(key)) {
    return attendanceInflight.get(key);
  }

  const promise = runner()
    .then((data) => {
      attendanceCache.set(key, { data, at: Date.now() });
      return data;
    })
    .catch((error) => {
      attendanceCache.delete(key);
      throw error;
    })
    .finally(() => {
      attendanceInflight.delete(key);
    });

  attendanceInflight.set(key, promise);
  return promise;
}

export async function getTeachersForAttendance(date = todayISO()) {
  const schoolId = getSchoolId();
  const key = `teachers:${schoolId}:${date}`;

  return cachedRequest(key, async () => {
    const { data } = await axios.post(
      `${API_BASE}/attendance/getTeachersForAttendance`,
      { schoolId, date }
    );

    return {
      date: data?.date,
      totalTeachers: data?.totalTeachers || 0,
      isMarked: Boolean(data?.isMarked),
      summary: data?.summary || {},
      teachers: data?.data || [],
    };
  });
}

export async function getStudentsForAttendance(classId, date = todayISO()) {
  const schoolId = getSchoolId();
  const key = `students:${schoolId}:${classId}:${date}`;

  return cachedRequest(key, async () => {
    const { data } = await axios.post(
      `${API_BASE}/attendance/getStudentsForAttendance`,
      { schoolId, classId, date }
    );

    return {
      date: data?.date,
      totalStudents: data?.totalStudents || 0,
      isMarked: Boolean(data?.isMarked),
      summary: data?.summary || {},
      classInfo: data?.data?.class || null,
      students: data?.data?.students || [],
    };
  });
}

export async function markAttendance({
  type,
  date,
  classId = null,
  records,
  notes = "",
}) {
  const schoolId = getSchoolId();
  const markedBy = getCurrentUser()?._id;

  const { data } = await axios.post(`${API_BASE}/attendance/markAttendance`, {
    schoolId,
    type,
    date,
    classId,
    records,
    markedBy,
    notes,
  });

  clearAttendanceCache();
  return data;
}

export async function bulkUploadAttendance({
  type,
  date,
  classId = null,
  rows,
  notes = "Bulk upload",
}) {
  const schoolId = getSchoolId();
  const markedBy = getCurrentUser()?._id;

  const { data } = await axios.post(
    `${API_BASE}/attendance/bulkUploadAttendance`,
    {
      schoolId,
      type,
      date,
      classId,
      rows,
      markedBy,
      notes,
    }
  );

  clearAttendanceCache();
  return data;
}

export async function getAttendanceSummary({
  type,
  date = todayISO(),
  classId = null,
}) {
  const schoolId = getSchoolId();
  const key = `summary:${schoolId}:${type}:${date}:${classId || ""}`;

  return cachedRequest(key, async () => {
    const { data } = await axios.post(
      `${API_BASE}/attendance/getAttendanceSummary`,
      { schoolId, type, date, classId }
    );

    return {
      date: data?.date,
      type: data?.type,
      isMarked: Boolean(data?.isMarked),
      totalPeople: data?.totalPeople || 0,
      markedCount: data?.markedCount || 0,
      summary: data?.summary || {},
    };
  });
}

export async function getAttendanceLogs({
  type,
  classId = null,
  page = 1,
  limit = 20,
  fromDate = "",
  toDate = "",
} = {}) {
  const schoolId = getSchoolId();
  const { data } = await axios.post(`${API_BASE}/attendance/getAttendanceLogs`, {
    schoolId,
    type,
    classId,
    page,
    limit,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  return {
    totalLogs: data?.totalLogs || 0,
    page: data?.page || page,
    limit: data?.limit || limit,
    logs: data?.data || [],
  };
}

export async function getAttendanceLogDetail(logId) {
  const schoolId = getSchoolId();
  const { data } = await axios.post(
    `${API_BASE}/attendance/getAttendanceLogDetail`,
    { schoolId, logId }
  );

  return {
    log: data?.data?.log || null,
    records: data?.data?.records || [],
  };
}

export { todayISO };

/** Parse simple CSV text into objects using first-row headers. */
export function parseCsv(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "")
  );

  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = (cols[idx] || "").trim();
    });
    return row;
  });
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function normalizeBulkRows(rawRows, type) {
  return rawRows.map((row) => {
    const identifier =
      row.identifier ||
      row.employeeid ||
      row.staffid ||
      row.admissionnumber ||
      row.admissionno ||
      row.rollnumber ||
      row.rollno ||
      row.email ||
      row.id ||
      "";

    return {
      identifier: String(identifier).trim(),
      status: String(row.status || row.attendance || "").trim(),
      remarks: String(row.remarks || row.note || row.notes || "").trim(),
      type,
    };
  });
}
