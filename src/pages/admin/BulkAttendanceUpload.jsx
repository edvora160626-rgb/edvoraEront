import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import CustomDatePicker from "../../common/CustomDatePicker";
import CustomSelect from "../../common/CustomSelect";
import { openSnackbar } from "../../common/snackbar/snackbar";
import { getClassesByStatus } from "../../utils/classesApi";
import {
  ATTENDANCE_STATUSES,
  bulkUploadAttendance,
  normalizeBulkRows,
  parseCsv,
  todayISO,
} from "../../utils/attendanceApi";
import { getUserRole } from "../../utils/auth";

const STATUS_HINT = ATTENDANCE_STATUSES.map((s) => s.value).join(" | ");

function downloadTemplate(type) {
  const header =
    type === "TEACHER"
      ? "employeeId,status,remarks"
      : "admissionNumber,status,remarks";
  const sample =
    type === "TEACHER"
      ? "EMP001,PRESENT,\nEMP002,ABSENT,Sick leave"
      : "ADM001,PRESENT,\nADM002,LATE,Traffic";
  const blob = new Blob([`${header}\n${sample}\n`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    type === "TEACHER"
      ? "teacher-attendance-template.csv"
      : "student-attendance-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function BulkAttendanceUpload({ type: typeProp }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = getUserRole();
  const type =
    typeProp ||
    (role === "TEACHER" ? "STUDENT" : "TEACHER");

  const backPath =
    type === "TEACHER"
      ? "/admin/teacher-attendance"
      : "/admin/student-attendance";

  const [date, setDate] = useState(searchParams.get("date") || todayISO());
  const [classId, setClassId] = useState(searchParams.get("classId") || "");
  const [classes, setClasses] = useState([]);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (type !== "STUDENT") return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await getClassesByStatus("ACTIVE");
        if (cancelled) return;
        const list = res.data || [];
        setClasses(list);
        if (!classId && list[0]?._id) setClassId(list[0]._id);
      } catch (error) {
        openSnackbar({
          message:
            error?.response?.data?.message || "Failed to load classes",
          variant: "error",
        });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const classOptions = classes.map((item) => ({
    value: item._id,
    label: `${item.className} · Sec ${item.section}`,
  }));

  const previewStats = useMemo(() => {
    const total = rows.length;
    const withStatus = rows.filter((r) => r.status).length;
    const missingId = rows.filter((r) => !r.identifier).length;
    return { total, withStatus, missingId };
  }, [rows]);

  const handleFiles = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;

    if (!/\.(csv|txt)$/i.test(file.name)) {
      return openSnackbar({
        message: "Please upload a .csv file",
        variant: "warning",
      });
    }

    try {
      const text = await file.text();
      const parsed = normalizeBulkRows(parseCsv(text), type);
      if (!parsed.length) {
        return openSnackbar({
          message: "CSV has no data rows",
          variant: "warning",
        });
      }
      setFileName(file.name);
      setRows(parsed);
      setResult(null);
      openSnackbar({
        message: `${parsed.length} rows ready for preview`,
        variant: "success",
      });
    } catch {
      openSnackbar({
        message: "Could not read the CSV file",
        variant: "error",
      });
    }
  };

  const clearFile = () => {
    setFileName("");
    setRows([]);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (type === "STUDENT" && !classId) {
      return openSnackbar({
        message: "Select a class before uploading",
        variant: "warning",
      });
    }

    if (!rows.length) {
      return openSnackbar({
        message: "Add a CSV file first",
        variant: "warning",
      });
    }

    try {
      setUploading(true);
      const data = await bulkUploadAttendance({
        type,
        date,
        classId: type === "STUDENT" ? classId : null,
        rows,
      });

      setResult(data);
      openSnackbar({
        message: data?.message || "Bulk attendance uploaded",
        variant: "success",
      });
    } catch (error) {
      const payload = error?.response?.data;
      if (payload?.errors) {
        setResult(payload);
      }
      openSnackbar({
        message: payload?.message || "Bulk upload failed",
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#735366]">
            Bulk Attendance Upload
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {type === "TEACHER"
              ? "Import teacher attendance from a CSV sheet"
              : "Import student attendance for a class from a CSV sheet"}
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

      <section className="relative overflow-hidden rounded-[28px] border border-[#E8D9D0] bg-linear-to-br from-[#FAEEE9] via-white to-[#F8F4F7] p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#A77A95]/10" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-[#F5D69B]/30" />

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A77A95] mb-2">
              Step 1 · Date
            </p>
            <CustomDatePicker
              value={date}
              onChange={setDate}
              openTo="day"
              maxDate={todayISO()}
            />
          </div>

          {type === "STUDENT" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#A77A95] mb-2">
                Step 2 · Class
              </p>
              <CustomSelect
                options={classOptions}
                value={
                  classOptions.find((opt) => opt.value === classId) || null
                }
                onChange={(opt) => setClassId(opt?.value || "")}
                placeholder="Select class"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E8D9D0] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#A77A95]">
                Target
              </p>
              <p className="mt-2 text-sm font-semibold text-[#735366]">
                All active teachers
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Match by employeeId, staffId, or email
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-[#E8D9D0] bg-white/70 p-4">
            <div className="flex items-center gap-2 text-[#A77A95]">
              <Sparkles size={16} />
              <p className="text-xs font-semibold uppercase tracking-wider">
                Allowed statuses
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 break-words">
              {STATUS_HINT}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`relative overflow-hidden rounded-[24px] border-2 border-dashed p-6 sm:p-8 transition ${
            dragging
              ? "border-[#A77A95] bg-[#FAEEE9]"
              : "border-[#D8C4CE] bg-white"
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#F5D69B] via-[#A77A95] to-[#735366]" />
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAEEE9] text-[#A77A95] shadow-inner">
              <CloudUpload size={28} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-[#735366]">
              Drop your CSV here
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md">
              Columns:{" "}
              <span className="font-medium text-[#735366]">
                {type === "TEACHER" ? "employeeId" : "admissionNumber"}
              </span>
              , <span className="font-medium text-[#735366]">status</span>,{" "}
              <span className="font-medium text-[#735366]">remarks</span>
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#A77A95] hover:bg-[#8F6580] px-5 h-11 text-sm font-semibold text-white"
              >
                <UploadCloud size={16} />
                Choose File
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate(type)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 h-11 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download size={16} />
                Download Template
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {fileName ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#E8D9D0] bg-[#FAEEE9] px-4 py-3 text-left w-full max-w-md">
                <FileSpreadsheet className="text-[#A77A95] shrink-0" size={20} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#735366] truncate">
                    {fileName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {previewStats.total} rows parsed
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-2 rounded-lg text-rose-500 hover:bg-white"
                  aria-label="Clear file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-100 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-[#735366]">
            Upload checklist
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              Use the template headers exactly (case-insensitive).
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              {type === "TEACHER"
                ? "Identifiers: employeeId, staffId, or email."
                : "Identifiers: admissionNumber, rollNumber, or email."}
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              Short codes work too: P, A, L, HD, LV.
            </li>
            <li className="flex gap-2">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              Existing marks for matched people on this date will be updated.
            </li>
          </ul>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="rounded-xl bg-[#FAEEE9] px-3 py-3 text-center">
              <p className="text-xs text-[#735366]/80">Rows</p>
              <p className="text-xl font-bold text-[#735366]">
                {previewStats.total}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 px-3 py-3 text-center">
              <p className="text-xs text-emerald-700/80">With status</p>
              <p className="text-xl font-bold text-emerald-700">
                {previewStats.withStatus}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 px-3 py-3 text-center">
              <p className="text-xs text-rose-700/80">Missing ID</p>
              <p className="text-xl font-bold text-rose-700">
                {previewStats.missingId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !rows.length}
            className="w-full h-12 rounded-xl bg-[#A77A95] hover:bg-[#8F6580] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading…" : "Validate & Upload"}
          </button>
        </div>
      </section>

      {rows.length > 0 ? (
        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#735366]">
                Preview
              </h3>
              <p className="text-sm text-slate-500">
                Review rows before uploading
              </p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-slate-700">
                    #
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-slate-700">
                    Identifier
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
                {rows.slice(0, 50).map((row, idx) => (
                  <tr key={`${row.identifier}-${idx}`} className="border-t border-slate-100">
                    <td className="p-3 text-sm text-slate-500">{idx + 1}</td>
                    <td className="p-3 text-sm font-medium text-slate-800">
                      {row.identifier || (
                        <span className="text-rose-500">Missing</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-slate-700">
                      {row.status || (
                        <span className="text-rose-500">Missing</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-slate-500">
                      {row.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 50 ? (
            <p className="px-5 py-3 text-xs text-slate-500 border-t border-slate-100">
              Showing first 50 of {rows.length} rows.
            </p>
          ) : null}
        </section>
      ) : null}

      {result ? (
        <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" size={18} />
            <h3 className="text-lg font-semibold text-[#735366]">
              Upload result
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-emerald-50 px-3 py-3">
              <p className="text-xs text-emerald-700">Valid</p>
              <p className="text-xl font-bold text-emerald-700">
                {result?.summary?.valid ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 px-3 py-3">
              <p className="text-xs text-rose-700">Invalid</p>
              <p className="text-xl font-bold text-rose-700">
                {result?.summary?.invalid ?? result?.errors?.length ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-[#FAEEE9] px-3 py-3">
              <p className="text-xs text-[#735366]">Present</p>
              <p className="text-xl font-bold text-[#735366]">
                {result?.summary?.PRESENT ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-3">
              <p className="text-xs text-amber-700">Absent</p>
              <p className="text-xl font-bold text-amber-700">
                {result?.summary?.ABSENT ?? 0}
              </p>
            </div>
          </div>

          {Array.isArray(result.errors) && result.errors.length > 0 ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
              <p className="text-sm font-semibold text-rose-700 mb-2">
                Row issues ({result.errors.length})
              </p>
              <ul className="space-y-1 max-h-40 overflow-y-auto text-sm text-rose-700">
                {result.errors.slice(0, 20).map((err, idx) => (
                  <li key={`${err.line}-${idx}`}>
                    Line {err.line}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#A77A95] hover:bg-[#8F6580] px-5 h-11 text-sm font-semibold text-white"
          >
            Back to attendance
          </button>
        </section>
      ) : null}

      {uploading ? (
        <div className="fixed bottom-4 right-4 z-40 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#735366] shadow-lg border border-slate-100">
          Uploading…
        </div>
      ) : null}
    </div>
  );
}

export default BulkAttendanceUpload;
