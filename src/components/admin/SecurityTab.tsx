import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, AlertTriangle, Users, Clock, RefreshCw, MapPin } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

interface SecurityAlert {
  type: "multiple_failures" | "unusual_location" | "rapid_logins" | "suspicious_agent";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  userId?: string;
  email?: string;
  timestamp: string;
}

export function SecurityTab() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLogins24h: 0,
    failedLogins24h: 0,
    uniqueUsers24h: 0,
    suspiciousCount: 0,
  });

  const fetchSecurityData = async () => {
    setLoading(true);
    const newAlerts: SecurityAlert[] = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    try {
      // Get login history for last 24h
      const { data: loginHistory } = await supabase
        .from("login_history")
        .select("*")
        .gte("login_at", oneDayAgo)
        .order("login_at", { ascending: false })
        .limit(500);

      const logins = loginHistory || [];
      const failedLogins = logins.filter((l) => !l.success);
      const uniqueUsers = new Set(logins.map((l) => l.user_id)).size;

      setStats({
        totalLogins24h: logins.length,
        failedLogins24h: failedLogins.length,
        uniqueUsers24h: uniqueUsers,
        suspiciousCount: 0,
      });

      // Heuristic 1: Multiple failed logins from same user
      const failedByUser = new Map<string, typeof logins>();
      failedLogins.forEach((l) => {
        const key = l.user_id;
        if (!failedByUser.has(key)) failedByUser.set(key, []);
        failedByUser.get(key)!.push(l);
      });

      failedByUser.forEach((entries, userId) => {
        if (entries.length >= 3) {
          newAlerts.push({
            type: "multiple_failures",
            severity: entries.length >= 5 ? "high" : "medium",
            title: `${entries.length} failed login attempts`,
            description: `User ${entries[0].user_email || userId} had ${entries.length} failed logins in the last 24h`,
            userId,
            email: entries[0].user_email || undefined,
            timestamp: entries[0].login_at,
          });
        }
      });

      // Heuristic 2: Rapid logins (>5 in 1 hour from same user)
      const recentLogins = logins.filter((l) => l.login_at >= oneHourAgo);
      const recentByUser = new Map<string, typeof logins>();
      recentLogins.forEach((l) => {
        const key = l.user_id;
        if (!recentByUser.has(key)) recentByUser.set(key, []);
        recentByUser.get(key)!.push(l);
      });

      recentByUser.forEach((entries, userId) => {
        if (entries.length >= 5) {
          newAlerts.push({
            type: "rapid_logins",
            severity: "medium",
            title: `Rapid login activity`,
            description: `User ${entries[0].user_email || userId} logged in ${entries.length} times in the last hour`,
            userId,
            email: entries[0].user_email || undefined,
            timestamp: entries[0].login_at,
          });
        }
      });

      // Heuristic 3: Suspicious user agents
      const suspiciousAgents = logins.filter(
        (l) =>
          l.user_agent &&
          (l.user_agent.includes("curl") ||
            l.user_agent.includes("python") ||
            l.user_agent.includes("bot") ||
            l.user_agent.includes("scrapy"))
      );

      if (suspiciousAgents.length > 0) {
        newAlerts.push({
          type: "suspicious_agent",
          severity: "high",
          title: `${suspiciousAgents.length} suspicious user agents detected`,
          description: `Non-browser user agents detected in login attempts`,
          timestamp: suspiciousAgents[0].login_at,
        });
      }

      setAlerts(newAlerts);
      setStats((prev) => ({ ...prev, suspiciousCount: newAlerts.filter((a) => a.severity === "high").length }));
    } catch (err) {
      console.error("Error fetching security data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const severityColor = (s: string) => {
    switch (s) {
      case "high": return "destructive";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-textMuted" />
              <span className="text-xs text-textMuted">Active Users (24h)</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.uniqueUsers24h}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-textMuted" />
              <span className="text-xs text-textMuted">Total Logins (24h)</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalLogins24h}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-textMuted">Failed Logins (24h)</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-destructive">{stats.failedLogins24h}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <span className="text-xs text-textMuted">High Severity</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-destructive">{stats.suspiciousCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Security Alerts
              </CardTitle>
              <CardDescription>Automated fraud detection heuristics</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSecurityData}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">No security alerts — all clear!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border border-borderSubtle bg-surfaceMuted/50"
                >
                  <div className="mt-0.5">
                    {alert.severity === "high" ? (
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <Badge variant={severityColor(alert.severity) as any} className="text-[10px]">
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(parseISO(alert.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
