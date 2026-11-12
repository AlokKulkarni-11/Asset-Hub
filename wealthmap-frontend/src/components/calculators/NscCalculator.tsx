import React, { useState, useMemo } from 'react';
import {
  Landmark,
  ShieldCheck,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
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

export default function NscCalculator() {
  const currentYear = new Date().getFullYear();

  const [principal, setPrincipal] = useState<number>(100000);
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [interestRate, setInterestRate] = useState<number>(7.7);
  const [showTable, setShowTable] = useState<boolean>(true);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const result = useMemo(() => {
    const P = Math.max(0, Number(principal) || 0);
    const years = Math.max(1, Math.min(20, Math.round(Number(tenureYears) || 5)));
    const r = Math.max(0, Number(interestRate) || 0) / 100;

    let balance = P;
    const rows: {
      year: number;
      principal: number;
      opening: number;
      interest: number;
      balance: number;
    }[] = [];

    for (let y = 1; y <= years; y++) {
      const opening = balance;
      const interest = opening * r;
      balance = opening + interest;
      rows.push({
        year: currentYear + y,
        principal: P,
        opening,
        interest,
        balance,
      });
    }

    const totalInterest = Math.max(0, balance - P);

    return {
      principal: P,
      years,
      maturityYear: currentYear + years,
      totalInterest,
      maturityAmount: balance,
      rows,
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
              NSC Calculator
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
                step="5000"
                value={principal}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Investment Tenure (Years)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={tenureYears}
                onChange={(e) =>
                  setTenureYears(Math.max(1, Math.min(20, Number(e.target.value) || 5)))
                }
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-text-secondary">Rate of Interest (%)</label>
                <div className="flex gap-1">
                  {[6.8, 7.7].map((rate) => (
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

          <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-center gap-2 text-[11px] text-text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              NSC has a 5-year lock-in, compounds annually, and qualifies for Sec 80C deduction up
              to ₹1.5L/yr.
            </span>
          </div>
        </div>

        {/* Right Expected Returns + Pie Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2.5 text-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Expected Returns
              </p>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">Invested</span>
                <span className="font-bold text-text-primary">{formatINR(result.principal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">Duration</span>
                <span className="font-bold text-text-primary">{result.years} Yrs.</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary">ROI</span>
                <span className="font-bold text-text-primary">{interestRate}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-secondary flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-accent-500" /> Maturity Year
                </span>
                <span className="font-bold text-text-primary">{result.maturityYear}</span>
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

      {/* Growth Chart */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-500" />
          <h3 className="text-base font-bold text-text-primary">NSC Growth Chart</h3>
        </div>
        <div className="h-64 w-full">
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

      {/* Growth Table */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowTable((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">Growth Table</h3>
            <p className="text-xs text-text-secondary">
              Annual compounding schedule for National Savings Certificate.
            </p>
          </div>
          {showTable ? (
            <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
          )}
        </button>

        {showTable && (
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

      {/* NSC Rules */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowInfo((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">NSC Rules &amp; Tax Benefits</h3>
            <p className="text-xs text-text-secondary">
              Min ₹1,000 investment, no upper limit, 80C deduction on first 4 years&apos; reinvested
              interest.
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
              <li>Minimum investment: ₹1,000 (in multiples of ₹100); no maximum upper limit.</li>
              <li>5-year lock-in; eligible as loan collateral up to 80–85% of face value.</li>
            </ul>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Interest for years 1–4 is deemed reinvested and eligible under Sec 80C (within ₹1.5L
                limit).
              </li>
              <li>5th-year interest is taxable at your slab rate upon maturity.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
