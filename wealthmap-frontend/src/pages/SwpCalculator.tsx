// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmergencyFund } from '../api/planning.api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { 
  Calculator, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertTriangle,
  Loader2,
  Calendar,
  AlertCircle,
  Info,
  TrendingUp
} from 'lucide-react';

interface SwpRow {
  period: number; // Calendar year or Month number
  openingBalance: number;
  growth: number;
  withdrawal: number;
  inflationComponent: number;
  closingBalance: number;
  cumulativeWithdrawal: number;
  cumulativeGrowth: number;
  cumulativeTax: number;
  gainComponent: number;
}

const formatToIndianWords = (numStr: string) => {
  const num = Number(numStr);
  if (!num || isNaN(num)) return '';
  if (num >= 10000000) {
    const cr = num / 10000000;
    return `${cr.toFixed(2).replace(/\.00$/, '')} Crore`;
  }
  if (num >= 100000) {
    const lakh = num / 100000;
    return `${lakh.toFixed(2).replace(/\.00$/, '')} Lakh`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    return `${k.toFixed(2).replace(/\.00$/, '')} Thousand`;
  }
  return num.toString();
};

export default function SwpCalculator() {
  const currentYear = new Date().getFullYear();

  // Query to get user's liquid assets
  const { data: emergencyFund, isLoading: efLoading } = useQuery({
    queryKey: ['emergencyFund'],
    queryFn: getEmergencyFund
  });

  const liquidNetWorth = emergencyFund?.currentLiquidAssets || 0;

  // Form states (Local input values loaded from sessionStorage or defaults)
  const [initialInvestmentInput, setInitialInvestmentInput] = useState(() => 
    sessionStorage.getItem('swp_initialInvestment') || '10000000'
  );
  const [deferValueInput, setDeferValueInput] = useState(() => 
    sessionStorage.getItem('swp_deferValue') || '20'
  );
  const [deferUnitInput, setDeferUnitInput] = useState<'years' | 'months'>(() => 
    (sessionStorage.getItem('swp_deferUnit') as any) || 'years'
  );
  const [monthlyWithdrawalInput, setMonthlyWithdrawalInput] = useState(() => 
    sessionStorage.getItem('swp_monthlyWithdrawal') || '24991'
  );
  const [durationValueInput, setDurationValueInput] = useState(() => 
    sessionStorage.getItem('swp_durationValue') || '20'
  );
  const [durationUnitInput, setDurationUnitInput] = useState<'years' | 'months'>(() => 
    (sessionStorage.getItem('swp_durationUnit') as any) || 'years'
  );
  const [expectedReturnRateInput, setExpectedReturnRateInput] = useState(() => 
    sessionStorage.getItem('swp_expectedReturn') || '10'
  );
  const [returnCompoundingInput, setReturnCompoundingInput] = useState<'yearly' | 'monthly'>(() => 
    (sessionStorage.getItem('swp_returnCompounding') as any) || 'yearly'
  );
  const [applyTaxInput, setApplyTaxInput] = useState(() => 
    sessionStorage.getItem('swp_applyTax') === 'true'
  );
  const [taxRateInput, setTaxRateInput] = useState(() => 
    sessionStorage.getItem('swp_taxRate') || '6'
  );
  const [inflationRateInput, setInflationRateInput] = useState(() => 
    sessionStorage.getItem('swp_inflationRate') || '0'
  );
  const [linkToLiquid, setLinkToLiquid] = useState(() => 
    sessionStorage.getItem('swp_linkToLiquid') === 'true'
  );

  // Persist form states to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem('swp_initialInvestment', initialInvestmentInput);
    sessionStorage.setItem('swp_deferValue', deferValueInput);
    sessionStorage.setItem('swp_deferUnit', deferUnitInput);
    sessionStorage.setItem('swp_monthlyWithdrawal', monthlyWithdrawalInput);
    sessionStorage.setItem('swp_durationValue', durationValueInput);
    sessionStorage.setItem('swp_durationUnit', durationUnitInput);
    sessionStorage.setItem('swp_expectedReturn', expectedReturnRateInput);
    sessionStorage.setItem('swp_returnCompounding', returnCompoundingInput);
    sessionStorage.setItem('swp_applyTax', applyTaxInput.toString());
    sessionStorage.setItem('swp_taxRate', taxRateInput);
    sessionStorage.setItem('swp_inflationRate', inflationRateInput);
    sessionStorage.setItem('swp_linkToLiquid', linkToLiquid.toString());
  }, [
    initialInvestmentInput, deferValueInput, deferUnitInput, 
    monthlyWithdrawalInput, durationValueInput, durationUnitInput, 
    expectedReturnRateInput, returnCompoundingInput, applyTaxInput, 
    taxRateInput, inflationRateInput, linkToLiquid
  ]);

  // Removed activeParams state to enable direct reactive calculations

  const [calculating, setCalculating] = useState(false);

  // Sync initial input with liquid net worth when link is active
  useEffect(() => {
    if (linkToLiquid && liquidNetWorth > 0) {
      setInitialInvestmentInput(Math.round(liquidNetWorth).toString());
    }
  }, [liquidNetWorth, linkToLiquid]);

  const handleLinkToLiquidToggle = (checked: boolean) => {
    setLinkToLiquid(checked);
    if (checked && liquidNetWorth > 0) {
      setInitialInvestmentInput(Math.round(liquidNetWorth).toString());
    }
  };

  // Handle Calculate Now trigger (runs visual loader since calculations update in real-time)
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    
    // Simulate premium micro-calculation latency for UI feedback
    setTimeout(() => {
      setCalculating(false);
    }, 300);
  };

  // Table view states
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('yearly');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Reset page on view mode change
  useEffect(() => {
    setPage(1);
  }, [viewMode]);

  // SWP Math Engine (Gains tracked separate from closing balance deductions)
  const swpData = useMemo(() => {
    const P = linkToLiquid ? Math.round(liquidNetWorth) : (Number(initialInvestmentInput) || 0);
    const W = Number(monthlyWithdrawalInput) || 0;
    const R = Number(expectedReturnRateInput) || 0;
    const taxRate = applyTaxInput ? (Number(taxRateInput) || 0) : 0;
    const I = Number(inflationRateInput) || 0;

    const deferMonths = deferUnitInput === 'years' ? (Number(deferValueInput) || 0) * 12 : (Number(deferValueInput) || 0);
    const withdrawalMonths = durationUnitInput === 'years' ? (Number(durationValueInput) || 0) * 12 : (Number(durationValueInput) || 0);
    const totalMonths = deferMonths + withdrawalMonths;

    if (P <= 0 || totalMonths <= 0) {
      return {
        monthlyRows: [],
        yearlyRows: [],
        totalWithdrawal: 0,
        totalGrowth: 0,
        totalTax: 0,
        endingBalance: 0,
        investmentAtStartOfWithdrawals: 0,
        depletedMonth: null
      };
    }

    const monthlyRate = returnCompoundingInput === 'monthly' 
      ? (R / 100) 
      : (Math.pow(1 + R / 100, 1 / 12) - 1);

    let balance = P;
    let gainComponent = 0; // Gains tracked for capital gains projections

    let currentWithdrawal = W;
    let cumulativeWithdrawal = 0;
    let cumulativeGrowth = 0;
    let cumulativeTax = 0;
    let depletedMonth: number | null = null;
    let investmentAtStartOfWithdrawals = P;

    const monthlyRows: SwpRow[] = [];

    for (let month = 1; month <= totalMonths; month++) {
      const openingBalance = balance;
      const growth = balance * monthlyRate;
      const balanceBeforeWithdrawal = balance + growth;
      const gainBeforeWithdrawal = gainComponent + growth;

      const isDeferred = month <= deferMonths;
      let withdrawal = 0;
      let taxPaid = 0;
      let withdrawnGain = 0;
      let inflationComponent = 0;

      if (month === deferMonths) {
        investmentAtStartOfWithdrawals = balanceBeforeWithdrawal;
      }

      if (!isDeferred) {
        const activeMonth = month - deferMonths;
        withdrawal = Math.min(currentWithdrawal, balanceBeforeWithdrawal);

        // Calculate capital gains proportion (pro-rata approach on total balance)
        const gainRatio = balanceBeforeWithdrawal > 0 ? (gainBeforeWithdrawal / balanceBeforeWithdrawal) : 0;
        withdrawnGain = withdrawal * gainRatio;

        if (activeParams.applyTax && taxRate > 0) {
          taxPaid = withdrawnGain * (taxRate / 100);
        }

        cumulativeWithdrawal += withdrawal;
        cumulativeTax += taxPaid;

        // Track inflation component of withdrawal
        if (I > 0) {
          const yearsCompleted = Math.floor((activeMonth - 1) / 12);
          const baseWithdrawalThisMonth = W;
          inflationComponent = Math.max(0, currentWithdrawal - baseWithdrawalThisMonth);
          // Cap inflation component to actual withdrawal if depleted
          if (withdrawal < currentWithdrawal) {
            inflationComponent = Math.max(0, withdrawal - (baseWithdrawalThisMonth * Math.min(1, withdrawal / currentWithdrawal)));
          }
        }

        // Apply inflation adjustment at the end of each completed year of withdrawals
        if (I > 0 && activeMonth % 12 === 0) {
          currentWithdrawal = currentWithdrawal * (1 + I / 100);
        }
      }

      cumulativeGrowth += growth;
      
      // Note: Tax is NOT deducted from closing balance (as per tax footnotes/mockup)
      const closingBalance = Math.max(0, balanceBeforeWithdrawal - withdrawal);

      if (!isDeferred) {
        gainComponent = Math.max(0, gainBeforeWithdrawal - withdrawnGain);
      } else {
        gainComponent = gainBeforeWithdrawal;
      }

      monthlyRows.push({
        period: month,
        openingBalance,
        growth,
        withdrawal,
        inflationComponent,
        closingBalance,
        cumulativeWithdrawal,
        cumulativeGrowth,
        cumulativeTax,
        gainComponent
      });

      balance = closingBalance;

      if (balance <= 0.01 && !isDeferred) {
        depletedMonth = month;
        break;
      }
    }

    // Aggregate into yearly rows matching the yearly mockup
    const yearlyRows: SwpRow[] = [];
    for (let i = 0; i < monthlyRows.length; i += 12) {
      const chunk = monthlyRows.slice(i, i + 12);
      if (chunk.length === 0) break;
      const yearNum = Math.floor(i / 12) + 1;
      const openingBalance = chunk[0].openingBalance;
      const closingBalance = chunk[chunk.length - 1].closingBalance;
      const growth = chunk.reduce((sum, r) => sum + r.growth, 0);
      const withdrawal = chunk.reduce((sum, r) => sum + r.withdrawal, 0);
      const inflationComponent = chunk.reduce((sum, r) => sum + r.inflationComponent, 0);
      
      // Cumulative indicators from the end of the year chunk
      const yearCumulativeWithdrawal = chunk[chunk.length - 1].cumulativeWithdrawal;
      const yearCumulativeGrowth = chunk[chunk.length - 1].cumulativeGrowth;
      const yearCumulativeTax = chunk[chunk.length - 1].cumulativeTax;
      const yearGainComponent = chunk[chunk.length - 1].gainComponent;

      yearlyRows.push({
        period: currentYear + yearNum,
        openingBalance,
        growth,
        withdrawal,
        inflationComponent,
        closingBalance,
        cumulativeWithdrawal: yearCumulativeWithdrawal,
        cumulativeGrowth: yearCumulativeGrowth,
        cumulativeTax: yearCumulativeTax,
        gainComponent: yearGainComponent
      });
    }

    // Taxes on final redemption
    const finalBalance = balance;
    const finalGainRatio = finalBalance > 0 ? (gainComponent / finalBalance) : 0;
    const taxOnFinalRedemption = applyTaxInput ? (finalBalance * finalGainRatio * (taxRate / 100)) : 0;

    return {
      monthlyRows,
      yearlyRows,
      totalWithdrawal: cumulativeWithdrawal,
      totalGrowth: cumulativeGrowth,
      totalTax: cumulativeTax,
      taxOnFinalRedemption,
      endingBalance: Math.max(0, balance),
      investmentAtStartOfWithdrawals,
      depletedMonth
    };
  }, [
    initialInvestmentInput, deferValueInput, deferUnitInput, 
    monthlyWithdrawalInput, durationValueInput, durationUnitInput, 
    expectedReturnRateInput, returnCompoundingInput, applyTaxInput, 
    taxRateInput, inflationRateInput, linkToLiquid, liquidNetWorth, currentYear
  ]);

  // Pagination helper
  const currentTableRows = useMemo(() => {
    const rows = viewMode === 'monthly' ? swpData.monthlyRows : swpData.yearlyRows;
    const startIndex = (page - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [swpData, viewMode, page]);

  const maxPages = useMemo(() => {
    const rows = viewMode === 'monthly' ? swpData.monthlyRows : swpData.yearlyRows;
    return Math.ceil(rows.length / pageSize) || 1;
  }, [swpData, viewMode]);

  // Indian number formatting with support for parenthesized deductions
  const formatIndianCurrency = (value: number, isDeduction: boolean = false) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);

    if (isDeduction) {
      return `(${formatted})`;
    }
    return formatted;
  };

  // Recharts chart data formatted dynamically YOY
  const chartData = useMemo(() => {
    const durationVal = Number(durationValueInput) || 0;
    const isShort = durationUnitInput === 'years' ? durationVal <= 3 : durationVal <= 36;
    const rawRows = isShort ? swpData.monthlyRows : swpData.yearlyRows;
    return rawRows.map(row => ({
      name: isShort ? `Mo ${row.period}` : `${row.period}`,
      'Withdrawal YOY': Math.round(row.withdrawal),
      'Growth YOY': Math.round(row.growth),
      'Fund Value': Math.round(row.closingBalance)
    }));
  }, [swpData, durationValueInput, durationUnitInput]);

  // Calculated display values
  const deferYears = deferUnitInput === 'years' ? (Number(deferValueInput) || 0) : Math.ceil((Number(deferValueInput) || 0) / 12);
  const withdrawalYears = durationUnitInput === 'years' ? (Number(durationValueInput) || 0) : Math.ceil((Number(durationValueInput) || 0) / 12);
  const totalDurationYears = deferYears + withdrawalYears;
  const startWithdrawalYear = currentYear + deferYears;
  const planEndYear = currentYear + totalDurationYears;

  const corpusLastsString = swpData.depletedMonth 
    ? `${Math.floor((swpData.depletedMonth - (deferUnitInput === 'years' ? (Number(deferValueInput) || 0) * 12 : (Number(deferValueInput) || 0))) / 12)} Years (${currentYear + Math.ceil(swpData.depletedMonth / 12)})`
    : `${durationValueInput} ${durationUnitInput === 'years' ? 'Years' : 'Months'} (${planEndYear})`;

  const expectedProfit = (swpData.endingBalance + swpData.totalWithdrawal) - swpData.investmentAtStartOfWithdrawals;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-heading text-2xl font-dmsans flex items-center gap-2">
          <Calculator className="w-6 h-6 text-accent-500" />
          SWP Calculator
        </h1>
        <p className="text-text-secondary text-sm">
          Simulate compound growth, regular withdrawals, capital gains taxes, and annual inflation adjustments.
        </p>
      </div>

      {/* Main Parameters & Output Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INPUT FORM (Left Column) */}
        <form onSubmit={handleCalculate} className="glass-card p-6 space-y-4 h-fit">
          <h2 className="text-lg font-bold text-text-primary border-b border-border pb-2 flex items-center gap-1.5">
            Calculation Inputs
          </h2>

          <div className="space-y-4 text-xs">
            {/* Initial Investment */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                Initial Investment Amount (Rs.)
              </label>
              <input
                type="number"
                required
                readOnly={linkToLiquid}
                value={initialInvestmentInput}
                onChange={(e) => {
                  if (!linkToLiquid) {
                    setInitialInvestmentInput(e.target.value);
                  }
                }}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className={`glass-input font-medium ${linkToLiquid ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
                placeholder="e.g. 10000000"
              />
              {(!linkToLiquid ? initialInvestmentInput : liquidNetWorth > 0) && (
                <p className="text-[10px] text-accent-500 font-semibold mt-1">
                  In Words: {formatToIndianWords(linkToLiquid ? Math.round(liquidNetWorth).toString() : initialInvestmentInput)}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="linkToLiquidCheckbox"
                  checked={linkToLiquid}
                  onChange={(e) => handleLinkToLiquidToggle(e.target.checked)}
                  className="rounded border-border text-accent-500 focus:ring-accent-500 cursor-pointer"
                />
                <label htmlFor="linkToLiquidCheckbox" className="text-[11px] font-medium text-text-secondary cursor-pointer select-none">
                  Link to Liquid Net Worth {liquidNetWorth > 0 ? `(₹${Math.round(liquidNetWorth).toLocaleString('en-IN')})` : ''}
                </label>
              </div>
            </div>

            {/* Hold Investment / Defer withdrawal For */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                Hold Investment/ Defer withdrawal For
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min="0"
                  value={deferValueInput}
                  onChange={(e) => setDeferValueInput(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="glass-input font-medium flex-1"
                />
                <select
                  value={deferUnitInput}
                  onChange={(e: any) => setDeferUnitInput(e.target.value)}
                  className="glass-input font-semibold w-28 bg-surface border border-border"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>

            {/* Monthly SWP Amount */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                SWP/ Monthly Withdrawal Amount (Rs.)
              </label>
              <input
                type="number"
                required
                value={monthlyWithdrawalInput}
                onChange={(e) => setMonthlyWithdrawalInput(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="glass-input font-medium"
                placeholder="e.g. 24991"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                Duration
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min="1"
                  value={durationValueInput}
                  onChange={(e) => setDurationValueInput(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="glass-input font-medium flex-1"
                />
                <select
                  value={durationUnitInput}
                  onChange={(e: any) => setDurationUnitInput(e.target.value)}
                  className="glass-input font-semibold w-28 bg-surface border border-border"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>

            {/* Expected Rate of Return */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                Expected Rate of Return (%)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={expectedReturnRateInput}
                  onChange={(e) => setExpectedReturnRateInput(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="glass-input font-medium flex-1"
                />
                <select
                  value={returnCompoundingInput}
                  onChange={(e: any) => setReturnCompoundingInput(e.target.value)}
                  className="glass-input font-semibold w-28 bg-surface border border-border"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Rate of Tax checkbox toggle */}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="taxCheckbox"
                  checked={applyTaxInput}
                  onChange={(e) => setApplyTaxInput(e.target.checked)}
                  className="rounded border-border text-accent-500 focus:ring-accent-500 cursor-pointer"
                />
                <label htmlFor="taxCheckbox" className="font-semibold text-text-secondary cursor-pointer select-none">
                  Enable Capital Gains Tax
                </label>
              </div>

              {applyTaxInput && (
                <div className="animate-fadeIn">
                  <label className="block font-medium text-text-secondary mb-1">
                    Rate of Tax (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="90"
                    required={applyTaxInput}
                    value={taxRateInput}
                    onChange={(e) => setTaxRateInput(e.target.value)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="glass-input font-medium"
                    placeholder="e.g. 6"
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    Capital gains tax estimations will be projected separately without deducting from the fund balance.
                  </p>
                </div>
              )}
            </div>

            {/* Rate of Inflation */}
            <div className="border-t border-border pt-3">
              <label className="block font-semibold text-text-secondary mb-1">
                Rate of Inflation (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                required
                value={inflationRateInput}
                onChange={(e) => setInflationRateInput(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="glass-input font-medium"
                placeholder="e.g. 0"
              />
              <p className="text-[10px] text-text-muted mt-1 italic">
                Withdrawal payouts step up annually by this percentage. Keep 0 for flat payouts.
              </p>
            </div>

            {/* Calculate Button */}
            <button 
              type="submit" 
              disabled={calculating}
              className="btn-primary w-full text-sm font-bold flex items-center justify-center gap-2 mt-4 transition-all text-white shadow-md active:translate-y-0"
            >
              {calculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate Now'
              )}
            </button>
          </div>
        </form>

        {/* RESULTS SUMMARY PANELS (Right Column stacked) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <div className="glass-card border-t-4 border-accent-500 p-6 relative">
            <span className="absolute -top-3 left-6 px-3 py-0.5 bg-accent-500 text-white text-[11px] font-bold rounded-full">
              Summary
            </span>
            
            <div className="mt-2 divide-y divide-border text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Initial Principal</span>
                <span className="font-semibold text-text-primary">
                  {formatIndianCurrency(linkToLiquid ? Math.round(liquidNetWorth) : (Number(initialInvestmentInput) || 0))}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Investment (Post-Deferment)</span>
                <span className="font-semibold text-text-primary">{formatIndianCurrency(swpData.investmentAtStartOfWithdrawals)}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">SWP</span>
                <span className="font-semibold text-text-primary">{formatIndianCurrency(Number(monthlyWithdrawalInput) || 0)}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Duration</span>
                <span className="font-semibold text-text-primary">{durationValueInput} {durationUnitInput === 'years' ? 'Yrs.' : 'Months'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Rate of Return</span>
                <span className="font-semibold text-text-primary">{expectedReturnRateInput}% ({returnCompoundingInput})</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-border">
                <span className="text-text-primary font-bold">Total Withdrawal</span>
                <span className="font-bold text-text-primary">{formatIndianCurrency(swpData.totalWithdrawal)}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Profit</span>
                <span className="font-semibold text-text-primary">{formatIndianCurrency(expectedProfit)}</span>
              </div>
              <div className="flex justify-between py-2.5 items-center">
                <span className="text-text-secondary font-medium">Corpus Should Last For</span>
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  {swpData.depletedMonth ? (
                    <span className="text-red-500">✘ {corpusLastsString}</span>
                  ) : (
                    <span className="text-emerald-600">✔ {corpusLastsString}</span>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between py-3 items-center bg-emerald-500/5 px-3 rounded-xl border border-emerald-200 mt-2">
                <span className="text-sm font-bold text-emerald-800">Cl. Balance</span>
                <span className="text-base font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {formatIndianCurrency(swpData.endingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Taxes on Capital Gains Card */}
          {applyTaxInput && (
            <div className="glass-card border-t-4 border-accent-500 p-6 relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 bg-accent-500 text-white text-[11px] font-bold rounded-full">
                Taxes on Capital Gains
              </span>
              
              <div className="mt-2 divide-y divide-border text-xs space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-text-secondary font-medium">Taxes During SWP</span>
                  <span className="font-semibold text-text-primary">{formatIndianCurrency(swpData.totalTax)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-text-secondary font-medium">Tax on Final Redemption</span>
                  <span className="font-semibold text-text-primary">{formatIndianCurrency(swpData.taxOnFinalRedemption)}</span>
                </div>
                
                <div className="pt-3 text-[10px] text-text-muted leading-relaxed flex gap-1.5 items-start">
                  <Info className="w-4 h-4 shrink-0 text-text-muted mt-0.5" />
                  <span>
                    The tax portion won't be deducted from the Cl. Balance, as capital gains taxes are paid during income tax returns. We've only projected the estimation of these taxes in this "Taxes on Capital Gains" section.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recharts chart representation */}
      <div className="glass-card overflow-hidden">
        <div className="bg-slate-200 text-slate-800 font-bold p-3 px-4 text-sm flex items-center gap-2 border-b border-border">
          <TrendingUp className="w-4 h-4 text-slate-700" />
          YOY - WITHDRAWAL VS. GROWTH CHART
        </div>
        <div className="p-6 space-y-4">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  tick={{fill: '#475569', fontSize: 10}}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748B" 
                  tick={{fill: '#475569', fontSize: 10}}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                  tickLine={false}
                  width={55}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: 11 }}
                  labelStyle={{ fontSize: 11, fontWeight: 'bold', color: '#334155' }}
                  formatter={(value: any) => formatIndianCurrency(Number(value) || 0)}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line 
                  type="monotone" 
                  dataKey="Fund Value" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Withdrawal YOY" 
                  stroke="#0EA5E9" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Growth YOY" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-text-muted leading-relaxed flex gap-1 items-center justify-center text-center mt-2 border-t border-slate-100 pt-3">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Disclaimer: The above chart, figures & calculations are only indicative. Fees, maintenance & other charges not included while calculation.</span>
          </div>
        </div>
      </div>

      {/* Projection Table Ledger Panel */}
      <div className="glass-card overflow-hidden">
        <div className="bg-slate-200 text-slate-800 font-bold p-3 px-4 text-sm flex items-center justify-center gap-2 border-b border-border">
          <Calendar className="w-4 h-4 text-slate-700" />
          GROWTH TABLE
        </div>
        
        <div className="p-6 space-y-4">
          {/* Toggle buttons */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary font-medium">Verify cash flow projections:</span>
            <div className="flex p-0.5 bg-surface-hover rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setViewMode('yearly')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${viewMode === 'yearly' ? 'bg-surface shadow-sm text-accent-500 border border-border' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Yearly
              </button>
              <button
                type="button"
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${viewMode === 'monthly' ? 'bg-surface shadow-sm text-accent-500 border border-border' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {currentTableRows.length === 0 ? (
            <div className="text-center p-12 text-text-muted text-sm italic">
              Trigger calculations to see detailed ledger information.
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-hover border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                      <th className="p-3.5 border-r border-dashed border-slate-300">Period</th>
                      <th className="p-3.5 border-r border-dashed border-slate-300">Op. Balance</th>
                      <th className="p-3.5 border-r border-dashed border-slate-300">Growth</th>
                      <th className="p-3.5 border-r border-dashed border-slate-300">Withdrawal</th>
                      <th className="p-3.5 border-r border-dashed border-slate-300">SWP Inflation</th>
                      <th className="p-3.5">Cl. Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-text-primary">
                    {currentTableRows.map((row) => (
                      <tr key={row.period} className="hover:bg-surface-hover/50 transition-colors font-medium">
                        <td className="p-3 font-semibold text-text-secondary border-r border-dashed border-slate-200">
                          {viewMode === 'monthly' ? `Month ${row.period}` : `${row.period}`}
                        </td>
                        <td className="p-3 border-r border-dashed border-slate-200">{formatIndianCurrency(row.openingBalance)}</td>
                        <td className="p-3 text-emerald-600 border-r border-dashed border-slate-200">+{formatIndianCurrency(row.growth)}</td>
                        <td className="p-3 text-red-600 border-r border-dashed border-slate-200 font-semibold">
                          {formatIndianCurrency(row.withdrawal, true)}
                        </td>
                        <td className="p-3 text-red-500 border-r border-dashed border-slate-200 font-semibold">
                          {formatIndianCurrency(row.inflationComponent, true)}
                        </td>
                        <td className="p-3 font-bold bg-slate-50/50">{formatIndianCurrency(row.closingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {maxPages > 1 && (
                <div className="flex justify-between items-center text-xs text-text-secondary border-t border-border pt-4">
                  <span>
                    Showing page <strong className="text-text-primary">{page}</strong> of <strong className="text-text-primary">{maxPages}</strong>
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-hover disabled:opacity-50 transition-all cursor-pointer font-bold"
                      title="First Page"
                    >
                      First
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 px-3 rounded-lg border border-border bg-surface hover:bg-surface-hover disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.min(maxPages, p + 1))}
                      disabled={page === maxPages}
                      className="p-2 px-3 rounded-lg border border-border bg-surface hover:bg-surface-hover disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer font-bold"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(maxPages)}
                      disabled={page === maxPages}
                      className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-hover disabled:opacity-50 transition-all cursor-pointer font-bold"
                      title="Last Page"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
