import React from "react";
import { Outlet, NavLink , useLocation } from "react-router-dom";
import { useOrganisation } from "../../context/OrganisationContext";
import { useAppState } from "../../config";
import { X, Menu } from "lucide-react";

const AuthorityDashboardLayout: React.FC = () => {
  const { organisation, logout } = useOrganisation();
  const { sidebarOpen, setSidebarOpen } = useAppState();

    const location = useLocation();
  const pathname = location.pathname;

  const getPageTitle = () => {
    if (pathname.includes("organisation-info")) {
      return "Institution Overview";
    }
    if (pathname.includes("organisation-data-course")) {
      return "Academic Data Manager";
    }
    if (pathname.includes("timetables")) {
      return "Timetable Manager";
    }
    return "Institution Dashboard";
  };

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "text-blue-600 font-semibold bg-blue-50 rounded-lg px-3 py-2"
      : "text-slate-700 hover:bg-slate-100 rounded-lg px-3 py-2";

  return (
    <div className="flex min-h-screen bg-slate-50">

    
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}

    
      <aside
        className={`bg-white border-r shadow-sm w-64 p-5 flex flex-col gap-6 fixed inset-y-0 left-0 z-40 transform transition-transform md:static md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
     
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden mb-4 p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-2"
        >
          <X size={18} /> Close
        </button>

        <div>
          <div className="text-lg font-bold text-blue-600">Dashboard</div>
          <div className="text-lg font-bold text-blue-600">
            {organisation?.name || "Institution"}
          </div>
        </div>

        <nav className="flex flex-col gap-1 text-sm font-medium">
          <NavLink to="management-panel" onClick={() => setSidebarOpen(false)} className={linkClasses}>
            Institute Panel      
          </NavLink>

          <NavLink to="manage-senetes" onClick={() => setSidebarOpen(false)} className={linkClasses}>
            Assign Senete
          </NavLink>

      

          <NavLink to="manage-approvals" onClick={() => setSidebarOpen(false)} className={linkClasses}>
            Approve TimeTable
          </NavLink>
            <NavLink to="manage-documents" onClick={() => setSidebarOpen(false)} className={linkClasses}>
            Document Management
          </NavLink>
              <NavLink to="master-timetable" onClick={() => setSidebarOpen(false)} className={linkClasses}>
            Document Management
          </NavLink>
        </nav>

        {/* <button
          onClick={logout}
          className="text-red-600 text-sm mt-auto hover:bg-red-50 px-3 py-2 rounded-lg"
        >
          Logout
        </button> */}
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-6 p-6">

        <div className="flex items-center justify-between mb-6">
        
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden px-3 py-2 border border-slate-300 rounded-lg text-sm flex gap-2 items-center"
          >
            <Menu size={18} /> Menu
          </button>

          <h2 className="text-2xl font-semibold text-blue-600">
            {getPageTitle()}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboardLayout;
