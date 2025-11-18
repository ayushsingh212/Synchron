import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { Mail, Lock, Hash } from "lucide-react";

const OrganisationLogin = () => {
  const [loginMethod, setLoginMethod] = useState("password");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    organisationEmailOrorganisationContactNumber: "",
    password: "",
    organisationEmail: "",
    otp: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOtp = async () => {
    try {
      if (!formData.organisationEmail) {
        toast.error("Please enter your email");
        return;
      }
      setLoading(true);

      await axios.post(
        `${API_BASE_URL}/verification/getOtp/login`,
        { organisationEmail: formData.organisationEmail },
        { withCredentials: true }
      );

      toast.success("OTP has been sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE_URL}/organisation/login`,
        formData,
        { withCredentials: true }
      );

      toast.success("Login successful");
      navigate("/dashboard/organisation-info");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md backdrop-blur-xl border border-slate-200">
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-blue-700 drop-shadow-sm">
          Organisation Login
        </h2>

        {/* Toggle Buttons */}
        <div className="flex mt-6 bg-slate-100 rounded-xl overflow-hidden p-1">
          <button
            onClick={() => setLoginMethod("password")}
            className={`flex-1 py-2 rounded-lg transition-all text-sm font-semibold
              ${
                loginMethod === "password"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-600"
              }`}
          >
            Password Login
          </button>
          <button
            onClick={() => setLoginMethod("otp")}
            className={`flex-1 py-2 rounded-lg transition-all text-sm font-semibold
              ${
                loginMethod === "otp"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-600"
              }`}
          >
            OTP Login
          </button>
        </div>

        {/* Form */}
        <form className="space-y-5 mt-8" onSubmit={handleSubmit}>
          {loginMethod === "password" ? (
            <>
              {/* Email or Contact */}
              <div className="relative">
                <input
                  type="text"
                  name="organisationEmailOrorganisationContactNumber"
                  value={formData.organisationEmailOrorganisationContactNumber}
                  onChange={handleChange}
                  placeholder="Email or Contact Number"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <Mail className="absolute left-4 top-3.5 text-slate-500 h-5" />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <Lock className="absolute left-4 top-3.5 text-slate-500 h-5" />
              </div>
            </>
          ) : (
            <>
              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  name="organisationEmail"
                  value={formData.organisationEmail}
                  onChange={handleChange}
                  placeholder="Organisation Email"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <Mail className="absolute left-4 top-3.5 text-slate-500 h-5" />
              </div>

              {/* OTP */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="Enter OTP"
                    className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                  <Hash className="absolute left-4 top-3.5 text-slate-500 h-5" />
                </div>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Get OTP"}
                </button>
              </div>
            </>
          )}

          {/* Login Button */}
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

        {/* Register Link */}
        <p className="text-center mt-6 text-slate-600 text-sm">
          Don’t have an account?{" "}
          <a href="/register" className="text-blue-600 font-medium hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default OrganisationLogin;
