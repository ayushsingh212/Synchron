import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { toast } from "react-toastify";

const VerifyEmail: React.FC = () => {
  const { organisationEmail } = useParams();
  const navigate = useNavigate();

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const resendCooldownRef = useRef(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
    setCanResend(true);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const newValues = paste.split("");
    while (newValues.length < 6) newValues.push("");
    setOtp(newValues);
    inputRefs.current[Math.min(paste.length - 1, 5)]?.focus();
  };

  const handleResendOtp = async () => {
    if (!canResend || resendCooldownRef.current) return;

    resendCooldownRef.current = true;
    setTimeout(() => {
      resendCooldownRef.current = false;
    }, 1500);

    try {
      await axios.post(
        `${API_BASE_URL}/verification/getOtp/register`,
        { organisationEmail },
        { withCredentials: true }
      );
      toast.success("OTP resent");
      setTimer(30);
      setCanResend(false);
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/organisation/verifyEmail/${organisationEmail}`,
        { otp: code },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success("Email verified");
        navigate("/dashboard/organisation-info");
      } else {
        toast.error(res.data.message || "Invalid OTP");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Verification failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 px-4">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md border border-blue-200">
        <h2 className="text-3xl font-bold text-center text-blue-600">Verify Your Email</h2>

        <p className="text-center mt-2 text-gray-600">
          OTP sent to <strong>{organisationEmail}</strong>
        </p>

        <div className="flex justify-between mt-6 gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              ref={(el) => (inputRefs.current[index] = el)}
              className="w-12 h-12 border-2 border-blue-300 rounded text-center text-xl font-semibold text-blue-700 outline-none focus:ring-2 focus:ring-blue-400"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="text-center mt-4 text-gray-700">
          {canResend ? (
            <button
              onClick={handleResendOtp}
              className="text-blue-600 font-semibold hover:underline"
            >
              Resend OTP
            </button>
          ) : (
            <p>
              Resend OTP in <strong>{timer}s</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
