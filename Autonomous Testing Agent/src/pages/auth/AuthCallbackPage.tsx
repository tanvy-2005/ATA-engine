import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [errorState, setErrorState] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleOAuth = async () => {
      const code = searchParams.get("code");
      const oauthError = searchParams.get("error") || searchParams.get("error_description");

      if (oauthError) {
        setErrorState(oauthError);
        toast.error(`Authentication error: ${oauthError}`);
        return;
      }

      if (code) {
        // Handle PKCE code flow
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorState(error.message);
          toast.error(`Authentication error: ${error.message}`);
          return;
        }
        if (data.session) {
          if (window.opener) {
            window.opener.location.href = '/workspaces';
            window.close();
          } else {
            toast.success("Login successful!");
            navigate("/workspaces", { replace: true });
          }
        }
      } else {
        // Check if there's already a session (implicit flow handles hash fragments automatically)
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          setErrorState(error.message);
          toast.error(`Authentication error: ${error.message}`);
          return;
        }
        if (session) {
          if (window.opener) {
            window.opener.location.href = '/workspaces';
            window.close();
          } else {
            toast.success("Login successful!");
            navigate("/workspaces", { replace: true });
          }
        } else {
          setErrorState("Invalid or missing authentication session.");
          toast.error("Login failed or session missing");
        }
      }
    };

    handleOAuth();
  }, [searchParams, navigate]);

  if (errorState) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-[#000411]/90 border border-red-500/30 text-white max-w-md w-full shadow-[0_0_30px_rgba(239,68,68,0.15)] text-center backdrop-blur-md">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-red-400 mb-2 font-mono uppercase tracking-wide">
          Authentication Error
        </h3>
        <p className="text-sm text-gray-300 mb-6 font-mono">
          {errorState}
        </p>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono text-xs uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-[#000411]/90 border border-cyan-500/30 text-cyan-400 font-mono max-w-md w-full shadow-[0_0_30px_rgba(34,211,238,0.15)] backdrop-blur-md">
      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
      <p className="text-sm tracking-widest uppercase animate-pulse text-cyan-300 font-bold">
        Signing you in…
      </p>
      <p className="text-xs text-cyan-500/70 mt-2">
        Finalizing secure authentication session
      </p>
    </div>
  );
}
