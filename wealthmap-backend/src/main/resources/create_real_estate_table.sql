-- Create real_estate table if it doesn't exist
-- This follows the JOINED inheritance strategy from JPA

CREATE TABLE IF NOT EXISTS real_estate (
    id BIGINT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    property_name VARCHAR(255),
    property_type VARCHAR(100),
    purchase_price NUMERIC(19, 2),
    estimated_current_value NUMERIC(19, 2)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_real_estate_property_type ON real_estate(property_type);

-- Verify the table was created
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'real_estate'
ORDER BY 
    ordinal_position;
