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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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
  const [loginRole, setLoginRole] = useState<'authority' | 'senet'>('authority');
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  
  const { getOrganisation } = useOrganisation();

  const [formData, setFormData] = useState({
    email: "",
    contactNumber: "",
    password: "",
    otp: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const requestOtp = async () => {
    try {
      if (!formData.email) {
        toast.error("Please enter your email");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      setOtpLoading(true);
       
      if(role==="authority") {
          await axios.post(
        `${API_BASE_URL}/verification/getOtp/login-authority`,
        { 
          email: formData.email,
          role: loginRole // Send role for OTP verification
        },
        { withCredentials: true }
      );
      }
      else{
         await axios.post(
        `${API_BASE_URL}/verification/getOtp/login-authority`,
        { 
          email: formData.email,
          role: loginRole // Send role for OTP verification
        },
        { withCredentials: true }
      );
      }
  

      toast.success("OTP sent successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error sending OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const debouncedRequestOtp = useDebounce(requestOtp, 1500);

  const submitForm = async () => {
    try {
      // Validation
      if (loginMethod === "password") {
        if (!formData.email && !formData.contactNumber) {
          toast.error("Please enter email or contact number");
          return;
        }
        if (!formData.password) {
          toast.error("Please enter password");
          return;
        }
      } else {
        if (!formData.email) {
          toast.error("Please enter email");
          return;
        }
        if (!formData.otp) {
          toast.error("Please enter OTP");
          return;
        }
      }

      setLoading(true);
      
      // Prepare login data with role
      const loginData = {
        ...formData,
        role: loginRole
      };

      // Remove empty fields
      Object.keys(loginData).forEach(key => {
        if (loginData[key] === "") {
          delete loginData[key];
        }
      });
     if(role==="authority") {
         const response = await axios.post(
        `${API_BASE_URL}/organisation/login`, 
        loginData, 
        { withCredentials: true }
        );
        console.log(response)
      } 
      else{
          const response = await axios.post(
        `${API_BASE_URL}/senate/login`, 
        loginData, 
        { withCredentials: true }
      );
      }
   

      toast.success("Login successful");

      // Store user role in context/local storage
      if (response.data.role) {
        localStorage.setItem('userRole', response.data.role);
        localStorage.setItem('organisationId', response.data.organisationId || '');
      }

      // Get organisation data
      await getOrganisation();

      window.dispatchEvent(new CustomEvent("close-both-modal"));
      
      // Redirect based on role
      if (loginRole === 'authority') {
        navigate("/dashboard/organisation-info");
      } else {
        navigate("/dashboard/manage-content");
      }
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) {
      submitForm();
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        email: "",
        contactNumber: "",
        password: "",
        otp: "",
      });
      setLoading(false);
      setOtpLoading(false);
      setLoginRole('authority');
      setLoginMethod('password');
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-blue-700 hover:text-blue-900 transition"
        aria-label="Close modal"
      >
        <X size={22} />
      </button>

      <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
        Organisation Login
      </h2>

      {/* Role Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Login as:
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setLoginRole('authority')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
              loginRole === 'authority'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
            }`}
          >
            <Shield size={18} />
            <span>Authority</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginRole('senet')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
              loginRole === 'senet'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
            }`}
          >
            <Briefcase size={18} />
            <span>Senet</span>
          </button>
        </div>
        
        {/* Role Description */}
        <div className="mt-3 text-xs text-gray-500">
          {loginRole === 'authority' ? (
            <p>✓ Organisation administrator with full access</p>
          ) : (
            <p>✓ Manage organisation content and operations</p>
          )}
        </div>
      </div>

      {/* Login Method Selection */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          type="button"
          onClick={() => setLoginMethod("password")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            loginMethod === "password"
              ? "bg-white text-blue-600 shadow"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod("otp")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            loginMethod === "otp"
              ? "bg-white text-blue-600 shadow"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          OTP Login
        </button>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {loginMethod === "password" ? (
          <>
            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-blue-600 h-5" />
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={
                  loginRole === 'authority' 
                    ? "Organisation Email" 
                    : "Your Email"
                }
                className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={loading}
              />
            </div>


            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-blue-600 h-5" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={loading}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/forgot-password");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition"
            >
              Forgot Password?
            </button>
          </>
        ) : (
          <>
            {/* OTP Login Email Input */}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-blue-600 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={loading || otpLoading}
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
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  disabled={loading}
                />
              </div>

              <button
                type="button"
                onClick={() => debouncedRequestOtp()}
                disabled={loading || otpLoading || !formData.email}
                className="px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {otpLoading ? "Sending..." : "Get OTP"}
              </button>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-base font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Processing..."
            : loginMethod === "password"
            ? `Login as ${loginRole === 'authority' ? 'Authority' : 'Senet'}`
            : "Verify & Login"}
        </button>
      </form>

      <p className="text-center text-blue-600 mt-6 text-sm">
        Don't have an account?
        <button
          type="button"
          className="font-medium underline ml-1 hover:text-blue-800 transition"
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