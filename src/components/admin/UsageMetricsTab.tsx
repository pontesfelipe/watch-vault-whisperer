import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Watch, Calendar, Activity, TrendingUp, Clock } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export function UsageMetricsTab() {
  // Total users
  const { data: totalUsers } = useQuery({
    queryKey: ['metrics-total-users'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Active users (last 30 days)
  const { data: activeUsers } = useQuery({
    queryKey: ['metrics-active-users'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('access_logs')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;
      const uniqueUsers = new Set(data?.map(d => d.user_id));
      return uniqueUsers.size;
    },
  });

  // Total watches
  const { data: totalWatches } = useQuery({
    queryKey: ['metrics-total-watches'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('watches')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Total wear entries
  const { data: totalWearEntries } = useQuery({
    queryKey: ['metrics-total-wear-entries'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('wear_entries')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // This month's wear entries
  const { data: monthlyWearEntries } = useQuery({
    queryKey: ['metrics-monthly-wear-entries'],
    queryFn: async () => {
      const start = startOfMonth(new Date()).toISOString();
      const end = endOfMonth(new Date()).toISOString();
      const { count, error } = await supabase
        .from('wear_entries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start)
        .lte('created_at', end);
      if (error) throw error;
      return count || 0;
    },
  });

  // AI Feature usage this month
  const { data: aiUsage } = useQuery({
    queryKey: ['metrics-ai-usage'],
    queryFn: async () => {
      const start = startOfMonth(new Date()).toISOString();
      const { data, error } = await supabase
        .from('ai_feature_usage')
        .select('feature_name')
        .gte('used_at', start);
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        counts[item.feature_name] = (counts[item.feature_name] || 0) + 1;
      });
      return counts;
    },
  });

  // Top users by wear entries
  const { data: topUsers } = useQuery({
    queryKey: ['metrics-top-users'],
    queryFn: async () => {
      const { data: entries, error: entriesError } = await supabase
        .from('wear_entries')
        .select('user_id');
      if (entriesError) throw entriesError;

      const userCounts: Record<string, number> = {};
      entries?.forEach(entry => {
        if (entry.user_id) {
          userCounts[entry.user_id] = (userCounts[entry.user_id] || 0) + 1;
        }
      });

      const topUserIds = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, count }));

      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', topUserIds.map(u => u.id));

      return topUserIds.map(u => ({
        ...u,
        email: profiles?.find(p => p.id === u.id)?.email || 'Unknown',
        name: profiles?.find(p => p.id === u.id)?.full_name || '',
      }));
    },
  });

  // Recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['metrics-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_logs')
        .select('action, created_at, user_email')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Watches</CardTitle>
            <Watch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWatches ?? '-'}</div>
            <p className="text-xs text-muted-foreground">In all collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wear Entries</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWearEntries ?? '-'}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyWearEntries ?? 0} this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Users by Activity
            </CardTitle>
            <CardDescription>Most active users by wear entries</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers?.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{user.name || user.email}</div>
                        {user.name && (
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {user.count}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!topUsers || topUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity?.map((activity) => (
                <div key={activity.created_at} className="flex justify-between items-center text-sm">
                  <div>
                    <Badge variant="outline" className="mr-2">{activity.action}</Badge>
                    <span className="text-muted-foreground">{activity.user_email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(activity.created_at), 'HH:mm')}
                  </span>
                </div>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                <p className="text-center text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Feature Usage This Month</CardTitle>
          <CardDescription>Usage count per AI feature</CardDescription>
        </CardHeader>
        <CardContent>
          {aiUsage && Object.keys(aiUsage).length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {Object.entries(aiUsage).map(([feature, count]) => (
                <div key={feature} className="flex items-center gap-2 p-3 border rounded-lg">
                  <span className="font-medium">{feature}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No AI feature usage this month</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}