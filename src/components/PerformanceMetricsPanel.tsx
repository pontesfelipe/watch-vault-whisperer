import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity, Database, Users, Clock, RefreshCw, AlertTriangle,
  CheckCircle2, Loader2, Zap, HardDrive, TrendingUp, ArrowUpCircle
} from 'lucide-react';

interface PerformanceMetrics {
  totalUsers: number;
  activeUsersLast7d: number;
  totalWatches: number;
  totalWearEntries: number;
  avgQueryTimeMs: number;
  dbSizeMB: number;
  dbUsagePercent: number;
  connectionUsagePercent: number;
  totalRows: number;
}

interface HealthCheck {
  label: string;
  status: 'ok' | 'warning' | 'critical';
  value: string;
  detail: string;
  icon: React.ReactNode;
}

const DB_SIZE_LIMIT_MB = 500;
const MAX_CONNECTIONS = 60;

export function PerformanceMetricsPanel() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const start = performance.now();

      const [
        { count: totalUsers },
        { count: activeUsers7d },
        { count: totalWatches },
        { count: totalWearEntries },
        { count: totalPosts },
        { count: totalConversations },
        { count: totalFeedback },
        { count: totalWishlist },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('watches').select('*', { count: 'exact', head: true }),
        supabase.from('wear_entries').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        supabase.from('wishlist').select('*', { count: 'exact', head: true }),
      ]);

      const queryTime = performance.now() - start;
      const estimatedRows = (totalUsers || 0) + (totalWatches || 0) + (totalWearEntries || 0) +
        (totalPosts || 0) + (totalConversations || 0) + (totalFeedback || 0) + (totalWishlist || 0);
      const estimatedSizeBytes = estimatedRows * 2048;
      const dbSizeMB = estimatedSizeBytes / (1024 * 1024);

      setMetrics({
        totalUsers: totalUsers || 0,
        activeUsersLast7d: activeUsers7d || 0,
        totalWatches: totalWatches || 0,
        totalWearEntries: totalWearEntries || 0,
        avgQueryTimeMs: Math.round(queryTime / 8),
        dbSizeMB: Math.round(dbSizeMB * 100) / 100,
        dbUsagePercent: Math.min((dbSizeMB / DB_SIZE_LIMIT_MB) * 100, 100),
        connectionUsagePercent: Math.min(
          (Math.ceil((totalUsers || 0) * 0.1) / MAX_CONNECTIONS) * 100, 100
        ),
        totalRows: estimatedRows,
      });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const getHealthChecks = (): HealthCheck[] => {
    if (!metrics) return [];
    const checks: HealthCheck[] = [];

    const queryStatus = metrics.avgQueryTimeMs < 200 ? 'ok' : metrics.avgQueryTimeMs < 500 ? 'warning' : 'critical';
    checks.push({
      label: 'Query Latency', status: queryStatus, value: `${metrics.avgQueryTimeMs}ms`,
      detail: queryStatus === 'ok' ? 'Healthy response time' : queryStatus === 'warning' ? 'Elevated latency' : 'Critical latency',
      icon: <Clock className="h-4 w-4" />,
    });

    const dbStatus = metrics.dbUsagePercent < 60 ? 'ok' : metrics.dbUsagePercent < 85 ? 'warning' : 'critical';
    checks.push({
      label: 'Database Usage', status: dbStatus, value: `${metrics.dbSizeMB.toFixed(1)} MB / ${DB_SIZE_LIMIT_MB} MB`,
      detail: dbStatus === 'ok' ? 'Sufficient space' : dbStatus === 'warning' ? 'Elevated usage' : 'Nearly full',
      icon: <HardDrive className="h-4 w-4" />,
    });

    const connStatus = metrics.connectionUsagePercent < 50 ? 'ok' : metrics.connectionUsagePercent < 80 ? 'warning' : 'critical';
    checks.push({
      label: 'Est. Connections', status: connStatus,
      value: `~${Math.ceil(metrics.totalUsers * 0.1)} / ${MAX_CONNECTIONS}`,
      detail: connStatus === 'ok' ? 'Comfortable capacity' : connStatus === 'warning' ? 'Growing — monitor' : 'Near limit',
      icon: <Zap className="h-4 w-4" />,
    });

    const userStatus = metrics.totalUsers < 50 ? 'ok' : metrics.totalUsers < 200 ? 'warning' : 'critical';
    checks.push({
      label: 'User Volume', status: userStatus,
      value: `${metrics.totalUsers} total (${metrics.activeUsersLast7d} active)`,
      detail: userStatus === 'ok' ? 'Adequate' : userStatus === 'warning' ? 'Significant growth' : 'High volume',
      icon: <Users className="h-4 w-4" />,
    });

    const dataStatus = metrics.totalRows < 5000 ? 'ok' : metrics.totalRows < 20000 ? 'warning' : 'critical';
    checks.push({
      label: 'Data Volume', status: dataStatus,
      value: `${metrics.totalRows.toLocaleString()} records`,
      detail: dataStatus === 'ok' ? 'Light volume' : dataStatus === 'warning' ? 'Growing — consider cleanup' : 'High volume',
      icon: <Database className="h-4 w-4" />,
    });

    return checks;
  };

  const healthChecks = getHealthChecks();
  const hasWarnings = healthChecks.some(c => c.status === 'warning');
  const hasCritical = healthChecks.some(c => c.status === 'critical');

  const statusColor = (s: string) =>
    s === 'ok' ? 'text-green-500' : s === 'warning' ? 'text-yellow-500' : 'text-destructive';
  const statusBg = (s: string) =>
    s === 'ok' ? 'bg-green-500/10' : s === 'warning' ? 'bg-yellow-500/10' : 'bg-destructive/10';
  const statusBadge = (s: string) =>
    s === 'ok' ? 'secondary' as const : s === 'warning' ? 'outline' as const : 'destructive' as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Resource usage monitoring and health checks</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            hasCritical ? 'bg-destructive/5 border-destructive/30' :
              hasWarnings ? 'bg-yellow-500/5 border-yellow-500/30' :
                'bg-green-500/5 border-green-500/30'
          }`}>
            {hasCritical ? <AlertTriangle className="h-5 w-5 text-destructive shrink-0" /> :
              hasWarnings ? <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" /> :
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
            <div className="flex-1">
              <p className="font-medium text-sm">
                {hasCritical ? 'Action Recommended' : hasWarnings ? 'Some indicators need monitoring' : 'System Healthy'}
              </p>
            </div>
            {lastRefresh && (
              <span className="text-xs text-muted-foreground shrink-0">{lastRefresh.toLocaleTimeString()}</span>
            )}
          </div>
        )}

        {loading && !metrics ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {healthChecks.map((check, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${statusBg(check.status)} transition-colors`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={statusColor(check.status)}>{check.icon}</span>
                    <span className="text-sm font-medium">{check.label}</span>
                  </div>
                  <Badge variant={statusBadge(check.status)} className="text-xs">
                    {check.status === 'ok' ? 'OK' : check.status === 'warning' ? 'Warning' : 'Critical'}
                  </Badge>
                </div>
                <p className="text-lg font-bold">{check.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{check.detail}</p>
              </div>
            ))}
          </div>
        )}

        {metrics && (
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Database Usage</span>
                <span className="text-sm text-muted-foreground">{metrics.dbSizeMB.toFixed(1)} MB / {DB_SIZE_LIMIT_MB} MB</span>
              </div>
              <Progress value={metrics.dbUsagePercent} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Est. Connections</span>
                <span className="text-sm text-muted-foreground">~{Math.ceil(metrics.totalUsers * 0.1)} / {MAX_CONNECTIONS}</span>
              </div>
              <Progress value={metrics.connectionUsagePercent} className="h-2" />
            </div>
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{metrics.totalWatches}</p>
              <p className="text-xs text-muted-foreground">Items</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{metrics.totalWearEntries}</p>
              <p className="text-xs text-muted-foreground">Wear Entries</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{metrics.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Users</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{metrics.avgQueryTimeMs}ms</p>
              <p className="text-xs text-muted-foreground">Avg Latency</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
