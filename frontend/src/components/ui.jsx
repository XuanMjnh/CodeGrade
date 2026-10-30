import PageBanner from './PageBanner';
import {t as trUI,locale} from '../lib/locale';
import React,{useState,useEffect,useId} from 'react';
import {live} from '../lib/live';
import {formatCountdown} from '../lib/time';
export function Help({text}){const [show,set]=useState(false),id=useId();return <span className="help" onKeyDown={e=>{if(e.key==='Escape'){set(false);e.stopPropagation();}}}><button type="button" aria-label={trUI("Trợ giúp: ")+text} aria-expanded={show} aria-controls={id} aria-describedby={show?id:undefined} onClick={()=>set(!show)} onBlur={()=>set(false)}>?</button>{show&&<span id={id} role="tooltip">{text}</span>}</span>;}
export function Field({label,help,children}){const id=useId();return <div className="field"><div className="field-label"><label id={id+'-label'} htmlFor={id}>{label}</label>{help&&<Help text={help}/>}</div><div>{React.isValidElement(children)&&['input','select','textarea'].includes(children.type)?React.cloneElement(children,{id,'aria-labelledby':id+'-label'}):children}</div></div>;}
export function Section({title,open=false,children}){return <details open={open} className="section"><summary>{title}</summary><div className="section-body">{children}</div></details>;}
export function Check({label,checked,onChange,disabled=false,tone=''}){return <label className={'check '+tone}><input type="checkbox" checked={!!checked} disabled={disabled} onChange={e=>onChange(e.target.checked)}/>{label}</label>;}
export function Badge({children,tone=''}){return <span className={'badge '+tone}>{children}</span>;}
export function ErrorBox({error}){return error&&<div role="alert" className="alert danger">{locale==='en'&&/[À-ỹ]/.test(trUI(error.message||String(error)))?'Please check the request and try again.':trUI(error.message||String(error))}</div>;}
export function Heading({eyebrow='',title,children,action,kind,highlight}){const section=kind||(eyebrow.includes('WORKSPACE')?'workspace':eyebrow.includes('QUESTION BANK / CATEGORY')?'categories':eyebrow.includes('QUESTION BANK')?'editor':eyebrow.includes('CODE SURVIVAL')||eyebrow.includes('MULTIPLAYER')?'survival':eyebrow.includes('CONTEST')?'contest':eyebrow.includes('RANKINGS')?'leaderboard':eyebrow.includes('JUDGE')?'submissions':eyebrow.includes('ADMINISTRATION')?'admin':'practice');return <PageBanner kind={section} title={title} action={action} highlight={highlight}>{children}</PageBanner>;}
export function useResource(type,payload={},revision=0){
 const key=JSON.stringify(payload);const [data,setData]=useState(null),[error,setError]=useState(null);
 useEffect(()=>{if(!type)return;let cancelled=false;setError(null);live.call(type,JSON.parse(key)).then(d=>{if(!cancelled)setData(d);}).catch(e=>{if(!cancelled)setError(e);});return()=>{cancelled=true;};},[type,key,revision]);
 return [data,error,setData];
}
export const go=(path)=>{location.hash=path;};
export function TimeLeft({deadline,withHours=false}){
 const [now,set]=useState(Date.now()+live.offset);
 useEffect(()=>{const t=setInterval(()=>set(Date.now()+live.offset),250);return()=>clearInterval(t);},[]);
 const sec=Math.max(0,Math.ceil((deadline-now)/1000));
 return <span className={'timer '+(sec<15?'urgent':'')}>{formatCountdown(deadline,now,withHours)}</span>;
}
export function Loading(){return <p className="loading muted" role="status" aria-live="polite">Đang tải dữ liệu…</p>;}
