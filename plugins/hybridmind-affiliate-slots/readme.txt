=== Hybrid Mind Affiliate Slots (Candidate) ===
Version: 0.3.0
Requires at least: 6.4
Requires PHP: 7.4
License: GPL-2.0-or-later

Preparation candidate. Not installed on hybridmind.online. Activation creates disabled defaults only when the option is absent; it never overwrites an existing configuration or edits posts, pages, theme templates, taxonomy or other plugins.

== Product API ==

The authenticated WordPress REST API uses the existing namespace:

* GET /wp-json/hybridmind-affiliate/v1/products — list structured products.
* GET /wp-json/hybridmind-affiliate/v1/products/{id} — read one product.
* POST /wp-json/hybridmind-affiliate/v1/products — create a disabled draft.
* PATCH /wp-json/hybridmind-affiliate/v1/products/{id} — update one product as a disabled draft.
* GET /wp-json/hybridmind-affiliate/v1/config — existing read-only configuration endpoint; its response shape is preserved.

WordPress REST authentication is required and every route requires manage_options. Application Passwords and WordPress cookie authentication with a REST nonce use the standard WordPress authentication flow. Responses are private/no-store and include a SHA-256 revision plus an ETag.

Create requests require an Idempotency-Key header (16–128 safe ASCII characters) and a stable id matching ^[a-z0-9][a-z0-9_-]{0,63}$. Replaying the same key and payload returns the current product snapshot without another write; replayed draft/public_output flags match current live eligibility, including later owner approval. Reusing a key with a different payload or an existing product ID returns HTTP 409. If a create reports a save conflict, retry the same payload with the same key so a possibly committed draft can be recovered.

Product JSON accepts only id, title, url, description, optional image, and optional order on create. Image is null, {"attachment_id": 123}, or {"url": "https://..."}. A URL is accepted only when it exactly matches an HTTPS URL for an existing local Media Library JPEG, PNG, GIF or WebP attachment. External image URLs are rejected; the API never fetches image or affiliate URLs. Updates accept only title, url, description, image, and order, and require the latest revision in If-Match. Unknown fields, including enabled, rights_confirmed, price, approval fields and slot settings, are rejected.

Every create/update write produces a Draft: the product is disabled, new products have rights_confirmed=false, no slot is assigned by create, and the existing approval and reviewed digest are cleared. A replay may reflect a later owner-approved current snapshot but never changes it. The API has no review, approval, placement, or public activation route. A human administrator must use Settings > Affiliate Slots to save, privately preview, and explicitly approve a reviewed configuration and its current placement choices. The existing manage_options, digest, owner approval, domain confirmation and live_ready gates remain authoritative.

Cards show no prices. Legacy price fields remain in the stored schema for compatibility but are never rendered. Cards use the CTA “ดูสินค้าบน Shopee”, a potential-commission disclosure, rel="sponsored noopener" for new tabs, escaped text/URLs, and only local attachment images. There is no redirect, prefetch, click tracking, cookie, personal click data, ad script, or remote metadata fetch.

== Existing presentation rules ==

Manual Gutenberg Shortcode fallback: [hm_affiliate_slot id="home_after_feature"]
Known IDs: home_after_feature, home_in_feed, article_after_intro, article_near_end, sidebar_desktop.
Automatic placements are separate settings and default off. The owner can opt in to homepage after the Featured hero, after a 20+-word third top-level paragraph in a published post with at least four paragraphs, and near the end of long posts (at least 8 top-level paragraphs and 600 words; the target paragraph also needs at least 20 words). A change clears review and approval; preview and owner approval are required again. Approval includes a digest of the placement choices. Automatic processing is transient and does not write to post content.

Homepage insertion is supported only when one Custom HTML block contains the exact Featured hero opening/closing section immediately followed by the #latest section. If that exact boundary is absent or ambiguous, the filter leaves page content untouched; manually place a Shortcode block after Featured and before #latest only after checking the boundary in the editor. Existing explicit affiliate shortcodes suppress automatic placement on that page. Article insertion only uses top-level paragraph boundaries and skips if the adjacent block is not another paragraph. Feeds, REST, admin, previews, excerpts, password-protected content, unsupported single-post contexts and recognized protected interactive/code/embed content are excluded. Posts 55 and 57 remain excluded.

home_in_feed and sidebar_desktop remain manual/unsupported automatic placements; sidebar is unplaced/disabled. Never insert into protected code/iframe/Quiz/Game/Video Lab. The plugin only inserts registered core Shortcode blocks transiently while rendering; it does not save or rewrite Gutenberg content.

Two slot units per request, three cards per slot, deterministic order. Empty/disabled/unapproved/demo output is empty. Sidebar is desktop-only and remains unplaced until the theme owner approves integration.

== Upgrade and rollback ==

The canonical product option remains hm_affiliate_slots_v1 with schema version 1; the backup option remains hm_affiliate_slots_backup_v1. Automatic choices are stored separately in hm_affiliate_auto_placements_v1 (backup: hm_affiliate_auto_placements_backup_v1), defaulting to false without overwriting existing settings. The approved config now carries a placement digest; legacy approval remains valid only while all automatic choices are off. Create idempotency receipts live in separate hm_affiliate_idem_<sha256> options. Product records written by this API use the existing item schema, so the prior plugin can read them.

Before installing a future production update, export/read back the current configuration and retain both option backups. Replace plugin files with the reviewed ZIP without deleting plugin options. To roll back, restore the previous plugin files and keep the existing product/placement options and idempotency receipts; do not reset the configuration. A previous version ignores automatic placement options and may reject the new approval metadata, leaving output paused until the owner reviews and approves within that version. API writes intentionally invalidate approval, so no draft can become public through upgrade or rollback.

The ZIP in this repository is a review candidate only. WordPress.com Atomic installation, authenticated REST behavior, plugin replacement, public cache behavior, and anonymous output must be checked on a separately approved staging site before any production action.

No campaign or product is bundled or published. The draft payloads in examples/ are fixtures only; their claims, images, link ownership, programme eligibility and commission are not verified by this plugin.
