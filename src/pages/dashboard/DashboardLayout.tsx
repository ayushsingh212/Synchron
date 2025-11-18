import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useOrganisation } from "../../context/OrganisationContext";
import { useAppState } from "../../config";

const DashboardLayout: React.FC = () => {
  const { organisation, logout } = useOrganisation();
  const { sidebarOpen, setSidebarOpen } = useAppState();

  return (
    <div className="min-h-[80vh] flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r p-4 w-64 ${sidebarOpen ? "" : "hidden md:block"}`}>
        <div className="mb-6">
          <div className="font-semibold">Dashboard</div>
          <div className="text-sm text-slate-600">{organisation?.name}</div>
        </div>

        <nav className="flex flex-col gap-2">
          <NavLink to="organisation-info" className={({ isActive }) => isActive ? "font-medium text-brand-500" : "text-slate-700"}>
            Organisation Info
          </NavLink>
          <NavLink to="organisation-data-taker" className={({ isActive }) => isActive ? "font-medium text-brand-500" : "text-slate-700"}>
            Data Input
          </NavLink>
          <NavLink to="upload-pdf" className={({ isActive }) => isActive ? "font-medium text-brand-500" : "text-slate-700"}>
            Upload PDF (Utilities)
          </NavLink>
          <NavLink to="timetables" className={({ isActive }) => isActive ? "font-medium text-brand-500" : "text-slate-700"}>
            Manage Timetables
          </NavLink>
        </nav>

        <div className="mt-6">
          <button onClick={() => logout()} className="text-sm text-red-600">Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden px-2 py-1 border rounded">Menu</button>
          <h2 className="text-xl font-semibold">Organisation Dashboard</h2>
        </div>

        <div className="bg-muted p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
