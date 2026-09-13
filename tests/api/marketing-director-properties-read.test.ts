import { RolePermissionsMatrix, Roles, Permissions } from '@rrh-ems/shared';

// Found during Phase 5.3's manual QA pass: Roles.MARKETING_DIRECTOR had
// properties.dm_polish and properties.md_approve but not properties.read.
// There is no single-property-fetch endpoint anywhere in this codebase
// (routes/properties/crud.ts has GET '/' only, gated by properties.read) —
// so without it, a Marketing Director's Properties page 403s immediately and
// they can never reach the list to find anything to polish or approve,
// making two of their own granted permissions permanently unusable through
// the real UI. This is a lightweight matrix-level guard; the live behavior
// (GET /properties actually returning 200) was verified manually against a
// running server, since it also requires the corresponding RolePermission
// row to exist in the database — see docs/PENDING-PRODUCTION-CHANGES.md §5b
// for why the matrix alone isn't sufficient in a real deployment.
describe('Phase 5.3 (found via manual QA) - Marketing Director can read properties', () => {
  it('grants properties.read alongside properties.dm_polish and properties.md_approve', () => {
    const perms = RolePermissionsMatrix[Roles.MARKETING_DIRECTOR];
    expect(perms).toContain(Permissions.PROPERTIES_DM_POLISH);
    expect(perms).toContain(Permissions.PROPERTIES_MD_APPROVE);
    expect(perms).toContain(Permissions.PROPERTIES_READ);
  });
});
