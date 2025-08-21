import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { RESET_PASSWORD } from "../graphql/mutation/auth.mutation.js";

const PW_RULE = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");

  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD, {
    onCompleted: () => {
      toast.success("Password reset successfully!");
      navigate("/login");
    },
    onError: (err) => toast.error(err.message || "Reset failed"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!PW_RULE.test(newPassword)) {
      toast.error(
        "Password must be at least 6 characters and include 1 uppercase letter and 1 number."
      );
      return;
    }
    await resetPassword({ variables: { token, newPassword } });
  };
  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://plus.unsplash.com/premium_photo-1672883552384-087b8a7acdb6?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative flex flex-col justify-center items-center p-6 sm:p-10 w-full max-w-md z-10">
        <div className="backdrop-blur-md bg-white/80 rounded-2xl px-5 py-8 shadow-lg w-full max-w-smmin-h-[300px] border border-white/20">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Reset Password
          </h2>
          <p className="text-sm text-gray-600 text-center mt-2">
            Enter a new password for your account
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              className="mt-8 w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
