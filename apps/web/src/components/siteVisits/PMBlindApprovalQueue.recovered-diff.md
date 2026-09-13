# Recovery diff: PMBlindApprovalQueue.tsx

Grounded against the CURRENT on-disk file (read directly, not from memory) on
2026-09-13. This file exists and is otherwise intact — it's missing exactly
two small, precise changes from this session's Phase 3 work.

## Change 1 — live countdown badge instead of a static "PENDING" pill

**Add import** (near the other local imports, e.g. after the `StatusPill` import on line 6):

```tsx
import { SiteVisitCountdownBadge } from './SiteVisitCountdownBadge';
```

**Replace** (currently line 154):

```tsx
<StatusPill status="PENDING" type="pending" />
```

**with:**

```tsx
<SiteVisitCountdownBadge scheduledDate={visit.scheduled_date} />
```

`visit.scheduled_date` already exists on the `BlindSiteVisit` interface (line 13), so no type change needed here. `SiteVisitCountdownBadge` itself is intact on disk at `apps/web/src/components/siteVisits/SiteVisitCountdownBadge.tsx` (confirmed present) and takes a `{ scheduledDate: string }` prop.

## Change 2 — surface customer name + phone in the accept toast

**Replace** the `handleAccept` function (currently lines 66-86):

```tsx
const handleAccept = async (visitId: number) => {
  if (!window.confirm('Are you sure you want to accept and assign this visit to yourself?')) return;

  setIsSubmitting(true);
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/site-visits/${visitId}/accept`, {
      method: 'POST',
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Site visit accepted successfully', 'success');
      fetchQueue();
    } else {
      await handleApiError(res, showError, data);
    }
  } catch (err) {
    showError(
      toUserFacingError({ message: err instanceof Error ? err.message : String(err), body: err }),
    );
  } finally {
    setIsSubmitting(false);
  }
};
```

**with:**

```tsx
const handleAccept = async (visitId: number) => {
  if (!window.confirm('Are you sure you want to accept and assign this visit to yourself?')) return;

  setIsSubmitting(true);
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/site-visits/${visitId}/accept`, {
      method: 'POST',
    });
    const data = await res.json();
    if (res.ok) {
      const lead = data.visit?.lead;
      showToast(
        lead?.customer_name
          ? `Accepted. Customer: ${lead.customer_name}${lead.phone ? ` (${lead.phone})` : ''}`
          : 'Site visit accepted successfully',
        'success',
      );
      fetchQueue();
    } else {
      await handleApiError(res, showError, data);
    }
  } catch (err) {
    showError(
      toUserFacingError({ message: err instanceof Error ? err.message : String(err), body: err }),
    );
  } finally {
    setIsSubmitting(false);
  }
};
```

**Why this is safe to trust:** the backend side of this pairing
(`apps/api/src/services/siteVisit/shared.ts`'s `applyTransition` helper
gaining `include: { lead: true }` on its `tx.siteVisitBooking.update()` call)
**is confirmed still present on disk** — grep for `include: { lead: true }`
in that file returns a match. That backend change is what makes
`data.visit.lead.customer_name`/`.phone` actually populated in the accept
response; without it this frontend change would have nothing to read. Since
the backend half survived, only the frontend half needs replaying.

**Confidence:** exact wording of the toast string is reconstructed from a
one-line natural-language description in the reconstructing session's own
earlier summary ("handleAccept now shows customer name+phone in the success
toast"), not from a verbatim source read — the logic/fields are right, but
the precise ternary phrasing above is a reasonable rewrite, not a guaranteed
byte-for-byte match of the original.
