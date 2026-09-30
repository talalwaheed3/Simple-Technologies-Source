# Technician workflow

## Add a problem on your phone

Open `/admin` → **Add problem**. Enter a recognizable title, a short quick answer, the device/OS, symptoms, cause, steps (one per line), warnings, supporting references and how to check the result. Record an actual repair outcome only when evidence exists. Drafts autosave after 1.8 seconds once the title and URL exist. A local working copy protects unsaved typing when connectivity fails. Use it only on a trusted device. Sign out preserves saved working copies; explicitly discard a local copy after successful recovery if this is a shared device.

Use the expanded sections for error messages, exact commands, alternatives, category, tags, related posts, FAQs and SEO metadata. The title initially generates the URL; edits to an existing slug create redirects automatically. Keep URLs stable where possible.

Upload screenshots, inspect each image, enter meaningful alt text/caption, and move them into the desired order. Crop/redact in your image editor before uploading; originals remain private. Do not check the privacy-review box until you have inspected the image. The app strips metadata and generates optimized responsive copies; it cannot determine automatically whether a visible password or customer name is sensitive.

Preview the article. Confirm that the technical guidance was checked against its cited references, set status to Published and save explicitly. A publish timestamp in the future schedules visibility; blank means now. Publishing requires reviewed guidance, sufficient steps, an excerpt, verification checks and privacy-reviewed images with alt text. Private drafts may be saved before those reviews. Editing a published article does not autosave to the public version; click Publish/update explicitly. Local drafts can be restored after a failure; restored copies require an explicit save. If the article changed on the server, the editor reports a conflict instead of overwriting it.

## Comments

Filter Pending to review submissions. Approve, hide, mark spam or delete. Technician replies can be entered directly and show the configurable admin label. A reply under a hidden/unapproved parent remains hidden publicly; approve the parent to display the thread. Comments are plain text, never executable HTML.

## Requests

Requests and screenshots are private. Update statuses, inspect the screenshot and use Convert to draft when a case merits an article. Conversion is atomic and idempotent: repeated clicks return the existing draft. It copies problem details, not private contact information or request screenshots. Review and anonymize the draft before publishing. If a screenshot will be reused, redact it and upload a reviewed article copy.

## Inventory and statistics

Content inventory lists status, device, category, views, likes, comments and dates. Historical cases retain source evidence and unknowns. The dashboard reports UTC daily views, 7/30-day totals, approximate browser visitors, leading articles, unanswered searches, referrals and business link clicks. Metrics count interactions, not revenue or proven support conversions. Refreshes from the same visitor/article/day do not add views; active likes are one per browser identifier/article.

## Contacts, products and ads

Settings controls brand/contact labels and support destinations. Affiliate links must have a disclosure and valid destination. Enable them only for matching categories/articles. Listings must have accurate availability. Ads remain disabled until account and slot IDs are configured and the visitor opts in. Search Console integration currently provides verification/setup and an external dashboard link, not an imported metrics API.

## Images and private historical imports

Post and laptop editors now share image controls. Upload JPEG/PNG/WebP up to 3 MiB per image, add meaningful alt text/caption, inspect and confirm privacy review, then reorder images. The first reviewed image is the cover/social image where applicable. Removing an image detaches it; private original files are retained. Public listing images require an available listing and privacy review.

The historical date range is April 5, 2026 onward. Earlier imported candidates remain private legacy drafts. The full export audit is deferred independently of everyday publishing. See POST-LAUNCH-HISTORY-AUDIT.md for source matching and privacy review.

## Workspace navigation

In the admin area, the brand/header links back to the admin overview. Use **View public site** to leave the workspace. The desktop and mobile header show workspace navigation while on admin routes.

## Save and upload errors

Field errors identify the problem (including publish date, slug conflicts and image review). Saved publish timestamps are displayed in local time. A failed save retains the working copy; a failed upload retains the file for retry while the editor stays open. Successful uploads from a partially failed batch remain attached. Wait for uploads before saving or previewing. Refreshing loses files that never uploaded, so retry those first.

## Color theme

Use the sun/moon control in the header to choose **Light**, **Dark**, or **Use device setting**. The preference applies to both the public site and technician workspace and is saved in this browser. Device mode follows operating-system changes automatically. Switching themes keeps unsaved form input in place. If browser storage is blocked, the choice works for the current page but cannot be remembered after a reload.
