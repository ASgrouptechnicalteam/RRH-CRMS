# P6 Signal Catalog

This document details the behavioral signals extracted from user activities to inform the recommendation pipeline.

## Events Tracked

- `property_view`: Base weight 1.0. Fired when a user views a property detail page.
- `search_submitted`: Base weight 1.5. Fired when a user executes a search.
- `recommendation_click`: Base weight 2.0. Fired when a user clicks a recommended property.
- `compare_added`: Base weight 3.0. Fired when a user adds a property to their compare list.
- `shortlist_added`: Base weight 5.0. Fired when a user adds a property to their shortlist.
- `call_now_clicked`: Base weight 8.0. Fired when a user clicks the call button.
- `enquiry_started`: Base weight 4.0. Fired when a user opens the enquiry modal.
- `enquiry_submitted`: Base weight 10.0. Fired when a user submits an enquiry.

## Decay Model

To prioritize recent intent, event weights are scaled by a decay factor based on their age:

- **≤ 7 days**: 1.0 (No decay)
- **8–30 days**: 0.5 (Half weight)
- **31–90 days**: 0.1 (Residual weight)
- **> 90 days**: 0.0 (Ignored)

## Extracted Context

- `locationWeights`: Aggregates the weighted scores for each location the user has interacted with or searched for.
- `typeWeights`: Aggregates the weighted scores for each property type the user has interacted with or searched for.
- `interactedPropertyIds`: A set of property IDs the user has interacted with, used for the `RECENTLY_VIEWED` fallback recommendation group.
- `shortlistedPropertyIds`: A set of property IDs the user has explicitly shortlisted, used as strong affinity markers.

These weights currently augment the `RequirementModel` to steer deterministic grouping and fallback ranking.
