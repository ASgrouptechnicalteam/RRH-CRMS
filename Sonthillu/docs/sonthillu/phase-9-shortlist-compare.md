# Packet 9 — Shortlist & Compare Persistence

Customer-owned shortlist and compare for the Sonthillu website, layered on the
Packet 8 customer/session boundary. The website stores **property ID
references** only — the CRM remains the property source of truth and is never
used as the website's customer/shortlist database, and never modified for this
feature.

No final authentication method is implemented here (still a Packet 8 open
decision); guest temporary state works in-browser today and the guest →
customer merge is built behind an abstraction for the future login flow.

## 1. Persistence architecture

```
Browser (guest temporary state)
  └─ localStorage: sonthillu:guest:shortlist / sonthillu:guest:compare
       (non-sensitive property IDs only)

Server (customer state)
  └─ CustomerActivityStore  (interface)
       ├─ InMemoryCustomerActivityStore  (dev/test default; single process)
       └─ (future) Website DB / ORM implementation via setCustomerActivityStore
```

- `src/lib/customer/types.ts` defines the `CustomerActivityStore` interface
  (shortlist + ordered compare). This is the persistence boundary — the chosen
  Website DB/ORM (still an open Packet 8 decision) will implement it.
- `src/lib/customer/persistence.ts` holds the module-level store seam:
  `setCustomerActivityStore(next)` / `getCustomerActivityStore()`.
- `src/lib/customer/store.ts` provides the dev/test-safe
  `InMemoryCustomerActivityStore` (single-process, resets on restart).
- The CRM database is **never** used for website customer activity.
- `src/lib/customer/service.ts` is the only layer UI/server code talks to —
  no raw store/database operations reach components.

## 2. Customer ownership model

- The session (Packet 8) identifies the customer. `requireCustomer()` in the
  server actions resolves `customer.id` from the session — a customerId from the
  browser is never trusted.
- Every service call is scoped by `customerId`; ownership assertions are
  server-side, never in UI components.
- UI components read/write through the client `CustomerActivityProvider`, which
  in guest mode uses localStorage and in customer mode calls the authenticated
  server actions (`src/app/actions/customer.ts`).

## 3. Guest-state model

- Anonymous visitors get fully working temporary shortlist/compare via
  localStorage (`src/lib/customer/guest.ts`). Only property IDs are stored —
  never PII, never auth/session data.
- Guest state is read on provider mount and shared across all property cards,
  the property detail actions, `/shortlist` and `/compare` via React context.
- When the guest authenticates (future login flow), `mergeGuestActivityAction`
  migrates the guest state into the customer store instead of discarding it.

## 4. Shortlist model

- Customer shortlist = ordered list of property IDs (`customerId → ids[]`).
- Service (`src/lib/customer/service.ts`): `addToShortlist`, `removeFromShortlist`
  (idempotent), `getShortlist`, `isShortlisted`. Duplicate adds return
  `already_present` and never create duplicate records.
- UI: `/shortlist` page (noindex) renders current property cards, an explicit
  remove action, compare action, unavailable-property cards, an empty state and
  an enquiry insertion point. Cards carry accessible shortlist/compare buttons.

## 5. Compare model

- Compare = ordered list of property IDs, capped at a documented maximum.
- `COMPARE_LIMIT = 4`: a 4-column comparison fits a desktop table and horizontally
  scrollable mobile grid without forcing the label column off-screen; industry
  comparators commonly use 3–4 properties. Never unlimited.
- Service: `addToCompare` (dedupe + limit), `removeFromCompare`,
  `replaceInCompare(index, id)` (remove-at-index then insert, deduped),
  `clearCompare`, `getCompare`, `isCompared`.
- UI: `/compare` page (noindex) renders the comparison table with images, title,
  price, location, type, listing type, property-type-aware specs, amenities,
  RERA, plus remove/replace/clear and an enquiry insertion point.

## 6. Data freshness

- Persistence stores references only. Rendering always resolves through the
  current public source:
  `shortlist ID → getPropertyById (CRM/public) → toPublicPropertyDetail`.
- `hydratePropertiesByIds` (`service.ts`) and the read-only
  `GET /api/properties?ids=...` endpoint revalidate every id with `no-store`.
  Properties no longer publicly available are returned as `unavailableIds`.
- Unavailable properties render an explicit **No Longer Available** state and
  are never presented as purchasable; removal/replacement actions are provided.

## 7. Cross-account isolation

- All service/store operations are keyed by `customerId`; the session
  determines the customer. Customer A can never read, alter, or enumerate
  Customer B's shortlist/compare (verified by tests).
- The client never receives or sends another customer's ids.

## 8. Cross-brand isolation

- Sonthillu guest keys are namespaced (`sonthillu:guest:*`) and the customer
  session cookie is Sonthillu-scoped (`sonthillu_session`, Packet 8).
- The rate limiter and brand helpers use brand-prefixed keys, so RRH state
  never collides. A Sonthillu session never authenticates into
  readhrealhomeproperties.com, and vice versa.
- Stored references point at Sonthillu public property IDs only.

## 9. Property-type-aware comparison

`src/lib/customer/compare.ts` defines per-type applicable fields and renders
`N/A` for fields that do not apply to a type and `—` for fields that apply but
are genuinely absent — the two are preserved distinctly (never `0`).

| Field         | APARTMENT | VILLA | INDEPENDENT_HOUSE |
| ------------- | --------- | ----- | ----------------- |
| Bedrooms      | ✓         | ✓     | ✓                 |
| Bathrooms     | ✓         | ✓     | ✓                 |
| Built-up Area | ✓         | ✓     | ✓                 |
| Plot Area     | N/A       | ✓     | ✓                 |
| Floor         | ✓         | N/A   | N/A               |
| Parking       | N/A       | ✓     | ✓                 |
| Facing        | ✓         | ✓     | ✓                 |
| Possession    | ✓         | ✓     | ✓                 |
| RERA          | ✓         | ✓     | ✓                 |
| Amenities     | ✓         | ✓     | ✓                 |

Uses the same public DTOs as the rest of the website (`PublicPropertyDetail`).

## 10. Analytics events

`src/lib/customer/activity.ts` defines typed contracts for
`shortlist_add`, `shortlist_remove`, `compare_add`, `compare_remove`,
`compare_view`, dispatched as `sonthillu:customer-activity` CustomEvents on the
client. No dashboard is built; events carry only property IDs and activity
counts — never PII.

## 11. Tests

`src/lib/customer/customer.test.ts` — 40 tests covering:

- **Shortlist**: add, duplicate add, remove, idempotent remove, list order,
  membership, ownership/isolation, invalid-id rejection.
- **Compare**: add, duplicate, `COMPARE_LIMIT` max, remove, replace (incl.
  dedupe + out-of-range), clear, cross-customer isolation, set/dedupe/cap.
- **Guest migration**: guest-priority merge, dedupe, empty guest, empty customer,
  compare cap, invalid-id filtering.
- **Guest state**: toggle/persist/remove, compare limit + duplicates,
  replace/clear, malformed storage, never storing non-id values.
- **Security**: property ID validation, no raw ids leak, cross-account isolation.
- **Data freshness**: available → current public DTO, unavailable never live,
  dedupe/order, invalid ids skipped.
- **Property-type-aware**: N/A vs missing distinct, mixed types, single column.
- **Analytics**: typed event builder, no PII, event name.

## 12. Open Questions

- Final authentication method (inherited from Packet 8) — required to make the
  customer-mode store and `mergeGuestActivityAction` reachable in production.
- Where the guest login flow will call `mergeGuestActivityAction` and how the
  client learns it is now in customer mode.
- Whether the replace-in-compare picker should source from shortlist only (V1)
  or a full search.

## 13. Database/ORM dependency

The website DB/ORM decision from Packet 8 is **still open**. Per that decision
the following remain unimplemented and clearly separated:

- No production database created; no Hostinger tables; no ORM added.
- `CustomerActivityStore` is the abstraction a chosen persistence layer
  implements via `setCustomerActivityStore`.
- `InMemoryCustomerActivityStore` is the dev/test-safe default (single-process,
  resets on restart) — it is clearly documented as non-production.
- The CRM database is never used for website customer activity.

## 14. Future migration considerations

- When the DB/ORM lands, implement `CustomerActivityStore` over the chosen
  storage (e.g. Prisma + MySQL tables `customer_shortlist`,
  `customer_compare`) and wire it once at server startup.
- The `/api/properties` hydration endpoint is DB-agnostic and remains the
  freshness path for both guest and customer views.
- Auth landing: on successful login, call `mergeGuestActivityAction(guestIds…)`
  and switch the provider to customer mode; clear the guest localStorage keys.
- Shortlist/Compare can later feed recommendations and enquiry without changing
  the reference-based model.

---

# Questions

1. **Website DB/ORM** (inherited, still open): which database and ORM will back
   `CustomerActivityStore` in production?
2. **Auth method** (inherited, still open): final sign-in method determines when
   and how the guest merge hook is invoked.
3. **Replace picker scope**: shortlist-only is V1; do we need full property
   search in the replace modal later?
