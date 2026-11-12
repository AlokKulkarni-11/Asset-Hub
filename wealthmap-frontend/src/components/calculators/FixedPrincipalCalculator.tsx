import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const formatINR = (val: number, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);

export default function FixedPrincipalCalculator() {
  const [loanAmount, setLoanAmount] = useState<number>(1200000);
  const [interestRate, setInterestRate] = useState<number>(11.5);
  const [monthlyPrincipal, setMonthlyPrincipal] = useState<number>(25000);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [customTenureMonths, setCustomTenureMonths] = useState<string>('');
  const [showTable, setShowTable] = useState<boolean>(true);

  const result = useMemo(() => {
    const P = Math.max(0, Number(loanAmount) || 0);
    const r = Math.max(0, Number(interestRate) || 0) / 12 / 100;
    const basePrincipal = Math.max(1, Number(monthlyPrincipal) || 1);
    const maxTenure =
      showAdvanced && Number(customTenureMonths) > 0
        ? Math.min(600, Math.round(Number(customTenureMonths)))
        : 600;

    const startDate = new Date();
    let balance = P;
    let totalInterest = 0;

    const rows: {
      periodIndex: number;
      periodLabel: string;
      principal: number;
      interest: number;
      payment: number;
      remaining: number;
      isBalloon: boolean;
    }[] = [];

    for (let m = 1; m <= maxTenure && balance > 0.01; m++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1);
      const periodLabel = `${m} / ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
      const interest = balance * r;

      const isFinalForcedMonth = showAdvanced && Number(customTenureMonths) > 0 && m === maxTenure;
      const principalPaid = isFinalForcedMonth ? balance : Math.min(balance, basePrincipal);
      const payment = principalPaid + interest;

      balance = Math.max(0, balance - principalPaid);
      totalInterest += interest;

      rows.push({
        periodIndex: m,
        periodLabel,
        principal: Math.round(principalPaid),
        interest: Math.round(interest),
        payment: Math.round(payment),
        remaining: Math.round(balance),
        isBalloon: isFinalForcedMonth && principalPaid > basePrincipal,
      });
    }

    const totalMonths = rows.length;
    const years = Math.floor(totalMonths / 12);
    const remMonths = totalMonths % 12;
    const tenureHuman =
      years > 0 && remMonths === 0
        ? `${years} ${years === 1 ? 'Year' : 'Years'}`
        : years > 0
        ? `${years}Y ${remMonths}M`
        : `${totalMonths} Mos`;

    const lastDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + Math.max(1, totalMonths),
      1
    );
    const closingLabel =
      totalMonths > 0
        ? `${MONTH_SHORT[lastDate.getMonth()]} ${lastDate.getFullYear()}`
        : '—';

    const totalInterestRounded = Math.round(totalInterest);
    const totalPayable = Math.round(P + totalInterestRounded);

    return {
      loanAmount: P,
      totalMonths,
      tenureHuman,
      closingLabel,
      totalInterest: totalInterestRounded,
      totalPayable,
      rows,
    };
  }, [loanAmount, interestRate, monthlyPrincipal, showAdvanced, customTenureMonths]);

  const breakdownData = useMemo(
    () => [
      { name: 'Loan Amount', amount: Math.round(result.loanAmount), color: '#6366f1' },
      { name: 'Interest', amount: Math.round(result.totalInterest), color: '#94a3b8' },
    ],
    [result]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <IndianRupee className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              Fixed Principal Loan Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Loan Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="25000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Rate of Interest (%)
              </label>
              <input
                type="number"
                min="0"
                max="36"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Monthly Principal Payment (₹)
              </label>
              <input
                type="number"
                min="100"
                step="1000"
                value={monthlyPrincipal}
                onChange={(e) => setMonthlyPrincipal(Math.max(100, Number(e.target.value) || 100))}
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
                    Tenure (In Months) — Optional Balloon Payoff
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    placeholder="Eg. 5"
                    value={customTenureMonths}
                    onChange={(e) => setCustomTenureMonths(e.target.value)}
                    className="glass-input text-xs font-semibold"
                  />
                  <p className="text-[10px] text-text-muted">
                    If set, pays fixed principal each month and settles remaining balance in the
                    final month.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Summary + Breakdown Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
              <p className="text-text-muted text-[11px] font-semibold">Loan</p>
              <p className="text-base font-extrabold text-text-primary mt-0.5">
                {formatINR(result.loanAmount)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
              <p className="text-text-muted text-[11px] font-semibold">ROI</p>
              <p className="text-base font-extrabold text-text-primary mt-0.5">
                {interestRate}%
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
              <p className="text-text-muted text-[11px] font-semibold">Tenure</p>
              <p className="text-base font-extrabold text-text-primary mt-0.5">
                {result.totalMonths} Mos.{' '}
                <span className="text-[11px] font-medium text-text-secondary">
                  ({result.tenureHuman})
                </span>
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
              <p className="text-text-muted text-[11px] font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent-500" /> EMI Closing
              </p>
              <p className="text-base font-extrabold text-text-primary mt-0.5">
                {result.closingLabel}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
                Interest
              </p>
              <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatINR(result.totalInterest)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-accent-500/10 border border-accent-500/20">
              <p className="text-accent-500 text-[11px] font-semibold">Payable</p>
              <p className="text-base font-extrabold text-accent-500 mt-0.5">
                {formatINR(result.totalPayable)}
              </p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${Math.round(v / 1000)}K`
                  }
                />
                <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0), 'Amount']} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={90}>
                  {breakdownData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* EMI / Payment Table */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowTable((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">EMI / Payment Table</h3>
            <p className="text-xs text-text-secondary">
              Declining monthly payments with fixed principal and reducing balance interest.
            </p>
          </div>
          {showTable ? (
            <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
          )}
        </button>

        {showTable && (
          <div className="mt-4 overflow-x-auto max-h-[420px]">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 px-3 text-right">Principal</th>
                  <th className="py-2 px-3 text-right">Interest</th>
                  <th className="py-2 px-3 text-right">EMI / Payment</th>
                  <th className="py-2 pl-3 text-right">Remaining Principal</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.periodIndex} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-text-primary">
                      {row.periodLabel}
                      {row.isBalloon && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">
                          Balloon
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-text-secondary">
                      {formatINR(row.principal)}
                    </td>
                    <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">
                      {formatINR(row.interest)}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-text-primary">
                      {formatINR(row.payment)}
                    </td>
                    <td className="py-2 pl-3 text-right text-text-secondary">
                      {formatINR(row.remaining)}
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
