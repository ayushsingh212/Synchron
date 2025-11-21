import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { toast } from "react-toastify";
import { Mail, Lock } from "lucide-react";

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) return toast.error("Email is required");

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/verification/getOtp/reset-password`, {
        organisationEmail: email,
      });
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

 
  const handleVerifyOtp = async () => {
    if (!otp) return toast.error("Enter OTP");

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/verification/verifyOtp`, {
        organisationEmail: email,
        otp,
        purpose:"reset-password"
      });
      toast.success("OTP verified");
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

 
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword)
      return toast.error("All fields are required");

    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/password-reset/reset-password`, {
        organisationEmail: email,
        newPassword,
      });
      toast.success("Password reset successful!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">

        <h2 className="text-2xl font-semibold text-center mb-6">
          Forgot Password
        </h2>

      
        {step === 1 && (
          <>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <div className="relative mb-5">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full mt-1 pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        
        {step === 2 && (
          <>
            <label className="text-sm font-medium text-gray-600">Enter OTP</label>
            <input
              type="text"
              placeholder="6-digit OTP"
              className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              className="w-full mt-3 text-gray-600 underline"
              onClick={() => setStep(1)}
            >
              Change Email
            </button>
          </>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <>
            <label className="text-sm font-medium text-gray-600">New Password</label>
            <div className="relative mb-4">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="password"
                placeholder="Enter new password"
                className="w-full mt-1 pl-10 px-3 py-2 border rounded-lg"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <label className="text-sm font-medium text-gray-600">Confirm Password</label>
            <div className="relative mb-6">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full mt-1 pl-10 px-3 py-2 border rounded-lg"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
