import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAssets, getLiveMetalRates } from '../../api/assets.api';
import {
  TrendingUp,
  Plus,
  Trash2,
  RotateCcw,
  Percent,
  ShoppingCart,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

type GoldPurity = '22K' | '24K';
type PriceSource = 'MARKET' | 'CUSTOM';
type SubTab = 'ENTRIES' | 'TAX';

interface GoldPurchaseEntry {
  id: number;
  label?: string;
  grams: number;
  purchaseDate: string;
  priceSource: PriceSource;
  customBuyPrice: number;
  purity: GoldPurity;
  isSgb: boolean;
}

// Historical approximate 24K gold price per gram in India (INR)
const HISTORICAL_24K_BY_YEAR: Record<number, number> = {
  2010: 1850,
  2011: 2640,
  2012: 3105,
  2013: 2960,
  2014: 2800,
  2015: 2634,
  2016: 2862,
  2017: 2966,
  2018: 3144,
  2019: 3522,
  2020: 4865,
  2021: 5195,
  2022: 5267,
  2023: 6533,
  2024: 7850,
  2025: 10200,
  2026: 14145,
};

const CURRENT_24K_RATE = 13769.2;

function getHistoricalRate(dateStr: string, purity: GoldPurity): number {
  const yr = new Date(dateStr).getFullYear();
  const base24k =
    HISTORICAL_24K_BY_YEAR[yr] ??
    (yr < 2010 ? 1500 : CURRENT_24K_RATE);
  return purity === '24K' ? base24k : Number((base24k * (22 / 24)).toFixed(2));
}

function getCurrentRate(purity: GoldPurity, live24k = CURRENT_24K_RATE): number {
  return purity === '24K'
    ? live24k
    : Number((live24k * (22 / 24)).toFixed(2));
}

function monthsBetween(startStr: string, endDate: Date): number {
  const start = new Date(startStr);
  if (isNaN(start.getTime())) return 0;
  return (
    (endDate.getFullYear() - start.getFullYear()) * 12 +
    (endDate.getMonth() - start.getMonth()) +
    (endDate.getDate() <= endDate.getDate() ? 0 : -1)
  );
}

const formatINR = (val: number, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);

function formatAssetDate(raw: any): string {
  if (!raw) return '2024-01-01';
  if (Array.isArray(raw)) {
    const [y, m, d] = raw;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(raw).split('T')[0] || '2024-01-01';
}

export default function GoldProfitCalculator() {
  const { data: allAssets } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets,
  });
  const { data: liveRates } = useQuery({
    queryKey: ['metals', 'rates'],
    queryFn: getLiveMetalRates,
    staleTime: 1000 * 60 * 30,
  });
  const live24kRate = Number(liveRates?.gold24kPerGram) || CURRENT_24K_RATE;

  const portfolioGoldAssets = useMemo(
    () =>
      (allAssets || []).filter(
        (a: any) =>
          a.assetType === 'GOLD' ||
          (a.assetType === 'BOND' && a.bondType === 'SOVEREIGN_GOLD_BOND')
      ),
    [allAssets]
  );

  const mapPortfolioToEntries = (assetsList: any[]): GoldPurchaseEntry[] =>
    assetsList.map((a: any) => {
      const rawPurity = String(a.purity || 'K24').toUpperCase();
      const purity: GoldPurity =
        rawPurity === 'K22' || rawPurity === '22K' ? '22K' : '24K';
      const isSgb = a.bondType === 'SOVEREIGN_GOLD_BOND';
      const estGrams =
        Number(a.weightGrams || a.weightInGrams || a.weight || a.quantity) ||
        (a.currentValue > 0
          ? Number((a.currentValue / getCurrentRate(purity)).toFixed(2))
          : 10);
      const invested = Number(a.originalInvestedAmount || a.investedAmount || 0);
      const buyPerGram = estGrams > 0 && invested > 0 ? Number((invested / estGrams).toFixed(2)) : 0;

      return {
        id: a.id || Date.now() + Math.random(),
        label: a.name,
        grams: estGrams,
        purchaseDate: formatAssetDate(a.purchaseDate || a.startDate),
        priceSource: buyPerGram > 0 ? 'CUSTOM' : 'MARKET',
        customBuyPrice: buyPerGram > 0 ? buyPerGram : getHistoricalRate(formatAssetDate(a.purchaseDate || a.startDate), purity),
        purity,
        isSgb,
      };
    });

  const [subTab, setSubTab] = useState<SubTab>('ENTRIES');
  const [ltcgRate, setLtcgRate] = useState<number>(12.5);
  const [stcgRate, setStcgRate] = useState<number>(30);
  const [hasSyncedPortfolio, setHasSyncedPortfolio] = useState<boolean>(false);

  const [entries, setEntries] = useState<GoldPurchaseEntry[]>([
    {
      id: 1,
      label: 'Sample Holding',
      grams: 100,
      purchaseDate: '2021-01-01',
      priceSource: 'MARKET',
      customBuyPrice: 5195,
      purity: '24K',
      isSgb: false,
    },
  ]);

  useEffect(() => {
    if (!hasSyncedPortfolio && portfolioGoldAssets.length > 0) {
      setEntries(mapPortfolioToEntries(portfolioGoldAssets));
      setHasSyncedPortfolio(true);
    }
  }, [portfolioGoldAssets, hasSyncedPortfolio]);

  const syncFromPortfolio = () => {
    if (portfolioGoldAssets.length > 0) {
      setEntries(mapPortfolioToEntries(portfolioGoldAssets));
      setHasSyncedPortfolio(true);
    }
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: Date.now(),
        grams: 10,
        purchaseDate: '2024-01-01',
        priceSource: 'MARKET',
        customBuyPrice: 7850,
        purity: '24K',
        isSgb: false,
      },
    ]);
  };

  const updateEntry = (
    id: number,
    field: keyof GoldPurchaseEntry,
    value: string | number | boolean
  ) => {
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeEntry = (id: number) => {
    if (entries.length <= 1) return;
    setEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const resetAll = () => {
    setLtcgRate(12.5);
    setStcgRate(30);
    if (portfolioGoldAssets.length > 0) {
      setEntries(mapPortfolioToEntries(portfolioGoldAssets));
    } else {
      setEntries([
        {
          id: 1,
          label: 'Sample Holding',
          grams: 100,
          purchaseDate: '2021-01-01',
          priceSource: 'MARKET',
          customBuyPrice: 5195,
          purity: '24K',
          isSgb: false,
        },
      ]);
    }
  };

  const analysis = useMemo(() => {
    const today = new Date();

    const rows = entries.map((e) => {
      const grams = Math.max(0, Number(e.grams) || 0);
      const buyPerGram =
        e.priceSource === 'CUSTOM'
          ? Math.max(0, Number(e.customBuyPrice) || 0)
          : getHistoricalRate(e.purchaseDate, e.purity);
      const currentPerGram = getCurrentRate(e.purity, live24kRate);

      const buyValue = buyPerGram * grams;
      const currentValue = currentPerGram * grams;
      const profitLoss = currentValue - buyValue;
      const profitPct = buyValue > 0 ? (profitLoss / buyValue) * 100 : 0;

      const holdingMonths = monthsBetween(e.purchaseDate, today);
      const isLongTerm = holdingMonths >= 24;

      let tax = 0;
      let taxLabel = 'Exempt (SGB)';
      if (!e.isSgb && profitLoss > 0) {
        const appliedRate = isLongTerm ? ltcgRate : stcgRate;
        tax = profitLoss * (Math.max(0, appliedRate) / 100);
        taxLabel = `${isLongTerm ? 'LTCG' : 'STCG'} (${appliedRate}%)`;
      } else if (!e.isSgb && profitLoss <= 0) {
        taxLabel = 'No Tax (Loss)';
      }

      const afterTaxProfit = profitLoss - tax;
      const afterTaxPct = buyValue > 0 ? (afterTaxProfit / buyValue) * 100 : 0;

      return {
        ...e,
        buyPerGram,
        currentPerGram,
        buyValue,
        currentValue,
        profitLoss,
        profitPct,
        isLongTerm,
        tax,
        taxLabel,
        afterTaxProfit,
        afterTaxPct,
      };
    });

    const totalGrams = rows.reduce((s, r) => s + r.grams, 0);
    const totalPurchaseValue = rows.reduce((s, r) => s + r.buyValue, 0);
    const totalCurrentValue = rows.reduce((s, r) => s + r.currentValue, 0);
    const totalProfitLoss = totalCurrentValue - totalPurchaseValue;
    const totalProfitPct =
      totalPurchaseValue > 0 ? (totalProfitLoss / totalPurchaseValue) * 100 : 0;

    const totalLtcgTax = rows
      .filter((r) => !r.isSgb && r.isLongTerm)
      .reduce((s, r) => s + r.tax, 0);
    const totalStcgTax = rows
      .filter((r) => !r.isSgb && !r.isLongTerm)
      .reduce((s, r) => s + r.tax, 0);

    const totalAfterTaxProfit = totalProfitLoss - totalLtcgTax - totalStcgTax;
    const totalAfterTaxPct =
      totalPurchaseValue > 0 ? (totalAfterTaxProfit / totalPurchaseValue) * 100 : 0;

    const chartData = rows.map((r) => ({
      date: r.purchaseDate,
      purchaseValue: Math.round(r.buyValue),
      currentValue: Math.round(r.currentValue),
    }));

    return {
      rows,
      totalGrams,
      totalPurchaseValue,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitPct,
      totalLtcgTax,
      totalStcgTax,
      totalAfterTaxProfit,
      totalAfterTaxPct,
      chartData,
    };
  }, [entries, ltcgRate, stcgRate, live24kRate]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Card */}
        <div className="lg:col-span-6 glass-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-text-primary">
                Gold Profit Calculator
              </h3>
            </div>
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary px-2.5 py-1 rounded-lg bg-surface-hover border border-border"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Sub-Tabs */}
          <div className="flex border-b border-border gap-4">
            <button
              type="button"
              onClick={() => setSubTab('ENTRIES')}
              className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                subTab === 'ENTRIES'
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Purchase Entries
            </button>
            <button
              type="button"
              onClick={() => setSubTab('TAX')}
              className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                subTab === 'TAX'
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              Tax Settings
            </button>
          </div>

          {subTab === 'ENTRIES' ? (
            <div className="space-y-4 text-xs">
              {portfolioGoldAssets.length > 0 && (
                <div className="p-3 rounded-lg bg-zinc-50 border border-border flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-text-secondary">
                    Synced with <strong>{portfolioGoldAssets.length}</strong> existing Gold/SGB{' '}
                    {portfolioGoldAssets.length === 1 ? 'asset' : 'assets'}
                  </span>
                  <button
                    type="button"
                    onClick={syncFromPortfolio}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-500 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-sync
                  </button>
                </div>
              )}
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-surface-hover/60 border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary">
                      {entry.label || `Purchase #${idx + 1}`}
                    </span>
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-text-secondary block mb-1">
                        Units (in Grams)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={entry.grams}
                        onChange={(e) =>
                          updateEntry(entry.id, 'grams', Math.max(0, Number(e.target.value)))
                        }
                        className="glass-input text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-text-secondary block mb-1">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        value={entry.purchaseDate}
                        onChange={(e) => updateEntry(entry.id, 'purchaseDate', e.target.value)}
                        className="glass-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-text-secondary block">
                      Price Source:
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={entry.priceSource === 'MARKET'}
                          onChange={() => updateEntry(entry.id, 'priceSource', 'MARKET')}
                        />
                        <span>Market</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={entry.priceSource === 'CUSTOM'}
                          onChange={() => updateEntry(entry.id, 'priceSource', 'CUSTOM')}
                        />
                        <span>Set Price</span>
                      </label>
                    </div>
                    {entry.priceSource === 'CUSTOM' && (
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={entry.customBuyPrice}
                        onChange={(e) =>
                          updateEntry(
                            entry.id,
                            'customBuyPrice',
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        placeholder="Buy rate per gram (₹)"
                        className="glass-input text-xs font-semibold mt-1"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-text-secondary block">Purity:</label>
                    <div className="flex gap-1.5">
                      {(['22K', '24K'] as GoldPurity[]).map((pur) => (
                        <button
                          key={pur}
                          type="button"
                          onClick={() => updateEntry(entry.id, 'purity', pur)}
                          className={`px-3.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            entry.purity === pur
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-surface text-text-secondary border-border hover:bg-surface-hover hover:text-text-primary'
                          }`}
                        >
                          {pur}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={entry.isSgb}
                      onChange={(e) => updateEntry(entry.id, 'isSgb', e.target.checked)}
                      className="rounded border-border text-accent-500 focus:ring-accent-500"
                    />
                    <span className="font-medium text-text-primary">
                      Belongs to Sovereign Gold Bonds (SGB)
                    </span>
                  </label>
                </div>
              ))}

              <button
                type="button"
                onClick={addEntry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-text-primary font-medium text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Purchase
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">
                    LTCG Tax Rate (%)
                  </label>
                  <p className="text-[11px] text-text-muted mb-1.5">
                    Long-term capital gains (≥24 months)
                  </p>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={ltcgRate}
                    onChange={(e) => setLtcgRate(Math.max(0, Number(e.target.value)))}
                    className="glass-input text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">
                    STCG Tax Rate (%)
                  </label>
                  <p className="text-[11px] text-text-muted mb-1.5">
                    Short-term capital gains (&lt;24 months)
                  </p>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={stcgRate}
                    onChange={(e) => setStcgRate(Math.max(0, Number(e.target.value)))}
                    className="glass-input text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-start gap-2 text-[11px] text-text-secondary">
                <Info className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
                <span>
                  LTCG applies to holdings of 24 months or more (12.5% default), while STCG applies
                  to holdings under 24 months (slab rate, default 30%). Sovereign Gold Bonds (SGB)
                  held to maturity are tax-exempt.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Summary Panel */}
        <div className="lg:col-span-6 glass-card p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-border pb-4 mb-2 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-text-muted">Total Profit / Loss</p>
                <p
                  className={`text-2xl font-bold tracking-tight tabular-nums mt-0.5 ${
                    analysis.totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {formatINR(analysis.totalProfitLoss)}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md tabular-nums ${
                  analysis.totalProfitLoss >= 0
                    ? 'bg-emerald-500/10 text-emerald-700'
                    : 'bg-red-500/10 text-red-700'
                }`}
              >
                {analysis.totalProfitPct >= 0 ? '+' : ''}
                {analysis.totalProfitPct.toFixed(2)}%
              </span>
            </div>

            <div className="divide-y divide-border/70 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-text-secondary">Total Units</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {analysis.totalGrams} grams
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-text-secondary">Purchase Value</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatINR(analysis.totalPurchaseValue)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-text-secondary">Current Value</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatINR(analysis.totalCurrentValue)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-text-secondary">LTCG Tax (≥24 Months)</span>
                <span className="font-semibold text-amber-600 tabular-nums">
                  {formatINR(analysis.totalLtcgTax)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-text-secondary">STCG Tax (&lt;24 Months)</span>
                <span className="font-semibold text-amber-600 tabular-nums">
                  {formatINR(analysis.totalStcgTax)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-border flex items-baseline justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-text-primary">After-Tax Profit</p>
              <p className="text-[11px] text-text-muted tabular-nums">
                Net return: {analysis.totalAfterTaxPct.toFixed(2)}%
              </p>
            </div>
            <p
              className={`text-lg font-bold tracking-tight tabular-nums ${
                analysis.totalAfterTaxProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatINR(analysis.totalAfterTaxProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Purchase-wise Breakdown Table */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-text-primary">Purchase-wise Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 px-3">Units</th>
                <th className="py-2 px-3 text-right">Buy</th>
                <th className="py-2 px-3 text-right">Current</th>
                <th className="py-2 px-3 text-right">Buy Value</th>
                <th className="py-2 px-3 text-right">Current Value</th>
                <th className="py-2 px-3 text-right">Profit / Loss</th>
                <th className="py-2 px-3 text-right">Tax</th>
                <th className="py-2 pl-3 text-right">After Tax</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-text-primary">{r.purchaseDate}</td>
                  <td className="py-2.5 px-3 text-text-secondary">
                    {r.grams}g ({r.purity})
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">
                    {formatINR(r.buyPerGram)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">
                    {formatINR(r.currentPerGram)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">
                    {formatINR(r.buyValue)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-text-primary">
                    {formatINR(r.currentValue)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold ${
                      r.profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {formatINR(r.profitLoss)}
                    <span className="block text-[10px]">({r.profitPct.toFixed(2)}%)</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">
                    {formatINR(r.tax)}
                    <span className="block text-[10px] text-text-muted">{r.taxLabel}</span>
                  </td>
                  <td
                    className={`py-2.5 pl-3 text-right font-bold ${
                      r.afterTaxProfit >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {formatINR(r.afterTaxProfit)}
                    <span className="block text-[10px]">({r.afterTaxPct.toFixed(2)}%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profit Visualization Chart */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-text-primary">Profit Visualization Chart</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${Math.round(v / 1000)}K`
                }
              />
              <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0)]} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="purchaseValue" name="Purchase Value (₹)" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="currentValue" name="Current Value (₹)" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
