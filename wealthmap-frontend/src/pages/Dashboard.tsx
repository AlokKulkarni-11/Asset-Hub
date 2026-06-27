import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAssets } from '../api/assets.api';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    );
  }

  const totalInvested = assets?.reduce((sum, asset) => sum + (asset.investedAmount || 0), 0) || 0;
  const totalCurrentValue = assets?.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0;
  const totalGain = totalCurrentValue - totalInvested;
  const overallReturn = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const isPositive = totalGain >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Cards */}
        <div className="glass-card p-6">
          <p className="text-text-secondary text-sm mb-1">Total Net Worth</p>
          <h2 className="networth-amount text-3xl">{formatCurrency(totalCurrentValue)}</h2>
        </div>
        <div className="glass-card p-6">
          <p className="text-text-secondary text-sm mb-1">Total Invested</p>
          <h2 className="text-display text-2xl text-white">{formatCurrency(totalInvested)}</h2>
        </div>
        <div className="glass-card p-6">
          <p className="text-text-secondary text-sm mb-1">Total Gain</p>
          <h2 className={`text-display text-2xl ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{formatCurrency(totalGain)}
          </h2>
        </div>
        <div className="glass-card p-6">
          <p className="text-text-secondary text-sm mb-1">Overall Return</p>
          <h2 className={`text-display text-2xl ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{overallReturn.toFixed(2)}%
          </h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 min-h-[400px] flex items-center justify-center">
          <p className="text-text-muted">Net Worth Timeline Chart (Coming Soon)</p>
        </div>
        <div className="glass-card p-6 min-h-[400px] flex items-center justify-center">
          <p className="text-text-muted">Allocation Donut Chart (Coming Soon)</p>
        </div>
      </div>
    </div>
  );
}
