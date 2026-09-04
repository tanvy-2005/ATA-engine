import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
  requireNameConfirmation?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = 'default',
  isLoading = false,
  requireNameConfirmation,
}: ConfirmDialogProps) {
  const [confirmInput, setConfirmInput] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setConfirmInput("");
    }
  }, [open]);

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const isConfirmDisabled = 
    isLoading || 
    (requireNameConfirmation !== undefined && confirmInput !== requireNameConfirmation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className={`font-quicksand ${variant === 'destructive' ? "text-red-600 dark:text-red-400" : ""}`}>
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-slate-500 dark:text-slate-400 leading-normal">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireNameConfirmation && (
          <div className="my-4 space-y-2">
            <Label htmlFor="confirmation-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Type <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-red-600 dark:text-red-400 font-bold">
                {requireNameConfirmation}
              </span> to confirm
            </Label>
            <Input
              id="confirmation-input"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={requireNameConfirmation}
              className="border-slate-200 dark:border-slate-800"
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
