package com.wealthmap.service;

import com.wealthmap.entity.NetWorthSnapshot;
import com.wealthmap.entity.User;
import com.wealthmap.repository.NetWorthSnapshotRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.dto.response.SnapshotResponse;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.LiabilityResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SnapshotService {

    @Autowired
    private NetWorthSnapshotRepository snapshotRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private com.wealthmap.service.assets.GoldService goldService;

    @Autowired
    private com.wealthmap.service.assets.SilverService silverService;
    
    @Autowired
    private com.wealthmap.service.assets.FixedDepositService fdService;
    
    @Autowired
    private com.wealthmap.service.assets.StockService stockService;

    @Autowired
    private com.wealthmap.service.assets.MutualFundService mfService;

    @Autowired
    private com.wealthmap.service.assets.RealEstateService reService;

    @Autowired
    private com.wealthmap.service.assets.CryptoService cryptoService;

    @Autowired
    private com.wealthmap.service.LiabilityService liabilityService;

    public List<SnapshotResponse> getSnapshotsForUser(Long userId) {
        return snapshotRepository.findByUserIdOrderBySnapshotDateAsc(userId).stream()
                .map(s -> {
                    BigDecimal assets = s.getTotalAssets() != null ? s.getTotalAssets() : s.getTotalNetWorth();
                    BigDecimal liabilities = s.getTotalLiabilities() != null ? s.getTotalLiabilities() : BigDecimal.ZERO;
                    return new SnapshotResponse(s.getSnapshotDate(), s.getTotalNetWorth(), s.getTotalInvested(), assets, liabilities);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public SnapshotResponse captureSnapshotNow(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        List<AssetResponse> currentAssets = new java.util.ArrayList<>();
        currentAssets.addAll(goldService.getAllGoldForUser(user.getEmail()));
        currentAssets.addAll(silverService.getAllSilverForUser(user.getEmail()));
        currentAssets.addAll(fdService.getAllFDsForUser(user.getEmail()));
        currentAssets.addAll(stockService.getAllStocksForUser(user.getEmail()));
        currentAssets.addAll(mfService.getAllMutualFundsForUser(user.getEmail()));
        currentAssets.addAll(reService.getAllRealEstateForUser(user.getEmail()));
        currentAssets.addAll(cryptoService.getAllCryptoForUser(user.getEmail()));
        
        BigDecimal totalInvested = currentAssets.stream()
                .map(AssetResponse::getInvestedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        BigDecimal totalAssets = currentAssets.stream()
                .map(AssetResponse::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<LiabilityResponse> currentLiabilities = liabilityService.getAllLiabilitiesForUser(user.getEmail());
        
        BigDecimal totalLiabilities = currentLiabilities.stream()
                .map(LiabilityResponse::getOutstandingBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalNetWorth = totalAssets.subtract(totalLiabilities);
                
        // Check if snapshot already exists for today
        LocalDate today = LocalDate.now();
        
        // Find existing snapshot for today or create new
        List<NetWorthSnapshot> existing = snapshotRepository.findByUserIdOrderBySnapshotDateAsc(userId);
        NetWorthSnapshot todaySnapshot = existing.stream()
                .filter(s -> s.getSnapshotDate().equals(today))
                .findFirst()
                .orElse(new NetWorthSnapshot());
                
        todaySnapshot.setUser(user);
        todaySnapshot.setSnapshotDate(today);
        todaySnapshot.setTotalInvested(totalInvested);
        todaySnapshot.setTotalNetWorth(totalNetWorth);
        todaySnapshot.setTotalAssets(totalAssets);
        todaySnapshot.setTotalLiabilities(totalLiabilities);
        
        snapshotRepository.save(todaySnapshot);
        
        return new SnapshotResponse(today, totalNetWorth, totalInvested, totalAssets, totalLiabilities);
    }
}
