-- §7 — Document module removal (docs/LEAD-WORKFLOW-SPEC.md)
-- Per user decision (§8 item #2): remove the Document model + DocumentSignature
-- model + ALL routes/service/policy entirely. KYC document handling moves to the
-- customer portal; the CRM no longer stores documents.
--
-- NOTE: this is a hand-authored migration. The shared MySQL host blocks
-- `prisma migrate dev` (shadow DB unavailable), so apply manually and then run:
--   npx prisma migrate resolve --applied 20260828000001_document_module_removal

-- Drop child first (DocumentSignature references Document via FK).
DROP TABLE IF EXISTS `DocumentSignature`;

-- Drop the Document table.
DROP TABLE IF EXISTS `Document`;
