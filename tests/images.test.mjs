import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),read=name=>JSON.parse(fs.readFileSync(new URL(name,root)));
test('recovered illustrations are published with provenance, never substituted for unmatched recipes',()=>{
 const menu=read('menu.json'),proof=read('images/recovered-provenance.json'),build=read('dist/build.json');
 assert.equal(proof.items.length,46);
 assert.equal(menu.items.find(x=>x.name==='Bianca').image,'bianca');
 assert.equal(menu.items.find(x=>x.name==='Raclette').image,undefined);
 for(const row of proof.items){
  const item=menu.items.find(x=>x.id===row.itemId);assert.equal(item.name,row.recipe);
  assert.ok(item.imageWidth>0&&item.imageHeight>0);
  for(const size of [640,1280]){
   const file=`images/${item.image}-${size}.webp`,bytes=fs.readFileSync(new URL('dist/'+file,root));
   assert.equal(createHash('sha256').update(bytes).digest('hex'),build.files[file]);
   assert.equal(bytes.subarray(8,12).toString(),'WEBP');
   assert.ok(proof.items.flatMap(x=>x.exports).some(x=>x.file===file.slice(7)));
  }
 }
 assert.ok(!build.files['images/recovered-provenance.json']);
});
