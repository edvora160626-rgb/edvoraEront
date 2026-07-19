import { memo, useEffect, useMemo, useState, useTransition } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Search,
  UserRound,
} from "lucide-react";
import CustomDatePicker from "../../common/CustomDatePicker";
import { openSnackbar } from "../../common/snackbar/snackbar";
import {
  ATTENDANCE_STATUSES,
  getStatusMeta,
  getStudentsForAttendance,
  markAttendance,
  todayISO,
} from "../../utils/attendanceApi";

const StatusChip = memo(function StatusChip({ status, active, onClick }) {
  const meta = getStatusMeta(status);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
        active
          ? meta.color + " ring-2 ring-offset-1 ring-[#A77A95]/40"
          : "bg-white text-slate-500 border-slate-200 hover:border-[#A77A95]/40"
      }`}
    >
      {active ? <Check size={12} /> : null}
      {meta.short}
    </button>
  );
});

function StudentAttendanceMark() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(searchParams.get("date") || todayISO());
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [deferredQuery, setDeferredQuery] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get("date") !== date) {
      setSearchParams({ date }, { replace: true });
    }
  }, [date, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getStudentsForAttendance(classId, date);
        if (cancelled) return;

        setStudents(data.students);
        setClassInfo(data.classInfo);
        const next = {};
        data.students.forEach((student) => {
          next[student._id] = student.attendanceStatus || "PRESENT";
        });
        setMarks(next);
      } catch (error) {
        openSnackbar({
          message:
            error?.response?.data?.message || "Failed to load students",
          variant: "error",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (classId) load();
    return () => {
      cancelled = true;
    };
  }, [classId, date]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      return (
        name.includes(q) ||
        (s.admissionNumber || "").toLowerCase().includes(q) ||
        (s.rollNumber || "").toLowerCase().includes(q)
      );
    });
  }, [students, deferredQuery]);

  const counts = useMemo(() => {
    const result = { PRESENT: 0, ABSENT: 0, LATE: 0, HALF_DAY: 0, LEAVE: 0 };
    Object.values(marks).forEach((status) => {
      if (result[status] != null) result[status] += 1;
    });
    return result;
  }, [marks]);

  const setAll = (status) => {
    const next = {};
    students.forEach((s) => {
      next[s._id] = status;
    });
    setMarks(next);
  };

  const handleSave = async () => {
    if (!students.length) {
      return openSnackbar({
        message: "No students available to mark",
        variant: "warning",
      });
    }

    try {
      setSaving(true);
      const records = students.map((s) => ({
        personId: s._id,
        status: marks[s._id] || "PRESENT",
        remarks: "",
      }));

      await markAttendance({
        type: "STUDENT",
        date,
        classId,
        records,
      });

      openSnackbar({
        message: "Student attendance saved successfully",
        variant: "success",
      });
      navigate("/admin/student-attendance");
    } catch (error) {
      openSnackbar({
        message:
          error?.response?.data?.message || "Failed to save attendance",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#735366]">
            Mark Student Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {classInfo
              ? `${classInfo.className} · Section ${classInfo.section}`
              : "Class roll call"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
          <div className="w-44 sm:w-52 rounded-xl bg-white border border-slate-100 p-2 shadow-sm">
            <CustomDatePicker
              value={date}
              onChange={setDate}
              openTo="day"
              maxDate={todayISO()}
            />
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/student-attendance")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#A77A95] hover:bg-[#FAEEE9]"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ATTENDANCE_STATUSES.map((status) => (
          <button
            key={status.value}
            type="button"
            onClick={() => setAll(status.value)}
            className={`rounded-xl border px-3 py-2.5 text-left transition hover:shadow-sm ${status.color}`}
          >
            <p className="text-[11px] font-semibold opacity-80">
              Mark all {status.label}
            </p>
            <p className="text-lg font-bold">{counts[status.value] || 0}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                startTransition(() => setDeferredQuery(value));
              }}
              placeholder="Search student, admission, or roll…"
              className="w-full h-10 rounded-lg border border-[#D0D5DD] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#A77A95]"
            />
          </div>
          <p className="text-sm text-slate-500">
            {filtered.length} of {students.length} students
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((student) => {
            const name = [student.firstName, student.lastName]
              .filter(Boolean)
              .join(" ");
            const current = marks[student._id] || "PRESENT";

            return (
              <div
                key={student._id}
                className="flex flex-col gap-3 px-4 sm:px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FAEEE9] text-[#A77A95]">
                    <UserRound size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      {name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {student.admissionNumber
                        ? `Adm: ${student.admissionNumber}`
                        : "No admission no"}
                      {student.rollNumber ? ` · Roll ${student.rollNumber}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ATTENDANCE_STATUSES.map((status) => (
                    <StatusChip
                      key={status.value}
                      status={status.value}
                      active={current === status.value}
                      onClick={() =>
                        setMarks((prev) => ({
                          ...prev,
                          [student._id]: status.value,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {!loading && filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-slate-500">
              No students found for this class.
            </div>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-3 z-10 flex justify-end">
        <div className="flex gap-3 rounded-2xl border border-slate-100 bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
          <button
            type="button"
            onClick={() => navigate("/admin/student-attendance")}
            className="px-4 h-11 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !students.length}
            className="px-6 h-11 rounded-xl bg-[#A77A95] hover:bg-[#8F6580] text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Attendance"}
          </button>
        </div>
      </div>

      {(loading || saving) && (
        <div className="fixed bottom-4 right-4 z-40 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#735366] shadow-lg border border-slate-100">
          {saving ? "Saving…" : "Loading…"}
        </div>
      )}
    </div>
  );
}

export default StudentAttendanceMark;
