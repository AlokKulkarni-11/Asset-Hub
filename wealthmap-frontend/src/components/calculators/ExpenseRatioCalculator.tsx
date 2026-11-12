import React, { useState, useMemo } from 'react';
import {
  Percent,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

type RecurringFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
type DurationUnit = 'YEARS' | 'MONTHS';

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

export default function ExpenseRatioCalculator() {
  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [recurringAmount, setRecurringAmount] = useState<number>(10000);
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [durationValue, setDurationValue] = useState<number>(10);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('YEARS');
  const [growthRate, setGrowthRate] = useState<number>(15);
  const [expenseRatio, setExpenseRatio] = useState<number>(0.9);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [stepUpPercent, setStepUpPercent] = useState<number>(0);

  const result = useMemo(() => {
    const startCap = Math.max(0, Number(initialCapital) || 0);
    const baseRec = Math.max(0, Number(recurringAmount) || 0);
    const dur = Math.max(1, Number(durationValue) || 1);
    const totalMonths = durationUnit === 'YEARS' ? dur * 12 : dur;
    const grossAnnual = Math.max(0, Number(growthRate) || 0);
    const expenseAnnual = Math.max(0, Number(expenseRatio) || 0);
    const effectiveAnnual = Math.max(0, grossAnnual - expenseAnnual);

    const grossMonthlyRate = grossAnnual / 100 / 12;
    const netMonthlyRate = effectiveAnnual / 100 / 12;
    const stepRate = showAdvanced ? Math.max(0, Number(stepUpPercent) || 0) / 100 : 0;

    const stepMonths = frequency === 'MONTHLY' ? 1 : frequency === 'QUARTERLY' ? 3 : 12;

    let balGross = startCap;
    let balNet = startCap;
    let totalInvested = startCap;
    let currentRec = baseRec;

    const yearlyData: {
      label: string;
      withoutExpense: number;
      withExpense: number;
    }[] = [
      {
        label: 'Year 0',
        withoutExpense: Math.round(startCap),
        withExpense: Math.round(startCap),
      },
    ];

    for (let m = 1; m <= totalMonths; m++) {
      if ((m - 1) % stepMonths === 0) {
        balGross += currentRec;
        balNet += currentRec;
        totalInvested += currentRec;
      }

      balGross *= 1 + grossMonthlyRate;
      balNet *= 1 + netMonthlyRate;

      if (m % 12 === 0 || m === totalMonths) {
        const yrNum = Math.ceil(m / 12);
        yearlyData.push({
          label: `Year ${yrNum}`,
          withoutExpense: Math.round(balGross),
          withExpense: Math.round(balNet),
        });
        if (stepRate > 0 && m % 12 === 0) {
          currentRec = currentRec * (1 + stepRate);
        }
      }
    }

    const withoutExpenseTotal = Math.round(balGross);
    const withExpenseTotal = Math.round(balNet);
    const opportunityCost = Math.max(0, withoutExpenseTotal - withExpenseTotal);
    const investedRounded = Math.round(totalInvested);
    const netGrowthGained = Math.max(0, withExpenseTotal - investedRounded);

    return {
      invested: investedRounded,
      durationLabel: `${dur} ${durationUnit === 'YEARS' ? 'Yrs' : 'Mos'}`,
      yearsCount: durationUnit === 'YEARS' ? dur : Number((dur / 12).toFixed(1)),
      grossAnnual,
      expenseAnnual,
      effectiveAnnual: Number(effectiveAnnual.toFixed(2)),
      withoutExpenseTotal,
      withExpenseTotal,
      opportunityCost,
      netGrowthGained,
      yearlyData,
    };
  }, [
    initialCapital,
    recurringAmount,
    frequency,
    durationValue,
    durationUnit,
    growthRate,
    expenseRatio,
    showAdvanced,
    stepUpPercent,
  ]);

  const comparisonBarData = useMemo(
    () => [
      {
        name: `Without Expense (${result.grossAnnual}%)`,
        capitalInvested: result.invested,
        growth: Math.max(0, result.withoutExpenseTotal - result.invested),
      },
      {
        name: `With Expense (${result.effectiveAnnual}%)`,
        capitalInvested: result.invested,
        growth: result.netGrowthGained,
      },
    ],
    [result]
  );

  const returnsPieData = useMemo(
    () => [
      { name: 'Capital Invested', value: result.invested, color: '#6366f1' },
      { name: 'Growth Gained', value: result.netGrowthGained, color: '#10b981' },
      { name: 'Expense Impact', value: result.opportunityCost, color: '#ef4444' },
    ],
    [result]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Percent className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              MF Expense Ratio Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Initial Capital / Current Holding / Lumpsum (₹)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Recurring Investment (Rs.)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={recurringAmount}
                  onChange={(e) => setRecurringAmount(Math.max(0, Number(e.target.value)))}
                  className="col-span-2 glass-input text-xs font-semibold"
                />
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
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
                  max="50"
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
                Rate of Growth (%)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                step="0.5"
                value={growthRate}
                onChange={(e) => setGrowthRate(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                MF Expense Ratio (%)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.05"
                value={expenseRatio}
                onChange={(e) => setExpenseRatio(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

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
                <div className="p-3 rounded-xl bg-surface-hover border border-border space-y-1.5">
                  <label className="font-semibold text-text-secondary block">
                    Yearly Increase Contribution (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    placeholder="Eg. 5"
                    value={stepUpPercent}
                    onChange={(e) => setStepUpPercent(Math.max(0, Number(e.target.value)))}
                    className="glass-input text-xs font-semibold"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Summary Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Capital Invested
              </p>
              <p className="text-xl font-extrabold text-text-primary mt-1">
                {formatIndianShort(result.invested)}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">{formatINR(result.invested)}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Duration
              </p>
              <p className="text-xl font-extrabold text-text-primary mt-1">
                {result.durationLabel}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">Investment Period</p>
            </div>
          </div>

          <div className="glass-card p-5 border border-emerald-500/30 bg-emerald-500/5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Your Expected Returns (With {result.expenseAnnual}%
              Expense)
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatINR(result.withExpenseTotal)}
            </p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
              {formatIndianShort(result.withExpenseTotal)} • Effective Rate: {result.effectiveAnnual}%
            </p>
          </div>

          <div className="glass-card p-5 border border-red-500/30 bg-red-500/5">
            <p className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Expense Ratio Impact
            </p>
            <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">
              {formatINR(result.opportunityCost)}
            </p>
            <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">
              {formatIndianShort(result.opportunityCost)} opportunity cost over {result.yearsCount}{' '}
              years
            </p>
          </div>

          <div className="glass-card p-4 space-y-1.5 text-xs">
            <p className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" /> Understanding Expense Ratio
            </p>
            <p className="text-text-secondary leading-relaxed">
              Expense ratio is deducted from your <strong>total fund value</strong> daily, not just
              on contributions. Even a small difference (such as 0.5% Direct vs 1.5% Regular) can
              cost lakhs over 10–20 years due to compounding.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Comparison */}
      <div className="glass-card p-6 space-y-3 text-xs">
        <h3 className="text-base font-bold text-text-primary">Detailed Comparison</h3>
        <div className="flex justify-between py-2 border-b border-border/60">
          <span className="text-text-secondary">
            Without Expense ({result.grossAnnual}% growth)
          </span>
          <span className="font-bold text-accent-500">
            {formatINR(result.withoutExpenseTotal)}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-border/60">
          <span className="text-text-secondary">
            With {result.expenseAnnual}% Expense ({result.effectiveAnnual}% effective)
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {formatINR(result.withExpenseTotal)}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-text-secondary">Opportunity Cost</span>
          <span className="font-bold text-red-500">{formatINR(result.opportunityCost)}</span>
        </div>
      </div>

      {/* Growth Over Time */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-500" />
          <h3 className="text-base font-bold text-text-primary">Growth Over Time</h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.yearlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
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
              <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0)]} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="withoutExpense"
                name={`Without Expense (${result.grossAnnual}%)`}
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="withExpense"
                name={`With ${result.expenseAnnual}% Expense (${result.effectiveAnnual}%)`}
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-text-primary">
            With vs Without Expense Comparison
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${Math.round(v / 1000)}K`
                  }
                />
                <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0)]} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="capitalInvested"
                  name="Capital Invested"
                  stackId="a"
                  fill="#94a3b8"
                />
                <Bar
                  dataKey="growth"
                  name="Growth"
                  stackId="a"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-text-primary">Returns Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={returnsPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {returnsPieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0)]} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
