import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

import Navigation from "../components/Navigation.jsx";
import { GET_AUTH_USER } from "../graphql/query/user.query.js";
import {
  UPDATE_ADDRESS,
  UPDATE_PHONE,
  
} from "../graphql/mutation/user.mutation.js";
import { CHANGE_PASSWORD, UPDATE_EMAIL } from "../graphql/mutation/auth.mutation.js";

export default function UpdateInfoPage() {
  const navigate = useNavigate();

  // styles (match coupon look; added larger vertical spacing)
  const inputClass =
    "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 disabled:bg-gray-100";
  const btnClass =
    "h-10 inline-flex items-center justify-center rounded-md bg-blue-300 px-4 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed";
  const cardClass =
    "space-y-5 rounded-xl border border-gray-200 bg-white p-6 md:p-7 shadow-sm";

  // data
  const { data, loading: loadingUser } = useQuery(GET_AUTH_USER, {
    fetchPolicy: "network-only",
  });
  const authUser = data?.authUser;

  // local state
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [phone, setPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (authUser) {
      setAddress({
        street: authUser.address?.street || "",
        city: authUser.address?.city || "",
        state: authUser.address?.state || "",
        postalCode: authUser.address?.postalCode || "",
        country: authUser.address?.country || "",
      });
      setPhone(authUser.phone || "");
    }
  }, [authUser]);

  useEffect(() => {
    if (!loadingUser && !authUser) navigate("/login", { replace: true });
  }, [loadingUser, authUser, navigate]);

  // mutations
  const [mutateAddress, { loading: savingAddress }] = useMutation(UPDATE_ADDRESS, {
    refetchQueries: [GET_AUTH_USER],
  });
  const [mutatePhone, { loading: savingPhone }] = useMutation(UPDATE_PHONE, {
    refetchQueries: [GET_AUTH_USER],
  });
  const [requestEmail, { loading: requestingEmail }] =
    useMutation(UPDATE_EMAIL);
  const [changePasswordMutation, { loading: changingPw }] =
    useMutation(CHANGE_PASSWORD);

  // helpers
  const hadAddress = useMemo(() => {
    const a = authUser?.address || {};
    return Boolean(a.street || a.city || a.state || a.postalCode || a.country);
  }, [authUser]);
  const hadPhone = useMemo(() => Boolean(authUser?.phone), [authUser]);

  // handlers
  const submitAddress = async (e) => {
    e.preventDefault();
    try {
      await mutateAddress({ variables: { address } });
      toast.success(hadAddress ? "Address updated" : "Address added");
    } catch (err) {
      toast.error(err.message || "Failed to save address");
    }
  };

  const submitPhone = async (e) => {
    e.preventDefault();
    try {
      await mutatePhone({ variables: { phone } });
      toast.success(hadPhone ? "Phone updated" : "Phone added");
    } catch (err) {
      toast.error(err.message || "Failed to save phone");
    }
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    try {
      await requestEmail({ variables: { newEmail } });
      toast.success("Verification code sent to your new email");
      navigate("/verify");
    } catch (err) {
      toast.error(err.message || "Failed to start email change");
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    try {
      const { data: resp } = await changePasswordMutation({
        variables: { currentPassword, newPassword },
      });
      if (resp?.changePassword === true) {
        toast.success("Password changed");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast.error("Unable to change password");
      }
    } catch (err) {
      toast.error(err.message || "Unable to change password");
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading…</div>
        </div>
      </div>
    );
  }
  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* container width adjustable via max-w-* */}
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Update Personal Info</h1>
        </div>

        {/* Address */}
        <section className={`${cardClass} mb-8`}>
          <h2 className="text-sm font-bold text-slate-800">Address</h2>
          <form onSubmit={submitAddress} className="space-y-4 md:space-y-5">
            <input className={inputClass} placeholder="Street"
              value={address.street}
              onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))} />
            <input className={inputClass} placeholder="City"
              value={address.city}
              onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
            <input className={inputClass} placeholder="State"
              value={address.state}
              onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} />
            <input className={inputClass} placeholder="Postal Code"
              value={address.postalCode}
              onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))} />
            <input className={inputClass} placeholder="Country"
              value={address.country}
              onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))} />
            <div className="pt-2">
              <button disabled={savingAddress} className={btnClass}>
                {hadAddress ? "Save Address" : "Add Address"}
              </button>
            </div>
          </form>
        </section>

        {/* Phone */}
        <section className={`${cardClass} mb-10`}>
          <h2 className="text-sm font-bold text-slate-800">Phone Number</h2>
          <form onSubmit={submitPhone} className="space-y-4 md:space-y-5">
            <input
              className={`${inputClass} sm:max-w-sm`}
              placeholder="+65 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="pt-2">
              <button disabled={savingPhone} className={btnClass}>
                {hadPhone ? "Save" : "Add"}
              </button>
            </div>
          </form>
        </section>

        {/* Email */}
        <section className={`${cardClass} mb-10`}>
          <h2 className="text-sm font-bold text-slate-800">Update Email</h2>
          <p className="text-xs text-slate-500">
            You’ll be redirected to verify your new email. After that, you’ll need to log in again.
          </p>
          <form onSubmit={submitEmail} className="space-y-4 md:space-y-5">
            <input
              type="email"
              className={`${inputClass} sm:max-w-sm`}
              placeholder="new-email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <div className="pt-2">
              <button disabled={requestingEmail || !newEmail} className={btnClass}>
                Send Verification Link
              </button>
            </div>
          </form>
        </section>

        {/* Password (shorter inputs) */}
        <section className={`${cardClass} mb-10`}>
          <h2 className="text-sm font-bold text-slate-800">Change Password</h2>
          <form onSubmit={submitPassword} className="space-y-4 md:space-y-5">
            <div className="relative sm:max-w-sm">
              <input
                type={showCurrent ? "text" : "password"}
                className={`${inputClass} pr-10`}
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                onClick={() => setShowCurrent((s) => !s)}
                aria-label="Toggle current password"
              >
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative sm:max-w-sm">
              <input
                type={showNew ? "text" : "password"}
                className={`${inputClass} pr-10`}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                onClick={() => setShowNew((s) => !s)}
                aria-label="Toggle new password"
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="pt-2">
              <button className={btnClass} disabled={changingPw}>
                {changingPw ? "Saving…" : "Change Password"}
              </button>
            </div>
          </form>
        </section>

        {/* Back button bottom-left */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-10 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-gray-100"
          >
            Back
          </button>
        </div>
      </main>
    </div>
  );
}
