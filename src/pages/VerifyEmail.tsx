import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { toast } from "react-toastify";
import { useOrganisation } from "../context/OrganisationContext";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

const VerifyEmail: React.FC = () => {
  const { organisationEmail } = useParams<{ organisationEmail: string }>();
  const navigate = useNavigate();
  const { refreshOrganisation } = useOrganisation();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const resendCooldownRef = useRef(false);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    
    const intervalId = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [timer]);

  // OTP input change handler
  const handleChange = useCallback((value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  // Backspace handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        // Move to previous input if current is empty
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index] !== "") {
        // Clear current input if it has value
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  }, [otp]);

  // Paste handling
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const digits = pastedData.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");

    if (digits.length === 0) return;

    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < OTP_LENGTH) {
        newOtp[index] = digit;
      }
    });
    
    // Fill remaining slots with empty strings
    for (let i = digits.length; i < OTP_LENGTH; i++) {
      newOtp[i] = "";
    }
    
    setOtp(newOtp);
    
    // Focus on the next input after the pasted digits
    const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }, [otp]);

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || resendCooldownRef.current || !organisationEmail) return;

    resendCooldownRef.current = true;
    setCanResend(false);
    setTimer(RESEND_COOLDOWN);

    try {
      await axios.post(
        `${API_BASE_URL}/verification/getOtp/register`,
        { organisationEmail },
        { withCredentials: true }
      );
      toast.success("OTP resent successfully");
      
      // Reset OTP fields
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to resend OTP");
      setCanResend(true); // Allow retry if failed
    } finally {
      setTimeout(() => {
        resendCooldownRef.current = false;
      }, 1500);
    }
  };

  // Verify OTP
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH || !organisationEmail) {
      toast.error("Please enter a valid OTP");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/organisation/verifyEmail/${organisationEmail}`,
        { otp: code },
        { withCredentials: true }
      );

      toast.success("Email verified successfully");

      // Refresh organisation context so access token is available
      await refreshOrganisation();

      navigate("/dashboard/organisation-info");
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Verification failed";
      toast.error(errorMessage);
      
      // Clear OTP on failure for security
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  if (!organisationEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600 px-4">
        <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md border border-blue-200">
          <h2 className="text-3xl font-bold text-center text-red-600">Invalid Request</h2>
          <p className="text-center mt-4 text-gray-600">
            Email address not found. Please try again.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition"
          >
            Go Back to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md border border-blue-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-blue-600">✓</span>
          </div>
          <h2 className="text-3xl font-bold text-blue-800">Verify Your Email</h2>
          <p className="mt-2 text-gray-600">
            Enter the 6-digit OTP sent to
          </p>
          <p className="font-semibold text-blue-700 break-all">{organisationEmail}</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                ref={(el) => (inputRefs.current[index] = el)}
                className="w-14 h-14 border-2 border-blue-200 rounded-xl text-center text-2xl font-bold text-blue-800 outline-none transition-all
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                  hover:border-blue-300"
                disabled={loading}
                aria-label={`Digit ${index + 1} of OTP`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            OTP will expire in <span className="font-semibold">{timer}</span> seconds
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || !isOtpComplete}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl text-lg font-semibold
            hover:from-blue-700 hover:to-blue-800 transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : "Verify OTP"}
        </button>

        <div className="text-center mt-6">
          {canResend ? (
            <button
              onClick={handleResendOtp}
              disabled={resendCooldownRef.current}
              className="text-blue-600 font-semibold hover:text-blue-800 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-gray-600">
              Didn't receive the code?{" "}
              <span className="font-medium">
                Resend in <span className="text-blue-600">{timer}s</span>
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;