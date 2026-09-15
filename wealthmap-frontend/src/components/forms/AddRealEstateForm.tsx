import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { addRealEstate, updateRealEstate, getRealEstateAsset } from '../../api/assets.api';
import { useQueryClient, useQuery } from '@tanstack/react-query';

import CurrencySelect, { getCurrencySymbol } from '../ui/CurrencySelect';

const addRealEstateSchema = z.object({
  propertyName: z.string().min(1, 'Property Name is required'),
  propertyType: z.string().min(1, 'Property Type is required'),
  purchasePrice: z.coerce.number().min(1, 'Purchase Price must be > 0'),
  estimatedCurrentValue: z.coerce.number().min(1, 'Current Value must be > 0'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  currency: z.string().default('INR'),
  notes: z.string().optional(),
  nomineeName: z.string().optional(),
  nomineeRelationship: z.string().optional(),
});

type AddRealEstateFormInputs = z.infer<typeof addRealEstateSchema>;

interface Props {
  onClose: () => void;
  initialData?: any;
}

export default function AddRealEstateForm({ onClose, initialData }: Props) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AddRealEstateFormInputs>({
    resolver: zodResolver(addRealEstateSchema) as any,
    defaultValues: {
      propertyType: 'Residential',
      currency: 'INR'
    }
  });

  const selectedCurrency = watch('currency') || 'INR';

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

      const pName = initialData.propertyName || initialData.name || initialData.propertyAddress || 'Real Estate Property';
      const pPrice = initialData.purchasePrice || initialData.originalInvestedAmount || initialData.investedAmount || initialData.estimatedCurrentValue || initialData.currentValue || 1000000;
      const curVal = initialData.estimatedCurrentValue || initialData.originalCurrentValue || initialData.currentValue || pPrice;

      reset({
        propertyName: pName,
        propertyType: initialData.propertyType || 'Residential',
        purchasePrice: pPrice,
        estimatedCurrentValue: curVal,
        purchaseDate: formattedDate || new Date().toISOString().split('T')[0],
        currency: initialData.currency || 'INR',
        notes: initialData.notes || '',
        nomineeName: initialData.nomineeName || '',
        nomineeRelationship: initialData.nomineeRelationship || '',
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: AddRealEstateFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Submitting Real Estate data:', data); // Debug log
      
      if (initialData?.id) {
        await updateRealEstate(initialData.id, data);
      } else {
        await addRealEstate(data);
      }
      queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['family', 'assets'] });
      onClose();
    } catch (err: any) {
      console.error('Real Estate save error:', err); // Debug log
      console.error('Error response:', err.response); // Debug log
      
      let errorMessage = 'Failed to save Real Estate';
      
      // Try to extract the most detailed error message
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data && typeof err.response.data === 'string') {
        errorMessage = err.response.data;
      } else if (err.response?.statusText) {
        errorMessage = `${err.response.status}: ${err.response.statusText}`;
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
          {initialData?.id ? 'Edit Real Estate' : 'Add Real Estate'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Name or Address</label>
            <input {...register('propertyName')} type="text" placeholder="e.g. 2BHK Apartment in Dubai / 3BHK Mumbai" className="glass-input" />
            {errors.propertyName && <p className="text-red-600 text-xs mt-1 font-medium">{errors.propertyName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select {...register('propertyType')} className="glass-input">
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Land">Land / Plot</option>
            </select>
            {errors.propertyType && <p className="text-red-600 text-xs mt-1 font-medium">{errors.propertyType.message}</p>}
          </div>

          {/* Multi-Currency Selector */}
          <CurrencySelect
            value={selectedCurrency}
            onChange={(code) => setValue('currency', code, { shouldValidate: true })}
            label="Property Currency"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price ({getCurrencySymbol(selectedCurrency)})
              </label>
              <input {...register('purchasePrice')} type="number" className="glass-input" />
              {errors.purchasePrice && <p className="text-red-600 text-xs mt-1 font-medium">{errors.purchasePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Est. Current Value ({getCurrencySymbol(selectedCurrency)})
              </label>
              <input {...register('estimatedCurrentValue')} type="number" className="glass-input" />
              {errors.estimatedCurrentValue && <p className="text-red-600 text-xs mt-1 font-medium">{errors.estimatedCurrentValue.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input {...register('purchaseDate')} type="date" className="glass-input" />
            {errors.purchaseDate && <p className="text-red-600 text-xs mt-1 font-medium">{errors.purchaseDate.message}</p>}
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Real Estate'}
          </button>
        </form>
      </div>
    </div>
  );
}
