package com.wealthmap;

import com.wealthmap.repository.AssetRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.wealthmap.enums.AssetType;

@SpringBootTest
public class DatabaseQueryTest {

    @Autowired
    private AssetRepository assetRepository;

    @Test
    public void testQueries() {
        System.out.println("TEST_START: findByUserId(1L)");
        var all = assetRepository.findByUserId(1L);
        System.out.println("TEST_RESULT: all.size() = " + all.size());
        
        System.out.println("TEST_START: findByUserIdAndAssetType(1L, GOLD)");
        var gold = assetRepository.findByUserIdAndAssetType(1L, AssetType.GOLD);
        System.out.println("TEST_RESULT: gold.size() = " + gold.size());
    }
}
