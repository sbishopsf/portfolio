# stevenbishop-portfolio

Static portfolio site for stevenbishop.com, gated behind HTTP Basic Auth via
a free Netlify Edge Function (no Pro plan needed).

## Structure

- `index.html`, `css/style.css` — the site. Edit content directly.
- `netlify/edge-functions/basic-auth.js` — checks every request against a
  username/password pulled from Netlify environment variables, and returns a
  browser login prompt if they don't match.
- `netlify.toml` — publishes the repo root as-is (no build step).

## Deploy

1. Push this folder to a new GitHub repo.
2. In Netlify: **Add new site → Import from GitHub** and pick the repo.
   Build command: none. Publish directory: `.` (already set in `netlify.toml`).
3. In Netlify site settings → **Environment variables**, add:
   - `BASIC_AUTH_USER` (optional, defaults to `admin`)
   - `BASIC_AUTH_PASSWORD` (required — the site returns 401 for every request
     until this is set)
4. Redeploy (env var changes require a new deploy to take effect for Edge
   Functions).
5. Site settings → **Domain management** → add `stevenbishop.com`, then
   update DNS at your registrar (IONOS) to point at Netlify — either the A
   record Netlify shows you, or switch to Netlify's nameservers to manage
   DNS there directly.
6. Visit `https://stevenbishop.com` in a private window to confirm the
   password prompt appears before any content loads.

## Changing the password later

Update `BASIC_AUTH_PASSWORD` in Netlify env vars and trigger a redeploy
(Deploys → Trigger deploy → Clear cache and deploy site).
