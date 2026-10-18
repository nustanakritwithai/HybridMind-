# Agent guide: Affiliate Slots 0.3.0

## Scope and permissions

Use the authenticated WordPress REST API to create and edit product drafts. Every route requires a logged-in user with `manage_options`. A product API write never assigns a slot, enables the product, confirms image rights, approves a revision, or activates public output. Do not try to change those rules through the config endpoint.

Base URL: `https://hybridmind.online/wp-json/hybridmind-affiliate/v1`

Keep credentials in the request environment, never in prompts, source files, logs, or this guide. WordPress Application Passwords use the standard WordPress authentication flow. Responses are private/no-store.

## Create a draft

Use a new 16–128 character `Idempotency-Key` for each logical create. Reuse the exact same key and body after a timeout or uncertain response; do not invent a new ID or key until the readback resolves the first attempt.

```sh
curl --fail-with-body --user "$WP_USER:$WP_APP_PASSWORD" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: replace-with-a-unique-16-plus-character-key' \
  -X POST 'https://hybridmind.online/wp-json/hybridmind-affiliate/v1/products' \
  --data '{"id":"travel-smart-glasses","title":"แว่นตาอัจฉริยะสำหรับเดินทาง","description":"โปรดตรวจสอบรายละเอียดและความเหมาะสมจากผู้ขายก่อนเผยแพร่","url":"https://s.shopee.co.th/1LgdBc2Osl","image":null,"order":100}'
```

The image is deliberately `null`: available seller images conflict, and translation, autofocus, UV protection, and other claims are unverified. Do not add those claims or select an image without owner confirmation.

The other supplied fixture is `aideepen-esp32s3-touch`, titled “AIDEEPEN ESP32-S3 จอสัมผัส 2.8 นิ้ว”, with URL `https://s.shopee.co.th/9pfBJUyV6m`. Keep firmware, included accessories, and ready-to-use claims unverified. Its description may say it is for IoT projects and experimenting with voice assistants.

## Read back and update safely

After create, verify the returned product and then read it again:

```sh
curl --fail-with-body --user "$WP_USER:$WP_APP_PASSWORD" \
  'https://hybridmind.online/wp-json/hybridmind-affiliate/v1/products/travel-smart-glasses'
```

On the create response, check `product.status` is `draft`, `product.enabled` is false, `draft` is true, and `public_output` is false. On the follow-up GET, check the product is still `draft` and disabled. The product response does not expose prices. Do not report the draft as published.

Before updating, read the current collection or product and copy its `revision` (also returned as the `ETag` and `X-HM-Affiliate-Revision`). Send that value in `If-Match`:

```sh
curl --fail-with-body --user "$WP_USER:$WP_APP_PASSWORD" \
  -H 'Content-Type: application/json' \
  -H 'If-Match: "COPY_THE_CURRENT_REVISION_HERE"' \
  -X PATCH 'https://hybridmind.online/wp-json/hybridmind-affiliate/v1/products/travel-smart-glasses' \
  --data '{"description":"โปรดตรวจสอบรายละเอียดและความเหมาะสมจากผู้ขายก่อนเผยแพร่"}'
```

Read the product again after every successful update. A `409` means the revision changed or a create key conflicts. Fetch current state and ask for review of the new values before retrying; never force an overwrite with a stale revision. A `428` means the update omitted `If-Match`. A create replay returns the current product state and does not make another write.

## Owner-only placement workflow

The `config` route is read-only for agents. Automatic placement choices are separate administrator settings and default off. They are not part of any agent request schema. The owner must select positions under **Settings → Affiliate Slots**, save, preview the resulting configuration, and explicitly approve the current revision and placement choices. Saving any placement change clears review and approval. A selected position still renders nothing unless its slot and product are enabled, the product has an owner-confirmed local image, and the live gate passes.

Supported opt-in positions:

- Homepage after Featured: only when exactly one Custom HTML block contains the verified Featured section, its single closing `</section>`, and the `#latest` section immediately after it. Otherwise the filter leaves the page unchanged. Place a core Shortcode block after Featured and before `#latest` only as a reviewed fallback.
- Article after intro: after the third non-empty top-level paragraph with at least 20 words, only with at least four top-level paragraphs and another paragraph immediately after it.
- Article near end: after the penultimate non-empty top-level paragraph with at least 20 words, only with at least eight paragraphs, 600 words, and another paragraph immediately after it.

Any existing `hm_affiliate_slot` shortcode on a page suppresses all automatic placements there. Insertion occurs in the render filter only and does not update saved posts. Feeds, REST, admin, previews, excerpts, password-protected content, unsupported contexts, recognized code/embed/interactive content, and posts 55 and 57 are excluded. `home_in_feed` and `sidebar_desktop` remain manual-only; the sidebar is unplaced.

## Product-card restrictions

Cards show no prices. Use only the supplied factual product name and a bounded, non-promissory description. The CTA is “ดูสินค้าบน Shopee”; disclosure says the site may receive a commission. Links use `rel="sponsored noopener"` in a new tab. Do not fetch affiliate links, prefetch or redirect visitors, set cookies, collect personal click data, or add tracking services. Outbound clicks are the first measurement goal; purchases and commissions are separate measures.
