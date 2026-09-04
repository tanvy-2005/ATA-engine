import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { PasswordStrength } from "./PasswordStrength";

interface SignupFormProps {
  isDark: boolean;
}

export function SignupForm({ isDark }: SignupFormProps) {
  const [name, setName] = useState(() => sessionStorage.getItem('auth_name') || "");
  const [email, setEmail] = useState(() => sessionStorage.getItem('auth_email') || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup, loading: authLoading } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();

  const handleNameChange = (val: string) => { setName(val); sessionStorage.setItem('auth_name', val); if (error) setError(""); };
  const handleEmailChange = (val: string) => { setEmail(val); sessionStorage.setItem('auth_email', val); if (error) setError(""); };
  const handlePasswordChange = (val: string) => { setPassword(val); if (error) setError(""); };
  const handleConfirmPasswordChange = (val: string) => { setConfirmPassword(val); if (error) setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email format.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLocalLoading(true);
    try {
      await signup(name, email, password);
      setSuccessMessage("Account created successfully. Redirecting to verification...");
      setTimeout(() => navigate("/verify-otp", { state: { email } }), 1500);
    } catch (err) {
      setError("Failed to create account.");
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = authLoading || localLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 animate-in fade-in zoom-in-95 duration-300">
      {error && (
        <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20 text-center font-medium">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="text-xs text-green-500 bg-green-500/10 p-2 rounded border border-green-500/20 text-center font-medium">
          {successMessage}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="signup-name" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="John Doe"
          className={`h-10 text-sm border transition-all duration-300 rounded-xl ${
            isDark 
              ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)] focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
              : 'bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
          }`}
          disabled={isLoading}
          autoComplete="name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-email" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Work Email</Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="name@company.com"
          className={`h-10 text-sm border transition-all duration-300 rounded-xl ${
            isDark 
              ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)] focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
              : 'bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
          }`}
          disabled={isLoading}
          autoComplete="email"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="signup-password" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`h-10 pr-10 text-sm border transition-all duration-300 rounded-xl ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)] focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                  : 'bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              }`}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-transparent border-none outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-confirm" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Confirm Password</Label>
          <div className="relative">
            <Input
              id="signup-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              className={`h-10 pr-10 text-sm border transition-all duration-300 rounded-xl ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)] focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                  : 'bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              }`}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-transparent border-none outline-none"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
      {password && <PasswordStrength password={password} isDark={isDark} />}
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 mt-4 cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] border-none"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" />}
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
}
