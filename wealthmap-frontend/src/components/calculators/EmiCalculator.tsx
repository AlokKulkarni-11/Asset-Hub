import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

type TenureUnit = 'YEARS' | 'MONTHS';
type RecurringFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';

interface LumpsumPayment {
  id: number;
  monthOffset: number;
  amount: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatINR = (val: number, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);

interface EmiCalculatorProps {
  mode?: 'emi' | 'prepayment';
}

export default function EmiCalculator({ mode = 'emi' }: EmiCalculatorProps) {
  const [loanAmount, setLoanAmount] = useState<number>(3000000);
  const [tenureValue, setTenureValue] = useState<number>(25);
  const [tenureUnit, setTenureUnit] = useState<TenureUnit>('YEARS');
  const [interestRate, setInterestRate] = useState<number>(8.5);

  // Recurring Prepayments
  const [recurringAmount, setRecurringAmount] = useState<number>(0);
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>('YEARLY');
  const [recurringYears, setRecurringYears] = useState<number>(0);

  // Lumpsum Prepayments
  const [lumpsumPayments, setLumpsumPayments] = useState<LumpsumPayment[]>(() =>
    mode === 'prepayment' ? [{ id: 1, monthOffset: 25, amount: 200000 }] : []
  );

  // UI toggles
  const [showEmiTable, setShowEmiTable] = useState<boolean>(false);
  const [tableYearFilter, setTableYearFilter] = useState<number | 'ALL'>('ALL');

  const addLumpsum = () => {
    setLumpsumPayments((prev) => [
      ...prev,
      { id: Date.now(), monthOffset: 12, amount: 100000 },
    ]);
  };

  const updateLumpsum = (id: number, field: 'monthOffset' | 'amount', value: number) => {
    setLumpsumPayments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: Math.max(0, value) } : item))
    );
  };

  const removeLumpsum = (id: number) => {
    setLumpsumPayments((prev) => prev.filter((item) => item.id !== id));
  };

  const result = useMemo(() => {
    const P = Math.max(0, Number(loanAmount) || 0);
    const dur = Math.max(1, Number(tenureValue) || 1);
    const totalMonths = tenureUnit === 'YEARS' ? dur * 12 : dur;
    const r = Math.max(0, Number(interestRate) || 0) / 12 / 100;

    let emi = 0;
    if (P > 0) {
      if (r === 0) {
        emi = P / totalMonths;
      } else {
        const factor = Math.pow(1 + r, totalMonths);
        emi = (P * r * factor) / (factor - 1);
      }
    }

    const roundedEmi = Math.round(emi);
    const basePayable = roundedEmi * totalMonths;
    const baseInterestPayable = Math.max(0, basePayable - P);

    // Build lumpsum map by 1-based month index
    const lumpsumMap = new Map<number, number>();
    for (const lp of lumpsumPayments) {
      if (lp.monthOffset >= 1 && lp.amount > 0) {
        lumpsumMap.set(
          lp.monthOffset,
          (lumpsumMap.get(lp.monthOffset) || 0) + lp.amount
        );
      }
    }

    const recFreqMonths =
      recurringFreq === 'MONTHLY'
        ? 1
        : recurringFreq === 'QUARTERLY'
        ? 3
        : recurringFreq === 'HALF_YEARLY'
        ? 6
        : 12;
    const recMaxMonths = Math.max(0, Number(recurringYears) || 0) * 12;

    const startDate = new Date();
    let balance = P;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let totalPrepayment = 0;
    let totalPaid = 0;

    const monthlyRows: {
      monthIndex: number;
      year: number;
      monthName: string;
      principal: number;
      interest: number;
      prepayment: number;
      emiPaid: number;
      balance: number;
      cumulativePaid: number;
      paidPercent: number;
    }[] = [];

    const yearlyChartMap = new Map<
      number,
      { year: number; paidPrincipal: number; paidInterest: number }
    >();

    for (let m = 1; m <= totalMonths && balance > 0.5; m++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + (m - 1), 1);
      const yr = date.getFullYear();
      const monthName = MONTH_NAMES[date.getMonth()];

      const interest = balance * r;
      let principalComponent = Math.min(balance, emi - interest);
      if (principalComponent < 0) principalComponent = 0;

      const actualEmi = principalComponent + interest;
      balance = Math.max(0, balance - principalComponent);

      // Prepayments
      let prepayment = 0;
      if (recurringAmount > 0 && recMaxMonths > 0 && m <= recMaxMonths && m % recFreqMonths === 0) {
        prepayment += recurringAmount;
      }
      if (lumpsumMap.has(m)) {
        prepayment += lumpsumMap.get(m)!;
      }
      prepayment = Math.min(balance, prepayment);
      balance = Math.max(0, balance - prepayment);

      totalInterestPaid += interest;
      totalPrincipalPaid += principalComponent + prepayment;
      totalPrepayment += prepayment;
      totalPaid += actualEmi + prepayment;

      const paidPercent = basePayable > 0 ? Math.min(100, (totalPaid / basePayable) * 100) : 0;

      monthlyRows.push({
        monthIndex: m,
        year: yr,
        monthName,
        principal: Math.round(principalComponent),
        interest: Math.round(interest),
        prepayment: Math.round(prepayment),
        emiPaid: Math.round(actualEmi),
        balance: Math.round(balance),
        cumulativePaid: Math.round(totalPaid),
        paidPercent,
      });

      const prevYr = yearlyChartMap.get(yr) || {
        year: yr,
        paidPrincipal: 0,
        paidInterest: 0,
      };
      prevYr.paidPrincipal += Math.round(principalComponent + prepayment);
      prevYr.paidInterest += Math.round(interest);
      yearlyChartMap.set(yr, prevYr);
    }

    const yearlyChart = Array.from(yearlyChartMap.values());
    const yearsList = yearlyChart.map((y) => y.year);
    const interestSaved = Math.max(0, baseInterestPayable - totalInterestPaid);
    const monthsSaved = Math.max(0, totalMonths - monthlyRows.length);

    return {
      principal: P,
      tenureLabel: `${dur} ${tenureUnit === 'YEARS' ? 'Yrs.' : 'Mos.'}`,
      emi: roundedEmi,
      baseInterestPayable: Math.round(baseInterestPayable),
      basePayable: Math.round(basePayable),
      totalInterestPaid: Math.round(totalInterestPaid),
      totalPaid: Math.round(totalPaid),
      totalPrepayment: Math.round(totalPrepayment),
      interestSaved: Math.round(interestSaved),
      monthsSaved,
      actualMonths: monthlyRows.length,
      pieData: [
        { name: 'Loan Amount', value: Math.round(P), color: '#94a3b8' },
        { name: 'Interest', value: Math.round(totalInterestPaid), color: '#6366f1' },
      ],
      yearlyChart,
      yearsList,
      monthlyRows,
    };
  }, [
    loanAmount,
    tenureValue,
    tenureUnit,
    interestRate,
    recurringAmount,
    recurringFreq,
    recurringYears,
    lumpsumPayments,
  ]);

  const filteredMonthlyRows = useMemo(() => {
    if (tableYearFilter === 'ALL') return result.monthlyRows;
    return result.monthlyRows.filter((r) => r.year === tableYearFilter);
  }, [result.monthlyRows, tableYearFilter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <IndianRupee className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              {mode === 'prepayment' ? 'Home Loan Prepayment Calculator' : 'EMI Calculator'}
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
                step="50000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold mb-2"
              />
              <input
                type="range"
                min="100000"
                max="50000000"
                step="100000"
                value={Math.min(50000000, loanAmount)}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">Tenure</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={tenureValue}
                  onChange={(e) => setTenureValue(Math.max(1, Number(e.target.value) || 1))}
                  className="col-span-2 glass-input text-xs font-semibold"
                />
                <select
                  value={tenureUnit}
                  onChange={(e) => setTenureUnit(e.target.value as TenureUnit)}
                  className="glass-input text-xs font-medium"
                >
                  <option value="YEARS">Years</option>
                  <option value="MONTHS">Months</option>
                </select>
              </div>
              <input
                type="range"
                min="1"
                max={tenureUnit === 'YEARS' ? 35 : 420}
                value={Math.min(tenureUnit === 'YEARS' ? 35 : 420, tenureValue)}
                onChange={(e) => setTenureValue(Number(e.target.value))}
                className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Rate of Interest (%)
              </label>
              <input
                type="number"
                min="1"
                max="25"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold mb-2"
              />
              <input
                type="range"
                min="4"
                max="20"
                step="0.1"
                value={Math.min(20, Math.max(4, interestRate))}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
              />
            </div>

            {/* Prepayments / Part Payments */}
            <div className="p-4 rounded-xl bg-surface-hover border border-dashed border-border space-y-3">
              <p className="font-bold text-text-primary">Prepayments / Part Payments</p>

              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Recurring Payments
                </p>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <span className="text-text-secondary font-medium">Amount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={recurringAmount}
                    onChange={(e) => setRecurringAmount(Math.max(0, Number(e.target.value)))}
                    className="glass-input text-xs font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <span className="text-text-secondary font-medium">Frequency</span>
                  <select
                    value={recurringFreq}
                    onChange={(e) => setRecurringFreq(e.target.value as RecurringFrequency)}
                    className="glass-input text-xs font-medium"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="HALF_YEARLY">Half Yearly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <span className="text-text-secondary font-medium">No Of Years</span>
                  <input
                    type="number"
                    min="0"
                    max="35"
                    value={recurringYears}
                    onChange={(e) => setRecurringYears(Math.max(0, Number(e.target.value)))}
                    className="glass-input text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Lumpsum / Single Payments
                  </p>
                  <button
                    type="button"
                    onClick={addLumpsum}
                    className="p-1.5 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                    title="Add Lumpsum Prepayment"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {lumpsumPayments.map((lp) => (
                  <div key={lp.id} className="grid grid-cols-12 gap-1.5 items-end">
                    <div className="col-span-5">
                      <label className="block text-[10px] text-text-muted mb-0.5">
                        On Month *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="480"
                        value={lp.monthOffset}
                        onChange={(e) =>
                          updateLumpsum(lp.id, 'monthOffset', Number(e.target.value))
                        }
                        placeholder="e.g. 25"
                        className="glass-input text-xs"
                        title="Month number (e.g. 25 = after 2 years)"
                      />
                    </div>
                    <div className="col-span-6">
                      <label className="block text-[10px] text-text-muted mb-0.5">
                        Pre-Pay Amount *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={lp.amount}
                        onChange={(e) => updateLumpsum(lp.id, 'amount', Number(e.target.value))}
                        placeholder="Amount"
                        className="glass-input text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLumpsum(lp.id)}
                      className="col-span-1 text-red-400 hover:text-red-500 flex justify-center pb-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary + Pie Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
              <p className="text-text-muted text-[11px] font-semibold">Loan Amount</p>
              <p className="text-base font-extrabold text-text-primary mt-0.5">
                {formatINR(result.principal)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
              <p className="text-text-muted text-[11px] font-semibold">Tenure</p>
              <p className="text-base font-extrabold text-text-primary mt-0.5">
                {result.tenureLabel}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
              <p className="text-text-muted text-[11px] font-semibold">ROI</p>
              <p className="text-base font-extrabold text-text-primary mt-0.5">
                {interestRate.toFixed(2)}%
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-accent-500/10 border border-accent-500/20">
              <p className="text-accent-500 text-[11px] font-semibold">Monthly EMI</p>
              <p className="text-base font-extrabold text-accent-500 mt-0.5">
                {formatINR(result.emi)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
              <p className="text-text-muted text-[11px] font-semibold">Interest Payable</p>
              <p className="text-sm font-bold text-text-primary mt-0.5">
                {formatINR(result.baseInterestPayable)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
                Interest Paid
              </p>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatINR(result.totalInterestPaid)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-hover border border-border">
              <p className="text-text-muted text-[11px] font-semibold">Total Payable</p>
              <p className="text-sm font-bold text-text-primary mt-0.5">
                {formatINR(result.basePayable)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                Total Paid
              </p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatINR(result.totalPaid)}
              </p>
            </div>
          </div>

          {result.totalPrepayment > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Prepayment Savings
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                Saved {formatINR(result.interestSaved, 0)} interest &amp; {result.monthsSaved} months
              </span>
            </div>
          )}

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={result.pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {result.pieData.map((entry, idx) => (
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

      {/* Principal vs Interest Chart */}
      {result.yearlyChart.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary">
              Principal vs. Interest Chart
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.yearlyChart}>
                <defs>
                  <linearGradient id="emiPrincipalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="emiInterestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
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
                  dataKey="paidPrincipal"
                  name="Paid Principal"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#emiPrincipalGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="paidInterest"
                  name="Paid Interest"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#emiInterestGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* EMI Table */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowEmiTable((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">EMI Amortization Table</h3>
            <p className="text-xs text-text-secondary">
              Month-by-month Principal (A) + Interest (B) + Prepayment (C), Balance, and % Paid.
            </p>
          </div>
          {showEmiTable ? (
            <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
          )}
        </button>

        {showEmiTable && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-end gap-2 text-xs">
              <span className="text-text-secondary font-medium">Filter Year:</span>
              <select
                value={tableYearFilter}
                onChange={(e) =>
                  setTableYearFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
                className="glass-input text-xs w-32"
              >
                <option value="ALL">All Years</option>
                {result.yearsList.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-surface z-10">
                  <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                    <th className="py-2 pr-3">Month</th>
                    <th className="py-2 px-3">Principal (A) + Int. (B) + Prepayment (C)</th>
                    <th className="py-2 px-3 text-right">EMI (A+B)</th>
                    <th className="py-2 px-3 text-right">Balance</th>
                    <th className="py-2 pl-3 text-right">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMonthlyRows.map((row) => (
                    <tr key={row.monthIndex} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3 font-medium text-text-primary">
                        {row.monthName} {row.year}
                      </td>
                      <td className="py-2 px-3 text-text-secondary">
                        {formatINR(row.principal, 0)} + {formatINR(row.interest, 0)} +{' '}
                        {formatINR(row.prepayment, 0)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-text-primary">
                        {formatINR(row.emiPaid, 0)}
                      </td>
                      <td className="py-2 px-3 text-right text-text-secondary">
                        {formatINR(row.balance, 0)}
                      </td>
                      <td className="py-2 pl-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatINR(row.cumulativePaid, 0)} ({row.paidPercent.toFixed(2)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
