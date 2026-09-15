// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { addFDAsset, updateFDAsset, getFDAsset } from '../../api/assets.api';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import CurrencySelect from '../ui/CurrencySelect';

const addFDSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  currency: z.string().default('INR'),
  startDate: z.string().min(1, 'Start date is required'),
  maturityDate: z.string().min(1, 'Maturity date is required'),
  principalAmount: z.coerce.number().min(1, 'Amount must be > 0'),
  interestRate: z.coerce.number().min(0.1, 'Rate must be > 0'),
  compoundingFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']),
  notes: z.string().optional(),
  nomineeName: z.string().optional(),
  nomineeRelationship: z.string().optional(),
});

type AddFDFormInputs = z.infer<typeof addFDSchema>;

interface Props {
  onClose: () => void;
  initialData?: any;
}

export default function AddFDForm({ onClose, initialData }: Props) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(addFDSchema),
    defaultValues: {
      currency: 'INR',
      compoundingFrequency: 'QUARTERLY',
    }
  });

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

      const startD = formatDate(initialData.startDate || initialData.purchaseDate) || new Date().toISOString().split('T')[0];
      let matD = formatDate(initialData.maturityDate);
      if (!matD && initialData.tenureMonths) {
        const d = new Date(startD);
        d.setMonth(d.getMonth() + Number(initialData.tenureMonths));
        matD = d.toISOString().split('T')[0];
      }
      if (!matD) {
        const d = new Date(startD);
        d.setFullYear(d.getFullYear() + 1);
        matD = d.toISOString().split('T')[0];
      }

      const bank = initialData.bankName || initialData.institutionName || initialData.lenderName || (initialData.name && !initialData.name.toLowerCase().includes('deposit') ? initialData.name : 'Bank FD');
      const fdName = initialData.name || `${bank} Fixed Deposit`;

      reset({
        name: fdName,
        bankName: bank,
        currency: initialData.currency || 'INR',
        startDate: startD,
        maturityDate: matD,
        principalAmount: initialData.principalAmount || initialData.purchasePrice || initialData.investedAmount || initialData.amount || initialData.originalInvestedAmount || 100000,
        interestRate: initialData.interestRate || initialData.interestRatePct || 7.0,
        compoundingFrequency: initialData.compoundingFrequency || 'QUARTERLY',
        notes: initialData.notes || '',
        nomineeName: initialData.nomineeName || '',
        nomineeRelationship: initialData.nomineeRelationship || '',
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: AddFDFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      if (initialData?.id) {
        await updateFDAsset(initialData.id, data);
      } else {
        await addFDAsset(data);
      }
      queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      onClose();
    } catch (err: any) {
      let errorMessage = 'Failed to add FD';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data && typeof err.response.data === 'object') {
        errorMessage = JSON.stringify(err.response.data);
      } else if (err.response?.data) {
        errorMessage = String(err.response.data);
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 pb-20 md:pb-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-slate-200 overflow-y-auto max-h-[70vh] md:max-h-[85vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          {initialData?.id ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'}
        </h2>

        <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
            <input {...register('name')} placeholder="e.g. SBI 5yr FD" className="glass-input" />
            {errors.name && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <input {...register('bankName')} placeholder="e.g. State Bank of India" className="glass-input" />
            {errors.bankName && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.bankName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <CurrencySelect
              value={selectedCurrency}
              onChange={(c) => setValue('currency', c, { shouldValidate: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount ({selectedCurrency})</label>
              <input {...register('principalAmount')} type="number" className="glass-input" />
              {errors.principalAmount && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.principalAmount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
              <input {...register('interestRate')} type="number" step="0.01" className="glass-input" />
              {errors.interestRate && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.interestRate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input {...register('startDate')} type="date" className="glass-input" />
              {errors.startDate && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maturity Date</label>
              <input {...register('maturityDate')} type="date" className="glass-input" />
              {errors.maturityDate && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.maturityDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compounding Frequency</label>
            <select {...register('compoundingFrequency')} className="glass-input bg-white text-gray-900">
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="HALF_YEARLY">Half Yearly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            {errors.compoundingFrequency && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.compoundingFrequency.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea {...register('notes')} className="glass-input resize-none" rows={2}></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominee Name</label>
              <input {...register('nomineeName')} type="text" placeholder="Optional" className="glass-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <select {...register('nomineeRelationship')} className="glass-input">
                <option value="">None / Select</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData?.id ? 'Update Fixed Deposit' : 'Save Fixed Deposit')}
              </button>
            </form>
          </>
      </div>
    </div>
  );
}

