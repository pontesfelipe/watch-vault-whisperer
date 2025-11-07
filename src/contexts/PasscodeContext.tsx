import { createContext, useContext, useState, ReactNode } from "react";

const CORRECT_PASSCODE = "8595";

interface PasscodeContextType {
  isVerified: boolean;
  verifyPasscode: (passcode: string) => boolean;
  resetVerification: () => void;
  requestVerification: (onVerified: () => void) => void;
  pendingAction: (() => void) | null;
}

const PasscodeContext = createContext<PasscodeContextType | undefined>(undefined);

export const PasscodeProvider = ({ children }: { children: ReactNode }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const verifyPasscode = (passcode: string): boolean => {
    if (passcode === CORRECT_PASSCODE) {
      setIsVerified(true);
      return true;
    }
    return false;
  };

  const resetVerification = () => {
    setIsVerified(false);
  };

  const requestVerification = (onVerified: () => void) => {
    if (isVerified) {
      onVerified();
    } else {
      setPendingAction(() => onVerified);
    }
  };

  const executePendingAction = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  return (
    <PasscodeContext.Provider
      value={{
        isVerified,
        verifyPasscode,
        resetVerification,
        requestVerification: (onVerified) => {
          if (isVerified) {
            onVerified();
          } else {
            setPendingAction(() => onVerified);
          }
        },
        pendingAction,
      }}
    >
      {children}
      {pendingAction && !isVerified && (
        <PasscodeDialogInternal onSuccess={executePendingAction} />
      )}
    </PasscodeContext.Provider>
  );
};

export const usePasscode = () => {
  const context = useContext(PasscodeContext);
  if (!context) {
    throw new Error("usePasscode must be used within PasscodeProvider");
  }
  return context;
};

// Internal dialog component
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PasscodeDialogInternal = ({ onSuccess }: { onSuccess: () => void }) => {
  const [passcode, setPasscode] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const { verifyPasscode } = usePasscode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verifyPasscode(passcode)) {
      toast.success("Passcode verified");
      setIsOpen(false);
      onSuccess();
    } else {
      toast.error("Incorrect passcode");
      setPasscode("");
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPasscode("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Passcode</DialogTitle>
          <DialogDescription>
            Please enter the passcode to make changes
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoFocus
            maxLength={4}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Verify</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
