package com.wealthmap.repository;

import com.wealthmap.entity.NetWorthSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NetWorthSnapshotRepository extends JpaRepository<NetWorthSnapshot, Long> {
    List<NetWorthSnapshot> findByUserIdOrderBySnapshotDateAsc(Long userId);
}
