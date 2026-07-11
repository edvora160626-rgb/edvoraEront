import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Clock,
  Eye,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { getCurrentUser } from "../../utils/auth";
import {
  ROLE_LABELS,
  canActOnRole,
  getRequestDisplayOrder,
  getRoleConfig,
  getViewRoles,
} from "../../utils/rolePermissions";
import {
  fetchAllViewableRequests,
  fetchPendingCounts,
} from "../../utils/requestsApi";

const ROLE_META = {
  SCHOOL_ADMIN: {
    icon: ShieldCheck,
    gradient: "from-[#A77A95] to-[#735366]",
    light: "bg-[#FAEEE9] text-[#735366]",
  },
  OFFICE: {
    icon: Building2,
    gradient: "from-[#C3C3D5] to-[#A77A95]",
    light: "bg-[#FAEEE9] text-[#735366]",
  },
  TEACHER: {
    icon: UserCheck,
    gradient: "from-[#F5D69B] to-[#D4B87A]",
    light: "bg-[#FAEEE9] text-[#735366]",
  },
  STUDENT: {
    icon: GraduationCap,
    gradient: "from-[#C3C3D5] to-[#735366]",
    light: "bg-[#FAEEE9] text-[#735366]",
  },
  PARENT: {
    icon: Users,
    gradient: "from-[#A77A95] to-[#735366]",
    light: "bg-[#FAEEE9] text-[#735366]",
  },
};

function StatSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-24 bg-white/30 rounded mb-3" />
      <div className="h-9 w-16 bg-white/40 rounded" />
    </div>
  );
}

function Dashboard() {
  const user = getCurrentUser();
  const config = getRoleConfig();
  const displayOrder = getRequestDisplayOrder();
  const [pendingCounts, setPendingCounts] = useState({});
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const viewRoles = getViewRoles();

        // Initial stage: no role → counts only
        const counts = await fetchPendingCounts(viewRoles);
        setPendingCounts(counts);

        // Then fetch data by role only for roles that have pending
        const rolesWithPending = viewRoles.filter(
          (role) => (counts[role]?.REQUESTED || 0) > 0
        );

        if (rolesWithPending.length) {
          const groups = await fetchAllViewableRequests(
            undefined,
            rolesWithPending
          );
          const recent = groups
            .flatMap(({ role, users }) =>
              users.map((requestUser) => ({
                ...requestUser,
                role: requestUser.role || role,
                actionable: canActOnRole(role),
              }))
            )
            .slice(0, 5);
          setRecentRequests(recent);
        } else {
          setRecentRequests([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    return displayOrder.map((role) => ({
      role,
      title: ROLE_LABELS[role] || role,
      count: pendingCounts[role]?.REQUESTED || 0,
      actionable: canActOnRole(role),
      meta: ROLE_META[role] || ROLE_META.SCHOOL_ADMIN,
    }));
  }, [pendingCounts, displayOrder]);

  const totalPending = stats.reduce((sum, item) => sum + item.count, 0);
  const actionablePending = stats
    .filter((item) => item.actionable)
    .reduce((sum, item) => sum + item.count, 0);
  const viewOnlyPending = totalPending - actionablePending;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#A77A95] via-[#8F6580] to-[#735366] text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#F5D69B]/30 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[#C3C3D5]/25 blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F5D69B]/25 border border-[#F5D69B]/50 px-3 py-1 text-xs font-medium text-[#FAEEE9] backdrop-blur-sm mb-4">
              <Sparkles size={14} className="text-[#F5D69B]" />
              {config.portalTitle}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold">
              {config.welcomeTitle}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/85 max-w-2xl">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.{" "}
              {config.description}
            </p>
            <p className="mt-3 text-xs sm:text-sm text-white/70">{today}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-0 lg:min-w-[320px]">
            <div className="rounded-xl bg-white/15 backdrop-blur-md border border-white/20 p-4">
              {loading ? (
                <StatSkeleton />
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-white/80">Total Pending</p>
                  <p className="text-3xl sm:text-4xl font-bold mt-1">
                    {totalPending}
                  </p>
                </>
              )}
            </div>
            <div className="rounded-xl bg-white/15 backdrop-blur-md border border-[#F5D69B]/35 p-4">
              {loading ? (
                <StatSkeleton />
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-[#FAEEE9]">Needs Action</p>
                  <p className="text-3xl sm:text-4xl font-bold mt-1 text-[#F5D69B]">
                    {actionablePending}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">Action Required</p>
            <ShieldCheck size={20} className="text-[#A77A95]" />
          </div>
          <p className="text-3xl font-bold text-[#A77A95]">
            {loading ? "..." : actionablePending}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Admin requests you can approve or reject
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">View Only</p>
            <Eye size={20} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-700">
            {loading ? "..." : viewOnlyPending}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Office, teacher, parent, and student registrations
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">All Categories</p>
            <Clock size={20} className="text-[#8F6580]" />
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {loading ? "..." : stats.length}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Request groups shown on your portal
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        <section className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                Pending Requests by Category
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Admin requests first, then office, teacher, parent, and student
              </p>
            </div>
            <Link
              to="/admin/requests"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#A77A95] hover:text-[#8F6580] transition"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {stats.map((card) => {
              const Icon = card.meta.icon;
              const share =
                totalPending > 0
                  ? Math.round((card.count / totalPending) * 100)
                  : 0;

              return (
                <Link
                  key={card.role}
                  to="/admin/requests"
                  className={`group relative overflow-hidden rounded-2xl bg-white border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                    card.actionable
                      ? "border-[#C3C3D5] shadow-[0_8px_30px_rgba(167,122,149,0.18)]"
                      : "border-slate-100 shadow-sm"
                  }`}
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${card.meta.gradient}`}
                  />

                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${card.meta.gradient} text-white shadow-md`}
                      >
                        <Icon size={22} />
                      </div>

                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          card.actionable
                            ? "bg-[#FAEEE9] text-[#A77A95]"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {card.actionable ? "Can approve/reject" : "View only"}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-slate-500">{card.title}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {loading ? "..." : card.count}
                    </p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>Share of total pending</span>
                        <span>{loading ? "..." : `${share}%`}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-linear-to-r ${card.meta.gradient} transition-all duration-500`}
                          style={{ width: loading ? "0%" : `${share}%` }}
                        />
                      </div>
                    </div>

                    <p className="mt-4 text-xs font-medium text-[#A77A95] opacity-0 group-hover:opacity-100 transition-opacity">
                      Open requests list →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-800">
              Recent Pending
            </h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Latest registration requests in your school
            </p>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-14 rounded-xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : recentRequests.length ? (
              <ul className="space-y-3">
                {recentRequests.map((requestUser) => (
                  <li
                    key={requestUser._id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAEEE9] text-[#A77A95] font-semibold text-sm">
                      {requestUser.firstName?.[0]}
                      {requestUser.lastName?.[0] || ""}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {requestUser.firstName} {requestUser.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {ROLE_LABELS[requestUser.role] || requestUser.role}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${
                        requestUser.actionable
                          ? "bg-[#FAEEE9] text-[#8F6580]"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {requestUser.actionable ? "Action" : "View"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">
                No pending requests right now.
              </p>
            )}

            <Link
              to="/admin/requests"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#C3C3D5] bg-[#FAEEE9] py-2.5 text-sm font-semibold text-[#8F6580] hover:bg-[#FAEEE9] transition"
            >
              Manage all requests
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="bg-linear-to-br from-[#FAEEE9] to-white rounded-2xl border border-[#C3C3D5] p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[#735366]">
              Your Permissions
            </h2>
            <ul className="mt-4 space-y-3">
              {stats.map((card) => (
                <li
                  key={card.role}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-slate-700">{card.title}</span>
                  <span
                    className={`font-semibold ${
                      card.actionable ? "text-[#A77A95]" : "text-slate-400"
                    }`}
                  >
                    {card.actionable ? "Approve / Reject" : "View only"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
