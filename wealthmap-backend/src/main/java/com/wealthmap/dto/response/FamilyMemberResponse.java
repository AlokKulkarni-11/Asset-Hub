package com.wealthmap.dto.response;

import com.wealthmap.enums.RelationType;
import lombok.Data;

@Data
public class FamilyMemberResponse {
    private Long id;
    private String name;
    private RelationType relationType;
}
