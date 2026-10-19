# Hybrid Mind Editorial Guard — candidate v0.1.0

**Status: candidate / NOT deployed to production.** This plugin is prepared for code review and staging verification.

## Goal

Stop WordPress REST API clients from publishing a blog post under two or more primary categories, without changing article URLs, content, the theme, or old posts.

- Applies to `wp/v2/posts` when status is `publish`, `private`, or `future`.
- Existing published article edits remain allowed when categories are unchanged.
- Publishing must provide one **existing** category, not the generic Uncategorized category.
- Explicit tags must be pre-existing and at most 4 per article; creating arbitrary tags is not allowed through this validation path.
- Tag minimum stays OFF in version 0.1.0 for newsroom compatibility. Optional `HMEG_REQUIRE_TAGS` enables a 1+ topic tags rule for new publications, after the team is ready.
- Drafts remain editable regardless of categories/tags.
- GET `/wp-json/hm-editorial-guard/v1/status` works for users with `manage_options`, for confirmation after activation.
- Existing WordPress SEO, media, Facebook and Reels plugins are not modified.

**Scope limit:** `rest_pre_insert_post` covers core REST post operations, NOT `wp_insert_post()` calls from arbitrary plugins, WP-CLI, or other custom write APIs. A broader site-wide publication lock requires a separate and carefully tested design. Any changes to live post publishing require explicit owner review/activation.

## Tests

```bash
php -l hm-editorial-guard.php
php tests/test-editorial-guard.php
```

## Deployment gate (NOT executed)

1. Review PHP and verify no other live plugin already implements an equivalent editorial guard.
2. Back up WordPress and prepare staging site. Test REST create draft, two-category publish blocked (400), single-category publish succeeds, scheduled/private handling, and existing post edits.
3. Install candidate plugin zip on staging, review logs/rollback, then get owner approval before activating on production.
4. After activation, read admin `/wp-json/hm-editorial-guard/v1/status` and perform a negative test **using a staging post only**. Never publish a dummy post to the live site.
5. To roll back, deactivate plugin. No schema changes or permanent post modifications.

### Compatibility notes

`WP_REST_Posts_Controller::handle_terms()` processes taxonomy inputs after the post write; this plugin checks REST request terms before that point via `rest_pre_insert_post`.

The current WordPress.com site does not have the WPCode plugin installed, and WPVibe is currently at its daily call cap. This GitHub candidate is not a claim of production enforcement.
