const FAQS = [
  {
    question: 'How does Sonthillu work?',
    answer:
      'Sonthillu is a real estate marketplace that connects property sellers with potential buyers. Browse hundreds of properties across Hyderabad, filter by location, type, budget, and BHK configuration, shortlist your favorites, and enquire directly with sellers — all in one place.',
  },
  {
    question: 'Is it free to browse properties?',
    answer:
      'Yes. Browsing, searching, shortlisting, and comparing properties is completely free for buyers. There are no hidden charges for using the platform.',
  },
  {
    question: 'How do I enquire about a property?',
    answer:
      'Each property listing has an "Enquire Now" button. Clicking it opens a form where you can provide your name, phone, email, and message. The enquiry is sent directly to the seller, and you can also choose to call or WhatsApp the listed number.',
  },
  {
    question: 'Are the properties verified?',
    answer:
      'We verify property listings before they appear on the platform. This includes confirming ownership details, property specifications, and legal documentation. Verified listings carry a trust badge. However, we always recommend buyers conduct their own due diligence before making a purchase decision.',
  },
  {
    question: 'What areas in Hyderabad do you cover?',
    answer:
      'We cover prime Hyderabad neighborhoods including Banjarahills, Gachibowli, HITEC City, Jubilee Hills, Madhapur, Kondapur, Financial District, Nanakramguda, Serilingampally, Uppal, and Secunderabad — with more areas being added regularly.',
  },
  {
    question: 'Can I sell my property through Sonthillu?',
    answer:
      'Yes. If you have a property to sell, you can submit the details through our "Sell Property" section. Our team will review your listing and help get it published on the platform. Sellers can also track their submission status in the seller dashboard.',
  },
  {
    question: 'How long does property verification take?',
    answer:
      'Verification typically takes 1-3 business days depending on the complexity of the property and documentation provided. You will receive status updates via email and can track progress in your seller dashboard.',
  },
  {
    question: 'Is my personal data secure?',
    answer:
      'Yes. We take data privacy seriously. Your personal information is encrypted in transit and at rest. We never share your contact details with third parties without your consent. Enquiry data is only shared with the relevant property seller.',
  },
  {
    question: 'Can I shortlist and compare properties?',
    answer:
      'Absolutely. You can shortlist properties you are interested in and compare them side by side — viewing specifications, prices, locations, and amenities together. This makes it easier to evaluate options and make informed decisions.',
  },
  {
    question: 'How do I contact a seller?',
    answer:
      'Each property listing displays a contact number. You can call directly, send a WhatsApp message, or use the enquiry form to send a detailed message. For the best response, include your budget, preferred visit time, and any specific questions about the property.',
  },
  {
    question: 'What types of properties are available?',
    answer:
      'We feature apartments, villas, and independent houses across Hyderabad. Properties span various configurations (1 BHK to 4+ BHK), budgets, and locations. Whether you are looking for a starter home or a luxury family residence, you will find options to suit your needs.',
  },
  {
    question: 'Do you charge buyers any commission?',
    answer:
      'No. Sonthillu does not charge buyers any commission or fees for using the platform. The service is free for home buyers. Sellers may have listing fees or commission structures which are discussed during the submission process.',
  },
];

export function FaqSection() {
  return (
    <section className="section-spacing bg-white">
      <div className="container-page">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-lg text-text-secondary">
            Everything you need to know about buying and selling on Sonthillu
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border px-5 py-4 transition-colors hover:bg-surface-muted [&_svg]:transition-transform">
                <span className="text-text-primary font-medium text-sm leading-relaxed flex-1">
                  {faq.question}
                </span>
                <svg
                  className="shrink-0 h-5 w-5 text-text-muted transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-2 text-sm text-text-secondary leading-relaxed border-t border-border pt-3">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
