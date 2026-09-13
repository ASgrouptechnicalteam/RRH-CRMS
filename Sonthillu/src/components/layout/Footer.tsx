import Link from 'next/link';
import { BRAND, NAVIGATION } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-navy text-white">
      <div className="container-page py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Tagline */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-block rounded bg-white/10 p-1 transition-colors hover:bg-white/20"
            >
              <span className="inline-block h-8 w-auto items-center gap-2 rounded bg-white/10 p-1">
                <svg className="h-6 w-6 text-white" viewBox="0 0 100 30" fill="none">
                  <rect width="100" height="30" rx="4" fill="#D4A843" />
                  <text
                    x="8"
                    y="21"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    Sonthillu
                  </text>
                </svg>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-white/70 leading-relaxed">
              {BRAND.tagline}. Premium residential properties in Hyderabad — apartments, villas, and
              independent houses in prime locations.
            </p>
            {/* Contact info */}
            <div className="mt-6 space-y-2 text-sm text-white/70">
              <a href={`tel:${BRAND.phone}`} className="hover:text-white transition-colors">
                <svg
                  className="inline h-4 w-4 mr-2 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {BRAND.phone}
              </a>
              <a href={`mailto:${BRAND.email}`} className="hover:text-white transition-colors">
                <svg
                  className="inline h-4 w-4 mr-2 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                  <path d="M19 8.839l-7.556 3.778a2.75 2.75 0 01-2.888 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                </svg>
                {BRAND.email}
              </a>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{BRAND.address}</span>
              </div>
            </div>
            {/* Social */}
            <div className="mt-6 flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.775C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.775 24h20.45c.983 0 1.775-.773 1.775-1.729V1.729C24 .774 23.208 0 22.225 0z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                aria-label="YouTube"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.549 6.425a2.78 2.78 0 00-1.946-2.066C18.88 4 12 4 12 4s-6.88 0-8.606.454A2.78 2.78 0 001.451 6.425C0 8.17 0 11.784 0 11.784s0 3.606.451 5.314A2.78 2.78 0 002.066 19.1C3.666 19.55 7.176 19.993 12 19.993s8.315-.443 9.909-.994A2.78 2.78 0 0022.549 17.5c.451-1.71.451-3.324.451-3.324s0-3.606-.451-5.314zM9.75 15.02a.75.75 0 00-1.484.125c-.136.18-.207.41-.22.655a12.72 12.72 0 003.99-1.25 1.875 1.875 0 001.484-2.25 6.375 6.375 0 00-2.665-2.458.75.75 0 00-.634.738c0 .136.006.27.018.403a6.75 6.75 0 01-2.28 2.28c.134.13.27.26.403.27a6.75 6.75 0 002.677-2.445 1.875 1.875 0 011.484 2.25 12.72 12.72 0 003.99 1.25c.244.246.316.476.22.655a.75.75 0 00-1.484.125 7.5 7.5 0 01-2.475 2.475.75.75 0 01-.655-.727z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Properties */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Properties
            </h4>
            <ul className="mt-4 space-y-3">
              {NAVIGATION.footer.properties.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Company
            </h4>
            <ul className="mt-4 space-y-3">
              {NAVIGATION.footer.company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Trust */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Contact & Trust
            </h4>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`tel:${BRAND.phone}`}
                  className="flex items-start gap-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {BRAND.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="flex items-start gap-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                    <path d="M19 8.839l-7.556 3.778a2.75 2.75 0 01-2.888 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                  </svg>
                  {BRAND.email}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{BRAND.address}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.25 2.5a1.25 1.25 0 011.25-.75h1.5a1.25 1.25 0 011.25.75v1.5a1.25 1.25 0 01-1.25.75h-1.5a1.25 1.25 0 01-1.25-.75V2.5zm0 5a1.25 1.25 0 011.25-.75h1.5a1.25 1.25 0 011.25.75v3.25a1.25 1.25 0 01-1.25.75h-1.5a1.25 1.25 0 01-1.25-.75V7.5zm0 5a1.25 1.25 0 011.25-.75h1.5a1.25 1.25 0 011.25.75v1.5a1.25 1.25 0 01-1.25.75h-1.5a1.25 1.25 0 01-1.25-.75v-1.5zM5.25 4.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{BRAND.reraNumber}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <p className="text-sm text-white/60">
            &copy; {currentYear} {BRAND.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Terms of Service
            </Link>
            <Link
              href="/sitemap"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Sitemap
            </Link>
          </div>
          <p className="text-sm text-white/40">A Radha Real Homes venture</p>
        </div>
      </div>
    </footer>
  );
}
