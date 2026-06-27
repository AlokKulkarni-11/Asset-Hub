package com.wealthmap.service;

import com.wealthmap.dto.request.FamilyMemberRequest;
import com.wealthmap.dto.response.FamilyMemberResponse;
import com.wealthmap.entity.FamilyMember;
import com.wealthmap.entity.User;
import com.wealthmap.repository.FamilyMemberRepository;
import com.wealthmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;

    public FamilyMemberResponse addFamilyMember(FamilyMemberRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FamilyMember member = new FamilyMember();
        member.setUser(user);
        member.setName(request.getName());
        member.setRelationType(request.getRelationType());

        FamilyMember saved = familyMemberRepository.save(member);
        return mapToResponse(saved);
    }

    public List<FamilyMemberResponse> getFamilyMembers(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return familyMemberRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FamilyMemberResponse mapToResponse(FamilyMember member) {
        FamilyMemberResponse response = new FamilyMemberResponse();
        response.setId(member.getId());
        response.setName(member.getName());
        response.setRelationType(member.getRelationType());
        return response;
    }
}
