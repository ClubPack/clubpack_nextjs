# ClubPack

Multi-tenant club websites + admin dashboard. Next.js (App Router) + Supabase, deployed on Vercel.

## Develop

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase + Mapbox values
pnpm dev
```

Tenant sites are resolved by subdomain in `proxy.ts` (`<club>.localhost:3000` locally, `my.localhost:3000` for admin).

## Scripts
- `pnpm build` / `pnpm lint`
- `pnpm exec tsc --noEmit` — typecheck

## Database
Migrations live in `supabase/migrations`. Generate types with `supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts`.
See `AUDIT.md` for the architecture audit and rebuild plan.
