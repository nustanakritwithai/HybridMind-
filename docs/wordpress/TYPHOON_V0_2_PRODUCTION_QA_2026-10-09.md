# Hybrid Mind — Typhoon Chat v0.2 Production QA (2026-10-09)

**Site:** https://hybridmind.online · WordPress.com Atomic · Site ID 257844857  
**User-supplied screenshot:** Android ~09:23 Asia/Bangkok, Typhoon plugin Settings > Website Knowledge QA interface. Screenshot not uploaded to this public repository.  
**Rule:** UNKNOWN ≠ PASS.

## Summary

- **PASS** WordPress.com plugin inventory and WPVibe independent site-info read both report `Hybrid Mind — Typhoon Chat` **v0.2.0 ACTIVE**.
- **PASS** Admin-only GET `/wp-json/hybridmind/v1/knowledge-status` returned:
  - `version: 0.2.0`
  - `mode: published_wordpress_only`
  - `knowledge_enabled: true`
  - `knowledge_limit: 3`
  - `published_posts: 2`
  - `published_pages: 2`
  - `configured: true`
  - `external_live_web_search: false`
  - `reads_drafts: false`
- **PASS** Admin-only `knowledge-preview?question=GS20` returned one source:
  - WordPress post **#31**, title *GS20 Smart Glasses ราคา 602 บาท ฟังเพลง รับสาย และแปลภาษาด้วย AI ได้จริงแค่ไหน?*
  - Source URL: https://hybridmind.online/2026/10/09/gs20-smart-glasses-ai-translation-guide/
  - Date: 2026-10-09
  - Excerpt identifies claims as **seller-reported**, not independently tested.
- **PASS** `knowledge-preview` for `Hybrid Mind คืออะไร` returned the real published homepage **#16** at https://hybridmind.online/.
- **PASS — exclusion smoke tests**, candidate term `HUAWEI Eyewear 2` (in Draft #17) yielded zero sources; `Hello World!` (published default sample) yielded zero sources.
- **PASS — status corroboration** Page #17 remains **DRAFT**, post #18 remains **DRAFT**, post #31 remains **PUBLISHED**, page #16 remains **PUBLISHED** with shortcode `[hybridmind_typhoon_chat]`.
- **PASS — site gate** Coming Soon / unlaunched remains in effect; no public launch or theme change.
- **UNKNOWN** Whether Typhoon Chat **v0.2.0** produces a well-grounded answer with correct clickable citations and renders Markdown correctly on Android. The owner's screenshot is the admin retrieval QA, **not** a chat transcript from v0.2.0.
- **UNKNOWN** Logged-out guest behavior, cost controls, mobile overflow and keyboard after upgrading.
- **NOT SUPPORTED** Fresh external internet/news search. V0.2 reads only already-published WordPress content.

## Explicit negative relevance finding

- Query `ข่าว AI ล่าสุดวันนี้` returned the published GS20 article and homepage — both are relevant to broader AI but **not sufficient evidence of fresh external AI news today**.
- Treat this as a relevance/freshness limitation for the next iteration, **not** proof of live-search capability.
- Before claiming live-news answers, add intentional current-source retrieval, dated citations, freshness rules and a confidence/no-results gate. The bot should say it cannot access live external news whenever none is verified.

## Production checks performed

| Test | Status | Method |
| --- | --- | --- |
| Plugin v0.2 installed, active | PASS | WordPress.com + WPVibe inventories |
| Knowledge enabled | PASS | `/hybridmind/v1/knowledge-status` |
| GS20 article discovery | PASS | Server-side knowledge-preview + owner screenshot |
| Hybrid Mind home discovery | PASS | Knowledge preview |
| Draft exclusion | PASS in checked cases | Negative query + post/page status reads |
| Placeholder Hello World exclusion | PASS in checked case | Negative query |
| Post #31 is published | PASS | WordPress.com posts.get |
| Post #18 and page #17 remain draft | PASS | WordPress.com posts.get/pages.get |
| Typhoon answer invokes retrieval, cites source | UNKNOWN | No post-upgrade browser interaction proof |
| Markdown visual formatting | UNKNOWN | No post-upgrade screenshot |
| Broad live web/news search | NOT IMPLEMENTED | `external_live_web_search: false` |
| Theme/Coming Soon unchanged | PASS | Connector status |

## Next QA action

1. Open authenticated homepage https://hybridmind.online/ on Android after refresh.
2. Ask **"Hybrid Mind คืออะไร? ขอแหล่งอ้างอิงจากเว็บไซต์นี้ด้วย"**. Verify it describes the brand as Modern AI Lifestyle media, shows a clickable homepage source, and renders Markdown without raw `**` or `###`.
3. Ask **"สรุปบทความ GS20 ที่เผยแพร่บนเว็บไซต์ พร้อมบอกสิ่งที่ยังไม่ยืนยัน"**. Expect source link to post #31, precise distinction between listing claims and tested facts.
4. Ask **"ข่าว AI ล่าสุดวันนี้จากอินเทอร์เน็ตมีอะไรบ้าง?"**. It must clearly say it has no external live search; an answer fabricated from GS20 would be a FAIL.
5. Capture device screenshots and check source links, message scroll, mobile keyboard, error state. Keep Typhoon settings unmodified during QA.
6. Preserve public chat and site launch as separate release gates. UNKNOWN ≠ PASS.

**Decision: V0.2 installation and WordPress published-content retrieval QA PASS; citation-grounded Typhoon interaction and mobile visual QA remain UNKNOWN.**
