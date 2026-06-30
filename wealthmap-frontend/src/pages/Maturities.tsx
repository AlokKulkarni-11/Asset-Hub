import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFamilyAssets } from '../api/family.api';
import { AssetResponse } from '../api/assets.api';
import { Clock, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function Maturities() {
  const { data: familyAssets, isLoading } = useQuery({
    queryKey: ['family', 'assets'],
    queryFn: getFamilyAssets,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const maturities = useMemo(() => {
    if (!familyAssets) return [];

    const today = new Date();
    
    return familyAssets
      .filter((a: AssetResponse) => a.maturityDate) // Only items with maturity dates
      .map((a: AssetResponse) => {
        const matDate = parseISO(a.maturityDate!);
        const daysRemaining = differenceInDays(matDate, today);
        
        // Estimate Maturity Amount (Simple approximation if interest rate is provided)
        let estimatedAmount = a.investedAmount;
        if (a.assetType === 'FIXED_DEPOSIT' && a.interestRate && a.startDate) {
           const start = parseISO(a.startDate);
           const totalDays = differenceInDays(matDate, start);
           const totalYears = totalDays / 365.25;
           // Simple A = P(1 + rt) approximation for display
           estimatedAmount = a.investedAmount * (1 + ((a.interestRate/100) * totalYears));
        }

        return {
          ...a,
          matDate,
          daysRemaining,
          estimatedAmount
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [familyAssets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
      </div>
    );
  }

  const upcoming30Days = maturities.filter(m => m.daysRemaining >= 0 && m.daysRemaining <= 30);
  const totalUpcomingValue = upcoming30Days.reduce((sum, m) => sum + m.estimatedAmount, 0);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div>
        <h1 className="text-heading text-2xl font-dmsans">Upcoming Maturities</h1>
        <p className="text-text-secondary mt-2">Track fixed deposits and other assets nearing completion.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-text-secondary text-sm">Maturing in next 30 days</p>
          </div>
          <h2 className="text-display text-3xl text-red-400">{upcoming30Days.length} Assets</h2>
        </div>
        <div className="glass-card p-6">
           <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent-500" />
            <p className="text-text-secondary text-sm">Estimated Value (Next 30 Days)</p>
          </div>
          <h2 className="networth-amount text-4xl">{formatCurrency(totalUpcomingValue)}</h2>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-medium mb-6">Maturity Timeline</h3>
        
        {maturities.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <Clock className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-text-muted text-sm">No assets with upcoming maturity dates.</p>
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {maturities.map((item, idx) => {
              const isOverdue = item.daysRemaining < 0;
              const isUrgent = item.daysRemaining >= 0 && item.daysRemaining <= 30;
              const isSoon = item.daysRemaining > 30 && item.daysRemaining <= 90;
              
              let borderColor = 'border-border';
              let badgeColor = 'bg-surface-hover text-text-secondary';
              let iconColor = 'text-white/40';

              if (isOverdue) {
                borderColor = 'border-red-500/50';
                badgeColor = 'bg-red-500/20 text-red-400';
                iconColor = 'text-red-400';
              } else if (isUrgent) {
                borderColor = 'border-accent-500/20';
                badgeColor = 'bg-accent-500/10 text-accent-500';
                iconColor = 'text-accent-500';
              } else if (isSoon) {
                borderColor = 'border-yellow-500/30';
                badgeColor = 'bg-yellow-500/10 text-yellow-300';
                iconColor = 'text-yellow-300';
              }

              return (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-navy-950 bg-surface shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                    <Clock className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  
                  {/* Card */}
                  <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface border ${borderColor} p-5 rounded-xl shadow-xl transition-all hover:-translate-y-1`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${badgeColor}`}>
                        {isOverdue ? `${Math.abs(item.daysRemaining)} days overdue` : `In ${item.daysRemaining} days`}
                      </span>
                      <span className="text-xs text-text-secondary">{item.matDate.toLocaleDateString()}</span>
                    </div>
                    
                    <h4 className="font-medium text-lg text-white mt-2">{item.name}</h4>
                    <p className="text-sm text-text-secondary">{item.bankName || item.assetType.replace('_', ' ')}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                       <div>
                         <p className="text-xs text-text-muted mb-1">Principal</p>
                         <p className="font-medium">{formatCurrency(item.investedAmount)}</p>
                       </div>
                       <div>
                         <p className="text-xs text-text-muted mb-1">Est. Maturity</p>
                         <p className="font-medium text-accent-500">{formatCurrency(item.estimatedAmount)}</p>
                       </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                       <div className="text-[10px] bg-background px-2 py-1 rounded border border-white/5 text-text-muted">
                         Owner: {item.familyMemberName}
                       </div>
                       {item.interestRate && (
                         <div className="text-[10px] bg-background px-2 py-1 rounded border border-white/5 text-text-muted">
                           {item.interestRate}% Interest
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
