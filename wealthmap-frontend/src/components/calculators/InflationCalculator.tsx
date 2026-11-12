import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

const formatINR = (val: number, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);

const formatIndianShort = (val: number) => {
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Crore`;
  if (val >= 100000) return `${(val / 100000).toFixed(2)} Lakh`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return `${Math.round(val)}`;
};

export default function InflationCalculator() {
  const currentYear = new Date().getFullYear();

  const [currentValue, setCurrentValue] = useState<number>(100000);
  const [inflationRate, setInflationRate] = useState<number>(5);
  const [years, setYears] = useState<number>(10);

  const result = useMemo(() => {
    const P = Math.max(0, Number(currentValue) || 0);
    const r = Math.max(0, Number(inflationRate) || 0) / 100;
    const n = Math.max(1, Math.min(50, Math.round(Number(years) || 1)));

    const futureValue = P * Math.pow(1 + r, n);
    const costIncreased = Math.max(0, futureValue - P);
    const realValue = P / Math.pow(1 + r, n);
    const depreciationPercent = P > 0 ? ((P - realValue) / P) * 100 : 0;

    const chartData = Array.from({ length: n + 1 }, (_, i) => ({
      year: currentYear + i,
      futureCost: Math.round(P * Math.pow(1 + r, i)),
      purchasingPower: Math.round(P / Math.pow(1 + r, i)),
    }));

    return {
      todayValue: P,
      futureValue,
      costIncreased,
      realValue,
      depreciationPercent,
      years: n,
      chartData,
    };
  }, [currentValue, inflationRate, years, currentYear]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <TrendingUp className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              Inflation Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Current Value (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={currentValue}
                onChange={(e) => setCurrentValue(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Annual Inflation Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={inflationRate}
                onChange={(e) => setInflationRate(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold mb-2"
              />
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={Math.min(15, inflationRate)}
                onChange={(e) => setInflationRate(Number(e.target.value))}
                className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Period (Years)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={years}
                onChange={(e) =>
                  setYears(Math.max(1, Math.min(50, Number(e.target.value) || 1)))
                }
                className="glass-input text-xs font-semibold mb-2"
              />
              <input
                type="range"
                min="1"
                max="40"
                value={Math.min(40, years)}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
              />
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-7 glass-card p-6 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-surface-hover border border-border">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Today&apos;s Value
            </p>
            <p className="text-2xl font-extrabold text-text-primary mt-1">
              {formatINR(result.todayValue)}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-hover border border-border">
              <p className="text-[11px] font-bold uppercase text-text-muted flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" /> Inflation Rate
              </p>
              <p className="text-lg font-extrabold text-text-primary mt-1">{inflationRate}%</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-hover border border-border">
              <p className="text-[11px] font-bold uppercase text-text-muted flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" /> Cost Increased
              </p>
              <p className="text-lg font-extrabold text-amber-500 mt-1">
                {formatINR(result.costIncreased)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-[11px] font-bold uppercase text-red-500 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Currency Value Depreciation
              </p>
              <p className="text-lg font-extrabold text-red-500 mt-1">
                {result.depreciationPercent.toFixed(2)}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-[11px] font-bold uppercase text-red-500 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Real Value After {result.years} Yrs
              </p>
              <p className="text-lg font-extrabold text-red-500 mt-1">
                {formatINR(result.realValue)}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/20 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase text-accent-500">
                Inflation-Adjusted Value After {result.years} Years
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Equivalent future cost of {formatINR(result.todayValue, 0)} today
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-accent-500">
                {formatINR(result.futureValue)}
              </p>
              <p className="text-[11px] font-semibold text-accent-500/80">
                ({formatIndianShort(result.futureValue)})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchasing Power vs Future Cost Chart */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-text-primary">
          Future Cost vs. Purchasing Power Erosion
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.chartData}>
              <defs>
                <linearGradient id="infFutureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="infPowerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${Math.round(v / 1000)}K`
                }
              />
              <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0)]} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="futureCost"
                name="Future Inflated Cost"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#infFutureGrad)"
              />
              <Area
                type="monotone"
                dataKey="purchasingPower"
                name="Real Purchasing Power"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#infPowerGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
