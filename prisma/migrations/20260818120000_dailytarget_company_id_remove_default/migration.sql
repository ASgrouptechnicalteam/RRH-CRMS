-- Remove unsafe @default(1) from DailyTarget.company_id
-- This ensures explicit tenant assignment is required instead of defaulting to company_id=1
ALTER TABLE `DailyTarget` CHANGE `company_id` `company_id` INT NOT NULL;