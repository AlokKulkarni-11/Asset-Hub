// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { addGoldAsset, updateGoldAsset, getGoldAsset } from '../../api/assets.api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const addGoldSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  notes: z.string().optional(),
  weightGrams: z.coerce.number().min(0.1, 'Weight must be > 0'),
  purity: z.enum(['K18', 'K20', 'K22', 'K24']),
  purchasePrice: z.coerce.number().min(1, 'Purchase price must be > 0'),
});

type AddGoldFormInputs = z.infer<typeof addGoldSchema>;

interface Props {
  onClose: () => void;
  initialData?: any;
}

export default function AddGoldForm({ onClose, initialData }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(addGoldSchema),
    defaultValues: {
      purity: 'K24',
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialData) {
      // Format date to YYYY-MM-DD
      let formattedDate = '';
      if (initialData.purchaseDate) {
        if (Array.isArray(initialData.purchaseDate)) {
          const [y, m, d] = initialData.purchaseDate;
          formattedDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        } else {
          formattedDate = initialData.purchaseDate.toString().split('T')[0];
        }
      }

      reset({
        name: initialData.name,
        purchaseDate: formattedDate,
        notes: initialData.notes || '',
        weightGrams: initialData.weightInGrams || initialData.weight,
        purity: initialData.purity,
        purchasePrice: initialData.purchasePrice,
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: AddGoldFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      if (initialData?.id) {
        await updateGoldAsset(initialData.id, data);
      } else {
        await addGoldAsset(data);
      }
      queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      onClose();
    } catch (err: any) {
      let errorMessage = 'Failed to add Gold';
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
          {initialData?.id ? 'Edit Gold Asset' : 'Add Gold Asset'}
        </h2>

        <>
            {error && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Asset Name</label>
                <input {...register('name')} placeholder="e.g. 24K Gold Coin" className="glass-input" />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Weight (g)</label>
                  <input {...register('weightGrams')} type="number" step="0.01" className="glass-input" />
                  {errors.weightGrams && <p className="text-red-400 text-xs mt-1">{errors.weightGrams.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Purity</label>
                  <select {...register('purity')} className="glass-input bg-navy-900">
                    <option value="K24">24 Karat (99.9%)</option>
                    <option value="K22">22 Karat (91.6%)</option>
                    <option value="K20">20 Karat (83.3%)</option>
                    <option value="K18">18 Karat (75.0%)</option>
                  </select>
                  {errors.purity && <p className="text-red-400 text-xs mt-1">{errors.purity.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">Purchase Price (Total ₹)</label>
                <input {...register('purchasePrice')} type="number" className="glass-input" />
                {errors.purchasePrice && <p className="text-red-400 text-xs mt-1">{errors.purchasePrice.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">Purchase Date</label>
                <input {...register('purchaseDate')} type="date" className="glass-input [color-scheme:dark]" />
                {errors.purchaseDate && <p className="text-red-400 text-xs mt-1">{errors.purchaseDate.message}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData?.id ? 'Update Gold Asset' : 'Save Gold Asset')}
              </button>
            </form>
          </>
      </div>
    </div>
  );
}

