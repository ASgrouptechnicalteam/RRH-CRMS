-- Phase 1: Allow website (public) leads without an employee creator.
-- Public lead intake (POST /api/v1/public/:brand/leads) has no employee actor;
-- the field becomes nullable so WEBSITE leads can be created.

ALTER TABLE `Lead` MODIFY COLUMN `created_by_id` INT NULL;