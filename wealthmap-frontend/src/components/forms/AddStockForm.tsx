// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Search } from 'lucide-react';
import { addStockAsset, updateStockAsset, getStockAsset, searchStocks } from '../../api/assets.api';
import type { StockSearchResponse } from '../../api/assets.api';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const addStockSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required'),
  companyName: z.string().min(1, 'Company name is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
  averageBuyPrice: z.coerce.number().min(0.01, 'Buy price must be > 0'),
  notes: z.string().optional(),
});

type AddStockFormInputs = z.infer<typeof addStockSchema>;

interface Props {
  onClose: () => void;
  editAssetId?: number;
}

export default function AddStockForm({ onClose, editAssetId }: Props) {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(addStockSchema),
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Search Typeahead State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: initialData, isLoading: isFetching } = useQuery({
    queryKey: ['assets', 'stock', editAssetId],
    queryFn: () => getStockAsset(editAssetId!),
    enabled: !!editAssetId
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ticker: initialData.ticker,
        companyName: initialData.companyName,
        purchaseDate: initialData.purchaseDate.split('T')[0],
        quantity: initialData.quantity,
        averageBuyPrice: initialData.averageBuyPrice,
        notes: initialData.notes || '',
      });
      setSearchQuery(initialData.ticker);
    }
  }, [initialData, reset]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchStocks(searchQuery);
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
  }, [searchQuery]);

  const selectStock = (stock: StockSearchResponse) => {
    setValue('ticker', stock.symbol, { shouldValidate: true });
    setValue('companyName', stock.companyName, { shouldValidate: true });
    setSearchQuery(stock.symbol);
    setShowDropdown(false);
  };

  const onSubmit = async (data: AddStockFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      if (editAssetId) {
        await updateStockAsset(editAssetId, data);
      } else {
        await addStockAsset(data);
      }
      queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      onClose();
    } catch (err: any) {
      let errorMessage = 'Failed to add Stock';
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
          {editAssetId ? 'Edit Stock Position' : 'Add Stock Position'}
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
          <div className="relative z-10">
            <label className="block text-sm text-text-secondary mb-1">Search Ticker (e.g. RELIANCE.NS)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text"
                placeholder="Search stocks..." 
                className="glass-input pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-400 animate-spin" />
              )}
            </div>

            {/* Typeahead Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-navy-900 border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                {searchResults.map((stock, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => selectStock(stock)}
                    className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-white">{stock.symbol}</div>
                      <div className="text-xs text-text-secondary line-clamp-1">{stock.companyName}</div>
                    </div>
                    <div className="text-[10px] px-2 py-1 bg-navy-950 rounded-md text-gold-400 ml-2 whitespace-nowrap">
                      {stock.exchange}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hidden inputs to store the selected values for React Hook Form */}
          <input type="hidden" {...register('ticker')} />
          <input type="hidden" {...register('companyName')} />
          {(errors.ticker || errors.companyName) && (
             <p className="text-red-400 text-xs mt-1">Please select a valid stock from the dropdown.</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Quantity</label>
              <input {...register('quantity')} type="number" step="0.01" className="glass-input" />
              {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Avg Buy Price (₹)</label>
              <input {...register('averageBuyPrice')} type="number" step="0.01" className="glass-input" />
              {errors.averageBuyPrice && <p className="text-red-400 text-xs mt-1">{errors.averageBuyPrice.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Purchase Date</label>
            <input {...register('purchaseDate')} type="date" className="glass-input [color-scheme:dark]" />
            {errors.purchaseDate && <p className="text-red-400 text-xs mt-1">{errors.purchaseDate.message}</p>}
          </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editAssetId ? 'Update Stock' : 'Save Stock')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
