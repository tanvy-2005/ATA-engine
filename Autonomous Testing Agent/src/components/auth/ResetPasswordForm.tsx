import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { PasswordStrength } from "./PasswordStrength";

interface ResetPasswordFormProps {
  isDark: boolean;
}

export function ResetPasswordForm({ isDark }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handlePasswordChange = (val: string) => { setPassword(val); if (error) setError(""); };
  const handleConfirmPasswordChange = (val: string) => { setConfirmPassword(val); if (error) setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    
    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
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

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setSuccessMessage("Password reset successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to reset password. Token might be expired.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
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
      
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="reset-password" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>New Password</Label>
          <div className="relative">
            <Input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`h-10 pr-10 text-sm border transition-all duration-300 rounded-xl ${
                isDark 
                  ? 'bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 text-white' 
                  : 'bg-white/50 border-slate-200 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 text-slate-900'
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
          <Label htmlFor="reset-confirm" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Confirm New Password</Label>
          <div className="relative">
            <Input
              id="reset-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              className={`h-10 pr-10 text-sm border transition-all duration-300 rounded-xl ${
                isDark 
                  ? 'bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 text-white' 
                  : 'bg-white/50 border-slate-200 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 text-slate-900'
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
        {isLoading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}
