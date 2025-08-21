import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import InputField from "../components/inputField.jsx";
import { FORGOT_PASSWORD, LOGIN } from "../graphql/mutation/auth.mutation.js";
import { GET_AUTH_ADMIN, GET_AUTH_USER } from "../graphql/query/user.query.js";

const LoginPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (forgotOpen) {
      setTimeout(() => emailInputRef.current?.focus(), 0);
    }
  }, [forgotOpen]);

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: ({ login: user }) => {
      toast.success("Welcome back!");
      navigate(user.role === "ADMIN" ? "/admin/products" : "/home");
    },
    onError: (err) => toast.error(err.message || "Login failed"),
  });

  const [forgotPassword, { loading: sending }] = useMutation(FORGOT_PASSWORD, {
    onCompleted: () => {
      toast.success("Reset password link is sent");
      setForgotOpen(false);
      setForgotEmail("");
    },
    onError: (err) => toast.error(err.message || "Failed to send link"),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.password) {
      return toast.error("All fields are required");
    }
    if (form.password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }
    await login({ variables: { input: { ...form } } });
  };

  const handleForgot = async () => {
    if (!forgotEmail.trim()) return toast.error("Enter your email");
    await forgotPassword({ variables: { email: forgotEmail.trim() } });
  };

  const handleModalKey = (e) => {
    if (e.key === "Escape") setForgotOpen(false);
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://plus.unsplash.com/premium_photo-1672883552384-087b8a7acdb6?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      {/* Blur + dim everything behind the modal */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}
      {/* Form card */}
      <div className="relative w-full max-w-sm bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 sm:p-8 z-10">
        <h1 className="text-3xl font-semibold text-center text-gray-900">
          Login
        </h1>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Welcome back! Log in to your account
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <InputField
            label="Username"
            id="name"
            name="name"
            placeholder="e.g. joshua"
            value={form.name}
            onChange={handleChange}
            autoComplete="username"
          />

          <InputField
            label="Password"
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                aria-pressed={showPw}
              >
                {showPw ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            }
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="remember" className="text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-sm text-black hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-700 text-center">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-black hover:underline">
            Sign up
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          onKeyDown={handleModalKey}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl ring-1 ring-black/5 p-8 sm:p-10 min-h-[300px]">
            <h3 className="text-2xl font-bold text-gray-900 text-center">
              Reset password
            </h3>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Enter your account email. We’ll send a reset link.
            </p>

            <div className="mt-8">
              <InputField
                label="Email"
                id="forgotEmail"
                name="forgotEmail"
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="mt-8 flex justify-center gap-6">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="inline-flex items-center justify-center h-10 w-28 text-sm
                 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForgot}
                disabled={sending || !forgotEmail.trim()}
                className="inline-flex items-center justify-center h-10 w-28 text-sm
                 bg-black text-white rounded-md disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
