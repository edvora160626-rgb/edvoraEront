import axios from "axios";
import { getCurrentUser, getSchoolId } from "./auth";

const API_BASE = "http://localhost:4001";

export const DEPARTMENT_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export async function createDepartment(payload) {
  const schoolId = getSchoolId();
  const createdBy = getCurrentUser()?._id;

  const { data } = await axios.post(`${API_BASE}/department/createDepartment`, {
    ...payload,
    schoolId,
    createdBy,
  });

  return data?.data;
}
