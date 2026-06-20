import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Watch, Heart, Shield, Sparkles, Users, Globe, Footprints, ShoppingBag, BarChart3, Target, Zap, BookOpen } from "lucide-react";
import watchHero from "@/assets/watch-hero.jpg";
import sneakerHero from "@/assets/sneaker-hero.jpg";
import purseHero from "@/assets/purse-hero.jpg";
import { useEdgeSwipeBack } from "@/hooks/useEdgeSwipeBack";

export default function About() {
  useEdgeSwipeBack();
  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 via-background to-accent/5 p-8 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent opacity-50" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-2xl font-bold text-accent shadow-lg shadow-accent/20">
                SV
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Sora Vault</h1>
                <p className="text-muted-foreground text-lg">
                  Your Personal Luxury Collection Studio
                </p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Sora Vault is the premier platform for collectors who live and breathe luxury.
              Whether you're curating a rotation of timepieces, building a grail sneaker wall, or
              growing a designer handbag collection, Sora Vault gives you the tools to catalog,
              track, and truly understand every piece you own.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">Our Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Sora Vault was born from a simple frustration: spreadsheets and notes apps aren't built
              for collectors. We wanted a single place that understands what makes a luxury item special
              — the movement inside a watch, the colorway of a sneaker, the provenance of a handbag — and
              lets you manage it all with the same care you put into acquiring each piece.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, Sora Vault is an AI-powered collection studio that goes far beyond inventory.
              It tracks how often you wear each item, visualizes your spending and usage patterns,
              helps you discover trends in your own habits, and connects you with a community of
              like-minded collectors. Every feature is designed with one goal: to help you get more
              enjoyment out of the things you love.
            </p>
          </CardContent>
        </Card>

        {/* Collection Types Showcase */}
        <div>
          <h2 className="text-2xl font-bold mb-4">What You Can Collect</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="group overflow-hidden border-0 shadow-luxury hover:shadow-xl transition-all duration-500">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={watchHero}
                  alt="Luxury watches"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <Watch className="h-6 w-6 text-accent" />
                    <h3 className="text-xl font-bold">Watches</h3>
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Log movement types, case materials, dial details, water resistance, and market values.
                  Track wear history, warranty status, and service records for every timepiece in your rotation.
                </p>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden border-0 shadow-luxury hover:shadow-xl transition-all duration-500">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={sneakerHero}
                  alt="Premium sneakers"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <Footprints className="h-6 w-6 text-accent" />
                    <h3 className="text-xl font-bold">Sneakers</h3>
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Manage colorways, sizes across regions, conditions from deadstock to well-loved, and
                  collaboration details. Keep tabs on limited editions and release dates so nothing slips through.
                </p>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden border-0 shadow-luxury hover:shadow-xl transition-all duration-500">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={purseHero}
                  alt="Designer purses"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6 text-accent" />
                    <h3 className="text-xl font-bold">Purses</h3>
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Catalog materials, hardware finishes, serial numbers, and authenticity documentation.
                  Verify provenance and track every detail from dust bag to closure type.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">Platform Features</CardTitle>
            <CardDescription>Everything you need to manage, analyze, and enjoy your collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Analytics Canvas</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualize your collection's value, spending trends, depreciation, and usage stats in one powerful dashboard.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <Heart className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Wear Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Log every wear, see calendar heatmaps, and discover which pieces get the most love — and which deserve more.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered VaultPal</h3>
                  <p className="text-sm text-muted-foreground">
                    Chat with your personal AI assistant for collection insights, recommendations, and deep analysis of your items.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Collector Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with fellow enthusiasts, share your collection, discuss in forums, and find trade opportunities.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <Globe className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Trips & Events</h3>
                  <p className="text-sm text-muted-foreground">
                    Link items to the trips and events where you wore them — turn your collection into a timeline of memories.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure & Private</h3>
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication, encrypted data, and granular privacy controls keep your collection safe.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Personal Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    Add personal stories, acquisition notes, and custom insights to any item in your vault.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Import & Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Bring in your existing inventory from spreadsheets or export your data anytime — your collection, your data.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Multi-Language</h3>
                  <p className="text-sm text-muted-foreground">
                    Available in English, Spanish, French, Portuguese, Japanese, and Chinese — built for collectors worldwide.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
            <div className="text-4xl font-bold text-accent mb-2">3</div>
            <div className="text-sm text-muted-foreground">Collection Types</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
            <div className="text-4xl font-bold text-accent mb-2">6</div>
            <div className="text-sm text-muted-foreground">Languages Supported</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
            <div className="text-4xl font-bold text-accent mb-2">AI</div>
            <div className="text-sm text-muted-foreground">Powered Insights</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
            <div className="text-4xl font-bold text-accent mb-2">&infin;</div>
            <div className="text-sm text-muted-foreground">Items Per Collection</div>
          </div>
        </div>

        {/* Contact Card */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>Contact & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              Have questions, feedback, or ideas? We'd love to hear from you. Reach out through the
              Messages feature in the app or contact an administrator directly.
            </p>
            <p className="text-sm text-muted-foreground">
              &copy; 2025 Sora Vault. All rights reserved.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
