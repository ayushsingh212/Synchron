import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { toast } from "react-toastify";
import { Mail, Lock, Eye, EyeOff, ChevronRight } from "lucide-react";

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) setCanResend(true);
  }, [timer, step]);

  const clearAuth = async () => {
    try {
      await axios.get(`${API_BASE_URL}/auth/logout`, { withCredentials: true });
    } catch {}
    document.cookie = "authToken=; Max-Age=0; path=/; secure; samesite=None";
    localStorage.clear();
    sessionStorage.clear();
  };

  const handleSendOtp = async () => {
    if (!email) return toast.error("Email is required");
    await clearAuth();

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/verification/getOtp/reset-password`,
        { organisationEmail: email },
        { withCredentials: true }
      );
      toast.success("OTP sent to your email");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setTimer(30);
      setCanResend(false);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (updatedOtp.every((d) => d !== "")) {
      handleVerifyOtp(updatedOtp.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        const updatedOtp = [...otp];
        updatedOtp[index - 1] = "";
        setOtp(updatedOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const otpArray = pasteData.split("");
    setOtp(otpArray);

    otpArray.forEach((digit, i) => {
      inputRefs.current[i]!.value = digit;
    });

    handleVerifyOtp(pasteData);
  };

  const handleVerifyOtp = async (enteredOtp: string) => {
    if (enteredOtp.length !== 6) return;

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/verification/verifyOtp`,
        { organisationEmail: email, otp: enteredOtp, purpose: "reset-password" },
        { withCredentials: true }
      );
      toast.success("OTP verified");
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;

    try {
      await axios.post(
        `${API_BASE_URL}/verification/getOtp/reset-password`,
        { organisationEmail: email },
        { withCredentials: true }
      );
      toast.success("OTP resent!");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setTimer(30);
      setCanResend(false);
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword)
      return toast.error("All fields are required");

    if (newPassword.length < 8)
      return toast.error("Password must be at least 8 characters long");

    if (newPassword !== confirmNewPassword)
      return toast.error("Passwords do not match");

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/password-reset/reset-password`,
        { newPassword, confirmNewPassword },
        { withCredentials: true }
      );
      toast.success("Password reset successful!");
      setTimeout(() => (window.location.href = "/"), 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-10 border border-blue-200">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-blue-500 text-transparent bg-clip-text">
            Reset Password
          </h1>
          <p className="text-gray-600 text-sm mt-2">Follow the steps to reset your password.</p>

          <div className="flex justify-center gap-3 mt-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-3 w-3 rounded-full ${step >= n ? "bg-blue-600" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="animate-fadeIn">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative mt-2 mb-6">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-10 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"} <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fadeIn">
            <label className="text-sm font-medium text-gray-700">Enter OTP</label>

            <div className="flex justify-between mt-4 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className="w-12 h-14 border rounded-xl text-center text-xl bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                />
              ))}
            </div>

            <button
              onClick={() => handleVerifyOtp(otp.join(""))}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"} <ChevronRight size={18} />
            </button>

            <div className="text-center mt-4 text-gray-700">
              {canResend ? (
                <button
                  onClick={resendOtp}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Resend OTP
                </button>
              ) : (
                <p>Resend OTP in <strong>{timer}s</strong></p>
              )}
            </div>

            <button
              className="w-full mt-4 text-blue-600 text-sm underline"
              onClick={() => setStep(1)}
            >
              Change Email
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fadeIn">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <div className="relative mt-2 mb-4">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Minimum 8 characters"
                className="w-full pl-10 pr-10 py-3 border bg-white rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div
                className="absolute right-3 top-3 cursor-pointer text-gray-500"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>

            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative mt-2 mb-6">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-10 py-3 border bg-white rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              <div
                className="absolute right-3 top-3 cursor-pointer text-gray-500"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"} <ChevronRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
