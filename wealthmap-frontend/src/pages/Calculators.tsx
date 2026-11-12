// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllAssets } from '../api/assets.api';
import { getAllLiabilities } from '../api/liabilities.api';
import {
  Calculator,
  TrendingUp,
  Landmark,
  IndianRupee,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  ChevronDown,
  Percent,
  Target,
  Sparkles,
  Coins,
  Layers,
  Home,
} from 'lucide-react';
import SwpCalculator from './SwpCalculator';
import IncomeTaxCalculator from '../components/calculators/IncomeTaxCalculator';
import PpfCalculator from '../components/calculators/PpfCalculator';
import NpsCalculator from '../components/calculators/NpsCalculator';
import FdCalculator from '../components/calculators/FdCalculator';
import RdCalculator from '../components/calculators/RdCalculator';
import EmiCalculator from '../components/calculators/EmiCalculator';
import FixedPrincipalCalculator from '../components/calculators/FixedPrincipalCalculator';
import ExpenseRatioCalculator from '../components/calculators/ExpenseRatioCalculator';
import SipCalculator from '../components/calculators/SipCalculator';
import XirrCalculator from '../components/calculators/XirrCalculator';
import SsyCalculator from '../components/calculators/SsyCalculator';
import NscCalculator from '../components/calculators/NscCalculator';
import EpfCalculator from '../components/calculators/EpfCalculator';
import ScssCalculator from '../components/calculators/ScssCalculator';
import MultiAssetWealthCalculator from '../components/calculators/MultiAssetWealthCalculator';
import FutureWealthCalculator from '../components/calculators/FutureWealthCalculator';
import InflationCalculator from '../components/calculators/InflationCalculator';
import MortgageCalculator from '../components/calculators/MortgageCalculator';

type CalculatorTab = 'swp' | 'tax' | 'ppf' | 'fd' | 'rd' | 'ssy' | 'nsc' | 'epf' | 'scss' | 'nps' | 'retirement' | 'sip' | 'step-up-sip' | 'expense-ratio' | 'xirr' | 'multi-asset' | 'wealth-calculator' | 'inflation' | 'emi' | 'prepayment' | 'fixed-principal' | 'mortgage';

const VALID_TABS: CalculatorTab[] = ['swp', 'tax', 'ppf', 'fd', 'rd', 'ssy', 'nsc', 'epf', 'scss', 'nps', 'retirement', 'sip', 'step-up-sip', 'expense-ratio', 'xirr', 'multi-asset', 'wealth-calculator', 'inflation', 'emi', 'prepayment', 'fixed-principal', 'mortgage'];

interface CalculatorItem {
  id: CalculatorTab;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CalculatorDomain {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: CalculatorItem[];
}

const CALCULATOR_DOMAINS: CalculatorDomain[] = [
  {
    id: 'tax-retirement',
    label: 'Tax & Retirement',
    icon: ReceiptText,
    items: [
      {
        id: 'tax',
        name: 'Income Tax (New Regime)',
        description: 'FY 2024–27 slabs, Sec 87A & NPS',
        icon: ReceiptText,
      },
      {
        id: 'nps',
        name: 'NPS Pension',
        description: 'Corpus, annuity & monthly pension',
        icon: ShieldCheck,
      },
      {
        id: 'retirement',
        name: 'Retirement Planner',
        description: '4% withdrawal readiness check',
        icon: PiggyBank,
      },
      {
        id: 'swp',
        name: 'SWP Calculator',
        description: 'Systematic withdrawal longevity',
        icon: Calculator,
      },
    ],
  },
  {
    id: 'govt-savings',
    label: 'Govt. & Savings',
    icon: Landmark,
    items: [
      {
        id: 'ppf',
        name: 'PPF Calculator',
        description: 'Public Provident Fund 7.1% EEE',
        icon: Landmark,
      },
      {
        id: 'fd',
        name: 'FD Calculator',
        description: 'Fixed Deposit maturity & compounding',
        icon: Landmark,
      },
      {
        id: 'rd',
        name: 'RD Calculator',
        description: 'Recurring Deposit maturity & interest',
        icon: Landmark,
      },
      {
        id: 'ssy',
        name: 'SSY Calculator',
        description: 'Sukanya Samriddhi Yojana 21-yr maturity',
        icon: Landmark,
      },
      {
        id: 'nsc',
        name: 'NSC Calculator',
        description: 'National Savings Certificate 5-yr maturity',
        icon: Landmark,
      },
      {
        id: 'epf',
        name: 'EPF / PF Calculator',
        description: 'Employee Provident Fund 8.25% corpus',
        icon: Landmark,
      },
      {
        id: 'scss',
        name: 'SCSS Calculator',
        description: 'Senior Citizen Savings Scheme 8.2%',
        icon: Landmark,
      },
    ],
  },
  {
    id: 'wealth-investments',
    label: 'Wealth & Investments',
    icon: TrendingUp,
    items: [
      {
        id: 'sip',
        name: 'SIP & Lumpsum',
        description: 'Monthly SIP & lumpsum growth',
        icon: TrendingUp,
      },
      {
        id: 'step-up-sip',
        name: 'Step-Up SIP',
        description: 'Annual incremental SIP returns',
        icon: TrendingUp,
      },
      {
        id: 'expense-ratio',
        name: 'MF Expense Ratio',
        description: 'Long-term impact of TER on returns',
        icon: Percent,
      },
      {
        id: 'xirr',
        name: 'XIRR Calculator',
        description: 'Exact annualized return for irregular cashflows',
        icon: TrendingUp,
      },
      {
        id: 'multi-asset',
        name: 'Multi-Asset Wealth Pro',
        description: 'Consolidated YoY matrix across all assets',
        icon: Layers,
      },
      {
        id: 'wealth-calculator',
        name: 'Future Wealth Calculator',
        description: 'Step-up, inflation, stop-SIP & goal withdrawals',
        icon: Sparkles,
      },
      {
        id: 'inflation',
        name: 'Inflation Calculator',
        description: 'Future currency cost & purchasing power',
        icon: TrendingUp,
      },
    ],
  },
  {
    id: 'loans-credit',
    label: 'Loans & Credit',
    icon: IndianRupee,
    items: [
      {
        id: 'emi',
        name: 'EMI Calculator',
        description: 'Monthly EMI, interest & amortization',
        icon: IndianRupee,
      },
      {
        id: 'prepayment',
        name: 'Home Loan Prepayment',
        description: 'Recurring & lumpsum part-payment savings',
        icon: IndianRupee,
      },
      {
        id: 'fixed-principal',
        name: 'Fixed Principal Loan',
        description: 'Declining EMI with fixed monthly principal',
        icon: IndianRupee,
      },
      {
        id: 'mortgage',
        name: 'Mortgage Calculator (INR)',
        description: 'P&I, down payment, property tax & insurance',
        icon: Home,
      },
    ],
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function Calculators() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as CalculatorTab | null;
  const [activeTab, setActiveTab] = useState<CalculatorTab>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'swp'
  );
  const [openDomain, setOpenDomain] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tab: CalculatorTab) => {
    setActiveTab(tab);
    setOpenDomain(null);
    setSearchParams({ tab }, { replace: true });
  };

  const activeDomainInfo = useMemo(() => {
    for (const domain of CALCULATOR_DOMAINS) {
      const found = domain.items.find((item) => item.id === activeTab);
      if (found) return { domain, item: found };
    }
    return { domain: CALCULATOR_DOMAINS[0], item: CALCULATOR_DOMAINS[0].items[0] };
  }, [activeTab]);

  // Live Net Worth for Retirement Calculator
  const { data: assets } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets,
  });

  const { data: liabilities } = useQuery({
    queryKey: ['liabilities', 'all'],
    queryFn: getAllLiabilities,
  });

  const totalAssets = assets?.reduce((sum, item) => sum + (item.currentValue || 0), 0) || 0;
  const totalLiabilities = liabilities?.reduce((sum, item) => sum + (item.outstandingBalance || 0), 0) || 0;
  const netWorth = totalAssets - totalLiabilities;

  // Retirement Calculator State
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [monthlyExpenseToday, setMonthlyExpenseToday] = useState(50000);
  const [expectedReturnRate, setExpectedReturnRate] = useState(10);
  const [inflationRate, setInflationRate] = useState(6);
  const [useCustomNetWorth, setUseCustomNetWorth] = useState(false);
  const [customNetWorthInput, setCustomNetWorthInput] = useState('');

  const activeNetWorth = useCustomNetWorth ? Number(customNetWorthInput) || 0 : netWorth;

  const retirementResult = useMemo(() => {
    const yearsToRetirement = Math.max(1, retirementAge - currentAge);
    const monthlyExpenseTodayVal = Number(monthlyExpenseToday) || 0;
    const inflationRateVal = (Number(inflationRate) || 0) / 100.0;
    const expectedReturnRateVal = (Number(expectedReturnRate) || 0) / 100.0;

    const inflationFactor = Math.pow(1.0 + inflationRateVal, yearsToRetirement);
    const adjustedMonthlyExpense = monthlyExpenseTodayVal * inflationFactor;
    const annualExpenseAtRetirement = adjustedMonthlyExpense * 12.0;

    const requiredRetirementCorpus = annualExpenseAtRetirement * 25.0;
    const projectedNetWorthAtRetirement =
      activeNetWorth * Math.pow(1.0 + expectedReturnRateVal, yearsToRetirement);
    const shortfallOrSurplus = projectedNetWorthAtRetirement - requiredRetirementCorpus;
    const readiness =
      requiredRetirementCorpus > 0
        ? (projectedNetWorthAtRetirement / requiredRetirementCorpus) * 100.0
        : 100.0;
    const readinessPercentage = Math.min(100.0, Math.max(0.0, readiness));

    return {
      yearsToRetirement,
      inflationAdjustedMonthlyExpense: adjustedMonthlyExpense,
      requiredRetirementCorpus,
      projectedNetWorthAtRetirement,
      shortfallOrSurplus,
      readinessPercentage,
    };
  }, [currentAge, retirementAge, monthlyExpenseToday, expectedReturnRate, inflationRate, activeNetWorth]);

  // SIP & Lumpsum Calculator State
  const [monthlySip, setMonthlySip] = useState(25000);
  const [lumpsumAmount, setLumpsumAmount] = useState(100000);
  const [sipReturnRate, setSipReturnRate] = useState(12);
  const [sipYears, setSipYears] = useState(15);
  const [sipStepUp, setSipStepUp] = useState(0);
  const [sipInflation, setSipInflation] = useState(0);

  const sipProjection = useMemo(() => {
    const monthlyRate = (Number(sipReturnRate) || 0) / 100 / 12;
    const years = Math.max(1, Number(sipYears) || 1);
    const stepUpRate = (Number(sipStepUp) || 0) / 100;
    const inflationRateVal = (Number(sipInflation) || 0) / 100;

    let currentCorpus = Number(lumpsumAmount) || 0;
    let totalInvested = Number(lumpsumAmount) || 0;
    let currentMonthlySip = Number(monthlySip) || 0;

    const chartData: { year: string; invested: number; corpus: number }[] = [
      { year: 'Yr 0', invested: Math.round(totalInvested), corpus: Math.round(currentCorpus) },
    ];

    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= 12; m++) {
        currentCorpus = (currentCorpus + currentMonthlySip) * (1 + monthlyRate);
        totalInvested += currentMonthlySip;
      }
      chartData.push({
        year: `Yr ${y}`,
        invested: Math.round(totalInvested),
        corpus: Math.round(currentCorpus),
      });
      if (stepUpRate > 0) {
        currentMonthlySip = currentMonthlySip * (1 + stepUpRate);
      }
    }

    const estimatedReturns = Math.max(0, currentCorpus - totalInvested);
    const inflationAdjustedCorpus =
      inflationRateVal > 0
        ? currentCorpus / Math.pow(1 + inflationRateVal, years)
        : currentCorpus;

    return {
      totalInvested,
      estimatedReturns,
      totalCorpus: currentCorpus,
      inflationAdjustedCorpus,
      chartData,
    };
  }, [monthlySip, lumpsumAmount, sipReturnRate, sipYears, sipStepUp, sipInflation]);

  // Loan / EMI Calculator State
  const [loanPrincipal, setLoanPrincipal] = useState(5000000);
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanTenureYears, setLoanTenureYears] = useState(20);

  const emiResult = useMemo(() => {
    const p = Math.max(0, Number(loanPrincipal) || 0);
    const r = (Number(loanRate) || 0) / 12 / 100;
    const n = Math.max(1, (Number(loanTenureYears) || 1) * 12);

    if (r === 0) {
      const emi = p / n;
      return {
        emi,
        totalPayment: p,
        totalInterest: 0,
        principalPercent: 100,
        interestPercent: 0,
      };
    }

    const factor = Math.pow(1 + r, n);
    const emi = (p * r * factor) / (factor - 1);
    const totalPayment = emi * n;
    const totalInterest = Math.max(0, totalPayment - p);
    const principalPercent = totalPayment > 0 ? (p / totalPayment) * 100 : 100;
    const interestPercent = 100 - principalPercent;

    return {
      emi,
      totalPayment,
      totalInterest,
      principalPercent,
      interestPercent,
    };
  }, [loanPrincipal, loanRate, loanTenureYears]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-heading text-2xl font-dmsans">Wealth Lab</h1>
          <p className="text-text-secondary text-sm">
            Simulate New Regime income tax, systematic withdrawals, retirement readiness, SIP compounding, and loan EMIs.
          </p>
        </div>

        <div className="glass-card px-4 py-2.5 flex items-center gap-3 border border-accent-100 bg-accent-500/5 min-w-[200px]">
          <div className="p-2 bg-accent-500/10 rounded-xl text-accent-500 border border-accent-100">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">
              Linked Net Worth
            </p>
            <p className="text-xl font-extrabold text-accent-500">{formatCurrency(netWorth)}</p>
          </div>
        </div>
      </div>

      {/* Domain-Grouped Hover/Click Dropdown Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-surface-hover rounded-2xl border border-border">
          {CALCULATOR_DOMAINS.map((domain) => {
            const isActiveDomain = activeDomainInfo.domain.id === domain.id;
            const isOpen = openDomain === domain.id;
            const DomainIcon = domain.icon;
            const useTwoCols = domain.items.length > 2;

            return (
              <div
                key={domain.id}
                className="relative"
                onMouseEnter={() => setOpenDomain(domain.id)}
                onMouseLeave={() => setOpenDomain((prev) => (prev === domain.id ? null : prev))}
              >
                <button
                  type="button"
                  onClick={() => setOpenDomain((prev) => (prev === domain.id ? null : domain.id))}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                    isActiveDomain
                      ? 'bg-surface shadow-sm border border-border text-accent-500'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                  }`}
                >
                  <DomainIcon className="w-4 h-4 shrink-0" />
                  <span>{domain.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-hover text-text-muted font-bold">
                    {domain.items.length}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div
                    className={`absolute left-0 top-full pt-2 z-40 ${
                      useTwoCols ? 'w-[290px] sm:w-[490px]' : 'w-[280px]'
                    }`}
                  >
                    <div className="bg-surface border border-border rounded-2xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-1 duration-150">
                      <p className="px-2 pb-2 mb-2 border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {domain.label}
                      </p>
                      <div
                        className={`grid gap-1.5 ${
                          useTwoCols ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
                        }`}
                      >
                        {domain.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isSelected = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleTabChange(item.id)}
                              className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                                isSelected
                                  ? 'bg-accent-500/10 text-accent-500 border border-accent-500/25'
                                  : 'hover:bg-surface-hover text-text-primary border border-transparent'
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                  isSelected
                                    ? 'bg-accent-500/15 text-accent-500'
                                    : 'bg-surface-hover text-text-secondary'
                                }`}
                              >
                                <ItemIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold leading-tight truncate">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-text-muted mt-0.5 leading-snug line-clamp-1">
                                  {item.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Calculator Indicator Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-accent-500/10 border border-accent-500/20 text-xs self-start lg:self-auto shrink-0">
          <span className="text-text-secondary font-medium">{activeDomainInfo.domain.label}</span>
          <span className="text-text-muted">/</span>
          <span className="font-bold text-accent-500">{activeDomainInfo.item.name}</span>
        </div>
      </div>

      {/* TAB 1: SWP CALCULATOR */}
      {activeTab === 'swp' && <SwpCalculator />}

      {/* TAB 2: INCOME TAX CALCULATOR (NEW REGIME) */}
      {activeTab === 'tax' && <IncomeTaxCalculator />}

      {/* TAB 3: PPF CALCULATOR */}
      {activeTab === 'ppf' && <PpfCalculator />}

      {/* TAB 4: FD CALCULATOR */}
      {activeTab === 'fd' && <FdCalculator />}

      {/* TAB 5: RD CALCULATOR */}
      {activeTab === 'rd' && <RdCalculator />}

      {/* TAB 6: SSY CALCULATOR */}
      {activeTab === 'ssy' && <SsyCalculator />}

      {/* TAB 7: NSC CALCULATOR */}
      {activeTab === 'nsc' && <NscCalculator />}

      {/* TAB 8: EPF CALCULATOR */}
      {activeTab === 'epf' && <EpfCalculator />}

      {/* TAB 9: SCSS CALCULATOR */}
      {activeTab === 'scss' && <ScssCalculator />}

      {/* TAB 4: NPS PENSION CALCULATOR */}
      {activeTab === 'nps' && <NpsCalculator />}

      {/* TAB 2: RETIREMENT PLANNER */}
      {activeTab === 'retirement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-medium text-text-primary">Calculator Parameters</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-text-secondary block mb-1">
                  Current Age: {currentAge}
                </label>
                <input
                  type="range"
                  min="18"
                  max="70"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
                />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">
                  Retirement Age: {retirementAge}
                </label>
                <input
                  type="range"
                  min="40"
                  max="75"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
                />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">
                  Desired Monthly Expense Today (₹)
                </label>
                <input
                  type="number"
                  value={monthlyExpenseToday}
                  onChange={(e) => setMonthlyExpenseToday(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">
                  Expected Investment Return Rate (%): {expectedReturnRate}%
                </label>
                <input
                  type="range"
                  min="4"
                  max="18"
                  step="0.5"
                  value={expectedReturnRate}
                  onChange={(e) => setExpectedReturnRate(Number(e.target.value))}
                  className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
                />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">
                  Assumed Inflation Rate (%): {inflationRate}%
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="0.5"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  className="w-full accent-accent-500 h-2 bg-surface-hover rounded"
                />
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomNetWorth"
                    checked={useCustomNetWorth}
                    onChange={(e) => setUseCustomNetWorth(e.target.checked)}
                    className="rounded border-border text-accent-500 focus:ring-accent-500 cursor-pointer"
                  />
                  <label
                    htmlFor="useCustomNetWorth"
                    className="font-semibold text-text-secondary cursor-pointer select-none"
                  >
                    Use Custom Net Worth
                  </label>
                </div>
                {useCustomNetWorth ? (
                  <div className="animate-fadeIn">
                    <label className="block text-[10px] font-semibold text-text-secondary mb-1">
                      Custom Net Worth Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={customNetWorthInput}
                      onChange={(e) => setCustomNetWorthInput(e.target.value)}
                      placeholder={`e.g. ${Math.round(netWorth)}`}
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                ) : (
                  <div className="text-[10px] text-text-muted leading-relaxed">
                    Linked to calculated Net Worth:{' '}
                    <strong className="text-accent-500">{formatCurrency(netWorth)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-6 h-6 text-accent-500" />
                <h3 className="text-xl font-bold text-text-primary">
                  Retirement Readiness Analysis
                </h3>
              </div>
              <p className="text-xs text-text-secondary mb-6">
                Inflation-adjusted corpus projection using the 4% annual withdrawal rule (assumes
                25 years of post-retirement coverage).
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-hover border border-border">
                    <p className="text-xs text-text-secondary font-medium mb-1">
                      Years to Retirement
                    </p>
                    <p className="text-2xl font-bold text-text-primary">
                      {retirementResult.yearsToRetirement} Years
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      Age {currentAge} to Age {retirementAge}.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-hover border border-border">
                    <p className="text-xs text-text-secondary font-medium mb-1">
                      Inflation-Adjusted Monthly Expense
                    </p>
                    <p className="text-2xl font-bold text-accent-500">
                      {formatCurrency(retirementResult.inflationAdjustedMonthlyExpense)}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      Expense value inflated by {inflationRate}% yearly.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-hover border border-border">
                    <p className="text-xs text-text-secondary font-medium mb-1">
                      Required Corpus (25 Yrs. Retirement)
                    </p>
                    <p className="text-2xl font-bold text-emerald-500">
                      {formatCurrency(retirementResult.requiredRetirementCorpus)}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      Based on the 4% safe annual withdrawal rule.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-hover border border-border">
                    <p className="text-xs text-text-secondary font-medium mb-1">
                      Projected Net Worth at Age {retirementAge}
                    </p>
                    <p className="text-2xl font-bold text-indigo-500">
                      {formatCurrency(retirementResult.projectedNetWorthAtRetirement)}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      Compounded return at {expectedReturnRate}% yearly.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-text-primary">Retirement Readiness Score</span>
                    <span className="text-accent-500">
                      {retirementResult.readinessPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-surface-hover rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-accent-500 rounded-full transition-all duration-500"
                      style={{ width: `${retirementResult.readinessPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SIP & STEP-UP CALCULATOR */}
      {activeTab === 'sip' && <SipCalculator key="sip" mode="sip" />}
      {activeTab === 'step-up-sip' && <SipCalculator key="step-up" mode="step-up" />}

      {/* TAB 4: LOAN / EMI & PREPAYMENT CALCULATOR */}
      {activeTab === 'expense-ratio' && <ExpenseRatioCalculator />}
      {activeTab === 'xirr' && <XirrCalculator />}
      {activeTab === 'multi-asset' && <MultiAssetWealthCalculator />}
      {activeTab === 'wealth-calculator' && <FutureWealthCalculator />}
      {activeTab === 'inflation' && <InflationCalculator />}
      {activeTab === 'emi' && <EmiCalculator key="emi" mode="emi" />}
      {activeTab === 'prepayment' && <EmiCalculator key="prepayment" mode="prepayment" />}
      {activeTab === 'fixed-principal' && <FixedPrincipalCalculator />}
      {activeTab === 'mortgage' && <MortgageCalculator />}
    </div>
  );
}
