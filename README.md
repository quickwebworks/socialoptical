# Socialoptical

Database-connected news homepage and WordPress SQL import panel.

- Homepage: `index.html`; admin: `/admin/`.
- Supabase: published posts, relational category/tag links, admin-controlled imports.
- SQL files up to 250 MB are read in 1 MB chunks inside a browser worker.
- All ad placements are 300 × 250 sample creatives.
- Original media URLs are retained; image files are not copied.

Read [Supabase setup](docs/SUPABASE-SETUP.md) to enable your admin account and
import the original SQL file. No default admin password exists. The database is
currently empty until the owner completes the import.

This is a static HTML/JavaScript frontend using Supabase REST/Auth, not the finished
Next.js CMS. The original [PRD](docs/PRD.md) and `starter-snippets/` describe that
larger implementation. Live advertising and reporting remain future work.

Deploy as a static project with no build command, output directory `.`, framework
Other. Configuration contains only a publishable key. Never commit privileged keys.
