package com.wealthmap.repository;

import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
    List<Asset> findByUserId(Long userId);
    List<Asset> findByUserIdAndAssetType(Long userId, AssetType assetType);
}
