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

  // Define filteredAssets before it's used in useMemo
  const filteredAssets = assets || [];

  // Time Range Filter Logic - MUST BE BEFORE EARLY RETURN
  const [timeRange, setTimeRange] = useState('Day');
  
  const chartData = React.useMemo(() => {
    if (!filteredAssets || filteredAssets.length === 0) return [];

    const today = new Date();
    
    // 1. Find earliest purchase date
    let earliestDate = new Date();
    filteredAssets.forEach(a => {
      if (a.purchaseDate) {
        const pd = new Date(a.purchaseDate);
        if (pd < earliestDate) earliestDate = pd;
      }
    });

    // 2. Determine absolute start date based on timeRange
    let rangeStartDate = new Date();
    switch (timeRange) {
      case 'Day': rangeStartDate.setMonth(rangeStartDate.getMonth() - 1); break;
      case 'Month': rangeStartDate.setFullYear(rangeStartDate.getFullYear() - 1); break;
      case '3 Month': rangeStartDate.setFullYear(rangeStartDate.getFullYear() - 2); break;
      case '6 Month': rangeStartDate.setFullYear(rangeStartDate.getFullYear() - 4); break;
      case 'Year': rangeStartDate.setFullYear(rangeStartDate.getFullYear() - 10); break;
    }

    // 3. Start from the later of the two dates so the graph doesn't show 10 years of flat 0 if they bought yesterday.
    let actualStart = earliestDate < rangeStartDate ? rangeStartDate : earliestDate;
    
    // Generate nodes
    const nodes: Date[] = [];
    let current = new Date(actualStart);
    
    // Floor the current date based on the interval so nodes are clean (e.g. 1st of month)
    if (timeRange !== 'Day') {
        current.setDate(1); // Start at 1st of the month
        if (timeRange === 'Year') current.setMonth(0);
    }

    while (current <= today) {
      nodes.push(new Date(current));
      if (timeRange === 'Day') {
        current.setDate(current.getDate() + 1);
      } else if (timeRange === 'Month') {
        current.setMonth(current.getMonth() + 1);
      } else if (timeRange === '3 Month') {
        current.setMonth(current.getMonth() + 3);
      } else if (timeRange === '6 Month') {
        current.setMonth(current.getMonth() + 6);
      } else if (timeRange === 'Year') {
        current.setFullYear(current.getFullYear() + 1);
      }
    }
    
    // Ensure today is always the final node for accurate current value
    if (nodes.length === 0 || nodes[nodes.length - 1].getTime() !== today.getTime()) {
      nodes.push(new Date(today));
    }

    // 4. Calculate interpolated values for each node
    return nodes.map(nodeDate => {
      let totalInvested = 0;
      let totalNetWorth = 0;

      filteredAssets.forEach(a => {
        if (!a.purchaseDate) return;
        const purchaseDate = new Date(a.purchaseDate);
        
        if (purchaseDate <= nodeDate) {
          const invested = Number(a.investedAmount) || 0;
          const currentVal = Number(a.currentValue) || invested;
          totalInvested += invested;
          
          // Calculate linear interpolation of gain
          const totalDaysHeld = Math.max(1, (today.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
          const daysHeldAtNode = Math.max(0, (nodeDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
          
          const ratio = daysHeldAtNode / totalDaysHeld;
          const gain = currentVal - invested;
          
          totalNetWorth += invested + (gain * ratio);
        }
      });

      // Format display date
      let displayDate = '';
      if (timeRange === 'Day') {
        displayDate = nodeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeRange === 'Month') {
        displayDate = nodeDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else if (timeRange === '3 Month') {
        const quarter = Math.floor(nodeDate.getMonth() / 3) + 1;
        displayDate = `Q${quarter} '${nodeDate.getFullYear().toString().slice(2)}`;
      } else if (timeRange === '6 Month') {
        const half = Math.floor(nodeDate.getMonth() / 6) + 1;
        displayDate = `H${half} '${nodeDate.getFullYear().toString().slice(2)}`;
      } else if (timeRange === 'Year') {
        displayDate = nodeDate.getFullYear().toString();
      }

      return {
        date: nodeDate.toISOString(),
        displayDate,
        totalInvested,
        totalNetWorth
      };
    });
  }, [filteredAssets, timeRange]);

  if (assetsLoading || snapshotsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
      </div>
    );
  }

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
          <h2 className="text-display text-2xl text-primary">{formatCurrency(totalInvested)}</h2>
        </div>
        <div className="glass-card p-6">
          <p className="text-text-secondary text-sm mb-1">Total Gain</p>
          <h2 className={`text-display text-2xl ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{formatCurrency(totalGain)}
          </h2>
        </div>
        <div className="glass-card p-6">
          <p className="text-text-secondary text-sm mb-1">Overall Return</p>
          <h2 className={`text-display text-2xl ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{overallReturn.toFixed(2)}%
          </h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 glass-card p-6 min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-medium">Historical Net Worth</h3>
            <div className="flex flex-wrap gap-1 p-1 bg-surface-hover rounded-lg border border-border">
              {['Day', 'Month', '3 Month', '6 Month', 'Year'].map(range => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === range ? 'bg-surface shadow-sm border border-border text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface/50 border border-transparent'}`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {chartData?.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-text-muted">
              No historical data available for this range.
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#64748B" 
                    tick={{fill: '#64748B', fontSize: 12}}
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="#64748B" 
                    tick={{fill: '#64748B', fontSize: 12}}
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                    width={80}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '8px' }}
                    itemStyle={{ color: '#0F172A' }}
                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalNetWorth" 
                    name="Net Worth"
                    stroke="#0EA5E9" 
                    strokeWidth={3}
                    dot={{ fill: '#0EA5E9', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#38BDF8' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalInvested" 
                    name="Invested"
                    stroke="#6366F1" 
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
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {allocationData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '8px' }}
                    itemStyle={{ color: '#0F172A' }}
                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  />
                  <Legend 
                    layout="horizontal" 
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
