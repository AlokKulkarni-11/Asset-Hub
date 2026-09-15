// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getAllAssets, AssetResponse } from '../api/assets.api';
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
import { useAuthStore } from '../store/authStore';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Landmark,
  Scale,
  AlertTriangle,
  Sliders,
  ShieldCheck,
  Droplets,
  Bell,
  Target,
  Trash2,
  CheckCircle2,
  Sparkles,
  GripVertical,
  Settings2,
  Eye,
  EyeOff,
  RotateCcw,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  X,
  Download,
} from 'lucide-react';
import ExportModal from '../components/forms/ExportModal';
import { FinancialHealthCard } from '../components/ai/FinancialHealthCard';
import { AiNarrativeCard } from '../components/ai/AiNarrativeCard';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { differenceInDays, parseISO } from 'date-fns';

const COLORS = ['#0EA5E9', '#10B981', '#6366F1', '#EF4444', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  gridSpan: string;
}

const DEFAULT_WIDGET_CONFIG: WidgetConfig[] = [
  { id: 'hero_stats', name: 'Key Wealth Metrics', description: 'Net Worth, Assets, Liabilities, and Debt-to-Asset ratio', visible: true, gridSpan: 'col-span-12' },
  { id: 'financial_health', name: 'Composite Financial Health', description: '0-100 gauge, 4 pillars, AI insights & recommendations', visible: true, gridSpan: 'col-span-12' },
  { id: 'liquidity_emergency', name: 'Liquidity & Emergency Fund', description: 'Liquid vs illiquid asset split and emergency buffer', visible: true, gridSpan: 'col-span-12' },
  { id: 'historical_chart', name: 'Historical Trend & Benchmarks', description: 'Net worth trendline overlaid against Nifty 50 and Gold', visible: true, gridSpan: 'col-span-12 lg:col-span-8' },
  { id: 'asset_allocation', name: 'Asset Allocation Donut', description: 'Distribution breakdown across all asset classes', visible: true, gridSpan: 'col-span-12 lg:col-span-4' },
  { id: 'performance_highlights', name: 'Performance Highlights', description: 'Top performing gainers and worst performing assets', visible: true, gridSpan: 'col-span-12 lg:col-span-4' },
  { id: 'what_if_simulator', name: 'What-If Net Worth Simulator', description: 'Live hypothetical asset price adjustment simulation', visible: true, gridSpan: 'col-span-12 lg:col-span-8' },
  { id: 'price_alerts_automation', name: 'Price Alerts & Rebalancing', description: 'Live alerts, drift rebalancing targets, and notices', visible: true, gridSpan: 'col-span-12' },
  { id: 'maturities_snapshot', name: 'Upcoming Maturities Snapshot', description: 'Upcoming FD, Bond, and PPF maturity timeline', visible: true, gridSpan: 'col-span-12' },
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Widget layout customization state
  const storageKey = useMemo(() => `assethub_dashboard_layout_${user?.id || 'default'}`, [user?.id]);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: WidgetConfig[] = JSON.parse(saved);
        const savedIds = new Set(parsed.map((w) => w.id));
        const missing = DEFAULT_WIDGET_CONFIG.filter((w) => !savedIds.has(w.id));
        return [...parsed, ...missing].map((item) => ({
          ...item,
          gridSpan: DEFAULT_WIDGET_CONFIG.find((d) => d.id === item.id)?.gridSpan || 'col-span-12',
        }));
      }
    } catch (e) {
      console.error('Failed to load dashboard layout', e);
    }
    return DEFAULT_WIDGET_CONFIG;
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);

  const saveWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newWidgets));
    } catch (e) {
      console.error('Failed to save layout', e);
    }
  };

  const toggleWidgetVisibility = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    saveWidgets(updated);
  };

  const moveWidget = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= widgets.length) return;
    const reordered = [...widgets];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    saveWidgets(reordered);
  };

  const resetToDefaultLayout = () => {
    saveWidgets(DEFAULT_WIDGET_CONFIG);
  };

  // Queries
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets,
  });

  const { data: liabilities, isLoading: liabilitiesLoading } = useQuery({
    queryKey: ['liabilities', 'all'],
    queryFn: getAllLiabilities,
  });

  const { data: snapshots, isLoading: snapshotsLoading } = useQuery({
    queryKey: ['snapshots'],
    queryFn: getSnapshots,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: getAnalyticsSummary,
  });

  const { data: emergencyFund } = useQuery({
    queryKey: ['emergencyFund'],
    queryFn: getEmergencyFund,
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

  // What-If Simulator state
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

  useEffect(() => {
    captureSnapshot()
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['snapshots'] });
      })
      .catch(console.error);
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

  const earliestDate = useMemo(() => {
    let earliest = new Date();
    assets?.forEach((a) => {
      if (a.purchaseDate) {
        const pd = new Date(a.purchaseDate);
        if (pd < earliest) earliest = pd;
      }
    });
    liabilities?.forEach((l) => {
      if (l.startDate) {
        const sd = new Date(l.startDate);
        if (sd < earliest) earliest = sd;
      }
    });
    return earliest;
  }, [assets, liabilities]);

  const startDateStr = useMemo(() => {
    const today = new Date();
    let rangeStartDate = new Date(today);
    if (timeRange === '1M') {
      rangeStartDate.setMonth(today.getMonth() - 1);
    } else if (timeRange === '3M') {
      rangeStartDate.setMonth(today.getMonth() - 3);
    } else if (timeRange === '6M') {
      rangeStartDate.setMonth(today.getMonth() - 6);
    } else if (timeRange === '1Y') {
      rangeStartDate.setFullYear(today.getFullYear() - 1);
    } else if (timeRange === 'ALL') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      rangeStartDate = earliestDate < oneYearAgo ? earliestDate : oneYearAgo;
    }
    return rangeStartDate.toLocaleDateString('en-CA');
  }, [earliestDate, timeRange]);

  const endDateStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const { data: benchmarks } = useQuery({
    queryKey: ['benchmarks', startDateStr, endDateStr],
    queryFn: () => getBenchmarks(startDateStr, endDateStr),
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  const chartData = useMemo(() => {
    if (!assets) return [];
    const today = new Date();
    let rangeStartDate = new Date(today);
    let stepType: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month';

    if (timeRange === '1M') {
      rangeStartDate.setMonth(today.getMonth() - 1);
      stepType = 'day';
    } else if (timeRange === '3M') {
      rangeStartDate.setMonth(today.getMonth() - 3);
      stepType = 'week';
    } else if (timeRange === '6M') {
      rangeStartDate.setMonth(today.getMonth() - 6);
      stepType = 'week';
    } else if (timeRange === '1Y') {
      rangeStartDate.setFullYear(today.getFullYear() - 1);
      stepType = 'month';
    } else if (timeRange === 'ALL') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      rangeStartDate = earliestDate < oneYearAgo ? earliestDate : oneYearAgo;
      const diffYears = (today.getTime() - rangeStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (diffYears > 3) {
        stepType = 'quarter';
      } else if (diffYears > 5) {
        stepType = 'year';
      } else {
        stepType = 'month';
      }
    }

    const actualStart = rangeStartDate;
    const timelineNodes: { nodeDate: Date; totalAssetsVal: number; totalLiabilitiesVal: number; totalNetWorthVal: number }[] = [];
    let curr = new Date(actualStart);
    curr.setHours(0, 0, 0, 0);

    const stepForward = (d: Date) => {
      const next = new Date(d);
      if (stepType === 'day') next.setDate(next.getDate() + 1);
      else if (stepType === 'week') next.setDate(next.getDate() + 7);
      else if (stepType === 'month') next.setMonth(next.getMonth() + 1);
      else if (stepType === 'quarter') next.setMonth(next.getMonth() + 3);
      else if (stepType === 'year') next.setFullYear(next.getFullYear() + 1);
      return next;
    };

    while (curr <= today) {
      let activeAssetsVal = 0;
      assets.forEach((a) => {
        const pDate = a.purchaseDate ? new Date(a.purchaseDate) : null;
        if (!pDate || pDate <= curr) {
          activeAssetsVal += a.currentValue || a.investedAmount || 0;
        }
      });

      let activeLiabilitiesVal = 0;
      liabilities?.forEach((l) => {
        const sDate = l.startDate ? new Date(l.startDate) : null;
        if (!sDate || sDate <= curr) {
          activeLiabilitiesVal += l.outstandingBalance || 0;
        }
      });

      timelineNodes.push({
        nodeDate: new Date(curr),
        totalAssetsVal: activeAssetsVal,
        totalLiabilitiesVal: activeLiabilitiesVal,
        totalNetWorthVal: activeAssetsVal - activeLiabilitiesVal,
      });

      const nextDate = stepForward(curr);
      if (nextDate.getTime() === curr.getTime()) break;
      curr = nextDate;
    }

    // Derive actual portfolio values for baseline comparison
    const currentTotalAssets = assets.reduce((sum, a) => sum + (a.currentValue || a.investedAmount || 0), 0);
    const currentTotalLiabilities = liabilities ? liabilities.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0) : 0;
    const currentNetWorth = currentTotalAssets - currentTotalLiabilities;
    const totalInvestedAmount = assets.reduce((sum, a) => sum + (a.investedAmount || 0), 0);

    // Base benchmark amount anchored to user's real portfolio at range start
    const startVal = timelineNodes[0]?.totalNetWorthVal;
    const baseNW = (startVal && startVal > 0) 
      ? startVal 
      : (totalInvestedAmount > 0 ? totalInvestedAmount : (currentNetWorth > 0 ? currentNetWorth : 100000));

    const firstBenchmark = Array.isArray(benchmarks) && benchmarks.length > 0 ? benchmarks[0] : null;
    const firstNifty = firstBenchmark?.nifty50 && firstBenchmark.nifty50 > 0 ? firstBenchmark.nifty50 : 22000;
    const firstGold = firstBenchmark?.gold && firstBenchmark.gold > 0 ? firstBenchmark.gold : 2200;

    return timelineNodes.map((rn) => {
      let scaledNifty: number | null = null;
      let scaledGold: number | null = null;
      let niftyGrowthPct: number | null = null;
      let goldGrowthPct: number | null = null;

      if (Array.isArray(benchmarks) && benchmarks.length > 0) {
        const nodeTime = rn.nodeDate.getTime();
        const closestPoint = benchmarks.reduce((prev, c) =>
          Math.abs(new Date(c.date).getTime() - nodeTime) < Math.abs(new Date(prev.date).getTime() - nodeTime) ? c : prev,
          benchmarks[0]
        );
        if (closestPoint) {
          if (closestPoint.nifty50 && firstNifty > 0) {
            scaledNifty = (closestPoint.nifty50 / firstNifty) * baseNW;
            niftyGrowthPct = ((closestPoint.nifty50 - firstNifty) / firstNifty) * 100;
          }
          if (closestPoint.gold && firstGold > 0) {
            scaledGold = (closestPoint.gold / firstGold) * baseNW;
            goldGrowthPct = ((closestPoint.gold - firstGold) / firstGold) * 100;
          }
        }
      }

      let displayDate = rn.nodeDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (stepType === 'day') {
        displayDate = rn.nodeDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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
        scaledGold,
      };
    });
  }, [assets, liabilities, timeRange, benchmarks, earliestDate]);

  const automationAssets = assets?.filter((asset) => ['STOCK', 'MUTUAL_FUND', 'GOLD', 'BOND'].includes(asset.assetType)) || [];

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

  // Upcoming Maturities for dashboard preview widget
  const upcomingMaturities = useMemo(() => {
    if (!assets) return [];
    const today = new Date();
    return assets
      .filter((a: AssetResponse) => a.maturityDate)
      .map((a: AssetResponse) => {
        const matDate = parseISO(a.maturityDate!);
        const daysRemaining = differenceInDays(matDate, today);
        let estimatedAmount = a.investedAmount || a.currentValue || 0;
        const rate = a.couponRate || a.interestRate;
        if ((a.assetType === 'FIXED_DEPOSIT' || a.assetType === 'BOND') && rate && a.startDate) {
          const start = parseISO(a.startDate);
          const totalDays = differenceInDays(matDate, start);
          const totalYears = totalDays / 365.25;
          estimatedAmount = (a.investedAmount || 0) * (1 + (rate / 100) * totalYears);
        }
        return {
          id: a.id,
          name: a.name,
          assetType: a.assetType,
          bondType: a.bondType,
          maturityDate: a.maturityDate,
          daysRemaining,
          estimatedAmount,
        };
      })
      .filter((m) => m.daysRemaining >= 0)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 4);
  }, [assets]);

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

  const liquidAssets = assets?.filter((a) => a.assetType !== 'REAL_ESTATE').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
  const illiquidAssets = assets?.filter((a) => a.assetType === 'REAL_ESTATE').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
  const liquidPct = totalAssets > 0 ? (liquidAssets / totalAssets) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const allocationData = assets?.reduce((acc: any, asset) => {
    const type = asset.assetType;
    const existing = acc.find((item: any) => item.name === type);
    if (existing) {
      existing.value += asset.currentValue || 0;
    } else {
      acc.push({ name: type, value: asset.currentValue || 0 });
    }
    return acc;
  }, []) || [];

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWidgetId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetId) return;
    const fromIndex = widgets.findIndex((w) => w.id === draggedWidgetId);
    const toIndex = widgets.findIndex((w) => w.id === targetId);
    if (fromIndex !== -1 && toIndex !== -1) {
      moveWidget(fromIndex, toIndex);
    }
    setDraggedWidgetId(null);
  };

  // Render individual widget contents
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'financial_health':
        return <FinancialHealthCard />;

      case 'hero_stats':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
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

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-text-secondary text-sm font-medium">Total Assets</p>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-display text-2xl font-bold text-emerald-400">{formatCurrency(totalAssets)}</h2>
              <p className="text-xs text-text-muted mt-2">Invested: {formatCurrency(totalInvested)}</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-text-secondary text-sm font-medium">Total Liabilities</p>
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-display text-2xl font-bold text-red-400">{formatCurrency(totalLiabilities)}</h2>
              <p className="text-xs text-text-muted mt-2">Outstanding debt obligations</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-text-secondary text-sm font-medium">Debt-to-Asset Ratio</p>
                <Landmark className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-display text-2xl font-bold text-indigo-400">{debtToAssetRatio.toFixed(2)}%</h2>
              <p className="text-xs text-text-muted mt-2">Lower is better (ideal &lt; 35%)</p>
            </div>
          </div>
        );

      case 'liquidity_emergency':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
                <span>Liquid: {formatCurrency(liquidAssets)}</span>
                <span>Illiquid: {formatCurrency(illiquidAssets)} (Real Estate)</span>
              </div>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-text-secondary text-sm font-medium">Emergency Fund Coverage</p>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(emergencyFund?.currentLiquidAssets || liquidAssets)}
                  </span>
                  <span className="text-xs font-semibold text-text-secondary">
                    {(emergencyFund?.progressPercentage || 0).toFixed(1)}% Prepared
                  </span>
                </div>
                <div className="w-full h-2.5 bg-surface-hover rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, emergencyFund?.progressPercentage || 0)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-text-muted mt-3">
                <span>Target: {formatCurrency(emergencyFund?.targetCorpus || 0)} ({emergencyFund?.targetMonths || 6}M)</span>
                <span className="text-accent-500 font-semibold cursor-pointer hover:underline" onClick={() => navigate('/goals')}>
                  Manage Goals →
                </span>
              </div>
            </div>
          </div>
        );

      case 'historical_chart':
        return (
          <div className="glass-card p-6 min-h-[400px] flex-1 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Historical Net Worth Trend</h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-text-secondary mt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary transition-colors">
                      <input
                        type="checkbox"
                        checked={showNifty}
                        onChange={(e) => setShowNifty(e.target.checked)}
                        className="rounded border-border bg-surface-hover text-accent-500 focus:ring-accent-500"
                      />
                      Overlay Nifty 50
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary transition-colors">
                      <input
                        type="checkbox"
                        checked={showGoldBenchmark}
                        onChange={(e) => setShowGoldBenchmark(e.target.checked)}
                        className="rounded border-border bg-surface-hover text-accent-500 focus:ring-accent-500"
                      />
                      Overlay Gold Index
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 p-1 bg-surface-hover rounded-lg border border-border">
                  {['1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        timeRange === range
                          ? 'bg-surface shadow-sm border border-border text-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface/50 border border-transparent'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {chartData?.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-text-muted">
                  No historical snapshot data available for this range.
                </div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} tickMargin={10} />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                        width={70}
                      />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px' }}
                        itemStyle={{ color: '#F8FAFC' }}
                        labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                        formatter={(value: any, name: string) => {
                          const num = Number(value) || 0;
                          return [formatCurrency(num), name];
                        }}
                      />
                      <Line type="monotone" dataKey="totalAssets" name="Total Assets" stroke="#10B981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="totalLiabilities" name="Total Liabilities" stroke="#EF4444" strokeWidth={2} dot={false} />
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
          </div>
        );

      case 'asset_allocation':
        return (
          <div className="glass-card p-6 min-h-[400px] flex-1 flex flex-col justify-between">
            <h3 className="text-lg font-medium mb-4 text-text-primary">Asset Allocation</h3>
            {allocationData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-text-muted">
                No assets to allocate.
              </div>
            ) : (
              <div className="h-[280px]">
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
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '15px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );

      case 'performance_highlights':
        return (
          <div className="glass-card p-6 min-h-[380px] flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium mb-4 text-text-primary">Performance Highlights</h3>
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
        );

      case 'what_if_simulator':
        return (
          <div className="glass-card p-6 min-h-[380px] flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sliders className="w-5 h-5 text-accent-500" />
                <h3 className="text-lg font-medium text-text-primary">What-If Net Worth Simulator</h3>
              </div>
              <p className="text-xs text-text-secondary mb-4">
                Drag the sliders to simulate hypothetical asset price movements and view projected Net Worth adjustments.
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                    <span>Physical & Sovereign Gold</span>
                    <span className={whatIfGold >= 0 ? 'text-emerald-500 font-semibold' : 'text-red-400 font-semibold'}>
                      {whatIfGold > 0 ? '+' : ''}{whatIfGold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="5"
                    value={whatIfGold}
                    onChange={(e) => setWhatIfGold(Number(e.target.value))}
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
                    type="range"
                    min="-30"
                    max="30"
                    step="5"
                    value={whatIfStock}
                    onChange={(e) => setWhatIfStock(Number(e.target.value))}
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
                    type="range"
                    min="-30"
                    max="30"
                    step="5"
                    value={whatIfMF}
                    onChange={(e) => setWhatIfMF(Number(e.target.value))}
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
                    type="range"
                    min="-50"
                    max="50"
                    step="5"
                    value={whatIfCrypto}
                    onChange={(e) => setWhatIfCrypto(Number(e.target.value))}
                    className="w-full accent-accent-500 cursor-ew-resize bg-surface-hover h-2 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {(() => {
              const goldVal = assets?.filter((a) => a.assetType === 'GOLD' || a.bondType === 'SOVEREIGN_GOLD_BOND').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
              const stockVal = assets?.filter((a) => a.assetType === 'STOCK').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
              const mfVal = assets?.filter((a) => a.assetType === 'MUTUAL_FUND').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
              const cryptoVal = assets?.filter((a) => a.assetType === 'CRYPTOCURRENCY').reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;

              const delta = (whatIfGold / 100) * goldVal + (whatIfStock / 100) * stockVal + (whatIfMF / 100) * mfVal + (whatIfCrypto / 100) * cryptoVal;
              const projectedNetWorth = netWorth + delta;

              return (
                <div className="mt-4 p-3.5 rounded-2xl bg-surface-hover border border-border flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-text-secondary mb-0.5">Projected Net Worth</div>
                    <div className="text-xl font-bold text-accent-500">{formatCurrency(projectedNetWorth)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-text-secondary mb-0.5">Difference</div>
                    <div className={`text-base font-semibold ${delta >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );

      case 'price_alerts_automation':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
                    <Bell className="w-5 h-5 text-accent-500" /> Price Alerts
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">Create live threshold alerts for stocks, mutual funds, gold & bonds.</p>
                </div>
                <Sparkles className="w-5 h-5 text-accent-500/70" />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <select value={alertAssetId} onChange={(e) => onSelectAlertAsset(e.target.value)} className="glass-input">
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

              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {priceAlerts?.length ? (
                  priceAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-surface-hover border border-border">
                      <div>
                        <p className="font-medium text-sm text-text-primary">{alert.assetName}</p>
                        <p className="text-xs text-text-secondary">
                          {alert.alertCondition} {formatCurrency(alert.targetPrice)}{' '}
                          {alert.lastObservedPrice ? ` • Last ${formatCurrency(alert.lastObservedPrice)}` : ''}
                        </p>
                      </div>
                      <button onClick={() => deleteAlertMutation.mutate(alert.id)} className="text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-text-muted border border-dashed border-border rounded-xl p-4 text-center">
                    No active price alerts yet.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-400" /> Rebalancing Nudge
                  </h3>
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
                  <input
                    type="number"
                    value={rebalanceEquity}
                    onChange={(e) => setRebalanceEquity(Number(e.target.value))}
                    className="glass-input"
                    placeholder="Equity %"
                  />
                  <input
                    type="number"
                    value={rebalanceDebt}
                    onChange={(e) => setRebalanceDebt(Number(e.target.value))}
                    className="glass-input"
                    placeholder="Debt %"
                  />
                  <input
                    type="number"
                    value={rebalanceGold}
                    onChange={(e) => setRebalanceGold(Number(e.target.value))}
                    className="glass-input"
                    placeholder="Gold %"
                  />
                </div>
                <input
                  type="number"
                  value={rebalanceThreshold}
                  onChange={(e) => setRebalanceThreshold(Number(e.target.value))}
                  className="glass-input"
                  placeholder="Drift threshold %"
                />
                <button onClick={submitRebalancingTarget} disabled={saveRebalanceMutation.isPending} className="btn-primary justify-center">
                  {saveRebalanceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Target Allocation'}
                </button>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
                    <Bell className="w-5 h-5 text-sky-400" /> In-App Notifications
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">Recent alerts, reminders, and digest notices.</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-sky-400/70" />
              </div>

              <div className="space-y-2 max-h-80 overflow-auto pr-1">
                {notifications?.length ? (
                  notifications.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border ${item.read ? 'bg-surface-hover border-border' : 'bg-sky-500/10 border-sky-500/20'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm text-text-primary">{item.title}</p>
                          <p className="text-xs text-text-secondary mt-1">{item.message}</p>
                        </div>
                        {!item.read && (
                          <button onClick={() => readNotificationMutation.mutate(item.id)} className="text-xs text-sky-400 hover:underline">
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-text-muted border border-dashed border-border rounded-xl p-4 text-center">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'maturities_snapshot':
        return (
          <div className="glass-card p-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" /> Upcoming Maturities
                </h3>
                <p className="text-xs text-text-secondary mt-1">Next fixed income instruments reaching maturity date.</p>
              </div>
              <button
                onClick={() => navigate('/maturities')}
                className="text-xs text-accent-500 font-semibold hover:underline flex items-center gap-1"
              >
                View All Schedule →
              </button>
            </div>

            {upcomingMaturities.length === 0 ? (
              <div className="p-6 rounded-2xl bg-surface-hover text-center text-text-muted text-sm">
                No fixed deposits or bonds nearing maturity.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {upcomingMaturities.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-surface-hover border border-border flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent-500 px-1.5 py-0.5 bg-accent-500/10 rounded">
                          {item.assetType === 'BOND' ? (item.bondType ? item.bondType.replace(/_/g, ' ') : 'BOND') : 'FIXED DEPOSIT'}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                          <Clock className="w-3 h-3" /> {item.daysRemaining} days
                        </span>
                      </div>
                      <h4 className="font-medium text-sm text-text-primary truncate mt-1">{item.name}</h4>
                      <p className="text-xs text-text-muted mt-0.5">Maturity: {item.maturityDate}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-border/50 flex justify-between items-baseline">
                      <span className="text-xs text-text-secondary">Estimated:</span>
                      <span className="font-bold text-sm text-emerald-400">{formatCurrency(item.estimatedAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading text-2xl font-dmsans">Personal Dashboard</h1>
          <p className="text-xs text-text-secondary mt-1">Drag cards to reorder or customize your widget layout.</p>
        </div>

        {/* Customize Dashboard & Export Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary text-xs font-medium transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-sky-500" />
            <span>Export Report</span>
          </button>
          <button
            onClick={() => setIsCustomizeOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary text-xs font-medium transition-all shadow-sm"
          >
            <Settings2 className="w-4 h-4 text-accent-500" />
            <span>Customize Cards</span>
          </button>
        </div>
      </div>

      {/* AI Executive Briefing Narrative Card */}
      <AiNarrativeCard />

      {/* Diversification Warnings Banner */}
      {analytics?.warnings && analytics.warnings.length > 0 && (
        <div className="space-y-2">
          {analytics.warnings.map((warning, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-sm shadow-sm animate-in fade-in duration-300"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="font-medium">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* 12-Column Responsive Drag-and-Drop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {widgets
          .filter((w) => w.visible)
          .map((widget, index) => {
            const isDragged = draggedWidgetId === widget.id;
            const defaultSpan = DEFAULT_WIDGET_CONFIG.find((d) => d.id === widget.id)?.gridSpan || 'col-span-12';
            const gridSpan = widget.gridSpan || defaultSpan;

            return (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, widget.id)}
                className={`${gridSpan} relative group transition-all duration-200 flex flex-col ${
                  isDragged ? 'opacity-40 scale-[0.99] border-dashed border-2 border-accent-500 rounded-2xl' : ''
                }`}
              >
                {/* Drag Handle Bar */}
                <div className="flex items-center justify-between pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-3.5 h-3.5 text-accent-500" />
                    <span className="font-medium text-text-secondary">{widget.name}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {index > 0 && (
                      <button
                        onClick={() => moveWidget(index, index - 1)}
                        className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    )}
                    {index < widgets.filter((w) => w.visible).length - 1 && (
                      <button
                        onClick={() => moveWidget(index, index + 1)}
                        className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-red-400 transition-colors"
                      title="Hide Card"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Widget Body */}
                <div className="flex-1 flex flex-col">
                  {renderWidgetContent(widget.id)}
                </div>
              </div>
            );
          })}
      </div>

      {/* Customize Drawer Modal */}
      {isCustomizeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200"
          onClick={() => setIsCustomizeOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-accent-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Customize Dashboard</h3>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Toggle which cards you want displayed on your dashboard and arrange their priority order.
            </p>

            <div className="space-y-2">
              {widgets.map((w, idx) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/70 border border-border gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleWidgetVisibility(w.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        w.visible ? 'bg-accent-500/10 text-accent-500' : 'bg-surface text-text-muted'
                      }`}
                      title={w.visible ? 'Hide widget' : 'Show widget'}
                    >
                      {w.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${w.visible ? 'text-text-primary' : 'text-text-muted'}`}>
                        {w.name}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">{w.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveWidget(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover disabled:opacity-30 text-text-secondary"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveWidget(idx, idx + 1)}
                      disabled={idx === widgets.length - 1}
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover disabled:opacity-30 text-text-secondary"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={resetToDefaultLayout}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-500 font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
              </button>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="btn-primary text-xs px-4 py-2"
              >
                Done Customizing
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        assets={assets || []}
        liabilities={liabilities || []}
        analytics={analytics}
      />
    </div>
  );
}
