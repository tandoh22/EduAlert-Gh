import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, GraduationCap } from "lucide-react";
import { loginUser } from "../services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginUser({ email, password });
      
      // Redirect based on user role
      if (response.user.role === "student") {
        navigate("/dashboard");
      } else if (response.user.role === "teacher") {
        navigate("/teacher/dashboard");
      } else if (response.user.role === "admin" || response.user.role === "headmaster") {
        navigate("/headmaster/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-xl border border-slate-200">

        {/* LEFT: Brand panel */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-blue-950 to-blue-900 text-white p-8 md:p-12 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-blue-950" />
            </div>
            <div>
              <div className="text-base font-bold leading-tight">EduAlert GH</div>
              <div className="text-xs text-blue-200 mt-0.5">Ghana Education Service partner</div>
            </div>
          </div>

          <div className="py-10 md:py-0">
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight mb-5">
              Every learner counts.<br />
              Spot risk before it<br />
              becomes failure.
            </h1>
            <p className="text-sm text-blue-200 leading-relaxed mb-7">
              AI lesson notes, quiz creation, submissions and early-warning
              alerts — built for Senior High Schools across Ghana.
            </p>
            <div className="flex gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-1">
                <div className="text-xl font-extrabold">1,022</div>
                <div className="text-xs text-blue-300 mt-0.5">Students</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-1">
                <div className="text-xl font-extrabold">58</div>
                <div className="text-xs text-blue-300 mt-0.5">Teachers</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-1">
                <div className="text-xl font-extrabold">94%</div>
                <div className="text-xs text-blue-300 mt-0.5">Attendance</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-blue-300">© 2026 EduAlert Ghana · Accra</div>
        </div>

        {/* RIGHT: Form panel */}
        <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1.5">Welcome back</h2>
            <p className="text-sm text-slate-500 mb-7">
              Sign in — we'll open the right dashboard for your role.
            </p>

            <form onSubmit={handleSubmit}>
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
                    placeholder="student@edualert.gh"
                    className="w-full pl-10 pr-3.5 py-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 outline-none focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 transition"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Tip: try <b className="text-slate-600 font-semibold">student@...</b>,{" "}
                  <b className="text-slate-600 font-semibold">teacher@...</b>, or{" "}
                  <b className="text-slate-600 font-semibold">admin@...</b>
                </p>
              </div>

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
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 outline-none focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-6 mt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-900"
                  />
                  Keep me signed in
                </label>
                <a href="#" className="text-blue-900 font-semibold hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-blue-900 text-white text-sm font-bold hover:bg-blue-800 active:translate-y-px transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="text-center text-sm text-slate-600 mt-5">
              New here?{" "}
              <a href="#" className="text-blue-900 font-semibold hover:underline">
                Create an account
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}