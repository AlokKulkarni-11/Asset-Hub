import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
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
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr.`;
  if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)} K`;
  return `${Math.round(val)}`;
};

export default function NpsCalculator() {
  const currentYear = new Date().getFullYear();

  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);
  const [durationYears, setDurationYears] = useState<number>(30);
  const [expectedReturn, setExpectedReturn] = useState<number>(10);
  const [annuityPercent, setAnnuityPercent] = useState<number>(40);
  const [annuityRate, setAnnuityRate] = useState<number>(6);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [annualStepPercent, setAnnualStepPercent] = useState<number>(0);
  const [inflationRate, setInflationRate] = useState<number>(0);

  const [showGrowthTable, setShowGrowthTable] = useState<boolean>(false);

  const result = useMemo(() => {
    const startBal = Math.max(0, Number(currentBalance) || 0);
    let currentMonthly = Math.max(0, Number(monthlyContribution) || 0);
    const years = Math.max(1, Math.min(60, Math.round(Number(durationYears) || 1)));
    const rMonthly = Math.max(0, Number(expectedReturn) || 0) / 100 / 12;
    const annPct = Math.max(0, Math.min(100, Number(annuityPercent) || 0));
    const annRate = Math.max(0, Number(annuityRate) || 0) / 100;
    const stepRate = showAdvanced ? (Number(annualStepPercent) || 0) / 100 : 0;
    const infRate = showAdvanced ? Math.max(0, Number(inflationRate) || 0) / 100 : 0;

    let balance = startBal;
    let totalInvested = startBal;

    const growthRows: {
      year: number;
      contributionLabel: string;
      invested: number;
      profit: number;
      growth: number;
    }[] = [];

    for (let y = 1; y <= years; y++) {
      const yearMonthly = Math.max(0, currentMonthly);
      for (let m = 1; m <= 12; m++) {
        balance = (balance + yearMonthly) * (1 + rMonthly);
        totalInvested += yearMonthly;
      }

      const profit = Math.max(0, balance - totalInvested);
      growthRows.push({
        year: currentYear + y,
        contributionLabel: `${Math.round(yearMonthly)} x 12m`,
        invested: Math.round(totalInvested),
        profit: Math.round(profit),
        growth: Math.round(balance),
      });

      if (stepRate !== 0) {
        currentMonthly = Math.max(0, currentMonthly * (1 + stepRate));
      }
    }

    const corpus = Math.round(balance);
    const invested = Math.round(totalInvested);
    const profit = Math.max(0, corpus - invested);
    const annuityAmount = Math.round(corpus * (annPct / 100));
    const lumpsumAmount = Math.max(0, corpus - annuityAmount);
    const monthlyPension = Math.round((annuityAmount * annRate) / 12);

    const inflationFactor = infRate > 0 ? Math.pow(1 + infRate, years) : 1;
    const realCorpus = Math.round(corpus / inflationFactor);
    const realLumpsum = Math.round(lumpsumAmount / inflationFactor);
    const realMonthlyPension = Math.round(monthlyPension / inflationFactor);

    return {
      invested,
      years,
      profit,
      corpus,
      annuityAmount,
      annPct,
      lumpsumAmount,
      monthlyPension,
      infRate,
      realCorpus,
      realLumpsum,
      realMonthlyPension,
      growthRows,
    };
  }, [
    currentBalance,
    monthlyContribution,
    durationYears,
    expectedReturn,
    annuityPercent,
    annuityRate,
    showAdvanced,
    annualStepPercent,
    inflationRate,
    currentYear,
  ]);

  const pieData = useMemo(
    () => [
      { name: 'Principal', value: result.invested, color: '#94a3b8' },
      { name: 'Interest', value: result.profit, color: '#6366f1' },
    ],
    [result]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShieldCheck className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              NPS Pension Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Current Balance (Rs.) (For existing NPS Accounts)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Future Monthly Contribution (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="flex items-center justify-between font-semibold text-text-secondary mb-1.5">
                <span>Duration (Years)</span>
                <span
                  title="Typically 60 minus your current age."
                  className="text-accent-500 cursor-help"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={durationYears}
                onChange={(e) =>
                  setDurationYears(Math.max(1, Math.min(60, Number(e.target.value) || 1)))
                }
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Expected Rate of Return (%)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Purchase Annuity %
                </label>
                <input
                  type="number"
                  min="40"
                  max="100"
                  step="5"
                  value={annuityPercent}
                  onChange={(e) =>
                    setAnnuityPercent(Math.max(0, Math.min(100, Number(e.target.value))))
                  }
                  className="glass-input text-xs font-semibold"
                />
                {annuityPercent < 40 && (
                  <p className="text-[10px] text-amber-500 mt-1">
                    PFRDA mandates at least 40% annuity at age 60.
                  </p>
                )}
              </div>
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Expected Rate of Annuity %
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  step="0.5"
                  value={annuityRate}
                  onChange={(e) => setAnnuityRate(Math.max(0, Number(e.target.value)))}
                  className="glass-input text-xs font-semibold"
                />
              </div>
            </div>

            {/* Advanced Options */}
            <div className="pt-2 border-t border-border space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-text-primary">
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  className="rounded border-border text-accent-500 focus:ring-accent-500"
                />
                Advanced options
              </label>

              {showAdvanced && (
                <div className="space-y-3 p-3 rounded-xl bg-surface-hover border border-border">
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Annual Increase / Decrease Contribution (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="Eg. 5 or -5"
                      value={annualStepPercent}
                      onChange={(e) => setAnnualStepPercent(Number(e.target.value))}
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Rate of Inflation (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      step="0.5"
                      placeholder="Eg. 6"
                      value={inflationRate}
                      onChange={(e) => setInflationRate(Math.max(0, Number(e.target.value)))}
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Summary + Pie Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">Invested</span>
                <span className="font-bold text-text-primary">{formatINR(result.invested)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">Duration</span>
                <span className="font-bold text-text-primary">{result.years} Yrs.</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">ROI</span>
                <span className="font-bold text-text-primary">{expectedReturn}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">Profit</span>
                <span className="font-bold text-accent-500">{formatINR(result.profit)}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Corpus</span>
                <div className="text-right">
                  <p className="font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatINR(result.corpus)}
                  </p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold">
                    ({formatIndianShort(result.corpus)})
                  </p>
                </div>
              </div>

              <div className="flex justify-between py-1 border-b border-border/60 pt-2">
                <span className="text-text-secondary">Annuity ({result.annPct}%)</span>
                <span className="font-bold text-text-primary">
                  {formatINR(result.annuityAmount)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">Lumpsum</span>
                <span className="font-bold text-text-primary">
                  {formatINR(result.lumpsumAmount)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-between">
                <span className="font-bold text-accent-500">Pension</span>
                <span className="text-sm font-extrabold text-accent-500">
                  {formatINR(result.monthlyPension)} P/m
                </span>
              </div>

              {result.infRate > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-[11px]">
                  <p className="font-bold text-amber-700 dark:text-amber-300">
                    Inflation-Adjusted (Today&apos;s Value @ {inflationRate}%)
                  </p>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Real Corpus:</span>
                    <span className="font-semibold">{formatINR(result.realCorpus, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Real Monthly Pension:</span>
                    <span className="font-semibold">
                      {formatINR(result.realMonthlyPension, 0)} P/m
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Pie Chart */}
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0), 'Amount']} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-500" />
          <h3 className="text-base font-bold text-text-primary">Growth Chart</h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.growthRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 10000000
                    ? `₹${(v / 10000000).toFixed(1)}Cr`
                    : v >= 100000
                    ? `₹${(v / 100000).toFixed(1)}L`
                    : `₹${Math.round(v / 1000)}K`
                }
              />
              <RechartsTooltip
                formatter={(v, name) => [
                  formatINR(Number(v) || 0, 0),
                  name === 'growth' ? 'Growth' : 'Invested',
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="invested"
                name="Invested"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="growth"
                name="Growth"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Growth Table */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowGrowthTable((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">Growth Table</h3>
            <p className="text-xs text-text-secondary">
              Year-by-year NPS contribution, cumulative invested, profit, and corpus growth.
            </p>
          </div>
          {showGrowthTable ? (
            <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
          )}
        </button>

        {showGrowthTable && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                  <th className="py-2 pr-3">Year</th>
                  <th className="py-2 px-3">Contribution</th>
                  <th className="py-2 px-3 text-right">Invested</th>
                  <th className="py-2 px-3 text-right">Profit</th>
                  <th className="py-2 pl-3 text-right">Growth</th>
                </tr>
              </thead>
              <tbody>
                {result.growthRows.map((row) => (
                  <tr key={row.year} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-text-primary">{row.year}</td>
                    <td className="py-2 px-3 text-text-secondary">{row.contributionLabel}</td>
                    <td className="py-2 px-3 text-right text-text-secondary">
                      {formatINR(row.invested)}
                    </td>
                    <td className="py-2 px-3 text-right text-accent-500 font-medium">
                      {formatINR(row.profit)}
                    </td>
                    <td className="py-2 pl-3 text-right font-bold text-text-primary">
                      {formatINR(row.growth)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
