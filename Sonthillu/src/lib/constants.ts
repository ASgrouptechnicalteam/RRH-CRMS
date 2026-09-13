export const BRAND = {
  name: 'Sonthillu Constructions',
  shortName: 'Sonthillu',
  tagline: 'Building Your Dream Home',
  brandKey: 'SONTHILLU',
  domain: 'sonthilluconstructions.com',
  email: 'info@sonthilluconstructions.com',
  phone: '+91 77801 67743',
  address: 'Hyderabad, Telangana, India',
  reraNumber: 'RERA No. TPRERA/UC/2024/XXXXX (representative)',
  yearsOfExperience: 5,
  propertiesFacilitated: 500,
  satisfiedCustomers: 1200,
  citiesCovered: ['Hyderabad'],
} as const;

export const CRM_CONFIG = {
  brandParameter: 'sonthillu',
  apiVersion: 'v1',
} as const;

export const SITE_CONFIG = {
  title: 'Sonthillu Constructions',
  description:
    'Sonthillu Constructions - Premium residential properties in Hyderabad. Find apartments, villas, and independent houses.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sonthilluconstructions.com',
  ogImage: '/og-image.png',
} as const;

export const NAVIGATION = {
  main: [
    { label: 'Properties', href: '/properties' },
    { label: 'Projects', href: '/projects' },
    { label: 'Sell Property', href: '/sell-property' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  footer: {
    properties: [
      { label: 'Apartments', href: '/properties?propertyType=APARTMENT' },
      { label: 'Villas', href: '/properties?propertyType=VILLA' },
      { label: 'Independent Houses', href: '/properties?propertyType=INDEPENDENT_HOUSE' },
      { label: 'Ready to Move', href: '/properties?possessionStatus=READY_TO_MOVE' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
      { label: 'FAQs', href: '/#faq-section' },
      // { label: 'Careers', href: '/careers' },
    ],
    legal: [] as { label: string; href: string }[],
  },
} as const;
