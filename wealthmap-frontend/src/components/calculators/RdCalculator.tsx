import React, { useState, useMemo } from 'react';
import {
  Landmark,
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

type DepositFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
type DurationUnit = 'YEARS' | 'MONTHS';
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

export default function RdCalculator() {
  const [depositAmount, setDepositAmount] = useState<number>(10000);
  const [depositFrequency, setDepositFrequency] = useState<DepositFrequency>('MONTHLY');
  const [durationValue, setDurationValue] = useState<number>(5);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('YEARS');
  const [interestRate, setInterestRate] = useState<number>(7.25);
  const [compounding, setCompounding] = useState<CompoundingFrequency>('QUARTERLY');
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const result = useMemo(() => {
    const P = Math.max(0, Number(depositAmount) || 0);
    const dur = Math.max(1, Number(durationValue) || 1);
    const totalMonths = durationUnit === 'YEARS' ? dur * 12 : dur;
    const r = Math.max(0, Number(interestRate) || 0) / 100;
    const { n, label: compLabel } = COMPOUNDING_N[compounding];

    const stepMonths =
      depositFrequency === 'MONTHLY' ? 1 : depositFrequency === 'QUARTERLY' ? 3 : 12;

    let maturityAmount = 0;
    let totalInvested = 0;

    for (let m = 0; m < totalMonths; m += stepMonths) {
      const remainingYears = (totalMonths - m) / 12;
      maturityAmount += P * Math.pow(1 + r / n, n * remainingYears);
      totalInvested += P;
    }

    const totalInterest = Math.max(0, maturityAmount - totalInvested);

    return {
      instalment: P,
      totalInvested,
      totalInterest,
      maturityAmount,
      durationLabel: `${dur} ${durationUnit === 'YEARS' ? 'Yrs.' : 'Mos.'}`,
      compLabel,
    };
  }, [depositAmount, depositFrequency, durationValue, durationUnit, interestRate, compounding]);

  const pieData = useMemo(
    () => [
      { name: 'Principal', value: Math.round(result.totalInvested), color: '#94a3b8' },
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
              RD Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Deposit (Rs.)
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
                  value={depositFrequency}
                  onChange={(e) => setDepositFrequency(e.target.value as DepositFrequency)}
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
                Compounding
              </label>
              <select
                value={compounding}
                onChange={(e) => setCompounding(e.target.value as CompoundingFrequency)}
                className="glass-input text-xs font-medium"
              >
                <option value="QUARTERLY">Quarterly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="HALF_YEARLY">Half Yearly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Summary + Chart */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-2.5 text-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Summary
                </p>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-text-secondary">Instalment</span>
                  <span className="font-bold text-text-primary">
                    {formatINR(result.instalment)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-text-secondary">Invested</span>
                  <span className="font-bold text-text-primary">
                    {formatINR(result.totalInvested)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-text-secondary">Duration</span>
                  <span className="font-bold text-text-primary">{result.durationLabel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-text-secondary">ROI</span>
                  <span className="font-bold text-text-primary">
                    {interestRate}% ({result.compLabel})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
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
      </div>

      {/* RD Features & FAQs */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowInfo((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Recurring Deposit (RD) Features &amp; FAQs
            </h3>
            <p className="text-xs text-text-secondary">
              Quarterly compounding, TDS rules, senior citizen +0.5% rates, and premature closure.
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
            <div className="space-y-1.5">
              <h4 className="font-bold text-text-primary">Key Features</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>Fixed monthly savings with locked-in ROI for the entire tenure.</li>
                <li>Most Indian banks compound RD interest quarterly.</li>
                <li>Partial withdrawal is not allowed; premature closure may incur a penalty.</li>
              </ul>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-text-primary">Taxation &amp; Senior Citizens</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>RD interest is taxable and subject to TDS (Form 15G/15H if eligible).</li>
                <li>Senior citizens typically receive an additional ~0.5% interest rate.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
