import { useOutletContext, Link } from "react-router-dom";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();

  return (
    <div
      className={`w-full max-w-[380px] p-6 rounded-3xl backdrop-blur-xl border shadow-2xl transition-all duration-300 hover:shadow-slate-500/10 ${
        isDark
          ? "bg-white/5 border-white/10 text-white"
          : "bg-white/60 border-white/60 text-slate-900"
      }`}
    >
      <div className="text-center mb-6 space-y-2">
        <h2 style={{ fontFamily: "'Urbanist', sans-serif" }} className="font-bold tracking-tight leading-[1] text-2xl md:text-3xl text-slate-900 dark:text-white">Reset Password</h2>
        <p className={`text-base font-sans font-normal ${isDark ? "text-slate-400/80" : "text-slate-500"}`}>
          Please enter your new password below.
        </p>
      </div>

      <ResetPasswordForm isDark={isDark} />

      <div className="mt-6 text-center">
        <Link 
          to="/login"
          className={`inline-flex items-center text-sm font-medium transition-colors ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
