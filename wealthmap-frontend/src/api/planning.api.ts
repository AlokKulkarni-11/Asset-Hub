import api from './axios';

export interface EmergencyFundRequest {
  monthlyExpense: number;
  targetMonths: number;
}

export interface EmergencyFundResponse {
  id?: number;
  monthlyExpense: number;
  targetMonths: number;
  targetCorpus: number;
  currentLiquidAssets: number;
  progressPercentage: number;
}



export interface RetirementRequest {
  currentAge: number;
  retirementAge: number;
  desiredMonthlyExpenseToday: number;
  expectedReturnRate: number;
  inflationRate: number;
}

export interface RetirementResponse {
  yearsToRetirement: number;
  inflationAdjustedMonthlyExpense: number;
  requiredRetirementCorpus: number;
  projectedNetWorthAtRetirement: number;
  shortfallOrSurplus: number;
  readinessPercentage: number;
}

export const getEmergencyFund = async (): Promise<EmergencyFundResponse> => {
  const { data } = await api.get('/planning/emergency-fund');
  return data;
};

export const saveEmergencyFund = async (payload: EmergencyFundRequest): Promise<EmergencyFundResponse> => {
  const { data } = await api.post('/planning/emergency-fund', payload);
  return data;
};



export const calculateRetirement = async (payload: RetirementRequest): Promise<RetirementResponse> => {
  const { data } = await api.post('/planning/retirement', payload);
  return data;
};
