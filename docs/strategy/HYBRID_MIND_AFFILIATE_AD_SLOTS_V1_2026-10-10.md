# HYBRID MIND — Affiliate Ad Slots, not an Online Store (Business Clarification V1)

**Owner clarification:** 2026-10-10 Asia/Bangkok — “เราไม่มีสินค้านะเราใช้ลิงก์ affiliate ตามจุดที่เป็นพื้นที่โฆษณา”.

## Authoritative Business Model

**HYBRID MIND is an editorial / AI technology learning publisher. It does NOT own products or inventory and is NOT a merchant.** Its commercial placement model is to place approved third-party **affiliate outbound links inside designated website advertising spaces**. The destination platform/seller handles catalog, prices, stock, transactions, payment, shipping, returns and customer service.

Do NOT build or recommend a storefront, checkout/cart, internal product database, inventory management, orders, payment API, stock synchronization, or fulfillment features. No assumption that HYBRID MIND is an authorized seller, distributor or an official sponsor of the destination product.

The **Smart Buying** editorial section may review or explain externally sold products, but it is editorial content, not a HYBRID MIND shop. Editorial inclusion is independent of monetized ad slots; affiliate creatives must not be represented as original product test evidence.

## Architecture: Separate editorial and monetization

`WordPress Published Posts → Editorial UI V3 → Reserved Affiliate Ad Slots → Approved Affiliate Destination`

- Editorial posts are authored, sourced and published through normal WordPress editorial controls.
- Each ad slot is a **separate presentation component** with a stable `slot_id`. It has no checkout behavior and need not alter an article's body.
- A slot is **empty/hidden by default**; activate only when the owner provides a specific approved destination link, creative and disclosure.
- Clicking navigates **outbound** to the retailer/marketplace, not to an HYBRID MIND purchase flow.
- Keep the ad system operationally independent from temporarily disabled Typhoon Chat; it uses no LLM provider runtime or token spend.

## Placement inventory (reservations installed 2026-10-10; campaigns INACTIVE)

| Slot | Context | User experience |
|---|---|---|
| `home_after_feature` | Homepage V3, after hero/featured editorial | One clearly labeled ad/affiliate creative, separate from feature story |
| `home_in_feed` | Homepage V3, between article groups | Responsive sponsored-content card with ad label, not disguised as editorial |
| `article_after_intro` | Standard article V3.3 (#31/#52), after intro | One discrete affiliate space separated from main content |
| `article_near_end` | Standard article V3.3, near conclusion | Optional external recommendation space after core informational content |
| `mobile_in_feed` | Mobile article/home | Uses same content semantics, single-column; no obtrusive fixed overlay |

**Special handling:** #55 is an immersive iframe visual article; avoid inserting ads inside its interactive lesson. If monetized, place labeled slots outside the lesson or in an owner-reviewed template wrapper. Draft #57 remains unpublished and ad-free.

## Minimal slot schema

```json
{
  "slot_id": "home_in_feed",
  "enabled": false,
  "label": "พื้นที่โฆษณา • Affiliate",
  "destination_url": null,
  "merchant_name": null,
  "creative_media_id": null,
  "alt_text": null,
  "affiliate_network": null,
  "campaign_start": null,
  "campaign_end": null,
  "last_link_check": null,
  "disclosure": "ลิงก์นี้อาจทำให้เว็บไซต์ได้รับค่าคอมมิชชันเมื่อคุณซื้อผ่านแพลตฟอร์มปลายทาง"
}
```

Do not fill in unverified brand names, prices, promotions, approval status, commission levels or destination URLs.

## Trust / SEO / Security rules

- Show a visible label and near-link disclosure whenever an affiliate slot is active. Affiliate must never appear to be an independent product-test result or publisher-owned inventory.
- Google Search Central recommends qualifying affiliate links with `rel="sponsored"` (optionally also `nofollow`). External new-tab links should also use `noopener noreferrer`. Ensure link URL/scheme validation and avoid open redirects, unsafe HTML, unverified tracking tags, or embedded seller-supplied scripts.
- Creative imagery must be owned/licensed/permitted or provided by the approved affiliate program; include truthful alt text and never substitute an AI-generated illustration as authentic product photography.
- Prefer outbound click counts (privacy-safe aggregate) instead of personal profiling. Check cookies/tracking, privacy policy and campaign disclosure before adding analytics or third-party ad embeds.
- Allow central pause/disable and expiry; empty ad slots should collapse cleanly in desktop/mobile.
- Preserve an editorial-first ratio: meaningful article content comes before and remains readable without any ads.

## Revised next roadmap

- **R1 — Stability / Mobile QA:** continue inspection of existing public Homepage V3 and Articles V3.3; NO ad insertion as part of QA.
- **R2 — Trust, Editorial and SEO:** finish public contact/privacy/affiliate disclosure, with correct wording that HYBRID MIND is a **publisher receiving potential commissions**, not a merchant. Do not publish drafts without separate approval.
- **R3 — Visual Learning V3.4:** trusted reusable widgets for educational content, independent of ads.
- **R4 — Motion UI:** lightweight visual storytelling; optional motion creative for affiliate space, gated on performance/accessibility.
- **R5 — Dynamic Editorial Engine:** publish-to-home dynamic article listing; ad slots keep their own IDs as stable reserved positions.
- **R6 — Affiliate Ad Placement System** (REPLACES “Smart Buying Commerce Experience”): centrally managed ad slots, status, creative, link validation, disclosure, aggregate click reporting and mobile ad QA. **No catalog, cart, payments, inventory or orders.**
- **R7 — AI-Assisted Newsroom:** bounded generation of *individual* editorial or ad creative candidates; no autonomous approval, editing of other slots, ad launch or publication.

## Change control

This document records the owner's correction and the first owner-directed implementation round. **Four inactive, hidden reservation positions are now installed** in WordPress Homepage V3 and Single Post V3.3 Template (Home: `home_after_feature`, `home_in_feed`; Standard articles: `article_after_intro`, `article_near_end`; mobile uses these responsive slots). **No actual affiliate link, creative, URL, tracking, product, or merchant feature is enabled.** The original editorial V3/V3.3 code and article bodies were preserved; reversible backups are in GitHub. Evidence: [R1 / ad-slot deployment report](../releases/HM_R1_STABILITY_AND_INACTIVE_AFFILIATE_SLOTS_2026-10-10.md). **Activation of any campaign requires an approved specific destination link/creative, user-visible commercial disclosure, and separate controlled QA.** Typhoon Guest, real mobile browser QA, Contact/Privacy and SEO gates remain independent. UNKNOWN != PASS.

**UNKNOWN != PASS.**
