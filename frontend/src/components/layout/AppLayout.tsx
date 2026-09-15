import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_NAV_ITEM, NAV_ITEMS, type NavItem } from "./navItems";

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const items: NavItem[] = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-gray-900 px-4 py-6 text-gray-300 md:flex">
        <div className="mb-8 px-2">
          <span className="rounded-lg bg-brand-600 px-4 py-2 text-lg font-bold text-white">
            Tracky
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span aria-hidden className="text-base">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-8">
          <span className="text-base font-semibold text-gray-900 md:hidden">Tracky</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 sm:inline">
              Hi, {user?.name}
            </span>
            <Button size="xs" color="light" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-8 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-200 bg-white md:hidden">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? "text-brand-600" : "text-gray-500"
              }`
            }
          >
            <span aria-hidden className="text-lg">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
