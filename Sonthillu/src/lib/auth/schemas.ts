import { z } from 'zod';

const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(80, 'Name must be 80 characters or fewer');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254, 'Email must be 254 characters or fewer');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number');

export const identityInputSchema = z.object({
  displayName: displayNameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
});

export const profileUpdateSchema = z.object({
  displayName: displayNameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  preferredContactChannel: z.enum(['PHONE', 'EMAIL', 'WHATSAPP']).optional(),
  preferredContactTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING']).optional(),
});

export type IdentityInput = z.infer<typeof identityInputSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
