package com.wealthmap.enums;

public enum GoldPurity {
    K18(0.750),
    K20(0.833),
    K22(0.916),
    K24(1.000);

    private final double multiplier;

    GoldPurity(double multiplier) {
        this.multiplier = multiplier;
    }

    public double getMultiplier() {
        return multiplier;
    }
}
