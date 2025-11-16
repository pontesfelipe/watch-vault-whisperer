import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { TermsDialog } from "./TermsDialog";
import { PrivacyDialog } from "./PrivacyDialog";

export const RegistrationRequestForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      toast({
        title: "Error",
        description: "You must accept both the Terms & Conditions and Privacy Policy",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: registrationData, error: registrationError } = await ((supabase as any)
        .from("registration_requests")
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          status: 'pending',
          accepted_terms: true,
          accepted_privacy: true,
          terms_version: 'Beta v1.0',
          privacy_version: 'Beta v1.0',
        })
        .select()
        .single());

      if (registrationError) {
        if (registrationError.code === '23505') {
          throw new Error("A registration request with this email already exists");
        }
        throw registrationError;
      }

      // Store acceptance record with additional metadata
      const { error: acceptanceError } = await ((supabase as any)
        .from("terms_acceptances")
        .insert({
          email: email.trim().toLowerCase(),
          registration_request_id: registrationData.id,
          accepted_terms: true,
          accepted_privacy: true,
          terms_version: 'Beta v1.0',
          privacy_version: 'Beta v1.0',
          user_agent: navigator.userAgent,
        }));

      if (acceptanceError) {
        console.error("Error storing acceptance:", acceptanceError);
        // Don't fail the registration if acceptance storage fails
      }

      setSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "Your registration request has been sent to the administrator",
      });
      
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setAcceptedTerms(false);
      setAcceptedPrivacy(false);
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit registration request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Request Submitted
          </CardTitle>
          <CardDescription>
            Thank you for your interest! An administrator will review your request and contact you via email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full">
            Submit Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Request Access - Beta Program
          </CardTitle>
          <CardDescription>
            Fill out this form to request access to the watch tracker application (Beta)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  disabled={loading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I accept the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-primary underline hover:no-underline"
                  >
                    Terms & Conditions
                  </button>
                  {" "}(required)
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy"
                  checked={acceptedPrivacy}
                  onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                  disabled={loading}
                />
                <label
                  htmlFor="privacy"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I accept the{" "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacy(true)}
                    className="text-primary underline hover:no-underline"
                  >
                    Privacy Policy
                  </button>
                  {" "}(required)
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !acceptedTerms || !acceptedPrivacy}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
      <PrivacyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
    </>
  );
};
