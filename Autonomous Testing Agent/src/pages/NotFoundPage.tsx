import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate("/workspaces");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#000208] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[600px] relative z-10"
      >
        <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/30 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.1)] overflow-hidden">
          <CardContent className="p-10 flex flex-col items-center text-center">
            
            <motion.div
              animate={{ 
                y: [0, -15, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
              <Bot className="w-32 h-32 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] relative z-10" />
            </motion.div>

            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 mb-4 font-orbitron tracking-tight">
              404
            </h1>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-cyan-50 mb-4">
              Page Not Found
            </h2>
            
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 leading-relaxed text-sm">
              The page you're looking for doesn't exist, may have been moved, or you may not have permission to access it.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="w-full sm:w-auto rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button 
                onClick={handleGoHome}
                className="w-full sm:w-auto rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Workspace
              </Button>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
