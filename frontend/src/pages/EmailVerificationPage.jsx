import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { useMutation } from "@apollo/client";
import { MessageSquare} from "lucide-react";
import toast from "react-hot-toast";
import {
  VERIFY_EMAIL,
  RESEND_VERIFICATION,
} from "../graphql/mutation/auth.mutation.js";

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [verifyEmail, { loading: verifying }] = useMutation(VERIFY_EMAIL, {
    onCompleted: () => {
      toast.success("Email verified successfully");
      navigate("/login");
    },
    onError: (err) => toast.error(err.message || "Invalid or expired code"),
  });

  const [resendVerification, { loading: resending }] = useMutation(
    RESEND_VERIFICATION,
    {
      onCompleted: () => {
        toast.success("Verification code sent");
        setCooldown(60);
      },

      onError: (err) => toast.error(err.message || "Failed to resend code"),
    }
  );

  useEffect(() => {
    inputRefs.current?.[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const isAllDigitValid = (arr) => arr.every((d) => d !== "" && !isNaN(d));

  const handleChange = (index, value) => {
    setHasInteracted(true);
    const next = [...code];

    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
      setCode(next);

      const lastFilled = next.findLastIndex((d) => d !== "");
      const focusIndex = Math.min(lastFilled + 1, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    next[index] = value.replace(/\D/g, "").slice(0, 1);
    setCode(next);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6)
      .split("");
    const next = [...code];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i] || "";
      if (inputRefs.current[i]) inputRefs.current[i].value = pasted[i] || "";
    }
    setCode(next);
    setHasInteracted(true);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5)
      inputRefs.current[index + 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasInteracted || !isAllDigitValid(code)) return;
    await verifyEmail({ variables: { token: code.join("") } });
  };

  useEffect(() => {
    if (hasInteracted && isAllDigitValid(code)) {
      const t = setTimeout(() => {
        verifyEmail({ variables: { token: code.join("") } });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [hasInteracted, code, verifyEmail]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    await resendVerification();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://plus.unsplash.com/premium_photo-1672883552384-087b8a7acdb6?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* card */}
      <div className="relative flex flex-col justify-center items-center p-6 sm:p-12 w-full max-w-lg z-10">
        <Motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="backdrop-blur-md bg-white/80 rounded-2xl px-6 py-8 shadow-lg w-full max-w-sm border border-white/20"
        >
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-xl bg-black/10 flex items-center justify-center">
                <MessageSquare className="size-6 text-black" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">
                Verify your email
              </h2>
              <p className="text-sm text-gray-600">
                Enter the 6-digit code sent to your email address
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  inputMode="numeric"
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-xl font-bold rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 outline-none"
                />
              ))}
            </div>

            <Motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={verifying || !isAllDigitValid(code)}
              className="w-full py-2 px-4 bg-black text-white font-semibold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? "Verifying..." : "Verify Email"}
            </Motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-sm underline underline-offset-4 disabled:no-underline disabled:opacity-50"
            >
              {cooldown > 0
                ? `Resend in ${cooldown}s`
                : resending
                ? "Sending..."
                : "Resend code"}
            </button>
          </div>
        </Motion.div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
