import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  isDark: boolean;
}

export function LoginForm({ isDark }: LoginFormProps) {
  const [email, setEmail] = useState(() => sessionStorage.getItem('auth_email') || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading: authLoading } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (val: string) => { setEmail(val); sessionStorage.setItem('auth_email', val); if (error) setError(""); };
  const handlePasswordChange = (val: string) => { setPassword(val); if (error) setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLocalLoading(true);
    try {
      await login(email, password, false);
      navigate("/workspaces");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : "Incorrect email or password");
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = authLoading || localLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      {error && (
        <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20 text-center font-medium">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="signin-email" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email</Label>
        <Input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="name@example.com"
          className={`h-10 text-sm border transition-all duration-300 rounded-xl ${
            isDark 
              ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)] focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
              : 'bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
          }`}
          disabled={isLoading}
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</Label>
          <Link to="/forgot-password" className={`text-[11px] font-semibold hover:underline transition-colors ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className={`h-10 pr-10 text-sm border transition-all duration-300 rounded-xl ${
              isDark 
                ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)] focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                : 'bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
            }`}
            disabled={isLoading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors bg-transparent border-none outline-none focus:outline-none p-1 flex items-center justify-center rounded-md ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] border-none"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" />}
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
