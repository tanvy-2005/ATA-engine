import { useOutletContext } from "react-router-dom";
import { SignupForm } from "@/components/auth/SignupForm";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { motion } from "framer-motion";

export default function Signup() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`w-full max-w-[420px] mx-auto p-4 min-[320px]:p-5 md:p-7 lg:p-9 rounded-[32px] backdrop-blur-[24px] border transition-all duration-500 relative overflow-hidden ${
        isDark
          ? "bg-white/5 border-[rgba(255,255,255,0.08)] text-white shadow-[0_0_80px_rgba(255,255,255,0.05),0_0_40px_rgba(255,255,255,0.02)]"
          : "bg-white/70 border-white/60 text-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.1)]"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none rounded-[32px]"></div>
      <div className="relative z-10">
        <div className="text-center mb-6 space-y-2">
          <h2 style={{ fontFamily: "'Urbanist', sans-serif" }} className={`font-bold tracking-tight leading-[1] text-xl min-[320px]:text-2xl md:text-3xl ${isDark ? 'text-white' : 'text-slate-900'}`}>Create an account</h2>
          <p className={`text-sm min-[320px]:text-base font-sans font-normal ${isDark ? "text-slate-400/80" : "text-slate-500"}`}>
            Start automating your QA workflow today
          </p>
        </div>

      <AuthTabs isDark={isDark} activeTab="signup" />

      <SocialLoginButtons isDark={isDark} />

      <div className="relative my-7 flex items-center">
        <div className={`flex-grow border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}></div>
        <span className={`px-3 text-[11px] tracking-wider uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Or continue with email
        </span>
        <div className={`flex-grow border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}></div>
      </div>

      <SignupForm isDark={isDark} />
      </div>
    </motion.div>
  );
}
