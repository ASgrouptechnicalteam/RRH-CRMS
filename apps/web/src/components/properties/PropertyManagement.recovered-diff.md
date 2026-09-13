# Recovery diff: PropertyManagement.tsx — PM verification tabs (item #17)

Grounded against the CURRENT on-disk file (read directly on 2026-09-13, not
from memory). This confirms the file has reverted to the exact pre-fix state:
the PM-only `viewMode` dropdown (`isPM && <select>...ALL / MY_PROPERTIES`,
current lines ~521-530) and the separate `statusFilter` dropdown with
`PENDING_VERIFICATION` as one of its options (current lines ~543-554) are
both back — these are literally the "two separate hard-to-combine dropdowns"
item #17 complained about. Relevant current state:

```
const [brandTab, setBrandTab] = useState<'ALL' | 'SONTHILLU' | 'RADHA_REAL_HOMES'>('ALL');
const [statusFilter, setStatusFilter] = useState<string>('ALL');
const [viewMode, setViewMode] = useState<'ALL' | 'MY_PROPERTIES'>('ALL');
const isPM = ([Roles.PROJECT_MANAGER, Roles.MD, Roles.ADMIN] as string[]).includes(activeRole);
```

and the filter predicate (current lines 433-444):

```tsx
const filteredProperties = properties.filter((prop) => {
  const matchesBrand = brandTab === 'ALL' || prop.brand_type === brandTab;
  const matchesStatus = statusFilter === 'ALL' || prop.status === statusFilter;
  const matchesSearch = /* ... */;
  const matchesViewMode = viewMode === 'ALL' || (viewMode === 'MY_PROPERTIES' && prop.assigned_pm?.id === user?.id);
  return matchesBrand && matchesStatus && matchesSearch && matchesViewMode;
});
```

## Recommended re-implementation (grounded in the above, not a byte-exact recall)

1. Add a derived count next to the other computed values:

```tsx
const needsMyVerificationCount = properties.filter(
  (prop) => prop.status === 'PENDING_VERIFICATION' && prop.assigned_pm?.id === user?.id,
).length;
```

2. Replace the `viewMode` dropdown block (lines ~521-530) with a PM-only tab
   bar placed as its own row right after the header banner (before the brand
   tabs), e.g.:

```tsx
{
  isPM && (
    <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
      <button
        onClick={() => setViewMode('ALL')}
        className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
          viewMode === 'ALL'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        All Properties
      </button>
      <button
        onClick={() => setViewMode('MY_PROPERTIES')}
        className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
          viewMode === 'MY_PROPERTIES'
            ? 'bg-navy-700 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Needs Your Verification
        {needsMyVerificationCount > 0 && (
          <span className="bg-amber-400 text-navy-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
            {needsMyVerificationCount}
          </span>
        )}
      </button>
    </div>
  );
}
```

3. Fold "needs my verification" into the existing `viewMode === 'MY_PROPERTIES'`
   branch of `matchesViewMode` (reusing the existing filter mechanism instead
   of adding a third state variable):

```tsx
const matchesViewMode =
  viewMode === 'ALL' ||
  (viewMode === 'MY_PROPERTIES' &&
    prop.assigned_pm?.id === user?.id &&
    prop.status === 'PENDING_VERIFICATION');
```

(Original code only checked `assigned_pm?.id === user?.id` for
`MY_PROPERTIES` — the fix's whole point was combining "assigned to me" AND
"pending my action" into one tab, replacing the separate `statusFilter`
dropdown's `PENDING_VERIFICATION` option as the PM's primary way to find
this queue.)

**Confidence: medium.** The concepts (tab bar replacing dropdown, combined
assigned-to-me + pending-verification predicate, live count badge) are
correct per the reconstructing session's own summary of its prior work, and
are now grounded against the actual current file structure/state names above
— but the exact JSX/class names in step 2 are a reasonable rewrite, not a
verbatim recall, since the original source for this specific change was not
available in the reconstructing session's context (only a natural-language
description survived its own context compaction). Review before applying.

## NOT recoverable: the detail-drawer default-tab piece

The original summary also mentioned: "in the detail-drawer sub-component,
added `needsMyActionNow` logic so `activeTab`'s initial `useState` defaults
to `'pipeline'` instead of `'overview'` when the property genuinely needs the
current viewer's action." A search of the current
`apps/web/src/components/properties/` directory for `'pipeline'`, `'overview'`,
or any drawer/detail sub-component turned up **nothing** — no matching state
names, no separate drawer file. This piece may live in a sub-component that
was removed, renamed, or restructured independently of this incident, or the
reconstructing session's summary of it was already imprecise before this
exchange started. Marking this **REVERTED-NO-SOURCE** — do not guess at where
to re-add it without first finding wherever the property detail view now
actually renders its tabs.
