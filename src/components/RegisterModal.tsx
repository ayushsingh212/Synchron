import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import Modal from "./Modal";
import { Building2, Mail, Lock, Phone, Image as ImageIcon } from "lucide-react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RegisterModal: React.FC<Props> = ({ open, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    organisationName: "",
    organisationEmail: "",
    organisationContactNumber: "",
    password: "",
    avatar: null as File | null
  });

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;

    if (name === "organisationContactNumber") {
      let digits = value.replace(/\D/g, "");
      if (digits.length > 10) {
        digits = digits.slice(0, 10);
        toast.error("Contact number cannot exceed 10 digits");
      }
      setForm({ ...form, [name]: digits });
      return;
    }

    if (name === "avatar" && files && files.length > 0) {
      setForm({ ...form, avatar: files[0] });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => fd.append(key, val as any));

      const res = await axios.post(`${API_BASE_URL}/organisation/register`, fd, {
        withCredentials: true
      });

      toast.success("Registered successfully");

      await axios.post(
        `${API_BASE_URL}/verification/getOtp/register`,
        { organisationEmail: form.organisationEmail },
        { withCredentials: true }
      );

      window.location.href = `/verify-Email/${form.organisationEmail}`;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const openLoginInstead = () => {
    onClose();
    window.dispatchEvent(new CustomEvent("open-login-modal"));
  };

  const valid =
    form.organisationName.trim() &&
    form.organisationEmail.includes("@") &&
    form.organisationContactNumber.length === 10 &&
    form.password.length >= 8 &&
    form.avatar;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-600">Create Organisation</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <Building2 className="absolute left-3 top-3 text-blue-500 h-5" />
          <input
            name="organisationName"
            value={form.organisationName}
            onChange={handleChange}
            placeholder="Organisation Name"
            className="w-full pl-10 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-3 text-blue-500 h-5" />
          <input
            name="organisationEmail"
            value={form.organisationEmail}
            onChange={handleChange}
            placeholder="Organisation Email"
            type="email"
            className="w-full pl-10 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-3 top-3 text-blue-500 h-5" />
          <input
            name="organisationContactNumber"
            value={form.organisationContactNumber}
            onChange={handleChange}
            placeholder="Contact Number"
            maxLength={10}
            className="w-full pl-10 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 text-blue-500 h-5" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password (min 8 characters)"
            className="w-full pl-10 pr-10 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-100"
          />
          <span
            className="absolute right-3 top-3.5 cursor-pointer text-blue-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="relative">
          <div className="absolute left-3 top-3 text-blue-500">
            <ImageIcon size={18} />
          </div>
          <input
            name="avatar"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="w-full pl-10 py-3 rounded-lg border border-blue-200 bg-white"
          />
        </div>

        <button
          disabled={!valid || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Organisation"}
        </button>
      </form>

      <p className="text-center text-blue-600 mt-4 text-sm">
        Already have an account?
        <button
          onClick={openLoginInstead}
          className="font-medium underline ml-1 hover:text-blue-700"
        >
          Login
        </button>
      </p>
    </Modal>
  );
};

export default RegisterModal;
