import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, X, Hash, Mail, Phone, DoorClosed } from "lucide-react";
import CustomSelect from "../../common/CustomSelect";
import EdvoraLoader from "../../common/EdvoraLoader";
import { openSnackbar } from "../../common/snackbar/snackbar";
import {
  createDepartment,
  DEPARTMENT_STATUSES,
  getDepartmentsByStatus,
} from "../../utils/departmentApi";

const EMPTY_FORM = {
  departmentName: "",
  departmentCode: "",
  description: "",
  email: "",
  phone: "",
  roomNumber: "",
  branch: "",
  color: "#4F46E5",
  displayOrder: "",
  status: "ACTIVE",
};

const inputClass =
  "w-full h-[42px] rounded-lg border border-[#D0D5DD] bg-white px-3 text-[14px] text-[#344054] outline-none focus:border-[#A77A95]";
const labelClass = "block text-[13px] font-semibold text-[#667085] mb-1.5";

function AddDepartmentModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.departmentName.trim() || !formData.departmentCode.trim()) {
      return openSnackbar({
        message: "Department name and code are required",
        variant: "warning",
      });
    }

    try {
      setSubmitting(true);

      const payload = {
        departmentName: formData.departmentName.trim(),
        departmentCode: formData.departmentCode.trim().toUpperCase(),
        description: formData.description.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        roomNumber: formData.roomNumber.trim(),
        branch: formData.branch.trim(),
        color: formData.color,
        displayOrder: Number(formData.displayOrder) || 0,
        status: formData.status,
      };

      const created = await createDepartment(payload);

      openSnackbar({
        message: "Department created successfully",
        variant: "success",
      });

      onCreated?.(created || { ...payload, _id: crypto.randomUUID() });
      onClose();
    } catch (error) {
      openSnackbar({
        message:
          error?.response?.data?.message || "Failed to create department",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-[720px] max-h-[90dvh] bg-white rounded-[14px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAEEE9] text-[#A77A95]">
              <Building2 size={18} />
            </span>
            <h2 className="text-base sm:text-[18px] font-semibold text-[#111827] truncate">
              Add Department
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

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="departmentName"
                value={formData.departmentName}
                onChange={handleChange}
                placeholder="e.g. Mathematics"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Department Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A77A95]"
                />
                <input
                  type="text"
                  name="departmentCode"
                  value={formData.departmentCode}
                  onChange={handleChange}
                  placeholder="e.g. MATH"
                  className={`${inputClass} pl-9 uppercase`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A77A95]"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="department@school.com"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Phone</label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A77A95]"
                />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Room Number</label>
              <div className="relative">
                <DoorClosed
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A77A95]"
                />
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g. B-204"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Branch</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="Branch"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Display Order</label>
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                placeholder="0"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <CustomSelect
                options={DEPARTMENT_STATUSES}
                placeholder="Select status"
                isSearchable={false}
                value={
                  DEPARTMENT_STATUSES.find(
                    (option) => option.value === formData.status
                  ) || null
                }
                onChange={(option) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: option?.value || "ACTIVE",
                  }))
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="h-[42px] w-14 rounded-lg border border-[#D0D5DD] bg-white p-1 cursor-pointer"
                />
                <span className="text-[13px] text-[#667085]">
                  {formData.color}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                rows="3"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Short description of the department"
                className="w-full rounded-lg border border-[#D0D5DD] bg-white p-3 text-[14px] text-[#344054] outline-none resize-none focus:border-[#A77A95]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-[42px] rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 h-[42px] rounded-lg bg-[#A77A95] hover:bg-[#8F6580] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Create Department"}
          </button>
        </div>
      </div>
      {submitting && <EdvoraLoader overlay message="Creating department…" />}
    </div>
  );
}

function DepartmentCard({ department, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl shadow p-4 border border-slate-100 hover:border-[#A77A95]/40 hover:shadow-md transition cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: department.color || "#4F46E5" }}
        >
          <Building2 size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 truncate">
              {department.departmentName}
            </p>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                department.status === "INACTIVE"
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {department.status === "INACTIVE" ? "Inactive" : "Active"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {department.departmentCode}
          </p>
          {department.description ? (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
              {department.description}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function Departments() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [counts, setCounts] = useState({ ACTIVE: 0, INACTIVE: 0 });
  const [activeStatus, setActiveStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const result = await getDepartmentsByStatus(activeStatus);
        if (cancelled) return;
        setDepartments(result.data);
        setTotalDepartments(result.totalDepartments);
        setCounts(result.counts);
      } catch (error) {
        if (!cancelled) {
          openSnackbar({
            message:
              error?.response?.data?.message || "Failed to load departments",
            variant: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeStatus]);

  const handleStatusClick = (status) => {
    if (status === activeStatus) return;
    setActiveStatus(status);
  };

  const handleCreated = (department) => {
    if (!department) return;

    setTotalDepartments((prev) => prev + 1);
    setCounts((prev) => ({
      ...prev,
      ACTIVE: (prev.ACTIVE || 0) + 1,
    }));

    if (activeStatus === "ACTIVE") {
      setDepartments((prev) => [department, ...prev]);
    }
  };

  const statusLabel = activeStatus === "ACTIVE" ? "active" : "inactive";

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#735366]">
            Departments
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Create and manage the departments in your school.
          </p>
          <div className="mt-3 space-y-2.5">
            <p className="text-sm font-semibold text-[#735366]">
              Total departments: {loading ? "…" : totalDepartments}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleStatusClick("ACTIVE")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeStatus === "ACTIVE"
                    ? "bg-green-600 text-white"
                    : "bg-white text-green-700 border border-green-200 hover:border-green-400"
                }`}
              >
                Active
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeStatus === "ACTIVE"
                      ? "bg-white/20 text-white"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {counts.ACTIVE}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleStatusClick("INACTIVE")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeStatus === "INACTIVE"
                    ? "bg-red-600 text-white"
                    : "bg-white text-red-600 border border-red-200 hover:border-red-400"
                }`}
              >
                Inactive
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeStatus === "INACTIVE"
                      ? "bg-white/20 text-white"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {counts.INACTIVE}
                </span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 h-[42px] rounded-lg bg-[#A77A95] hover:bg-[#8F6580] text-white text-sm font-semibold shadow-sm"
        >
          <Plus size={18} />
          Add Department
        </button>
      </div>

      {loading ? (
        <EdvoraLoader message="Loading departments…" />
      ) : departments.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center border border-slate-100">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAEEE9] text-[#A77A95]">
            <Building2 size={22} />
          </span>
          <p className="text-slate-700 font-medium">
            No {statusLabel} departments
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {activeStatus === "ACTIVE"
              ? 'Click "Add Department" to create your first one.'
              : "No inactive departments found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 min-[1024px]:grid-cols-3 gap-4">
          {departments.map((department) => (
            <DepartmentCard
              key={department._id || department.departmentCode}
              department={department}
              onClick={() =>
                navigate(`/admin/departments/${department._id}`)
              }
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddDepartmentModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

export default Departments;
