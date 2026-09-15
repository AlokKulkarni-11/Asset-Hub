// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Sparkles, Building, DollarSign, IndianRupee } from 'lucide-react';
import { addEsopRsu, updateEsopRsu } from '../../api/esops.api';
import { useQueryClient } from '@tanstack/react-query';

import CurrencySelect, { getCurrencySymbol } from '../ui/CurrencySelect';

const addEsopRsuSchema = z.object({
  name: z.string().min(1, 'Plan or company name is required'),
  planType: z.enum(['ESOP', 'RSU']),
  companyName: z.string().min(1, 'Company name is required'),
  ticker: z.string().optional(),
  grantDate: z.string().optional(),
  vestingStartDate: z.string().optional(),
  totalUnitsGranted: z.coerce.number().min(0.01, 'Total units must be > 0'),
  vestedUnits: z.coerce.number().min(0, 'Vested units cannot be negative'),
  unvestedUnits: z.coerce.number().optional(),
  strikePrice: z.coerce.number().min(0, 'Strike price cannot be negative').optional(),
  currentStockPrice: z.coerce.number().min(0.01, 'Current share price must be > 0'),
  currency: z.string().default('INR'),
  notes: z.string().optional(),
  nomineeName: z.string().optional(),
  nomineeRelationship: z.string().optional(),
});

type AddEsopRsuFormInputs = z.infer<typeof addEsopRsuSchema>;

interface Props {
  onClose: () => void;
  initialData?: any;
}

export default function AddEsopRsuForm({ onClose, initialData }: Props) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(addEsopRsuSchema),
    defaultValues: {
      planType: 'ESOP',
      currency: 'INR',
      strikePrice: 0,
      totalUnitsGranted: 1000,
      vestedUnits: 250,
      unvestedUnits: 750,
      currentStockPrice: 100,
    }
  });

  const planType = watch('planType');
  const totalUnits = watch('totalUnitsGranted');
  const vestedUnits = watch('vestedUnits');
  const strikePrice = watch('strikePrice') || 0;
  const currentStockPrice = watch('currentStockPrice') || 0;
  const currency = watch('currency');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Auto-calculate unvested units
  useEffect(() => {
    if (totalUnits !== undefined && vestedUnits !== undefined) {
      const unvested = Math.max(0, Number(totalUnits) - Number(vestedUnits));
      setValue('unvestedUnits', unvested);
    }
  }, [totalUnits, vestedUnits, setValue]);

  // Adjust default strike price when switching to RSU
  useEffect(() => {
    if (!initialData) {
      if (planType === 'RSU') {
        setValue('strikePrice', 0);
      }
    }
  }, [planType, setValue, initialData]);

  useEffect(() => {
    if (initialData) {
      const formatDate = (dateVal: any) => {
        if (!dateVal) return '';
        if (Array.isArray(dateVal)) {
          const [y, m, d] = dateVal;
          return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
        return dateVal.toString().split('T')[0];
      };

      const compName = initialData.companyName || initialData.name || 'Company ESOP/RSU';
      const totUnits = initialData.totalUnitsGranted || initialData.quantity || initialData.units || 1000;
      const vestUnits = initialData.vestedUnits !== undefined ? initialData.vestedUnits : Math.round(totUnits * 0.25);
      const unvestUnits = initialData.unvestedUnits !== undefined ? initialData.unvestedUnits : Math.max(0, totUnits - vestUnits);
      const curPrice = initialData.currentStockPrice || initialData.purchasePrice || initialData.averageBuyPrice || 100;

      reset({
        name: initialData.name || `${compName} Stock Grant`,
        planType: initialData.planType || 'ESOP',
        companyName: compName,
        ticker: initialData.ticker || '',
        grantDate: formatDate(initialData.grantDate || initialData.purchaseDate) || new Date().toISOString().split('T')[0],
        vestingStartDate: formatDate(initialData.vestingStartDate) || formatDate(initialData.grantDate || initialData.purchaseDate) || new Date().toISOString().split('T')[0],
        totalUnitsGranted: totUnits,
        vestedUnits: vestUnits,
        unvestedUnits: unvestUnits,
        strikePrice: initialData.strikePrice || 0,
        currentStockPrice: curPrice,
        currency: initialData.currency || 'INR',
        notes: initialData.notes || '',
        nomineeName: initialData.nomineeName || '',
        nomineeRelationship: initialData.nomineeRelationship || '',
      });
    }
  }, [initialData, reset]);

  const estimatedVestedVal = (Number(vestedUnits) || 0) * (Number(currentStockPrice) || 0);
  const estimatedExercisableGain = (Number(vestedUnits) || 0) * Math.max(0, (Number(currentStockPrice) || 0) - (Number(strikePrice) || 0));

  const onSubmit = async (data: AddEsopRsuFormInputs) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...data,
        totalUnitsGranted: Number(data.totalUnitsGranted),
        vestedUnits: Number(data.vestedUnits),
        unvestedUnits: Number(data.unvestedUnits || 0),
        strikePrice: Number(data.strikePrice || 0),
        currentStockPrice: Number(data.currentStockPrice),
      };

      if (initialData?.id) {
        await updateEsopRsu(initialData.id, payload);
      } else {
        await addEsopRsu(payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      await queryClient.invalidateQueries({ queryKey: ['analyticsSummary'] });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save ESOP/RSU. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 pb-20 md:pb-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 relative border border-slate-200 overflow-y-auto max-h-[70vh] md:max-h-[85vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Edit ESOP / RSU Grant' : 'Add ESOPs / RSUs'}
            </h2>
            <p className="text-xs text-gray-600">Track employee stock ownership, vesting schedules & unrealized gains</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan / Holding Name *</label>
              <input
                {...register('name')}
                placeholder="e.g. Google Series B ESOP or RSUs"
                className="glass-input"
              />
              {errors.name && <p className="text-red-600 text-xs mt-1 font-medium">{errors.name.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equity Instrument Type *</label>
              <select
                {...register('planType')}
                className="glass-input bg-white text-gray-900"
              >
                <option value="ESOP">ESOP (Employee Stock Options - with Strike Price)</option>
                <option value="RSU">RSU (Restricted Stock Units - Zero Strike Price)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                {...register('companyName')}
                placeholder="e.g. Google, Microsoft, Swiggy, Startup"
                className="glass-input"
              />
              {errors.companyName && <p className="text-red-600 text-xs mt-1 font-medium">{errors.companyName.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Ticker (Optional)</label>
              <input
                {...register('ticker')}
                placeholder="e.g. GOOGL, INFY.NS"
                className="glass-input uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Units Granted *</label>
              <input
                type="number"
                step="any"
                {...register('totalUnitsGranted')}
                placeholder="e.g. 1000"
                className="glass-input"
              />
              {errors.totalUnitsGranted && <p className="text-red-600 text-xs mt-1 font-medium">{errors.totalUnitsGranted.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vested Units *</label>
              <input
                type="number"
                step="any"
                {...register('vestedUnits')}
                placeholder="e.g. 250"
                className="glass-input"
              />
              {errors.vestedUnits && <p className="text-red-600 text-xs mt-1 font-medium">{errors.vestedUnits.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unvested Units</label>
              <input
                type="number"
                step="any"
                {...register('unvestedUnits')}
                placeholder="e.g. 750"
                className="glass-input bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {planType === 'ESOP' ? 'Strike / Exercise Price' : 'Grant Value / Cost Basis'}
              </label>
              <input
                type="number"
                step="any"
                {...register('strikePrice')}
                placeholder="0 for RSUs"
                className="glass-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Share Price *</label>
              <input
                type="number"
                step="any"
                {...register('currentStockPrice')}
                placeholder="e.g. 150"
                className="glass-input"
              />
              {errors.currentStockPrice && <p className="text-red-600 text-xs mt-1 font-medium">{errors.currentStockPrice.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grant Currency</label>
              <CurrencySelect
                value={currency}
                onChange={(code) => setValue('currency', code, { shouldValidate: true })}
              />
            </div>
          </div>

          {/* Real-time calculated preview box */}
          <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-xs space-y-1.5">
            <div className="flex justify-between text-gray-700">
              <span>Vested Current Value:</span>
              <span className="font-semibold text-gray-900">
                {getCurrencySymbol(currency)}{estimatedVestedVal.toLocaleString('en-IN')}
              </span>
            </div>
            {planType === 'ESOP' && (
              <div className="flex justify-between text-gray-700">
                <span>Exercisable Net Gain:</span>
                <span className="font-semibold text-emerald-600">
                  {getCurrencySymbol(currency)}{estimatedExercisableGain.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grant Date</label>
              <input
                type="date"
                {...register('grantDate')}
                className="glass-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vesting Start Date</label>
              <input
                type="date"
                {...register('vestingStartDate')}
                className="glass-input"
              />
            </div>
          </div>

          {/* Nominee details */}
          <div className="pt-2 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Nominee Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominee Name</label>
                <input
                  {...register('nomineeName')}
                  placeholder="e.g. Family Nominee"
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <input
                  {...register('nomineeRelationship')}
                  placeholder="e.g. Spouse / Child"
                  className="glass-input"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Vesting schedule milestones (e.g. 25% 1-yr cliff + monthly thereafter)..."
              className="glass-input resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? 'Update Equity' : 'Add Equity Grant')}
          </button>
        </form>
      </div>
    </div>
  );
}
