# vkc-website

Public, bilingual (FR/EN) marketing site for VKC Packaging. Next.js App Router
with next-intl, deployed to Vercel. No database, no auth, no CMS.

Start with `CLAUDE.md`: it is the constitution, and every guard below exists
to enforce one of its sections.

| Where | What |
|---|---|
| `content/*.json` | Every fact on the site. Null renders nothing. Five files are Colton's alone (`docs/CONTENT-INTAKE.md`); `scenes.json` is the media manifest. |
| `public/media/` | Where the files `content/scenes.json` points at live. Empty until filled. |
| `i18n/messages/{fr,en}.json` | All prose. French is written as French, not translated. |
| `brand/` | Tokens, fonts, wordmark, `BRAND.md`. |
| `guard/` | Phrase-sets and allowlists the guards read. |
| `scripts/` | Guards, proofs, negative controls (`scripts/nc/`). |
| `docs/` | Design decisions, run logs, content intake, domain steps. |
| `NEEDS-COLTON.md` | What only Colton can do. |

```bash
npm install            # also installs the pre-push guard
npm run dev            # http://localhost:3000 (or the .claude/launch.json configs)
npm run build && npx next start -p 3100
npm run render         # captures every page into .render/
npm run guard:staffing && npm run guard:numbers && npm run guard:fr && npm run guard:claims
npm run guard:media   # content/scenes.json + photos.json against public/
npm run a11y -- --base http://localhost:3100 --self-check   # axe over every URL at 375 and 1280
npm run overlap        # reused-sentence gate on the copy
npm run test && npm run typecheck && npm run lint
node scripts/nc/nc5-quote-form.ts   # the form, end to end, against a mock
```

Production deploys only through `vercel --prod` (`vercel.json` turns off
auto-deploy of `main`). A deploy is proven, not assumed: CLAUDE.md §6.
