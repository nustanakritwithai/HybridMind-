# Affiliate product API for agents

This API stores and edits product records as Drafts only. The payloads in examples/affiliate-products-draft.json are fixtures; do not send or publish them automatically.

## Access and safety rules

- Use standard WordPress REST authentication, such as an Application Password belonging to a user with the manage_options capability, or cookie authentication with a REST nonce.
- Every route checks authentication and manage_options. Missing authentication returns 401; insufficient capability returns 403.
- Use HTTPS. Keep Application Passwords in the agent secret manager; never place credentials in source, fixtures, logs, or shell history.
- The API reads and writes product records in the existing hm_affiliate_slots_v1 option.
- It does not assign products to slots, enable a slot or product, or approve an advertisement.
- Every create/update is a Draft: enabled=false, rights_confirmed=false for new products, and approval/reviewed_digest are cleared.
- There are no API routes for review, approval, placement, or public activation.
- Send plain text only; HTML in titles or descriptions is rejected.
- An image URL must exactly match an HTTPS URL for an existing local WordPress Media Library attachment. External image URLs are rejected.
- Do not include prices. Public cards do not display prices.

## Routes

| Method | Path | Purpose |
|---|---|---|
| GET | /wp-json/hybridmind-affiliate/v1/products | List products and current revision |
| GET | /wp-json/hybridmind-affiliate/v1/products/{id} | Read one product |
| POST | /wp-json/hybridmind-affiliate/v1/products | Create a disabled Draft |
| PATCH | /wp-json/hybridmind-affiliate/v1/products/{id} | Update one product as a disabled Draft |
| GET | /wp-json/hybridmind-affiliate/v1/config | Existing read-only config endpoint |

Responses are private/no-store and include revision, ETag, and X-HM-Affiliate-Revision. Revision is the SHA-256 digest of the canonical configuration at read time.

## Create and read back

Send a unique Idempotency-Key for each logical create (16–128 safe ASCII characters from A–Z, a–z, 0–9, dot, underscore, colon, or hyphen). Reuse the same key only when retrying the same payload.

```sh
curl --fail-with-body --user "$WP_USER:$WP_APP_PASSWORD" -H 'Content-Type: application/json' -H 'Idempotency-Key: agent-run-2026-10-18-01' -X POST 'https://<wordpress-host>/wp-json/hybridmind-affiliate/v1/products' --data-binary @travel-smart-glasses.json
```

Success returns HTTP 201 with product, revision, draft=true, public_output=false, and replayed=false. Read back the exact product before continuing:

```sh
curl --fail-with-body --user "$WP_USER:$WP_APP_PASSWORD" 'https://<wordpress-host>/wp-json/hybridmind-affiliate/v1/products/travel-smart-glasses'
```

Compare the product and revision from readback. Replaying the same key and payload returns HTTP 200 with replayed=true and does not add another record. Replay returns the product's current snapshot: `draft` and `public_output` match its current live eligibility. If an owner later approves that product, replaying its create key reports `draft=false` and `public_output=true` without changing configuration. Reusing a key with another payload or reusing a product ID returns HTTP 409.

If create returns HTTP 409 because the configuration changed during save, the draft may already have committed. Retry only the same payload with the same Idempotency-Key; the pending receipt checks for the matching saved product and recovers its result without creating a duplicate. Do not switch to a new key until you have read and reconciled the current product list.

## Update and conflict

Read the current product first, then send its revision in If-Match. Never retry an update with an old revision automatically.

```sh
curl --fail-with-body --user "$WP_USER:$WP_APP_PASSWORD" -H 'Content-Type: application/json' -H 'If-Match: "<revision-from-readback>"' -X PATCH 'https://<wordpress-host>/wp-json/hybridmind-affiliate/v1/products/travel-smart-glasses' --data-binary '{"description":"พิจารณาข้อมูลผู้ขายและรายละเอียดที่ยืนยันได้ก่อนเลือกซื้อ"}'
```

If the response is HTTP 409, GET the latest product, inspect the changes, and create a new update request using its current revision. A missing If-Match returns HTTP 428. PATCH returns the product to Draft and sets enabled=false. Changing its image also clears rights_confirmed so an owner must review the new image.

## JSON fields

Create accepts id, title, description, url, image, and order. Stable IDs match ^[a-z0-9][a-z0-9_-]{0,63}$. image can be null, {"attachment_id":123}, or {"url":"https://..."} only if that URL is the canonical HTTPS URL of a local Media Library attachment. Update accepts only title, description, url, image, and order. The API rejects enabled, rights_confirmed, price, approval, reviewed_digest, and slot configuration fields.

url must be an HTTPS Shopee link on an allowed host: shopee.co.th, s.shopee.co.th, or shope.ee. The plugin does not fetch or redirect the affiliate URL, and does not load it before a user click.

## Review, upgrade, and rollback

After an agent adds or changes a product, an administrator must inspect the data and image, save it, open the private preview, and explicitly approve the reviewed configuration in Settings → Affiliate Slots. Every API write invalidates prior approval and public output is disabled by the existing live_ready gate.

The canonical option remains schema version 1. Idempotency receipts are stored separately in hm_affiliate_idem_<sha256> options. Version 0.1.0 ignores these receipt options and can read API-created product records because they use the existing item schema. Before a future production update, read back/export the current config and retain its backup. Replace plugin files without deleting options. To roll back, restore the 0.1.0 plugin files while keeping hm_affiliate_slots_v1, hm_affiliate_slots_backup_v1, and idempotency receipts.

This guide and its fixtures do not authorize writes to the live website. Staging and production use require separate approval.
