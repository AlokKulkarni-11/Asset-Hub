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

export default function SsyCalculator() {
  const currentYear = new Date().getFullYear();
  const openedYearOptions = Array.from({ length: 16 }, (_, i) => currentYear - i);

  const [existingBalance, setExistingBalance] = useState<number>(0);
  const [openedYear, setOpenedYear] = useState<number>(currentYear);
  const [recurringDeposit, setRecurringDeposit] = useState<number>(10000);
  const [frequency, setFrequency] = useState<DepositFrequency>('MONTHLY');
  const [investmentDuration, setInvestmentDuration] = useState<number>(15);
  const [maturityYears, setMaturityYears] = useState<number>(21);
  const [interestRate, setInterestRate] = useState<number>(8.2);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const result = useMemo(() => {
    const startBal = Math.max(0, Number(existingBalance) || 0);
    const deposit = Math.max(0, Number(recurringDeposit) || 0);
    const matYrs = Math.max(1, Math.min(30, Math.round(Number(maturityYears) || 21)));
    const invYrs = Math.max(1, Math.min(matYrs, Math.round(Number(investmentDuration) || 15)));
    const r = Math.max(0, Number(interestRate) || 0) / 100;

    const elapsedYears = Math.max(0, currentYear - openedYear);
    const remainingTotalYears = Math.max(1, matYrs - elapsedYears);
    const remainingContribYears = Math.max(0, invYrs - elapsedYears);

    let balance = startBal;
    let totalInvested = startBal;

    const rows: {
      year: number;
      calendarYear: number;
      deposited: number;
      interest: number;
      closing: number;
    }[] = [];

    for (let y = 1; y <= remainingTotalYears; y++) {
      const opening = balance;
      const isContribYear = y <= remainingContribYears;
      let yearlyDeposit = 0;
      let yearlyInterest = 0;

      if (isContribYear) {
        if (frequency === 'MONTHLY') {
          yearlyDeposit = deposit * 12;
          yearlyInterest = opening * r + deposit * 78 * (r / 12);
        } else {
          yearlyDeposit = deposit;
          yearlyInterest = (opening + yearlyDeposit) * r;
        }
      } else {
        yearlyInterest = opening * r;
      }

      balance = opening + yearlyDeposit + yearlyInterest;
      totalInvested += yearlyDeposit;

      rows.push({
        year: elapsedYears + y,
        calendarYear: currentYear + y,
        deposited: Math.round(yearlyDeposit),
        interest: Math.round(yearlyInterest),
        closing: Math.round(balance),
      });
    }

    const totalInterest = Math.max(0, balance - totalInvested);
    const contributeTill = openedYear + invYrs;
    const matureYear = openedYear + matYrs;
    const annualContribution = frequency === 'MONTHLY' ? deposit * 12 : deposit;

    return {
      capital: totalInvested,
      totalYears: matYrs,
      contributeTill,
      matureYear,
      interest: totalInterest,
      maturity: balance,
      exceedsAnnualCap: annualContribution > 150000,
      annualContribution,
      rows,
    };
  }, [
    existingBalance,
    openedYear,
    recurringDeposit,
    frequency,
    investmentDuration,
    maturityYears,
    interestRate,
    currentYear,
  ]);

  const pieData = useMemo(
    () => [
      { name: 'Principal', value: Math.round(result.capital), color: '#94a3b8' },
      { name: 'Interest', value: Math.round(result.interest), color: '#6366f1' },
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
              SSY Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Existing SSY A/C Balance
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={existingBalance}
                  onChange={(e) => setExistingBalance(Math.max(0, Number(e.target.value)))}
                  className="glass-input text-xs font-semibold"
                />
              </div>
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  A/C Opened on
                </label>
                <select
                  value={openedYear}
                  onChange={(e) => setOpenedYear(Number(e.target.value))}
                  className="glass-input text-xs font-medium"
                >
                  {openedYearOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Future Recurring Deposits (INR)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={recurringDeposit}
                  onChange={(e) => setRecurringDeposit(Math.max(0, Number(e.target.value)))}
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
                  statutory ₹1,50,000/year SSY limit.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Investment Duration (Yrs)
                </label>
                <input
                  type="number"
                  min="1"
                  max="21"
                  value={investmentDuration}
                  onChange={(e) =>
                    setInvestmentDuration(Math.max(1, Math.min(21, Number(e.target.value) || 15)))
                  }
                  className="glass-input text-xs font-semibold"
                />
              </div>
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Maturity (Years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={maturityYears}
                  onChange={(e) =>
                    setMaturityYears(Math.max(1, Math.min(30, Number(e.target.value) || 21)))
                  }
                  className="glass-input text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-text-secondary">Rate of Interest (%)</label>
                <div className="flex gap-1">
                  {[7.6, 8.2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setInterestRate(rate)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        interestRate === rate
                          ? 'bg-accent-500 text-white border-accent-500'
                          : 'bg-surface-hover text-text-secondary border-border'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
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
        </div>

        {/* Right Summary + Pie Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">Capital</span>
                <span className="font-bold text-text-primary">{formatINR(result.capital)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">Inv. Duration</span>
                <span className="font-bold text-text-primary">{result.totalYears} Yrs.</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">ROI (Compounds Annually)</span>
                <span className="font-bold text-text-primary">{interestRate}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">Contribute Till</span>
                <span className="font-bold text-text-primary">{result.contributeTill}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-accent-500" /> Will Mature on
                </span>
                <span className="font-bold text-text-primary">{result.matureYear}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">Interest</span>
                <span className="font-bold text-accent-500">{formatINR(result.interest)}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Maturity</span>
                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatINR(result.maturity)}
                  </p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold">
                    ({formatIndianShort(result.maturity)})
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

          <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-center gap-2 text-[11px] text-text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              SSY offers <strong>EEE (Exempt-Exempt-Exempt)</strong> tax status — 21-year maturity
              with deposits for the first 15 years (Sec 80C up to ₹1.5L/yr).
            </span>
          </div>
        </div>
      </div>

      {/* Year-by-Year Schedule */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowSchedule((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Year-by-Year SSY Growth Schedule
            </h3>
            <p className="text-xs text-text-secondary">
              Includes 15-year contribution phase and 6-year post-deposit compounding phase.
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
                  <th className="py-2 pr-3">Account Yr</th>
                  <th className="py-2 px-3">Calendar Year</th>
                  <th className="py-2 px-3 text-right">Deposited</th>
                  <th className="py-2 px-3 text-right">Interest Earned</th>
                  <th className="py-2 pl-3 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.calendarYear} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-text-primary">Yr {row.year}</td>
                    <td className="py-2 px-3 text-text-secondary">{row.calendarYear}</td>
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

      {/* SSY Rules & FAQs */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowInfo((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">SSY Rules &amp; FAQs</h3>
            <p className="text-xs text-text-secondary">
              Eligibility (girl child 0–10 yrs), ₹250 opening deposit, ₹1.5L/yr cap, and premature
              closure rules.
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
              <li>Account can be opened for a girl child aged 0–10 years (max 2 daughters).</li>
              <li>Minimum annual deposit: ₹250–₹500; Maximum: ₹1.5 lakh per financial year.</li>
            </ul>
            <ul className="list-disc pl-4 space-y-1">
              <li>21-year total tenure; contributions required only for the first 15 years.</li>
              <li>Up to 50% partial withdrawal permitted at age 18 for higher education.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
