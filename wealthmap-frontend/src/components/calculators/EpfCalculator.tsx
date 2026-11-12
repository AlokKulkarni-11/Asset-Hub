import React, { useState, useMemo } from 'react';
import {
  Landmark,
  ShieldCheck,
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

const EPF_HISTORY = [
  { fy: '2025–26 (Latest)', roi: '8.25%' },
  { fy: '2024–25', roi: '8.25%' },
  { fy: '2023–24', roi: '8.25%' },
  { fy: '2022–23', roi: '8.15%' },
  { fy: '2021–22', roi: '8.10%' },
  { fy: '2020–21', roi: '8.15%' },
];

export default function EpfCalculator() {
  const [basicSalary, setBasicSalary] = useState<number>(15000);
  const [selfPercent, setSelfPercent] = useState<number>(12);
  const [employerPercent, setEmployerPercent] = useState<number>(3.67);
  const [currentAge, setCurrentAge] = useState<number>(25);
  const [retirementAge, setRetirementAge] = useState<number>(58);
  const [epfRate, setEpfRate] = useState<number>(8.25);
  const [latestBalance, setLatestBalance] = useState<number>(0);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const result = useMemo(() => {
    const salary = Math.max(0, Number(basicSalary) || 0);
    const selfPct = Math.max(0, Number(selfPercent) || 0) / 100;
    const empPct = Math.max(0, Number(employerPercent) || 0) / 100;
    const ageNow = Math.max(18, Math.min(70, Number(currentAge) || 25));
    const ageRet = Math.max(ageNow + 1, Math.min(75, Number(retirementAge) || 58));
    const serviceYears = ageRet - ageNow;
    const r = Math.max(0, Number(epfRate) || 0) / 100;
    const startBal = Math.max(0, Number(latestBalance) || 0);

    const monthlySelf = salary * selfPct;
    const monthlyEmployer = salary * empPct;
    const monthlyTotal = monthlySelf + monthlyEmployer;

    const totalSelf = monthlySelf * 12 * serviceYears;
    const totalEmployer = monthlyEmployer * 12 * serviceYears;

    // EPFO calculates interest on monthly running balance and credits it annually
    let balance = startBal;
    for (let y = 1; y <= serviceYears; y++) {
      const yearlyDeposit = monthlyTotal * 12;
      const interest = balance * r + monthlyTotal * 78 * (r / 12);
      balance = balance + yearlyDeposit + interest;
    }

    const totalFund = Math.round(balance);
    const totalInterest = Math.max(0, totalFund - Math.round(startBal + totalSelf + totalEmployer));

    return {
      serviceYears,
      totalSelf: Math.round(totalSelf),
      totalEmployer: Math.round(totalEmployer),
      totalInterest,
      totalFund,
    };
  }, [basicSalary, selfPercent, employerPercent, currentAge, retirementAge, epfRate, latestBalance]);

  const pieData = useMemo(
    () => [
      { name: 'Your Contribution', value: result.totalSelf, color: '#6366f1' },
      { name: "Employer's Contribution", value: result.totalEmployer, color: '#10b981' },
      { name: 'Interest', value: result.totalInterest, color: '#f59e0b' },
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
              EPF / PF Calculator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Basic Monthly Salary (Basic + DA) (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={basicSalary}
                onChange={(e) => setBasicSalary(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Your Contribution (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={selfPercent}
                  onChange={(e) => setSelfPercent(Math.max(0, Number(e.target.value)))}
                  className="glass-input text-xs font-semibold"
                />
              </div>
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Employer&apos;s Contribution (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={employerPercent}
                  onChange={(e) => setEmployerPercent(Math.max(0, Number(e.target.value)))}
                  className="glass-input text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-text-secondary">
                  Your Current Age: {currentAge}
                </label>
              </div>
              <input
                type="range"
                min="18"
                max="65"
                value={currentAge}
                onChange={(e) => {
                  const age = Number(e.target.value);
                  setCurrentAge(age);
                  if (retirementAge <= age) setRetirementAge(age + 1);
                }}
                className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-text-secondary">
                  Your Retirement Age: {retirementAge}
                </label>
              </div>
              <input
                type="range"
                min={currentAge + 1}
                max="70"
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-text-secondary">
                  EPF Rate of Interest (%)
                </label>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Latest EPFO: 8.25%
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="15"
                step="0.05"
                value={epfRate}
                onChange={(e) => setEpfRate(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Latest EPF Balance (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={latestBalance}
                onChange={(e) => setLatestBalance(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Right Summary + Pie Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
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

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">Self Contribution</span>
              <span className="font-bold text-text-primary">{formatINR(result.totalSelf)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">Emp&apos;s Contribution</span>
              <span className="font-bold text-text-primary">
                {formatINR(result.totalEmployer)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">Interest</span>
              <span className="font-bold text-accent-500">{formatINR(result.totalInterest)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">Service Period</span>
              <span className="font-bold text-text-primary">{result.serviceYears} Yrs.</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">EPF ROI</span>
              <span className="font-bold text-text-primary">{epfRate}%</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">EPF Fund*</span>
              <div className="text-right">
                <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                  {formatINR(result.totalFund)}
                </p>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold">
                  ({formatIndianShort(result.totalFund)})
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-center gap-2 text-[11px] text-text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Official EPFO rate is <strong>8.25%</strong> for FY 2025–26 (FY 2026–27 rate is
              notified by EPFO at fiscal year-end).
            </span>
          </div>
        </div>
      </div>

      {/* Historical Rates & EPF Guide */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowInfo((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Historical EPF Rates &amp; Scheme Benefits
            </h3>
            <p className="text-xs text-text-secondary">
              EPFO interest rate history, EEE tax exemption, EDLI insurance, and EPS pension rules.
            </p>
          </div>
          {showInfo ? (
            <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
          )}
        </button>

        {showInfo && (
          <div className="mt-5 pt-5 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-text-secondary">
            <div>
              <h4 className="font-bold text-text-primary mb-2">Recent EPF Interest Rates</h4>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                    <th className="py-1.5">Financial Year</th>
                    <th className="py-1.5 text-right">EPFO ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {EPF_HISTORY.map((row) => (
                    <tr key={row.fy} className="border-b border-border/40 last:border-0">
                      <td className="py-1.5 font-medium text-text-primary">{row.fy}</td>
                      <td className="py-1.5 text-right font-bold text-accent-500">{row.roi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 leading-relaxed">
              <h4 className="font-bold text-text-primary">Key Benefits</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>12% employee contribution + 3.67% to EPF (remaining 8.33% goes to EPS).</li>
                <li>Tax-free maturity after 5 years of continuous service (EEE).</li>
                <li>EDLI life insurance cover and EPS monthly pension after 10+ years of service.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
