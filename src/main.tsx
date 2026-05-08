import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from "react-router-dom";

import "./index.css";

// Layout (always loaded eagerly — it's the shell)
import Temp from "./layouts/Temp";

// Components loaded eagerly (small, critical path)
import ProtectedRoute from "./components/ProtectRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSkeleton from "./components/LoadingSkeleton";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { OrganisationProvider } from "./context/OrganisationContext";
import StateContextProvider from "./config";

// ── Lazy-loaded pages (code-split) ──────────────────────────
const Home = React.lazy(() => import("./pages/Home"));
const About = React.lazy(() => import("./pages/About"));
const Contact = React.lazy(() => import("./pages/Contact"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const VerifyEmail = React.lazy(() => import("./pages/VerifyEmail"));
const AccessDenied = React.lazy(() => import("./pages/AccessDenied"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const CourseSelection = React.lazy(() => import("./pages/CourseSelection"));
const YearSelection = React.lazy(() => import("./pages/YearSelection"));
const AcademicDataPage = React.lazy(() => import("./pages/AcademicDataPage"));

// Dashboard pages
const DashboardLayout = React.lazy(() => import("./pages/dashboard/DashboardLayout"));
const OrganisationInfo = React.lazy(() => import("./pages/dashboard/OrganisationInfo"));
const OrganisationDataTaker = React.lazy(() => import("./pages/dashboard/OrganisationDataTaker"));
const TimetableManager = React.lazy(() => import("./pages/dashboard/TimetableManager"));
const UploadPdf = React.lazy(() => import("./pages/dashboard/UploadPdf"));
const SectionTimeTable = React.lazy(() => import("./pages/dashboard/SectionTimeTable"));
const FacultyTimeTable = React.lazy(() => import("./pages/dashboard/FacultyTimeTable"));
const DocumentManagement = React.lazy(() => import("./pages/dashboard/DocumentManagement"));
const FacultyDashboard = React.lazy(() => import("./pages/dashboard/Faculty/FacultyDashboard"));
const TimeTableVariantViewer = React.lazy(() => import("./pages/dashboard/TimTableViewer"));

// Authority dashboard
const AuthorityDashboard = React.lazy(() => import("./pages/AuthorityDashboard"));
const AuthorityDashboardLayout = React.lazy(() => import("./pages/dashboard/AuthorityDashboard"));
const AssignSenete = React.lazy(() => import("./components/authority/AssignSenete"));
const ManageApprovals = React.lazy(() => import("./components/authority/ManageApproval"));
const TimetableApprovalNotice = React.lazy(() => import("./components/TimeTableSent"));
const ViewFaculty = React.lazy(() => import("./components/faculty/ViewFaculty"));
const MasterTimetable = React.lazy(() => import("./components/authority/MasterTimeTable"));

// ── Suspense wrapper for lazy routes ────────────────────────
const Lazy: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSkeleton />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Temp />}>

      <Route index element={<Lazy><Home /></Lazy>} />
      <Route path="about" element={<Lazy><About /></Lazy>} />
      <Route path="contact" element={<Lazy><Contact /></Lazy>} />
      <Route path="/facultyTimeTable/:courseId/:year/:semester/:facultyId" element={<Lazy><FacultyTimeTable /></Lazy>} />
      <Route path="/sectionTimeTable/:c/:year/:semester/:sectionId" element={<Lazy><SectionTimeTable /></Lazy>} />

      {/* Email Verification */}
      <Route path="verify-email/:organisationEmail" element={<Lazy><VerifyEmail /></Lazy>} />
      <Route path="forgot-password" element={<Lazy><ForgotPassword /></Lazy>} />

      {/* Access Denied */}
      <Route path="access-denied" element={<Lazy><AccessDenied /></Lazy>} />

      <Route path="Faculty" element={<ProtectedRoute><Lazy><FacultyDashboard /></Lazy></ProtectedRoute>} />

      <Route path="authority-dashboard" element={<ProtectedRoute><Lazy><AuthorityDashboardLayout /></Lazy></ProtectedRoute>}>
        <Route path="management-panel" element={<Lazy><AuthorityDashboard /></Lazy>} />
        <Route path="manage-variants/:courseId/:year/:semester" element={<Lazy><TimeTableVariantViewer /></Lazy>} />
        <Route path="manage-senetes" element={<Lazy><AssignSenete /></Lazy>} />
        <Route path="manage-documents" element={<Lazy><DocumentManagement /></Lazy>} />
        <Route path="manage-approvals" element={<Lazy><ManageApprovals /></Lazy>} />
        <Route path="master-timetable" element={<Lazy><MasterTimetable /></Lazy>} />
      </Route>

      <Route path="viewFaculty/:facultyId" element={<ProtectedRoute><Lazy><ViewFaculty /></Lazy></ProtectedRoute>} />

      {/* Dashboard (Protected) */}
      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <Lazy><DashboardLayout /></Lazy>
          </ProtectedRoute>
        }
      >
        <Route path="organisation-info" element={<Lazy><OrganisationInfo /></Lazy>} />
        <Route path="organisation-data-course" element={<Lazy><CourseSelection /></Lazy>} />
        <Route path="organisation-documents" element={<Lazy><DocumentManagement /></Lazy>} />
        <Route path="timetable-sent" element={<Lazy><TimetableApprovalNotice /></Lazy>} />
        <Route path="organisation-data-taker/:courseId/years" element={<Lazy><YearSelection /></Lazy>} />
        <Route path="organisation-data-taker/:courseId/:year/:semester/data" element={<Lazy><AcademicDataPage /></Lazy>} />
        <Route path="organisation-data-taker" element={<Lazy><OrganisationDataTaker /></Lazy>} />
        <Route path="upload-pdf/:courseId/:year/:semester" element={<Lazy><UploadPdf /></Lazy>} />
        <Route path="timetables" element={<Lazy><TimetableManager /></Lazy>} />
        <Route path="facultyTimeTable/:courseId/:year/:semester" element={<Lazy><FacultyTimeTable /></Lazy>} />
        <Route path="sectionTimeTable/:courseId/:year/:semester" element={<Lazy><SectionTimeTable /></Lazy>} />
        <Route path="manage-timetable" element={<Lazy><TimetableManager /></Lazy>} />
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<Lazy><NotFound /></Lazy>} />
    </Route>
  )
);


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <OrganisationProvider>
        <StateContextProvider>
          <RouterProvider router={router} />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </StateContextProvider>
      </OrganisationProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
