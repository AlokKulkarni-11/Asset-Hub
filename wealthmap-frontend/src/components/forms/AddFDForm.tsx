// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { addFDAsset, updateFDAsset, getFDAsset } from '../../api/assets.api';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const addFDSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  maturityDate: z.string().min(1, 'Maturity date is required'),
  principalAmount: z.coerce.number().min(1, 'Amount must be > 0'),
  interestRate: z.coerce.number().min(0.1, 'Rate must be > 0'),
  compoundingFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']),
  notes: z.string().optional(),
});

type AddFDFormInputs = z.infer<typeof addFDSchema>;

interface Props {
  onClose: () => void;
  editAssetId?: number;
}

export default function AddFDForm({ onClose, editAssetId }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(addFDSchema),
    defaultValues: {
      compoundingFrequency: 'QUARTERLY',
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: initialData, isLoading: isFetching } = useQuery({
    queryKey: ['assets', 'fd', editAssetId],
    queryFn: () => getFDAsset(editAssetId!),
    enabled: !!editAssetId
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        bankName: initialData.bankName,
        startDate: initialData.startDate,
        maturityDate: initialData.maturityDate,
        principalAmount: initialData.principalAmount,
        interestRate: initialData.interestRate,
        compoundingFrequency: initialData.compoundingFrequency,
        notes: initialData.notes || '',
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: AddFDFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      if (editAssetId) {
        await updateFDAsset(editAssetId, data);
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
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-6">
          {editAssetId ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'}
        </h2>

        {isFetching ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Asset Name</label>
            <input {...register('name')} placeholder="e.g. SBI 5yr FD" className="glass-input" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Bank Name</label>
            <input {...register('bankName')} placeholder="e.g. State Bank of India" className="glass-input" />
            {errors.bankName && <p className="text-red-400 text-xs mt-1">{errors.bankName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Principal (₹)</label>
              <input {...register('principalAmount')} type="number" className="glass-input" />
              {errors.principalAmount && <p className="text-red-400 text-xs mt-1">{errors.principalAmount.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Interest Rate (%)</label>
              <input {...register('interestRate')} type="number" step="0.01" className="glass-input" />
              {errors.interestRate && <p className="text-red-400 text-xs mt-1">{errors.interestRate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Start Date</label>
              <input {...register('startDate')} type="date" className="glass-input [color-scheme:dark]" />
              {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Maturity Date</label>
              <input {...register('maturityDate')} type="date" className="glass-input [color-scheme:dark]" />
              {errors.maturityDate && <p className="text-red-400 text-xs mt-1">{errors.maturityDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Compounding Frequency</label>
            <select {...register('compoundingFrequency')} className="glass-input bg-navy-900">
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="HALF_YEARLY">Half Yearly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            {errors.compoundingFrequency && <p className="text-red-400 text-xs mt-1">{errors.compoundingFrequency.message}</p>}
          </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editAssetId ? 'Update Fixed Deposit' : 'Save Fixed Deposit')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
