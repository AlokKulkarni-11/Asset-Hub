import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
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

type ContributionFreq = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
type DurationUnit = 'YEARS' | 'MONTHS';
type CompoundingFreq = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';

interface WithdrawalPlan {
  id: number;
  label: string;
  onYear: number;
  amount: number;
}

const COMPOUNDING_MAP: Record<CompoundingFreq, number> = {
  MONTHLY: 12,
  QUARTERLY: 4,
  HALF_YEARLY: 2,
  YEARLY: 1,
};

const formatINR = (val: number, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);

const formatIndianShort = (val: number) => {
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr.`;
  if (val >= 100000) return `${(val / 100000).toFixed(2)} Lakh`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return `${Math.round(val)}`;
};

export default function FutureWealthCalculator() {
  const currentYear = new Date().getFullYear();

  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [periodicContribution, setPeriodicContribution] = useState<number>(10000);
  const [contributionFreq, setContributionFreq] = useState<ContributionFreq>('MONTHLY');
  const [durationValue, setDurationValue] = useState<number>(10);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('YEARS');
  const [growthRate, setGrowthRate] = useState<number>(12);
  const [compoundingFreq, setCompoundingFreq] = useState<CompoundingFreq>('MONTHLY');

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [stepPercent, setStepPercent] = useState<number>(0);
  const [inflationRate, setInflationRate] = useState<number>(0);
  const [stopAfterYears, setStopAfterYears] = useState<string>('');
  const [withdrawals, setWithdrawals] = useState<WithdrawalPlan[]>([]);
  const [showGrowthTable, setShowGrowthTable] = useState<boolean>(false);

  const addWithdrawal = () => {
    setWithdrawals((prev) => [
      ...prev,
      { id: Date.now(), label: 'Goal Withdrawal', onYear: 5, amount: 500000 },
    ]);
  };

  const updateWithdrawal = (
    id: number,
    field: keyof WithdrawalPlan,
    value: string | number
  ) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  };

  const removeWithdrawal = (id: number) => {
    setWithdrawals((prev) => prev.filter((w) => w.id !== id));
  };

  const result = useMemo(() => {
    const startCap = Math.max(0, Number(initialCapital) || 0);
    let currentContrib = Math.max(0, Number(periodicContribution) || 0);
    const dur = Math.max(1, Number(durationValue) || 1);
    const totalMonths = durationUnit === 'YEARS' ? dur * 12 : dur;
    const totalYearsCeil = Math.ceil(totalMonths / 12);

    const nComp = COMPOUNDING_MAP[compoundingFreq] || 12;
    const nominalAnnual = Math.max(0, Number(growthRate) || 0) / 100;
    const infAnnual = showAdvanced ? Math.max(0, Number(inflationRate) || 0) / 100 : 0;
    const effectiveAnnual =
      infAnnual > 0 ? (1 + nominalAnnual) / (1 + infAnnual) - 1 : nominalAnnual;
    const monthlyRate =
      infAnnual > 0
        ? Math.pow(1 + Math.max(-0.99, effectiveAnnual), 1 / 12) - 1
        : Math.pow(1 + nominalAnnual / nComp, nComp / 12) - 1;

    const stepRate = showAdvanced ? (Number(stepPercent) || 0) / 100 : 0;
    const stopLimitMonths =
      showAdvanced && Number(stopAfterYears) > 0
        ? Math.round(Number(stopAfterYears) * 12)
        : totalMonths;

    const contribStepMonths =
      contributionFreq === 'MONTHLY' ? 1 : contributionFreq === 'QUARTERLY' ? 3 : 12;

    const withdrawalByYear = new Map<number, number>();
    if (showAdvanced) {
      for (const w of withdrawals) {
        if (w.onYear >= 1 && w.amount > 0) {
          withdrawalByYear.set(w.onYear, (withdrawalByYear.get(w.onYear) || 0) + w.amount);
        }
      }
    }

    let balance = startCap;
    let cumulativeInvested = startCap;
    let totalWithdrawn = 0;

    const rows: {
      year: number;
      opening: number;
      periodicLabel: string;
      selfInvestment: number;
      withdrawn: number;
      growth: number;
      closing: number;
    }[] = [];

    let yrOpening = startCap;
    let yrMonths = 0;
    let yrContribCount = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const isContributing = m <= stopLimitMonths;
      if (isContributing && (m - 1) % contribStepMonths === 0) {
        balance += currentContrib;
        cumulativeInvested += currentContrib;
        yrContribCount++;
      }

      balance *= 1 + monthlyRate;
      yrMonths++;

      if (m % 12 === 0 || m === totalMonths) {
        const yrNum = Math.ceil(m / 12);
        const yrWithdrawn = Math.min(balance, withdrawalByYear.get(yrNum) || 0);
        balance = Math.max(0, balance - yrWithdrawn);
        totalWithdrawn += yrWithdrawn;

        const yrAdded = yrContribCount * currentContrib;
        const yrGrowth = balance + yrWithdrawn - yrOpening - yrAdded;

        rows.push({
          year: currentYear + yrNum,
          opening: Math.round(yrOpening),
          periodicLabel:
            yrContribCount > 0 ? `${Math.round(currentContrib)} × ${yrMonths}m` : 'Paused',
          selfInvestment: Math.round(cumulativeInvested),
          withdrawn: Math.round(yrWithdrawn),
          growth: Math.round(yrGrowth),
          closing: Math.round(balance),
        });

        yrOpening = balance;
        yrMonths = 0;
        yrContribCount = 0;

        if (isContributing && stepRate !== 0 && m % 12 === 0) {
          currentContrib = Math.max(0, currentContrib * (1 + stepRate));
        }
      }
    }

    const finalCorpus = Math.round(balance);
    const investedRounded = Math.round(cumulativeInvested);
    const totalGrowth = Math.round(finalCorpus + totalWithdrawn - investedRounded);

    return {
      invested: investedRounded,
      durationLabel: `${dur} ${durationUnit === 'YEARS' ? 'Yrs.' : 'Mos.'}`,
      totalYearsCeil,
      totalGrowth,
      finalCorpus,
      totalWithdrawn: Math.round(totalWithdrawn),
      rows,
    };
  }, [
    initialCapital,
    periodicContribution,
    contributionFreq,
    durationValue,
    durationUnit,
    growthRate,
    compoundingFreq,
    showAdvanced,
    stepPercent,
    inflationRate,
    stopAfterYears,
    withdrawals,
    currentYear,
  ]);

  const pieData = useMemo(
    () => [
      { name: 'Investment', value: Math.max(0, result.invested), color: '#94a3b8' },
      { name: 'Growth', value: Math.max(0, result.totalGrowth), color: '#6366f1' },
    ],
    [result]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Sparkles className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              Future Wealth Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Initial Capital (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Periodic Contribution (Rs.)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={periodicContribution}
                  onChange={(e) => setPeriodicContribution(Math.max(0, Number(e.target.value)))}
                  className="col-span-2 glass-input text-xs font-semibold"
                />
                <select
                  value={contributionFreq}
                  onChange={(e) => setContributionFreq(e.target.value as ContributionFreq)}
                  className="glass-input text-xs font-medium"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={durationValue}
                  onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value) || 1))}
                  className="col-span-2 glass-input text-xs font-semibold"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                  className="glass-input text-xs font-medium"
                >
                  <option value="YEARS">Years</option>
                  <option value="MONTHS">Months</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Expected Rate of Growth (%)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={growthRate}
                  onChange={(e) => setGrowthRate(Math.max(0, Number(e.target.value)))}
                  className="col-span-2 glass-input text-xs font-semibold"
                />
                <select
                  value={compoundingFreq}
                  onChange={(e) => setCompoundingFreq(e.target.value as CompoundingFreq)}
                  className="glass-input text-xs font-medium"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="HALF_YEARLY">Half Yearly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
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
                Advanced Options
              </label>

              {showAdvanced && (
                <div className="p-3.5 rounded-xl bg-surface-hover border border-border space-y-3">
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Yearly Increase / Decrease Contribution (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="Eg. 5"
                      value={stepPercent}
                      onChange={(e) => setStepPercent(Number(e.target.value))}
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
                      max="20"
                      step="0.5"
                      placeholder="Eg. 6"
                      value={inflationRate}
                      onChange={(e) => setInflationRate(Math.max(0, Number(e.target.value)))}
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Stop Contribution After (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      placeholder="Eg. 5"
                      value={stopAfterYears}
                      onChange={(e) => setStopAfterYears(e.target.value)}
                      className="glass-input text-xs font-semibold"
                    />
                  </div>

                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">
                        Goal Based Withdrawal Plans
                      </span>
                      <button
                        type="button"
                        onClick={addWithdrawal}
                        className="p-1.5 rounded-lg bg-accent-500 text-white hover:bg-accent-600"
                        title="Add Withdrawal Milestone"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {withdrawals.map((w) => (
                      <div key={w.id} className="grid grid-cols-12 gap-1.5 items-end">
                        <div className="col-span-4">
                          <label className="block text-[10px] text-text-muted mb-0.5">Goal</label>
                          <input
                            type="text"
                            value={w.label}
                            onChange={(e) => updateWithdrawal(w.id, 'label', e.target.value)}
                            className="glass-input text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-[10px] text-text-muted mb-0.5">Year #</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={w.onYear}
                            onChange={(e) =>
                              updateWithdrawal(w.id, 'onYear', Number(e.target.value))
                            }
                            className="glass-input text-xs"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="block text-[10px] text-text-muted mb-0.5">
                            Amount
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="50000"
                            value={w.amount}
                            onChange={(e) =>
                              updateWithdrawal(w.id, 'amount', Math.max(0, Number(e.target.value)))
                            }
                            className="glass-input text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWithdrawal(w.id)}
                          className="col-span-1 text-red-400 hover:text-red-500 flex justify-center pb-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Summary + Pie Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Investment</span>
                <span className="font-bold text-text-primary">{formatINR(result.invested)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Duration</span>
                <span className="font-bold text-text-primary">{result.durationLabel}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">ROG</span>
                <span className="font-bold text-text-primary">{growthRate}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Growth</span>
                <span className="font-bold text-accent-500">{formatINR(result.totalGrowth)}</span>
              </div>
              {result.totalWithdrawn > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-text-secondary">Goal Withdrawals</span>
                  <span className="font-bold text-amber-500">
                    - {formatINR(result.totalWithdrawn)}
                  </span>
                </div>
              )}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Return*</span>
                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatINR(result.finalCorpus)}
                  </p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold">
                    ({formatIndianShort(result.finalCorpus)})
                  </p>
                </div>
              </div>
            </div>

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
            <LineChart data={result.rows}>
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
                  name === 'closing' ? 'Growth' : 'Invested',
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="selfInvestment"
                name="Invested"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="closing"
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
              Year-by-year opening balance, periodic investment, withdrawals, growth &amp; closing
              balance.
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
                  <th className="py-2 px-3 text-right">Opening</th>
                  <th className="py-2 px-3">Periodic Investment</th>
                  <th className="py-2 px-3 text-right">Self Investment</th>
                  <th className="py-2 px-3 text-right">Withdrawn</th>
                  <th className="py-2 px-3 text-right">Growth</th>
                  <th className="py-2 pl-3 text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.year} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-text-primary">{row.year}</td>
                    <td className="py-2 px-3 text-right text-text-secondary">
                      {formatINR(row.opening)}
                    </td>
                    <td className="py-2 px-3 text-text-secondary">{row.periodicLabel}</td>
                    <td className="py-2 px-3 text-right text-text-secondary">
                      {formatINR(row.selfInvestment)}
                    </td>
                    <td className="py-2 px-3 text-right text-amber-500">
                      {row.withdrawn > 0 ? `- ${formatINR(row.withdrawn)}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-accent-500 font-medium">
                      {formatINR(row.growth)}
                    </td>
                    <td className="py-2 pl-3 text-right font-bold text-text-primary">
                      {formatINR(row.closing)}
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
