package com.wealthmap.enums;

public enum CompoundingFrequency {
    MONTHLY(12),
    QUARTERLY(4),
    HALF_YEARLY(2),
    YEARLY(1);

    private final int periodsPerYear;

    CompoundingFrequency(int periodsPerYear) {
        this.periodsPerYear = periodsPerYear;
    }

    public int getPeriodsPerYear() {
        return periodsPerYear;
    }
}
