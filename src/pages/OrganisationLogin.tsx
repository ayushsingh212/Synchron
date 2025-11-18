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

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOtp = async () => {
    try {
      if (!formData.organisationEmail) {
        toast.error("Please enter your organisation email");
        return;
      }
      setLoading(true);

      await axios.post(
        `${API_BASE_URL}/verification/getOtp/login`,
        { organisationEmail: formData.organisationEmail },
        { withCredentials: true }
      );

      toast.success("OTP sent successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);

      await axios.post(
        `${API_BASE_URL}/organisation/login`,
        formData,
        { withCredentials: true }
      );

      toast.success("Login successful");
      navigate("/dashboard/organisation-info");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-600 px-4 py-10">
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-md border border-blue-100">

        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
          Organisation Login
        </h2>

        {/* Toggle Buttons */}
        <div className="flex bg-blue-50 rounded-xl p-1 mb-8 border border-blue-200">
          <button
            onClick={() => setLoginMethod("password")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition 
              ${loginMethod === "password"
                ? "bg-blue-600 text-white shadow"
                : "text-blue-600 hover:bg-blue-100"
              }`}
          >
            Password Login
          </button>

          <button
            onClick={() => setLoginMethod("otp")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition 
              ${loginMethod === "otp"
                ? "bg-blue-600 text-white shadow"
                : "text-blue-600 hover:bg-blue-100"
              }`}
          >
            OTP Login
          </button>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {loginMethod === "password" ? (
            <>
              {/* Email / Phone */}
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-blue-600 h-5" />
                <input
                  type="text"
                  name="organisationEmailOrorganisationContactNumber"
                  value={formData.organisationEmailOrorganisationContactNumber}
                  onChange={handleChange}
                  placeholder="Email or Contact Number"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-blue-600 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </>
          ) : (
            <>
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-blue-600 h-5" />
                <input
                  type="email"
                  name="organisationEmail"
                  value={formData.organisationEmail}
                  onChange={handleChange}
                  placeholder="Organisation Email"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* OTP */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-4 top-3.5 text-blue-600 h-5" />
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="Enter OTP"
                    className="w-full px-4 py-3 pl-12 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Get OTP"}
                </button>
              </div>
            </>
          )}

          {/* Submit Button */}
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
        <p className="text-center mt-6 text-blue-600 text-sm">
          Don’t have an account?{" "}
          <a href="/register" className="font-medium hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default OrganisationLogin;
