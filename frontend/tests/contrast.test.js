import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/styles/tokens.css',import.meta.url),'utf8');
const variables=source=>Object.fromEntries([...source.matchAll(/--([\w-]+):\s*([^;\n}]+)/g)].map(m=>[m[1],m[2].trim()]));
const tokens=variables(css);
function resolved(name,scope=tokens){
 const key=/^(color-|syntax-)/.test(name)?name:'color-'+name;
 const seen=new Set();let current=key,value=scope[current];
 while(value?.startsWith('var(')){
  assert.ok(!seen.has(current),`Circular CSS variable: ${current}`);seen.add(current);
  const alias=/^var\(--([\w-]+)\)$/.exec(value);assert.ok(alias,`Unsupported CSS color: ${value}`);
  current=alias[1];value=scope[current];
 }
 assert.match(value||'',/^#[a-f\d]{6}$/i,`Missing or invalid color: ${key}`);
 return value;
}
function luminance(hex){return hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);}
function contrast(a,b,scope=tokens){const x=luminance(resolved(a,scope)),y=luminance(resolved(b,scope));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
for(const [fg,bg,min] of [['text-primary','surface-base',4.5],['text-secondary','surface-base',4.5],['text-secondary','surface-muted',4.5],['text-tertiary','surface-base',4.5],['text-on-accent','accent',4.5],['text-on-accent','accent-hover',4.5],['text-on-accent','accent-active',4.5],['accent-text','accent-soft',4.5],['success','success-soft',4.5],['danger','danger-soft',4.5],['warning','warning-soft',4.5],['disabled-text','disabled-surface',4.5],['editor-ink','surface-code',4.5],['code-muted','surface-code',4.5],['focus','surface-base',3],['border-strong','surface-base',3]]){
 test(`${fg} on ${bg} contrast ≥ ${min}:1`,()=>assert.ok(contrast(fg,bg)>=min,contrast(fg,bg).toFixed(2)));
}

for(let n=1;n<=6;n++) test(`Difficulty ${n} contrast ≥ 4.5:1`,()=>assert.ok(contrast(`level-${n}`,`level-${n}-soft`)>=4.5));
for(const fg of ['editor-gutter','syntax-keyword','syntax-string','syntax-comment','syntax-number','syntax-function']) test(`${fg} on light editor ≥ 4.5:1`,()=>assert.ok(contrast(fg,'surface-code')>=4.5));
for(const bg of ['banner-surface','banner-warm','banner-panel']) for(const fg of ['banner-ink','banner-muted']) test(`${fg} on ${bg} ≥ 4.5:1`,()=>assert.ok(contrast(fg,bg)>=4.5));

for(const bg of ['surface-base','secondary-soft']) test(`Secondary action text on ${bg} ≥ 4.5:1`,()=>assert.ok(contrast('secondary-ink',bg)>=4.5));

// Survival shares the light palette; inverse panels use the common inverse tokens.
for(const fg of ['inverse-ink','inverse-muted'])test(`${fg} on surface-inverse ≥ 4.5:1`,()=>assert.ok(contrast(fg,'surface-inverse')>=4.5));

// Resolve the actual scoped overrides used by CodeMirror and arena controls.
const arenaCss=readFileSync(new URL('../src/styles/arena.css',import.meta.url),'utf8');
const scoped={...tokens,...variables(arenaCss)};
for(const [fg,bg,min] of [
 ['color-text-primary','color-surface-base',4.5],['color-text-secondary','color-surface-hover',4.5],
 ['color-text-on-accent','color-accent',4.5],['color-secondary-ink','color-secondary-soft',4.5],
 ['color-success','color-success-soft',4.5],['color-warning','color-warning-soft',4.5],['color-danger','color-danger-soft',4.5],
 ['color-disabled-text','color-disabled-surface',4.5],['color-focus','color-surface-base',3],['color-border-strong','color-surface-base',3],
 ...['color-editor-ink','color-editor-gutter','color-code-muted','syntax-keyword','syntax-string','syntax-comment','syntax-number','syntax-function'].map(k=>[k,'color-surface-code',4.5])
])test(`Scoped arena ${fg} on ${bg} ≥ ${min}:1`,()=>{const ratio=contrast(fg,bg,scoped);assert.ok(ratio>=min,ratio.toFixed(2));});
