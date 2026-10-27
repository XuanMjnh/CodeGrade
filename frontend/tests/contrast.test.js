import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/styles/tokens.css',import.meta.url),'utf8');
const tokens=Object.fromEntries([...css.matchAll(/--((?:color-|syntax-)[\w-]+):\s*(#[a-fA-F0-9]{6})/g)].map(m=>[m[1],m[2]]));
function luminance(hex){return hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const x=luminance(tokens[a.startsWith('syntax-')?a:'color-'+a]),y=luminance(tokens['color-'+b]);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
for(const [fg,bg,min] of [['text-primary','surface-base',4.5],['text-secondary','surface-base',4.5],['text-secondary','surface-muted',4.5],['text-tertiary','surface-base',4.5],['text-on-accent','accent',4.5],['text-on-accent','accent-hover',4.5],['text-on-accent','accent-active',4.5],['accent-text','accent-soft',4.5],['success','success-soft',4.5],['danger','danger-soft',4.5],['warning','warning-soft',4.5],['disabled-text','disabled-surface',4.5],['editor-ink','surface-code',4.5],['code-muted','surface-code',4.5],['focus','surface-base',3],['border-strong','surface-base',3]]){
 test(`${fg} on ${bg} contrast ≥ ${min}:1`,()=>assert.ok(contrast(fg,bg)>=min,contrast(fg,bg).toFixed(2)));
}

for(let n=1;n<=6;n++) test(`Difficulty ${n} contrast ≥ 4.5:1`,()=>assert.ok(contrast(`level-${n}`,`level-${n}-soft`)>=4.5));
for(const fg of ['editor-gutter','syntax-keyword','syntax-string','syntax-comment','syntax-number','syntax-function']) test(`${fg} on light editor ≥ 4.5:1`,()=>assert.ok(contrast(fg,'surface-code')>=4.5));
for(const bg of ['banner-surface','banner-warm','banner-panel']) for(const fg of ['banner-ink','banner-muted']) test(`${fg} on ${bg} ≥ 4.5:1`,()=>assert.ok(contrast(fg,bg)>=4.5));

for(const bg of ['surface-base','secondary-soft']) test(`Secondary action text on ${bg} ≥ 4.5:1`,()=>assert.ok(contrast('secondary-ink',bg)>=4.5));
