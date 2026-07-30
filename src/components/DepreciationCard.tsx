import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, DollarSign } from "lucide-react";

interface DepreciationCardProps {
  totalMSRP: number;
  pricePaid: number;
  marketValue: number;
  depreciation: number;
  depreciationPercent: number;
  missingMSRPCount?: number;
}

export const DepreciationCard = ({
  totalMSRP,
  pricePaid,
  marketValue,
  depreciation,
  depreciationPercent,
  missingMSRPCount = 0,
}: DepreciationCardProps) => {
  const isAppreciation = depreciation < 0;
  // Price paid is the reference amount for both comparisons.
  const msrpVsPaidPercent =
    pricePaid > 0 ? ((totalMSRP - pricePaid) / pricePaid) * 100 : 0;
  const paidBelowMsrp = msrpVsPaidPercent >= 0;
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="border-border bg-card hover:shadow-[var(--shadow-glow)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Pricing Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">MSRP</p>
            <p className="text-xl font-bold text-foreground">
              {totalMSRP > 0 ? formatCurrency(totalMSRP) : "N/A"}
            </p>
            {missingMSRPCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {missingMSRPCount} without MSRP — price paid used
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Price Paid</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(pricePaid)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Market Value</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(marketValue)}
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border space-y-3">
          {totalMSRP > 0 && pricePaid > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {paidBelowMsrp ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  MSRP vs Price Paid
                </span>
              </div>
              <div className="text-right">
                <p
                  className={`text-xl font-bold ${
                    paidBelowMsrp ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {paidBelowMsrp ? "+" : "-"}
                  {Math.abs(msrpVsPaidPercent).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {paidBelowMsrp ? "paid below MSRP" : "paid above MSRP"}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAppreciation ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                Market Value vs Price Paid
              </span>
            </div>
            <div className="text-right">
              <p
                className={`text-xl font-bold ${
                  isAppreciation ? "text-green-500" : "text-red-500"
                }`}
              >
                {isAppreciation ? "+" : "-"}{Math.abs(depreciationPercent).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {isAppreciation ? "above what you paid" : "below what you paid"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
