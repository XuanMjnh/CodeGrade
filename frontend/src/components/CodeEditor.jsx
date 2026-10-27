import React,{useEffect,useRef,useMemo} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {cpp} from '@codemirror/lang-cpp';
import {python} from '@codemirror/lang-python';
import {HighlightStyle,syntaxHighlighting} from '@codemirror/language';
import {tags} from '@lezer/highlight';
import {EditorView} from '@codemirror/view';
const theme=EditorView.theme({
 '&':{backgroundColor:'var(--color-surface-code)',color:'var(--color-editor-ink)',fontSize:'14px'},
 '.cm-content':{fontFamily:'inherit',padding:'16px 0',minHeight:'420px'},
 '.cm-gutters':{backgroundColor:'var(--color-surface-code)',color:'var(--color-editor-gutter)',border:'none'},
 '.cm-activeLine,.cm-activeLineGutter':{backgroundColor:'var(--color-editor-active)'},
 '.cm-cursor':{borderLeftColor:'var(--color-accent)'},
 '&.cm-focused .cm-selectionBackground,.cm-selectionBackground':{backgroundColor:'var(--color-editor-selection)'},
 '.cm-scroller':{overflow:'auto',fontFamily:'var(--font-family-code)',lineHeight:'1.65',fontVariantLigatures:'none',fontFeatureSettings:'"liga" 0, "calt" 0',letterSpacing:'0'},
 '&.cm-focused':{outline:'2px solid var(--color-editor-focus)',outlineOffset:'-2px'}
},{dark:false});
const highlighting=syntaxHighlighting(HighlightStyle.define([{tag:tags.keyword,color:'var(--syntax-keyword)'},{tag:tags.string,color:'var(--syntax-string)'},{tag:tags.comment,color:'var(--syntax-comment)'},{tag:[tags.number,tags.typeName],color:'var(--syntax-number)'},{tag:tags.function(tags.variableName),color:'var(--syntax-function)'}]));
const basicSetup={lineNumbers:true,foldGutter:true,highlightActiveLine:true,autocompletion:true};
export default function CodeEditor({value,onChange,language}){
 const view=useRef(null);
 const extensions=useMemo(()=>[highlighting,language==='PY311'?python():cpp()],[language]);
 useEffect(()=>{
  let active=true;
  const measure=()=>{if(active)view.current?.requestMeasure();};
  document.fonts?.ready.then(measure);
  document.fonts?.addEventListener('loadingdone',measure);
  return()=>{active=false;document.fonts?.removeEventListener('loadingdone',measure);};
 },[]);
 return <CodeMirror value={value} onChange={onChange} onCreateEditor={editor=>{view.current=editor;editor.requestMeasure();}} height="460px" theme={theme} extensions={extensions} indentWithTab={false} basicSetup={basicSetup} aria-label="Source code"/>;
}
