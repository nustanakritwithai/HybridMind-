# Hybrid Mind — Typhoon Chat V0.2.1 Thai Search Fix and QA

**Date:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online/ (WordPress.com Atomic ID 257844857)  
**Live plugin when checked:** Hybrid Mind — Typhoon Chat **v0.2.0 ACTIVE**  
**New plugin ZIP:** `hybridmind-typhoon-chat-v0.2.1.zip` (available as a conversation attachment; **NOT yet installed**)  
**SHA256:** `a96f195e6a447217f7b159d9f56844da2b15cfed31ea2014c7450ee6cfdf1505`  
**Rule:** UNKNOWN ≠ PASS

## User mobile evidence (~09:29–09:31)

The site owner submitted 5 Android screenshots of the **live v0.2 chatbot**. Screenshot files are in the conversation, **not attached here in this public GitHub repository**.

Observed:
- Question `Hybrid Mind คืออะไร?`: **PASS for brand identity**. Bot explains a Thai-language AI and Modern AI Lifestyle media brand rather than a generic human/AI hybrid. Markdown bold and heading formatting visibly improved.
- `แว่น`: **PARTIAL**. Bot gives a generic product-category answer, but article-backed source evidence is not shown in the crop.
- `หาแว่น`: **FAIL**. Bot says it cannot find matching website information even though published article #31 is a GS20 glasses guide.
- `G20`: **PASS (non-hallucination)**. No source for this distinct/nonexistent model is reported; do not silently substitute GS20.
- `Gs20`: **PASS for retrieval-grounded response**. Bot explains GS20 and uses a `[1]` source marker. **Clickable citation link not confirmed** because it is outside the visible screenshot.
- The bot's response to the failed glasses query contained a raw Markdown link syntax `[https://hybridmind.online](https://hybridmind.online)`, a formatting issue.

## Live WordPress API tests (V0.2.0)

Authenticated admin-only `GET /wp-json/hybridmind/v1/knowledge-preview?question=...`:

| Query | Result on live v0.2.0 |
| --- | --- |
| GS20 | 1 published GS20 post |
| Gs20 | 1 published GS20 post |
| G20 | 0 sources |
| แว่น | **0 sources — FAIL** |
| หาแว่น | **0 sources — FAIL** |
| แว่นตา | 1 published GS20 post |
| แว่นฟังเพลง | GS20 post and home page |
| แว่น AI | GS20 post and home page |
| Smart Glasses | GS20 post and home page |
| แว่น Bluetooth | home page and GS20 post |
| ราคา 602 | 1 published GS20 post |
| Hybrid Mind คืออะไร | homepage #16 |
| ข่าว AI ล่าสุดวันนี้ | **GS20 post and home page — relevancy/freshness FAIL** |

Independent `knowledge-status`: `version=0.2.0`, `mode=published_wordpress_only`, `knowledge_enabled=true`, `external_live_web_search=false`, `reads_drafts=false`. Site remains `coming_soon/unlaunched`.

## Root cause

V0.2.0 used the Unicode token split regexp `/[^\p{L}\p{N}]+/u`, which treats Thai combining marks (tone/vowel marks, Unicode category **M**) as separators. Actual local PHP reproduced:
- `แว่น` → `["แว","น"]`
- `หาแว่น` → `["หาแว","น"]`
- `ข่าว` → broken into fragments
- `แว่นตา` coincidentally leaves `นตา`, explaining partial match.

WordPress retrieval then scored only those broken tokens, so it returned no published article for short Thai queries.

## Patch V0.2.1 (local implementation)

1. Split using `/[^\p{L}\p{M}\p{N}]+/u` to **preserve all Thai combining marks**.
2. Handle common Thai intent prefixes glued to their topic (e.g. `หาแว่น` → search for `แว่น` as well). Introduce a conservative small vocabulary of topic stems, each still requiring a match against published WordPress documents.
3. Improve Unicode length/substring fallback when PHP mbstring is absent; avoid corrupting Thai characters.
4. For queries asking **live/today/recent AI news**, require a `post` in category `ai-news` published in the last 48 hours; do not cite the GS20 guide or homepage as live breaking news. This is **still local WordPress retrieval, not external live web search**.
5. Render same-site Markdown hyperlinks safely only when the link is to the canonical homepage or a grounded website source URL returned by the server. Invalid/external/model-invented URLs display text without clickable links. The underlying DOM uses `textContent`, not model-supplied HTML.
6. Strengthen model instructions to distinguish product listing claims from verified specs/tests, and use real numbered source references.
7. Keep `hybridmind-typhoon-chat` plugin directory, `hybridmind_typhoon_settings` WordPress option, `[hybridmind_typhoon_chat]` shortcode, Typhoon API endpoint, model and API-key storage scheme unchanged. No secrets in package.

## Test results

**Local automated mock tests: PASS.**
- PHP lint for both PHP sources; JavaScript syntax check.
- PHP knowledge retrieval: 7 Thai/product variants (แว่น, หาแว่น, ช่วยหาแว่น, แว่นตา, แว่นฟังเพลง, อยากได้แว่นราคาถูก, Gs20) return published GS20; G20 does not incorrectly match.
- Live-news test with no AI News content returns zero; positive test with a synthetic published, fresh, AI News-category post returns it.
- Draft, private, password-protected, offsite URL and Hello World exclusions retained; ordinary site latest-posts query retained.
- Mock Typhoon HTTP integration: server keeps API key, submits trusted system description and public excerpts; browser response does not reveal key; plugin advertises version 0.2.1.
- JavaScript safe DOM test: headings, lists and bold, legitimate same-site links, malicious link downgrade to text, literal HTML never evaluated, input restored after submitting.
- ZIP `unzip -t` passed; archive has only the one expected plugin directory, with PHP/JS/CSS/README/installation files. SHA256 above.

**Production V0.2.1: UNKNOWN**. At final verification, WordPress still reported **v0.2.0 ACTIVE**.

## Next installation and acceptance gates

1. Back up WordPress first.
2. Download v0.2.1 ZIP from the ChatGPT conversation.
3. WordPress → Plugins → Add New → Upload Plugin. Select v0.2.1 and **Replace current with uploaded**. **Do not delete v0.2.0 first**. This reuses existing settings in the same option; verify provider key remains configured after replace.
4. Confirm v0.2.1 ACTIVE with WordPress Connector.
5. In Typhoon Settings’ free Search Test, compare `แว่น`, `หาแว่น`, `GS20`, `G20`, `ข่าว AI ล่าสุดวันนี้`. Expect the first three to match published GS20; the last two to return no sources while no dated AI News article exists.
6. In signed-in homepage Chat, ask `หาแว่น` and `สรุป GS20 พร้อมแหล่งอ้างอิง`. Verify correct brand context, **seller claims qualified**, and a clickable real GS20 article source.
7. Ask for today's live AI news. Must not mislabel evergreen/product pages as current news.
8. Recheck Android after upgrade. Public guest access, cost/abuse rate limiting and full responsive QA remain separate HOLD gates.
9. Keep Coming Soon unchanged until owner approves Public Launch.

**Decision:** Root cause VERIFIED, PATCH+LOCAL QA PASS. **Production rollout and true Typhoon V0.2.1 end-to-end acceptance HOLD / UNKNOWN.**
