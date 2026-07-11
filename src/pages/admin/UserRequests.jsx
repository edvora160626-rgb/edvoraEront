import { useCallback, useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import {
  ROLE_LABELS,
  canActOnRole,
  getRequestDisplayOrder,
  getRoleConfig,
  getViewRoles,
} from "../../utils/rolePermissions";
import {
  REQUEST_STATUSES,
  clearRequestsCache,
  fetchPendingCounts,
  fetchRequestsForRole,
  getStatusLabel,
  updateRequestStatus,
} from "../../utils/requestsApi";
import { openSnackbar } from "../../common/snackbar/snackbar";

function StatusBadge({ status }) {
  const styles = {
    REQUESTED: "bg-[#FAEEE9] text-[#735366]",
    ACTIVE: "bg-green-50 text-green-700",
    INACTIVE: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function DetailRow({ label, value }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:w-36 shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-slate-800 break-words">{value}</dd>
    </div>
  );
}

function getRoleSpecificDetails(user) {
  const role = user.role;

  if (role === "TEACHER") {
    return [
      { label: "Employee ID", value: user.employeeId || user.staffId },
      { label: "Department", value: user.department },
      { label: "Qualification", value: user.qualification },
      {
        label: "Experience",
        value:
          user.experience !== undefined && user.experience !== null
            ? `${user.experience} years`
            : "",
      },
      {
        label: "Subjects",
        value: Array.isArray(user.subjects) ? user.subjects.join(", ") : user.subjects,
      },
    ];
  }

  if (role === "STUDENT") {
    return [
      { label: "Admission No.", value: user.admissionNumber },
      { label: "Roll Number", value: user.rollNumber },
      { label: "Grade", value: user.grade },
      { label: "Section", value: user.section },
    ];
  }

  if (role === "PARENT") {
    return [
      { label: "Relationship", value: user.relationship },
      {
        label: "Children",
        value: Array.isArray(user.children)
          ? user.children
              .map((child) =>
                typeof child === "string"
                  ? child
                  : child?.name || child?.firstName || ""
              )
              .filter(Boolean)
              .join(", ")
          : "",
      },
    ];
  }

  if (role === "OFFICE" || role === "SCHOOL_ADMIN") {
    return [
      { label: "Employee ID", value: user.employeeId || user.staffId },
      { label: "Department", value: user.department },
    ];
  }

  return [];
}

function RequestDetailModal({ user, onClose, onUpdated }) {
  const [submitting, setSubmitting] = useState(false);
  const canAct = canActOnRole(user.role) && user.status === "REQUESTED";
  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const roleDetails = getRoleSpecificDetails(user);

  const handleUpdate = async (status) => {
    try {
      setSubmitting(true);
      await updateRequestStatus(user._id, status, user.role);
      openSnackbar({
        message:
          status === "ACTIVE"
            ? "Request approved successfully"
            : "Request rejected successfully",
        variant: "success",
      });
      onClose();
      onUpdated();
    } catch (error) {
      openSnackbar({
        message: error?.response?.data?.message || "Failed to update request",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="w-full max-w-[560px] max-h-[90dvh] bg-white rounded-t-[14px] sm:rounded-[14px] shadow-2xl overflow-hidden flex flex-col">
        <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-[#735366] truncate">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {roleLabel} request
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FF3040] hover:bg-red-600 text-white flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <StatusBadge status={user.status} />
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#FAEEE9] text-[#A77A95]">
              {roleLabel}
            </span>
          </div>

          <dl>
            <DetailRow label="First Name" value={user.firstName} />
            <DetailRow label="Last Name" value={user.lastName} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow
              label="Phone"
              value={
                user.phone
                  ? `${user.phoneCode ? `+${user.phoneCode} ` : ""}${user.phone}`
                  : ""
              }
            />
            <DetailRow label="Gender" value={user.gender} />
            <DetailRow
              label="Date of Birth"
              value={
                user.dob
                  ? new Date(user.dob).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : ""
              }
            />
            <DetailRow label="Address" value={user.address} />
            {roleDetails.map((item) => (
              <DetailRow key={item.label} label={item.label} value={item.value} />
            ))}
            <DetailRow
              label="Requested On"
              value={
                user.createdAt
                  ? new Date(user.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""
              }
            />
          </dl>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-2 shrink-0">
          {canAct ? (
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleUpdate("INACTIVE")}
                className="px-4 h-[42px] rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? "Please wait..." : "Reject"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleUpdate("ACTIVE")}
                className="px-4 h-[42px] rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? "Please wait..." : "Accept"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-[42px] rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, onView }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-3 border border-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-slate-500 mt-1">{user.email}</p>
        </div>
        <StatusBadge status={user.status} />
      </div>

      <div className="text-sm text-slate-600">
        <p>
          <span className="font-medium">Phone:</span> {user.phone}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onView(user)}
        className="inline-flex items-center gap-2 bg-[#A77A95] hover:bg-[#8F6580] text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium"
      >
        <Eye size={16} />
        View
      </button>
    </div>
  );
}

function RequestTable({ users, onView }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 sm:p-4 text-left text-sm">Name</th>
              <th className="p-3 sm:p-4 text-left text-sm">Email</th>
              <th className="p-3 sm:p-4 text-left text-sm">Phone</th>
              <th className="p-3 sm:p-4 text-left text-sm">Status</th>
              <th className="p-3 sm:p-4 text-left text-sm">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-t">
                <td className="p-3 sm:p-4 text-sm">
                  {user.firstName} {user.lastName}
                </td>
                <td className="p-3 sm:p-4 text-sm max-w-[220px] truncate">
                  {user.email}
                </td>
                <td className="p-3 sm:p-4 text-sm">{user.phone}</td>
                <td className="p-3 sm:p-4 text-sm">
                  <StatusBadge status={user.status} />
                </td>
                <td className="p-3 sm:p-4">
                  <button
                    type="button"
                    onClick={() => onView(user)}
                    className="inline-flex items-center gap-1.5 bg-[#A77A95] hover:bg-[#8F6580] text-white px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    <Eye size={15} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRequests() {
  const config = getRoleConfig();
  const displayOrder = getRequestDisplayOrder();
  const [activeUsers, setActiveUsers] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(displayOrder[0] || "");
  const [activeStatus, setActiveStatus] = useState("REQUESTED");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      try {
        setCountsLoading(true);
        const counts = await fetchPendingCounts(getViewRoles());
        if (!cancelled) setStatusCounts(counts);
      } catch (error) {
        if (!cancelled) {
          openSnackbar({
            message:
              error?.response?.data?.message || "Failed to load request counts",
            variant: "error",
          });
        }
      } finally {
        if (!cancelled) setCountsLoading(false);
      }
    };

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeTab) return;

    let cancelled = false;

    const loadList = async () => {
      try {
        setListLoading(true);
        const users = await fetchRequestsForRole(activeTab, activeStatus);
        if (!cancelled) {
          setActiveUsers(
            users.map((user) => ({
              ...user,
              role: user.role || activeTab,
            }))
          );
        }
      } catch (error) {
        if (!cancelled) {
          openSnackbar({
            message:
              error?.response?.data?.message || "Failed to load requests",
            variant: "error",
          });
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    };

    loadList();
    return () => {
      cancelled = true;
    };
  }, [activeTab, activeStatus]);

  const refreshAfterAction = useCallback(async () => {
    clearRequestsCache();
    try {
      const [counts, users] = await Promise.all([
        fetchPendingCounts(getViewRoles(), { refresh: true }),
        fetchRequestsForRole(activeTab, activeStatus),
      ]);
      setStatusCounts(counts);
      setActiveUsers(
        users.map((user) => ({
          ...user,
          role: user.role || activeTab,
        }))
      );
    } catch (error) {
      openSnackbar({
        message: error?.response?.data?.message || "Failed to refresh requests",
        variant: "error",
      });
    }
  }, [activeTab, activeStatus]);

  const activeTitle = ROLE_LABELS[activeTab] || activeTab;
  const activeActionable = canActOnRole(activeTab);
  const activeStatusLabel = getStatusLabel(activeStatus);
  const loading = countsLoading || listLoading;

  const getRoleTotal = (role) => {
    const counts = statusCounts[role];
    if (!counts) return 0;
    return counts.REQUESTED + counts.ACTIVE + counts.INACTIVE;
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">User Requests</h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">
          {config.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 pb-1">
        {displayOrder.map((role) => {
          const isActive = activeTab === role;
          const label = ROLE_LABELS[role] || role;
          const overallCount = getRoleTotal(role);

          return (
            <button
              key={role}
              type="button"
              onClick={() => setActiveTab(role)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition border-b-2 -mb-px ${
                isActive
                  ? "border-[#A77A95] text-[#A77A95] bg-[#FAEEE9]"
                  : "border-transparent text-slate-600 hover:text-[#A77A95] hover:bg-slate-50"
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isActive
                    ? "bg-[#A77A95] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {overallCount}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {REQUEST_STATUSES.map(({ id, label }) => {
          const isActive = activeStatus === id;
          const count = statusCounts[activeTab]?.[id] || 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveStatus(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2 ${
                isActive
                  ? "bg-[#A77A95] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-[#C3C3D5]"
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-center text-slate-500 py-12">Loading requests...</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {activeTitle} — {activeStatusLabel}
            </h2>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
              {activeUsers.length} shown
            </span>
            <span className="text-xs text-slate-500">
              {getRoleTotal(activeTab)} total in {activeTitle.toLowerCase()}
            </span>
            {activeActionable && activeStatus === "REQUESTED" && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#FAEEE9] text-[#8F6580]">
                Can approve/reject
              </span>
            )}
          </div>

          {!activeUsers.length ? (
            <p className="text-slate-500 bg-white rounded-xl shadow p-6 text-center border border-slate-100">
              No {activeStatusLabel.toLowerCase()} {activeTitle.toLowerCase()}{" "}
              requests
            </p>
          ) : (
            <>
              <div className="space-y-4 min-[640px]:hidden">
                {activeUsers.map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    onView={setSelectedUser}
                  />
                ))}
              </div>

              <div className="hidden min-[640px]:block">
                <RequestTable users={activeUsers} onView={setSelectedUser} />
              </div>
            </>
          )}
        </>
      )}

      {selectedUser && (
        <RequestDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={refreshAfterAction}
        />
      )}
    </div>
  );
}

export default UserRequests;
