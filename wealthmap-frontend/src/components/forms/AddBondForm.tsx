// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Landmark } from 'lucide-react';
import { addBond, updateBond } from '../../api/bonds.api';
import { useQueryClient } from '@tanstack/react-query';

import CurrencySelect, { getCurrencySymbol } from '../ui/CurrencySelect';

const addBondSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bondType: z.enum(['GOVERNMENT_BOND', 'CORPORATE_BOND', 'PPF', 'NPS', 'SOVEREIGN_GOLD_BOND', 'OTHER_DEBENTURE']),
  issuer: z.string().optional(),
  startDate: z.string().min(1, 'Start / Issue date is required'),
  maturityDate: z.string().optional(),
  investedAmount: z.coerce.number().min(1, 'Amount must be > 0'),
  currency: z.string().default('INR'),
  faceValue: z.coerce.number().optional(),
  quantity: z.coerce.number().optional(),
  couponRate: z.coerce.number().min(0, 'Interest rate cannot be negative'),
  compoundingFrequency: z.enum(['ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'CUMULATIVE_AT_MATURITY']).optional(),
  notes: z.string().optional(),
  nomineeName: z.string().optional(),
  nomineeRelationship: z.string().optional(),
});

type AddBondFormInputs = z.infer<typeof addBondSchema>;

interface Props {
  onClose: () => void;
  initialData?: any;
}

export default function AddBondForm({ onClose, initialData }: Props) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(addBondSchema),
    defaultValues: {
      bondType: 'GOVERNMENT_BOND',
      couponRate: 7.1,
      compoundingFrequency: 'ANNUAL',
      investedAmount: 10000,
      currency: 'INR',
    }
  });

  const selectedBondType = watch('bondType');
  const selectedCurrency = watch('currency') || 'INR';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

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

      const bondName = initialData.name || (initialData.issuer ? `${initialData.issuer} Bond` : 'Government Bond / PPF');
      const invAmt = initialData.investedAmount || initialData.originalInvestedAmount || initialData.principalAmount || initialData.purchasePrice || initialData.amount || 10000;
      const bType = initialData.bondType || (initialData.name?.toLowerCase().includes('ppf') ? 'PPF' : (initialData.name?.toLowerCase().includes('nps') ? 'NPS' : 'GOVERNMENT_BOND'));

      reset({
        name: bondName,
        bondType: bType,
        issuer: initialData.issuer || initialData.institutionName || initialData.bankName || '',
        startDate: formatDate(initialData.startDate || initialData.purchaseDate) || new Date().toISOString().split('T')[0],
        maturityDate: formatDate(initialData.maturityDate),
        investedAmount: invAmt,
        currency: initialData.currency || 'INR',
        faceValue: initialData.faceValue || '',
        quantity: initialData.quantity || '',
        couponRate: initialData.couponRate || initialData.interestRate || 7.0,
        compoundingFrequency: initialData.compoundingFrequency || 'ANNUAL',
        notes: initialData.notes || '',
        nomineeName: initialData.nomineeName || '',
        nomineeRelationship: initialData.nomineeRelationship || '',
      });
    }
  }, [initialData, reset]);

  // Set smart default interest rate per bond type
  useEffect(() => {
    if (!initialData) {
      if (selectedBondType === 'PPF') {
        setValue('couponRate', 7.1);
        setValue('issuer', 'Govt of India (PPF)');
        setValue('compoundingFrequency', 'ANNUAL');
      } else if (selectedBondType === 'NPS') {
        setValue('couponRate', 9.5);
        setValue('issuer', 'PFRDA / NPS Trust');
        setValue('compoundingFrequency', 'ANNUAL');
      } else if (selectedBondType === 'SOVEREIGN_GOLD_BOND') {
        setValue('couponRate', 2.5);
        setValue('issuer', 'Reserve Bank of India (SGB)');
        setValue('compoundingFrequency', 'SEMI_ANNUAL');
      } else if (selectedBondType === 'GOVERNMENT_BOND') {
        setValue('couponRate', 7.25);
        setValue('issuer', 'Reserve Bank of India');
        setValue('compoundingFrequency', 'SEMI_ANNUAL');
      }
    }
  }, [selectedBondType, setValue, initialData]);

  const onSubmit = async (data: AddBondFormInputs) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...data,
        investedAmount: Number(data.investedAmount),
        couponRate: Number(data.couponRate),
        faceValue: data.faceValue ? Number(data.faceValue) : undefined,
        quantity: data.quantity ? Number(data.quantity) : undefined,
        maturityDate: data.maturityDate || undefined,
      };

      if (initialData?.id) {
        await updateBond(initialData.id, payload);
      } else {
        await addBond(payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      await queryClient.invalidateQueries({ queryKey: ['analyticsSummary'] });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save Bond. Please try again.');
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
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Edit Bond / Debenture' : 'Add Bond / Fixed Income'}
            </h2>
            <p className="text-xs text-gray-600">Government bonds, Corporate debentures, PPF, NPS & SGBs</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Bond / Scheme Name *</label>
              <input
                {...register('name')}
                placeholder="e.g. 7.26% GS 2033 or PPF Account"
                className="glass-input"
              />
              {errors.name && <p className="text-red-600 text-xs mt-1 font-medium">{errors.name.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instrument Type *</label>
              <select
                {...register('bondType')}
                className="glass-input bg-white text-gray-900"
              >
                <option value="GOVERNMENT_BOND">Government Bond (G-Sec / T-Bill)</option>
                <option value="CORPORATE_BOND">Corporate Bond / Debenture</option>
                <option value="PPF">Public Provident Fund (PPF)</option>
                <option value="NPS">National Pension System (NPS)</option>
                <option value="SOVEREIGN_GOLD_BOND">Sovereign Gold Bond (SGB)</option>
                <option value="OTHER_DEBENTURE">Other Fixed Income / Debenture</option>
              </select>
            </div>
          </div>

          {/* Multi-Currency Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Denominated Currency</label>
            <CurrencySelect
              value={selectedCurrency}
              onChange={(code) => setValue('currency', code, { shouldValidate: true })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issuer / Authority</label>
              <input
                {...register('issuer')}
                placeholder="e.g. RBI, US Treasury, HDFC, Govt of India"
                className="glass-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Invested Amount ({getCurrencySymbol(selectedCurrency)}) *
              </label>
              <input
                type="number"
                step="any"
                {...register('investedAmount')}
                placeholder="e.g. 50000"
                className="glass-input"
              />
              {errors.investedAmount && <p className="text-red-600 text-xs mt-1 font-medium">{errors.investedAmount.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon / Annual Interest Rate (%) *</label>
              <input
                type="number"
                step="0.01"
                {...register('couponRate')}
                placeholder="e.g. 7.25"
                className="glass-input"
              />
              {errors.couponRate && <p className="text-red-600 text-xs mt-1 font-medium">{errors.couponRate.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compounding / Payout Frequency</label>
              <select
                {...register('compoundingFrequency')}
                className="glass-input bg-white text-gray-900"
              >
                <option value="ANNUAL">Annually (Standard)</option>
                <option value="SEMI_ANNUAL">Semi-Annually (Govt Bonds / SGB)</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="CUMULATIVE_AT_MATURITY">Cumulative at Maturity</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start / Issue Date *</label>
              <input
                type="date"
                {...register('startDate')}
                className="glass-input"
              />
              {errors.startDate && <p className="text-red-600 text-xs mt-1 font-medium">{errors.startDate.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maturity Date (Optional)</label>
              <input
                type="date"
                {...register('maturityDate')}
                className="glass-input"
              />
            </div>
          </div>

          {/* SGB Units / Quantity helpers */}
          {selectedBondType === 'SOVEREIGN_GOLD_BOND' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-sky-50 rounded-xl border border-sky-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gold Quantity (Grams)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('quantity')}
                  placeholder="e.g. 10"
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Price per Gram ({getCurrencySymbol(selectedCurrency)})</label>
                <input
                  type="number"
                  step="1"
                  {...register('faceValue')}
                  placeholder="e.g. 5100"
                  className="glass-input"
                />
              </div>
            </div>
          )}

          {/* Nominee details */}
          <div className="pt-2 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Nominee Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominee Name</label>
                <input
                  {...register('nomineeName')}
                  placeholder="e.g. Priya Kulkarni"
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <input
                  {...register('nomineeRelationship')}
                  placeholder="e.g. Spouse / Sibling / Child"
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
              placeholder="Certificate number, depository, or tax exemption notes..."
              className="glass-input resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? 'Update Bond' : 'Save Bond')}
          </button>
        </form>
      </div>
    </div>
  );
}
