import { z } from 'zod';
import type {
  CallbackRequest,
  MultiPropertyEnquiry,
  PreferredContactTime,
  ProjectEnquiry,
  PropertyEnquiry,
  GeneralEnquiry,
  SellerEnquiry,
} from './types';

/** Reasonable maximum number of properties in a single multi-property enquiry. */
export const MULTI_PROPERTY_MAX = 10;

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Please enter your name')
  .max(80, 'Name must be 80 characters or fewer');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254, 'Email must be 254 characters or fewer')
  .optional()
  .or(z.literal(''));

const preferredContactTimeSchema = z.enum(['MORNING', 'AFTERNOON', 'EVENING']);

const messageSchema = z
  .string()
  .trim()
  .max(2000, 'Message must be 2000 characters or fewer')
  .optional();

const consentSchema = z.literal(true, {
  errorMap: () => ({ message: 'Please accept to allow us to contact you' }),
});

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8, 'Missing request identifier')
  .max(128, 'Request identifier is too long')
  .optional();

const utmSchema = z.object({
  utmSource: z.string().trim().max(128).optional(),
  utmMedium: z.string().trim().max(128).optional(),
  utmCampaign: z.string().trim().max(128).optional(),
});

const contactSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
});

const baseEnquirySchema = z.object({
  contact: contactSchema,
  preferredContactTime: preferredContactTimeSchema.optional(),
  message: messageSchema,
  consent: consentSchema,
  utm: utmSchema.optional(),
  idempotencyKey: idempotencyKeySchema,
});

export const propertyEnquirySchema = baseEnquirySchema.extend({
  propertyId: z.number().int().positive('Select a valid property'),
});

export const projectEnquirySchema = baseEnquirySchema.extend({
  projectId: z.number().int().positive('Select a valid project'),
});

export const multiPropertyEnquirySchema = baseEnquirySchema.extend({
  propertyIds: z
    .array(z.number().int().positive('Select a valid property'))
    .min(1, 'Select at least one property')
    .max(MULTI_PROPERTY_MAX, `Select up to ${MULTI_PROPERTY_MAX} properties`),
});

export const callbackRequestSchema = baseEnquirySchema.extend({
  context: z
    .object({
      propertyId: z.number().int().positive().optional(),
      projectId: z.number().int().positive().optional(),
    })
    .optional(),
});

export const generalEnquirySchema = baseEnquirySchema;

const propertyTypeSchema = z.enum(['APARTMENT', 'VILLA', 'INDEPENDENT_HOUSE']);

export const sellerEnquirySchema = baseEnquirySchema.extend({
  propertyType: propertyTypeSchema,
  location: z.string().trim().min(2, 'Enter a location').max(128, 'Location is too long'),
  expectedPrice: z.number().positive('Expected price must be positive').optional(),
});

export const idempotencyKeyInputSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
});

export const preferredContactTimeValues: PreferredContactTime[] = [
  'MORNING',
  'AFTERNOON',
  'EVENING',
];

export type PropertyEnquiryInput = z.infer<typeof propertyEnquirySchema>;
export type ProjectEnquiryInput = z.infer<typeof projectEnquirySchema>;
export type MultiPropertyEnquiryInput = z.infer<typeof multiPropertyEnquirySchema>;
export type CallbackRequestInput = z.infer<typeof callbackRequestSchema>;
export type GeneralEnquiryInput = z.infer<typeof generalEnquirySchema>;
export type SellerEnquiryInput = z.infer<typeof sellerEnquirySchema>;

export type {
  CallbackRequest,
  MultiPropertyEnquiry,
  PreferredContactTime,
  ProjectEnquiry,
  PropertyEnquiry,
  GeneralEnquiry,
  SellerEnquiry,
};

export const isValidPreferredContactTime = (value: unknown): value is PreferredContactTime =>
  typeof value === 'string' && (preferredContactTimeValues as readonly string[]).includes(value);
