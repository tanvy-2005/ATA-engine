import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ForgotPasswordFormProps {
  isDark: boolean;
}

export function ForgotPasswordForm({ isDark }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email format.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError("Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      {error && (
        <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20 text-center font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs text-green-500 bg-green-500/10 p-2 rounded border border-green-500/20 text-center font-medium">
          Password reset link sent.
        </div>
      )}
      
      {!success && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="reset-email" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email</Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={`h-10 text-sm border transition-all duration-300 rounded-xl ${
                isDark 
                  ? 'bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 placeholder:text-slate-500 text-white' 
                  : 'bg-white/50 border-slate-200 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 placeholder:text-slate-400 text-slate-900'
              }`}
              disabled={loading}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 mt-2 cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] border-none"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" />}
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </>
      )}

      <div className="flex justify-center pt-2">
        <Link 
          to="/login"
          className={`text-[11px] font-semibold hover:underline flex items-center transition-colors ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to login
        </Link>
      </div>
    </form>
  );
}
