// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Home, User, GraduationCap, CreditCard, Car, HelpCircle, ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Calculator, HardDrive, FileText } from 'lucide-react';
import { getAllLiabilities, deleteLiability } from '../api/liabilities.api';
import type { LiabilityResponse } from '../api/liabilities.api';
import LiabilitySelectorModal from '../components/forms/LiabilitySelectorModal';
import AddLiabilityForm from '../components/forms/AddLiabilityForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getMyFamily } from '../api/family.api';
import { DocumentVaultModal } from '../components/documents/DocumentVaultModal';

export default function Liabilities() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [editingLiability, setEditingLiability] = useState<LiabilityResponse | null>(null);
  const [liabilityToDelete, setLiabilityToDelete] = useState<number | null>(null);
  const [selectedLiabilityForDocs, setSelectedLiabilityForDocs] = useState<{ id?: number; name?: string } | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  
  // Accordion & Amortization View State
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [amortizationViewId, setAmortizationViewId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (location.state?.parsedLiability) {
      const parsed = location.state.parsedLiability;
      const fields = parsed.fields || {};
      const lType = parsed.liabilityType || fields.liabilityType || 'PERSONAL_LOAN';
      setEditingLiability({
        ...parsed,
        ...fields,
        liabilityType: lType,
      } as unknown as LiabilityResponse);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const { data: family } = useQuery({
    queryKey: ['family', 'me'],
    queryFn: getMyFamily,
  });

  const { data: allLiabilities, isLoading } = useQuery({
    queryKey: ['liabilities', 'all'],
    queryFn: getAllLiabilities,
  });

  const confirmDelete = async () => {
    if (liabilityToDelete) {
      try {
        await deleteLiability(liabilityToDelete);
        queryClient.invalidateQueries({ queryKey: ['liabilities', 'all'] });
        queryClient.invalidateQueries({ queryKey: ['snapshots', 'all'] });
      } catch (err) {
        alert('Failed to delete liability');
      }
      setLiabilityToDelete(null);
    }
  };

  const getCategoryIcon = (type: string) => {
    if (type === 'HOME_LOAN') return <Home className="w-8 h-8 text-red-400" />;
    if (type === 'PERSONAL_LOAN') return <User className="w-8 h-8 text-red-400" />;
    if (type === 'EDUCATION_LOAN') return <GraduationCap className="w-8 h-8 text-red-400" />;
    if (type === 'CREDIT_CARD_DEBT') return <CreditCard className="w-8 h-8 text-red-400" />;
    if (type === 'VEHICLE_LOAN') return <Car className="w-8 h-8 text-red-400" />;
    return <HelpCircle className="w-8 h-8 text-red-400" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Group liabilities by type
  const groupedLiabilities = allLiabilities?.reduce((acc: any, item) => {
    if (!acc[item.liabilityType]) {
      acc[item.liabilityType] = {
        totalOutstanding: 0,
        totalEMI: 0,
        items: []
      };
    }
    acc[item.liabilityType].totalOutstanding += item.outstandingBalance || 0;
    acc[item.liabilityType].totalEMI += item.emi || 0;
    acc[item.liabilityType].items.push(item);
    return acc;
  }, {}) || {};

  // Exact Amortization Math
  const generateAmortizationSchedule = (liability: LiabilityResponse) => {
    const principal = liability.outstandingBalance;
    const rate = liability.interestRate;
    const emi = liability.emi;
    const startDateStr = liability.startDate;
    
    const schedule = [];
    if (!principal || !rate || !emi || emi <= 0) return { schedule, payoffDate: 'N/A' };

    const monthlyRate = rate / 1200;
    let balance = principal;
    let monthCount = 0;
    let totalInterest = 0;
    let totalPrincipal = 0;
    
    const startDate = startDateStr ? new Date(startDateStr) : new Date();

    // Prevent infinite loop if EMI is less than interest
    const firstMonthInterest = balance * monthlyRate;
    if (emi <= firstMonthInterest) {
      return { 
        schedule: [{ month: 1, interest: firstMonthInterest, principalPaid: 0, remainingBalance: balance }], 
        payoffDate: 'Never (EMI too low for interest)' 
      };
    }

    while (balance > 0.01 && monthCount < 360) { // Limit to 30 years to avoid crash
      monthCount++;
      const interest = balance * monthlyRate;
      let principalPaid = emi - interest;
      
      if (principalPaid > balance) {
        principalPaid = balance;
      }
      
      balance -= principalPaid;
      totalInterest += interest;
      totalPrincipal += principalPaid;
      
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(startDate.getMonth() + monthCount);

      schedule.push({
        month: monthCount,
        date: paymentDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        interest,
        principalPaid,
        remainingBalance: Math.max(0, balance)
      });
    }

    const payoffDate = startDateStr 
      ? new Date(new Date(startDateStr).setMonth(new Date(startDateStr).getMonth() + monthCount)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : new Date(new Date().setMonth(new Date().getMonth() + monthCount)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return { schedule, payoffDate, totalInterest, totalPrincipal };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading">Your Liabilities</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVaultOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <HardDrive className="w-4 h-4 text-indigo-600" />
            <span>Document Vault</span>
          </button>
          {family?.currentUserRole !== 'VIEWER' && (
            <button 
              onClick={() => setShowSelectorModal(true)}
              className="btn-primary bg-red-500 hover:bg-red-600 border-red-500"
            >
              <Plus className="w-5 h-5" />
              Add Liability
            </button>
          )}
        </div>
      </div>

      {showSelectorModal && (
        <LiabilitySelectorModal onClose={() => setShowSelectorModal(false)} />
      )}

      {editingLiability && (
        <AddLiabilityForm onClose={() => setEditingLiability(null)} initialData={editingLiability} />
      )}

      {/* Liabilities List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-text-muted">Loading liabilities...</div>
        ) : Object.keys(groupedLiabilities).length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
            <HelpCircle className="w-12 h-12 text-red-500 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2 text-text-primary">No Liabilities Found</h3>
            <p className="text-text-secondary">All clear! You currently have no tracked liabilities.</p>
          </div>
        ) : (
          Object.entries(groupedLiabilities).map(([category, data]: [string, any]) => {
            const isCategoryExpanded = expandedCategory === category;
            const displayName = category.toLowerCase().replace('_', ' ');

            return (
              <div key={category} className="glass-card overflow-hidden">
                {/* Header Row */}
                <div 
                  className={`p-6 flex flex-col sm:flex-row items-center justify-between cursor-pointer transition-colors ${isCategoryExpanded ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`}
                  onClick={() => setExpandedCategory(isCategoryExpanded ? null : category)}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                    <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-medium capitalize tracking-wide text-text-primary">{displayName}s</h2>
                      <p className="text-text-secondary text-sm">{data.items.length} Items</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-text-secondary text-sm">Total Outstanding</p>
                      <p className="text-xl font-medium text-red-400">{formatCurrency(data.totalOutstanding)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-secondary text-sm">Total Monthly EMI</p>
                      <p className="text-lg text-text-primary font-medium">{formatCurrency(data.totalEMI)}</p>
                    </div>
                    {isCategoryExpanded ? <ChevronUp className="w-6 h-6 text-text-secondary shrink-0" /> : <ChevronDown className="w-6 h-6 text-text-secondary shrink-0" />}
                  </div>
                </div>

                {/* Subcategory Details */}
                {isCategoryExpanded && (
                  <div className="border-t border-border bg-surface-hover p-4 space-y-4">
                    {data.items.map((item: LiabilityResponse) => {
                      const isAmortizationVisible = amortizationViewId === item.id;
                      const { schedule, payoffDate, totalInterest } = generateAmortizationSchedule(item);

                      return (
                        <div key={item.id} className="p-4 rounded-xl bg-surface-main border border-border space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-text-primary">{item.name}</h3>
                              {item.lenderName && <p className="text-sm text-text-secondary">Lender: {item.lenderName}</p>}
                              {item.notes && <p className="text-xs text-text-muted mt-1">Notes: {item.notes}</p>}
                            </div>

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setSelectedLiabilityForDocs({ id: item.id, name: item.name })}
                                className="p-2 text-indigo-600 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 border border-indigo-100 transition-colors flex items-center space-x-1 text-xs font-medium"
                                title="Attached documents & sanction letters"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Docs</span>
                              </button>

                              {family?.currentUserRole !== 'VIEWER' && (
                                <>
                                  <button 
                                    onClick={() => setEditingLiability(item)}
                                    className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-hover transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => setLiabilityToDelete(item.id)}
                                    className="p-2 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-text-secondary">Principal Amount</p>
                              <p className="font-semibold text-text-primary">{formatCurrency(item.principalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-text-secondary">Interest Rate</p>
                              <p className="font-semibold text-text-primary">{item.interestRate}% p.a.</p>
                            </div>
                            <div>
                              <p className="text-text-secondary">EMI Amount</p>
                              <p className="font-semibold text-text-primary">{formatCurrency(item.emi)}</p>
                            </div>
                            <div>
                              <p className="text-text-secondary">Remaining Months</p>
                              <p className="font-semibold text-text-primary">{item.tenureMonths} Months</p>
                            </div>
                          </div>

                          {/* Extra specific details */}
                          <div className="border-t border-border/50 pt-2 flex flex-wrap gap-4 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> Start Date: {item.startDate}
                            </span>
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Calculator className="w-3.5 h-3.5" /> Projected Payoff: {payoffDate}
                            </span>
                          </div>

                          {/* Amortization Button */}
                          <div>
                            <button
                              onClick={() => setAmortizationViewId(isAmortizationVisible ? null : item.id)}
                              className="text-xs font-semibold text-accent-500 hover:underline flex items-center gap-1"
                            >
                              {isAmortizationVisible ? 'Hide Amortization Schedule' : 'View Amortization & Repayment Split'}
                            </button>
                          </div>

                          {/* Repayment Schedule Table */}
                          {isAmortizationVisible && schedule.length > 0 && (
                            <div className="mt-4 border-t border-border pt-4 space-y-4">
                              <h4 className="text-sm font-semibold text-text-primary">Projected Repayment Split</h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                  <p className="text-xs text-text-secondary">Total Interest Payable</p>
                                  <p className="text-lg font-bold text-red-500">{formatCurrency(totalInterest)}</p>
                                </div>
                                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                  <p className="text-xs text-text-secondary">Total Repayment Amount</p>
                                  <p className="text-lg font-bold text-emerald-500">{formatCurrency(item.outstandingBalance + totalInterest)}</p>
                                </div>
                              </div>

                              <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-surface-hover border-b border-border text-text-secondary font-medium">
                                      <th className="p-2">Month</th>
                                      <th className="p-2">Due Date</th>
                                      <th className="p-2">Principal Repaid</th>
                                      <th className="p-2">Interest Paid</th>
                                      <th className="p-2">Remaining Outstanding</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/30">
                                    {schedule.map((row) => (
                                      <tr key={row.month} className="hover:bg-surface-hover">
                                        <td className="p-2 text-text-primary">{row.month}</td>
                                        <td className="p-2 text-text-secondary">{row.date}</td>
                                        <td className="p-2 text-emerald-500">{formatCurrency(row.principalPaid)}</td>
                                        <td className="p-2 text-red-500">{formatCurrency(row.interest)}</td>
                                        <td className="p-2 text-text-primary">{formatCurrency(row.remainingBalance)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {liabilityToDelete && (
        <ConfirmDialog 
          isOpen={true} 
          title="Delete Liability?" 
          message="Are you sure you want to permanently delete this liability? This action cannot be undone." 
          onConfirm={confirmDelete} 
          onCancel={() => setLiabilityToDelete(null)} 
        />
      )}

      <DocumentVaultModal
        isOpen={isVaultOpen || !!selectedLiabilityForDocs}
        onClose={() => {
          setIsVaultOpen(false);
          setSelectedLiabilityForDocs(null);
        }}
        liabilityId={selectedLiabilityForDocs?.id}
        liabilityName={selectedLiabilityForDocs?.name}
      />
    </div>
  );
}
