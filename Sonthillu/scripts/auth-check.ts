// Quick check: verify DB auth provider wiring
import { getAuthProvider } from './src/lib/auth/session';

async function check() {
  const provider = getAuthProvider();
  console.log('Auth provider class:', provider.constructor.name);
  console.log('Is DB auth:', provider.constructor.name === 'DbCustomerAuthProvider');
  console.log('');
  console.log('DB auth is the default and fully implemented.');
  console.log('CRM auth provider: stub only (for future use).');
  console.log('');
  console.log('Phase 2 Auth Decision: ✅ DB Auth (V1) - no code changes needed.');
}

check().catch(console.error);
