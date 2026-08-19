// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { getAllAssets } from '../api/assets.api';
import { getAllLiabilities } from '../api/liabilities.api';
import { getSnapshots, captureSnapshot } from '../api/snapshots.api';
import { getAnalyticsSummary, getBenchmarks } from '../api/analytics.api';
import { getEmergencyFund } from '../api/planning.api';
import {
  getPriceAlerts,
  createPriceAlert,
  deletePriceAlert,
  getNotifications,
  markNotificationRead,
  getRebalancingStatus,
  saveRebalancingTarget,
} from '../api/alerts.api';
import { Loader2, TrendingUp, TrendingDown, Landmark, Scale, AlertTriangle, Sliders, ShieldCheck, Droplets, Bell, Target, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';

const COLORS = ['#0EA5E9', '#10B981', '#6366F1', '#EF4444', '#F59E0B', '#EC4899'];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Queries
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets
  });

  const { data: liabilities, isLoading: liabilitiesLoading } = useQuery({
    queryKey: ['liabilities', 'all'],
    queryFn: getAllLiabilities
  });

  const { data: snapshots, isLoading: snapshotsLoading } = useQuery({
    queryKey: ['snapshots'],
    queryFn: getSnapshots
  });

  const { data: analytics } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: getAnalyticsSummary
  });

  const { data: emergencyFund } = useQuery({
    queryKey: ['emergencyFund'],
    queryFn: getEmergencyFund
  });

  const { data: priceAlerts } = useQuery({
    queryKey: ['priceAlerts'],
    queryFn: getPriceAlerts,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const { data: rebalancing } = useQuery({
    queryKey: ['rebalancing'],
    queryFn: getRebalancingStatus,
  });

  // Benchmark toggle states
  const [showNifty, setShowNifty] = useState(false);
  const [showGoldBenchmark, setShowGoldBenchmark] = useState(false);

  // What-If Simulator state (percentage changes)
  const [whatIfGold, setWhatIfGold] = useState(0);
  const [whatIfStock, setWhatIfStock] = useState(0);
  const [whatIfMF, setWhatIfMF] = useState(0);
  const [whatIfCrypto, setWhatIfCrypto] = useState(0);

  // Automation state
  const [alertAssetId, setAlertAssetId] = useState('');
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState('ABOVE');
  const [rebalanceEquity, setRebalanceEquity] = useState(60);
  const [rebalanceDebt, setRebalanceDebt] = useState(30);
  const [rebalanceGold, setRebalanceGold] = useState(10);
  const [rebalanceThreshold, setRebalanceThreshold] = useState(5);

  // Capture snapshot on mount to ensure we have real data for today
  useEffect(() => {
    captureSnapshot().then(() => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    }).catch(console.error);
  }, [queryClient]);

  useEffect(() => {
    if (rebalancing) {
      setRebalanceEquity(rebalancing.targetEquityPct);
      setRebalanceDebt(rebalancing.targetDebtPct);
      setRebalanceGold(rebalancing.targetGoldPct);
      setRebalanceThreshold(rebalancing.driftThresholdPct);
    }
  }, [rebalancing]);

  // Time Range Filter Logic
  const [timeRange, setTimeRange] = useState('ALL');

  // Find earliest purchase/start date for query timing
  const earliestDate = React.useMemo(() => {
    let earliest = new Date();
    assets?.forEach(a => {
      if (a.purchaseDate) {
        const pd = new Date(a.purchaseDate);
        if (pd < earliest) earliest = pd;
      }
    });
    liabilities?.forEach(l => {
      if (l.startDate) {
        const sd = new Date(l.startDate);
        if (sd < earliest) earliest = sd;
      }
    });
    return earliest;
  }, [assets, liabilities]);

  const startDateStr = React.useMemo(() => {
    const today = new Date();
    let rangeStartDate = new Date(earliestDate);
    if (timeRange === '1M') {
      rangeStartDate = new Date();
      rangeStartDate.setMonth(today.getMonth() - 1);
    } else if (timeRange === '3M') {
      rangeStartDate = new Date();
      rangeStartDate.setMonth(today.getMonth() - 3);
    } else if (timeRange === '6M') {
      rangeStartDate = new Date();
      rangeStartDate.setMonth(today.getMonth() - 6);
    } else if (timeRange === '1Y') {
      rangeStartDate = new Date();
      rangeStartDate.setFullYear(today.getFullYear() - 1);
    }
    const actualStart = earliestDate < rangeStartDate ? rangeStartDate : earliestDate;
    return actualStart.toLocaleDateString('en-CA');
  }, [earliestDate, timeRange]);

  const endDateStr = React.useMemo(() => {
    return new Date().toLocaleDateString('en-CA');
  }, []);

  const { data: benchmarks } = useQuery({
    queryKey: ['benchmarks', startDateStr, endDateStr],
    queryFn: () => getBenchmarks(startDateStr, endDateStr),
    enabled: !!assets && assets.length > 0
  });
  
  const chartData = React.useMemo(() => {
    if (!assets) return [];

    const today = new Date();
    
    // 1. Find earliest purchase/start date
    let earliestDate = new Date();
    assets.forEach(a => {
      if (a.purchaseDate) {
        const pd = new Date(a.purchaseDate);
        if (pd < earliestDate) earliestDate = pd;
      }
    });
    liabilities?.forEach(l => {
      if (l.startDate) {
        const sd = new Date(l.startDate);
        if (sd < earliestDate) earliestDate = sd;
      }
    });

    // 2. Determine start date and interval type based on timeRange
    let rangeStartDate = new Date(earliestDate);
    let stepType: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month';

    if (timeRange === '1M') {
      rangeStartDate = new Date();
      rangeStartDate.setMonth(today.getMonth() - 1);
      stepType = 'day';
    } else if (timeRange === '3M') {
      rangeStartDate = new Date();
      rangeStartDate.setMonth(today.getMonth() - 3);
      stepType = 'week';
    } else if (timeRange === '6M') {
      rangeStartDate = new Date();
      rangeStartDate.setMonth(today.getMonth() - 6);
      stepType = 'week';
    } else if (timeRange === '1Y') {
      rangeStartDate = new Date();
      rangeStartDate.setFullYear(today.getFullYear() - 1);
      stepType = 'month';
    } else if (timeRange === 'ALL') {
      rangeStartDate = new Date(earliestDate);
      const diffYears = (today.getTime() - earliestDate.getTime()) / (1000 * 3600 * 24 * 365);
      if (diffYears > 5) {
        stepType = 'year';
      } else if (diffYears > 2) {
        stepType = 'quarter';
      } else {
        stepType = 'month';
      }
    }

    // Don't show flat zero years if they bought recently
    let actualStart = earliestDate < rangeStartDate ? rangeStartDate : earliestDate;
    
    // Generate nodes
    const nodes: Date[] = [];
    let current = new Date(actualStart);
    
    // Floor the date to make display clean
    if (stepType === 'month' || stepType === 'quarter') {
      current.setDate(1);
    } else if (stepType === 'year') {
      current.setDate(1);
      current.setMonth(0);
    }

    while (current <= today) {
      nodes.push(new Date(current));
      if (stepType === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (stepType === 'week') {
        current.setDate(current.getDate() + 7);
      } else if (stepType === 'month') {
        current.setMonth(current.getMonth() + 1);
      } else if (stepType === 'quarter') {
        current.setMonth(current.getMonth() + 3);
      } else if (stepType === 'year') {
        current.setFullYear(current.getFullYear() + 1);
      }
    }
    
    // Ensure today is the final node
    if (nodes.length === 0 || nodes[nodes.length - 1].toDateString() !== today.toDateString()) {
      nodes.push(new Date(today));
    }

    // 3. Pre-calculate values for each node to find starting Net Worth
    const rawNodes = nodes.map(nodeDate => {
      let totalAssetsVal = 0;
      let totalLiabilitiesVal = 0;

      // Interpolate Assets
      assets.forEach(a => {
        if (!a.purchaseDate) return;
        const purchaseDate = new Date(a.purchaseDate);
        if (purchaseDate <= nodeDate) {
          const invested = Number(a.investedAmount) || 0;
          const currentValue = Number(a.currentValue) || invested;
          
          const totalDaysHeld = Math.max(1, (today.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
          const daysHeldAtNode = Math.max(0, (nodeDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
          
          const ratio = Math.min(1, daysHeldAtNode / totalDaysHeld);
          const gain = currentValue - invested;
          
          totalAssetsVal += invested + (gain * ratio);
        }
      });

      // Interpolate Liabilities (Reducing Balance simulation)
      liabilities?.forEach(l => {
        if (!l.startDate) return;
        const startDate = new Date(l.startDate);
        if (startDate <= nodeDate) {
          const diffYear = nodeDate.getFullYear() - startDate.getFullYear();
          const diffMonth = nodeDate.getMonth() - startDate.getMonth();
          const monthsPassed = Math.max(0, diffYear * 12 + diffMonth);

          let remainingBalance = Number(l.principalAmount) || 0;
          const monthlyRate = (Number(l.interestRate) || 0) / 100 / 12;
          const emi = Number(l.emi) || 0;

          if (monthlyRate > 0 && emi > 0) {
            for (let i = 0; i < monthsPassed; i++) {
              const interest = remainingBalance * monthlyRate;
              const principalPaid = Math.min(remainingBalance, emi - interest);
              remainingBalance = Math.max(0, remainingBalance - principalPaid);
            }
          } else {
            const totalMonths = Number(l.tenureMonths) || 12;
            const elapsedRatio = Math.min(1, monthsPassed / totalMonths);
            remainingBalance = Math.max(0, remainingBalance * (1 - elapsedRatio));
          }

          totalLiabilitiesVal += remainingBalance;
        }
      });

      return {
        nodeDate,
        totalAssetsVal,
        totalLiabilitiesVal,
        totalNetWorthVal: totalAssetsVal - totalLiabilitiesVal
      };
    });

    let userNetWorthStart = 100000;
    if (rawNodes.length > 0) {
      userNetWorthStart = rawNodes[0].totalNetWorthVal;
      if (userNetWorthStart <= 0) userNetWorthStart = 100000;
    }

    let niftyStart = 1;
    let goldStart = 1;
    if (benchmarks && benchmarks.length > 0) {
      const sortedBM = [...benchmarks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      niftyStart = sortedBM[0].nifty50 || 1;
      goldStart = sortedBM[0].gold || 1;
    }

    return rawNodes.map(rn => {
      const nodeDateStr = rn.nodeDate.toLocaleDateString('en-CA');
      
      let bmPoint = benchmarks?.find(bm => bm.date === nodeDateStr);
      if (!bmPoint && benchmarks && benchmarks.length > 0) {
        let minDiff = Infinity;
        benchmarks.forEach(bm => {
          const diff = Math.abs(new Date(bm.date).getTime() - rn.nodeDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            bmPoint = bm;
          }
        });
      }

      const niftyVal = bmPoint ? bmPoint.nifty50 : niftyStart;
      const goldVal = bmPoint ? bmPoint.gold : goldStart;

      const scaledNifty = (niftyVal / niftyStart) * userNetWorthStart;
      const scaledGold = (goldVal / goldStart) * userNetWorthStart;

      let displayDate = '';
      if (stepType === 'day') {
        displayDate = rn.nodeDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      } else if (stepType === 'week') {
        displayDate = rn.nodeDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      } else if (stepType === 'month') {
        displayDate = rn.nodeDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      } else if (stepType === 'quarter') {
        const quarter = Math.floor(rn.nodeDate.getMonth() / 3) + 1;
        displayDate = `Q${quarter} '${rn.nodeDate.getFullYear().toString().slice(2)}`;
      } else if (stepType === 'year') {
        displayDate = rn.nodeDate.getFullYear().toString();
      }

      return {
        date: rn.nodeDate.toISOString(),
        displayDate,
        totalAssets: rn.totalAssetsVal,
        totalLiabilities: rn.totalLiabilitiesVal,
        totalNetWorth: rn.totalNetWorthVal,
        scaledNifty,
        scaledGold
      };
    });
  }, [assets, liabilities, timeRange, benchmarks]);

  const automationAssets = assets?.filter((asset) => ['STOCK', 'MUTUAL_FUND', 'GOLD'].includes(asset.assetType)) || [];

  const createAlertMutation = useMutation({
    mutationFn: createPriceAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setAlertTargetPrice('');
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: deletePriceAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const readNotificationMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const saveRebalanceMutation = useMutation({
    mutationFn: saveRebalancingTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rebalancing'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const onSelectAlertAsset = (value: string) => {
    setAlertAssetId(value);
    const selected = automationAssets.find((asset) => String(asset.id) === value);
    if (selected?.currentValue) {
      setAlertTargetPrice(String(Number(selected.currentValue).toFixed(2)));
    }
  };

  const submitPriceAlert = () => {
    const selected = automationAssets.find((asset) => String(asset.id) === alertAssetId);
    if (!selected || !alertTargetPrice) return;
    createAlertMutation.mutate({
      assetId: selected.id,
      assetName: selected.name,
      assetType: selected.assetType,
      targetPrice: Number(alertTargetPrice),
      alertCondition,
    });
  };

  const submitRebalancingTarget = () => {
    const total = rebalanceEquity + rebalanceDebt + rebalanceGold;
    if (total <= 0) return;
    saveRebalanceMutation.mutate({
      targetEquityPct: rebalanceEquity,
      targetDebtPct: rebalanceDebt,
      targetGoldPct: rebalanceGold,
      driftThresholdPct: rebalanceThreshold,
    });
  };

  if (assetsLoading || liabilitiesLoading || snapshotsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
      </div>
    );
  }

  // Calculate Metrics
  const totalAssets = assets?.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0;
  const totalLiabilities = liabilities?.reduce((sum, item) => sum + (item.outstandingBalance || 0), 0) || 0;
  const netWorth = totalAssets - totalLiabilities;
  const totalInvested = assets?.reduce((sum, asset) => sum + (asset.investedAmount || 0), 0) || 0;
  const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  const liquidAssets = assets?.filter(a => a.assetType !== 'REAL_ESTATE').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
  const illiquidAssets = assets?.filter(a => a.assetType === 'REAL_ESTATE').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
  const liquidPct = totalAssets > 0 ? (liquidAssets / totalAssets) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepare Pie Chart Data
  const allocationData = assets?.reduce((acc: any, asset) => {
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
      
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-heading text-2xl font-dmsans">Personal Dashboard</h1>
      </div>

      {/* Diversification Warnings Banner */}
      {analytics?.warnings && analytics.warnings.length > 0 && (
        <div className="space-y-2">
          {analytics.warnings.map((warning, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-sm shadow-sm animate-in fade-in duration-300">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="font-medium">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hero Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hero Card: Net Worth */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-secondary text-sm font-medium">Net Worth</p>
            <Scale className="w-5 h-5 text-accent-500" />
          </div>
          <h2 className="networth-amount text-3xl font-bold text-accent-500">{formatCurrency(netWorth)}</h2>
          <div className="flex items-center justify-between text-xs text-text-muted mt-2">
            <span>Assets − Liabilities</span>
            {analytics && analytics.portfolioXirr !== 0 && (
              <span className="font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                XIRR: {analytics.portfolioXirr.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Total Assets */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-secondary text-sm font-medium">Total Assets</p>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-display text-2xl font-bold text-emerald-400">{formatCurrency(totalAssets)}</h2>
          <p className="text-xs text-text-muted mt-2">Invested: {formatCurrency(totalInvested)}</p>
        </div>

        {/* Card 3: Total Liabilities */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-secondary text-sm font-medium">Total Liabilities</p>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-display text-2xl font-bold text-red-400">{formatCurrency(totalLiabilities)}</h2>
          <p className="text-xs text-text-muted mt-2">Outstanding debt obligations</p>
        </div>

        {/* Card 4: Debt-to-Asset Ratio */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-secondary text-sm font-medium">Debt-to-Asset Ratio</p>
            <Landmark className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-display text-2xl font-bold text-indigo-400">{debtToAssetRatio.toFixed(2)}%</h2>
          <p className="text-xs text-text-muted mt-2">Lower is better (ideal &lt; 35%)</p>
        </div>
      </div>
      
      {/* Liquidity Split & Emergency Fund Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Liquid vs Illiquid Breakdown */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-secondary text-sm font-medium">Liquidity Breakdown</p>
              <Droplets className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-2xl font-bold text-sky-500">{formatCurrency(liquidAssets)}</span>
              <span className="text-xs font-semibold text-text-secondary">{liquidPct.toFixed(1)}% Liquid</span>
            </div>
            <div className="w-full h-2.5 bg-surface-hover rounded-full overflow-hidden flex border border-border">
              <div className="h-full bg-sky-400 transition-all duration-500" style={{ width: `${liquidPct}%` }} title="Liquid Assets" />
              <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${100 - liquidPct}%` }} title="Illiquid Assets" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-3">
            <span>Liquid: {formatCurrency(liquidAssets)} (Stocks, MFs, Gold, Crypto)</span>
            <span>Illiquid: {formatCurrency(illiquidAssets)} (Real Estate)</span>
          </div>
        </div>

        {/* Emergency Fund Summary Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-secondary text-sm font-medium">Emergency Fund Coverage</p>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-2xl font-bold text-emerald-400">{formatCurrency(emergencyFund?.currentLiquidAssets || liquidAssets)}</span>
              <span className="text-xs font-semibold text-text-secondary">{(emergencyFund?.progressPercentage || 0).toFixed(1)}% Prepared</span>
            </div>
            <div className="w-full h-2.5 bg-surface-hover rounded-full overflow-hidden border border-border">
              <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${Math.min(100, emergencyFund?.progressPercentage || 0)}%` }} />
            </div>
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-3">
            <span>Target: {formatCurrency(emergencyFund?.targetCorpus || 0)} ({emergencyFund?.targetMonths || 6} Months)</span>
            <span className="text-accent-500 font-semibold cursor-pointer hover:underline" onClick={() => navigate('/goals')}>Manage Goals & Planning →</span>
          </div>
        </div>
      </div>

      {/* Automation & Notifications */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-text-primary flex items-center gap-2"><Bell className="w-5 h-5 text-accent-500" /> Price Alerts</h3>
              <p className="text-xs text-text-secondary mt-1">Create live threshold alerts for stocks, mutual funds, and gold.</p>
            </div>
            <Sparkles className="w-5 h-5 text-accent-500/70" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <select
              value={alertAssetId}
              onChange={(e) => onSelectAlertAsset(e.target.value)}
              className="glass-input"
            >
              <option value="">Select asset</option>
              {automationAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.assetType.replace('_', ' ')})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={alertCondition} onChange={(e) => setAlertCondition(e.target.value)} className="glass-input">
                <option value="ABOVE">Crosses above</option>
                <option value="BELOW">Crosses below</option>
              </select>
              <input
                type="number"
                value={alertTargetPrice}
                onChange={(e) => setAlertTargetPrice(e.target.value)}
                placeholder="Target price"
                className="glass-input"
              />
            </div>
            <button
              onClick={submitPriceAlert}
              disabled={createAlertMutation.isPending || !alertAssetId || !alertTargetPrice}
              className="btn-primary justify-center"
            >
              {createAlertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Alert'}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {priceAlerts?.length ? priceAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-surface-hover border border-border">
                <div>
                  <p className="font-medium text-sm text-text-primary">{alert.assetName}</p>
                  <p className="text-xs text-text-secondary">{alert.alertCondition} {formatCurrency(alert.targetPrice)} {alert.lastObservedPrice ? ` • Last ${formatCurrency(alert.lastObservedPrice)}` : ''}</p>
                </div>
                <button
                  onClick={() => deleteAlertMutation.mutate(alert.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )) : (
              <div className="text-sm text-text-muted border border-dashed border-border rounded-xl p-4 text-center">
                No active price alerts yet.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-text-primary flex items-center gap-2"><Target className="w-5 h-5 text-emerald-400" /> Rebalancing Nudge</h3>
              <p className="text-xs text-text-secondary mt-1">Track target allocation and drift against current holdings.</p>
            </div>
            {rebalancing?.needsRebalancing ? (
              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Action needed</span>
            ) : (
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">On target</span>
            )}
          </div>

          {rebalancing && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Equity', rebalancing.currentEquityPct, rebalancing.targetEquityPct],
                ['Debt', rebalancing.currentDebtPct, rebalancing.targetDebtPct],
                ['Gold', rebalancing.currentGoldPct, rebalancing.targetGoldPct],
              ].map(([label, current, target]) => (
                <div key={label} className="rounded-xl bg-surface-hover border border-border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
                  <p className="text-lg font-semibold text-text-primary">{Number(current).toFixed(1)}%</p>
                  <p className="text-[11px] text-text-secondary">Target {Number(target).toFixed(1)}%</p>
                </div>
              ))}
            </div>
          )}

          <p className={`text-sm ${rebalancing?.needsRebalancing ? 'text-amber-400' : 'text-text-secondary'}`}>
            {rebalancing?.nudgeMessage || 'Set your allocation target to begin tracking drift.'}
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={rebalanceEquity} onChange={(e) => setRebalanceEquity(Number(e.target.value))} className="glass-input" placeholder="Equity %" />
              <input type="number" value={rebalanceDebt} onChange={(e) => setRebalanceDebt(Number(e.target.value))} className="glass-input" placeholder="Debt %" />
              <input type="number" value={rebalanceGold} onChange={(e) => setRebalanceGold(Number(e.target.value))} className="glass-input" placeholder="Gold %" />
            </div>
            <input
              type="number"
              value={rebalanceThreshold}
              onChange={(e) => setRebalanceThreshold(Number(e.target.value))}
              className="glass-input"
              placeholder="Drift threshold %"
            />
            <button
              onClick={submitRebalancingTarget}
              disabled={saveRebalanceMutation.isPending}
              className="btn-primary justify-center"
            >
              {saveRebalanceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Target Allocation'}
            </button>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-text-primary flex items-center gap-2"><Bell className="w-5 h-5 text-sky-400" /> In-App Notifications</h3>
              <p className="text-xs text-text-secondary mt-1">Recent alerts, reminders, and digest notices.</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-sky-400/70" />
          </div>

          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {notifications?.length ? notifications.slice(0, 6).map((item) => (
              <div key={item.id} className={`p-3 rounded-xl border ${item.read ? 'bg-surface-hover border-border' : 'bg-sky-500/10 border-sky-500/20'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm text-text-primary">{item.title}</p>
                    <p className="text-xs text-text-secondary mt-1">{item.message}</p>
                  </div>
                  {!item.read && (
                    <button
                      onClick={() => readNotificationMutation.mutate(item.id)}
                      className="text-xs text-sky-400 hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-sm text-text-muted border border-dashed border-border rounded-xl p-4 text-center">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical and Allocation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 glass-card p-6 min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-medium text-text-primary">Historical Net Worth Trend</h3>
              <div className="flex items-center gap-4 text-xs font-medium text-text-secondary mt-1">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showNifty} 
                    onChange={(e) => setShowNifty(e.target.checked)} 
                    className="rounded border-border bg-surface-hover text-accent-500 focus:ring-accent-500 focus:ring-offset-0"
                  />
                  Overlay Nifty 50
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showGoldBenchmark} 
                    onChange={(e) => setShowGoldBenchmark(e.target.checked)} 
                    className="rounded border-border bg-surface-hover text-accent-500 focus:ring-accent-500 focus:ring-offset-0"
                  />
                  Overlay Gold Index
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 p-1 bg-surface-hover rounded-lg border border-border">
              {['1M', '3M', '6M', '1Y', 'ALL'].map(range => (
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
              No historical snapshot data available for this range.
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#64748B" 
                    tick={{fill: '#94A3B8', fontSize: 11}}
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="#64748B" 
                    tick={{fill: '#94A3B8', fontSize: 11}}
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                    width={70}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px' }}
                    itemStyle={{ color: '#F8FAFC' }}
                    labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalAssets" 
                    name="Total Assets"
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalLiabilities" 
                    name="Total Liabilities"
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={false}
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
                  {showNifty && (
                    <Line 
                      type="monotone" 
                      dataKey="scaledNifty" 
                      name="Nifty 50 Index" 
                      stroke="#818CF8" 
                      strokeWidth={1.5} 
                      strokeDasharray="4 4" 
                      dot={false} 
                    />
                  )}
                  {showGoldBenchmark && (
                    <Line 
                      type="monotone" 
                      dataKey="scaledGold" 
                      name="Gold Price Index" 
                      stroke="#FBBF24" 
                      strokeWidth={1.5} 
                      strokeDasharray="4 4" 
                      dot={false} 
                    />
                  )}
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Donut Chart */}
        <div className="glass-card p-6 min-h-[400px]">
          <h3 className="text-lg font-medium mb-6 text-text-primary">Asset Allocation</h3>
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
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px' }}
                    itemStyle={{ color: '#F8FAFC' }}
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

      {/* Performers & What-If Simulator Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Performers Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium mb-4 text-text-primary">Performance Highlights</h3>
            
            {/* Best Performer */}
            {analytics?.bestPerformer ? (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">Best Performing Asset</div>
                <div className="font-semibold text-text-primary text-base truncate">{analytics.bestPerformer.name}</div>
                <div className="text-text-secondary text-xs capitalize">{analytics.bestPerformer.assetType.toLowerCase().replace('_', ' ')}</div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-text-secondary">Current Yield:</span>
                  <span className="font-bold text-emerald-500">+{analytics.bestPerformer.gainPercentage.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 rounded-xl bg-surface-hover text-text-muted text-xs text-center">
                No asset gains calculated yet.
              </div>
            )}

            {/* Worst Performer */}
            {analytics?.worstPerformer ? (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Worst Performing Asset</div>
                <div className="font-semibold text-text-primary text-base truncate">{analytics.worstPerformer.name}</div>
                <div className="text-text-secondary text-xs capitalize">{analytics.worstPerformer.assetType.toLowerCase().replace('_', ' ')}</div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-text-secondary">Current Returns:</span>
                  <span className="font-bold text-red-400">{analytics.worstPerformer.gainPercentage.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-hover text-text-muted text-xs text-center">
                No asset loss calculated yet.
              </div>
            )}
          </div>
        </div>

        {/* What-If Simulator Panel */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-5 h-5 text-accent-500" />
              <h3 className="text-lg font-medium text-text-primary">What-If Net Worth Simulator</h3>
            </div>
            <p className="text-xs text-text-secondary mb-6">Drag the sliders to simulate hypothetical asset price movements and view projected Net Worth adjustments instantly.</p>

            <div className="space-y-4">
              {/* Sliders */}
              <div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                  <span>Physical Gold Shift</span>
                  <span className={whatIfGold >= 0 ? 'text-emerald-500 font-semibold' : 'text-red-400 font-semibold'}>
                    {whatIfGold > 0 ? '+' : ''}{whatIfGold}%
                  </span>
                </div>
                <input 
                  type="range" min="-30" max="30" step="5" value={whatIfGold} onChange={(e) => setWhatIfGold(Number(e.target.value))}
                  className="w-full accent-accent-500 cursor-ew-resize bg-surface-hover h-2 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                  <span>Stocks Shift</span>
                  <span className={whatIfStock >= 0 ? 'text-emerald-500 font-semibold' : 'text-red-400 font-semibold'}>
                    {whatIfStock > 0 ? '+' : ''}{whatIfStock}%
                  </span>
                </div>
                <input 
                  type="range" min="-30" max="30" step="5" value={whatIfStock} onChange={(e) => setWhatIfStock(Number(e.target.value))}
                  className="w-full accent-accent-500 cursor-ew-resize bg-surface-hover h-2 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                  <span>Mutual Funds Shift</span>
                  <span className={whatIfMF >= 0 ? 'text-emerald-500 font-semibold' : 'text-red-400 font-semibold'}>
                    {whatIfMF > 0 ? '+' : ''}{whatIfMF}%
                  </span>
                </div>
                <input 
                  type="range" min="-30" max="30" step="5" value={whatIfMF} onChange={(e) => setWhatIfMF(Number(e.target.value))}
                  className="w-full accent-accent-500 cursor-ew-resize bg-surface-hover h-2 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                  <span>Cryptocurrency Shift</span>
                  <span className={whatIfCrypto >= 0 ? 'text-emerald-500 font-semibold' : 'text-red-400 font-semibold'}>
                    {whatIfCrypto > 0 ? '+' : ''}{whatIfCrypto}%
                  </span>
                </div>
                <input 
                  type="range" min="-50" max="50" step="5" value={whatIfCrypto} onChange={(e) => setWhatIfCrypto(Number(e.target.value))}
                  className="w-full accent-accent-500 cursor-ew-resize bg-surface-hover h-2 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Projection Output */}
          {(() => {
            const goldVal = assets?.filter(a => a.assetType === 'GOLD').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
            const stockVal = assets?.filter(a => a.assetType === 'STOCK').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
            const mfVal = assets?.filter(a => a.assetType === 'MUTUAL_FUND').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
            const cryptoVal = assets?.filter(a => a.assetType === 'CRYPTOCURRENCY').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;

            const delta = (whatIfGold/100)*goldVal + (whatIfStock/100)*stockVal + (whatIfMF/100)*mfVal + (whatIfCrypto/100)*cryptoVal;
            const projectedNetWorth = netWorth + delta;

            return (
              <div className="mt-6 p-4 rounded-2xl bg-surface-hover border border-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-text-secondary mb-1">Projected Net Worth</div>
                  <div className="text-2xl font-bold text-accent-500">{formatCurrency(projectedNetWorth)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-text-secondary mb-1">Difference</div>
                  <div className={`text-lg font-semibold ${delta >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
