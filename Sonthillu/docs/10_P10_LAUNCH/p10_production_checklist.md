# P10 Production Checklist

### Infrastructure

- [ ] Hostinger runtime ready and verified (Node.js/Next.js support)
- [ ] Domain configured
- [ ] HTTPS active
- [ ] DNS stable
- [ ] MySQL production database ready
- [ ] Redis production instance ready
- [ ] Email provider ready (API keys verified)
- [ ] AI ready or intentionally disabled (Feature-off/Deferred)
- [ ] CRM production credentials valid (API key)
- [ ] Media dependencies ready (CDN accessibility)

### Security

- [ ] Secrets configured correctly in `.env`
- [ ] No `NEXT_PUBLIC_*` secrets present
- [ ] Cookies secure (`Secure` and `HttpOnly` flags active via HTTPS)
- [ ] Rate limiting active via Redis
- [ ] Admin RBAC active
- [ ] No development provider active
- [ ] No debug routes exposed
- [ ] Default admin bootstrap credentials removed/rotated post-deployment

### Data

- [ ] Database backup scheduled and verified
- [ ] Prisma migrations applied safely
- [ ] Customer data intact
- [ ] ActivityEvent schema active
- [ ] Hero CMS intact and active

### SEO

- [ ] Sitemap generated dynamically
- [ ] `robots.txt` disallows sensitive paths (`/admin`, `/account`, etc.)
- [ ] Canonical URLs use the exact production origin
- [ ] Metadata is correctly configured
- [ ] Structured data JSON-LD intact

### Reliability

- [ ] HTTP health check / base availability
- [ ] Rollback plan documented and understood
- [ ] Backup restore strategy documented
- [ ] Logging safe (no secrets exposed)
- [ ] Process restart test passed (Next.js server survives restarts)
