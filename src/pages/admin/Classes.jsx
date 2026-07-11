import { useEffect, useState } from "react";
import { BookOpen, Plus, Users, X } from "lucide-react";
import { openSnackbar } from "../../common/snackbar/snackbar";
import { addClass, getClassesByStatus } from "../../utils/classesApi";

const EMPTY_FORM = {
  className: "",
  section: "",
};

const inputClass =
  "w-full h-[42px] rounded-lg border border-[#D0D5DD] bg-white px-3 text-[14px] text-[#344054] outline-none focus:border-[#A77A95]";
const labelClass = "block text-[13px] font-semibold text-[#667085] mb-1.5";

function AddClassModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.className.trim() || !formData.section.trim()) {
      return openSnackbar({
        message: "Class name and section are required",
        variant: "warning",
      });
    }

    try {
      setSubmitting(true);
      const created = await addClass({
        className: formData.className,
        section: formData.section,
      });

      openSnackbar({
        message: "Class created successfully",
        variant: "success",
      });

      onCreated?.(
        created || {
          ...formData,
          section: formData.section.trim().toUpperCase(),
          strength: 0,
          status: "ACTIVE",
          _id: crypto.randomUUID(),
        }
      );
      onClose();
    } catch (error) {
      openSnackbar({
        message: error?.response?.data?.message || "Failed to create class",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[520px] h-auto max-h-[90vh] bg-white rounded-t-[14px] sm:rounded-[14px] shadow-2xl overflow-hidden flex flex-col">
        <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAEEE9] text-[#A77A95]">
              <BookOpen size={18} />
            </span>
            <h2 className="text-base sm:text-[18px] font-semibold text-[#111827] truncate">
              Add Class
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FF3040] hover:bg-red-600 text-white flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Class Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleChange}
                placeholder="e.g. Grade 1, Class 10, LKG"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>
                Section <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g. A, B, C"
                maxLength={5}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-[42px] rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 h-[42px] rounded-lg bg-[#A77A95] hover:bg-[#8F6580] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Create Class"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClassCard({ classItem }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5 hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FAEEE9] text-[#A77A95]">
          <BookOpen size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-slate-800 truncate">
              {classItem.className}
            </p>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                classItem.status === "INACTIVE"
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {classItem.status === "INACTIVE" ? "Inactive" : "Active"}
            </span>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            Section{" "}
            <span className="font-semibold text-[#735366]">
              {classItem.section}
            </span>
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Users size={14} />
            <span>{classItem.strength ?? 0} students</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Classes() {
  const [showModal, setShowModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [totalClasses, setTotalClasses] = useState(0);
  const [counts, setCounts] = useState({ ACTIVE: 0, INACTIVE: 0 });
  const [activeStatus, setActiveStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const result = await getClassesByStatus(activeStatus);
        if (cancelled) return;
        setClasses(result.data);
        setTotalClasses(result.totalClasses);
        setCounts(result.counts);
      } catch (error) {
        if (!cancelled) {
          openSnackbar({
            message:
              error?.response?.data?.message || "Failed to load classes",
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

  const handleCreated = (classItem) => {
    if (!classItem) return;

    setTotalClasses((prev) => prev + 1);
    setCounts((prev) => ({
      ...prev,
      ACTIVE: (prev.ACTIVE || 0) + 1,
    }));

    if (activeStatus === "ACTIVE") {
      setClasses((prev) => [classItem, ...prev]);
    }
  };

  const statusLabel = activeStatus === "ACTIVE" ? "active" : "inactive";

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#735366]">
            Classes
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Create and manage classes and sections for your school.
          </p>
          <div className="mt-3 space-y-2.5">
            <p className="text-sm font-semibold text-[#735366]">
              Total classes: {loading ? "…" : totalClasses}
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
          Add Class
        </button>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 py-12">Loading classes...</p>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center border border-slate-100">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAEEE9] text-[#A77A95]">
            <BookOpen size={22} />
          </span>
          <p className="text-slate-700 font-medium">
            No {statusLabel} classes
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {activeStatus === "ACTIVE"
              ? 'Click "Add Class" to create your first one.'
              : "No inactive classes found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 min-[1024px]:grid-cols-3 gap-4">
          {classes.map((classItem) => (
            <ClassCard
              key={classItem._id || `${classItem.className}-${classItem.section}`}
              classItem={classItem}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddClassModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

export default Classes;
