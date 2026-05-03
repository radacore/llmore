"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  Key,
  BarChart3,
  CreditCard,
  Settings,
  Cpu,
  Shield,
  Users,
  Receipt,
  Layers,
  Activity,
  Menu,
  X,
  LogOut,
  ChevronDown,
  User,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const userNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Models", href: "/dashboard/models", icon: Cpu },
  { label: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { label: "Usage", href: "/dashboard/usage", icon: BarChart3 },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminNavItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: Shield },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  {
    label: "Transactions",
    href: "/dashboard/admin/transactions",
    icon: Receipt,
  },
  { label: "Plans", href: "/dashboard/admin/plans", icon: Layers },
  { label: "System", href: "/dashboard/admin/system", icon: Activity },
];

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

function DashboardNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        isActive
          ? "bg-royal-blue/10 text-royal-blue"
          : "text-dim-grey hover:bg-beige hover:text-washed-black"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${isActive ? "text-royal-blue" : "text-dim-grey"}`}
      />
      {item.label}
    </Link>
  );
}

function DashboardSidebarContent({
  isAdmin,
  pathname,
  onNavigate,
}: {
  isAdmin: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6">
        <Bot className="h-8 w-8 text-royal-blue" />
        <span className="text-lg font-bold text-washed-black">LLMore</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="px-3 py-2 text-xs font-semibold text-dim-grey uppercase tracking-wider">
          {isAdmin ? "Admin Panel" : "Menu"}
        </p>

        {navItems.map((item) => (
          <DashboardNavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}

        {!isAdmin && (
          <div className="pt-2">
            <Link
              href="/docs"
              target="_blank"
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-dim-grey hover:bg-beige hover:text-washed-black transition-colors"
            >
              <FileText className="h-5 w-5 text-dim-grey" />
              API Docs
            </Link>
          </div>
        )}
      </nav>

    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const sidebar = (
    <DashboardSidebarContent
      isAdmin={isAdmin}
      pathname={pathname}
      onNavigate={() => setSidebarOpen(false)}
    />
  );

  return (
    <AuthGuard>
      <div className="dashboard-shell min-h-screen bg-pearl">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — mobile */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-pure-white border-r border-washed-black/10 flex flex-col transform transition-transform duration-200 ease-in-out lg:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-dim-grey hover:text-washed-black hover:bg-beige"
              aria-label="Tutup sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {sidebar}
        </aside>

        {/* Sidebar — desktop */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col bg-pure-white border-r border-washed-black/10">
          {sidebar}
        </aside>

        {/* Main content */}
        <div className="lg:pl-72">
          {/* Top bar */}
          <header className="sticky top-0 z-20 bg-pure-white/80 backdrop-blur-sm border-b border-washed-black/10">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-dim-grey hover:text-washed-black hover:bg-beige"
                aria-label="Buka sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex-1" />

              {/* Theme toggle */}
              <div className="mr-2">
                <ThemeToggle variant="compact" />
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-beige transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-royal-blue/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-royal-blue">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-washed-black/80">
                    {user?.name || "User"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-dim-grey" />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-pure-white rounded-xl border border-washed-black/10 py-2 z-20">
                      <div className="px-4 py-3 border-b border-washed-black/10">
                        <p className="text-sm font-medium text-washed-black">
                          {user?.name}
                        </p>
                        <p className="text-xs text-dim-grey">{user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-washed-black/80 hover:bg-pearl"
                      >
                        <User className="h-4 w-4 text-dim-grey" />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
