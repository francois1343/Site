"""Web exports of recovered user illustrations; no crop, no source modification.

Mapping: user's site-menu order, cross-checked against the visible toppings.
This is an editorial match, not merchant validation or a product photograph.
Photo 01 duplicates the existing Bianca; no confident Raclette match was found.
"""
from pathlib import Path
import hashlib, json, sys
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
NAMES = ['Piemontaise','Veniziana','Salami','Napolitaine','Diavolo','Thon',
         '4 Saisons','Sicilienne','Végétarienne','Lardière','Merguez','Parmigiann',
         'Capresse','Calzone','Bolognaise','Chop','Marinara','Chèvre','Carpaccio',
         'Scampi','Saumon','Chef','Feta','5 Fromages','Recola','Mexicaine',
         'Calabrese','Burger','Maison','Gyros','Mami','Spéciale','Ritta',
         'Savoyarde','Barbecue','6 Fromages','Pita','Océane','Royale','Parme',
         'Roi Soleil','Felece','Cannibale','Burrata','Rim','Choupette']

def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python tools/prepare-recovered-images.py <original gallery directory>')
    source = Path(sys.argv[1]).resolve(strict=True)
    menu = json.loads((ROOT/'menu.json').read_text(encoding='utf-8'))
    matches = {row['name']: row for row in menu['items'] if row['category']=='pizzas'}
    proof = []
    for number, name in enumerate(NAMES, 2):
        original = source/f'photo-{number:02d}.jpg'
        key = f'recovered-{number:02d}'
        row = matches[name]
        if row.get('image') not in (None, key):
            raise ValueError('An existing illustration would be replaced: '+name)
        with Image.open(original) as opened:
            image = ImageOps.exif_transpose(opened).convert('RGB')
            width, height = image.size
            exports = []
            for size in (640, 1280):
                result = image.copy()
                result.thumbnail((size, round(size*height/width)), Image.Resampling.LANCZOS)
                target = ROOT/'images'/f'{key}-{size}.webp'
                result.save(target, 'WEBP', quality=85, method=6)
                exports.append({'file':target.name,'bytes':target.stat().st_size,
                                'width':result.width,'height':result.height,
                                'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
        row.update(image=key,imageWidth=width,imageHeight=height)
        proof.append({'recipe':name,'itemId':row['id'],'source':original.name,
                      'sourceSha256':hashlib.sha256(original.read_bytes()).hexdigest(),
                      'basis':'User site-menu sequence + visual topping review; merchant confirmation pending',
                      'exports':exports})
    (ROOT/'menu.json').write_text(json.dumps(menu,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'images/recovered-provenance.json').write_text(json.dumps({
        'checkedAt':'2026-11-11','kind':'Recovered user illustrations, technical encoding only',
        'merchantValidated':False,'excluded':{'photo-01.png':'Bianca illustration already present'},
        'unmatchedRecipes':['Raclette'],'items':proof},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'newRecipes':len(proof),'exports':sum(len(p['exports']) for p in proof),
                      'bytes':sum(e['bytes'] for p in proof for e in p['exports'])}))

if __name__ == '__main__':
    main()
