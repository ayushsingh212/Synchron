import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VerifyEmail: React.FC = () => {
  const { organisationEmail } = useParams<{ organisationEmail: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    async function verify() {
      try {
        // TODO: call verification endpoint with token/email
        await new Promise((r) => setTimeout(r, 700));
        setStatus("success");
        // optional redirect after success
        setTimeout(() => navigate("/login"), 1200);
      } catch {
        setStatus("error");
      }
    }
    verify();
  }, [organisationEmail, navigate]);

  return (
    <section className="min-h-[50vh] flex items-center justify-center px-6">
      <div className="text-center">
        {status === "pending" && <p>Verifying {organisationEmail}…</p>}
        {status === "success" && <p className="text-green-600">Email verified — redirecting to login.</p>}
        {status === "error" && <p className="text-red-600">Verification failed. Please try again or contact support.</p>}
      </div>
    </section>
  );
};

export default VerifyEmail;
