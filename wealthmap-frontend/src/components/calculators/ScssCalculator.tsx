import React, { useState, useMemo } from 'react';
import {
  Landmark,
  ShieldCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

export default function ScssCalculator() {
  const currentYear = new Date().getFullYear();

  const [principal, setPrincipal] = useState<number>(1000000);
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [interestRate, setInterestRate] = useState<number>(8.2);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const result = useMemo(() => {
    const P = Math.max(0, Number(principal) || 0);
    const years = Math.max(1, Number(tenureYears) || 5);
    const r = Math.max(0, Number(interestRate) || 0) / 100;

    const yearlyInterest = P * r;
    const quarterlyInterest = yearlyInterest / 4;
    const monthlyEquivalent = yearlyInterest / 12;

    const totalInterest = yearlyInterest * years;
    const totalReturn = P + totalInterest;
    const maturityYear = currentYear + years;

    return {
      principal: P,
      years,
      maturityYear,
      monthlyEquivalent,
      quarterlyInterest,
      yearlyInterest,
      totalInterest,
      totalReturn,
      exceedsLimit: P > 3000000,
    };
  }, [principal, tenureYears, interestRate, currentYear]);

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
              SCSS Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Investment / Principal Amount (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={principal}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
              {result.exceedsLimit && (
                <p className="text-[11px] text-amber-500 mt-1.5 font-medium">
                  Note: Statutory maximum investment limit per individual under SCSS is ₹30,00,000.
                </p>
              )}
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Investment Tenure (Years)
              </label>
              <select
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="glass-input text-xs font-medium"
              >
                <option value={5}>5 Years (Standard)</option>
                <option value={8}>8 Years (Extended +3 Yrs)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Rate of Interest (%)
              </label>
              <input
                type="number"
                min="1"
                max="15"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-center gap-2 text-[11px] text-text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              SCSS is backed by the Govt. of India for citizens 60+ (55+ for VRS), with ₹30L max
              deposit &amp; Sec 80C deduction up to ₹1.5L.
            </span>
          </div>
        </div>

        {/* Right Interest Receivable + Pie Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3 text-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                ₹ Interest Receivable
              </p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Monthly</span>
                <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {formatINR(result.monthlyEquivalent)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Quarterly</span>
                <span className="font-bold text-text-primary">
                  {formatINR(result.quarterlyInterest)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Yearly</span>
                <span className="font-bold text-accent-500">
                  {formatINR(result.yearlyInterest)}
                </span>
              </div>
            </div>

            <div className="h-56 w-full">
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

      {/* Expected Returns Summary */}
      <div className="glass-card p-6 space-y-3 text-xs">
        <h3 className="text-base font-bold text-text-primary">Expected Returns</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
            <p className="text-text-muted text-[11px] font-semibold">Invested</p>
            <p className="text-base font-extrabold text-text-primary mt-0.5">
              {formatINR(result.principal)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
            <p className="text-text-muted text-[11px] font-semibold">Duration &amp; ROI</p>
            <p className="text-base font-extrabold text-text-primary mt-0.5">
              {result.years} Yrs. • {interestRate}%
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
            <p className="text-text-muted text-[11px] font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-accent-500" /> Maturity Year
            </p>
            <p className="text-base font-extrabold text-text-primary mt-0.5">
              {result.maturityYear}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-accent-500/10 border border-accent-500/20 flex justify-between items-center">
            <span className="font-bold text-accent-500">Total Interest</span>
            <span className="text-base font-extrabold text-accent-500">
              {formatINR(result.totalInterest)}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
            <span className="font-bold text-emerald-700 dark:text-emerald-300">Total Return</span>
            <div className="text-right">
              <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                {formatINR(result.totalReturn)}
              </p>
              <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold">
                ({formatIndianShort(result.totalReturn)})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SCSS Scheme Details & FAQs */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowInfo((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">
              SCSS Scheme Details &amp; FAQs
            </h3>
            <p className="text-xs text-text-secondary">
              Eligibility (60+ / VRS 55+), ₹30L limit, quarterly payouts, and TDS rules.
            </p>
          </div>
          {showInfo ? (
            <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
          )}
        </button>

        {showInfo && (
          <div className="mt-5 pt-5 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-text-secondary leading-relaxed">
            <ul className="list-disc pl-4 space-y-1">
              <li>Eligible for Indian residents aged 60+ (or 55+ on VRS); NRIs are not eligible.</li>
              <li>5-year initial tenure, extendable once by 3 years (total 8 years).</li>
            </ul>
            <ul className="list-disc pl-4 space-y-1">
              <li>Interest is credited quarterly; taxable at slab rate (TDS above ₹50,000/yr).</li>
              <li>Deposit up to ₹1.5L qualifies for Sec 80C deduction in the first year.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
