import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Users, MessageSquare, Calendar, Award } from "lucide-react";

interface ReputationData {
  reputation_score: number;
  account_age_days: number;
  post_count: number;
  completed_trades: number;
  trust_level: string;
  friend_count: number;
}

interface ReputationScoreCardProps {
  userId: string;
}

export function ReputationScoreCard({ userId }: ReputationScoreCardProps) {
  const [data, setData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any)
      .rpc("get_reputation_score", { _user_id: userId })
      .then(({ data: rows }: any) => {
        if (rows && rows.length > 0) setData(rows[0]);
        setLoading(false);
      });
  }, [userId]);

  if (loading || !data) return null;

  const scoreLabel =
    data.reputation_score >= 80 ? "Excellent" :
    data.reputation_score >= 50 ? "Good" :
    data.reputation_score >= 25 ? "Building" : "New";

  const scoreColor =
    data.reputation_score >= 80 ? "text-emerald-500" :
    data.reputation_score >= 50 ? "text-accent" :
    data.reputation_score >= 25 ? "text-amber-500" : "text-textMuted";

  return (
    <Card className="p-5 border-border">
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Reputation</h3>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className={`text-3xl font-bold ${scoreColor}`}>{data.reputation_score}</div>
        <div>
          <Badge variant="outline" className={scoreColor}>{scoreLabel}</Badge>
          <p className="text-xs text-muted-foreground mt-0.5">out of 100</p>
        </div>
      </div>

      <Progress value={data.reputation_score} className="mb-4 h-2" />

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{data.account_age_days} days active</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{data.post_count} posts</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>{data.completed_trades} trades</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{data.friend_count} connections</span>
        </div>
      </div>
    </Card>
  );
}
