import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

type DepositFrequency = 'MONTHLY' | 'YEARLY';

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

const SAMPLE_RETURNS = [
  { monthly: 'Rs. 5,000', tenure: '15 Years', roi: '7.1%', expected: 'Rs. 15,77,227' },
  { monthly: 'Rs. 5,000', tenure: '20 Years', roi: '7.1%', expected: 'Rs. 25,81,390' },
  { monthly: 'Rs. 7,500', tenure: '15 Years', roi: '7.1%', expected: 'Rs. 23,65,841' },
  { monthly: 'Rs. 7,500', tenure: '20 Years', roi: '7.1%', expected: 'Rs. 38,72,085' },
  { monthly: 'Rs. 12,500', tenure: '15 Years', roi: '7.1%', expected: 'Rs. 39,43,068' },
  { monthly: 'Rs. 12,500', tenure: '20 Years', roi: '7.1%', expected: 'Rs. 64,53,475' },
];

export default function PpfCalculator() {
  const currentYear = new Date().getFullYear();

  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(10000);
  const [frequency, setFrequency] = useState<DepositFrequency>('MONTHLY');
  const [durationYears, setDurationYears] = useState<number>(15);
  const [interestRate, setInterestRate] = useState<number>(7.1);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const result = useMemo(() => {
    const startBal = Math.max(0, Number(openingBalance) || 0);
    const deposit = Math.max(0, Number(depositAmount) || 0);
    const years = Math.max(1, Math.min(50, Math.round(Number(durationYears) || 15)));
    const r = Math.max(0, Number(interestRate) || 0) / 100;

    let balance = startBal;
    let totalInvested = startBal;
    const yearlyRows: {
      year: number;
      calendarYear: number;
      opening: number;
      deposited: number;
      interest: number;
      closing: number;
    }[] = [];

    for (let y = 1; y <= years; y++) {
      const opening = balance;
      let yearlyDeposit = 0;
      let yearlyInterest = 0;

      if (frequency === 'MONTHLY') {
        yearlyDeposit = deposit * 12;
        // PPF calculates interest monthly on lowest balance between 5th & end of month, credited annually
        // Depositing before 5th earns interest for 12, 11, ..., 1 months (78 month-units)
        const openingInterest = opening * r;
        const depositInterest = deposit * 78 * (r / 12);
        yearlyInterest = openingInterest + depositInterest;
      } else {
        yearlyDeposit = deposit;
        // Yearly lump-sum deposited at start of FY (before April 5) earns full year interest
        yearlyInterest = (opening + yearlyDeposit) * r;
      }

      balance = opening + yearlyDeposit + yearlyInterest;
      totalInvested += yearlyDeposit;

      yearlyRows.push({
        year: y,
        calendarYear: currentYear + y,
        opening: Math.round(opening),
        deposited: Math.round(yearlyDeposit),
        interest: Math.round(yearlyInterest),
        closing: Math.round(balance),
      });
    }

    const maturityAmount = Math.round(balance);
    const totalInterest = Math.max(0, maturityAmount - Math.round(totalInvested));
    const maturityYear = currentYear + years;
    const annualContribution = frequency === 'MONTHLY' ? deposit * 12 : deposit;
    const exceedsAnnualCap = annualContribution > 150000;

    return {
      totalInvested: Math.round(totalInvested),
      totalInterest,
      maturityAmount,
      maturityYear,
      years,
      annualContribution,
      exceedsAnnualCap,
      yearlyRows,
    };
  }, [openingBalance, depositAmount, frequency, durationYears, interestRate, currentYear]);

  const pieData = useMemo(
    () => [
      { name: 'Principal', value: result.totalInvested, color: '#94a3b8' },
      { name: 'Interest', value: result.totalInterest, color: '#6366f1' },
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
              PPF Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Existing Balance */}
            <div>
              <label className="flex items-center justify-between font-semibold text-text-secondary mb-1.5">
                <span>Current A/C Balance (For existing PPF Accounts)</span>
                <span
                  title="Leave 0 for a new PPF account, or enter your current PPF balance."
                  className="text-accent-500 cursor-help"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            {/* Recurring Deposit */}
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Recurring Deposit (Rs.)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Math.max(0, Number(e.target.value)))}
                  className="col-span-2 glass-input text-xs font-semibold"
                />
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as DepositFrequency)}
                  className="glass-input text-xs font-medium"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              {result.exceedsAnnualCap && (
                <p className="text-[11px] text-amber-500 mt-1.5 font-medium">
                  Note: Annual deposit ({formatINR(result.annualContribution, 0)}) exceeds the
                  current ₹1,50,000/year PPF statutory limit.
                </p>
              )}
            </div>

            {/* Investment Duration */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-text-secondary">
                  Investment Duration (Years)
                </label>
                <div className="flex gap-1">
                  {[15, 20, 25, 30].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setDurationYears(yr)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        durationYears === yr
                          ? 'bg-accent-500 text-white border-accent-500'
                          : 'bg-surface-hover text-text-secondary border-border hover:text-text-primary'
                      }`}
                    >
                      {yr}Y
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                max="50"
                value={durationYears}
                onChange={(e) =>
                  setDurationYears(Math.max(1, Math.min(50, Number(e.target.value) || 1)))
                }
                className="glass-input text-xs font-semibold"
              />
            </div>

            {/* Rate of Interest */}
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Rate of Interest (% p.a.)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="15"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                  className="glass-input text-xs font-semibold"
                />
                <span className="text-text-muted font-bold">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary + Pie Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Summary Metrics */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Invested</span>
                <span className="font-bold text-text-primary">
                  {formatINR(result.totalInvested)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Duration</span>
                <span className="font-bold text-text-primary">{result.years} Yrs.</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">ROI</span>
                <span className="font-bold text-text-primary">{interestRate}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-accent-500" /> Maturity Year
                </span>
                <span className="font-bold text-text-primary">{result.maturityYear}</span>
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

            {/* Pie Chart */}
            <div className="h-60 w-full flex flex-col items-center justify-center">
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

          <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-center gap-2 text-[11px] text-text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              PPF falls under the <strong>EEE (Exempt-Exempt-Exempt)</strong> tax category —
              investments (up to ₹1.5L/yr under 80C), interest, and maturity corpus are tax-free.
            </span>
          </div>
        </div>
      </div>

      {/* Year-by-Year Growth Schedule */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowSchedule((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Year-by-Year PPF Growth Schedule
            </h3>
            <p className="text-xs text-text-secondary">
              Annual opening balance, deposits, compounded interest, and closing balance.
            </p>
          </div>
          {showSchedule ? (
            <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
          )}
        </button>

        {showSchedule && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                  <th className="py-2 pr-3">Year</th>
                  <th className="py-2 px-3">Calendar Year</th>
                  <th className="py-2 px-3 text-right">Opening Balance</th>
                  <th className="py-2 px-3 text-right">Deposited</th>
                  <th className="py-2 px-3 text-right">Interest Earned</th>
                  <th className="py-2 pl-3 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.yearlyRows.map((row) => (
                  <tr key={row.year} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-text-primary">Yr {row.year}</td>
                    <td className="py-2 px-3 text-text-secondary">{row.calendarYear}</td>
                    <td className="py-2 px-3 text-right text-text-secondary">
                      {formatINR(row.opening, 0)}
                    </td>
                    <td className="py-2 px-3 text-right text-text-secondary">
                      {formatINR(row.deposited, 0)}
                    </td>
                    <td className="py-2 px-3 text-right text-accent-500 font-medium">
                      {formatINR(row.interest, 0)}
                    </td>
                    <td className="py-2 pl-3 text-right font-bold text-text-primary">
                      {formatINR(row.closing, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sample Returns & PPF Guide */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowInfo((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">
              PPF Sample Returns, Rules &amp; FAQs
            </h3>
            <p className="text-xs text-text-secondary">
              15-year lock-in, 5-year block extensions, ₹1.5L/yr limit, and loan facility after 3
              years.
            </p>
          </div>
          {showInfo ? (
            <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
          )}
        </button>

        {showInfo && (
          <div className="mt-5 pt-5 border-t border-border space-y-6 text-xs text-text-secondary">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                    <th className="py-2 pr-3">Monthly Investment</th>
                    <th className="py-2 px-3">Tenure</th>
                    <th className="py-2 px-3">ROI</th>
                    <th className="py-2 pl-3 text-right">Expected Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_RETURNS.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3 font-medium text-text-primary">{row.monthly}</td>
                      <td className="py-2 px-3">{row.tenure}</td>
                      <td className="py-2 px-3">{row.roi}</td>
                      <td className="py-2 pl-3 text-right font-bold text-accent-500">
                        {row.expected}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
              <div className="space-y-1.5">
                <h4 className="font-bold text-text-primary">Key PPF Rules</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Default maturity tenure is 15 years, extendable in blocks of 5 years.</li>
                  <li>Maximum annual deposit is ₹1.5 lakh per financial year (up to 12 installments).</li>
                  <li>Loan against PPF is available after completing 3 years (at PPF rate + 2%).</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-text-primary">Eligibility &amp; Tax</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Resident Indians of any age can hold one PPF account (guardians for minors).</li>
                  <li>NRIs cannot open a new PPF account.</li>
                  <li>You can hold both EPF and PPF accounts simultaneously.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
