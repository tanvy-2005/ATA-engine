import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  value: string;
  placeholder?: string;
  readOnly?: boolean;
}

export function SecretKeyField({ value, placeholder = "Enter secret token...", readOnly = false }: Props) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Secret key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex items-center">
      <Input 
        type={show ? "text" : "password"} 
        value={value} 
        readOnly={readOnly}
        placeholder={placeholder}
        className="pr-20 rounded-xl border-slate-200 dark:border-cyan-500/30 font-mono text-sm dark:bg-[#000411]/50"
      />
      <div className="absolute right-1.5 flex items-center gap-1">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => setShow(!show)}
          className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:text-cyan-500/70 dark:hover:text-cyan-400"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={handleCopy}
          className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:text-cyan-500/70 dark:hover:text-cyan-400"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
