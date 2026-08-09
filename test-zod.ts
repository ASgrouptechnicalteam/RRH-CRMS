import { LoginSchema } from './packages/shared/src/index';

try {
  LoginSchema.parse({ employee_code: 'TEST-ADMIN', password: 'Password@123' });
  console.log('TEST-ADMIN is VALID');
} catch (e) {
  console.log('TEST-ADMIN is INVALID:', e.errors);
}
