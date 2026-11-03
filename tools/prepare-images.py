"""Technical WebP exports of existing user images; originals remain untouched."""
import hashlib,json,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2: raise SystemExit('Usage: python tools/prepare-images.py /chemin/vers/les-images-originales')
SOURCE=Path(sys.argv[1]).resolve(strict=True)
MAPPING={'margha.png':'margarita','prochoto.png':'prochoto','hawai.png':'hawai','4fro.png':'4-fromages','jadot.png':'jadot'}
out=ROOT/'images';out.mkdir(exist_ok=True);proof=[]
for original,name in MAPPING.items():
    file=SOURCE/original
    with Image.open(file) as im:
        width,height=im.size
        for size in (640,1280):
            copy=im.convert('RGB');copy.thumbnail((size,round(size*height/width)),Image.Resampling.LANCZOS);target=out/f'{name}-{size}.webp';copy.save(target,'WEBP',quality=83,method=6)
            proof.append({'file':target.name,'bytes':target.stat().st_size,'width':copy.width,'height':copy.height,'source':original,'sourceSha256':hashlib.sha256(file.read_bytes()).hexdigest()})
(ROOT/'images/provenance.json').write_text(json.dumps({'kind':'User-provided Nano Banana illustrations; full frame retained, including existing mark. Technical resizing/encoding only.','checkedAt':'2026-11-03','files':proof},indent=2)+'\n','utf-8')
print(json.dumps({'files':len(proof),'totalBytes':sum(p['bytes'] for p in proof)}))
