// src/components/OrganisationInfo.tsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { useOrganisation } from "../../context/OrganisationContext";
import { Pencil, Trash2, Check, X, Upload, Repeat, Mail } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmModal from "../../modals/ConfirmModal";

type FormState = {
  organisationName: string;
  organisationEmail: string;
  organisationContactNumber: string;
  otp: string; // single-field backup (not used by OTP inputs)
};

const OrganisationInfo: React.FC = () => {
  const { organisation, setOrganisation, getOrganisation } = useOrganisation();

  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState<FormState>({
    organisationName: "",
    organisationEmail: "",
    organisationContactNumber: "",
    otp: "",
  });

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // OTP modal + controls
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpBoxes, setOtpBoxes] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [savingAfterOtp, setSavingAfterOtp] = useState(false);

  // store whether email was changed to require OTP
  const [emailChanged, setEmailChanged] = useState(false);

  // fetch organisation on mount
  const fetchOrg = async () => {
    const data = await getOrganisation();
    if (data) {
      setOrganisation(data);
      setForm({
        organisationName: data.organisationName || "",
        organisationEmail: data.organisationEmail || "",
        organisationContactNumber: data.organisationContactNumber || "",
        otp: "",
      });
    }
  };

  useEffect(() => {
    fetchOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // OTP timer effect
  useEffect(() => {
    if (!showOtpModal) return;
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const t = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [showOtpModal, timer]);

  // ---------- Avatar upload ----------
  const updateAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploading(true);

      const res = await axios.post(
        `${API_BASE_URL}/organisation/update-avatar`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      toast.success("Avatar updated");
      // backend returns { avatar: url } in controller, your earlier code expected res.data.data
      // pick up updated organisation via getOrganisation for consistency:
      await fetchOrg();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update avatar");
    } finally {
      setUploading(false);
    }
  };

  // ---------- Delete organisation ----------
  const deleteOrganisation = async () => {
    try {
      setDeleting(true);

      await axios.delete(`${API_BASE_URL}/organisation/delete`, {
        withCredentials: true,
      });

      toast.success("Organisation deleted");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  // ---------- Send OTP for updating email ----------
  const sendOtpForUpdate = async () => {
    if (!form.organisationEmail) {
      return toast.error("Please enter the new email first");
    }

    try {
      setOtpSending(true);
      setCanResend(false);
      setTimer(30);

      // backend route that issues OTP for update-profile
      await axios.post(
        `${API_BASE_URL}/verification/getOtp/update-profile`,
        { organisationEmail: form.organisationEmail },
        { withCredentials: true }
      );

      toast.success("OTP sent to your email");
      setOtpBoxes(["", "", "", "", "", ""]);
      setShowOtpModal(true);
      // focus first OTP input on next tick
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;
    try {
      setOtpSending(true);
      setCanResend(false);
      setTimer(30);

      await axios.post(
        `${API_BASE_URL}/verification/getOtp/update-profile`,
        { organisationEmail: form.organisationEmail },
        { withCredentials: true }
      );

      toast.success("OTP resent");
      setOtpBoxes(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (err) {
      console.error(err);
      toast.error("Failed to resend OTP");
    } finally {
      setOtpSending(false);
    }
  };

  // OTP input helpers
  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otpBoxes];
    next[index] = value;
    setOtpBoxes(next);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // auto-submit when all filled: we'll trigger verify attempt by clicking Verify
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otpBoxes[index] === "" && index > 0) {
        otpRefs.current[index - 1]?.focus();
        const next = [...otpBoxes];
        next[index - 1] = "";
        setOtpBoxes(next);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(paste)) return;
    const arr = paste.split("");
    setOtpBoxes(arr);
    arr.forEach((d, i) => {
      if (otpRefs.current[i]) otpRefs.current[i]!.value = d;
    });
  };

  // ---------- Verify OTP & update profile ----------
  const verifyOtpAndSave = async () => {
    const otpValue = otpBoxes.join("");
    if (otpValue.length !== 6) return toast.error("Enter 6-digit OTP");

    try {
      setSavingAfterOtp(true);

      const payload: any = {
        organisationName: form.organisationName,
        organisationContactNumber: form.organisationContactNumber,
        // include organisationEmail and otp to change email on backend
        organisationEmail: form.organisationEmail,
        otp: otpValue,
      };

      const res = await axios.post(
        `${API_BASE_URL}/organisation/updateProfile`, payload, {
        withCredentials: true,
      });

      const updated = res.data.data;
      toast.success("Profile updated successfully!");
      // update context & storage
      setOrganisation(updated);
      localStorage.setItem("org", JSON.stringify(updated));
      setEditing(false);
      setShowOtpModal(false);
      setEmailChanged(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to verify OTP / update profile");
    } finally {
      setSavingAfterOtp(false);
    }
  };

  // ---------- Save (entry click) ----------
  const save = async () => {
    // basic validation
    if (!form.organisationName?.trim()) return toast.error("Organisation name required");
    if (!form.organisationEmail?.trim()) return toast.error("Organisation email required");
    if (!/^\d{10}$/.test(form.organisationContactNumber || "")) {
      // optional: allow empty contact; if provided must be 10 digits
      if (form.organisationContactNumber) return toast.error("Contact must be 10 digits");
    }

    // If email changed, request OTP first (open modal by sending OTP)
    const originalEmail = organisation?.organisationEmail || "";
    const newEmail = (form.organisationEmail || "").trim();

    if (newEmail.toLowerCase() !== originalEmail.toLowerCase()) {
      setEmailChanged(true);
      // send OTP and open modal
      await sendOtpForUpdate();
      return;
    }

    // else update directly (no email change) — backend doesn't require OTP unless email provided
    try {
      setLoadingSave(true);

      const payload: any = {
        organisationName: form.organisationName,
        organisationContactNumber: form.organisationContactNumber,
        // don't include organisationEmail since not changing (optional)
      };

      const res = await axios.post(`${API_BASE_URL}/organisation/updateProfile`, payload, {
        withCredentials: true,
      });

      const updated = res.data.data;
      toast.success("Profile updated successfully!");
      setOrganisation(updated);
      localStorage.setItem("org", JSON.stringify(updated));
      setEditing(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoadingSave(false);
    }
  };

  if (!organisation) return <div className="text-blue-600">Loading...</div>;

  return (
    <>
      <div className="space-y-8 sm:space-y-10">
        <div className="bg-white border border-blue-200 rounded-2xl shadow-md p-6 flex flex-col items-center gap-4 sm:flex-row sm:gap-6 sm:items-start">
          <label className="relative cursor-pointer flex-shrink-0">
            <img
              src={organisation.avatar}
              alt="avatar"
              className="w-24 h-24 sm:w-20 sm:h-20 rounded-full border border-blue-300 object-cover"
            />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files && updateAvatar(e.target.files[0])}
            />
            <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full">
              <Upload size={16} />
            </div>
          </label>

          <div className="text-center sm:text-left flex-grow">
            <div className="text-xl sm:text-2xl font-bold text-blue-700">
              {organisation.organisationName}
            </div>
            <div className="text-sm sm:text-base text-slate-600">{organisation.organisationEmail}</div>
          </div>

          <div className="mt-2 sm:mt-0 sm:ml-auto flex gap-3">
            <button
              onClick={() => {
                setEditing(!editing);
                // reset form to current org if toggling to edit
                if (!editing && organisation) {
                  setForm({
                    organisationName: organisation.organisationName || "",
                    organisationEmail: organisation.organisationEmail || "",
                    organisationContactNumber: organisation.organisationContactNumber || "",
                    otp: "",
                  });
                  setEmailChanged(false);
                }
              }}
              className="p-2 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 transition"
            >
              {editing ? <X size={18} /> : <Pencil size={18} />}
            </button>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={deleting}
              className="p-2 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>

            <ConfirmModal
              open={showConfirm}
              onClose={() => setShowConfirm(false)}
              onConfirm={deleteOrganisation}
              title="Delete Organisation?"
              message="This action cannot be undone. Do you really want to delete your organisation?"
              confirmText="Delete"
              cancelText="Cancel"
            />
          </div>
        </div>

        {editing && (
          <div className="bg-white border border-blue-200 shadow-lg rounded-2xl p-6 w-full sm:max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-blue-700 mb-4">Update Organisation Profile</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-blue-700">Organisation Name</label>
                <input
                  value={form.organisationName}
                  onChange={(e) => setForm({ ...form, organisationName: e.target.value })}
                  className="w-full border border-blue-300 rounded-lg px-4 py-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter organisation name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-blue-700">Organisation Email</label>
                <div className="relative mt-1">
                  <input
                    value={form.organisationEmail}
                    onChange={(e) => setForm({ ...form, organisationEmail: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg px-10 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                  <div className="absolute left-3 top-3 text-slate-400">
                    <Mail size={16} />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Changing email requires verification via OTP.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-blue-700">Contact Number</label>
                <input
                  value={form.organisationContactNumber}
                  onChange={(e) => setForm({ ...form, organisationContactNumber: e.target.value })}
                  className="w-full border border-blue-300 rounded-lg px-4 py-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact number"
                />
              </div>

              {/* OTP single input (backup) + send / verify buttons appear on Save flow; we'll show quick send button if email changed manually */}
              <div className="flex gap-3 pt-2 items-center">
                <button
                  onClick={save}
                  disabled={loadingSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto"
                >
                  <Check size={16} />
                  {loadingSave ? "Saving..." : "Save Changes"}
                </button>

                <button
                  onClick={() => {
                    setEditing(false);
                    setEmailChanged(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Faculty section kept simple as before (unchanged) */}
        <div>
          <h4 className="text-lg font-semibold text-blue-700 mb-3">Faculty Members</h4>

          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-blue-100 shadow rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-blue-700">Faculty {i + 1}</div>
                  <div className="text-sm text-slate-600">Subject {i + 1}</div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button className="px-3 py-1 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 w-1/2 sm:w-auto">
                    Present
                  </button>
                  <button className="px-3 py-1 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 w-1/2 sm:w-auto">
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- OTP Modal ---------- */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-blue-200">
            <h3 className="text-lg font-bold text-blue-700 text-center mb-3">Verify Email</h3>
            <p className="text-sm text-slate-600 text-center mb-4">
              We sent a 6-digit OTP to <span className="font-medium">{form.organisationEmail}</span>
            </p>

            <div className="flex justify-between gap-2 mb-4">
              {otpBoxes.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-12 text-center rounded-lg border border-blue-300 text-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={verifyOtpAndSave}
                disabled={savingAfterOtp}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                {savingAfterOtp ? "Verifying..." : "Verify & Save"}
              </button>

              <button
                onClick={() => {
                  setShowOtpModal(false);
                }}
                className="flex-1 border py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <div className="text-center mt-3 text-sm text-slate-600">
              {!canResend ? (
                <div>Resend OTP in <strong>{timer}s</strong></div>
              ) : (
                <button
                  onClick={resendOtp}
                  disabled={otpSending}
                  className="inline-flex items-center gap-2 text-blue-600 font-medium"
                >
                  <Repeat size={16} /> Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};  

export default OrganisationInfo;
