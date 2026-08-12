import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAuthz } from '../middleware/authz';
import { Roles, Permissions, CustomerCreateSchema, CustomerUpdateSchema } from '@rrh-ems/shared';
import { validateRequestBody } from '../middleware/validate';
import { CustomerService, AppError } from '../services/customer.service';

const router = Router();

const handleServiceError = (error: any, res: Response) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error('Unhandled route error:', error);
  return res.status(500).json({ error: 'Internal Server Error' });
};

// GET /api/v1/customers - Fetch customers list
router.get('/', authenticateToken, requireAuthz(Permissions.CUSTOMERS_READ), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customers = await CustomerService.getCustomers(req.user!);
    return res.status(200).json({ customers });
  } catch (error: any) {
    return handleServiceError(error, res);
  }
});

// GET /api/v1/customers/:id - Fetch customer details
router.get('/:id', authenticateToken, requireAuthz(Permissions.CUSTOMERS_READ), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = await CustomerService.getCustomerById(req.user!, parseInt(req.params.id));
    return res.status(200).json({ customer });
  } catch (error: any) {
    return handleServiceError(error, res);
  }
});

// POST /api/v1/customers - Create new customer
router.post(
  '/',
  authenticateToken,
  requireAuthz(Permissions.CUSTOMERS_CREATE),
  validateRequestBody(CustomerCreateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await CustomerService.createCustomer(req.user!, req.body);
      return res.status(201).json({
        message: 'Customer created successfully',
        ...result,
      });
    } catch (error: any) {
      return handleServiceError(error, res);
    }
  }
);

// PATCH /api/v1/customers/:id - Update existing customer
router.patch(
  '/:id',
  authenticateToken,
  requireAuthz(Permissions.CUSTOMERS_UPDATE),
  validateRequestBody(CustomerUpdateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await CustomerService.updateCustomer(req.user!, parseInt(req.params.id), req.body);
      return res.status(200).json({
        message: 'Customer updated successfully',
        ...result,
      });
    } catch (error: any) {
      return handleServiceError(error, res);
    }
  }
);

export default router;
