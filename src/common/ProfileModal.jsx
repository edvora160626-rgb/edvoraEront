import { useEffect, useState } from "react";
import {
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import CustomSelect from "./CustomSelect";
import EdvoraLoader from "./EdvoraLoader";
import { openSnackbar } from "./snackbar/snackbar";
import { normalizeRole } from "../utils/auth";
import { setCurrentUser } from "../redux/slices/authSlice";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001";

const ROLE_DISPLAY = {
  SUPER_ADMIN: "Principal",
  SCHOOL_ADMIN: "School Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
};

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const inputClass =
  "w-full h-[42px] rounded-lg border border-[#D0D5DD] bg-white px-3 text-[14px] text-[#344054] outline-none focus:border-[#A77A95]";
const labelClass = "block text-[13px] font-semibold text-[#667085] mb-1.5";

function getInitials(firstName = "", lastName = "") {
  const first = String(firstName).trim()[0] || "";
  const last = String(lastName).trim()[0] || "";
  return (first + last).toUpperCase() || "U";
}

function formatDob(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDob(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function InfoRow({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A77A95]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#344054] break-words">
        {value || "—"}
      </p>
    </div>
  );
}

function ProfileModal({ open, onClose }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneCode: "+91",
    gender: "",
    dob: "",
    address: "",
  });

  const role = normalizeRole(user?.role || "");
  const displayRole = ROLE_DISPLAY[role] || role;

  useEffect(() => {
    if (!open || !user) return;

    setEditing(false);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      phoneCode: user.phoneCode || "+91",
      gender: user.gender || "",
      dob: formatDob(user.dob),
      address: user.address || "",
    });
  }, [open, user]);

  if (!open || !user) return null;

  const staffId = user.staffId || user.employeeId;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      return openSnackbar({
        message: "First name, email and phone are required",
        variant: "warning",
      });
    }

    try {
      setSubmitting(true);
      const { data } = await axios.post(`${API_BASE}/auth/updateProfile`, {
        userId: user._id,
        role,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        phoneCode: formData.phoneCode.trim(),
        gender: formData.gender || "",
        dob: formData.dob || "",
        address: formData.address.trim(),
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to update profile");
      }

      dispatch(setCurrentUser(data.data));
      setEditing(false);
      openSnackbar({
        message: "Profile updated successfully",
        variant: "success",
      });
    } catch (error) {
      openSnackbar({
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="relative w-full max-w-[560px] max-h-[90dvh] bg-white rounded-[14px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAEEE9] text-[#A77A95]">
              <UserRound size={18} />
            </span>
            <h2
              id="profile-modal-title"
              className="text-base sm:text-[18px] font-semibold text-[#111827] truncate"
            >
              {editing ? "Edit Profile" : "My Profile"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#F5D69B] to-[#A77A95] text-base font-bold text-white shadow-md">
              {getInitials(
                editing ? formData.firstName : user.firstName,
                editing ? formData.lastName : user.lastName
              )}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[#735366] truncate">
                {editing
                  ? [formData.firstName, formData.lastName]
                      .filter(Boolean)
                      .join(" ") || "—"
                  : fullName || "—"}
              </p>
              <p className="text-sm text-slate-500">{displayRole}</p>
            </div>
          </div>

          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone Code</label>
                <input
                  name="phoneCode"
                  value={formData.phoneCode}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <CustomSelect
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                  value={
                    GENDER_OPTIONS.find((o) => o.value === formData.gender) ||
                    null
                  }
                  onChange={(option) =>
                    setFormData((prev) => ({
                      ...prev,
                      gender: option?.value || "",
                    }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2.5 text-[14px] text-[#344054] outline-none focus:border-[#A77A95] resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-[#FAEEE9]/40 p-4">
                <InfoRow label="First Name" value={user.firstName} />
                <InfoRow label="Last Name" value={user.lastName} />
                <InfoRow label="Role" value={displayRole} />
                <InfoRow label="Status" value={user.status} />
                {staffId ? <InfoRow label="Staff ID" value={staffId} /> : null}
                <InfoRow label="Gender" value={user.gender} />
                <InfoRow label="Date of Birth" value={displayDob(user.dob)} />
              </div>

              <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4">
                <p className="flex items-start gap-2 text-sm text-slate-700">
                  <Mail size={16} className="mt-0.5 shrink-0 text-[#A77A95]" />
                  <span className="break-all">{user.email || "—"}</span>
                </p>
                <p className="flex items-start gap-2 text-sm text-slate-700">
                  <Phone size={16} className="mt-0.5 shrink-0 text-[#A77A95]" />
                  <span>
                    {user.phone
                      ? `${user.phoneCode ? `${user.phoneCode} ` : ""}${user.phone}`
                      : "—"}
                  </span>
                </p>
                <p className="flex items-start gap-2 text-sm text-slate-700">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[#A77A95]" />
                  <span>{user.address || "—"}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={submitting}
                className="px-5 h-[42px] rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="px-6 h-[42px] rounded-lg bg-[#A77A95] hover:bg-[#8F6580] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 h-[42px] rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-6 h-[42px] rounded-lg bg-[#A77A95] hover:bg-[#8F6580] text-white text-sm font-semibold"
              >
                <Pencil size={15} />
                Edit
              </button>
            </>
          )}
        </div>
      </div>
      {submitting && <EdvoraLoader overlay message="Updating profile…" />}
    </div>
  );
}

export default ProfileModal;
