import { describe, expect, it, vi, type Mock } from 'vitest';
import { createLeadService } from './service';
import type { LeadServiceDeps } from './service';
import {
  callbackRequestSchema,
  multiPropertyEnquirySchema,
  projectEnquirySchema,
  propertyEnquirySchema,
  generalEnquirySchema,
  sellerEnquirySchema,
} from './schemas';
import { buildLeadEvent, trackLeadEvent } from './analytics';
import { MemoryIdempotencyStore, hashPayload, canonicalize } from './idempotency';
import { LeadError, mapPropertyTypeToCrm } from './types';
import type { CrmLeadPayload, CrmLeadSubmission } from './types';
import type { Property } from '../../types/property';
import type { Project } from '../../types/project';

const validContact = {
  name: 'Test User',
  phone: '+919999999999',
};

const validProperty = (id = 1): Property =>
  ({
    id,
    property_code: `PR-${id}`,
    title: `Property ${id}`,
    description: null,
    category: 'APARTMENT',
    price: 5000000,
    area_sqft: 1200,
    location: 'Miyapur, Hyderabad',
    address: null,
    bedrooms: 2,
    bathrooms: 2,
    facing: null,
    amenities: null,
    possession_status: null,
    details: null,
    seo_title: null,
    seo_keywords: null,
    created_at: new Date().toISOString(),
    images: [],
    state: 'Telangana',
    city: 'Hyderabad',
    locality: 'Miyapur',
    pincode: '500049',
    listing_type: 'NEW',
    project: null,
  }) as Property;

const validProject = (id = 1): Project =>
  ({
    id,
    project_code: `PRJ-${id}`,
    name: `Project ${id}`,
    location: 'Gachibowli, Hyderabad',
    total_area: '2 acres',
    launch_date: null,
    status: 'UNDER_CONSTRUCTION',
    amenities: null,
    created_at: new Date().toISOString(),
  }) as Project;

interface Harness {
  service: ReturnType<typeof createLeadService>;
  submitMock: Mock<(payload: CrmLeadPayload) => Promise<CrmLeadSubmission>>;
  getPropertyMock: Mock<(id: number) => Promise<Property | null>>;
  getProjectMock: Mock<(id: number) => Promise<Project | null>>;
  submitted: CrmLeadPayload[];
}

function makeHarness(overrides: Partial<LeadServiceDeps> = {}): Harness {
  const submitted: CrmLeadPayload[] = [];
  const submitMock = vi.fn(async (payload: CrmLeadPayload) => {
    submitted.push(payload);
    return { leadId: 1000 + submitted.length, leadCode: `SON-LD-${submitted.length}` };
  });
  const getPropertyMock = vi.fn(async (id: number) => validProperty(id));
  const getProjectMock = vi.fn(async (id: number) => validProject(id));

  const service = createLeadService(
    {
      submitToCrm: submitMock,
      getPropertyById: getPropertyMock,
      getProjectById: getProjectMock,
      ...overrides,
    },
    { idempotencyStore: new MemoryIdempotencyStore() }
  );
  return { service, submitMock, getPropertyMock, getProjectMock, submitted };
}

function makeRateLimitedHarness(max: number): {
  service: ReturnType<typeof createLeadService>;
} {
  const service = createLeadService(
    {
      submitToCrm: vi.fn(async () => ({ leadId: 1, leadCode: 'SON-LD-1' })),
      getPropertyById: vi.fn(async (id: number) => validProperty(id)),
      getProjectById: vi.fn(async (id: number) => validProject(id)),
    },
    { rateLimitMax: max, idempotencyStore: new MemoryIdempotencyStore() }
  );
  return { service };
}

describe('lead schemas', () => {
  it('accepts a valid property enquiry', () => {
    const input = { propertyId: 1, contact: validContact, consent: true };
    expect(propertyEnquirySchema.parse(input).propertyId).toBe(1);
  });

  it('rejects a property enquiry without consent', () => {
    const input = { propertyId: 1, contact: validContact, consent: false };
    expect(() => propertyEnquirySchema.parse(input)).toThrow();
  });

  it('rejects an invalid phone number', () => {
    const input = {
      propertyId: 1,
      contact: { name: 'X', phone: 'not-a-phone' },
      consent: true,
    };
    expect(() => propertyEnquirySchema.parse(input)).toThrow();
  });

  it('rejects an invalid preferred contact time', () => {
    const input = {
      propertyId: 1,
      contact: validContact,
      consent: true,
      preferredContactTime: 'MIDNIGHT',
    };
    expect(() => propertyEnquirySchema.parse(input)).toThrow();
  });

  it('accepts MORNING/AFTERNOON/EVENING contact times', () => {
    for (const time of ['MORNING', 'AFTERNOON', 'EVENING']) {
      const input = {
        propertyId: 1,
        contact: validContact,
        consent: true,
        preferredContactTime: time,
      };
      expect(propertyEnquirySchema.parse(input).preferredContactTime).toBe(time);
    }
  });

  it('rejects a non-positive property id', () => {
    const input = { propertyId: 0, contact: validContact, consent: true };
    expect(() => propertyEnquirySchema.parse(input)).toThrow();
  });

  it('rejects oversized message input', () => {
    const input = {
      propertyId: 1,
      contact: validContact,
      consent: true,
      message: 'x'.repeat(2001),
    };
    expect(() => propertyEnquirySchema.parse(input)).toThrow();
  });

  it('rejects an empty multi-property selection', () => {
    const input = { propertyIds: [], contact: validContact, consent: true };
    expect(() => multiPropertyEnquirySchema.parse(input)).toThrow();
  });

  it('rejects a multi-property selection above the maximum', () => {
    const input = {
      propertyIds: Array.from({ length: 11 }, (_, i) => i + 1),
      contact: validContact,
      consent: true,
    };
    expect(() => multiPropertyEnquirySchema.parse(input)).toThrow();
  });

  it('accepts a valid project enquiry and callback request', () => {
    const projectInput = { projectId: 5, contact: validContact, consent: true };
    expect(projectEnquirySchema.parse(projectInput).projectId).toBe(5);
    const callbackInput = { contact: validContact, consent: true };
    expect(callbackRequestSchema.parse(callbackInput).contact.name).toBe('Test User');
  });

  it('strips unknown fields (e.g. a browser-supplied customerId)', () => {
    const parsed = propertyEnquirySchema.parse({
      propertyId: 1,
      contact: validContact,
      consent: true,
      customerId: 999,
    });
    expect(parsed).not.toHaveProperty('customerId');
  });

  it('accepts a valid general enquiry', () => {
    const input = { contact: validContact, consent: true, message: 'Hello' };
    expect(generalEnquirySchema.parse(input).message).toBe('Hello');
  });

  it('accepts a valid seller enquiry', () => {
    const input = {
      contact: validContact,
      consent: true,
      propertyType: 'VILLA',
      location: 'Gachibowli',
      expectedPrice: 15000000,
    };
    const parsed = sellerEnquirySchema.parse(input);
    expect(parsed.propertyType).toBe('VILLA');
    expect(parsed.expectedPrice).toBe(15000000);
  });

  it('rejects a seller enquiry without property type or location', () => {
    expect(() =>
      sellerEnquirySchema.parse({ contact: validContact, consent: true, location: 'Gachibowli' })
    ).toThrow();
    expect(() =>
      sellerEnquirySchema.parse({ contact: validContact, consent: true, propertyType: 'VILLA' })
    ).toThrow();
  });
});

describe('property enquiry', () => {
  it('creates a lead with resolved property context', async () => {
    const h = makeHarness();
    const result = await h.service.createPropertyEnquiry({
      propertyId: 3,
      contact: validContact,
      consent: true,
      preferredContactTime: 'EVENING',
      message: 'Interested in this property.',
    });
    expect(h.submitMock).toHaveBeenCalledTimes(1);
    expect(h.submitted[0]).toMatchObject({
      customer_name: 'Test User',
      phone: '+919999999999',
      enquiry_type: 'property',
      property_ids: [3],
      preferred_contact_time: 'after_hours',
      notes: 'Interested in this property.',
      property_type_preference: 'APARTMENT',
      preferred_location: 'Miyapur, Hyderabad',
      budget_max: 5000000,
    });
    expect(result.leadId).toBeGreaterThan(0);
  });

  it('rejects an invalid property id', async () => {
    const h = makeHarness();
    await expect(
      h.service.createPropertyEnquiry({
        propertyId: 0,
        contact: validContact,
        consent: true,
      })
    ).rejects.toThrow(LeadError);
    expect(h.submitMock).not.toHaveBeenCalled();
  });

  it('rejects an unavailable property', async () => {
    const h = makeHarness({
      getPropertyById: vi.fn(async () => null),
    });
    await expect(
      h.service.createPropertyEnquiry({
        propertyId: 7,
        contact: validContact,
        consent: true,
      })
    ).rejects.toThrow('no longer available');
    expect(h.submitMock).not.toHaveBeenCalled();
  });

  it('surfaces a safe user message on CRM failure', async () => {
    const h = makeHarness({
      submitToCrm: vi.fn(async () => {
        throw new Error('CRM 500 raw detail');
      }),
    });
    await expect(
      h.service.createPropertyEnquiry({
        propertyId: 1,
        contact: validContact,
        consent: true,
      })
    ).rejects.toMatchObject({
      code: 'CRM_UNAVAILABLE',
      userMessage: expect.stringContaining('try again'),
    });
  });
});

describe('project enquiry', () => {
  it('creates a lead with resolved project context', async () => {
    const h = makeHarness();
    const result = await h.service.createProjectEnquiry({
      projectId: 9,
      contact: validContact,
      consent: true,
      preferredContactTime: 'MORNING',
    });
    expect(h.submitted[0]).toMatchObject({
      enquiry_type: 'project',
      project_id: 9,
      preferred_contact_time: 'business_hours',
      preferred_location: 'Gachibowli, Hyderabad',
    });
    expect(result.leadId).toBeGreaterThan(0);
  });

  it('rejects an invalid project', async () => {
    const h = makeHarness({
      getProjectById: vi.fn(async () => null),
    });
    await expect(
      h.service.createProjectEnquiry({
        projectId: 42,
        contact: validContact,
        consent: true,
      })
    ).rejects.toThrow('project');
    expect(h.submitMock).not.toHaveBeenCalled();
  });

  it('surfaces a safe user message on CRM failure', async () => {
    const h = makeHarness({
      submitToCrm: vi.fn(async () => {
        throw new LeadError('CRM_REJECTED', 'CRM internal error string', false);
      }),
    });
    await expect(
      h.service.createProjectEnquiry({
        projectId: 1,
        contact: validContact,
        consent: true,
      })
    ).rejects.toMatchObject({ code: 'CRM_REJECTED' });
  });
});

describe('multi-property enquiry', () => {
  it('deduplicates repeated ids and submits all selected', async () => {
    const h = makeHarness();
    const result = await h.service.createMultiPropertyEnquiry({
      propertyIds: [1, 2, 2, 3],
      contact: validContact,
      consent: true,
    });
    expect(h.submitted[0].property_ids).toEqual([1, 2, 3]);
    expect(result.submittedPropertyIds).toEqual([1, 2, 3]);
    expect(result.unavailablePropertyIds).toEqual([]);
  });

  it('submits only eligible properties when some are unavailable', async () => {
    const h = makeHarness({
      getPropertyById: vi.fn(async (id: number) => (id === 2 ? null : validProperty(id))),
    });
    const result = await h.service.createMultiPropertyEnquiry({
      propertyIds: [1, 2, 3],
      contact: validContact,
      consent: true,
    });
    expect(h.submitted[0].property_ids).toEqual([1, 3]);
    expect(result.submittedPropertyIds).toEqual([1, 3]);
    expect(result.unavailablePropertyIds).toEqual([2]);
  });

  it('rejects when all selected properties are unavailable', async () => {
    const h = makeHarness({
      getPropertyById: vi.fn(async () => null),
    });
    await expect(
      h.service.createMultiPropertyEnquiry({
        propertyIds: [1, 2],
        contact: validContact,
        consent: true,
      })
    ).rejects.toMatchObject({ code: 'ALL_PROPERTIES_UNAVAILABLE' });
    expect(h.submitMock).not.toHaveBeenCalled();
  });

  it('rejects a selection containing invalid ids', async () => {
    const h = makeHarness();
    await expect(
      h.service.createMultiPropertyEnquiry({
        propertyIds: [1, -1, 0, 2.5],
        contact: validContact,
        consent: true,
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(h.submitMock).not.toHaveBeenCalled();
  });

  it('enforces the maximum selection', async () => {
    const h = makeHarness();
    await expect(
      h.service.createMultiPropertyEnquiry({
        propertyIds: Array.from({ length: 11 }, (_, i) => i + 1),
        contact: validContact,
        consent: true,
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(h.submitMock).not.toHaveBeenCalled();
  });
});

describe('callback request', () => {
  it('creates a callback lead without property context', async () => {
    const h = makeHarness();
    await h.service.createCallbackRequest({
      contact: validContact,
      consent: true,
      preferredContactTime: 'AFTERNOON',
    });
    expect(h.submitted[0]).toMatchObject({
      enquiry_type: 'call',
      preferred_contact_time: 'business_hours',
    });
    expect(h.submitted[0].property_ids).toBeUndefined();
  });

  it('attaches optional property context when provided', async () => {
    const h = makeHarness();
    await h.service.createCallbackRequest({
      contact: validContact,
      consent: true,
      context: { propertyId: 4 },
    });
    expect(h.submitted[0].property_ids).toEqual([4]);
  });

  it('rejects callback context for an unavailable property', async () => {
    const h = makeHarness({
      getPropertyById: vi.fn(async () => null),
    });
    await expect(
      h.service.createCallbackRequest({
        contact: validContact,
        consent: true,
        context: { propertyId: 4 },
      })
    ).rejects.toMatchObject({ code: 'PROPERTY_UNAVAILABLE' });
  });
});

describe('general enquiry', () => {
  it('creates a consultation lead', async () => {
    const h = makeHarness();
    await h.service.createGeneralEnquiry({
      contact: validContact,
      consent: true,
      message: 'General query',
    });
    expect(h.submitted[0]).toMatchObject({
      enquiry_type: 'consultation',
      notes: 'General query',
    });
  });
});

describe('seller enquiry', () => {
  it('creates an appraisal lead with mapped budget_max', async () => {
    const h = makeHarness();
    await h.service.createSellerEnquiry({
      contact: validContact,
      consent: true,
      propertyType: 'VILLA',
      location: 'Manikonda',
      expectedPrice: 20000000,
    });
    expect(h.submitted[0]).toMatchObject({
      enquiry_type: 'appraisal',
      property_type_preference: 'RESIDENTIAL_VILLA',
      preferred_location: 'Manikonda',
      budget_max: 20000000,
    });
  });
});

describe('authenticated vs guest context', () => {
  it('uses session customer identity instead of browser-supplied contact', async () => {
    const h = makeHarness();
    await h.service.createPropertyEnquiry(
      {
        propertyId: 1,
        contact: { name: 'Forged Name', phone: '+919111111111', email: 'forged@example.com' },
        consent: true,
      },
      {
        customer: {
          displayName: 'Real Customer',
          phone: '+919222222222',
          email: 'real@example.com',
        },
      }
    );
    expect(h.submitted[0]).toMatchObject({
      customer_name: 'Real Customer',
      phone: '+919222222222',
      email: 'real@example.com',
    });
  });

  it('never includes a browser-supplied customerId in the CRM payload', async () => {
    const h = makeHarness();
    const raw = {
      propertyId: 1,
      contact: { name: 'Guest User', phone: '+919000000000' },
      consent: true,
      customerId: 4242,
    };
    await h.service.createPropertyEnquiry(raw);
    const payload = h.submitted[0];
    expect(payload).not.toHaveProperty('customerId');
    expect(JSON.stringify(payload)).not.toContain('4242');
  });

  it('allows guest enquiry without authentication', async () => {
    const h = makeHarness();
    const result = await h.service.createPropertyEnquiry({
      propertyId: 1,
      contact: validContact,
      consent: true,
    });
    expect(result.leadId).toBeGreaterThan(0);
  });

  it('requires valid contact for guest enquiry', async () => {
    const h = makeHarness();
    await expect(
      h.service.createPropertyEnquiry({
        propertyId: 1,
        contact: { name: '', phone: '123' },
        consent: true,
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('idempotency', () => {
  it('does not create a duplicate lead when the same request identifier is reused', async () => {
    const h = makeHarness();
    const input = {
      propertyId: 1,
      contact: validContact,
      consent: true,
      idempotencyKey: 'req-abc-12345',
    };
    const first = await h.service.createPropertyEnquiry(input);
    const second = await h.service.createPropertyEnquiry(input);
    expect(h.submitMock).toHaveBeenCalledTimes(1);
    expect(second.leadId).toBe(first.leadId);
  });

  it('allows a retry after a failed submission (failure not recorded)', async () => {
    let calls = 0;
    const h = makeHarness({
      submitToCrm: vi.fn(async (payload: CrmLeadPayload) => {
        calls += 1;
        if (calls === 1) throw new Error('boom');
        return { leadId: 500, leadCode: 'SON-LD-2' };
      }),
    });
    const input = {
      propertyId: 1,
      contact: validContact,
      consent: true,
      idempotencyKey: 'req-retry-12345',
    };
    await expect(h.service.createPropertyEnquiry(input)).rejects.toThrow();
    const result = await h.service.createPropertyEnquiry(input);
    expect(calls).toBe(2);
    expect(result.leadId).toBe(500);
  });

  it('deduplicates identical payloads even without an explicit key', async () => {
    const h = makeHarness();
    const input = { propertyId: 1, contact: validContact, consent: true };
    const first = await h.service.createPropertyEnquiry(input);
    const second = await h.service.createPropertyEnquiry(input);
    expect(h.submitMock).toHaveBeenCalledTimes(1);
    expect(second.leadId).toBe(first.leadId);
  });

  it('hashes payloads deterministically', () => {
    expect(hashPayload({ a: 1 })).toBe(hashPayload({ a: 1 }));
    expect(hashPayload({ a: 1 })).not.toBe(hashPayload({ a: 2 }));
  });
});

describe('rate limiting', () => {
  it('blocks submissions beyond the configured maximum per IP', async () => {
    const h = makeHarness();
    const limited = makeRateLimitedHarness(2);
    const input = { propertyId: 1, contact: validContact, consent: true };
    await limited.service.createPropertyEnquiry(input, { ip: '1.2.3.4' });
    await limited.service.createPropertyEnquiry(input, { ip: '1.2.3.4' });
    await expect(
      limited.service.createPropertyEnquiry(input, { ip: '1.2.3.4' })
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    expect(h.submitMock).toBeDefined();
  });

  it('rate limits independently per IP', async () => {
    const limited = makeRateLimitedHarness(1);
    const input = { propertyId: 1, contact: validContact, consent: true };
    await limited.service.createPropertyEnquiry(input, { ip: '10.0.0.1' });
    await expect(
      limited.service.createPropertyEnquiry(input, { ip: '10.0.0.2' })
    ).resolves.toBeTruthy();
  });
});

describe('security', () => {
  it('never exposes the CRM API key in the payload', async () => {
    const h = makeHarness();
    await h.service.createPropertyEnquiry({
      propertyId: 1,
      contact: validContact,
      consent: true,
    });
    expect(JSON.stringify(h.submitted[0])).not.toMatch(/api[_-]?key/i);
  });

  it('never sends internal CRM fields or private location data', async () => {
    const h = makeHarness();
    await h.service.createPropertyEnquiry({
      propertyId: 1,
      contact: validContact,
      consent: true,
    });
    const payload = h.submitted[0];
    expect(payload).not.toHaveProperty('latitude');
    expect(payload).not.toHaveProperty('seller_details');
    expect(payload).not.toHaveProperty('source');
    expect(payload).not.toHaveProperty('status');
  });

  it('maps property types to the CRM vocabulary', () => {
    expect(mapPropertyTypeToCrm('APARTMENT')).toBe('APARTMENT');
    expect(mapPropertyTypeToCrm('VILLA')).toBe('RESIDENTIAL_VILLA');
    expect(mapPropertyTypeToCrm('INDEPENDENT_HOUSE')).toBe('INDEPENDENT_HOUSE');
  });
});

describe('analytics', () => {
  it('builds typed events without PII', () => {
    const event = buildLeadEvent('enquiry_submitted', {
      enquiryType: 'PROPERTY_ENQUIRY',
      surface: 'property_detail',
      propertyId: 7,
    });
    expect(event.eventType).toBe('enquiry_submitted');
    expect(event.enquiryType).toBe('PROPERTY_ENQUIRY');
    expect(event.timestamp).toBeDefined();
    expect(event).not.toHaveProperty('name');
    expect(event).not.toHaveProperty('phone');
    expect(event).not.toHaveProperty('email');
  });

  it('builds multi-property events with a property count, no ids list', () => {
    const event = buildLeadEvent('multi_property_enquiry_submitted', {
      surface: 'shortlist_page',
      propertyCount: 3,
    });
    expect(event.propertyCount).toBe(3);
    expect(event).not.toHaveProperty('propertyIds');
  });

  it('tracks via the documented custom event name', () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent } as unknown as Window & typeof globalThis);
    try {
      trackLeadEvent(buildLeadEvent('call_now_clicked', { surface: 'property_detail' }));
      const evt = dispatchEvent.mock.calls[0][0] as CustomEvent;
      expect(evt.type).toBe('sonthillu:lead-activity');
      expect(evt.detail.eventType).toBe('call_now_clicked');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('idempotency hashing', () => {
  it('canonicalizes objects deterministically regardless of key order', () => {
    const obj1 = { name: 'John', phone: '1234567890' };
    const obj2 = { phone: '1234567890', name: 'John' };

    expect(canonicalize(obj1)).toBe(canonicalize(obj2));
    expect(hashPayload(obj1)).toBe(hashPayload(obj2));
  });

  it('canonicalizes nested objects deterministically', () => {
    const obj1 = { a: 1, b: { d: 4, c: 3 } };
    const obj2 = { b: { c: 3, d: 4 }, a: 1 };

    expect(canonicalize(obj1)).toBe(canonicalize(obj2));
    expect(hashPayload(obj1)).toBe(hashPayload(obj2));
  });

  it('canonicalizes arrays correctly', () => {
    const obj1 = { arr: [1, 2, 3] };
    const obj2 = { arr: [1, 2, 3] };
    const obj3 = { arr: [3, 2, 1] };

    expect(canonicalize(obj1)).toBe(canonicalize(obj2));
    expect(hashPayload(obj1)).toBe(hashPayload(obj2));
    expect(hashPayload(obj1)).not.toBe(hashPayload(obj3));
  });
});
