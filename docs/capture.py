from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
from base64 import b64encode
import re
css=(root/'styles.css').read_text()
js=(root/'app.js').read_text()
html=(root/'index.html').read_text()
for f in (root/'assets').iterdir():
 mime='image/webp' if f.suffix=='.webp' else 'image/png'
 data='data:'+mime+';base64,'+b64encode(f.read_bytes()).decode('ascii')
 css=css.replace('assets/'+f.name,data)
 js=js.replace("A+'"+f.name+"'",repr(data))
 js=js.replace('assets/'+f.name,data)
html=re.sub(r'<link[^>]*fonts\.googleapis[^>]*>','',html)
html=re.sub(r'<link[^>]*fonts\.gstatic[^>]*>','',html)
html=html.replace('<link rel="stylesheet" href="styles.css" />','<style>'+css+'</style>')
html=html.replace('<script src="app.js" defer></script>','<script>'+js+'</script>')
routes={
'01-home':'','02-nile-cruises':'nile-cruises','03-cruise-detail':'nile-cruises/luxury-nile-cruise-4-nights',
'04-dahabiyas':'dahabiyas','05-dahabiya-detail':'dahabiyas/luxury-dahabiya-sailing',
'06-journeys':'journeys','07-journey-detail':'journeys/classic-nile-journey',
'08-destinations':'beyond-the-nile','09-destination-detail':'beyond-the-nile/cairo-and-giza',
'10-nile-stories':'nile-stories','11-article':'nile-stories/choosing-your-nile-cruise',
'12-about':'about','13-why-us':'about/why-niletrails','14-travel-information':'travel-information',
'15-contact':'contact','16-plan-journey':'plan-your-journey'
}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-web-security'])
 for device,viewport in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
  page=browser.new_page(viewport=viewport,device_scale_factor=1.0)
  page.set_content(html,wait_until='load')
  errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  for name,route in routes.items():
   page.evaluate('(r)=>location.hash="#/"+r',route)
   page.wait_for_timeout(300)
   horizontal=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
   badImgs=page.evaluate('Array.from(document.images).filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)')
   if horizontal or badImgs or errors: print('WARNING',device,name,'overflow',horizontal,'bad images',badImgs,'errors',errors);
   if horizontal: print('OFFENDERS',page.evaluate('Array.from(document.querySelectorAll("*")).filter(x=>x.getBoundingClientRect().right>innerWidth+1).map(x=>({tag:x.tagName,cls:x.className,text:(x.textContent||"").slice(0,35),right:x.getBoundingClientRect().right})).slice(0,14)'))
   if device=='desktop' or name in ['01-home','02-nile-cruises','06-journeys','16-plan-journey']:
    page.screenshot(path=str(root/'previews'/(name+'-'+device+'.png')),full_page=True,animations='disabled')
   else: # mobile top for others
    page.screenshot(path=str(root/'previews'/(name+'-'+device+'-top.png')),full_page=False,animations='disabled')
   print(device,name,page.title(),'height',page.evaluate('document.body.scrollHeight'))
  if device=='desktop':
   page.evaluate('location.hash="#/nile-cruises"');page.wait_for_timeout(150);page.select_option('#filter-category','luxury');print('filter count',page.locator('#results-count').inner_text())
   page.evaluate('location.hash="#/plan-your-journey"');page.wait_for_timeout(150);page.click('#plan-next');print('planner step 2',page.locator('#step-label').inner_text());page.click('#plan-next');print('planner step 3',page.locator('#step-label').inner_text())
  else:
   page.evaluate('location.hash="#/"');page.wait_for_timeout(150);page.click('#menu-toggle');print('mobile menu visible',page.locator('#mobile-panel').is_visible())
  page.close()
 browser.close()
