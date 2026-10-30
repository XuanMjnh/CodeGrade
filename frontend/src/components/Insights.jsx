import React,{useEffect,useState} from 'react';
import {t} from '../lib/locale';
import {live} from '../lib/live';
export function useNow(){const [now,N]=useState(Date.now()+live.offset);useEffect(()=>{const id=setInterval(()=>N(Date.now()+live.offset),1000);return()=>clearInterval(id);},[]);return now;}
export function StatGrid({items,label='Tổng quan',className=''}){
  return (
    <section className={'stat-grid '+(className||'')} aria-label={t(label)}>
      {items.map(({label,value,note,tone,icon,badge,onClick,active},i)=>(
        <div
          className={'stat-card '+(tone||'')+(active?' is-active':'')+(onClick?' is-clickable':'')}
          key={i}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          aria-pressed={onClick ? !!active : undefined}
          onKeyDown={
            onClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                  }
                }
              : undefined
          }
        >
          <div className="stat-card-head">
            {icon && <span className="stat-card-icon" aria-hidden="true">{icon}</span>}
            <span className="stat-card-label">{t(label)}</span>
            {badge && <span className="stat-card-badge">{badge}</span>}
          </div>
          <strong className="stat-card-value">{value??'—'}</strong>
          {note&&<small className="stat-card-note">{t(note)}</small>}
        </div>
      ))}
    </section>
  );
}
export function InsightPanel({title,action,children,className=''}){return <section className={'paper insight-panel '+className}><div className="insight-panel-head"><h2>{t(title)}</h2>{action}</div>{children}</section>;}
export function ProgressRows({items,empty='Chưa có dữ liệu.'}){return !items.length?<p className="muted">{t(empty)}</p>:<div className="progress-rows">{items.map((c,i)=><div key={c.id||i} className={'progress-row-item' + (c.onClick ? ' is-clickable' : '')} onClick={c.onClick} role={c.onClick ? 'button' : undefined} tabIndex={c.onClick ? 0 : undefined} onKeyDown={c.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.onClick(); } } : undefined}><div className="inline between"><span data-user-content>{c.name}</span><small>{c.value} / {c.total}</small></div><progress aria-label={c.name} data-verdict={c.name} value={c.value} max={Math.max(1,c.total)}/></div>)}</div>;}
export function ProblemPicks({items}){return <ol className="problem-picks">{items.map((p,i)=><li key={p.id}><span className="pick-number">{String(i+1).padStart(2,'0')}</span><div><a href={'#/solve/'+p.id} data-user-content>{p.title}</a><small data-user-content>{p.publicId} · {p.category}</small></div><span className={'badge level-'+p.difficulty}>{t('Mức')} {p.difficulty}</span></li>)}</ol>;}
