import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Search } from 'lucide-react';
import { addMutualFund, searchMutualFunds, updateMutualFund, getMutualFundAsset } from '../../api/assets.api';
import type { MutualFundSearchResponse } from '../../api/assets.api';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const addMutualFundSchema = z.object({
  schemeCode: z.string().min(1, 'Scheme Code is required'),
  schemeName: z.string().min(1, 'Scheme Name is required'),
  folioNumber: z.string().optional(),
  units: z.coerce.number().min(0.001, 'Units must be > 0'),
  averageNav: z.coerce.number().min(0.01, 'Average NAV must be > 0'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  notes: z.string().optional(),
});

type AddMutualFundFormInputs = z.infer<typeof addMutualFundSchema>;

interface Props {
  onClose: () => void;
  initialData?: any;
}

export default function AddMutualFundForm({ onClose, initialData }: Props) {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<AddMutualFundFormInputs>({
    resolver: zodResolver(addMutualFundSchema) as any,
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
        schemeCode: initialData.schemeCode?.toString() || '',
        schemeName: initialData.schemeName || '',
        folioNumber: initialData.folioNumber || '',
        units: initialData.units || 0,
        averageNav: initialData.averageNav || 0,
        purchaseDate: formattedDate,
        notes: initialData.notes || '',
      });
      setSearchQuery(initialData.schemeName || '');
    }
  }, [initialData, reset]);

  // Search Typeahead State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MutualFundSearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 3) {
        setIsSearching(true);
        try {
          const results = await searchMutualFunds(searchQuery);
          setSearchResults(results.slice(0, 50)); // Limit to 50 results
          setShowDropdown(true);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectFund = (fund: MutualFundSearchResponse) => {
    setValue('schemeCode', fund.schemeCode.toString(), { shouldValidate: true });
    setValue('schemeName', fund.schemeName, { shouldValidate: true });
    setSearchQuery(fund.schemeName);
    setShowDropdown(false);
  };

  const onSubmit = async (data: AddMutualFundFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      
      if (initialData?.id) {
        await updateMutualFund(initialData?.id, data);
      } else {
        await addMutualFund(data);
      }
      
      queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['family', 'assets'] });
      onClose();
    } catch (err: any) {
      let errorMessage = 'Failed to save Mutual Fund';
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
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-6">{initialData?.id ? 'Edit' : 'Add'} Mutual Fund</h2>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative z-10">
            <label className="block text-sm text-text-secondary mb-1">Search Mutual Fund</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text"
                placeholder="e.g. Parag Parikh Flexi Cap" 
                className="glass-input pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 3 && setShowDropdown(true)}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-400 animate-spin" />
              )}
            </div>

            {/* Typeahead Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-navy-900 border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                {searchResults.map((fund, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => selectFund(fund)}
                    className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-white text-sm">{fund.schemeName}</div>
                      <div className="text-xs text-text-secondary mt-1">Code: {fund.schemeCode}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hidden inputs to store the selected values for React Hook Form */}
          <input type="hidden" {...register('schemeCode')} />
          <input type="hidden" {...register('schemeName')} />
          {(errors.schemeCode || errors.schemeName) && (
             <p className="text-red-400 text-xs mt-1">Please select a valid Mutual Fund from the dropdown.</p>
          )}

          <div>
            <label className="block text-sm text-text-secondary mb-1">Folio Number (Optional)</label>
            <input {...register('folioNumber')} type="text" className="glass-input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Units</label>
              <input {...register('units')} type="number" step="0.001" className="glass-input" />
              {errors.units && <p className="text-red-400 text-xs mt-1">{errors.units.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Avg Buy NAV (₹)</label>
              <input {...register('averageNav')} type="number" step="0.01" className="glass-input" />
              {errors.averageNav && <p className="text-red-400 text-xs mt-1">{errors.averageNav.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Purchase Date</label>
            <input {...register('purchaseDate')} type="date" className="glass-input [color-scheme:dark]" />
            {errors.purchaseDate && <p className="text-red-400 text-xs mt-1">{errors.purchaseDate.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Mutual Fund'}
          </button>
        </form>
      </div>
    </div>
  );
}
