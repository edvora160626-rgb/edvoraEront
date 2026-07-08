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
import { fetchAllViewableRequests } from "../../utils/requestsApi";

const ROLE_META = {
  SCHOOL_ADMIN: {
    icon: ShieldCheck,
    gradient: "from-violet-600 to-purple-700",
    light: "bg-violet-50 text-violet-700",
  },
  OFFICE: {
    icon: Building2,
    gradient: "from-sky-500 to-cyan-600",
    light: "bg-sky-50 text-sky-700",
  },
  TEACHER: {
    icon: UserCheck,
    gradient: "from-indigo-500 to-blue-600",
    light: "bg-indigo-50 text-indigo-700",
  },
  STUDENT: {
    icon: GraduationCap,
    gradient: "from-fuchsia-500 to-pink-600",
    light: "bg-fuchsia-50 text-fuchsia-700",
  },
  PARENT: {
    icon: Users,
    gradient: "from-purple-500 to-violet-600",
    light: "bg-purple-50 text-purple-700",
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
  const [groupedRequests, setGroupedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchAllViewableRequests(undefined, getViewRoles());
        setGroupedRequests(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const groupMap = new Map(
      groupedRequests.map(({ role, users }) => [role, users])
    );

    return displayOrder.map((role) => ({
      role,
      title: ROLE_LABELS[role] || role,
      count: groupMap.get(role)?.length || 0,
      actionable: canActOnRole(role),
      users: groupMap.get(role) || [],
      meta: ROLE_META[role] || ROLE_META.SCHOOL_ADMIN,
    }));
  }, [groupedRequests, displayOrder]);

  const totalPending = stats.reduce((sum, item) => sum + item.count, 0);
  const actionablePending = stats
    .filter((item) => item.actionable)
    .reduce((sum, item) => sum + item.count, 0);
  const viewOnlyPending = totalPending - actionablePending;

  const recentRequests = useMemo(() => {
    return stats
      .flatMap(({ role, users, actionable }) =>
        users.map((requestUser) => ({
          ...requestUser,
          role: requestUser.role || role,
          actionable,
        }))
      )
      .slice(0, 5);
  }, [stats]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#7F56D9] via-[#6941C6] to-[#53389E] text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[#C4B5FD]/20 blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm mb-4">
              <Sparkles size={14} />
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
            <div className="rounded-xl bg-white/15 backdrop-blur-md border border-white/20 p-4">
              {loading ? (
                <StatSkeleton />
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-white/80">Needs Action</p>
                  <p className="text-3xl sm:text-4xl font-bold mt-1">
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
            <ShieldCheck size={20} className="text-[#7F56D9]" />
          </div>
          <p className="text-3xl font-bold text-[#7F56D9]">
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
            <Clock size={20} className="text-[#6941C6]" />
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
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#7F56D9] hover:text-[#6941C6] transition"
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
                      ? "border-[#C4B5FD] shadow-[0_8px_30px_rgba(127,86,217,0.12)]"
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
                            ? "bg-[#F3E8FF] text-[#7F56D9]"
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

                    <p className="mt-4 text-xs font-medium text-[#7F56D9] opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7F56D9] font-semibold text-sm">
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
                          ? "bg-[#EDE9FE] text-[#6941C6]"
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
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E9D5FF] bg-[#FAF5FF] py-2.5 text-sm font-semibold text-[#6941C6] hover:bg-[#F3E8FF] transition"
            >
              Manage all requests
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="bg-linear-to-br from-[#FAF5FF] to-white rounded-2xl border border-[#E9D5FF] p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[#2E1065]">
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
                      card.actionable ? "text-[#7F56D9]" : "text-slate-400"
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
