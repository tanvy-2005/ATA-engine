import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
  isDark: boolean;
}

export function PasswordStrength({ password, isDark }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    let score = 0;
    if (!password) return score;
    if (password.length > 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  let strengthText = "";
  let strengthColor = "";
  let barWidth = "0%";

  switch (true) {
    case password.length === 0:
      strengthText = "";
      barWidth = "0%";
      break;
    case strength < 2:
      strengthText = "Weak";
      strengthColor = "bg-red-500";
      barWidth = "33%";
      break;
    case strength < 4:
      strengthText = "Medium";
      strengthColor = "bg-yellow-500";
      barWidth = "66%";
      break;
    case strength >= 4:
      strengthText = "Strong";
      strengthColor = "bg-green-500";
      barWidth = "100%";
      break;
  }

  if (!password) return null;

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex justify-between items-center text-[10px] font-medium">
        <span className={isDark ? "text-slate-400" : "text-slate-500"}>Password strength:</span>
        <span className={strengthColor.replace("bg-", "text-")}>{strengthText}</span>
      </div>
      <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
        <div 
          className={`h-full rounded-full transition-all duration-300 ${strengthColor}`} 
          style={{ width: barWidth }} 
        />
      </div>
    </div>
  );
}
