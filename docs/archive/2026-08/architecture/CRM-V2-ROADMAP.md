# CRM-V2-ROADMAP

> Deferred functionality, V2 boundaries, and explicit out-of-scope exclusions for RRH-CRMS.
> This document separates **CURRENT IMPLEMENTATION**, **APPROVED ARCHITECTURE**,
> **FUTURE / V2**, and **OUT OF SCOPE**. It reconciles the authoritative roadmap
> (`docs/roadmap/00-AUTHORITATIVE-ROADMAP.md`) with the **actual repository**.

## 1. EXPLICITLY OUT OF SCOPE

These are verified exclusions for RRH-CRMS. Do **not** implement them in this product.

| Area | Status | Evidence / notes |
|------|--------|------------------|
| **Channel Partner (CP)** | ⚪ OUT OF SCOPE | Phase 10 Packet 1 excision; Phase 13 PERMANENTLY EXCISED. Migration `20260813162651_phase10_packet1b_remove_channel_partner_domain` dropped `channelpartner`, `cppayout`, `leadprotectionlock`. No CP role/permission/UI remains. CP belongs to a **separate application**. |
| Autonomous AI agents | ⚪ OUT OF SCOPE | AI is an interpretation layer, not an agent framework (`services/ai/contextBuilder.ts` explicitly: "This is NOT a general-purpose autonomous agent framework") |
| Unrestricted AI tool-calling | ⚪ OUT OF SCOPE | No tool-calling surface exists or is planned in Phase 17-A |
| Arbitrary SQL through AI | ⚪ OUT OF SCOPE | AI emits structured `SearchIntent` only; no SQL path |
| AI-driven transactions | ⚪ OUT OF SCOPE | AI never creates bookings/payments/collections |
| AI booking / payment / collections decisions | ⚪ OUT OF SCOPE | CRM is the only authority |
| AI KYC approval | ⚪ OUT OF SCOPE | CRM verifies KYC; Portal only reports "submitted" |
| AI permission modification | ⚪ OUT OF SCOPE | no AI path to RBAC |
| AI replacing deterministic business logic | ⚪ OUT OF SCOPE | matching/scoring/availability stay deterministic in CRM |
| AI recommendation engine / "what to buy" | ⚪ OUT OF SCOPE | explicitly forbidden by system instructions |

> **Channel Partner status detail:** removed = app code, DB tables, roles, permissions, UI.
> Remains historically = frozen migration files + documentation artifacts (per roadmap,
> these "must not be modified"). No active CP functionality, no DB artifacts, no tests
> referencing CP as a live domain.

## 2. FUTURE / V2 — Classification

| Status | Meaning |
|--------|---------|
| 🔵 **Planned** | named in an authoritative roadmap as a future phase |
| 🔵 **Proposed** | reasonable extension, but not yet named/approved in roadmap |
| 🔵 **Not planned** | no roadmap evidence; do not assume |
| ⚫ **Unknown** | cannot be classified from repository evidence |

### 2.1 AI — Future (V2) items

| Item | Status | Notes |
|------|--------|-------|
| Real provider adapters (OpenAI/OpenRouter/local) + provider factory | 🔵 Proposed | SDKs declared but unused; adapter layer not written |
| HTTP AI-search endpoint + authZ wiring | 🔵 Proposed | foundation contract exists; no route |
| AI chat/clarification conversational flow | 🔵 Proposed | contract supports `INCOMPLETE` + `AI_CHAT`; no UI/endpoint |
| AI audit/cost persistence + cost guardrails | 🔵 Proposed | no-op hooks today |
| AI observability dashboards | 🔵 Proposed | none |
| Provider failover / streaming / model routing | 🔵 Proposed | `supportsStreaming:false`; no failover |
| RAG / embeddings / vector search | 🔵 Not planned (roadmap 17 lists predictive/lead-scoring) | roadmap Phase 17 scope differs — see §3 |
| AI lead scoring / predictive analytics / recommendations | 🔵 **Roadmap Phase 17 scope, but NOT the implemented 17-A** | see discrepancy §3 |
### 2.2 Product — Future (V2) items per authoritative roadmap

| Item | Status | Notes |
|------|--------|-------|
| Customer Portal (live) | 🔵 Planned (Phase 11 Packet 3 groundwork exists; worker disabled) | integration surface built; portal itself external/future |
| SLA + Automation Engine (timers, escalations) | 🔵 Planned (roadmap Phase 15) | only task-level overdue today |
| Advanced Dashboards & BI (real-time, custom reports) | 🔵 Planned (roadmap Phase 16, PARTIAL) | analytics KPIs exist; full BI future |
| Full QA / Security / Performance (load, pen-test, a11y) | 🔵 Planned (roadmap Phase 18, PARTIAL) | not in CI |
| Brand / UI Transformation (design system) | 🔵 Planned (roadmap Phase 19) | |
| Production Readiness (CI/CD, monitoring, logging, backup) | 🔵 Planned (roadmap Phase 20) | |
| Marketing Attribution (campaign ROI, multi-touch) | 🔵 Planned (roadmap Phase 12) | attribution packet (12-1) partially done |
| After-Sales CRM (complaints/support ticketing) | 🔵 Roadmap Phase 14 | complaints (14-1) implemented; broader support future |
| Public structured search endpoint (WR-7 gap) | 🔵 Proposed | not yet implemented |
| Website recommendation engine | ⚫ Unknown | roadmap lists recommendations under AI; website-owned per PRD |

## 3. Discrepancies — Roadmap vs Repository

| Roadmap says | Repository actually has | Classification |
|--------------|--------------------------|----------------|
| Phase 11 Document Management: NOT STARTED | `Document` model + `/documents` routes + `document.service.ts` + `documents.test.ts` **implemented** | ⚠️ Roadmap outdated; code is ahead |
| Phase 12 Marketing Attribution: NOT STARTED | `packet12-1-attribution.test.ts` + lead UTM/campaign fields **implemented** | ⚠️ Roadmap outdated |
| Phase 14 After-Sales: NOT STARTED | Complaint Management (Phase 14-1) **implemented** | ⚠️ Roadmap outdated |
| Phase 16 Dashboards & BI: PARTIAL | `/analytics/kpis`, `analytics.service.ts`, `AnalyticsHub.tsx` **implemented** | 🟡 accurate (partial) |
| Phase 17 AI Layer: NOT STARTED — scope "AI lead scoring, predictive analytics, recommendations" | **Phase 17-A implemented** as natural-language → SearchIntent extraction (foundation); **not** lead-scoring/predictive/recommendation | ⚠️ Roadmap scope ≠ implemented 17-A scope |
| "~145 permissions" (older reports) | **84** permissions verified in `packages/shared` | ⚠️ Correction |

## 4. V1 vs V2 split (guidance)

- **V1 (current):** internal sales operations CRM + PWA + public listing/lead APIs + AI
  search foundation. Implemented domains are enumerated in
  [CRM-IMPLEMENTATION-STATUS](CRM-IMPLEMENTATION-STATUS.md).
- **V2 (future):** live customer portal, live AI search endpoint + chat, real AI provider,
  automation engine, advanced BI, production-readiness, brand/UI transformation,
  marketing attribution expansion, public structured search.

## 5. Guardrails for future work

- Any AI feature must keep **AI interprets / CRM decides / website displays**.
- Never re-introduce Channel Partner into this product (separate application).
- Never let AI make business/transactional/authorization decisions.