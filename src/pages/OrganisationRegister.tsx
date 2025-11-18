import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, Lock } from "lucide-react";

const OrganisationRegister: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    type: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: register call
      await new Promise((r) => setTimeout(r, 700));
      navigate(`/verify-email/${encodeURIComponent(form.email)}`);
    } catch (err) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-lg border border-slate-200">
        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
          Create Organisation
        </h2>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Organisation Name */}
          <div className="relative">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Organisation Name"
              className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <Building2 className="absolute left-4 top-3.5 text-slate-500 h-5" />
          </div>

          {/* Organisation Type */}
          <div className="relative">
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="" disabled>
                Select organisation type
              </option>
              <option value="school">School</option>
              <option value="university">University</option>
              <option value="company">Company</option>
            </select>
            <Building2 className="absolute left-4 top-3.5 text-slate-500 h-5" />
          </div>

          {/* Email */}
          <div className="relative">
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <Mail className="absolute left-4 top-3.5 text-slate-500 h-5" />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <Lock className="absolute left-4 top-3.5 text-slate-500 h-5" />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-base font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating…" : "Create Organisation"}
          </button>

          {/* Login Redirect */}
          <p className="text-center text-slate-600 mt-3 text-sm">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default OrganisationRegister;
