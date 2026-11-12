import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
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

interface SipCalculatorProps {
  mode?: 'sip' | 'step-up';
}

export default function SipCalculator({ mode = 'sip' }: SipCalculatorProps) {
  const currentYear = new Date().getFullYear();

  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(0);
  const [durationValue, setDurationValue] = useState<number>(10);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('YEARS');
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(mode === 'step-up');
  const [stepUpPercent, setStepUpPercent] = useState<number>(0);
  const [inflationRate, setInflationRate] = useState<number>(0);
  const [showGrowthTable, setShowGrowthTable] = useState<boolean>(false);

  const result = useMemo(() => {
    let currentMonthly = Math.max(0, Number(monthlyContribution) || 0);
    const startLumpsum = Math.max(0, Number(lumpsumAmount) || 0);
    const dur = Math.max(1, Number(durationValue) || 1);
    const totalMonths = durationUnit === 'YEARS' ? dur * 12 : dur;
    const rMonthly = Math.max(0, Number(expectedReturn) || 0) / 100 / 12;
    const stepRate = showAdvanced ? Math.max(0, Number(stepUpPercent) || 0) / 100 : 0;
    const infRate = showAdvanced ? Math.max(0, Number(inflationRate) || 0) / 100 : 0;

    let balance = startLumpsum;
    let totalInvested = startLumpsum;

    const growthRows: {
      year: number;
      sipsLabel: string;
      invested: number;
      yearlyProfit: number;
      growth: number;
    }[] = [];

    let yrStartBalance = startLumpsum;
    let yrInvested = 0;
    let yrMonths = 0;

    for (let m = 1; m <= totalMonths; m++) {
      balance = (balance + currentMonthly) * (1 + rMonthly);
      totalInvested += currentMonthly;
      yrInvested += currentMonthly;
      yrMonths += 1;

      if (m % 12 === 0 || m === totalMonths) {
        const yrIndex = Math.ceil(m / 12);
        const yearlyProfit = balance - yrStartBalance - yrInvested;
        growthRows.push({
          year: currentYear + yrIndex,
          sipsLabel: `${Math.round(currentMonthly)} x ${yrMonths}m`,
          invested: Math.round(totalInvested),
          yearlyProfit: Math.round(Math.max(0, yearlyProfit)),
          growth: Math.round(balance),
        });

        yrStartBalance = balance;
        yrInvested = 0;
        yrMonths = 0;

        if (stepRate > 0 && m % 12 === 0) {
          currentMonthly = currentMonthly * (1 + stepRate);
        }
      }
    }

    const totalReturn = Math.round(balance);
    const totalInvestedRounded = Math.round(totalInvested);
    const totalProfit = Math.max(0, totalReturn - totalInvestedRounded);
    const yearsCount = totalMonths / 12;
    const inflationAdjustedReturn =
      infRate > 0 ? Math.round(totalReturn / Math.pow(1 + infRate, yearsCount)) : totalReturn;

    return {
      invested: totalInvestedRounded,
      durationLabel: `${dur} ${durationUnit === 'YEARS' ? 'Yrs.' : 'Mos.'}`,
      profit: totalProfit,
      totalReturn,
      infRate,
      inflationAdjustedReturn,
      growthRows,
    };
  }, [
    monthlyContribution,
    lumpsumAmount,
    durationValue,
    durationUnit,
    expectedReturn,
    showAdvanced,
    stepUpPercent,
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
            <TrendingUp className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              {mode === 'step-up' ? 'Step-Up SIP Calculator' : 'SIP Calculator'}
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Monthly Contribution (Rs.)
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
              <label className="font-semibold text-text-secondary block mb-1.5">
                Initial Lumpsum (Rs.) (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={lumpsumAmount}
                onChange={(e) => setLumpsumAmount(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
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
                Expected Rate of Interest (%)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Math.max(0, Number(e.target.value)))}
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
                <div className="p-3 rounded-xl bg-surface-hover border border-border space-y-3">
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
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
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Invested</span>
                <span className="font-bold text-text-primary">{formatINR(result.invested)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Duration</span>
                <span className="font-bold text-text-primary">{result.durationLabel}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">ROI</span>
                <span className="font-bold text-text-primary">{expectedReturn}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Profit*</span>
                <span className="font-bold text-accent-500">{formatINR(result.profit)}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Return*</span>
                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatINR(result.totalReturn)}
                  </p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold">
                    ({formatIndianShort(result.totalReturn)})
                  </p>
                </div>
              </div>

              {result.infRate > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    Inflation-Adjusted ({inflationRate}%)
                  </span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {formatINR(result.inflationAdjustedReturn, 0)}
                  </span>
                </div>
              )}
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
              Year-by-year SIP schedule, cumulative invested amount, yearly profit, and total
              growth.
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
                  <th className="py-2 px-3">SIPs</th>
                  <th className="py-2 px-3 text-right">Invested</th>
                  <th className="py-2 px-3 text-right">Profit (Yr)</th>
                  <th className="py-2 pl-3 text-right">Growth</th>
                </tr>
              </thead>
              <tbody>
                {result.growthRows.map((row) => (
                  <tr key={row.year} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-text-primary">{row.year}</td>
                    <td className="py-2 px-3 text-text-secondary">{row.sipsLabel}</td>
                    <td className="py-2 px-3 text-right text-text-secondary">
                      {formatINR(row.invested)}
                    </td>
                    <td className="py-2 px-3 text-right text-accent-500 font-medium">
                      {formatINR(row.yearlyProfit)}
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
