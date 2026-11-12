// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { addSilverAsset, updateSilverAsset } from '../../api/assets.api';
import { useQueryClient } from '@tanstack/react-query';
import CurrencySelect from '../ui/CurrencySelect';

const addSilverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  currency: z.string().default('INR'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  notes: z.string().optional(),
  weightGrams: z.coerce.number().min(0.1, 'Weight must be > 0'),
  purity: z.enum(['P999', 'P925', 'P900', 'P800']),
  purchasePrice: z.coerce.number().min(1, 'Purchase price must be > 0'),
  nomineeName: z.string().optional(),
  nomineeRelationship: z.string().optional(),
});

type AddSilverFormInputs = z.infer<typeof addSilverSchema>;

interface Props {
  onClose: () => void;
  initialData?: any;
}

export default function AddSilverForm({ onClose, initialData }: Props) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(addSilverSchema),
    defaultValues: {
      currency: 'INR',
      purity: 'P999',
    },
  });

  const selectedCurrency = watch('currency') || 'INR';

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialData) {
      let formattedDate = '';
      if (initialData.purchaseDate) {
        if (Array.isArray(initialData.purchaseDate)) {
          const [y, m, d] = initialData.purchaseDate;
          formattedDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        } else {
          formattedDate = initialData.purchaseDate.toString().split('T')[0];
        }
      }

      const rawPurity = initialData.purity || 'P999';
      const purity =
        rawPurity === 'P999' || rawPurity === '999' ? 'P999' :
        rawPurity === 'P925' || rawPurity === '925' ? 'P925' :
        rawPurity === 'P900' || rawPurity === '900' ? 'P900' :
        rawPurity === 'P800' || rawPurity === '800' ? 'P800' : 'P999';

      reset({
        name: initialData.name || 'Physical Silver',
        currency: initialData.currency || 'INR',
        purchaseDate: formattedDate || new Date().toISOString().split('T')[0],
        notes: initialData.notes || '',
        weightGrams: initialData.weightGrams || initialData.weightInGrams || initialData.weight || initialData.quantity || 100,
        purity,
        purchasePrice: initialData.purchasePrice || initialData.originalInvestedAmount || initialData.investedAmount || initialData.currentValue || 0,
        nomineeName: initialData.nomineeName || '',
        nomineeRelationship: initialData.nomineeRelationship || '',
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: AddSilverFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      if (initialData?.id) {
        await updateSilverAsset(initialData.id, data);
      } else {
        await addSilverAsset(data);
      }
      queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      onClose();
    } catch (err: any) {
      let errorMessage = 'Failed to save Silver';
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
          {initialData?.id ? 'Edit Silver Asset' : 'Add Silver Asset'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
            <input {...register('name')} placeholder="e.g. 999 Silver Bar" className="glass-input" />
            {errors.name && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
              <input {...register('weightGrams')} type="number" step="0.01" className="glass-input" />
              {errors.weightGrams && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.weightGrams.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
              <select {...register('purity')} className="glass-input bg-white text-gray-900">
                <option value="P999">999 Fine Silver (99.9%)</option>
                <option value="P925">925 Sterling Silver (92.5%)</option>
                <option value="P900">900 Coin Silver (90.0%)</option>
                <option value="P800">800 Silver (80.0%)</option>
              </select>
              {errors.purity && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.purity.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <CurrencySelect
              value={selectedCurrency}
              onChange={(c) => setValue('currency', c, { shouldValidate: true })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (Total {selectedCurrency})</label>
            <input {...register('purchasePrice')} type="number" className="glass-input" />
            {errors.purchasePrice && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.purchasePrice.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input {...register('purchaseDate')} type="date" className="glass-input" />
            {errors.purchaseDate && <p className="text-red-600 font-medium text-xs mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.purchaseDate.message}</p>}
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData?.id ? 'Update Silver Asset' : 'Save Silver Asset')}
          </button>
        </form>
      </div>
    </div>
  );
}
