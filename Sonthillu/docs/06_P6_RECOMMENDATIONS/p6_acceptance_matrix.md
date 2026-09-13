# P6 Acceptance Matrix

| Feature             | Requirement                                                                | Status  | Verification Method                                   |
| :------------------ | :------------------------------------------------------------------------- | :------ | :---------------------------------------------------- |
| **Identity**        | Generate and persist `sonthillu_anon_id` for guests.                       | ✅ Pass | Middleware inspection & Cookie storage.               |
| **Migration**       | Merge anonymous activity to customer account upon login.                   | ✅ Pass | `auth.ts` guest migration logic.                      |
| **Instrumentation** | Track `property_view`.                                                     | ✅ Pass | `PropertyDetailClient.tsx` network requests.          |
| **Instrumentation** | Track `search_submitted`.                                                  | ✅ Pass | `SearchResults.tsx` interactions.                     |
| **Instrumentation** | Track `enquiry_started` / `submitted`.                                     | ✅ Pass | `EnquiryModal.tsx` network requests.                  |
| **Instrumentation** | Track `call_now_clicked`.                                                  | ✅ Pass | `CallNowButton.tsx` network requests.                 |
| **Instrumentation** | Track `recommendation_click` / `impression`.                               | ✅ Pass | `RecommendationsSection.tsx` & `PropertyCard.tsx`.    |
| **Intelligence**    | Extract behavioral signals with 7/30/90 day decay.                         | ✅ Pass | `intelligence.test.ts`.                               |
| **Pipeline Wiring** | Inject behavioral signals into `properties/page.tsx` recommendations.      | ✅ Pass | Next.js Server Component render logic.                |
| **Pipeline Wiring** | Inject behavioral signals into `properties/[id]/page.tsx` recommendations. | ✅ Pass | Next.js Server Component render logic.                |
| **Resilience**      | Analytics failures do not block rendering or navigation.                   | ✅ Pass | "Fire-and-forget" error swallowing in server actions. |
