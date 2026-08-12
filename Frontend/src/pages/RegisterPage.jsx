import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, GraduationCap } from "lucide-react";
import { registerUser } from "../services/authService";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
];

const ADMITTED_COURSES = [
  "General Science",
  "General Arts",
  "Visual Arts",
  "General Business",
  "Home Economics",
];

// FastAPI sends `detail` as a plain string for HTTPException, but as an
// array of validation-error objects for 422s — rendering that array
// directly as a React child crashes the whole page, so normalize it here.
function getErrorMessage(err) {
  const detail = err.response?.data?.detail;
  if (!detail) return "Registration failed. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || String(d)).join(" ");
  }
  return "Registration failed. Please try again.";
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [admittedCourse, setAdmittedCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError("Please select whether you're a student or teacher.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await registerUser({
        full_name: fullName,
        email,
        password,
        role,
        admitted_course: role === "student" ? admittedCourse : null,
      });
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 md:p-10 text-center">
          <div className="w-11 h-11 rounded-full bg-blue-950 flex items-center justify-center mx-auto mb-5">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">Account created</h2>
          <p className="text-sm text-slate-500 mb-6">
            Your account is pending approval. You'll be able to sign in once your school's headmaster approves it.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-3 rounded-lg bg-blue-900 text-white text-sm font-bold hover:bg-blue-800 active:translate-y-px transition"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 md:p-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-full bg-blue-950 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
              Create your EduAlert account
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your school's headmaster will review and approve new accounts.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full name */}
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Full name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ama Owusu"
                required
                className="w-full pl-10 pr-3.5 py-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 outline-none focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 transition"
              />
            </div>
          </div>

          {/* School email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-1.5">
              School email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@edualert.gh"
                required
                className="w-full pl-10 pr-3.5 py-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 outline-none focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
                className="w-full pl-10 pr-3.5 py-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 outline-none focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 transition"
              />
            </div>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  aria-pressed={role === r.value}
                  className={`py-2.5 px-2 text-sm font-semibold rounded-xl transition ${
                    role === r.value
                      ? "border-2 border-blue-900 bg-white text-blue-950"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admitted course — students only */}
          {role === "student" && (
            <div className="mb-6">
              <label htmlFor="admittedCourse" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Course admitted into
              </label>
              <select
                id="admittedCourse"
                value={admittedCourse}
                onChange={(e) => setAdmittedCourse(e.target.value)}
                required
                className="w-full px-3.5 py-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 outline-none focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 transition"
              >
                <option value="" disabled>Select the course you were admitted into...</option>
                {ADMITTED_COURSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1.5">
                You'll pick your specific class and electives after your account is approved.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-900 text-white text-sm font-bold hover:bg-blue-800 active:translate-y-px transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="text-center text-sm text-slate-600 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-900 font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}