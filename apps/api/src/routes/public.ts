import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// Public API Key Middleware
const authenticatePublicKey = async (req: any, res: Response, next: any) => {
  const apiKey = req.header('x-api-key');
  if (!apiKey) {
    return res.status(401).json({ error: 'API Key missing' });
  }

  try {
    const validKey = await p.publicApiKey.findUnique({
      where: { api_key: apiKey },
      include: { company: true },
    });

    if (!validKey || !validKey.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive API Key' });
    }

    req.apiKeyContext = validKey;
    next();
  } catch (err) {
    console.error('API Key Auth error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

router.use(authenticatePublicKey);

// GET /api/v1/public/:brand/properties
router.get('/:brand/properties', async (req: any, res: Response) => {
  try {
    const { brand } = req.params;
    let brand_type = '';

    if (brand.toLowerCase() === 'rrh') {
      brand_type = 'RADHA_REAL_HOMES';
    } else if (brand.toLowerCase() === 'sonthillu') {
      brand_type = 'SONTHILLU';
    } else {
      return res.status(400).json({ error: 'Invalid brand specified in URL' });
    }

    const properties = await p.property.findMany({
      where: { 
        brand_type,
        status: 'LIVE' // Only show live properties to the public
      },
      include: {
        images: true,
        faqs: true,
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json(properties);
  } catch (error) {
    console.error('Fetch public properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// POST /api/v1/public/:brand/leads
router.post('/:brand/leads', async (req: any, res: Response) => {
  try {
    const { brand } = req.params;
    const { customer_name, phone, email, notes, property_type_preference, preferred_location, budget_max } = req.body;
    
    const companyId = req.apiKeyContext.company_id;

    if (!customer_name || !phone) {
      return res.status(400).json({ error: 'customer_name and phone are required' });
    }

    // Auto-generate Lead Code
    const year = new Date().getFullYear();
    const count = await p.lead.count();
    const leadCode = `RRH-LD-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create the lead
    const newLead = await p.lead.create({
      data: {
        lead_code: leadCode,
        company_id: companyId,
        customer_name,
        phone,
        email,
        source: 'WEBSITE',
        status: 'NEW',
        property_type_preference: property_type_preference || 'APARTMENT',
        preferred_location,
        budget_max: budget_max ? Number(budget_max) : null,
        notes,
      },
    });

    res.status(201).json({ message: 'Lead captured successfully', leadId: newLead.id });
  } catch (error) {
    console.error('Public lead creation error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

export default router;
