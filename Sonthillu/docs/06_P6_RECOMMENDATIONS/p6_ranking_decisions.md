# P6 Ranking Decisions

This document summarizes the architectural and algorithmic decisions made during Phase 6 (Recommendations & Behavioral Intelligence).

## 1. Deterministic Foundation

The recommendation engine remains primarily deterministic. We did not introduce an opaque "black-box" machine learning model. Instead, we:

- Preserved the existing grouping and classification logic (e.g., `SIMILAR`, `NEARBY`, `ALTERNATIVE_TYPE`).
- Continued to use deterministic rule-based evaluation (e.g., price matching, property type matching).
- Kept the system explainable, assigning clear `reasons` to why a property was recommended.

## 2. Server-Authoritative Tracking

We moved tracking logic to be server-authoritative for identity resolution:

- The frontend fires normalized `trackClientActivity` requests.
- A Next.js Server Action (`trackActivityEventAction`) parses the payload and reads the active user session or anonymous cookie.
- This ensures that users cannot spoof their identities and that guest-to-account migration happens seamlessly on the server.

## 3. Augmenting the Model

Behavioral intelligence is injected into the existing pipeline by augmenting the `RequirementModel`.

- We use a decay-scaled weighting system for user interactions (views, searches, shortlists, enquiries).
- The `locationWeights` and `typeWeights` reflect implicit preferences that can be used to break ties or refine the deterministic pools.
- Explicit actions like `shortlist_added` carry higher weights than passive actions like `property_view`.

## 4. Performance & Availability

- **Fire-and-Forget**: Tracking calls never block the main thread or page rendering.
- **Fail-Safe**: If tracking or intelligence extraction fails, it gracefully falls back to the deterministic primary query or reference property.
- **Throttling**: The client throttles rapid repetitive events (e.g., rapid scroll views) to prevent database hammering.

## 5. Privacy

- Analytics respect the CRM boundary. User interactions are tied to `sonthillu_anon_id` for guests and mapped to `customerId` upon login.
- See `p6_privacy_retention.md` for more details.
