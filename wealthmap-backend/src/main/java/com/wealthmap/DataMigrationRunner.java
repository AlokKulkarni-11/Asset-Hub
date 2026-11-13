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
            int updated = jdbcTemplate.update(
                "UPDATE assets SET user_id = f.user_id " +
                "FROM family_members f " +
                "WHERE assets.family_member_id = f.id AND assets.user_id IS NULL"
            );
            if (updated > 0) {
                logger.info("Data migration: Updated {} assets with user_id.", updated);
            }
        } catch (Exception e) {
            logger.debug("Migration check skipped: {}", e.getMessage());
        }
    }
}
