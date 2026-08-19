// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Search } from 'lucide-react';
import { addCryptoAsset, updateCryptoAsset, searchCrypto } from '../../api/assets.api';
import type { CryptoSearchResponse } from '../../api/assets.api';
import { useQueryClient } from '@tanstack/react-query';

const addCryptoSchema = z.object({
  coinId: z.string().min(1, 'Coin ID is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  name: z.string().min(1, 'Name is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  units: z.coerce.number().min(0.00000001, 'Units must be greater than 0'),
  averageBuyPrice: z.coerce.number().min(0.01, 'Average buy price must be greater than 0'),
  notes: z.string().optional(),
});

type AddCryptoFormInputs = z.infer<typeof addCryptoSchema>;

interface Props {
  onClose: () => void;
  initialData?: any;
}

export default function AddCryptoForm({ onClose, initialData }: Props) {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(addCryptoSchema),
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Search Typeahead State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CryptoSearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
        coinId: initialData.coinId,
        symbol: initialData.symbol,
        name: initialData.name || initialData.companyName,
        purchaseDate: formattedDate,
        units: initialData.units,
        averageBuyPrice: initialData.averageBuyPrice,
        notes: initialData.notes || '',
      });
      setSearchQuery(initialData.name || initialData.coinId);
    }
  }, [initialData, reset]);

  // Debounced Search for Crypto
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2 && !initialData) {
        setIsSearching(true);
        try {
          const results = await searchCrypto(searchQuery);
          setSearchResults(results);
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
  }, [searchQuery, initialData]);

  const selectCrypto = (crypto: CryptoSearchResponse) => {
    setValue('coinId', crypto.id, { shouldValidate: true });
    setValue('symbol', crypto.symbol, { shouldValidate: true });
    setValue('name', crypto.name, { shouldValidate: true });
    setSearchQuery(`${crypto.name} (${crypto.symbol.toUpperCase()})`);
    setShowDropdown(false);
  };

  const onSubmit = async (data: AddCryptoFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      if (initialData?.id) {
        await updateCryptoAsset(initialData.id, data);
      } else {
        await addCryptoAsset(data);
      }
      queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      onClose();
    } catch (err: any) {
      let errorMessage = 'Failed to add Cryptocurrency';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pb-20 md:pb-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative border-2 border-sky-500 overflow-y-auto max-h-[70vh] md:max-h-[85vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          {initialData?.id ? 'Edit Crypto Asset' : 'Add Crypto Asset'}
        </h2>

        <>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative z-10">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Coin (e.g. Bitcoin, Ethereum)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search coins..." 
                  className="glass-input pl-9 text-gray-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                  disabled={!!initialData}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-500 animate-spin" />
                )}
              </div>

              {/* Typeahead Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-accent-500 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden z-50">
                  {searchResults.map((coin, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectCrypto(coin)}
                      className="p-3 hover:bg-sky-50 cursor-pointer border-b border-sky-100 last:border-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{coin.name}</div>
                          <div className="text-xs text-slate-500">{coin.symbol.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hidden inputs to store the selected values for React Hook Form */}
            <input type="hidden" {...register('coinId')} />
            <input type="hidden" {...register('symbol')} />
            <input type="hidden" {...register('name')} />
            {(errors.coinId || errors.symbol || errors.name) && (
              <p className="text-red-600 text-xs mt-1 font-medium">Please select a valid coin from the search.</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units (e.g. 0.05)</label>
                <input {...register('units')} type="number" step="0.00000001" className="glass-input text-gray-900" />
                {errors.units && <p className="text-red-600 text-xs mt-1 font-medium">{errors.units.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avg Buy Price (₹)</label>
                <input {...register('averageBuyPrice')} type="number" step="0.01" className="glass-input text-gray-900" />
                {errors.averageBuyPrice && <p className="text-red-600 text-xs mt-1 font-medium">{errors.averageBuyPrice.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input {...register('purchaseDate')} type="date" className="glass-input text-gray-900" />
              {errors.purchaseDate && <p className="text-red-600 text-xs mt-1 font-medium">{errors.purchaseDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea {...register('notes')} className="glass-input text-gray-900" rows={2} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData?.id ? 'Update Crypto' : 'Save Crypto')}
            </button>
          </form>
        </>
      </div>
    </div>
  );
}
