# Domain — UNRUN

Nothing here has been run. Buying a domain, changing DNS and attaching a custom
domain are Colton's, not an agent's (CLAUDE.md §6). Production currently lives
at the Vercel-assigned domain only:

    https://vkc-website-wz5a.vercel.app

`content/site.json` → `baseUrl` now points here. It was the deleted
`vkc-website-zeta` project, which 404s — that stale reference sent every
canonical, hreflang and OG URL, the sitemap and the `/v` QR code to a dead
domain (corrected 2026-09-28). When the custom domain below is attached,
step 5 flips `baseUrl` to it.

`vkc-website.vercel.app` (without a project suffix) is **someone else's site** —
a church in Cape Town. Never point anything at it.

## Recommended

| Role | Domain |
|---|---|
| Primary | `vkcpack.com` |
| Redirect | `vkcpackaging.ca` → `vkcpack.com` |

`vercel domains ls` on 2026-09-22: zero domains under the scope
`coltonkaramanoukian-8035s-projects`.

## 1. Buy the domains

At any registrar. Vercel can also sell them (`vercel domains buy vkcpack.com`),
which is a paid action an agent must not take.

## 2. Attach the primary

```bash
cd "$HOME/Desktop/vkc-website"
vercel domains add vkcpack.com vkc-website
vercel domains add www.vkcpack.com vkc-website
```

Vercel then prints the records to create at the registrar. Expect:

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Confirm what Vercel prints rather than trusting this table: the apex IP has
changed before. Verify with `vercel domains inspect vkcpack.com` until it
reports the domain verified and the certificate issued.

## 3. Redirect the .ca

```bash
vercel domains add vkcpackaging.ca vkc-website
vercel domains add www.vkcpackaging.ca vkc-website
```

Then in the Vercel dashboard → Project → Domains, set `vkcpackaging.ca` to
**Redirect to** `vkcpack.com` (308). Same DNS records as step 2.

## 4. Point the site at the new domain (REQUIRED — three edits)

1. `content/site.json` → `"baseUrl": "https://vkcpack.com"`.
   This one field feeds canonical URLs, hreflang, the sitemap, JSON-LD, the OG
   image URL and the QR code.
2. Regenerate the door QR, because it encodes the base URL:

   ```bash
   npm run qr
   ```

   Then prove it, with an independent decoder:

   ```bash
   ./scripts/nc/nc8-door-qr.sh https://vkcpack.com
   ```

   `zbarimg --raw` must print exactly `https://vkcpack.com/v`.
3. Rebuild and redeploy, then re-verify:

   ```bash
   npm run build && vercel --prod
   npm run census -- --base https://vkcpack.com
   npm run check:hreflang -- --base https://vkcpack.com
   npm run proof:parity -- --prod https://vkcpack.com
   ```

Anything printed on paper (cards, door hangers, labels) that carries the old QR
is dead the moment the base URL changes. Print after step 4, not before.

## 5. What does NOT need to change

- The Vercel project name, the GitHub repo, the env vars.
- `vercel.json`: `git.deploymentEnabled.main = true` stays, so a merge to
  `main` ships production.
