import fs from 'node:fs';
import path from 'node:path';
import type { Browser } from 'playwright';
export async function rigidModelsCheck(browser: Browser): Promise<string> {
  const ctx=await browser.newContext({viewport:{width:480,height:480}}),page=await ctx.newPage();
  const fixture=fs.readFileSync(new URL('./fixtures/r86-guide-models.txt',import.meta.url),'utf8');
  const out=path.resolve('../docs/r87/evidence/guides');fs.mkdirSync(out,{recursive:true});
  await page.route('**/r87-model-fixture.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><style>body{margin:0}</style>'}));
  try {
    await page.goto(new URL('/r87-model-fixture.html',process.env.SV_URL||'http://localhost:8765/').href);
    const result=await page.evaluate(async fixture=>{
      const {THREE,toon,blobShadow}=await import('../js/gfx.js'),current=await import('../js/avatar.js');
      const old=new Function('THREE','toon','blobShadow',fixture+';return {buildOwl,buildGourd};')(THREE,toon,blobShadow);
      const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(480,480);renderer.setPixelRatio(1);document.body.appendChild(renderer.domElement);
      const scene=new THREE.Scene();scene.background=new THREE.Color('#bde7ff');scene.add(new THREE.HemisphereLight(0xffffff,0x73533b,2));
      const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(4,6,5);scene.add(sun);
      const cam=new THREE.PerspectiveCamera(38,1,.1,100);cam.position.set(4,3.1,6);cam.lookAt(0,1.35,0);
      const data=(root:import('../vendor/three.module.js').Group)=>{
        root.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),v=new THREE.Vector3(),n=new THREE.Vector3(),values:number[]=[];let pieces=0;
        root.traverse(o=>{if(!(o instanceof THREE.Mesh)||!(o.material instanceof THREE.MeshToonMaterial))return;pieces++;
          const g=o.geometry,P=g.getAttribute('position'),N=g.getAttribute('normal'),C=g.getAttribute('color'),matrix=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld),normal=new THREE.Matrix3().getNormalMatrix(matrix);
          for(let k=0;k<(g.index?.count||P.count);k++){const i=g.index?g.index.getX(k):k;v.fromBufferAttribute(P,i).applyMatrix4(matrix);n.fromBufferAttribute(N,i).applyMatrix3(normal).normalize();
            values.push(Math.fround(v.x),Math.fround(v.y),Math.fround(v.z),Math.fround(n.x),Math.fround(n.y),Math.fround(n.z),...(o.material.vertexColors?[C.getX(i),C.getY(i),C.getZ(i)]:[Math.fround(o.material.color.r),Math.fround(o.material.color.g),Math.fround(o.material.color.b)]));}
        });return {pieces,values};
      };
      const rows:{kind:string;oldPieces:number;newPieces:number;triangles:number;maxError:number;before:string;after:string}[]=[];
      for(const [kind,name] of [['owl','buildOwl'],['gourd','buildGourd']] as const){
        const before:import('../vendor/three.module.js').Group=old[name](),after=current[name](),a=data(before),b=data(after);
        if(a.values.length!==b.values.length)throw Error(kind+': triangle count changed');
        let maxError=0;for(let i=0;i<a.values.length;i++)maxError=Math.max(maxError,Math.abs(a.values[i]-b.values[i]));
        if(maxError>1e-6||b.pieces!==1)throw Error(kind+': rigid model geometry/colour changed '+JSON.stringify({maxError,pieces:b.pieces}));
        const shadow=after.children[after.children.length-1];
        if(!(shadow instanceof THREE.Mesh)||Array.isArray(shadow.material)||!shadow.material.transparent)throw Error(kind+': film shadow must remain last');
        scene.add(before);renderer.render(scene,cam);const beforePNG=renderer.domElement.toDataURL();scene.remove(before);
        scene.add(after);renderer.render(scene,cam);const afterPNG=renderer.domElement.toDataURL();scene.remove(after);
        rows.push({kind,oldPieces:a.pieces,newPieces:b.pieces,triangles:a.values.length/27,maxError,before:beforePNG,after:afterPNG});
      }
      renderer.dispose();return rows;
    },fixture);
    for(const row of result){for(const when of ['before','after'] as const)fs.writeFileSync(path.join(out,`${row.kind}-${when}.png`),Buffer.from(row[when].split(',')[1],'base64'));}
    const summary=result.map(({before,after,...rest})=>rest);fs.writeFileSync(path.join(out,'geometry.json'),JSON.stringify(summary,null,2)+'\n');
    return JSON.stringify(summary);
  } finally {await ctx.close();}
}
