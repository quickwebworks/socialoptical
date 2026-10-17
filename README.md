# Socialoptical

News homepage concept for https://socialoptical.in/ with **300 × 250 sample ads only**.

## Preview

Open `index.html` in a browser. The homepage includes topic filters, story search,
article previews, dark theme, in-feed advertisements and a desktop sticky ad rail.
All articles and advertisements are samples. No Google ad requests or billable
impressions are generated. Images and fonts load from external providers.

## Deploy this design

This repository currently contains a static HTML/CSS/JavaScript design, not a
finished Next.js application. No package installation or build command is needed.
For Vercel, import this repository using the **Other** framework preset, leave the
build command unset and use the repository root as the output directory.
`vercel.json` records these static deployment settings.

## Build the Next.js + Supabase CMS

Read [the development PRD](docs/PRD.md). It provides setup commands, permissions,
ad administration and reporting specifications, and 12 VS Code implementation
milestones. The latest 300 × 250-only decision takes precedence over the earlier
multi-size design history.

`starter-snippets/` contains illustrative SQL and TypeScript excerpts. These files
are not a complete runnable app; copy them into a newly scaffolded Next.js project
at the documented paths. Never commit real credentials. Run the migration and
security checks in a development Supabase project before production.

## Current status

- Implemented: static homepage concept and sample interactions.
- Planned: production Next.js CMS, Supabase authentication/database, real admin
  panel, approved Google ad integration and authorized advertising reports.
- Checked: inline JavaScript syntax. Browser visual QA and a production Next.js
  build have not been performed on these starter snippets.
