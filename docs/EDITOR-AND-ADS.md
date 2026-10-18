# Publication editor and advertisements

The /admin/ route opens on an email/password login screen. Only cms_admins members
can use the workspace. Existing admin credentials continue to work; no new password
is generated. Sign out clears local authentication and returns to the login screen.

Posts lists existing Supabase records with search, status filters and pagination.
Add post opens the writing workspace: headings, bold/italic/underline, lists, quote,
links, image URLs/uploads, captions, undo/redo, word count, reading time, sanitized
preview, excerpt, categories, tags, SEO title/description, featured image and
publication time. Uploaded PNG/JPEG/WebP/GIF files are limited to 5 MB and become
public in the cms-media bucket. Category/tag relations save with the post atomically.
A local browser draft can be restored; Save post writes to Supabase. Concurrent
updates require reloading rather than silently overwriting. Published posts with
a future timestamp remain hidden until due. This is the existing static frontend
with Supabase, not a completed Next.js application; SEO metadata is client-updated.

Advertisements provides four 300x250-only placements. Admins can enable/disable,
set dates, upload/link direct banner images, set HTTPS click destinations and edit
the label. Reader pages fetch active units from Supabase and hide disabled/out-of-
schedule placements. Google Ad Manager unit paths can be saved; live Google ad
requests and reports are not implemented. Google placements show labelled
configuration placeholders until approved account/consent delivery is integrated.

Verification: syntax/HTML structure checks; rollback database tests for authorized
post/taxonomy saves, stale-update rejection, ad changes and anonymous write denial.
Tests were rolled back. Browser visual QA, real image upload and full login/editor
click-through need confirmation in the owner's actual browser. Existing project
Auth advisor warns that leaked-password protection is disabled; enable it in Auth
settings if supported by the plan.


\n\n## Google tag paste columns\n\nAdvertisements → Google Ad Manager now provides two side-by-side textareas for\nDocument header and Document body, matching Google's tag generator. The parser\nextracts exactly one literal 300x250 GPT slot and verifies matching header/div/display\nIDs. AdSense, unsupported sizes and incomplete/mismatched tags are rejected. Both\nblocks save atomically with placement settings into an admin-only cms_ad_tags table.\nPasted JavaScript is never evaluated. Reader delivery remains a configuration\nplaceholder; live Google ad requests and reporting are not implemented.\n