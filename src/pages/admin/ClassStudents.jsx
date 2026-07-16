import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Mail,
  Phone,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import CustomSelect from "../../common/CustomSelect";
import EdvoraLoader from "../../common/EdvoraLoader";
import { openSnackbar } from "../../common/snackbar/snackbar";
import {
  assignStaffToClass,
  getActiveStaffBySchool,
  getStudentsByClass,
} from "../../utils/classesApi";

const labelClass = "block text-[13px] font-semibold text-[#667085] mb-1.5";

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-green-50 text-green-700",
    INACTIVE: "bg-red-50 text-red-600",
    REQUESTED: "bg-[#FAEEE9] text-[#735366]",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "—"}
    </span>
  );
}

function staffOptionLabel(member) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ");
  const id = member.staffId;
  return id ? `${name}(${id})` : name;
}

function StudentCard({ student }) {
  const fullName = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="bg-white rounded-xl shadow p-4 border border-slate-100">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FAEEE9] text-[#A77A95]">
          <UserRound size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-800 truncate">{fullName}</p>
            <StatusBadge status={student.status} />
          </div>
          {student.admissionNumber ? (
            <p className="text-xs text-slate-500 mt-0.5">
              Admission: {student.admissionNumber}
            </p>
          ) : null}
          <div className="mt-3 space-y-1.5">
            {student.rollNumber ? (
              <p className="text-sm text-slate-600">
                Roll No: {student.rollNumber}
              </p>
            ) : null}
            {student.email ? (
              <p className="flex items-center gap-2 text-sm text-slate-600 truncate">
                <Mail size={14} className="shrink-0 text-[#A77A95]" />
                {student.email}
              </p>
            ) : null}
            {student.phone ? (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={14} className="shrink-0 text-[#A77A95]" />
                {student.phoneCode ? `${student.phoneCode} ` : ""}
                {student.phone}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentTable({ students }) {
  return (
    <div className="w-full min-w-0 max-w-full rounded-xl border border-slate-100 bg-white shadow">
      <div className="table-scroll w-full max-w-full">
        <table className="w-full min-w-[960px] border-collapse">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 sm:p-4 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">
                Name
              </th>
              <th className="p-3 sm:p-4 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">
                Admission No
              </th>
              <th className="p-3 sm:p-4 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">
                Roll No
              </th>
              <th className="p-3 sm:p-4 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">
                Email
              </th>
              <th className="p-3 sm:p-4 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">
                Phone
              </th>
              <th className="p-3 sm:p-4 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const fullName = [student.firstName, student.lastName]
                .filter(Boolean)
                .join(" ");
              const phone = student.phone
                ? `${student.phoneCode ? `${student.phoneCode} ` : ""}${student.phone}`
                : "—";

              return (
                <tr key={student._id} className="border-t border-slate-100">
                  <td className="p-3 sm:p-4 text-sm text-slate-800 font-medium whitespace-nowrap">
                    {fullName || "—"}
                  </td>
                  <td className="p-3 sm:p-4 text-sm text-slate-600 whitespace-nowrap">
                    {student.admissionNumber || "—"}
                  </td>
                  <td className="p-3 sm:p-4 text-sm text-slate-600 whitespace-nowrap">
                    {student.rollNumber || "—"}
                  </td>
                  <td className="p-3 sm:p-4 text-sm text-slate-600 whitespace-nowrap">
                    {student.email || "—"}
                  </td>
                  <td className="p-3 sm:p-4 text-sm text-slate-600 whitespace-nowrap">
                    {phone}
                  </td>
                  <td className="p-3 sm:p-4 text-sm whitespace-nowrap">
                    <StatusBadge status={student.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssignStaffModal({
  classId,
  currentTeacherId,
  currentTeacherLabel,
  onClose,
  onAssigned,
}) {
  const [staffOptions, setStaffOptions] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isUpdate = Boolean(currentTeacherId);

  useEffect(() => {
    let cancelled = false;

    const loadStaff = async () => {
      try {
        setLoadingStaff(true);
        const result = await getActiveStaffBySchool();
        if (cancelled) return;

        const options = (result.staff || []).map((member) => ({
          value: member._id,
          label: staffOptionLabel(member),
        }));

        setStaffOptions(options);

        if (currentTeacherId) {
          const current = options.find(
            (option) => String(option.value) === String(currentTeacherId)
          );
          if (current) setSelectedStaff(current);
        }
      } catch (error) {
        if (!cancelled) {
          openSnackbar({
            message:
              error?.response?.data?.message || "Failed to load staff list",
            variant: "error",
          });
        }
      } finally {
        if (!cancelled) setLoadingStaff(false);
      }
    };

    loadStaff();
    return () => {
      cancelled = true;
    };
  }, [currentTeacherId]);

  const handleSubmit = async () => {
    if (!selectedStaff?.value) {
      return openSnackbar({
        message: "Please select a staff member",
        variant: "warning",
      });
    }

    if (
      isUpdate &&
      String(selectedStaff.value) === String(currentTeacherId)
    ) {
      return openSnackbar({
        message: "This staff member is already assigned to this class",
        variant: "warning",
      });
    }

    try {
      setSubmitting(true);
      const result = await assignStaffToClass(classId, selectedStaff.value);
      openSnackbar({
        message: isUpdate
          ? "Assigned staff updated successfully"
          : "Staff assigned to class successfully",
        variant: "success",
      });
      onAssigned?.(result);
      onClose();
    } catch (error) {
      openSnackbar({
        message:
          error?.response?.data?.message ||
          (isUpdate
            ? "Failed to update assigned staff"
            : "Failed to assign staff to class"),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[520px] bg-white rounded-t-[14px] sm:rounded-[14px] shadow-2xl overflow-hidden flex flex-col">
        <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAEEE9] text-[#A77A95]">
              <UserPlus size={18} />
            </span>
            <h2 className="text-base sm:text-[18px] font-semibold text-[#111827] truncate">
              {isUpdate ? "Update Assigned Staff" : "Assign Staff"}
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

        <div className="px-4 sm:px-6 py-5 space-y-4">
          {currentTeacherLabel ? (
            <div className="rounded-lg border border-[#E8D5DF] bg-[#FAEEE9] px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#A77A95]">
                Currently assigned
              </p>
              <p className="mt-1 text-sm font-semibold text-[#735366]">
                {currentTeacherLabel}
              </p>
            </div>
          ) : null}

          <div>
            <label className={labelClass}>
              {isUpdate ? "New staff" : "Staff"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              options={staffOptions}
              placeholder={
                loadingStaff
                  ? "Loading staff…"
                  : staffOptions.length === 0
                    ? "No active staff found"
                    : isUpdate
                      ? "Select new staff member"
                      : "Select staff member"
              }
              isSearchable
              isLoading={loadingStaff}
              isDisabled={loadingStaff || submitting}
              value={selectedStaff}
              onChange={(option) => setSelectedStaff(option)}
            />
          </div>
        </div>

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
            disabled={submitting || loadingStaff}
            className="px-6 h-[42px] rounded-lg bg-[#A77A95] hover:bg-[#8F6580] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting
              ? isUpdate
                ? "Updating…"
                : "Assigning…"
              : isUpdate
                ? "Update Staff"
                : "Assign Staff"}
          </button>
        </div>
      </div>
      {submitting && (
        <EdvoraLoader
          overlay
          message={isUpdate ? "Updating staff…" : "Assigning staff…"}
        />
      )}
    </div>
  );
}

function ClassStudents() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!classId) return;

      try {
        setLoading(true);
        const result = await getStudentsByClass(classId);
        if (cancelled) return;
        setClassInfo(result.classInfo);
        setStudents(result.students);
        setTotalStudents(result.totalStudents);
      } catch (error) {
        if (!cancelled) {
          openSnackbar({
            message:
              error?.response?.data?.message ||
              "Failed to load class students",
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
  }, [classId]);

  const assignedTeacherLabel = classInfo?.classTeacher
    ? staffOptionLabel(classInfo.classTeacher)
    : null;
  const hasAssignedStaff = Boolean(classInfo?.classTeacherId);

  return (
    <div className="w-full min-w-0 max-w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-start gap-4 min-w-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#A77A95] text-white">
              <BookOpen size={22} />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#735366]">
                {classInfo?.className || "Class Students"}
              </h1>
              <p className="text-slate-500 mt-1 text-sm sm:text-base">
                {classInfo?.section ? `Section ${classInfo.section} · ` : ""}
                Students enrolled in this class
              </p>
              <p className="text-sm font-semibold text-[#735366] mt-2">
                Total students: {loading ? "…" : totalStudents}
              </p>
              {!loading ? (
                <p className="text-sm text-slate-500 mt-1">
                  Assigned staff:{" "}
                  <span className="font-medium text-[#735366]">
                    {assignedTeacherLabel || "Not assigned"}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              disabled={loading || !classInfo}
              className="inline-flex items-center gap-2 px-4 h-[42px] rounded-lg bg-[#A77A95] hover:bg-[#8F6580] text-white text-sm font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <UserPlus size={16} />
              {hasAssignedStaff ? "Update Staff" : "Assign Staff"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/classes")}
              className="inline-flex items-center gap-2 px-4 h-[42px] rounded-lg bg-[#A77A95] hover:bg-[#8F6580] text-white text-sm font-semibold shadow-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <EdvoraLoader message="Loading students…" />
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center border border-slate-100">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAEEE9] text-[#A77A95]">
            <UserRound size={22} />
          </span>
          <p className="text-slate-700 font-medium">No students found</p>
          <p className="text-slate-500 text-sm mt-1">
            There are no students enrolled in this class yet.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {students.map((student) => (
              <StudentCard key={student._id} student={student} />
            ))}
          </div>
          <div className="hidden lg:block w-full min-w-0 max-w-full">
            <StudentTable students={students} />
          </div>
        </>
      )}

      {showAssignModal && (
        <AssignStaffModal
          classId={classId}
          currentTeacherId={classInfo?.classTeacherId}
          currentTeacherLabel={assignedTeacherLabel}
          onClose={() => setShowAssignModal(false)}
          onAssigned={(result) => {
            setClassInfo((prev) => ({
              ...prev,
              classTeacherId:
                result?.class?.classTeacherId || result?.classTeacher?._id,
              classTeacher: result?.classTeacher || null,
            }));
          }}
        />
      )}
    </div>
  );
}

export default ClassStudents;
