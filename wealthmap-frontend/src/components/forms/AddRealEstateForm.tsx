import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { addRealEstate, updateRealEstate, getRealEstateAsset } from '../../api/assets.api';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const addRealEstateSchema = z.object({
  propertyName: z.string().min(1, 'Property Name is required'),
  propertyType: z.string().min(1, 'Property Type is required'),
  purchasePrice: z.coerce.number().min(1, 'Purchase Price must be > 0'),
  estimatedCurrentValue: z.coerce.number().min(1, 'Current Value must be > 0'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  notes: z.string().optional(),
});

type AddRealEstateFormInputs = z.infer<typeof addRealEstateSchema>;

interface Props {
  onClose: () => void;
  initialData?: any;
}

export default function AddRealEstateForm({ onClose, initialData }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddRealEstateFormInputs>({
    resolver: zodResolver(addRealEstateSchema) as any,
    defaultValues: {
      propertyType: 'Residential'
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
        propertyName: initialData.propertyName || '',
        propertyType: initialData.propertyType || 'Residential',
        purchasePrice: initialData.purchasePrice || 0,
        estimatedCurrentValue: initialData.estimatedCurrentValue || 0,
        purchaseDate: formattedDate,
        notes: initialData.notes || '',
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: AddRealEstateFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      
      if (initialData?.id) {
        await updateRealEstate(initialData.id, data);
      } else {
        await addRealEstate(data);
      }
      queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['family', 'assets'] });
      onClose();
    } catch (err: any) {
      let errorMessage = 'Failed to save Real Estate';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data && typeof err.response.data === 'string') {
        errorMessage = err.response.data;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-6">Add Real Estate</h2>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Property Name or Address</label>
            <input {...register('propertyName')} type="text" placeholder="e.g. 3BHK Apartment in Mumbai" className="glass-input" />
            {errors.propertyName && <p className="text-red-400 text-xs mt-1">{errors.propertyName.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Property Type</label>
            <select {...register('propertyType')} className="glass-input [color-scheme:dark]">
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Land">Land / Plot</option>
            </select>
            {errors.propertyType && <p className="text-red-400 text-xs mt-1">{errors.propertyType.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Purchase Price (₹)</label>
              <input {...register('purchasePrice')} type="number" className="glass-input" />
              {errors.purchasePrice && <p className="text-red-400 text-xs mt-1">{errors.purchasePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Est. Current Value (₹)</label>
              <input {...register('estimatedCurrentValue')} type="number" className="glass-input" />
              {errors.estimatedCurrentValue && <p className="text-red-400 text-xs mt-1">{errors.estimatedCurrentValue.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Purchase Date</label>
            <input {...register('purchaseDate')} type="date" className="glass-input [color-scheme:dark]" />
            {errors.purchaseDate && <p className="text-red-400 text-xs mt-1">{errors.purchaseDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Notes (Optional)</label>
            <textarea {...register('notes')} className="glass-input resize-none" rows={2}></textarea>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Real Estate'}
          </button>
        </form>
      </div>
    </div>
  );
}
