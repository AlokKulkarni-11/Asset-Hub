package com.wealthmap.entity;

import com.wealthmap.entity.base.Liability;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "other_liabilities")
@Data
@EqualsAndHashCode(callSuper = true)
public class OtherLiability extends Liability {
    private String descriptionDetail;
}
