-- AlterTable
-- Additive only: MIXED and COMMERCIAL are kept (not dropped) so any existing
-- row using them stays valid without a data migration. New projects should
-- use the finer-grained values below instead (spec item 1.6).
ALTER TABLE `project` MODIFY `project_type` ENUM(
  'PLOTTED',
  'APARTMENT',
  'VILLA',
  'INDEPENDENT_HOUSE',
  'ROW_HOUSE',
  'AGRICULTURAL_LAND',
  'FARM_HOUSE',
  'COMMERCIAL_SHOP',
  'COMMERCIAL_OFFICE',
  'MIXED_RESIDENTIAL',
  'MIXED_USE',
  'TOWNSHIP',
  'GATED_COMMUNITY',
  'MIXED',
  'COMMERCIAL',
  'OTHER'
) NULL;
