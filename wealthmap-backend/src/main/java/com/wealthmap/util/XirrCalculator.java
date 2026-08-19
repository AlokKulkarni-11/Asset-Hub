package com.wealthmap.util;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

public class XirrCalculator {

    public static class CashFlow {
        public double amount;
        public LocalDate date;

        public CashFlow(double amount, LocalDate date) {
            this.amount = amount;
            this.date = date;
        }
    }

    private static final double MAX_ERROR = 1e-6;
    private static final int MAX_ITERATIONS = 100;

    public static double calculateXIRR(List<CashFlow> cashFlows) {
        if (cashFlows == null || cashFlows.isEmpty()) {
            return 0.0;
        }

        // Sort cash flows by date
        cashFlows.sort((a, b) -> a.date.compareTo(b.date));

        LocalDate startDate = cashFlows.get(0).date;

        // Check if there is at least one positive and one negative cash flow
        boolean hasPositive = false;
        boolean hasNegative = false;
        for (CashFlow cf : cashFlows) {
            if (cf.amount > 0) hasPositive = true;
            if (cf.amount < 0) hasNegative = true;
        }

        if (!hasPositive || !hasNegative) {
            // Cannot calculate IRR without both positive and negative cash flows
            // Calculate simple return CAGR as fallback
            return calculateCAGRFallback(cashFlows);
        }

        double guess = 0.1; // initial guess of 10%
        
        for (int i = 0; i < MAX_ITERATIONS; i++) {
            double f = 0.0;
            double df = 0.0;

            for (CashFlow cf : cashFlows) {
                double t = ChronoUnit.DAYS.between(startDate, cf.date) / 365.0;
                double term = Math.pow(1.0 + guess, t);
                if (term == 0.0) term = 1e-12; // Avoid division by zero
                f += cf.amount / term;
                df -= t * cf.amount / (term * (1.0 + guess));
            }

            if (Math.abs(df) < 1e-12) {
                break;
            }

            double nextGuess = guess - f / df;
            if (Math.abs(nextGuess - guess) < MAX_ERROR) {
                return nextGuess;
            }
            guess = nextGuess;
        }

        // Newton-Raphson failed, try Bisection method as fallback
        return bisectionFallback(cashFlows, startDate);
    }

    private static double bisectionFallback(List<CashFlow> cashFlows, LocalDate startDate) {
        double low = -0.99;
        double high = 5.0;
        double mid = 0.0;

        for (int i = 0; i < 100; i++) {
            mid = (low + high) / 2.0;
            double f = 0.0;

            for (CashFlow cf : cashFlows) {
                double t = ChronoUnit.DAYS.between(startDate, cf.date) / 365.0;
                f += cf.amount / Math.pow(1.0 + mid, t);
            }

            if (Math.abs(f) < 1e-5) {
                return mid;
            }

            // Test low value
            double fLow = 0.0;
            for (CashFlow cf : cashFlows) {
                double t = ChronoUnit.DAYS.between(startDate, cf.date) / 365.0;
                fLow += cf.amount / Math.pow(1.0 + low, t);
            }

            if ((f > 0 && fLow > 0) || (f < 0 && fLow < 0)) {
                low = mid;
            } else {
                high = mid;
            }
        }

        return mid;
    }

    private static double calculateCAGRFallback(List<CashFlow> cashFlows) {
        double totalInvested = 0;
        double totalCurrent = 0;
        LocalDate earliest = LocalDate.now();
        LocalDate latest = LocalDate.now();

        for (CashFlow cf : cashFlows) {
            if (cf.amount < 0) {
                totalInvested += Math.abs(cf.amount);
                if (cf.date.isBefore(earliest)) earliest = cf.date;
            } else {
                totalCurrent += cf.amount;
                if (cf.date.isAfter(latest)) latest = cf.date;
            }
        }

        if (totalInvested == 0) return 0.0;
        long days = ChronoUnit.DAYS.between(earliest, latest);
        if (days <= 0) return 0.0;

        double years = days / 365.0;
        return Math.pow(totalCurrent / totalInvested, 1.0 / years) - 1.0;
    }
}
