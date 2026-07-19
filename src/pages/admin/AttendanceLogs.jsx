import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Eye,
  ScrollText,
  UserRound,
  X,
} from "lucide-react";
import CustomDatePicker from "../../common/CustomDatePicker";
import CustomSelect from "../../common/CustomSelect";
import { openSnackbar } from "../../common/snackbar/snackbar";
import { getClassesByStatus } from "../../utils/classesApi";
import {
  ATTENDANCE_STATUSES,
  getAttendanceLogDetail,
  getAttendanceLogs,
  getStatusMeta,
} from "../../utils/attendanceApi";

const ACTION_META = {
  MARKED: {
    label: "Marked",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  UPDATED: {
    label: "Updated",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  BULK_UPLOAD: {
    label: "Bulk Upload",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LogDetailModal({ logId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getAttendanceLogDetail(logId);
        if (cancelled) return;
        setLog(data.log);
        setRecords(data.records);
      } catch (error) {
        openSnackbar({
          message:
            error?.response?.data?.message || "Failed to load log detail",
          variant: "error",
        });
        onClose?.();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (logId) load();
    return () => {
      cancelled = true;
    };
  }, [logId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-3xl max-h-[92dvh] bg-white rounded-t-[18px] sm:rounded-[16px] shadow-2xl overflow-hidden flex flex-col">
        <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAEEE9] text-[#A77A95]">
              <ScrollText size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-[18px] font-semibold text-[#111827] truncate">
                Attendance Log Detail
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {log
                  ? `${formatDate(log.attendanceDate)} · ${
                      ACTION_META[log.action]?.label || log.action
                    }`
                  : "Loading…"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#A77A95] hover:bg-[#8F6580] text-white flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500 py-10 text-center">
              Loading log…
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-[#FAEEE9] px-3 py-3">
                  <p className="text-xs text-[#735366]/80">Marked by</p>
                  <p className="text-sm font-semibold text-[#735366] mt-1 truncate">
                    {log?.markedByName || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-3">
                  <p className="text-xs text-slate-500">Saved at</p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    {formatDateTime(log?.createdAt)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-3">
                  <p className="text-xs text-slate-500">Records</p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    {log?.recordCount ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-3">
                  <p className="text-xs text-slate-500">Source</p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    {log?.source || "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ATTENDANCE_STATUSES.map((status) => (
                  <div
                    key={status.value}
                    className={`rounded-xl border px-3 py-2 ${status.color}`}
                  >
                    <p className="text-[11px] font-semibold">{status.label}</p>
                    <p className="text-lg font-bold">
                      {log?.summary?.[status.value] || 0}
                    </p>
                  </div>
                ))}
              </div>

              {records.length ? (
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="table-scroll">
                    <table className="w-full min-w-[640px] border-collapse">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-3 text-left text-sm font-semibold text-slate-700">
                            Name
                          </th>
                          <th className="p-3 text-left text-sm font-semibold text-slate-700">
                            ID
                          </th>
                          <th className="p-3 text-left text-sm font-semibold text-slate-700">
                            Status
                          </th>
                          <th className="p-3 text-left text-sm font-semibold text-slate-700">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((row) => {
                          const name = [row.firstName, row.lastName]
                            .filter(Boolean)
                            .join(" ");
                          const id =
                            row.employeeId ||
                            row.admissionNumber ||
                            row.rollNumber ||
                            "—";
                          const meta = getStatusMeta(row.status);
                          return (
                            <tr
                              key={String(row.personId)}
                              className="border-t border-slate-100"
                            >
                              <td className="p-3 text-sm font-medium text-slate-800">
                                {name || "—"}
                              </td>
                              <td className="p-3 text-sm text-slate-600">
                                {id}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.color}`}
                                >
                                  {meta.label}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-slate-500">
                                {row.remarks || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No record snapshot available for this log.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendanceLogs({ type: typeProp = "TEACHER" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = typeProp === "STUDENT" ? "STUDENT" : "TEACHER";
  const backPath =
    type === "TEACHER"
      ? "/admin/teacher-attendance"
      : "/admin/student-attendance";

  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [classId, setClassId] = useState(searchParams.get("classId") || "");
  const [classes, setClasses] = useState([]);
  const [selectedLogId, setSelectedLogId] = useState(null);

  useEffect(() => {
    if (type !== "STUDENT") return;
    let cancelled = false;

    getClassesByStatus("ACTIVE")
      .then((res) => {
        if (cancelled) return;
        setClasses(res.data || []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [type]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getAttendanceLogs({
          type,
          classId: type === "STUDENT" ? classId || null : null,
          page,
          limit: 20,
          fromDate,
          toDate,
        });
        if (cancelled) return;
        setLogs(data.logs);
        setTotalLogs(data.totalLogs);
      } catch (error) {
        if (!cancelled) {
          openSnackbar({
            message:
              error?.response?.data?.message || "Failed to load attendance logs",
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
  }, [type, classId, page, fromDate, toDate]);

  const classOptions = useMemo(
    () => [
      { value: "", label: "All classes" },
      ...classes.map((item) => ({
        value: item._id,
        label: `${item.className} · Sec ${item.section}`,
      })),
    ],
    [classes]
  );

  const totalPages = Math.max(1, Math.ceil(totalLogs / 20));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FAEEE9] px-3 py-1 text-xs font-semibold text-[#A77A95]">
            <ClipboardList size={14} />
            Audit trail
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-[#735366]">
            {type === "TEACHER"
              ? "Teacher Attendance Logs"
              : "Student Attendance Logs"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review every mark, update, and bulk upload saved for this school.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#A77A95] hover:bg-[#FAEEE9]"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
              <CalendarDays size={12} />
              From date
            </label>
            <CustomDatePicker
              value={fromDate}
              onChange={(value) => {
                setPage(1);
                setFromDate(value);
              }}
              openTo="day"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
              <CalendarDays size={12} />
              To date
            </label>
            <CustomDatePicker
              value={toDate}
              onChange={(value) => {
                setPage(1);
                setToDate(value);
              }}
              openTo="day"
            />
          </div>
          {type === "STUDENT" ? (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Class filter
              </label>
              <CustomSelect
                options={classOptions}
                value={
                  classOptions.find((opt) => opt.value === classId) ||
                  classOptions[0]
                }
                onChange={(opt) => {
                  setPage(1);
                  setClassId(opt?.value || "");
                }}
                placeholder="All classes"
              />
            </div>
          ) : (
            <div className="rounded-xl bg-[#FAEEE9] px-4 py-3 flex items-center gap-3 sm:col-span-2">
              <UserRound size={18} className="text-[#A77A95]" />
              <div>
                <p className="text-sm font-semibold text-[#735366]">
                  {totalLogs} log entries
                </p>
                <p className="text-xs text-slate-500">
                  Teacher attendance activity history
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-sm">
            Loading logs…
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-16 text-center shadow-sm">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAEEE9] text-[#A77A95]">
              <ScrollText size={22} />
            </span>
            <p className="font-medium text-slate-700">No logs yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Mark or upload attendance to start building the audit trail.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const action = ACTION_META[log.action] || {
              label: log.action,
              className: "bg-slate-50 text-slate-600 border-slate-200",
            };

            return (
              <button
                key={log._id}
                type="button"
                onClick={() => setSelectedLogId(log._id)}
                className="w-full text-left rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm hover:border-[#A77A95]/35 hover:shadow-md transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${action.className}`}
                      >
                        {action.label}
                      </span>
                      <span className="text-sm font-semibold text-[#735366]">
                        {formatDate(log.attendanceDate)}
                      </span>
                      {log.classLabel ? (
                        <span className="text-xs text-slate-500">
                          {log.classLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      By{" "}
                      <span className="font-semibold text-slate-800">
                        {log.markedByName || "Unknown"}
                      </span>
                      {log.markedByRole ? (
                        <span className="text-slate-400">
                          {" "}
                          · {log.markedByRole.replace("_", " ")}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Saved {formatDateTime(log.createdAt)} · {log.recordCount}{" "}
                      records · Present {log.summary?.PRESENT || 0} · Absent{" "}
                      {log.summary?.ABSENT || 0}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-[#FAEEE9] px-3 py-2 text-xs font-semibold text-[#A77A95]">
                    <Eye size={14} />
                    View
                  </span>
                </div>
              </button>
            );
          })
        )}
      </section>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 h-10 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50"
          >
            Previous
          </button>
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 h-10 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}

      {selectedLogId ? (
        <LogDetailModal
          logId={selectedLogId}
          onClose={() => setSelectedLogId(null)}
        />
      ) : null}
    </div>
  );
}

export default AttendanceLogs;
