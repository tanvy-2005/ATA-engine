import { useState, useEffect } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyOtpPage() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, verifyEmail, resendVerificationCode } = useAuth();

  // Client-side states for email editing and resend timer
  const initialEmail = location.state?.email || sessionStorage.getItem('auth_email') || user?.email || "";
  const [currentEmail, setCurrentEmail] = useState(initialEmail || "your email");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState(initialEmail || "");
  const [timeLeft, setTimeLeft] = useState(60);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Call real verification API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      await verifyEmail(currentEmail, otpValue);

      toast.success("Email verified successfully!");
      navigate("/workspaces");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Real resend OTP via backend
  const handleResend = async () => {
    if (timeLeft > 0) return;
    try {
      await resendVerificationCode(currentEmail);
      setTimeLeft(60);
      setOtp(["", "", "", "", "", ""]);
      toast.success(`Verification code resent to ${currentEmail}!`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to resend code");
    }
  };

  // Save new email address and send verification code
  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim()) {
      toast.error("Email cannot be empty");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailInput)) {
      toast.error("Please enter a valid email format");
      return;
    }

    try {
      await resendVerificationCode(newEmailInput);
      setCurrentEmail(newEmailInput);
      setIsEditingEmail(false);
      setTimeLeft(60);
      setOtp(["", "", "", "", "", ""]);
      toast.success(`Email updated. A new code has been sent to ${newEmailInput}!`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to send code to new email");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`w-full max-w-[420px] mx-auto p-4 min-[320px]:p-5 md:p-7 lg:p-9 rounded-[32px] backdrop-blur-[24px] border transition-all duration-500 relative overflow-hidden ${isDark
          ? "bg-white/5 border-[rgba(255,255,255,0.08)] text-white shadow-[0_0_80px_rgba(255,255,255,0.05),0_0_40px_rgba(255,255,255,0.02)]"
          : "bg-white/70 border-white/60 text-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.1)]"
        }`}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none rounded-[32px]"></div>

      <div className="relative z-10">
        <button
          onClick={() => navigate(-1)}
          className={`mb-6 p-2 rounded-full inline-flex items-center justify-center transition-colors ${isDark ? "hover:bg-white/10 text-slate-300" : "hover:bg-black/5 text-slate-600"
            }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center mb-8 space-y-2">
          <h2 style={{ fontFamily: "'Urbanist', sans-serif" }} className="text-xl min-[320px]:text-2xl md:text-3xl font-bold tracking-tight">Verify your email</h2>
          {isEditingEmail ? (
            <form onSubmit={handleEmailSave} className="mt-4 space-y-3 bg-slate-100/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1.5 text-left">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>New Email Address</label>
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className={`w-full h-10 px-3 text-sm border transition-all duration-300 rounded-xl outline-none ${isDark
                      ? 'bg-white/5 border-white/10 focus:border-slate-400 placeholder:text-slate-500 text-white'
                      : 'bg-white border-slate-200 focus:border-slate-500 placeholder:text-slate-400 text-slate-900'
                    }`}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  onClick={() => {
                    setIsEditingEmail(false);
                    setNewEmailInput(currentEmail);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className={`h-8 rounded-lg text-xs font-bold border-none ${isDark ? "bg-slate-100 hover:bg-white text-slate-900" : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                >
                  Save & Resend
                </Button>
              </div>
            </form>
          ) : (
            <p className={`text-sm font-medium ${isDark ? "text-slate-400/80" : "text-slate-500"}`}>
              We've sent a 6-digit verification code to <br />
              <span className={isDark ? "text-white font-semibold" : "text-slate-900 font-semibold"}>{currentEmail}</span>
              <br />
              <button
                type="button"
                onClick={() => setIsEditingEmail(true)}
                className={`mt-1.5 text-xs font-semibold hover:underline transition-colors focus:outline-none ${isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Change Email
              </button>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center items-center">
            <InputOTP
              maxLength={6}
              value={otp.join("")}
              onChange={(value) => {
                const newOtp = ["", "", "", "", "", ""];
                value.split("").forEach((char, i) => { if (i < 6) newOtp[i] = char; });
                setOtp(newOtp);
              }}
              autoFocus
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full h-12 rounded-xl font-bold text-[15px] transition-all relative overflow-hidden group cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] border-none disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </span>
          </Button>

          <div className="text-center mt-6">
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Didn't receive the code?{" "}
              {timeLeft > 0 ? (
                <span className="font-semibold text-slate-400 dark:text-slate-500">
                  Resend in {timeLeft}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className={`font-semibold transition-colors focus:outline-none hover:underline ${isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Resend
                </button>
              )}
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
