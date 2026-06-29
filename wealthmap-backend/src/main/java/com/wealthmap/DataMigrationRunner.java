package com.wealthmap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class DataMigrationRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataMigrationRunner.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            logger.info("=== STARTING DATA MIGRATION CHECK ===");
            List<Map<String, Object>> assets = jdbcTemplate.queryForList("SELECT * FROM assets");
            logger.info("Total assets in DB: " + assets.size());
            logger.info("Assets Dump: " + assets.toString());
            
            if (assets.size() > 0) {
                int updated = jdbcTemplate.update(
                    "UPDATE assets SET user_id = f.user_id " +
                    "FROM family_members f " +
                    "WHERE assets.family_member_id = f.id AND assets.user_id IS NULL"
                );
                logger.info("Migration successful! Updated " + updated + " assets with correct user_id.");
            }
        } catch (Exception e) {
            logger.error("Migration check failed: " + e.getMessage());
        }
    }
}
