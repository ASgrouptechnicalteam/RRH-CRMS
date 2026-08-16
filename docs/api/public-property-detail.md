# Public Property Detail API

**Endpoint:** `GET /api/v1/public/:brand/properties/:id`

**Purpose:** Retrieve public-safe property details for consumption by Sonthillu and RRH websites.

---

## Authentication

All requests require a valid API key in the `x-api-key` header.

```
x-api-key: <your-api-key>
```

**Error Responses:**
- `401` — Missing API key
- `401` — Invalid or inactive API key

---

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `brand` | string | Yes | Brand identifier: `sonthillu` or `rrh` |
| `id` | integer | Yes | Property ID |

**Brand Validation:**
- `400` — Invalid brand (not `sonthillu` or `rrh`)

---

## Success Response

**Status:** `200 OK`

### Response Schema

```typescript
interface PublicPropertyDetail {
  id: number;
  property_code: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  area_sqft: number;
  location: string;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  facing: string | null;
  amenities: string | null;
  possession_status: string | null;
  details: object | null;
  seo_title: string | null;
  seo_keywords: string | null;
  created_at: string;
  
  // Structured location
  state: string | null;
  city: string | null;
  locality: string | null;
  pincode: string | null;
  
  // Listing classification
  listing_type: string | null;
  
  // Images (only APPROVED)
  images: PublicPropertyImage[];
  
  // Project relationship (if exists)
  project: PublicProjectReference | null;
}

interface PublicPropertyImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  alt_text: string | null;
  sort_order: number;
}

interface PublicProjectReference {
  id: number;
  project_code: string;
  name: string;
  location: string;
  status: string;
}
```

### Example Response

```json
{
  "id": 123,
  "property_code": "SON-APT-001",
  "title": "3 BHK Apartment in Miyapur",
  "description": "Premium apartment with modern amenities",
  "category": "APARTMENT",
  "price": 7500000,
  "area_sqft": 1500,
  "location": "Miyapur",
  "address": "123 Main Street, Miyapur, Hyderabad",
  "bedrooms": 3,
  "bathrooms": 2,
  "facing": "EAST",
  "amenities": "[\"Club House\",\"Swimming Pool\",\"Gym\"]",
  "possession_status": "READY_TO_MOVE",
  "details": null,
  "seo_title": "3 BHK Apartment in Miyapur",
  "seo_keywords": "apartment, miyapur, 3bhk",
  "created_at": "2024-01-15T10:30:00.000Z",
  "state": "Telangana",
  "city": "Hyderabad",
  "locality": "Miyapur",
  "pincode": "500049",
  "listing_type": "NEW",
  "images": [
    {
      "id": 1,
      "image_url": "https://example.com/image1.jpg",
      "is_primary": true,
      "alt_text": "Living room view",
      "sort_order": 1
    }
  ],
  "project": {
    "id": 45,
    "project_code": "PRJ-001",
    "name": "Green Valley Apartments",
    "location": "Miyapur",
    "status": "UNDER_CONSTRUCTION"
  }
}
```

---

## Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| `400` | `Invalid brand specified in URL` | Brand is not `sonthillu` or `rrh` |
| `401` | `API Key missing` | No `x-api-key` header |
| `401` | `Invalid or inactive API Key` | API key is invalid or deactivated |
| `404` | `Property not found or not available` | Property doesn't exist, isn't published, or isn't available |
| `500` | `Failed to fetch property detail` | Server error |

---

## Business Rules

### Publication Check
Property must be published to the requesting company via `PropertyPublication`:
```sql
WHERE property_id = :id 
  AND company_id = :companyId 
  AND is_published = true
```

### Availability Check
Property must be publicly available:
```sql
WHERE status = 'LIVE' 
   OR (status = 'LOCKED' AND locked_until < NOW())
```

**Excluded statuses:**
- `PENDING_VERIFICATION` — Not yet approved
- `PENDING_DM_POLISH` — Awaiting DM review
- `PENDING_MD_APPROVAL` — Awaiting MD approval
- `REJECTED` — Rejected
- `LOCKED` (active) — Reserved by booking
- `BOOKED` — Sold/Booked
- `SOLD` — Sold

### Image Filtering
Only images with `status = 'APPROVED'` are returned.

### Brand Scoping
Properties are scoped to the company associated with the API key. A property published to Company A cannot be accessed via Company B's API key.

---

## Security

### Fields Excluded (Never Exposed)

| Category | Fields |
|----------|--------|
| **Internal IDs** | `company_id`, `branch_id`, `assigned_pm_id`, `created_by_id` |
| **Workflow State** | `status`, `rejection_reason`, `locked_until`, `locked_by_booking_id` |
| **Approval Timestamps** | `verified_by_pm_at`, `dm_polished_at`, `md_approved_at` |
| **Brand Type** | `brand_type` (internal classification) |
| **GPS Coordinates** | `latitude`, `longitude` |
| **Employee Relations** | `assigned_pm`, `created_by` |
| **Internal Documents** | `documents`, `internal_notes` |
| **Seller Information** | Any seller/contact data |

### Rate Limiting
- Read endpoint: Standard rate limiting applied
- Write endpoint (leads): Separate rate limiting

---

## Known Gaps

| Gap | Status | Impact |
|-----|--------|--------|
| Image approval workflow | Not yet implemented | All images currently marked APPROVED |
| RERA information | Not in schema | Cannot display RERA registration |
| Price range (priceFrom/priceTo) | Single price field only | Cannot show price range |
| Property slug | Uses `property_code` | URL uses property code, not human-friendly slug |

---

## Integration Notes

### Sonthillu Website (Next.js BFF)

```typescript
// Server-side only (never expose API key to browser)
const property = await crmFetch<PublicPropertyDetail>(
  `/properties/${id}`,
  { cache: 'no-store' }
);
```

### RRH Website

Same pattern — server-side BFF with API key in environment variables.

---

## Test Coverage

See `tests/api/public-property-detail.test.ts` for comprehensive test cases:

1. ✅ Published + available + correct brand → success
2. ✅ Published for different brand → denied (404)
3. ✅ Reserved (LOCKED) → not public (404)
4. ✅ SOLD → not public (404)
5. ✅ Unpublished → not public (404)
6. ✅ Seller fields absent
7. ✅ Internal fields absent
8. ✅ Exact GPS absent
9. ✅ Internal documents absent
10. ✅ Invalid property ID → 404
11. ✅ Invalid brand → 400
12. ✅ API unauthorized/missing key → 401
