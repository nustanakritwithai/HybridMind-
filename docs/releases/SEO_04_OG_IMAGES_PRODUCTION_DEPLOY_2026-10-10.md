# HYBRID MIND — SEO-04 Social Preview / Open Graph Production Deployment

**Date:** 2026-10-10 (Asia/Bangkok)  
**Site:** https://hybridmind.online · WordPress.com Atomic site `257844857`  
**Owner request:** “อัพโหลดแล้ว” following explicit request to transfer two already-designed 1200×630 JPG covers to the connected WordPress Media Library and set Homepage + Post #55 social previews.  
**Business model:** AI editorial publisher with inactive Affiliate ad slots; not an owned-product store.  
**Rule:** UNKNOWN ≠ PASS.

## Result

**PASS — public `og:image` and dimensions updated correctly on Homepage and Published Post #55.** Original Homepage V3 and AI ERA Visual Interactive preserved. No text generation or image-generation credits used in this deployment.

### 1. Ingest actual user-uploaded images (not replacements)

User uploaded **two image/jpeg files** via the WPVibe temporary mobile uploader; `check_upload("up_01042fc7ad244a4d")` reported exactly **2 images ready**:
- `1000253773.jpg`: transferred to WPWriter `upload_media` as WordPress **Media #104** — original file verified `147,472 bytes`, dimensions `1200 × 630`. Human-checked source: `/mnt/data/hybrid_mind_og_home_v1.jpg`, SHA-256 `9604d5895e5f8c957211f524dede4a1bd60cc6c05e23cf3a9b104dc3f8dc861c`.
- `1000253774.jpg`: transferred to WPWriter as WordPress **Media #105** — original file verified `218,734 bytes`, dimensions `1200 × 630`. Human-checked source: `/mnt/data/hybrid_mind_og_ai_era_2026_v1.jpg`, SHA-256 `a6137ebed683b30fd2a2baceec716d56e358b4d20a0b004a8abaf557d6f8f4dd`.
- Matched originals to uploaded media by exact byte lengths **and upload order**; actual media storage checksum was not read independently. WP.com Media `media.get` verified media IDs/dimensions/file sizes.
- `media.update` set descriptive **Thai Titles and Alt Text**, explicitly labelling both covers AI-generated.
- Hosted URLs:
  - #104 `https://hybridmind.online/wp-content/uploads/2026/10/hybridmind-og-upload-1-verify.jpg`
  - #105 `https://hybridmind.online/wp-content/uploads/2026/10/hybridmind-og-upload-2-verify.jpg`

**Note:** WPWriter was connected and active on this site. It accepts URL-based upload; links from the WPVibe staging uploader bridged the user phone images to WPWriter's REST Media Library. There was no need to activate the separate WPVibe WordPress plugin.

### 2. Guarded WordPress changes and recoverability

[Exact pre-featured-media settings and rollback JSON](../backups/SEO_04_OG_FEATURED_MEDIA_BEFORE_2026-10-10.json) — stored and independently verified in GitHub **before production writes**, blob `6b706216381ebee519d3647ca4f800a27c462c5a`.

| Page | Before | After | Scope & safeguards |
| --- | --- | --- | --- |
| **Homepage Page #16** | Published V3, modified `2026-10-10T01:32:38`, featured_media `0`, 57,728-char Gutenberg body | Featured Media **104**, modified `2026-10-10T02:45:56` | WordPress `pages.update` changed **only `featured_media`**. Post-write full `pages.get(context=edit)` showed body **byte-identical**, Published unchanged |
| **AI ERA Post #55** | Published, modified `2026-10-10T02:07:48`, featured_media `0`, 55,274-char Gutenberg body with native AEO + original Visual iframe | Featured Media **105**, modified `2026-10-10T02:46:59` | WordPress `posts.update` changed **only supported `featured_media`**. Post-write body **byte-identical**. Attempted `_jetpack_hide_featured_image=true` was **rejected/not persisted** because the key is not registered for this post type REST API, and WordPress emitted explicit `meta_keys_dropped` warning; **not claimed to have succeeded** |
| **#55 scoped display styling** | Core `post-featured-image` block in shared V3.3 template adds a large hero above the existing Visual lesson when thumbnail assigned | Added **one `core/html` top-level block** with style `body.single-post.postid-55 main.wp-block-group figure.wp-block-post-featured-image{display:none!important}`; post modified `2026-10-10T02:48:37` | Optimistic-guarded `post-sections.insert(index=0)` with existing group + iframe block hashes confirmed **unchanged** (`651f5102f3a551174d9260fa9ccd4090f20ce0a1`, `35fffee971d301017a4ad5d8b3d6a8e96c33854d`). Source preserved in [scoped Gutenberg style](../design/SEO_04_POST_55_SOCIAL_IMAGE_ONLY_GUTENBERG_2026-10-10.html). No shared template change |

Full original AI ERA #55 exact pre-AEO backup remains at [GitHub](../backups/AEO_01_POST_55_PRE_NATIVE_SUMMARY_2026-10-10.html). WordPress Revisions allow additional state rollback; no content body overwrite occurred for the image assignment.

### 3. Anonymous public HTML independent readback

Used connected public-page HTML reader for three URLs after applying both changes, with cache-busting query values:

| URL | Public Open Graph `og:image` | OG size | Content / isolation |
| --- | --- | --- | --- |
| `https://hybridmind.online/` | `https://i0.wp.com/hybridmind.online/wp-content/uploads/2026/10/hybridmind-og-upload-1-verify.jpg?fit=1200%2C630&ssl=1` | 1200 × 630 | **PASS**, Homepage V3 intact, Affiliate placeholders still hidden, no new image tag in homepage body, no layout hero insertion |
| `https://hybridmind.online/2026/10/09/ai-era-2026-agent-tools-a2a/` | `https://i0.wp.com/hybridmind.online/wp-content/uploads/2026/10/hybridmind-og-upload-2-verify.jpg?fit=1200%2C630&ssl=1` | 1200 × 630 | **PASS**, native AEO answer block + original iframe present; `hm-seo04-social-only-image` scoped CSS present; existing article title intact. `Article` JSON-LD now includes real image #105 |
| `https://hybridmind.online/2026/10/09/ai-game-development-right-tools-godot-unreal-blender/` | Previous `hybridmind-ai-game-development-tools-lessons.jpg` | Previous 1200 × 1000 | **PASS isolation**, other article image unchanged and scoped #55 CSS not injected there |

**Note:** Rendered HTML proves correct metadata and CSS declaration, not visual screenshot of the computed final layout, nor that Facebook/LINE caches have refreshed; native-device and external link preview freshness remain **UNKNOWN**.

### 4. Rollback: two levels

**Image-only rollback** if the share previews are incorrect:
1. WordPress Page #16 `pages.update(featured_media=0)`; verify Published, V3 body unchanged and OG head returns previous blank default.
2. WordPress Post #55 `posts.update(featured_media=0)`; verify Published, AEO answers + Visual iframe intact; `Article.image` property reverts to missing.
3. Remove the dedicated `hm-seo04-social-only-image` top-level Gutenberg block via optimistic-guarded `post-sections.remove` (the block is inert with no featured image, but should be removed to restore exact editorial state).
4. Confirm all published/draft statuses and no unexpected unrelated edits. Do **not** globally rewrite Homepage or Post #55 content.

**Only remove dedicated CSS** if we want the #55 featured hero to become visible; by itself this does not affect `og:image`.

Never turn off Search Visibility to roll back a social thumbnail; the WordPress `public` setting was approved in the earlier release and is unrelated.

### 5. Remaining SEO / AEO work

- **Social card preview caching:** real Facebook/LINE share preview re-scrape not tested; HEAD/HTTP header and true rendering from external crawlers UNKNOWN.
- **Favicon/site logo:** existing `site_icon=0`, `site_logo=0`, no approved 512×512 square icon or logo asset installed. Do not reuse 1200×630 OG images as site icons.
- **Sitemap XML:** still under separate P0 investigation; Jetpack sitemaps module enabled but connected reader had returned not-found HTML for `/sitemap.xml`, even after `blog_public=1`. Actual HTTP status and Google Search Console data UNKNOWN.
- **Search Console:** previously suggested GSC Wizard not connected/verified. No reported indexing counts, positions, organic traffic, or guaranteed AI Search mentions.
- **Site functionality:** Keep Draft #57, Trust Drafts #67–#70, Typhoon disabled, Affiliate slots inactive. The user runs no storefront; seller checkout is always external.

**Final verdict: SEO-04 HOMEPAGE + AI ERA OG metadata PASS in Production; further social-cache/mobile-viewport QA UNKNOWN. UNKNOWN ≠ PASS.**
