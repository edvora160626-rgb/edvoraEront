import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CloudUpload,
  GraduationCap,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";
import CustomDatePicker from "../../common/CustomDatePicker";
import CustomSelect from "../../common/CustomSelect";
import { openSnackbar } from "../../common/snackbar/snackbar";
import { getClassesByStatus } from "../../utils/classesApi";
import {
  ATTENDANCE_STATUSES,
  getAttendanceSummary,
  todayISO,
} from "../../utils/attendanceApi";

function StudentAttendance() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadClasses = async () => {
      try {
        const result = await getClassesByStatus("ACTIVE");
        if (cancelled) return;
        const list = result.data || [];
        setClasses(list);
        if (list.length) setClassId((prev) => prev || list[0]._id);
        else setLoading(false);
      } catch (error) {
        openSnackbar({
          message:
            error?.response?.data?.message || "Failed to load classes",
          variant: "error",
        });
        if (!cancelled) setLoading(false);
      }
    };

    loadClasses();
    import("./StudentAttendanceMark");
    import("./BulkAttendanceUpload");
    import("./AttendanceLogs");
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!classId) {
      setSummary(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await getAttendanceSummary({
          type: "STUDENT",
          date,
          classId,
        });
        if (!cancelled) setSummary(data);
      } catch (error) {
        if (!cancelled) {
          openSnackbar({
            message:
              error?.response?.data?.message ||
              "Failed to load student attendance",
            variant: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, summary ? 180 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [classId, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const classOptions = useMemo(
    () =>
      classes.map((item) => ({
        value: item._id,
        label: `${item.className} · Sec ${item.section}`,
      })),
    [classes]
  );

  const selectedClass = classes.find((c) => c._id === classId);
  const counts = summary?.summary || {};
  const presentRate =
    summary?.totalPeople > 0
      ? Math.round(((counts.PRESENT || 0) / summary.totalPeople) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-linear-to-br from-[#8F6580] via-[#A77A95] to-[#735366] text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-[#F5D69B]/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/10" />
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#F5D69B]">
            <Sparkles size={14} />
            Teacher Portal · Class Roll
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Student Attendance
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/80 max-w-2xl">
            Take daily class attendance, monitor presence rates, and upload
            bulk sheets for your selected class.
          </p>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                <BookOpen size={14} />
                Select Class
              </label>
              <div className="rounded-xl bg-white overflow-hidden">
                <CustomSelect
                  options={classOptions}
                  value={
                    classOptions.find((opt) => opt.value === classId) || null
                  }
                  onChange={(opt) => setClassId(opt?.value || "")}
                  placeholder="Choose a class"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                <CalendarDays size={14} />
                Attendance Date
              </label>
              <div className="rounded-xl bg-white overflow-hidden">
                <CustomDatePicker
                  value={date}
                  onChange={setDate}
                  openTo="day"
                  maxDate={todayISO()}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Students",
                value: summary?.totalPeople ?? "—",
              },
              {
                label: "Marked",
                value: summary?.markedCount ?? "—",
              },
              {
                label: "Present",
                value: counts.PRESENT ?? 0,
              },
              {
                label: "Present Rate",
                value: `${presentRate}%`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3"
              >
                <p className="text-xs font-medium text-white/75">{item.label}</p>
                <p className="mt-1 text-2xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          disabled={!classId}
          onClick={() =>
            navigate(
              `/admin/student-attendance/mark/${classId}?date=${date}`
            )
          }
          className="group text-left rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[#A77A95]/35 transition disabled:opacity-50"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAEEE9] text-[#A77A95]">
              <GraduationCap size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-[#735366]">
                  Mark Class Attendance
                </h2>
                {summary?.isMarked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 size={12} />
                    Saved
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    Pending
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {selectedClass
                  ? `${selectedClass.className} · Section ${selectedClass.section}`
                  : "Select a class to continue"}
              </p>
              <p className="mt-4 text-sm font-semibold text-[#A77A95]">
                Open roll call →
              </p>
            </div>
          </div>
        </button>

        <Link
          to={
            classId
              ? `/admin/student-attendance/bulk-upload?date=${date}&classId=${classId}`
              : "#"
          }
          onClick={(e) => {
            if (!classId) e.preventDefault();
          }}
          className={`group rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[#A77A95]/35 transition ${
            !classId ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAEEE9] text-[#A77A95]">
              <CloudUpload size={22} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#735366]">
                Bulk Upload
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Drop a CSV for the selected class, validate rows, then publish.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#A77A95]">
                Launch uploader →
              </p>
            </div>
          </div>
        </Link>

        <Link
          to={
            classId
              ? `/admin/student-attendance/logs?classId=${classId}`
              : "/admin/student-attendance/logs"
          }
          className="group rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[#A77A95]/35 transition"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAEEE9] text-[#A77A95]">
              <ScrollText size={22} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#735366]">
                View Logs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                See who marked class attendance and when it changed.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#A77A95]">
                Open logs →
              </p>
            </div>
          </div>
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#735366]">
              Class Snapshot
            </h3>
            <p className="text-sm text-slate-500">
              Status mix for the selected class and date
            </p>
          </div>
          <span className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAEEE9] text-[#A77A95]">
            <Users size={18} />
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ATTENDANCE_STATUSES.map((status) => (
            <div
              key={status.value}
              className={`rounded-xl border px-3 py-3 ${status.color}`}
            >
              <p className="text-xs font-semibold">{status.label}</p>
              <p className="mt-1 text-xl font-bold">
                {counts[status.value] || 0}
              </p>
            </div>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="fixed bottom-4 right-4 z-40 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#735366] shadow-lg border border-slate-100">
          Updating…
        </div>
      ) : null}
    </div>
  );
}

export default StudentAttendance;
