-- DropForeignKey
ALTER TABLE `channelpartner` DROP FOREIGN KEY `ChannelPartner_company_id_fkey`;

-- DropForeignKey
ALTER TABLE `channelpartner` DROP FOREIGN KEY `ChannelPartner_upline_cp_id_fkey`;

-- DropForeignKey
ALTER TABLE `cppayout` DROP FOREIGN KEY `CPPayout_approved_by_id_fkey`;

-- DropForeignKey
ALTER TABLE `cppayout` DROP FOREIGN KEY `CPPayout_cp_id_fkey`;

-- DropForeignKey
ALTER TABLE `leadprotectionlock` DROP FOREIGN KEY `LeadProtectionLock_cp_id_fkey`;

-- DropForeignKey
ALTER TABLE `leadprotectionlock` DROP FOREIGN KEY `LeadProtectionLock_lead_id_fkey`;

-- DropTable
DROP TABLE `channelpartner`;

-- DropTable
DROP TABLE `cppayout`;

-- DropTable
DROP TABLE `leadprotectionlock`;