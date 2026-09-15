// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { addLiability, updateLiability } from '../../api/liabilities.api';
import { useQueryClient } from '@tanstack/react-query';
import { DocumentUploadAiParser } from '../documents/DocumentUploadAiParser';

const liabilitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  liabilityType: z.string(),
  principalAmount: z.coerce.number().min(0.01, 'Principal must be greater than 0'),
  interestRate: z.coerce.number().min(0, 'Interest rate must be 0 or more'),
  tenureMonths: z.coerce.number().min(1, 'Tenure must be at least 1 month'),
  outstandingBalance: z.coerce.number().min(0, 'Outstanding balance must be 0 or more'),
  emi: z.coerce.number().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  notes: z.string().optional(),

  // Subtype fields
  lenderName: z.string().optional(),
  propertyAddress: z.string().optional(),
  purpose: z.string().optional(),
  institutionName: z.string().optional(),
  cardIssuer: z.string().optional(),
  lastFourDigits: z.string().optional(),
  vehicleModel: z.string().optional(),
  descriptionDetail: z.string().optional(),
});

type LiabilityFormInputs = z.infer<typeof liabilitySchema>;

interface Props {
  type?: string;
  onClose: () => void;
  initialData?: any;
}

export default function AddLiabilityForm({ type, onClose, initialData }: Props) {
  const liabilityType = type || initialData?.liabilityType || 'PERSONAL_LOAN';

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(liabilitySchema),
    defaultValues: {
      liabilityType: liabilityType,
    }
  });

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

      const lender = initialData.lenderName || initialData.bankName || initialData.institutionName || '';
      const lType = initialData.liabilityType || type || 'PERSONAL_LOAN';
      const defaultName = lender ? `${lender} Loan` : (lType ? lType.toLowerCase().replace(/_/g, ' ') : 'Loan');
      const nameVal = initialData.name || defaultName;
      const principal = initialData.principalAmount || initialData.originalAmount || initialData.amount || initialData.loanAmount || initialData.purchasePrice || initialData.investedAmount || 100000;
      const outstanding = initialData.outstandingBalance !== undefined ? initialData.outstandingBalance : principal;
      const rate = initialData.interestRate || initialData.interestRatePct || 8.5;
      const tenure = initialData.tenureMonths || (initialData.tenureYears ? initialData.tenureYears * 12 : 60);
      const emiVal = initialData.emi || initialData.monthlyEmi;

      reset({
        name: nameVal,
        liabilityType: lType,
        principalAmount: principal,
        interestRate: rate,
        tenureMonths: tenure,
        outstandingBalance: outstanding,
        emi: emiVal,
        startDate: formatDate(initialData.startDate || initialData.purchaseDate) || new Date().toISOString().split('T')[0],
        notes: initialData.notes || '',
        lenderName: lender,
        propertyAddress: initialData.propertyAddress || '',
        purpose: initialData.purpose || '',
        institutionName: initialData.institutionName || lender,
        cardIssuer: initialData.cardIssuer || lender,
        lastFourDigits: initialData.lastFourDigits || '',
        vehicleModel: initialData.vehicleModel || '',
        descriptionDetail: initialData.descriptionDetail || '',
      });
    }
  }, [initialData, reset, type]);

  const onSubmit = async (data: LiabilityFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      if (initialData?.id) {
        await updateLiability(initialData.id, data);
      } else {
        await addLiability(data);
      }
      queryClient.invalidateQueries({ queryKey: ['liabilities', 'all'] });
      onClose();
    } catch (err: any) {
      let errorMessage = 'Failed to save Liability';
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

  const getTypeName = (t: string) => {
    return t ? t.toLowerCase().replace(/_/g, ' ') : '';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 pb-20 md:pb-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-slate-200 overflow-y-auto max-h-[70vh] md:max-h-[85vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-4 text-gray-900 capitalize">
          {initialData?.id ? `Edit ${getTypeName(liabilityType)}` : `Add ${getTypeName(liabilityType)}`}
        </h2>

        {!initialData?.id && (
          <DocumentUploadAiParser
            assetType="LIABILITY"
            onExtracted={(extracted) => {
              if (extracted.name) setValue('name', extracted.name);
              if (extracted.lenderName || extracted.bankName) setValue('lenderName', extracted.lenderName || extracted.bankName);
              if (extracted.principalAmount || extracted.originalAmount || extracted.amount) {
                setValue('principalAmount', extracted.principalAmount || extracted.originalAmount || extracted.amount);
                if (!extracted.outstandingBalance) setValue('outstandingBalance', extracted.principalAmount || extracted.originalAmount || extracted.amount);
              }
              if (extracted.outstandingBalance) setValue('outstandingBalance', extracted.outstandingBalance);
              if (extracted.interestRate) setValue('interestRate', extracted.interestRate);
              if (extracted.tenureMonths) setValue('tenureMonths', extracted.tenureMonths);
              if (extracted.monthlyEmi || extracted.emi) setValue('emi', extracted.monthlyEmi || extracted.emi);
              if (extracted.startDate) setValue('startDate', extracted.startDate);
            }}
            className="mb-4"
          />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('liabilityType')} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input {...register('name')} placeholder="e.g. SBI Home Loan" className="glass-input text-gray-900" />
            {errors.name && <p className="text-red-600 text-xs mt-1 font-medium">{errors.name.message}</p>}
          </div>

          {/* Subtype-Specific Fields */}
          {(liabilityType === 'HOME_LOAN' || liabilityType === 'PERSONAL_LOAN' || liabilityType === 'EDUCATION_LOAN' || liabilityType === 'VEHICLE_LOAN') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lender Name</label>
              <input {...register('lenderName')} placeholder="e.g. HDFC Bank" className="glass-input text-gray-900" />
            </div>
          )}

          {liabilityType === 'HOME_LOAN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
              <input {...register('propertyAddress')} placeholder="e.g. Flat 402, Sunshine Apts" className="glass-input text-gray-900" />
            </div>
          )}

          {liabilityType === 'PERSONAL_LOAN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
              <input {...register('purpose')} placeholder="e.g. Medical emergency" className="glass-input text-gray-900" />
            </div>
          )}

          {liabilityType === 'EDUCATION_LOAN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
              <input {...register('institutionName')} placeholder="e.g. Stanford University" className="glass-input text-gray-900" />
            </div>
          )}

          {liabilityType === 'CREDIT_CARD_DEBT' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Issuer</label>
                <input {...register('cardIssuer')} placeholder="e.g. ICICI Bank" className="glass-input text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last 4 Digits</label>
                <input {...register('lastFourDigits')} maxLength={4} placeholder="e.g. 1234" className="glass-input text-gray-900" />
              </div>
            </div>
          )}

          {liabilityType === 'VEHICLE_LOAN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
              <input {...register('vehicleModel')} placeholder="e.g. Honda City" className="glass-input text-gray-900" />
            </div>
          )}

          {liabilityType === 'OTHER_LIABILITY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description Detail</label>
              <input {...register('descriptionDetail')} placeholder="e.g. Borrowed from friend" className="glass-input text-gray-900" />
            </div>
          )}

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (₹)</label>
              <input {...register('principalAmount')} type="number" step="0.01" className="glass-input text-gray-900" />
              {errors.principalAmount && <p className="text-red-600 text-xs mt-1 font-medium">{errors.principalAmount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
              <input {...register('interestRate')} type="number" step="0.01" className="glass-input text-gray-900" />
              {errors.interestRate && <p className="text-red-600 text-xs mt-1 font-medium">{errors.interestRate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (Months)</label>
              <input {...register('tenureMonths')} type="number" className="glass-input text-gray-900" />
              {errors.tenureMonths && <p className="text-red-600 text-xs mt-1 font-medium">{errors.tenureMonths.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outstanding Balance (₹)</label>
              <input {...register('outstandingBalance')} type="number" step="0.01" className="glass-input text-gray-900" />
              {errors.outstandingBalance && <p className="text-red-600 text-xs mt-1 font-medium">{errors.outstandingBalance.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">EMI (₹, Optional)</label>
              <input {...register('emi')} type="number" step="0.01" placeholder="Calculated if empty" className="glass-input text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input {...register('startDate')} type="date" className="glass-input text-gray-900" />
              {errors.startDate && <p className="text-red-600 text-xs mt-1 font-medium">{errors.startDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} className="glass-input text-gray-900" rows={2} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData?.id ? 'Update Liability' : 'Save Liability')}
          </button>
        </form>
      </div>
    </div>
  );
}
