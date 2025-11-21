import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from "react-router-dom";

import "./index.css";

// Layout
import Temp from "./layouts/Temp";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import VerifyEmail from "./pages/VerifyEmail";
import AccessDenied from "./pages/AccessDenied";


import DashboardLayout from "./pages/dashboard/DashboardLayout";
import OrganisationInfo from "./pages/dashboard/OrganisationInfo";
import OrganisationDataTaker from "./pages/dashboard/OrganisationDataTaker";
import TimetableManager from "./pages/dashboard/TimetableManager";
import UploadPdf from "./pages/dashboard/UploadPdf";
import SectionTimeTable from "./pages/dashboard/SectionTimeTable";
import FacultyTimeTable from "./pages/dashboard/FacultyTimeTable";

// Auth Guard
// import ProtectedRoute from "./components/ProtectedRoute";

// Global Providers
// import { OrganisationProvider } from "./context/organisationContext";
// import StateContextProvider from "./config";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { OrganisationProvider } from "./context/OrganisationContext";
import StateContextProvider from "./config";
import CourseSelection from "./pages/CourseSelection";
import YearSelection from "./pages/YearSelection";
import AcademicDataPage from "./pages/AcademicDataPage";
import ForgotPassword from "./pages/ForgotPassword"
import VariantListPage from "./pages/VariantListPage";
import VariantViewerPage from "./pages/VariantViewerPage";


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Temp />}>

      <Route index element={<Home />} />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />


      {/* <Route path="login-register" element={<OrganisationRegister />} /> */}

      {/* Email Verification */}
      <Route path="verify-email/:organisationEmail" element={<VerifyEmail />} />
      <Route path="forgot-password" element={<ForgotPassword />}></Route>
      {/* Access Denied */}
      <Route path="access-denied" element={<AccessDenied />} />

      {/* Dashboard (Protected) */}
      <Route
        path="dashboard"
        element={
          // <ProtectedRoute>
          <DashboardLayout />
          // </ProtectedRoute>
        }
      >
        <Route path="organisation-info" element={<OrganisationInfo />} />
        <Route path="organisation-data-course" element={<CourseSelection />} />
        <Route path="organisation-data-taker/:courseId/years" element={<YearSelection />} />
        <Route path="organisation-data-taker/:courseId/:year/:semester/data" element={<AcademicDataPage />} />
        <Route path="organisation-data-taker" element={<OrganisationDataTaker />} />
        <Route path="upload-pdf/:courseId/:year/:semester" element={<UploadPdf />} />
        <Route path="timetables" element={<TimetableManager />} />
        <Route path="facultyTimeTable/:courseId/:year/:semester" element={<FacultyTimeTable />} />
        <Route path="sectionTimeTable/:courseId/:year/:semester" element={<SectionTimeTable />} />
        <Route path="manage-timetable" element={<TimetableManager />} />
        <Route path="timetable/variants/:courseId/:year/:semester" element={<VariantListPage />} />
        <Route path="timetable/variant/view/:id" element={<VariantViewerPage />} />
      </Route>


    </Route>
  )
);


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OrganisationProvider>
      <StateContextProvider>
        <RouterProvider router={router} />
        <ToastContainer
          position="top-right"
          autoClose={1000}
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </StateContextProvider>
    </OrganisationProvider>
  </React.StrictMode>
);
