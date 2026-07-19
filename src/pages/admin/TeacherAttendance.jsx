import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  ScrollText,
  Sparkles,
  UserRoundCheck,
  Users,
} from "lucide-react";
import CustomDatePicker from "../../common/CustomDatePicker";
import { openSnackbar } from "../../common/snackbar/snackbar";
import {
  ATTENDANCE_STATUSES,
  getAttendanceSummary,
  todayISO,
} from "../../utils/attendanceApi";

function StatPill({ label, value, tone }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function TeacherAttendance() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await getAttendanceSummary({ type: "TEACHER", date });
        if (!cancelled) setSummary(data);
      } catch (error) {
        if (!cancelled) {
          openSnackbar({
            message:
              error?.response?.data?.message ||
              "Failed to load teacher attendance",
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
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    import("./TeacherAttendanceMark");
    import("./BulkAttendanceUpload");
    import("./AttendanceLogs");
  }, []);

  const counts = summary?.summary || {};
  const presentRate =
    summary?.totalPeople > 0
      ? Math.round(((counts.PRESENT || 0) / summary.totalPeople) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-linear-to-br from-[#735366] via-[#8F6580] to-[#A77A95] text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-[#F5D69B]/25 blur-2xl" />
          <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute top-1/2 right-1/3 h-24 w-24 rounded-full bg-[#C3C3D5]/20" />
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#F5D69B]">
                <Sparkles size={14} />
                Office Admin · Staff Attendance
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
                Teacher Attendance
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/80 max-w-xl">
                Mark daily staff presence, review trends, and upload bulk
                attendance sheets without leaving the admin portal.
              </p>
            </div>

            <div className="w-full max-w-xs rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
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

          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatPill
              label="Active Teachers"
              value={summary?.totalPeople ?? "—"}
              tone="bg-white/10 border-white/15 text-white"
            />
            <StatPill
              label="Marked Today"
              value={summary?.markedCount ?? "—"}
              tone="bg-white/10 border-white/15 text-white"
            />
            <StatPill
              label="Present"
              value={counts.PRESENT ?? 0}
              tone="bg-emerald-400/15 border-emerald-300/30 text-white"
            />
            <StatPill
              label="Present Rate"
              value={`${presentRate}%`}
              tone="bg-[#F5D69B]/20 border-[#F5D69B]/40 text-white"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() =>
            navigate(`/admin/teacher-attendance/mark?date=${date}`)
          }
          className="group text-left rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[#A77A95]/35 transition"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAEEE9] text-[#A77A95] group-hover:scale-105 transition">
              <ClipboardCheck size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-[#735366]">
                  Mark Attendance
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
                Take roll call for all active teachers on the selected date.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#A77A95]">
                Open mark sheet →
              </p>
            </div>
          </div>
        </button>

        <Link
          to={`/admin/teacher-attendance/bulk-upload?date=${date}`}
          className="group rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[#A77A95]/35 transition"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAEEE9] text-[#A77A95] group-hover:scale-105 transition">
              <CloudUpload size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-[#735366]">
                Bulk Upload
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Import a CSV sheet, preview validation, and save in one go.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#A77A95]">
                Launch uploader →
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/teacher-attendance/logs"
          className="group rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[#A77A95]/35 transition"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAEEE9] text-[#A77A95] group-hover:scale-105 transition">
              <ScrollText size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-[#735366]">
                View Logs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Browse mark history, updates, and bulk-upload audit trails.
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
              Day Snapshot
            </h3>
            <p className="text-sm text-slate-500">
              Breakdown for {date.split("-").reverse().join("-")}
            </p>
          </div>
          <span className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAEEE9] text-[#A77A95]">
            <UserRoundCheck size={18} />
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

        {!summary?.isMarked && !loading ? (
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#FAEEE9] px-4 py-3 text-sm text-[#735366]">
            <Users size={16} className="shrink-0" />
            No attendance saved for this date yet. Mark manually or upload a
            CSV to get started.
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="fixed bottom-4 right-4 z-40 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#735366] shadow-lg border border-slate-100">
          Updating…
        </div>
      ) : null}
    </div>
  );
}

export default TeacherAttendance;
