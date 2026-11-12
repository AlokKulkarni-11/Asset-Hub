import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLiveMetalRates } from '../../api/assets.api';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const PURITIES = [
  { label: '24K', factor: 24 / 24 },
  { label: '22K', factor: 22 / 24 },
  { label: '20K', factor: 20 / 24 },
  { label: '18K', factor: 18 / 24 },
  { label: '16K', factor: 16 / 24 },
  { label: '14K', factor: 14 / 24 },
  { label: '12K', factor: 12 / 24 },
  { label: '10K', factor: 10 / 24 },
  { label: '8K', factor: 8 / 24 },
];

// Fallback 24K base rate per gram (INR, IBJA India Nov 2026)
const DEFAULT_24K_PER_GRAM = 13769.2;

// Indicative 14-day / 30-day relative trend multipliers
const TREND_OFFSETS = [
  0, -0.004, 0.006, 0.002, -0.008, 0.011, 0.015, 0.009, -0.003, -0.012,
  -0.007, 0.004, 0.01, 0.005, -0.006,
];

const formatINR = (val: number, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);

export default function GoldPriceCalculator() {
  const { data: liveRates } = useQuery({
    queryKey: ['metals', 'rates'],
    queryFn: getLiveMetalRates,
    staleTime: 1000 * 60 * 30,
  });
  const base24kPerGram = Number(liveRates?.gold24kPerGram) || DEFAULT_24K_PER_GRAM;

  const [grams, setGrams] = useState<number>(10);
  const [selectedPurity, setSelectedPurity] = useState<string>('22K');
  const [useOwnPrice, setUseOwnPrice] = useState<boolean>(false);
  const [customRatePerGram, setCustomRatePerGram] = useState<number>(12612.6);
  const [goldGstPercent, setGoldGstPercent] = useState<number>(3);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [makingChargesPercent, setMakingChargesPercent] = useState<number>(0);
  const [serviceGstPercent, setServiceGstPercent] = useState<number>(0);
  const [showHistory, setShowHistory] = useState<boolean>(true);

  const purityFactor = useMemo(
    () => PURITIES.find((p) => p.label === selectedPurity)?.factor ?? 22 / 24,
    [selectedPurity]
  );

  const activeRatePerGram = useMemo(() => {
    if (useOwnPrice) return Math.max(0, Number(customRatePerGram) || 0);
    return Math.round(base24kPerGram * purityFactor * 100) / 100;
  }, [useOwnPrice, customRatePerGram, purityFactor, base24kPerGram]);

  const result = useMemo(() => {
    const w = Math.max(0, Number(grams) || 0);
    const goldPrice = activeRatePerGram * w;
    const goldTax = goldPrice * (Math.max(0, Number(goldGstPercent) || 0) / 100);
    const makingPct = showAdvanced ? Math.max(0, Number(makingChargesPercent) || 0) / 100 : 0;
    const serviceTaxPct = showAdvanced ? Math.max(0, Number(serviceGstPercent) || 0) / 100 : 0;

    const serviceCharge = goldPrice * makingPct;
    const serviceTax = serviceCharge * serviceTaxPct;
    const total = goldPrice + goldTax + serviceCharge + serviceTax;

    const today = new Date();
    const historyRows = TREND_OFFSETS.map((offset, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() - idx);
      const dayRate = activeRatePerGram * (1 + offset);
      const dayGold = dayRate * w;
      const dayTax = dayGold * (Math.max(0, Number(goldGstPercent) || 0) / 100);
      const dayService = dayGold * makingPct;
      const dayServiceTax = dayService * serviceTaxPct;
      const dayTotal = dayGold + dayTax + dayService + dayServiceTax;
      const diffRate = dayRate - activeRatePerGram;
      const diffTotal = dayTotal - total;
      const pctDiff = activeRatePerGram > 0 ? (diffRate / activeRatePerGram) * 100 : 0;

      return {
        dateLabel: d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        ratePerUnit: dayRate,
        diffRate,
        pctDiff,
        taxOnGold: dayTax,
        serviceCharge: dayService,
        serviceTax: dayServiceTax,
        total: dayTotal,
        diffTotal,
      };
    });

    return {
      goldPrice,
      goldTax,
      serviceCharge,
      serviceTax,
      total,
      makingDisplay: showAdvanced ? makingChargesPercent : 0,
      serviceGstDisplay: showAdvanced ? serviceGstPercent : 0,
      historyRows,
    };
  }, [
    grams,
    activeRatePerGram,
    goldGstPercent,
    showAdvanced,
    makingChargesPercent,
    serviceGstPercent,
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-6 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-text-primary">
                Live Gold Price Calculator
              </h3>
            </div>
            <span className="text-xs font-mono text-text-muted tabular-nums">
              {formatINR(activeRatePerGram)} / g ({selectedPurity})
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Units (in Grams)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={grams}
                onChange={(e) => setGrams(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-2">
                Purity
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {PURITIES.map((p) => {
                  const isActive = selectedPurity === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setSelectedPurity(p.label)}
                      className={`py-1.5 px-2.5 rounded-md text-xs font-medium border transition-colors ${
                        isActive
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-surface text-text-secondary border-border hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-text-primary">
                <input
                  type="checkbox"
                  checked={useOwnPrice}
                  onChange={(e) => setUseOwnPrice(e.target.checked)}
                  className="rounded border-border text-accent-500 focus:ring-accent-500"
                />
                Own Price?
              </label>
              {useOwnPrice && (
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">
                    Custom Rate per Gram (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={customRatePerGram}
                    onChange={(e) => setCustomRatePerGram(Math.max(0, Number(e.target.value)))}
                    className="glass-input text-xs font-semibold"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                TAX / GST on Gold (in Percentage. Eg. 3)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={goldGstPercent}
                onChange={(e) => setGoldGstPercent(Math.max(0, Number(e.target.value)))}
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
                Advanced Options
              </label>

              {showAdvanced && (
                <div className="p-3 rounded-xl bg-surface-hover border border-border space-y-3">
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Making Charges (in Percentage. Eg. 20)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={makingChargesPercent}
                      onChange={(e) =>
                        setMakingChargesPercent(Math.max(0, Number(e.target.value)))
                      }
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      TAX / GST on Service (in Percentage. Eg. 3)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="0.5"
                      value={serviceGstPercent}
                      onChange={(e) => setServiceGstPercent(Math.max(0, Number(e.target.value)))}
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Price Breakdown */}
        <div className="lg:col-span-6 glass-card p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-border pb-3 mb-2">
              <h4 className="text-sm font-semibold text-text-primary">Cost Breakdown</h4>
            </div>
            <div className="divide-y divide-border/70 text-xs">
              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="font-medium text-text-primary">
                    Gold Price ({selectedPurity})
                  </p>
                  <p className="text-[11px] text-text-muted tabular-nums">
                    {formatINR(activeRatePerGram)} × {grams}g
                  </p>
                </div>
                <span className="text-sm font-semibold text-text-primary tabular-nums">
                  {formatINR(result.goldPrice)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="font-medium text-text-secondary">
                  Gold GST ({goldGstPercent}%)
                </span>
                <span className="text-sm font-medium text-text-primary tabular-nums">
                  {formatINR(result.goldTax)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="font-medium text-text-secondary">
                  Making / Service Charge ({result.makingDisplay}%)
                </span>
                <span className="text-sm font-medium text-text-primary tabular-nums">
                  {formatINR(result.serviceCharge)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="font-medium text-text-secondary">
                  Service GST ({result.serviceGstDisplay}%)
                </span>
                <span className="text-sm font-medium text-text-primary tabular-nums">
                  {formatINR(result.serviceTax)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-baseline justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-text-primary">Estimated Total Payable</p>
              <p className="text-[11px] text-text-muted">Incl. applicable GST &amp; charges</p>
            </div>
            <p className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {formatINR(result.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Price History Table */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowHistory((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Recent Price Changes ({selectedPurity} • {grams}g)
            </h3>
            <p className="text-xs text-text-secondary">
              Indicative recent trend breakdown including Gold GST and making charges.
            </p>
          </div>
          {showHistory ? (
            <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
          )}
        </button>

        {showHistory && (
          <div className="mt-4 overflow-x-auto max-h-[380px]">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 px-3 text-right">Price / Gram</th>
                  <th className="py-2 px-3 text-right">Tax on Gold</th>
                  <th className="py-2 px-3 text-right">Service Charges</th>
                  <th className="py-2 px-3 text-right">Tax on Service</th>
                  <th className="py-2 pl-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {result.historyRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-text-primary">{row.dateLabel}</td>
                    <td className="py-2 px-3 text-right">
                      <p className="font-semibold text-text-primary">
                        {formatINR(row.ratePerUnit)}
                      </p>
                      {idx > 0 && (
                        <p
                          className={`text-[10px] font-medium ${
                            row.diffRate >= 0 ? 'text-emerald-500' : 'text-red-500'
                          }`}
                        >
                          {row.diffRate >= 0 ? '+' : ''}
                          {Math.round(row.diffRate)} ({row.pctDiff.toFixed(2)}%)
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-text-secondary">
                      {formatINR(row.taxOnGold)}
                    </td>
                    <td className="py-2 px-3 text-right text-text-secondary">
                      {formatINR(row.serviceCharge)}
                    </td>
                    <td className="py-2 px-3 text-right text-text-secondary">
                      {formatINR(row.serviceTax)}
                    </td>
                    <td className="py-2 pl-3 text-right font-bold text-text-primary">
                      {formatINR(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
