"""Validate complete captures, source fingerprints and preserved theatre geometry."""
import hashlib,json,subprocess,urllib.request
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[2]
base=Path(__file__).parent/'evidence'
all_cases={}; sources={}; image_count=0
for phase,port in [('before',8765),('after',8766)]:
 folder=base/('films-49-'+phase)
 cases=[]
 for lang,count in [('en',663),('vi',114)]:
  doc=json.loads((folder/('results.json' if lang=='en' else 'results-vi.json')).read_text())
  assert len(doc['cases'])==count,(phase,lang,len(doc['cases']))
  assert len({c['id'] for c in doc['cases']})==38
  assert set(c['device'] for c in doc['cases'])=={'phone','tablet','computer'}
  for f,expected in doc['sources'].items():
   actual=subprocess.check_output(['git','show',doc['commit']+':'+f],cwd=root)
   assert hashlib.sha256(actual).hexdigest()==expected,(phase,f,'commit fingerprint')
   served=urllib.request.urlopen(f'http://localhost:{port}/{f}').read()
   assert hashlib.sha256(served).hexdigest()==expected,(phase,f,'served fingerprint')
  sources[phase]=doc['sources']
  cases+=doc['cases']
 for c in cases:
  prefix=f"{c['device']}-{c['lang']}-{c['id']}"
  files=[folder/f"{prefix}-p{c['page']}.png"]
  if c['page']==1:files.append(folder/f'{prefix}-shell.png')
  for f in files:
   im=Image.open(f).convert('RGB');assert im.getbbox(),str(f)+' is a cleared buffer';image_count+=1
  w,h=Image.open(files[0]).size
  assert abs(w-c['stage']['w'])<=1 and abs(h-c['stage']['h'])<=1,(str(files[0]),'stage dimensions')
 all_cases[phase]={(c['device'],c['lang'],c['id'],c['page']):c for c in cases}
assert all_cases['before'].keys()==all_cases['after'].keys()
assert sources['before']['css/style.css']==sources['after']['css/style.css']
for key,a in all_cases['before'].items():
 b=all_cases['after'][key]
 assert a['actors']==b['actors'],(key,'actor count changed')
 for part in ['stage','title','text']:
  assert a[part]['font']==b[part]['font'],(key,part,'font changed')
  for dim in ['x','y','w','h']:
   assert abs(a[part][dim]-b[part][dim])<=1,(key,part,dim,a[part][dim],b[part][dim])
summary={'matched_compositions':len(all_cases['before']),'nonblank_browser_pngs':image_count,'stories':38,'devices':['phone','tablet','computer'],'languages':['en','vi'],'css_unchanged':True,'title_text_stage_bounds_within_one_pixel':True,'actor_counts_unchanged':True,'served_sources_match_commits':True}
(base/'films-49-after'/'evidence-validation.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary))
