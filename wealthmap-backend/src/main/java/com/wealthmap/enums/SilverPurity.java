package com.wealthmap.enums;

public enum SilverPurity {
    P999(0.999),
    P925(0.925),
    P900(0.900),
    P800(0.800);

    private final double multiplier;

    SilverPurity(double multiplier) {
        this.multiplier = multiplier;
    }

    public double getMultiplier() {
        return multiplier;
    }
}
