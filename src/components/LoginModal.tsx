import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { toast } from "react-toastify";
import { Mail, Lock, Hash, X, Shield, Briefcase } from "lucide-react";
import Modal from "./Modal";
import { useNavigate } from "react-router-dom";
import { useOrganisation } from "../context/OrganisationContext";

const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunction = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return debouncedFunction;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<Props> = ({ open, onClose }) => {
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [loginRole, setLoginRole] = useState<"authority" | "senate">("authority");

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const { getOrganisation } = useOrganisation();

  const [formData, setFormData] = useState({
    organisationEmail: "",
    organisationContactNumber: "",
    senateId: "",
    password: "",
    otp: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const requestOtp = async () => {
    if (loginRole !== "authority") {
      toast.error("OTP login is not available for Senate.");
      return;
    }

    try {
      if (!formData.organisationEmail) {
        toast.error("Please enter your organisation email");
        return;
      }

      const organisationEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!organisationEmailRegex.test(formData.organisationEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }

      setOtpLoading(true);

      await axios.post(`
        ${API_BASE_URL}/verification/getOtp/login`,
        { organisationEmail: formData.organisationEmail },
        { withCredentials: true }
      );

      toast.success("OTP sent successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error sending OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const debouncedRequestOtp = useDebounce(requestOtp, 1500);

  // 🎯 SUBMIT
  const submitForm = async () => {
    try {
      setLoading(true);
      let response;

      // ---------- PASSWORD LOGIN ----------
      if (loginMethod === "password" || loginRole === "senate") {
        if (loginRole === "authority") {
          response = await axios.post(`
            ${API_BASE_URL}/organisation/login`,
            {
              organisationEmailOrorganisationContactNumber:
                formData.organisationEmail || formData.organisationContactNumber,
              password: formData.password,
            },
            { withCredentials: true }
          );
        } else {
          response = await axios.post(`
            ${API_BASE_URL}/senate/login`,
            {
              organisationEmail: formData.organisationEmail,
              senateId: formData.senateId,
              password: formData.password,
            },
            { withCredentials: true }
          );
        }
      }

      // ---------- OTP LOGIN (Authority only) ----------
      else {
        if (!formData.otp) {
          toast.error("Please enter OTP");
          return;
        }

        response = await axios.post(`
          ${API_BASE_URL}/organisation/login`,
          {
            organisationEmail: formData.organisationEmail,
            otp: formData.otp,
            role: loginRole,
          },
          { withCredentials: true }
        );
      }

      toast.success("Login successful");

      localStorage.setItem("userRole", loginRole);
      if (response.data.organisationId)
        localStorage.setItem("organisationId", response.data.organisationId);

      await getOrganisation();

      window.dispatchEvent(new CustomEvent("close-both-modal"));

      loginRole === "authority"
        ? navigate("/authority-dashboard/management-panel")
        : navigate("/dashboard/organisation-info");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) submitForm();
  };

  // RESET WHEN MODAL CLOSES
  useEffect(() => {
    if (!open) {
      setFormData({
        organisationEmail: "",
        organisationContactNumber: "",
        senateId: "",
        password: "",
        otp: "",
      });
      setLoginMethod("password");
      setLoginRole("authority");
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-blue-700 hover:text-blue-900 transition"
      >
        <X size={22} />
      </button>

      <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
        Organisation Login
      </h2>

      {/* SELECT ROLE */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Login as:
        </label>

        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setLoginRole("authority")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
              loginRole === "authority"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700"
            }`}
          >
            <Shield size={18} /> Authority
          </button>

          <button
            type="button"
            onClick={() => setLoginRole("senate")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
              loginRole === "senate"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700"
            }`}
          >
            <Briefcase size={18} /> Senate
          </button>
        </div>

        {/* LOGIN METHOD — ONLY AUTHORITY */}
        {loginRole === "authority" && (
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod("password")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
                loginMethod === "password"
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-600"
              }`}
            >
              Password Login
            </button>

            <button
              type="button"
              onClick={() => setLoginMethod("otp")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
                loginMethod === "otp"
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-600"
              }`}
            >
              OTP Login
            </button>
          </div>
        )}
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* PASSWORD LOGIN or SENATE LOGIN */}
        {loginMethod === "password" || loginRole === "senate" ? (
          <>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-blue-600 h-5" />
              <input
                type="text"
                name="organisationEmail"
                value={formData.organisationEmail}
                onChange={handleChange}
                placeholder="Organisation Email"
                className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200"
              />
            </div>

            {loginRole === "senate" && (
              <div className="relative">
                <Hash className="absolute left-4 top-3.5 text-blue-600 h-5" />
                <input
                  type="text"
                  name="senateId"
                  value={formData.senateId}
                  onChange={handleChange}
                  placeholder="Enter Senate ID"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200"
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-blue-600 h-5" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200"
              />
            </div>
          </>
        ) : (
          <>
            {/* OTP LOGIN — AUTHORITY ONLY */}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-blue-600 h-5" />
              <input
                type="email"
                name="organisationEmail"
                value={formData.organisationEmail}
                onChange={handleChange}
                placeholder="Enter your organisation email"
                className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200"
                disabled={otpLoading}
              />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-4 top-3.5 text-blue-600 h-5" />
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter OTP"
                  maxLength={6}
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200"
                />
              </div>

              <button
                type="button"
                onClick={() => debouncedRequestOtp()}
                disabled={otpLoading || !formData.organisationEmail}
                className="px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold"
              >
                {otpLoading ? "Sending..." : "Get OTP"}
              </button>
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
        >
          {loading
            ? "Processing..."
            : loginMethod === "password"
            ? `Login as ${loginRole}`
            : "Verify & Login"}
        </button>
      </form>

      <p className="text-center text-blue-600 mt-6 text-sm">
        Don't have an account?
        <button
          type="button"
          className="font-medium underline ml-1"
          onClick={() => {
            onClose();
            window.dispatchEvent(new CustomEvent("open-register-modal"));
          }}
        >
          Register Organisation
        </button>
      </p>
    </Modal>
  );
};

export default LoginModal;