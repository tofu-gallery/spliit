# Tofu gallery copy

This repository is Tofu's copy of **spliit-app/spliit** (licence: MIT), listed in Tofu's app gallery as **Spliit**.

- `main` mirrors the upstream repository and is never committed to by Tofu.
- `tofu` carries Tofu's own changes; tags named `pin/<date>` mark the versions the gallery points to.
- A visitor who chooses this app gets a private snapshot of the pinned version in their own Tofu account. Their copy does not follow upstream updates.

How Tofu runs it: Next.js + Prisma + PostgreSQL. Tofu builds it on the Vercel lane; the managed database supplies DATABASE_URL.

## What Tofu changes

- `src/lib/env.ts`: `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` each fall back to `DATABASE_URL` when they are unset or blank. A database Tofu manages supplies only `DATABASE_URL`; with either variable set, nothing changes.
- `src/lib/prisma.ts` and `src/lib/tofu-database.ts` (new): the app's queries use `POSTGRES_PRISMA_URL` as before, or `DATABASE_URL` when it is unset. Tofu's `DATABASE_URL` carries `sslmode=require`, which node-postgres reads as full certificate verification, and the database's certificate chains to a root Node does not ship, so the URL on its own fails with `SELF_SIGNED_CERT_IN_CHAIN`. When `SUPABASE_CA_CERT` (which Tofu writes beside `DATABASE_URL`) is set, the URL's own TLS parameters are removed and the server is verified against that certificate plus Node's own roots. Verification is never turned off.
- `prisma.config.ts`: the Prisma CLI's URL falls back to `DATABASE_URL` as well. On Tofu the CLI only runs `prisma generate`, which does not connect.
- `supabase/migrations/` (new, 27 files): each `prisma/migrations/<timestamp>_<name>/migration.sql`, copied unchanged to `supabase/migrations/<timestamp>_<name>.sql`. Before each deploy builds, Tofu applies the files its database has no record of, one transaction per file. `prisma/migrations/` stays for Prisma's own tools, so a new migration has to be copied here too.
- `package.json`: `postinstall` is `prisma generate` alone (it was `prisma migrate deploy && prisma generate`), so the install step of the Vercel build no longer migrates. Prisma Migrate needs a direct or session connection, which Tofu's pooled `DATABASE_URL` is not, and Tofu applies `supabase/migrations/` itself. Working locally, run `npx prisma migrate deploy` after `npm install`. The Docker image is unaffected: its entrypoint still runs `migrate deploy` when the container starts.
- `vercel.json`: the `crons` entry that called `/api/cron/purge-deleted-groups` every day is removed, because Tofu's Free plan does not deploy an app that declares scheduled jobs. The endpoint itself is unchanged, and answers 404 while `CRON_SECRET` is unset.

## What stays off

- **Deleting groups.** `ENABLE_GROUP_DELETION` is unset, so a group's settings show no Delete button and the server refuses deletions: without a scheduled job, nothing breaks. Upstream purges a deleted group only when something calls `/api/cron/purge-deleted-groups` on a schedule, and the app stops with a configuration error if `ENABLE_GROUP_DELETION` is set without `CRON_SECRET`. Turning deletion on needs a purge schedule first, later: a `pg_cron` job in the app's database that deletes the groups whose `deleteAt` has passed (their participants, expenses and activity go with them, and with photos off there are no files to remove), with `CRON_SECRET` set as well to satisfy that check. Until then, leave it off.
- **Photos.** Attaching receipts or other images to expenses (`ENABLE_EXPENSE_DOCUMENTS`) needs S3 storage (`S3_UPLOAD_KEY`, `S3_UPLOAD_SECRET`, `S3_UPLOAD_BUCKET`, `S3_UPLOAD_REGION`), which Tofu does not supply.
- **AI.** Scanning a receipt into an expense (`ENABLE_RECEIPT_EXTRACT`) and suggesting a category from the title (`ENABLE_CATEGORY_EXTRACT`) need the owner's own `OPENAI_API_KEY`; scanning receipts also needs photos.

## Who can open a copy

Spliit has no accounts. Anyone who has the app's link can open it and start a group, and anyone who has a group's link can read and change that group. A copy on Tofu is therefore open to anyone with its link. To keep a copy private, give it an access code in the app's sharing settings on Tofu: only people who enter the code get in.

## Needs a real deploy to verify

- The upload is accepted on the Free plan, with no scheduled-jobs refusal now that `vercel.json` declares no `crons`.
- The first deploy applies all 27 files in `supabase/migrations/` (the deploy's database note says what Tofu applied), and the database then holds the tables `Group`, `Participant`, `Category`, `Expense`, `ExpensePaidFor`, `ExpenseDocument`, `RecurringExpenseLink` and `Activity`, with the category rows that `20240108194443_add_categories` and `20250308000000_add_category_donation` insert.
- `20261010120000_add_group_deletion` applies inside Tofu's one-transaction-per-file run: it adds two enum values with `ALTER TYPE … ADD VALUE` and does not use them in the same file, which PostgreSQL 12 and later allow.
- The build log shows `prisma generate` and no `prisma migrate deploy`, and `next build` passes the env validation with only `DATABASE_URL` set.
- `SUPABASE_CA_CERT` is set on the app, and the app reaches its database through the pooler: create a group, add an expense, reload, and find no `SELF_SIGNED_CERT_IN_CHAIN`, `permission denied` or prepared-statement errors in the runtime logs. `/api/health/readiness`, which runs `SELECT 1`, answers 200.
- With `ENABLE_GROUP_DELETION` unset, a group's settings show no Delete button, and `/api/cron/purge-deleted-groups` answers 404.
- Page metadata, `robots.txt` and `sitemap.xml` use `https://$VERCEL_URL` unless `BASE_URL` is set: check which address they name, and set `BASE_URL` to the app's own address (a public value) if they should name that one.
- With an access code set, the app asks for it before showing anything, a group's own link included.

## Licence

MIT. Licence files and copyright notices stay as they are. Every code file Tofu changes carries a note saying so; `package.json` and `vercel.json` cannot hold comments and the migration copies stay byte-for-byte, so this file lists them instead.
