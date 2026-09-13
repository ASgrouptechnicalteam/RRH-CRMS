import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';

const logAudit = async (
  userId: string,
  actionType: string,
  entity: string,
  entityId: string,
  newValue?: string,
) => {
  await prisma.auditLog.create({
    data: { userId, actionType, entity, entityId, newValue },
  });
};

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, content, validUntil } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        status: 'Draft',
        createdBy: req.user!.id,
      },
    });

    await logAudit(req.user!.id, 'CREATE', 'Announcement', announcement.id);
    res.json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

export const ingestCustomer = async (req: Request, res: Response) => {
  try {
    const { phone, name, email, address, aadharNumber } = req.body;

    // Was a hardcoded placeholder hash ('dummy_hash_to_be_replaced') — every
    // customer created this way could never actually log in, since nothing
    // else in the codebase ever replaced it. Generates a real temp password
    // now, same shape as the CRM-sync intake path (portal.controller.ts).
    const tempPassword = crypto.randomBytes(4).toString('hex').toLowerCase();

    const customer = await prisma.customer.create({
      data: {
        phone,
        name,
        email,
        address,
        passwordHash: await bcrypt.hash(tempPassword, 10),
      },
    });

    await logAudit(req.user!.id, 'CREATE', 'Customer', customer.id);
    // temp_password is returned once, at creation, for the DEM to hand-deliver
    // — never stored or logged in plaintext beyond this response.
    res.json({ ...customer, passwordHash: undefined, temp_password: tempPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to ingest customer' });
  }
};

export const createPropertyUpdate = async (req: Request, res: Response) => {
  try {
    const { propertyId, stage, details, mediaUrl } = req.body;
    if (!propertyId || !stage) {
      return res.status(400).json({ message: 'propertyId and stage are required' });
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const update = await prisma.propertyUpdate.create({
      data: { propertyId, stage, details, mediaUrl, createdBy: req.user!.id },
    });

    await logAudit(req.user!.id, 'CREATE', 'PropertyUpdate', update.id);
    res.json(update);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create property update' });
  }
};

// ingestBooking and createCarousel were no-op stubs wired live into routes —
// calling them silently did nothing to the DB, which could mislead a DEM
// user into thinking data was saved. Removed rather than faked, since:
// - booking ingestion is now superseded by the CRM handoff sync
//   (portal.controller.ts's receiveHandoff) — bookings should no longer be
//   manually entered here at all.
// - Carousel creation needs a real design decision (image upload, targeting)
//   Sandeep should make deliberately, not a route that silently accepts and
//   discards a POST body.
