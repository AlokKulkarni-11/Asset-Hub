import React, { useState, useMemo } from 'react';
import {
  Home,
  Zap,
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

export default function MortgageCalculator() {
  const [homePrice, setHomePrice] = useState<number>(5000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [loanTermYears, setLoanTermYears] = useState<number>(20);

  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [annualPropertyTax, setAnnualPropertyTax] = useState<number>(12000);
  const [annualInsurance, setAnnualInsurance] = useState<number>(6000);
  const [monthlyHoa, setMonthlyHoa] = useState<number>(2500);
  const [pmiRate, setPmiRate] = useState<number>(0);

  const result = useMemo(() => {
    const price = Math.max(0, Number(homePrice) || 0);
    const dpPct = Math.max(0, Math.min(95, Number(downPaymentPercent) || 0));
    const downPaymentAmount = price * (dpPct / 100);
    const loanAmount = Math.max(0, price - downPaymentAmount);

    const r = Math.max(0, Number(interestRate) || 0) / 12 / 100;
    const n = Math.max(1, Math.round(Number(loanTermYears) || 1) * 12);

    let principalAndInterest = 0;
    if (loanAmount > 0) {
      if (r === 0) {
        principalAndInterest = loanAmount / n;
      } else {
        const factor = Math.pow(1 + r, n);
        principalAndInterest = (loanAmount * r * factor) / (factor - 1);
      }
    }

    const monthlyTax = showAdvanced ? Math.max(0, Number(annualPropertyTax) || 0) / 12 : 0;
    const monthlyInsurance = showAdvanced ? Math.max(0, Number(annualInsurance) || 0) / 12 : 0;
    const monthlyHoaVal = showAdvanced ? Math.max(0, Number(monthlyHoa) || 0) : 0;
    const monthlyPmi =
      showAdvanced && dpPct < 20
        ? (loanAmount * (Math.max(0, Number(pmiRate) || 0) / 100)) / 12
        : showAdvanced
        ? (loanAmount * (Math.max(0, Number(pmiRate) || 0) / 100)) / 12
        : 0;

    const totalMonthlyPayment =
      principalAndInterest + monthlyTax + monthlyInsurance + monthlyHoaVal + monthlyPmi;

    return {
      downPaymentAmount,
      loanAmount,
      principalAndInterest,
      monthlyTax,
      monthlyInsurance,
      monthlyHoaVal,
      monthlyPmi,
      totalMonthlyPayment,
    };
  }, [
    homePrice,
    downPaymentPercent,
    interestRate,
    loanTermYears,
    showAdvanced,
    annualPropertyTax,
    annualInsurance,
    monthlyHoa,
    pmiRate,
  ]);

  const pieData = useMemo(
    () =>
      [
        {
          name: 'Principal & Interest',
          value: Math.round(result.principalAndInterest),
          color: '#6366f1',
        },
        { name: 'Property Taxes', value: Math.round(result.monthlyTax), color: '#f59e0b' },
        {
          name: 'Home Insurance',
          value: Math.round(result.monthlyInsurance),
          color: '#10b981',
        },
        { name: 'Society / HOA', value: Math.round(result.monthlyHoaVal), color: '#06b6d4' },
        { name: 'PMI', value: Math.round(result.monthlyPmi), color: '#ec4899' },
      ].filter((d) => d.value > 0),
    [result]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Home className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              Mortgage Calculator (INR)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Home Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100000"
                value={homePrice}
                onChange={(e) => setHomePrice(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Down Payment (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="95"
                  step="1"
                  value={downPaymentPercent}
                  onChange={(e) =>
                    setDownPaymentPercent(Math.max(0, Math.min(95, Number(e.target.value))))
                  }
                  className="glass-input text-xs font-semibold"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Upfront: {formatINR(result.downPaymentAmount, 0)}
                </p>
              </div>
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                  className="glass-input text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Loan Term (Years)
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={loanTermYears}
                onChange={(e) =>
                  setLoanTermYears(Math.max(1, Math.min(40, Number(e.target.value) || 1)))
                }
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
                Advanced Options (Taxes, Insurance &amp; Maintenance)
              </label>

              {showAdvanced && (
                <div className="p-3.5 rounded-xl bg-surface-hover border border-border space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-text-secondary block mb-1">
                        Annual Property Tax (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={annualPropertyTax}
                        onChange={(e) =>
                          setAnnualPropertyTax(Math.max(0, Number(e.target.value)))
                        }
                        className="glass-input text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-text-secondary block mb-1">
                        Annual Insurance (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={annualInsurance}
                        onChange={(e) => setAnnualInsurance(Math.max(0, Number(e.target.value)))}
                        className="glass-input text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-text-secondary block mb-1">
                        Monthly Society / HOA (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={monthlyHoa}
                        onChange={(e) => setMonthlyHoa(Math.max(0, Number(e.target.value)))}
                        className="glass-input text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-text-secondary block mb-1">
                        PMI Insurance Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={pmiRate}
                        onChange={(e) => setPmiRate(Math.max(0, Number(e.target.value)))}
                        className="glass-input text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Monthly Payment Breakdown + Pie Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-6">
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">
                Loan Amount ({100 - downPaymentPercent}% Financed)
              </span>
              <span className="font-bold text-text-primary">
                {formatINR(result.loanAmount, 0)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">Monthly Principal &amp; Interest</span>
              <span className="font-bold text-text-primary">
                {formatINR(result.principalAndInterest)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">Property Taxes</span>
              <span className="font-bold text-text-primary">{formatINR(result.monthlyTax)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">Homeowners Insurance</span>
              <span className="font-bold text-text-primary">
                {formatINR(result.monthlyInsurance)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">Monthly Society / HOA Dues</span>
              <span className="font-bold text-text-primary">
                {formatINR(result.monthlyHoaVal)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">PMI</span>
              <span className="font-bold text-text-primary">{formatINR(result.monthlyPmi)}</span>
            </div>

            <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-between">
              <span className="font-bold text-accent-500 flex items-center gap-1.5 text-sm">
                <Zap className="w-4 h-4" /> Monthly Payment*
              </span>
              <span className="text-2xl font-extrabold text-accent-500">
                {formatINR(result.totalMonthlyPayment)}
              </span>
            </div>
          </div>

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
                <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0), 'Monthly']} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
