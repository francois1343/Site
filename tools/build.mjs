import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const menu = JSON.parse(fs.readFileSync(path.join(root,'menu.json'),'utf8'));
const imageNames = [...new Set(menu.items.filter(item=>item.image).map(item=>item.image))];
if (imageNames.some(name=>typeof name!=='string'||!/^[a-z0-9-]+$/.test(name))) throw Error('Nom de visuel interdit');
const files = [
  'index.html','style.css','atelier.css','script.js','cart.mjs','menu.json','pwa.js',
  'manifest.webmanifest','images/mark.svg',
  ...['favicon.ico','favicon-16x16.png','favicon-32x32.png','apple-touch-icon.png',
    'pwa-192x192.png','pwa-512x512.png','maskable-192x192.png','maskable-512x512.png'].map(n=>'icons/'+n),
  ...imageNames.flatMap(n=>[640,1280].map(s=>'images/'+n+'-'+s+'.webp'))
];
for (const f of [...files, 'sw.js']) {
  const file=path.join(root,f);
  if (!fs.existsSync(file) || fs.lstatSync(file).isSymbolicLink() || !fs.statSync(file).isFile()) throw Error('Asset absent ou lien refusé : '+f);
}
if (fs.existsSync(out)) {
  for (const e of fs.readdirSync(out,{recursive:true,withFileTypes:true})) {
    const rel=path.relative(out,path.join(e.parentPath,e.name)).replaceAll('\\','/');
    if (e.isSymbolicLink() || e.isFile()&&!files.includes(rel)&&!['build.json','sw.js'].includes(rel)) throw Error('Sortie inattendue : '+rel);
  }
}
const sha = data => createHash('sha256').update(data).digest('hex');
const hashes = {};
for (const f of files) {
  const dest=path.join(out,f);fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(path.join(root,f),dest);hashes[f]=sha(fs.readFileSync(dest));
}
const template = fs.readFileSync(path.join(root,'sw.js'),'utf8');
const version = sha(JSON.stringify(hashes)+template).slice(0,16);
const sw = template.replace('__BUILD_VERSION__',version).replace('__PRECACHE_FILES__',JSON.stringify(files));
fs.writeFileSync(path.join(out,'sw.js'),sw);hashes['sw.js']=sha(sw);
fs.writeFileSync(path.join(out,'build.json'),JSON.stringify({schema:1,version,files:hashes},null,2)+'\n');
console.log(JSON.stringify({files:files.length+1,items:JSON.parse(fs.readFileSync(path.join(out,'menu.json'),'utf8')).items.length,version,output:'dist',customerDataIncluded:false}));
