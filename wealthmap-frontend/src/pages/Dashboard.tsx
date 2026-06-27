import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllAssets } from '../api/assets.api';

import { getSnapshots, captureSnapshot } from '../api/snapshots.api';
import { Loader2 } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#D4A843', '#34D399', '#3B82F6', '#F87171', '#A78BFA'];

export default function Dashboard() {
  const queryClient = useQueryClient();

  // Queries
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets
  });

  const { data: snapshots, isLoading: snapshotsLoading } = useQuery({
    queryKey: ['snapshots'],
    queryFn: getSnapshots
  });

  // Capture snapshot on mount to ensure we have real data for today
  useEffect(() => {
    captureSnapshot().then(() => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    }).catch(console.error);
  }, [queryClient]);

  if (assetsLoading || snapshotsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    );
  }

  // Assets are strictly personal now
  const filteredAssets = assets;

  const totalInvested = filteredAssets?.reduce((sum, asset) => sum + (asset.investedAmount || 0), 0) || 0;
  const totalCurrentValue = filteredAssets?.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0;
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

  // Prepare Pie Chart Data
  const allocationData = filteredAssets?.reduce((acc: any, asset) => {
    const type = asset.assetType;
    const existing = acc.find((item: any) => item.name === type);
    if (existing) {
      existing.value += asset.currentValue;
    } else {
      acc.push({ name: type, value: asset.currentValue });
    }
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-heading text-2xl font-dmsans">Personal Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        
        {/* Line Chart */}
        <div className="lg:col-span-2 glass-card p-6 min-h-[400px]">
          <h3 className="text-lg font-medium mb-6">Historical Net Worth</h3>
          {snapshots?.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-text-muted">
              No historical data available yet.
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.5)" 
                    tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}}
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)" 
                    tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}}
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                    width={80}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0A0F1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalNetWorth" 
                    name="Net Worth"
                    stroke="#D4A843" 
                    strokeWidth={3}
                    dot={{ fill: '#D4A843', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#E8C265' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalInvested" 
                    name="Invested"
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Donut Chart */}
        <div className="glass-card p-6 min-h-[400px]">
          <h3 className="text-lg font-medium mb-6">Asset Allocation</h3>
          {allocationData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-text-muted">
              No assets to allocate.
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {allocationData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0A0F1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
