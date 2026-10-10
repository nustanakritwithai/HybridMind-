"""Chromium OFFLINE mock QA. Not a WordPress Preview and not physical Android.
Run: python3 tools/newsroom_v2/mock_preview.py --html output/.../visual-article.gutenberg.html --out output/preview
"""
import json,argparse,html as html_escape
from pathlib import Path
from playwright.sync_api import sync_playwright

CSS='''
:root{color-scheme:light;font-family:system-ui,"Noto Sans Thai","Sarabun",sans-serif}
*{box-sizing:border-box}html,body{margin:0;max-width:100%;background:#edf3f3;color:#172f3b;overflow-x:clip}
a{color:#007769;overflow-wrap:anywhere;text-underline-offset:3px}a:focus-visible,summary:focus-visible{outline:3px solid #1c9c8d;outline-offset:3px}
header{background:#081725;color:#f0fff9;padding:24px max(22px,calc((100vw - 1080px)/2));font-weight:800;letter-spacing:.075em}
header span{color:#8be8cd}main{max-width:980px;width:calc(100% - 30px);margin:30px auto 60px}
h1{font-size:clamp(29px,5vw,52px);line-height:1.35;overflow-wrap:anywhere;letter-spacing:-.025em;margin:0 0 24px}
h2{font-size:clamp(23px,3vw,32px);line-height:1.4;overflow-wrap:anywhere;margin:24px 0 10px}
h3{font-size:clamp(18px,2.2vw,23px);line-height:1.4;overflow-wrap:anywhere}
p,li{line-height:1.95;font-size:clamp(15px,1.7vw,18px);overflow-wrap:anywhere}
.wp-block-group.hm-visual-article{max-width:100%;min-width:0;overflow-wrap:anywhere}
.hm-va-dek{font-size:clamp(18px,2.1vw,22px);color:#45636d;max-width:800px}
.hm-va-kicker{color:#007d72;font-weight:800;letter-spacing:.1em;font-size:12px}
.hm-va-panel{padding:clamp(19px,4vw,33px)!important;border-radius:20px!important;background:#081e2d;color:#eefdfb;margin:28px 0 44px}
.hm-va-panel h2,.hm-va-panel li,.hm-va-panel p{color:inherit}.hm-va-checklist{background:#e3f5ef;color:#153d3b}
.wp-block-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;max-width:100%}
.wp-block-column{min-width:0}.hm-va-card{background:white;border-radius:16px;border:1px solid #d5e7e5;padding:22px!important;box-shadow:0 8px 21px #102b3314}
.hm-newsroom-interactive{background:#0b2430;color:#f7fffd;border-radius:23px;padding:clamp(18px,4vw,35px);margin:30px 0}
.hm-newsroom-interactive h2{margin-top:0;color:#90ebd6}
.hm-newsroom-interactive details{background:#153645;border:1px solid #35616a;border-radius:14px;margin:12px 0;padding:14px 18px}
.hm-newsroom-interactive summary{font-weight:700;cursor:pointer;font-size:16px;line-height:1.65;overflow-wrap:anywhere}
.hm-newsroom-interactive p{color:#e2f4ef;margin:12px 0 0}
.wp-block-list{padding-inline-start:22px}
.table-outer{width:100%;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;border:1px solid #d7e3e5;border-radius:14px}
.table-outer table{border-collapse:collapse;min-width:620px;width:100%}
.table-outer th,.table-outer td{padding:12px;border:1px solid #d7e3e5;text-align:left;overflow-wrap:normal;white-space:nowrap}
.stress{margin-top:60px;border-top:3px dashed #8fa9ad;padding-top:20px}
img{max-width:100%;height:auto}.image-frame{display:grid;place-items:center;border:1px dashed #63777c;max-width:100%;border-radius:14px;padding:20px;min-height:150px}
@media(max-width:650px){main{width:calc(100% - 18px);margin:18px auto 40px}.wp-block-columns{grid-template-columns:minmax(0,1fr)}
header{padding:17px 15px}.hm-va-card{padding:15px!important}.hm-newsroom-interactive{border-radius:17px}}
'''


def frame(article,title,stress=False):
    extra=''
    if stress:
        extra='''<section class="stress" id="qa-stress"><h2>ทดสอบหัวข้อยาว: ความเข้าใจเกี่ยวกับข่าว AI และการประเมินความน่าเชื่อถือของข้อมูลที่ประกาศโดยหลายองค์กรอย่างต่อเนื่องโดยไม่เติมหลักฐานจากจินตนาการ</h2>
 <div class="table-outer"><table><thead><tr><th>แหล่งข่าว</th><th>วันที่เผยแพร่จริง</th><th>ข้อกล่าวอ้างที่ตรวจได้</th><th>สถานะหลักฐาน</th></tr></thead><tbody><tr><td>Source One</td><td>2026-10-05</td><td>ข้อมูลทดสอบที่ยาวมากเพื่อประเมินการตัดคำและการเลื่อนตารางในหน้าจอแคบ</td><td>ต้องตรวจ</td></tr></tbody></table></div>
 <div class="image-frame"><img src="file:///not-a-real-image-hm-newsroom.png" alt="ภาพทดสอบที่ยังโหลดไม่ได้"><p>ภาพยังไม่มีหลักฐานการโหลด (Mock fallback)</p></div>
 <p>ลิงก์อ้างอิงภายนอก: <a href="https://research.google/blog/open-and-emergent-problems-in-agentic-privacy-and-security-a-contextual-angle/">อ่านแหล่งที่มา</a></p></section>'''
    return f'<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>HYBRID MIND — Offline Mock Preview</title><style>{CSS}</style></head><body><header>HYBRID<span>MIND</span> · NEWSROOM TEST</header><main><h1>{html_escape.escape(title)}</h1>{article}{extra}</main></body></html>'


def run(path:Path,out:Path,title:str):
    out.mkdir(parents=True,exist_ok=True)
    article=path.read_text('utf8')
    original=frame(article,title,False);stress=frame(article,title,True)
    (out/'mock-preview.html').write_text(original,encoding='utf8')
    (out/'mock-stress.html').write_text(stress,encoding='utf8')
    results=[]
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        for width,height in [(320,740),(375,820),(390,844),(768,900),(1280,900),(1440,900)]:
            page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
            page.route('http**/*',lambda route: route.abort())
            page.set_content(original,wait_until='domcontentloaded')
            box=page.evaluate('''() => ({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,bodyScroll:document.body.scrollWidth,
                links:document.querySelectorAll('a[href]').length,details:document.querySelectorAll('details').length,
                contentFallback:document.querySelectorAll('main p').length})''')
            before=page.locator('details').first.get_attribute('open')
            page.locator('details summary').first.click()
            expanded=page.locator('details').first.get_attribute('open') is not None
            if width in (375,1280):page.screenshot(path=str(out/f'mock-{width}-desktop_or_mobile.png'),full_page=True,animations='disabled')
            box.update({'kind':'article-mock','horizontal_overflow':max(0,max(box['scrollWidth'],box['bodyScroll'])-width),'details_click_opens':expanded,
                       'browser':'Chromium Headless','is_wordpress_preview':False,'is_android_real':False})
            results.append(box)
            page.set_content(stress,wait_until='domcontentloaded')
            ex=page.evaluate('''() => ({scrollWidth:document.documentElement.scrollWidth,
              tableScroll:document.querySelector('.table-outer').scrollWidth,
              tableClient:document.querySelector('.table-outer').clientWidth,
              brokenImage:document.querySelector('.image-frame img').naturalWidth===0})''')
            results.append({'kind':'stress-fixture-not-generated-article','width':width,'height':height,'horizontal_overflow':max(0,ex['scrollWidth']-width),
                            'table_internal_scroll':ex['tableScroll']>ex['tableClient'],'missing_image_detected':ex['brokenImage'],
                            'is_wordpress_preview':False,'is_android_real':False})
            if width==375:page.screenshot(path=str(out/'stress-375-mock.png'),full_page=True,animations='disabled')
            page.close()
        browser.close()
    report={'mock_qa_only':True,'browser':'Chromium headless /usr/bin/chromium','wordPress_preview':'NOT_ATTEMPTED',
            'android_real':'NOT_ATTEMPTED','rows':results,'pass_no_horizontal_overflow':all(r['horizontal_overflow']==0 for r in results),
            'all_details_working':all(r.get('details_click_opens',True) for r in results)}
    (out/'chromium-mock-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--html',required=True,type=Path);p.add_argument('--out',required=True,type=Path)
    p.add_argument('--title',default='Google Research เสนอแนวทางความปลอดภัยของ AI Agent ที่ยึดบริบทเป็นหลัก')
    a=p.parse_args();r=run(a.html,a.out,a.title)
    print(json.dumps({'pass_no_horizontal_overflow':r['pass_no_horizontal_overflow'],'all_details_working':r['all_details_working'],
            'results':r['rows']},ensure_ascii=False,indent=2))
