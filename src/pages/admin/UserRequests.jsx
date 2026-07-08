import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ROLE_LABELS,
  canActOnRole,
  getRequestDisplayOrder,
  getRoleConfig,
  getViewRoles,
} from "../../utils/rolePermissions";
import {
  REQUEST_STATUSES,
  fetchAllViewableRequests,
  fetchCategoryStatusCounts,
  getStatusLabel,
  updateRequestStatus,
} from "../../utils/requestsApi";
import { openSnackbar } from "../../common/snackbar/snackbar";

function StatusBadge({ status }) {
  const styles = {
    REQUESTED: "bg-amber-50 text-amber-700",
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

function RequestActions({ user, onUpdated }) {
  const canAct =
    canActOnRole(user.role) && user.status === "REQUESTED";

  if (!canAct) {
    return <StatusBadge status={user.status} />;
  }

  const handleUpdate = async (status) => {
    try {
      await updateRequestStatus(user._id, status, user.role);
      openSnackbar({
        message:
          status === "ACTIVE"
            ? "Request approved successfully"
            : "Request rejected successfully",
        variant: "success",
      });
      onUpdated();
    } catch (error) {
      openSnackbar({
        message: error?.response?.data?.message || "Failed to update request",
        variant: "error",
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleUpdate("ACTIVE")}
        className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => handleUpdate("INACTIVE")}
        className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm"
      >
        Reject
      </button>
    </div>
  );
}

function UserCard({ user, onUpdated }) {
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

      <RequestActions user={user} onUpdated={onUpdated} />
    </div>
  );
}

function RequestTable({ users, onUpdated }) {
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
                  <RequestActions user={user} onUpdated={onUpdated} />
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
  const [groupedRequests, setGroupedRequests] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(displayOrder[0] || "");
  const [activeStatus, setActiveStatus] = useState("REQUESTED");

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const [data, counts] = await Promise.all([
        fetchAllViewableRequests(undefined, getViewRoles(), activeStatus),
        fetchCategoryStatusCounts(getViewRoles()),
      ]);
      setGroupedRequests(data);
      setStatusCounts(counts);
    } catch (error) {
      openSnackbar({
        message: error?.response?.data?.message || "Failed to load requests",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const orderedGroups = useMemo(() => {
    const groupMap = new Map(
      groupedRequests.map((group) => [group.role, group.users])
    );

    return displayOrder.map((role) => ({
      role,
      users: (groupMap.get(role) || []).map((user) => ({
        ...user,
        role: user.role || role,
      })),
    }));
  }, [groupedRequests, displayOrder]);

  const activeGroup = useMemo(
    () => orderedGroups.find((group) => group.role === activeTab),
    [orderedGroups, activeTab]
  );

  const activeTitle = ROLE_LABELS[activeTab] || activeTab;
  const activeActionable = canActOnRole(activeTab);
  const activeUsers = activeGroup?.users || [];
  const activeStatusLabel = getStatusLabel(activeStatus);

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
          const pendingCount = statusCounts[role]?.REQUESTED || 0;

          return (
            <button
              key={role}
              type="button"
              onClick={() => setActiveTab(role)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition border-b-2 -mb-px ${
                isActive
                  ? "border-[#7F56D9] text-[#7F56D9] bg-[#FAF5FF]"
                  : "border-transparent text-slate-600 hover:text-[#7F56D9] hover:bg-slate-50"
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isActive
                    ? "bg-[#7F56D9] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {pendingCount}
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
                  ? "bg-[#7F56D9] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-[#C4B5FD]"
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
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#F3E8FF] text-[#6941C6]">
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
                    onUpdated={loadRequests}
                  />
                ))}
              </div>

              <div className="hidden min-[640px]:block">
                <RequestTable users={activeUsers} onUpdated={loadRequests} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default UserRequests;
