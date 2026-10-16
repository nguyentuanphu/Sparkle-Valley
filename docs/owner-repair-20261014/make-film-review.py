"""Create labelled contact sheets from real browser PNGs, without changing them."""
from PIL import Image,ImageDraw
from pathlib import Path
import json,sys
base=Path(__file__).parent/'evidence'
for phase in (sys.argv[1:2] or ['before','after']):
 p=base/('films-49-'+phase)
 d=json.load(open(p/'results.json')); ids=list(dict.fromkeys(x['id'] for x in d['cases']))
 for device in (sys.argv[2:3] or ['phone','tablet','computer']):
  ready=[i for i in ids if any(x['device']==device and x['id']==i for x in d['cases'])]
  for n in range(0,len(ready),6):
   chunk=ready[n:n+6];w=180;h={'phone':310,'tablet':255,'computer':90}[device];sheet=Image.new('RGB',(w*6,(h+22)*len(chunk)), '#fff6e4');draw=ImageDraw.Draw(sheet)
   for row,id in enumerate(chunk):
    files=sorted(p.glob(f'{device}-en-{id}-p*.png'))
    for k,f in enumerate(files):
     im=Image.open(f).convert('RGB'); assert im.getbbox(),f'{f}: empty image'
     im.thumbnail((w,h));sheet.paste(im,(k*w,row*(h+22)+22));draw.text((k*w+3,row*(h+22)+3),f'{id} p{k+1}',fill='#3b2558')
   sheet.save(p/f'review-{device}-{n//6+1}.jpg',quality=90)
print('All contact sheets contain actual rendered images')
