import React, { useState } from 'react';
import { X, Home, User, GraduationCap, CreditCard, Car, HelpCircle } from 'lucide-react';
import AddLiabilityForm from './AddLiabilityForm';

interface Props {
  onClose: () => void;
}

export type LiabilityType = 'HOME_LOAN' | 'PERSONAL_LOAN' | 'EDUCATION_LOAN' | 'CREDIT_CARD_DEBT' | 'VEHICLE_LOAN' | 'OTHER_LIABILITY' | null;

export default function LiabilitySelectorModal({ onClose }: Props) {
  const [selectedType, setSelectedType] = useState<LiabilityType>(null);

  const liabilityTypes = [
    { id: 'HOME_LOAN', name: 'Home Loan', description: 'Mortgages and housing finance', icon: Home },
    { id: 'PERSONAL_LOAN', name: 'Personal Loan', description: 'Unsecured personal finance', icon: User },
    { id: 'EDUCATION_LOAN', name: 'Education Loan', description: 'Student and academic loans', icon: GraduationCap },
    { id: 'CREDIT_CARD_DEBT', name: 'Credit Card Debt', description: 'Outstanding credit card balances', icon: CreditCard },
    { id: 'VEHICLE_LOAN', name: 'Vehicle Loan', description: 'Car, bike, or auto loans', icon: Car },
    { id: 'OTHER_LIABILITY', name: 'Other Liability', description: 'Other debts and financial obligations', icon: HelpCircle },
  ];

  if (selectedType) {
    return <AddLiabilityForm type={selectedType} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 relative border border-slate-200 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-semibold mb-2 text-gray-900">Add New Liability</h2>
        <p className="text-gray-600 mb-8 font-medium">Select the type of liability you want to track</p>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liabilityTypes.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id as LiabilityType)}
              className="flex items-center gap-4 p-4 rounded-xl border border-sky-100 bg-sky-50/50 hover:bg-sky-100 hover:border-accent-500/40 transition-all text-left group shadow-sm"
            >
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-accent-500 shadow-sm group-hover:scale-105 transition-all">
                <item.icon className="w-6 h-6 text-accent-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-base">{item.name}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-normal">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
