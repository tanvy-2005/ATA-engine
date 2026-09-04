import { Link } from "react-router-dom";

interface AuthTabsProps {
  isDark: boolean;
  activeTab: 'login' | 'signup';
}

export function AuthTabs({ isDark, activeTab }: AuthTabsProps) {
  return (
    <div className={`grid w-full grid-cols-2 mb-6 p-1 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'} relative`}>
      <Link
        to="/login"
        className={`flex items-center justify-center rounded-xl transition-all py-2 text-sm font-bold ${
          activeTab === 'login'
            ? isDark 
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
              : "bg-white text-cyan-800 shadow-sm border border-cyan-300"
            : isDark
              ? "hover:bg-white/5 text-slate-400 border border-transparent"
              : "hover:bg-slate-200/50 text-slate-500 border border-transparent"
        }`}
      >
        Sign In
      </Link>
      <Link
        to="/signup"
        className={`flex items-center justify-center rounded-xl transition-all py-2 text-sm font-bold ${
          activeTab === 'signup'
            ? isDark 
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
              : "bg-white text-cyan-800 shadow-sm border border-cyan-300"
            : isDark
              ? "hover:bg-white/5 text-slate-400 border border-transparent"
              : "hover:bg-slate-200/50 text-slate-500 border border-transparent"
        }`}
      >
        Create Account
      </Link>
    </div>
  );
}
