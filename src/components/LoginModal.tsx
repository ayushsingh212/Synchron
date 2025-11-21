import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { toast } from "react-toastify";
import { Mail, Lock, Hash, X } from "lucide-react";
import Modal from "./Modal";
import { useNavigate } from "react-router-dom";


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
  const [loginMethod, setLoginMethod] = useState("password");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [formData, setFormData] = useState({
    organisationEmailOrorganisationContactNumber: "",
    password: "",
    organisationEmail: "",
    otp: "",
  });

  
  const requestOtp = async () => {
    try {
      if (!formData.organisationEmail) {
        toast.error("Please enter your organisation email");
        return;
      }

     
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.organisationEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }

      setOtpLoading(true);

      await axios.post(
        `${API_BASE_URL}/verification/getOtp/login`,
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

  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  
  const submitForm = async () => {
    try {

      if (loginMethod === "password") {
        if (!formData.organisationEmailOrorganisationContactNumber) {
          toast.error("Please enter email or contact number");
          return;
        }
        if (!formData.password) {
          toast.error("Please enter password");
          return;
        }
      } else {
        if (!formData.organisationEmail) {
          toast.error("Please enter organisation email");
          return;
        }
        if (!formData.otp) {
          toast.error("Please enter OTP");
          return;
        }
      }

      setLoading(true);
      await axios.post(`${API_BASE_URL}/organisation/login`, formData, {
        withCredentials: true,
      });

      toast.success("Login successful");

      window.dispatchEvent(new CustomEvent("close-both-modal"));
      navigate("/dashboard/organisation-info");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSubmit = useDebounce(submitForm, 300);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) {
      submitForm(); 
    }
  };

 
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  
  useEffect(() => {
    if (!open) {
      setFormData({
        organisationEmailOrorganisationContactNumber: "",
        password: "",
        organisationEmail: "",
        otp: "",
      });
      setLoading(false);
      setOtpLoading(false);
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

      <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
        Organisation Login
      </h2>

     
      <div className="flex bg-blue-50 rounded-xl p-1 mb-8 border border-blue-200">
        <button
          type="button"
          onClick={() => setLoginMethod("password")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            loginMethod === "password"
              ? "bg-blue-600 text-white shadow"
              : "text-blue-600 hover:bg-blue-100"
          }`}
        >
          Password Login
        </button>

        <button
          type="button"
          onClick={() => setLoginMethod("otp")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            loginMethod === "otp"
              ? "bg-blue-600 text-white shadow"
              : "text-blue-600 hover:bg-blue-100"
          }`}
        >
          OTP Login
        </button>
      </div>

      {/* Login Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        {loginMethod === "password" ? (
          <>
            
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-blue-600 h-5" />
              <input
                type="text"
                name="organisationEmailOrorganisationContactNumber"
                value={formData.organisationEmailOrorganisationContactNumber}
                onChange={handleChange}
                placeholder="Email or Contact Number"
                className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={loading}
              />
            </div>

           
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
            
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-blue-600 h-5" />
              <input
                type="email"
                name="organisationEmail"
                value={formData.organisationEmail}
                onChange={handleChange}
                placeholder="Organisation Email"
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
                disabled={loading || otpLoading || !formData.organisationEmail}
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
            ? "Login"
            : "Verify & Login"}
        </button>
      </form>

     
      <p className="text-center mt-6 text-blue-600 text-sm">
        Don't have an account?
        <button
          type="button"
          className="font-medium underline ml-1 hover:text-blue-800 transition"
          onClick={() => {
            onClose();
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("open-register-modal"));
            }, 20);
          }}
        >
          Register
        </button>
      </p>
    </Modal>
  );
};

export default LoginModal;