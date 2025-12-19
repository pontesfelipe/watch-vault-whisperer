import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Watch, Heart, Shield, Sparkles, Users, Globe } from "lucide-react";

export default function About() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Info className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">About Sora Vault</h1>
            <p className="text-muted-foreground">
              Your personal watch collection management platform
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                SV
              </div>
              <div>
                <CardTitle>Sora Vault</CardTitle>
                <CardDescription>Version 1.0 Beta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Sora Vault is a comprehensive watch collection management platform designed for watch enthusiasts 
              who want to catalog, track, and analyze their timepiece collections. Built with passion for 
              horology, our platform offers a suite of tools to help you get the most out of your collection.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-3 p-4 rounded-lg border bg-card">
                <Watch className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold">Collection Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Catalog your watches with detailed specifications, photos, and personal notes.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-lg border bg-card">
                <Heart className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold">Wear Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Log your wear history and discover patterns in your collection usage.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-lg border bg-card">
                <Sparkles className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold">AI Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered analysis of your collection and personalized suggestions.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-lg border bg-card">
                <Users className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold">Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with other collectors and explore trade opportunities.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-lg border bg-card">
                <Globe className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold">Trip & Event Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Associate your watches with trips and special events for meaningful memories.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-lg border bg-card">
                <Shield className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold">Secure & Private</h3>
                  <p className="text-sm text-muted-foreground">
                    Your data is encrypted and protected with industry-standard security.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              For support or feedback, please reach out through the Messages feature or contact an administrator.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 Sora Vault. All rights reserved.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}