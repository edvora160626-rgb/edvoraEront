import { Suspense, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getUserRole } from "../../utils/auth";
import { getRoleConfig } from "../../utils/rolePermissions";
import EdvoraLoader from "../../common/EdvoraLoader";
import LogoutModal from "../../common/LogoutModal";
import ProfileModal from "../../common/ProfileModal";
import { logoutUser } from "../../redux/slices/authSlice";

const ROLE_DISPLAY = {
  SUPER_ADMIN: "Principal",
  SCHOOL_ADMIN: "School Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
};

const NAV_ITEMS = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/requests",
    label: "User Requests",
    icon: ClipboardList,
  },
  {
    to: "/admin/departments",
    label: "Departments",
    icon: Building2,
    roles: ["SCHOOL_ADMIN"],
  },
  {
    to: "/admin/classes",
    label: "Classes",
    icon: BookOpen,
    roles: ["SCHOOL_ADMIN"],
  },
  {
    to: "/admin/teacher-attendance",
    label: "Teacher Attendance",
    icon: ClipboardCheck,
    roles: ["SCHOOL_ADMIN"],
  },
  {
    to: "/admin/student-attendance",
    label: "Student Attendance",
    icon: UserRoundCheck,
    roles: ["TEACHER"],
  },
];

function getInitials(firstName = "", lastName = "") {
  const first = String(firstName || "").trim()[0] || "";
  const last = String(lastName || "").trim()[0] || "";
  return (first + last).toUpperCase() || "U";
}

function SidebarNav({ onNavigate, onOpenProfile }) {
  const role = getUserRole();
  const user = useSelector((state) => state.auth.user);
  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  );
  const displayRole = ROLE_DISPLAY[role] || role;

  return (
    <nav className="px-3 space-y-1.5">
      <button
        type="button"
        onClick={onOpenProfile}
        className="mb-3 flex w-full items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-left transition hover:bg-white/15"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#F5D69B] to-[#A77A95] text-sm font-bold text-white shadow-md">
          {user ? (
            getInitials(user.firstName, user.lastName)
          ) : (
            <UserRound size={18} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-white truncate">
            {user
              ? [user.firstName, user.lastName].filter(Boolean).join(" ")
              : "Profile"}
          </span>
          <span className="block text-xs text-white/65 truncate">
            {displayRole || "View profile"}
          </span>
        </span>
      </button>

      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        Main Menu
      </p>

      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to.endsWith("/dashboard")}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-white text-[#8F6580] shadow-md"
                : "text-white/85 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#FAEEE9] text-[#A77A95]"
                    : "bg-white/10 text-white group-hover:bg-white/15"
                }`}
              >
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function UserProfile({ onLogout }) {
  const user = useSelector((state) => state.auth.user);
  const role = getUserRole();
  const displayRole = ROLE_DISPLAY[role] || role;

  return (
    <div className="mt-auto border-t border-white/10 p-4">
      <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#F5D69B] to-[#A77A95] text-sm font-bold text-white shadow-md">
            {getInitials(user?.firstName, user?.lastName)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-white/65 truncate">{displayRole}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { portalTitle } = getRoleConfig();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    await dispatch(logoutUser());
    setLogoutModalOpen(false);
    navigate("/");
  };

  const handleOpenProfile = () => {
    setProfileModalOpen(true);
    closeSidebar();
  };

  const sidebarContent = (
    <>
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#F5D69B] to-[#A77A95] border border-[#F5D69B]/50 shadow-inner">
              <GraduationCap size={22} className="text-[#735366]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-white leading-tight truncate">
                Edvora
              </p>
              <p className="text-[11px] text-[#F5D69B]/90 truncate">{portalTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-white/10 min-[1024px]:hidden shrink-0"
            aria-label="Close menu"
          >
            <X size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 py-2 overflow-y-auto">
        <SidebarNav
          onNavigate={closeSidebar}
          onOpenProfile={handleOpenProfile}
        />
      </div>

      <UserProfile onLogout={handleLogoutClick} />
    </>
  );

  return (
    <div className="h-screen overflow-hidden bg-[#FAEEE9] flex flex-col min-[1024px]:flex-row">
      <header className="sticky top-0 z-30 bg-white border-b border-[#C3C3D5] shadow-sm min-[1024px]:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#A77A95] text-white">
              <GraduationCap size={18} />
            </div>
            <span className="text-sm font-bold text-[#735366] truncate">
              {portalTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[#A77A95] hover:bg-[#FAEEE9]"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#735366]/40 backdrop-blur-[2px] min-[1024px]:hidden"
          onClick={closeSidebar}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-tr-[28px] rounded-br-[28px] bg-linear-to-b from-[#735366] via-[#8F6580] to-[#A77A95] text-white shadow-2xl transition-transform duration-300 ease-in-out min-[1024px]:relative min-[1024px]:z-auto min-[1024px]:translate-x-0 min-[1024px]:my-3 min-[1024px]:ml-3 min-[1024px]:h-[calc(100vh-24px)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full min-[1024px]:translate-x-0"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-tr-[28px] rounded-br-[28px]">
          <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[#F5D69B]/20" />
          <div className="absolute bottom-20 -left-10 h-32 w-32 rounded-full bg-[#C3C3D5]/20" />
        </div>

        <div className="relative flex h-full flex-col">{sidebarContent}</div>
      </aside>

      <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 min-[1024px]:p-8 min-[1024px]:pr-6 min-w-0">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <EdvoraLoader message="Loading…" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <LogoutModal
        open={logoutModalOpen}
        title="Logout Confirmation"
        description="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutModalOpen(false)}
      />

      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}

export default AdminLayout;
