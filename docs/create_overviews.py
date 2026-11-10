from PIL import Image,ImageDraw,ImageFont,ImageOps
from pathlib import Path
root=Path(__file__).resolve().parents[1];preview=root/'previews'
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
serif='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
def F(sz,display=False,bold=False):
 pp='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf' if display else ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else fontpath)
 return ImageFont.truetype(pp,sz)
N='#092434';INK='#102d3c';G='#c7a36a';B='#f8f5ef';M='#70828a'
items=[('01-home','Homepage'),('02-nile-cruises','Cruise collection'),('03-cruise-detail','Cruise detail'),('04-dahabiyas','Dahabiyas'),('06-journeys','Journeys'),('08-destinations','Beyond the Nile'),('10-nile-stories','Nile Stories'),('12-about','About NileTrails'),('16-plan-journey','Plan Your Journey')]

def make_collage(mode):
 mobile=(mode=='mobile');cols=3 if not mobile else 5
 cw=850 if not mobile else 400;ch=605 if not mobile else 725;pad=52;gap=34;titleheight=230
 rows=(len(items)+cols-1)//cols
 w=pad*2+cols*cw+(cols-1)*gap
 h=titleheight+rows*(ch+gap)+pad+80
 canv=Image.new('RGB',(w,h),B);d=ImageDraw.Draw(canv)
 d.rectangle((0,0,w,175),fill=N)
 d.text((pad,34),'NILETRAILS  /  ATELIER',font=F(25,bold=True),fill=G)
 d.text((pad,72),'An editorial way to discover Egypt',font=F(49,display=True),fill='#ffffff')
 d.text((pad,145),'INTERACTIVE WEBSITE DESIGN   ·   '+('MOBILE 390 PX' if mobile else 'DESKTOP 1440 PX')+'   ·   CONCEPT V2',font=F(14,bold=True),fill='#a8bdc7')
 for i,(fname,title) in enumerate(items):
  x=pad+(i%cols)*(cw+gap);y=titleheight+(i//cols)*(ch+gap)
  d.rounded_rectangle((x+8,y+12,x+cw+8,y+ch+12),radius=10,fill='#dedbd4')
  d.rounded_rectangle((x,y,x+cw,y+ch),radius=9,fill='#ffffff')
  border=18;bar=42
  d.rounded_rectangle((x+border,y+border,x+cw-border,y+border+bar),radius=5,fill='#ebeee9')
  d.ellipse((x+border+15,y+border+15,x+border+27,y+border+27),fill='#c9af85')
  d.ellipse((x+border+37,y+border+15,x+border+49,y+border+27),fill='#d1d0c7')
  d.ellipse((x+border+59,y+border+15,x+border+71,y+border+27),fill='#d1d0c7')
  target=(cw-2*border,ch-bar-2*border-60)
  p=preview/(fname+('-mobile.png' if mobile else '-desktop.png'))
  if not p.exists():p=preview/(fname+'-mobile-top.png')
  im=Image.open(p).convert('RGB')
  visible=int(im.width*target[1]/target[0]);im=im.crop((0,0,im.width,min(im.height,max(visible,im.width//2))))
  im=ImageOps.fit(im,target,method=Image.Resampling.LANCZOS,centering=(0.5,0.02))
  canv.paste(im,(x+border,y+border+bar))
  d.text((x+border,y+ch-46),title,font=F(24,bold=True),fill=INK)
  d.text((x+cw-95,y+ch-44),f'{i+1:02}',font=F(22,display=True),fill='#b39870')
 d.text((pad,h-53),'DESIGN REFERENCE — NOT FINAL CLIENT INVENTORY  /  ILLUSTRATIVE PHOTOS',font=F(14,bold=True),fill=M)
 out=preview/('ATELIER_ALL_MOBILE_PAGES.jpg' if mobile else 'ATELIER_ALL_DESKTOP_PAGES.jpg')
 canv.save(out,quality=91,subsampling=0)
 print(out, canv.size)
make_collage('desktop');make_collage('mobile')
# A deliberate executive concept board, not a screenshot dump.
w,h=3200,2050;c=Image.new('RGB',(w,h),B);d=ImageDraw.Draw(c)
d.rectangle((0,0,w,340),fill=N)
d.text((130,65),'N I L E T R A I L S    /    A T E L I E R',font=F(30,bold=True),fill=G)
d.text((130,135),'Egypt, at the pace of the Nile.',font=F(82,display=True),fill='white')
d.text((135,275),'WEB EXPERIENCE   •   EDITORIAL DESIGN   •   JOURNEY DISCOVERY',font=F(20,bold=True),fill='#afc0c8')
# hero image strip
hero=Image.open(root/'assets/nile-sailing.webp').convert('RGB')
hero=ImageOps.fit(hero,(1830,800),centering=(0.6,0.45));c.paste(hero,(1270,400))
left=Image.open(preview/'01-home-desktop.png').convert('RGB')
left=ImageOps.fit(left,(1070,800),centering=(0.5,0.04))
c.paste(left,(130,400))
d.rectangle((1270,1040,3100,1200),fill='#092434')
d.text((1330,1082),'A refined, image-led, conversion-focused travel identity.',font=F(27,display=True),fill='#f2e8d8')
d.text((132,1250),'DESIGN LANGUAGE',font=F(21,bold=True),fill='#a78355')
d.text((132,1310),'Warm ivory. Deep Nile blue. Editorial typography.',font=F(48,display=True),fill=INK)
colors=[(INK,'INK NAVY','#102D3C'),(N,'DEEP NILE','#092434'),(G,'SAND GOLD','#C7A36A'),('#F0ECE3','STONE SAND','#F0ECE3'),('#FCFAF6','WARM IVORY','#FCFAF6')]
for i,(col,name,code) in enumerate(colors):
 x=130+i*595
 d.rounded_rectangle((x,1450,x+540,1640),radius=13,fill=col,outline='#d7d4cd',width=2)
 d.text((x+4,1668),name,font=F(22,bold=True),fill=INK)
 d.text((x+4,1704),code,font=F(20),fill=M)
d.line((130,1845,3070,1845),fill='#d3cec6',width=2)
d.text((130,1885),'16 CORE TEMPLATES    /    RESPONSIVE 1440 + 390    /    INTERACTIVE PROTOTYPE + ANTIGRAVITY HANDOFF',font=F(20,bold=True),fill=INK)
d.text((130,1960),'Visuals are AI concepts; final launch imagery, vessel inventory, legal text and enquiry backend require client approval.',font=F(18),fill=M)
board=preview/'NILETRAILS_ATELIER_DESIGN_DIRECTION.jpg';c.save(board,quality=92,subsampling=0);print(board,c.size)
