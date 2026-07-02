ALTER TABLE users 
ALTER COLUMN last_click_hour_reset TYPE BIGINT USING 
    CASE 
        WHEN last_click_hour_reset IS NOT NULL THEN (EXTRACT(EPOCH FROM last_click_hour_reset) * 1000)::BIGINT
        ELSE NULL
    END;
