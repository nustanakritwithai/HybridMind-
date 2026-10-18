=== Hybrid Mind Affiliate Slots (Candidate) ===
Version: 0.2.0
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

Create requests require an Idempotency-Key header (16–128 safe ASCII characters) and a stable id matching ^[a-z0-9][a-z0-9_-]{0,63}$. Replaying the same key and payload returns the same product; reusing a key with a different payload or an existing product ID returns HTTP 409.

Product JSON accepts only id, title, url, description, optional image, and optional order on create. Image is null, {"attachment_id": 123}, or {"url": "https://..."}. A URL is accepted only when it exactly matches an HTTPS URL for an existing local Media Library JPEG, PNG, GIF or WebP attachment. External image URLs are rejected; the API never fetches image or affiliate URLs. Updates accept only title, url, description, image, and order, and require the latest revision in If-Match. Unknown fields, including enabled, rights_confirmed, price, approval fields and slot settings, are rejected.

Every create/update remains Draft: the product's enabled and rights_confirmed values are false, no slot is assigned by create, and the existing approval and reviewed digest are cleared. The API has no review, approval, placement, or public activation route. A human administrator must use Settings → Affiliate Slots to save, privately preview, and explicitly approve a reviewed configuration. The existing manage_options, digest, owner approval, domain confirmation and live_ready gates remain authoritative.

Cards show no prices. Legacy price fields remain in the stored schema for compatibility but are never rendered. Cards use the CTA “ดูสินค้าบน Shopee”, a potential-commission disclosure, rel="sponsored noopener" for new tabs, escaped text/URLs, and only local attachment images. There is no redirect, prefetch, click tracking, cookie, personal click data, ad script, or remote metadata fetch.

== Existing presentation rules ==

Explicit future Gutenberg Shortcode block only: [hm_affiliate_slot id="home_after_feature"]
Known IDs: home_after_feature, home_in_feed, article_after_intro, article_near_end, sidebar_desktop.
Existing inactive reservations are untouched. Theme owner must separately approve fresh block placements; sidebar is unplaced/disabled. Never insert into protected code/iframe/Quiz/Game/Video Lab. v0.1 skips whole recognized protected posts and posts 55/57.

Two slot units per request, three cards per slot, deterministic order. Empty/disabled/unapproved/demo output is empty. Sidebar is desktop-only and remains unplaced until the theme owner approves integration.

== Upgrade and rollback ==

The canonical option remains hm_affiliate_slots_v1 with schema version 1; the backup option remains hm_affiliate_slots_backup_v1. No migration or activation-time reset is performed. Create idempotency receipts live in separate hm_affiliate_idem_<sha256> options; version 0.1.0 ignores those options. Product records written by this API use the existing item schema, so the prior plugin can read them.

Before installing a future production update, export/read back the current configuration and retain the existing configuration backup. Replace plugin files with the reviewed ZIP without deleting plugin options. To roll back, restore the 0.1.0 plugin files and keep both existing options and idempotency receipts; do not reset the configuration. API writes intentionally invalidate approval, so no draft can become public through upgrade or rollback.

The ZIP in this repository is a review candidate only. WordPress.com Atomic installation, authenticated REST behavior, plugin replacement, public cache behavior, and anonymous output must be checked on a separately approved staging site before any production action.

No campaign or product is bundled or published. The draft payloads in examples/ are fixtures only; their claims, images, link ownership, programme eligibility and commission are not verified by this plugin.
