export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function normalizeRole(role = "") {
  if (role === "PRINCIPAL") return "SUPER_ADMIN";
  return role;
}

export function getUserRole() {
  return normalizeRole(getCurrentUser()?.role || "");
}

export function getSchoolId() {
  const schoolId = getCurrentUser()?.schoolId;
  if (!schoolId) return "";
  if (typeof schoolId === "string") return schoolId;
  if (typeof schoolId === "object") {
    return schoolId._id?.toString?.() || schoolId.toString?.() || "";
  }
  return String(schoolId);
}
