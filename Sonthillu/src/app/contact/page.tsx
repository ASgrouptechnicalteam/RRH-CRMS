import type { Metadata } from 'next';
import { BRAND } from '@/lib/constants';
import { ContactForm } from '@/components/leads/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Get in touch with ${BRAND.name}. Contact us for property enquiries and more.`,
};

export default function ContactPage() {
  return (
    <div className="container-page py-12">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Contact Us</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Get in Touch</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Phone</h3>
              <p className="text-gray-600">{BRAND.phone}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Email</h3>
              <p className="text-gray-600">{BRAND.email}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Website</h3>
              <p className="text-gray-600">{BRAND.domain}</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Send us a Message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
