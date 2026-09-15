package com.wealthmap.repository;

import com.wealthmap.entity.AssetDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetDocumentRepository extends JpaRepository<AssetDocument, Long> {
    List<AssetDocument> findByUserId(Long userId);
    List<AssetDocument> findByAssetId(Long assetId);
    List<AssetDocument> findByLiabilityId(Long liabilityId);
    Optional<AssetDocument> findByIdAndUserId(Long id, Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
}
