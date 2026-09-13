import type { Metadata } from 'next';
import { Card, CardBody } from '@/components/ui/Card';
import { SellerForm } from '@/components/leads/SellerForm';

export const metadata: Metadata = {
  title: 'Sell Your Property',
  description: 'List your property for sale with Sonthillu Constructions.',
};

// Was a self-service "create account → get verified → submit listing" flow
// against Sonthillu's own local database — replaced with a lead-capture
// form per Sandeep's call: sellers submit their contact + basic property
// details, then a PM visits in person to verify the property and fill in
// the remaining details in the CRM (same anti-fake-listing pattern already
// used for property photo verification). No new backend needed — this
// reuses the SellerEnquiry lead pipeline already wired to the CRM.
export default function SellPropertyLandingPage() {
  return (
    <div className="container-page section-spacing">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="font-display text-4xl font-bold text-brand-navy mb-4">
          Sell Your Property with Sonthillu
        </h1>
        <p className="text-lg text-text-secondary">
          Share your property details below. Our team will personally visit to verify the property
          before it's listed — no fake listings, no middlemen.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <Card hover={false} className="border-t-4 border-t-brand-gold">
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-gold-soft flex items-center justify-center mx-auto mb-4">
              <span className="font-bold text-brand-navy">1</span>
            </div>
            <h3 className="font-semibold text-brand-navy mb-2">Share Your Details</h3>
            <p className="text-sm text-text-secondary">
              Tell us about your property and how to reach you.
            </p>
          </CardBody>
        </Card>

        <Card hover={false} className="border-t-4 border-t-brand-gold">
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-gold-soft flex items-center justify-center mx-auto mb-4">
              <span className="font-bold text-brand-navy">2</span>
            </div>
            <h3 className="font-semibold text-brand-navy mb-2">In-Person Verification</h3>
            <p className="text-sm text-text-secondary">
              Our team visits the property to verify it and capture the remaining details.
            </p>
          </CardBody>
        </Card>

        <Card hover={false} className="border-t-4 border-t-brand-gold">
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-gold-soft flex items-center justify-center mx-auto mb-4">
              <span className="font-bold text-brand-navy">3</span>
            </div>
            <h3 className="font-semibold text-brand-navy mb-2">Listed & Live</h3>
            <p className="text-sm text-text-secondary">
              Once verified, your property goes live to thousands of buyers.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="max-w-2xl mx-auto">
        <SellerForm />
      </div>
    </div>
  );
}
