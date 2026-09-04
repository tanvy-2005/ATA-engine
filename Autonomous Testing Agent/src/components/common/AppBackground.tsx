import Background3D from "@/components/common/Background3D";
import { useLocation } from "react-router-dom";

export default function AppBackground() {
  const location = useLocation();
  const isAuthOrLanding = location.pathname === '/' || 
                          location.pathname === '/docs' ||
                          location.pathname === '/architecture' ||
                          location.pathname.startsWith('/login') ||
                          location.pathname.startsWith('/signup') ||
                          location.pathname.startsWith('/forgot-password') ||
                          location.pathname.startsWith('/reset-password') ||
                          location.pathname.startsWith('/verify-otp');

  return (
    <>
      {isAuthOrLanding && <Background3D />}
      <div className={`fixed inset-0 z-[-1] pointer-events-none overflow-hidden transition-colors duration-500 bg-[#ffffff] ${isAuthOrLanding ? "dark:bg-transparent" : "dark:bg-[#000411]"}`}>
        {/* Dark Mode Glows (Subtle, Charcoal) */}
        <div className="hidden dark:block absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-[#1c1c1f] rounded-full blur-[150px] opacity-10" />
        <div className="hidden dark:block absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[#09090b] rounded-full blur-[150px] opacity-10" />
      </div>
    </>
  );
}

