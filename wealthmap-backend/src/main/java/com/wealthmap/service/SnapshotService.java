package com.wealthmap.service;

import com.wealthmap.entity.NetWorthSnapshot;
import com.wealthmap.entity.User;
import com.wealthmap.repository.NetWorthSnapshotRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.dto.response.SnapshotResponse;
import com.wealthmap.dto.response.AssetResponse;
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
    private com.wealthmap.service.assets.FixedDepositService fdService;
    
    @Autowired
    private com.wealthmap.service.assets.StockService stockService;

    public List<SnapshotResponse> getSnapshotsForUser(Long userId) {
        return snapshotRepository.findByUserIdOrderBySnapshotDateAsc(userId).stream()
                .map(s -> new SnapshotResponse(s.getSnapshotDate(), s.getTotalNetWorth(), s.getTotalInvested()))
                .collect(Collectors.toList());
    }

    @Transactional
    public SnapshotResponse captureSnapshotNow(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        List<AssetResponse> currentAssets = new java.util.ArrayList<>();
        currentAssets.addAll(goldService.getAllGoldForUser(user.getEmail()));
        currentAssets.addAll(fdService.getAllFDsForUser(user.getEmail()));
        currentAssets.addAll(stockService.getAllStocksForUser(user.getEmail()));
        
        BigDecimal totalInvested = currentAssets.stream()
                .map(AssetResponse::getInvestedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        BigDecimal totalCurrentValue = currentAssets.stream()
                .map(AssetResponse::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
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
        todaySnapshot.setTotalNetWorth(totalCurrentValue);
        
        snapshotRepository.save(todaySnapshot);
        
        return new SnapshotResponse(today, totalCurrentValue, totalInvested);
    }
}
