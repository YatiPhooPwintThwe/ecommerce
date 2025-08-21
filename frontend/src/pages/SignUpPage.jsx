import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import InputField from "../components/inputField.jsx";
import { SIGN_UP } from "../graphql/mutation/auth.mutation.js";
import { GET_AUTH_USER } from "../graphql/query/user.query.js";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [signUp, { loading }] = useMutation(SIGN_UP, {
    refetchQueries: [{ query: GET_AUTH_USER }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success("Signed up! Check your email for verification.");
      navigate("/verify");
    },
    onError: (err) => toast.error(err.message || "Sign up failed"),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      return toast.error("All fields are required");
    }
    if (form.password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }
    await signUp({
      variables: {
        input: {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        },
      },
    });
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

      {/* Form card */}
      <div className="relative w-full max-w-sm bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 sm:p-8 z-10">
        <h1 className="text-3xl font-semibold text-center text-gray-900">
          Sign Up
        </h1>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Create your account to start shopping
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
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="joshua95@gmail.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
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

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-700 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-black hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
