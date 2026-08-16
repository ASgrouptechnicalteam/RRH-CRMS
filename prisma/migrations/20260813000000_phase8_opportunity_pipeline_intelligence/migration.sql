-- Phase 8 Packet 4A: Opportunity Pipeline Intelligence
-- Add exited_at to OpportunityHistory for timestamp-based stage duration
-- Add indexes to Opportunity for pipeline query performance

-- AlterTable: OpportunityHistory
ALTER TABLE `OpportunityHistory` ADD COLUMN `exited_at` DATETIME(3) NULL;

-- CreateIndex: Opportunity.project_id
CREATE INDEX `Opportunity_project_id_idx` ON `Opportunity`(`project_id`);

-- CreateIndex: Opportunity.property_id
CREATE INDEX `Opportunity_property_id_idx` ON `Opportunity`(`property_id`);

-- CreateIndex: Opportunity.created_at
CREATE INDEX `Opportunity_created_at_idx` ON `Opportunity`(`created_at`);
