import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { MessageTemplateKeyType, MessageTemplateInput } from '@rrh-ems/shared';

const p = prisma;

/**
 * §5 — WhatsApp message template service.
 *
 * Templates live in the `MessageTemplate` table (editable from an admin screen),
 * not hardcoded in components. The backend only ever RESOLVES a template's
 * body_text with contextual placeholders — the actual wa.me deep-link is built
 * on the frontend (spec §0 principle 5: WhatsApp is always a manual deep-link,
 * never sent server-side).
 *
 * Supported placeholders (substituted by resolveTemplate):
 *   {customer_name}, {property_name}, {pm_name}, {visit_date}
 */
export interface TemplateContext {
  customer_name?: string;
  property_name?: string;
  pm_name?: string;
  visit_date?: string;
}

function substitute(body: string, ctx: TemplateContext): string {
  return body
    .replace(/\{customer_name\}/g, ctx.customer_name ?? '')
    .replace(/\{property_name\}/g, ctx.property_name ?? '')
    .replace(/\{pm_name\}/g, ctx.pm_name ?? '')
    .replace(/\{visit_date\}/g, ctx.visit_date ?? '');
}

export class MessageTemplateService {
  /**
   * Resolve a template to its final body_text with placeholders substituted.
   * Returns null if no ACTIVE template exists for the key.
   */
  static async resolve(templateKey: string, ctx: TemplateContext = {}) {
    const tpl = await p.messageTemplate.findFirst({
      where: { template_key: templateKey, is_active: true },
    });
    if (!tpl) return null;
    return {
      template_key: tpl.template_key,
      name: tpl.name,
      body_text: substitute(tpl.body_text, ctx),
    };
  }

  /**
   * Admin: list all templates (active + inactive) for the editor UI.
   */
  static async list() {
    return await p.messageTemplate.findMany({ orderBy: { template_key: 'asc' } });
  }

  /**
   * Admin: upsert a template by key (create first time, then update body/name).
   */
  static async upsert(dto: MessageTemplateInput) {
    const existing = await p.messageTemplate.findUnique({ where: { template_key: dto.template_key } });
    if (existing) {
      return await p.messageTemplate.update({
        where: { template_key: dto.template_key },
        data: {
          name: dto.name,
          body_text: dto.body_text,
          is_active: dto.is_active ?? true,
        },
      });
    }
    return await p.messageTemplate.create({
      data: {
        template_key: dto.template_key,
        name: dto.name,
        body_text: dto.body_text,
        is_active: dto.is_active ?? true,
      },
    });
  }

  /**
   * Admin: deactivate a template (soft-disable, not delete — keeps history).
   */
  static async setActive(templateKey: string, isActive: boolean) {
    return await p.messageTemplate.update({
      where: { template_key: templateKey },
      data: { is_active: isActive },
    });
  }
}
