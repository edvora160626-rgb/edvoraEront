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


import EdvoraLoader from "../../common/EdvoraLoader";
import { openSnackbar } from "../../common/snackbar/snackbar";
import { getStudentsByClass } from "../../utils/classesApi";

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

function ClassStudents() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);

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
            </div>
          </div>

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
    </div>
  );
}

export default ClassStudents;
