import React, { useState, useMemo } from 'react';
import {
  Landmark,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

type DurationUnit = 'YEARS' | 'MONTHS' | 'DAYS';
type CompoundingFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';

const COMPOUNDING_N: Record<CompoundingFrequency, { n: number; label: string }> = {
  MONTHLY: { n: 12, label: 'Monthly' },
  QUARTERLY: { n: 4, label: 'Quarterly' },
  HALF_YEARLY: { n: 2, label: 'Half Yearly' },
  YEARLY: { n: 1, label: 'Yearly' },
};

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

export default function FdCalculator() {
  const currentYear = new Date().getFullYear();

  const [principal, setPrincipal] = useState<number>(100000);
  const [durationValue, setDurationValue] = useState<number>(5);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('YEARS');
  const [interestRate, setInterestRate] = useState<number>(7.25);
  const [compounding, setCompounding] = useState<CompoundingFrequency>('QUARTERLY');
  const [showGrowthTable, setShowGrowthTable] = useState<boolean>(true);

  const result = useMemo(() => {
    const P = Math.max(0, Number(principal) || 0);
    const dur = Math.max(1, Number(durationValue) || 1);
    const yearsTotal =
      durationUnit === 'YEARS'
        ? dur
        : durationUnit === 'MONTHS'
        ? dur / 12
        : dur / 365;
    const r = Math.max(0, Number(interestRate) || 0) / 100;
    const { n, label: compLabel } = COMPOUNDING_N[compounding];

    const maturityAmount = P * Math.pow(1 + r / n, n * yearsTotal);
    const totalInterest = Math.max(0, maturityAmount - P);

    // Year-by-year growth table
    const fullYears = Math.floor(yearsTotal);
    const remainderYear = yearsTotal - fullYears;
    const rows: {
      year: number;
      principal: number;
      opening: number;
      interest: number;
      balance: number;
    }[] = [];

    let prevBal = P;
    for (let y = 1; y <= fullYears; y++) {
      const nextBal = P * Math.pow(1 + r / n, n * y);
      const yrInterest = nextBal - prevBal;
      rows.push({
        year: currentYear + y,
        principal: P,
        opening: prevBal,
        interest: yrInterest,
        balance: nextBal,
      });
      prevBal = nextBal;
    }

    if (remainderYear > 0.001) {
      const yrInterest = maturityAmount - prevBal;
      rows.push({
        year: currentYear + fullYears + 1,
        principal: P,
        opening: prevBal,
        interest: yrInterest,
        balance: maturityAmount,
      });
    }

    return {
      principal: P,
      yearsTotal,
      durationLabel: `${dur} ${
        durationUnit === 'YEARS' ? 'Yrs.' : durationUnit === 'MONTHS' ? 'Mos.' : 'Days'
      }`,
      compLabel,
      totalInterest,
      maturityAmount,
      rows,
    };
  }, [principal, durationValue, durationUnit, interestRate, compounding, currentYear]);

  const pieData = useMemo(
    () => [
      { name: 'Principal', value: Math.round(result.principal), color: '#94a3b8' },
      { name: 'Interest', value: Math.round(result.totalInterest), color: '#6366f1' },
    ],
    [result]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Landmark className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              FD Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Principal (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={principal}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
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
                  <option value="DAYS">Days</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Rate of Interest (%)
              </label>
              <input
                type="number"
                min="0.5"
                max="20"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Compounding Frequency
              </label>
              <select
                value={compounding}
                onChange={(e) => setCompounding(e.target.value as CompoundingFrequency)}
                className="glass-input text-xs font-medium"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="HALF_YEARLY">Half Yearly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Summary + Pie Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Principal</span>
                <span className="font-bold text-text-primary">{formatINR(result.principal)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Duration</span>
                <span className="font-bold text-text-primary">{result.durationLabel}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">ROI</span>
                <span className="font-bold text-text-primary">
                  {interestRate}% ({result.compLabel})
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Interest</span>
                <span className="font-bold text-accent-500">
                  {formatINR(result.totalInterest)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Maturity</span>
                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatINR(result.maturityAmount)}
                  </p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold">
                    ({formatIndianShort(result.maturityAmount)})
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
                  <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 2), 'Amount']} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      {result.rows.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary">FD Growth Chart</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${Math.round(v / 1000)}K`
                  }
                />
                <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 2)]} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="principal" name="Principal" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="interest" name="Yearly Interest" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Growth Table */}
      {result.rows.length > 0 && (
        <div className="glass-card p-6">
          <button
            onClick={() => setShowGrowthTable((prev) => !prev)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <h3 className="text-base font-bold text-text-primary">Growth Table</h3>
              <p className="text-xs text-text-secondary">
                Year-by-year opening balance, interest earned, and closing FD balance.
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
                    <th className="py-2 px-3 text-right">Invested</th>
                    <th className="py-2 px-3 text-right">Interest</th>
                    <th className="py-2 pl-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.year} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3 font-medium text-text-primary">{row.year}</td>
                      <td className="py-2 px-3 text-right text-text-secondary">
                        {formatINR(row.opening)}
                      </td>
                      <td className="py-2 px-3 text-right text-accent-500 font-medium">
                        {formatINR(row.interest)}
                      </td>
                      <td className="py-2 pl-3 text-right font-bold text-text-primary">
                        {formatINR(row.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
