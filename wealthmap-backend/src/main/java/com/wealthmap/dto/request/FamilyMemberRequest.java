package com.wealthmap.dto.request;

import com.wealthmap.enums.RelationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FamilyMemberRequest {
    @NotBlank(message = "Name cannot be blank")
    private String name;

    @NotNull(message = "Relation type is required")
    private RelationType relationType;
}
