import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Info,
  ShieldCheck,
  Landmark,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Sparkles,
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

type FinancialYear = 'FY2026-27' | 'FY2025-26' | 'FY2024-25';
type IncomeCategory = 'SALARIED' | 'BUSINESS' | 'FAMILY_PENSION';
type JobSector = 'PRIVATE' | 'GOVERNMENT';
type MealVoucherOption = 0 | 4400 | 8800;

interface TaxSlab {
  label: string;
  min: number;
  max: number;
  rate: number;
}

const FY_CONFIG: Record<
  FinancialYear,
  {
    label: string;
    ayLabel: string;
    shortLabel: string;
    rebateLimit: number;
    slabs: TaxSlab[];
    supportsMealVoucher: boolean;
  }
> = {
  'FY2026-27': {
    label: 'FY 2026-27 (AY 2027-28)',
    ayLabel: 'FY 2026-27 • AY 2027-28',
    shortLabel: 'FY 2026-27',
    rebateLimit: 1200000,
    supportsMealVoucher: true,
    slabs: [
      { label: 'Up to ₹4,00,000', min: 0, max: 400000, rate: 0 },
      { label: '₹4,00,001 – ₹8,00,000', min: 400000, max: 800000, rate: 0.05 },
      { label: '₹8,00,001 – ₹12,00,000', min: 800000, max: 1200000, rate: 0.1 },
      { label: '₹12,00,001 – ₹16,00,000', min: 1200000, max: 1600000, rate: 0.15 },
      { label: '₹16,00,001 – ₹20,00,000', min: 1600000, max: 2000000, rate: 0.2 },
      { label: '₹20,00,001 – ₹24,00,000', min: 2000000, max: 2400000, rate: 0.25 },
      { label: 'Above ₹24,00,000', min: 2400000, max: Infinity, rate: 0.3 },
    ],
  },
  'FY2025-26': {
    label: 'FY 2025-26 (AY 2026-27)',
    ayLabel: 'FY 2025-26 • AY 2026-27',
    shortLabel: 'FY 2025-26',
    rebateLimit: 1200000,
    supportsMealVoucher: false,
    slabs: [
      { label: 'Up to ₹4,00,000', min: 0, max: 400000, rate: 0 },
      { label: '₹4,00,001 – ₹8,00,000', min: 400000, max: 800000, rate: 0.05 },
      { label: '₹8,00,001 – ₹12,00,000', min: 800000, max: 1200000, rate: 0.1 },
      { label: '₹12,00,001 – ₹16,00,000', min: 1200000, max: 1600000, rate: 0.15 },
      { label: '₹16,00,001 – ₹20,00,000', min: 1600000, max: 2000000, rate: 0.2 },
      { label: '₹20,00,001 – ₹24,00,000', min: 2000000, max: 2400000, rate: 0.25 },
      { label: 'Above ₹24,00,000', min: 2400000, max: Infinity, rate: 0.3 },
    ],
  },
  'FY2024-25': {
    label: 'FY 2024-25 (AY 2025-26)',
    ayLabel: 'FY 2024-25 • AY 2025-26',
    shortLabel: 'FY 2024-25',
    rebateLimit: 700000,
    supportsMealVoucher: false,
    slabs: [
      { label: 'Up to ₹3,00,000', min: 0, max: 300000, rate: 0 },
      { label: '₹3,00,001 – ₹7,00,000', min: 300000, max: 700000, rate: 0.05 },
      { label: '₹7,00,001 – ₹10,00,000', min: 700000, max: 1000000, rate: 0.1 },
      { label: '₹10,00,001 – ₹12,00,000', min: 1000000, max: 1200000, rate: 0.15 },
      { label: '₹12,00,001 – ₹15,00,000', min: 1200000, max: 1500000, rate: 0.2 },
      { label: 'Above ₹15,00,000', min: 1500000, max: Infinity, rate: 0.3 },
    ],
  },
};

const formatINR = (val: number, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);

function computeNewRegimeTax(params: {
  fy: FinancialYear;
  category: IncomeCategory;
  sector: JobSector;
  primaryIncome: number;
  otherIncome: number;
  monthlyNps: number;
  mealVoucherMonthly: MealVoucherOption;
  mealMonths: number;
}) {
  const { fy, category, primaryIncome, otherIncome, monthlyNps, mealVoucherMonthly, mealMonths } =
    params;
  const config = FY_CONFIG[fy];

  const grossPrimary = Math.max(0, primaryIncome);
  const grossOther = Math.max(0, otherIncome);
  const grossTotal = grossPrimary + grossOther;

  // Deductions
  let standardDeduction = 0;
  let familyPensionDeduction = 0;
  let npsDeduction = 0;
  let mealExemption = 0;
  const basicSalary = category === 'SALARIED' ? grossPrimary * 0.5 : 0;

  if (category === 'SALARIED') {
    standardDeduction = Math.min(75000, grossPrimary);
    const maxNpsCap = basicSalary * 0.14; // 14% of Basic+DA for both Private & Govt in New Regime (Budget 2024/2025)
    npsDeduction = Math.min(Math.max(0, monthlyNps) * 12, maxNpsCap);
    if (config.supportsMealVoucher) {
      mealExemption = Math.min(mealVoucherMonthly * mealMonths, Math.max(0, grossPrimary - standardDeduction));
    }
  } else if (category === 'FAMILY_PENSION') {
    familyPensionDeduction = Math.min(25000, grossPrimary / 3);
  }

  const totalDeductions =
    standardDeduction + familyPensionDeduction + npsDeduction + mealExemption;
  const taxableIncome = Math.max(0, grossTotal - totalDeductions);

  // Slab-wise tax before 87A
  const slabBreakdown = config.slabs.map((slab) => {
    const taxableInSlab = Math.max(0, Math.min(taxableIncome, slab.max) - slab.min);
    const tax = taxableInSlab * slab.rate;
    return {
      ...slab,
      taxableInSlab,
      tax,
    };
  });

  const rawSlabTax = slabBreakdown.reduce((sum, s) => sum + s.tax, 0);

  // Section 87A Rebate & Smart Marginal Relief
  let rebate87A = 0;
  let marginalRelief87A = 0;
  let taxAfterRebate = rawSlabTax;

  if (taxableIncome <= config.rebateLimit) {
    rebate87A = rawSlabTax;
    taxAfterRebate = 0;
  } else {
    const excessOverLimit = taxableIncome - config.rebateLimit;
    if (rawSlabTax > excessOverLimit) {
      marginalRelief87A = rawSlabTax - excessOverLimit;
      taxAfterRebate = excessOverLimit;
    }
  }

  // Surcharge (New Regime: 10% >50L, 15% >1Cr, 25% >2Cr)
  let surchargeRate = 0;
  if (taxableIncome > 20000000) surchargeRate = 0.25;
  else if (taxableIncome > 10000000) surchargeRate = 0.15;
  else if (taxableIncome > 5000000) surchargeRate = 0.1;

  const surcharge = taxAfterRebate * surchargeRate;
  const taxPlusSurcharge = taxAfterRebate + surcharge;

  // Health & Education Cess (4%)
  const cess = Math.round(taxPlusSurcharge * 0.04);
  const totalTax = Math.round(taxAfterRebate + surcharge) + cess;
  const effectiveTaxRate = grossTotal > 0 ? (totalTax / grossTotal) * 100 : 0;
  const monthlyTds = Math.round(totalTax / 12);
  const netTakeHome = Math.max(0, grossTotal - totalTax);

  return {
    fy,
    config,
    grossPrimary,
    grossOther,
    grossTotal,
    basicSalary,
    standardDeduction,
    familyPensionDeduction,
    npsDeduction,
    mealExemption,
    totalDeductions,
    taxableIncome,
    slabBreakdown,
    rawSlabTax,
    rebate87A,
    marginalRelief87A,
    baseTax: taxAfterRebate,
    surcharge,
    surchargeRate,
    cess,
    totalTax,
    effectiveTaxRate,
    monthlyTds,
    netTakeHome,
  };
}

export default function IncomeTaxCalculator() {
  const [fy, setFy] = useState<FinancialYear>('FY2026-27');
  const [category, setCategory] = useState<IncomeCategory>('SALARIED');
  const [sector, setSector] = useState<JobSector>('PRIVATE');
  const [grossIncome, setGrossIncome] = useState<number>(1300000);
  const [monthlyNps, setMonthlyNps] = useState<number>(0);
  const [mealVoucher, setMealVoucher] = useState<MealVoucherOption>(0);
  const [mealMonths, setMealMonths] = useState<number>(12);
  const [otherIncome, setOtherIncome] = useState<number>(0);
  const [showRules, setShowRules] = useState<boolean>(false);

  const result = useMemo(
    () =>
      computeNewRegimeTax({
        fy,
        category,
        sector,
        primaryIncome: grossIncome,
        otherIncome,
        monthlyNps,
        mealVoucherMonthly: mealVoucher,
        mealMonths,
      }),
    [fy, category, sector, grossIncome, otherIncome, monthlyNps, mealVoucher, mealMonths]
  );

  const yearComparison = useMemo(() => {
    const years: FinancialYear[] = ['FY2024-25', 'FY2025-26', 'FY2026-27'];
    return years.map((y) => {
      const res = computeNewRegimeTax({
        fy: y,
        category,
        sector,
        primaryIncome: grossIncome,
        otherIncome,
        monthlyNps,
        mealVoucherMonthly: mealVoucher,
        mealMonths,
      });
      return {
        year: FY_CONFIG[y].shortLabel,
        fyKey: y,
        totalTax: res.totalTax,
        takeHome: res.netTakeHome,
        effectiveRate: res.effectiveTaxRate,
      };
    });
  }, [category, sector, grossIncome, otherIncome, monthlyNps, mealVoucher, mealMonths]);

  const breakdownChartData = useMemo(
    () => [
      { name: 'Net Take-Home', amount: Math.round(result.netTakeHome), color: '#10b981' },
      { name: 'Total Tax', amount: Math.round(result.totalTax), color: '#6366f1' },
      { name: 'Deductions', amount: Math.round(result.totalDeductions), color: '#f59e0b' },
    ],
    [result]
  );

  const primaryLabel =
    category === 'SALARIED'
      ? 'Gross Income from Salary (Annual) (₹)'
      : category === 'FAMILY_PENSION'
      ? 'Annual Family Pension (₹)'
      : 'Gross Business / Professional Income (Annual) (₹)';

  return (
    <div className="space-y-6">
      {/* Main Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs Card */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Calculator className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              Income Tax Calculator (New Regime)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Financial Year */}
            <div>
              <label className="flex items-center justify-between font-semibold text-text-secondary mb-1.5">
                <span>Financial Year</span>
                <span
                  title="Select the Indian Financial Year (April–March) to apply corresponding Budget tax slabs."
                  className="text-accent-500 cursor-help"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </label>
              <select
                value={fy}
                onChange={(e) => setFy(e.target.value as FinancialYear)}
                className="glass-input text-xs font-medium"
              >
                <option value="FY2026-27">FY 2026-27 (AY 2027-28)</option>
                <option value="FY2025-26">FY 2025-26 (AY 2026-27)</option>
                <option value="FY2024-25">FY 2024-25 (AY 2025-26)</option>
              </select>
            </div>

            {/* Primary Income Category */}
            <div>
              <label className="flex items-center justify-between font-semibold text-text-secondary mb-1.5">
                <span>Primary Income Category</span>
                <span
                  title="Salaried gets ₹75,000 Standard Deduction; Family Pension gets ₹25,000 or 1/3rd deduction."
                  className="text-accent-500 cursor-help"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                className="glass-input text-xs font-medium"
              >
                <option value="SALARIED">Salaried Individual</option>
                <option value="BUSINESS">Business / Professional</option>
                <option value="FAMILY_PENSION">Family Pension</option>
              </select>
            </div>

            {/* Job Sector (Salaried only) */}
            {category === 'SALARIED' && (
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Job Sector
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value as JobSector)}
                  className="glass-input text-xs font-medium"
                >
                  <option value="PRIVATE">Private Sector / PSU</option>
                  <option value="GOVERNMENT">Government Sector</option>
                </select>
              </div>
            )}

            {/* Gross Income */}
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                {primaryLabel}
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={grossIncome}
                onChange={(e) => setGrossIncome(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            {/* Employer NPS (Salaried only) */}
            {category === 'SALARIED' && (
              <div>
                <label className="flex items-center justify-between font-semibold text-text-secondary mb-1.5">
                  <span>Employer NPS Contribution (Monthly) (₹)</span>
                  <span
                    title="Sec 80CCD(2): Deductible up to 14% of Basic Salary (assumed 50% of gross salary)."
                    className="text-accent-500 cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={monthlyNps}
                  onChange={(e) => setMonthlyNps(Math.max(0, Number(e.target.value)))}
                  className="glass-input text-xs font-semibold"
                />
              </div>
            )}

            {/* Meal Voucher (FY 2026-27 Salaried only) */}
            {category === 'SALARIED' && FY_CONFIG[fy].supportsMealVoucher && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="flex items-center justify-between font-semibold text-text-secondary mb-1.5">
                    <span>Meal Voucher (Monthly)</span>
                    <span
                      title="FY 2026-27: Tax-exempt up to ₹200/meal for 2 meals/day (22 working days)."
                      className="text-accent-500 cursor-help"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </label>
                  <select
                    value={mealVoucher}
                    onChange={(e) => setMealVoucher(Number(e.target.value) as MealVoucherOption)}
                    className="glass-input text-xs font-medium"
                  >
                    <option value={0}>Opt-out (₹0)</option>
                    <option value={4400}>1 Meal/Day (₹4,400)</option>
                    <option value={8800}>2 Meals/Day (₹8,800)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-text-secondary block mb-1.5">Months</label>
                  <select
                    value={mealMonths}
                    onChange={(e) => setMealMonths(Number(e.target.value))}
                    className="glass-input text-xs font-medium"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {m} {m === 1 ? 'Month' : 'Months'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Income from other sources */}
            <div>
              <label className="flex items-center justify-between font-semibold text-text-secondary mb-1.5">
                <span>Income from other source (Annual) (₹)</span>
                <span
                  title="Includes Interest, Freelance Work, Rental Income, or other taxable income."
                  className="text-accent-500 cursor-help"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={otherIncome}
                onChange={(e) => setOtherIncome(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Right Summary & Projection Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card overflow-hidden">
            {/* Tax Projection Header */}
            <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-text-muted">
                  Total Tax Projection ({result.config.ayLabel})
                </p>
                <p className="text-3xl font-bold tracking-tight text-text-primary tabular-nums mt-0.5">
                  {formatINR(result.totalTax)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {result.rebate87A > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 text-[11px] font-semibold">
                    <Sparkles className="w-3 h-3" /> Zero Tax under Sec 87A
                  </span>
                )}
                {result.marginalRelief87A > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-500/10 text-accent-600 text-[11px] font-semibold">
                    <ShieldCheck className="w-3 h-3" /> Marginal Relief Saved{' '}
                    {formatINR(result.marginalRelief87A, 0)}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Gross vs Taxable */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Gross Income
                  </p>
                  <p className="text-lg font-bold text-text-primary mt-0.5">
                    {formatINR(result.grossTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Taxable Income
                  </p>
                  <p className="text-lg font-bold text-accent-500 mt-0.5">
                    {formatINR(result.taxableIncome)}
                  </p>
                </div>
              </div>

              {/* Income Details */}
              <div className="p-4 rounded-xl bg-surface-hover border border-border space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-text-muted text-[11px] mb-1">
                  <Landmark className="w-3.5 h-3.5" /> Income Details
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    Primary Source (
                    {category === 'SALARIED'
                      ? 'Salary'
                      : category === 'FAMILY_PENSION'
                      ? 'Family Pension'
                      : 'Business'}
                    )
                  </span>
                  <span className="font-semibold text-text-primary">
                    {formatINR(result.grossPrimary)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Other Sources</span>
                  <span className="font-semibold text-text-primary">
                    {formatINR(result.grossOther)}
                  </span>
                </div>
                {category === 'SALARIED' && (
                  <div className="flex justify-between pt-1.5 border-t border-border/60 text-text-muted">
                    <span>Basic Salary (50%)</span>
                    <span>{formatINR(result.basicSalary)}</span>
                  </div>
                )}
              </div>

              {/* Deductions & Exemptions */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 text-[11px] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Deductions &amp; Exemptions
                </div>
                {result.standardDeduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Standard Deduction</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      - {formatINR(result.standardDeduction)}
                    </span>
                  </div>
                )}
                {result.familyPensionDeduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Family Pension Deduction (1/3rd or ₹25k)</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      - {formatINR(result.familyPensionDeduction)}
                    </span>
                  </div>
                )}
                {result.npsDeduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">NPS Sec 80CCD(2) (14%)</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      - {formatINR(result.npsDeduction)}
                    </span>
                  </div>
                )}
                {result.mealExemption > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Meal Voucher Exemption</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      - {formatINR(result.mealExemption)}
                    </span>
                  </div>
                )}
                {result.totalDeductions === 0 && (
                  <p className="text-text-muted">No applicable deductions for this selection.</p>
                )}
              </div>

              {/* Base Tax, Surcharge, Cess, Effective Rate */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Base Tax</span>
                  <span className="font-semibold text-text-primary">
                    {formatINR(result.baseTax)}
                  </span>
                </div>
                {result.surcharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      Surcharge ({(result.surchargeRate * 100).toFixed(0)}%)
                    </span>
                    <span className="font-semibold text-text-primary">
                      {formatINR(result.surcharge)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">Health &amp; Education Cess (4%)</span>
                  <span className="font-semibold text-text-primary">{formatINR(result.cess)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border text-sm font-bold">
                  <span className="text-text-primary">Effective Tax Rate</span>
                  <span className="text-accent-500">{result.effectiveTaxRate.toFixed(2)}%</span>
                </div>
              </div>

              {/* Estimated Monthly TDS */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4" /> Estimated Monthly TDS
                </span>
                <span className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
                  {formatINR(result.monthlyTds, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts & Multi-Year Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Tax Distribution Chart */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-text-primary">Income &amp; Tax Breakdown</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${Math.round(v / 1000)}K`
                  }
                />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0), 'Amount']} />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                  {breakdownChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Year Tax Comparison */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Multi-Year Tax Comparison (FY 2024–25 to FY 2026–27)
            </h3>
            <p className="text-xs text-text-secondary">
              See how Budget 2024 &amp; Budget 2025 slab updates impact your tax for the same income.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {yearComparison.map((item) => {
              const isSelected = item.fyKey === fy;
              return (
                <button
                  key={item.fyKey}
                  onClick={() => setFy(item.fyKey)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-accent-500/10 border-accent-500/40 shadow-sm'
                      : 'bg-surface-hover border-border hover:border-accent-500/30'
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase text-text-muted">{item.year}</p>
                  <p className="text-lg font-extrabold text-text-primary mt-1">
                    {formatINR(item.totalTax, 0)}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Eff. Rate: {item.effectiveRate.toFixed(2)}%
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slab-wise Breakdown Table */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-text-primary">
          Slab-wise Tax Breakdown ({result.config.shortLabel})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                <th className="py-2.5 pr-4">Taxable Income Slab</th>
                <th className="py-2.5 px-4">Tax Rate</th>
                <th className="py-2.5 px-4 text-right">Income in Slab</th>
                <th className="py-2.5 pl-4 text-right">Slab Tax</th>
              </tr>
            </thead>
            <tbody>
              {result.slabBreakdown.map((slab, idx) => (
                <tr key={idx} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-text-primary">{slab.label}</td>
                  <td className="py-2.5 px-4 text-text-secondary">
                    {slab.rate === 0 ? 'Nil' : `${(slab.rate * 100).toFixed(0)}%`}
                  </td>
                  <td className="py-2.5 px-4 text-right text-text-secondary">
                    {formatINR(slab.taxableInSlab, 0)}
                  </td>
                  <td className="py-2.5 pl-4 text-right font-semibold text-text-primary">
                    {formatINR(slab.tax, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reference Rules Collapsible */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowRules((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Rules for FY 2025–26 &amp; FY 2026–27 (New Regime)
            </h3>
            <p className="text-xs text-text-secondary">
              Sec 87A ₹12 Lakh threshold, Smart Marginal Relief, Standard Deduction, NPS 80CCD(2),
              Meal Vouchers &amp; Surcharge.
            </p>
          </div>
          {showRules ? (
            <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
          )}
        </button>

        {showRules && (
          <div className="mt-5 pt-5 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-text-secondary leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-bold text-text-primary">₹12 Lakh Tax-Free Threshold (Sec 87A)</h4>
              <p>
                <strong className="text-text-primary">Full Rebate:</strong> If taxable income is up
                to ₹12,00,000 (for FY 2025–26 &amp; FY 2026–27), tax liability is reduced to zero.
              </p>
              <p>
                <strong className="text-text-primary">Marginal Relief:</strong> If taxable income
                slightly exceeds ₹12 lakh, base tax is capped at the extra income earned over ₹12
                lakh.
              </p>
              <h4 className="font-bold text-text-primary pt-2">Surcharge &amp; Cess</h4>
              <p>
                Mandatory <strong className="text-text-primary">4% Health &amp; Education Cess</strong>{' '}
                applies on tax. Surcharge starts above ₹50 lakh and is capped at 25% in the New
                Regime.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-text-primary">Key Deductions</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-text-primary">Standard Deduction:</strong> ₹75,000 for
                  salaried individuals.
                </li>
                <li>
                  <strong className="text-text-primary">Employer NPS Sec 80CCD(2):</strong> Up to
                  14% of Basic + DA for both Private/PSU and Government employees.
                </li>
                <li>
                  <strong className="text-text-primary">Meal Voucher (FY 2026–27):</strong> Up to
                  ₹200/meal for 2 meals/day (₹4,400 or ₹8,800/month based on 22 working days).
                </li>
                <li>
                  <strong className="text-text-primary">Family Pension:</strong> ₹25,000 or 1/3rd
                  of pension, whichever is lower.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
