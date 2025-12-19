import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, Key } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

interface MfaVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Simple hash function to verify codes
const hashCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.replace(/-/g, '').toUpperCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const MfaVerification = ({ onSuccess, onCancel }: MfaVerificationProps) => {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyingRecovery, setVerifyingRecovery] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setVerifying(true);
    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) throw factorsError;
      
      const totpFactor = factorsData.totp.find(f => f.status === 'verified');
      if (!totpFactor) {
        throw new Error("No verified TOTP factor found");
      }

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });
      
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code
      });

      if (verifyError) throw verifyError;

      onSuccess();
    } catch (error: any) {
      console.error("MFA verification error:", error);
      toast.error(error.message || "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  };

  const handleRecoveryVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim() || !user) return;

    setVerifyingRecovery(true);
    try {
      // Hash the recovery code
      const codeHash = await hashCode(recoveryCode);
      
      // Find matching unused recovery code
      const { data: codeData, error: findError } = await supabase
        .from('mfa_recovery_codes')
        .select('id')
        .eq('user_id', user.id)
        .eq('code_hash', codeHash)
        .is('used_at', null)
        .single();

      if (findError || !codeData) {
        throw new Error("Invalid or already used recovery code");
      }

      // Mark the code as used
      const { error: updateError } = await supabase
        .from('mfa_recovery_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', codeData.id);

      if (updateError) throw updateError;

      toast.success("Recovery code accepted");
      onSuccess();
    } catch (error: any) {
      console.error("Recovery code verification error:", error);
      toast.error(error.message || "Invalid recovery code");
    } finally {
      setVerifyingRecovery(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Verify your identity to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="authenticator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="authenticator" className="text-xs sm:text-sm">
              <Shield className="w-4 h-4 mr-1 sm:mr-2" />
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="recovery" className="text-xs sm:text-sm">
              <Key className="w-4 h-4 mr-1 sm:mr-2" />
              Recovery Code
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="authenticator">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Verification Code</Label>
                <Input
                  id="mfa-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  autoFocus
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                  disabled={verifying}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={verifying || code.length !== 6}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="recovery">
            <form onSubmit={handleRecoveryVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-code">Recovery Code</Label>
                <Input
                  id="recovery-code"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="XXXXX-XXXXX"
                  className="text-center text-lg tracking-wider font-mono"
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter one of your recovery codes (each code can only be used once)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                  disabled={verifyingRecovery}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={verifyingRecovery || !recoveryCode.trim()}
                >
                  {verifyingRecovery ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Use Recovery Code"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
