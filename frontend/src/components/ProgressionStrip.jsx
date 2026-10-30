import React from 'react';
import {Badge} from './ui';
import RankEmblem,{RANK_TIERS,getRankTier} from './RankEmblem';

export default function ProgressionStrip({stats,user,showRankGuide=false}){
 if(!stats)return null;
 const tier=getRankTier(stats.rank);
 return <section className="progression-strip paper" aria-label="Tiến trình học tập">
  <div className="progression-identity"><span className={'avatar avatar-frame-'+stats.avatarFrame} aria-hidden="true">{user.displayName?.slice(0,1)}</span><div><b data-user-content>{user.displayName}</b><small>LEVEL {stats.level} · Code Survival</small></div></div>
  <div className="exp-meter"><div className="inline between"><b>{stats.exp} EXP</b><small>Mốc tiếp theo: {stats.nextLevelExp}</small></div><progress aria-label="EXP đến cấp tiếp theo" value={stats.exp-100*(stats.level-1)**2} max={stats.nextLevelExp-100*(stats.level-1)**2}/></div>
  <div className="progression-rank" data-rank={tier.id} style={{'--rank-color':tier.color,'--rank-soft':tier.soft}}><RankEmblem rank={stats.rank} decorative/><div className="progression-rank-copy"><small>SURVIVAL RANKED</small><strong>{stats.rank}</strong><span>{stats.rating} rating</span></div></div>
  <div className="progression-badges">{stats.badges.length?stats.badges.map(b=><Badge key={b}>{b}</Badge>):<small>Huy hiệu xuất hiện khi đạt cột mốc.</small>}</div>
  {showRankGuide&&<details className="progression-rank-guide" open><summary><i className="fa-solid fa-medal" aria-hidden="true"/>Các bậc Rank<i className="fa-solid fa-chevron-down" aria-hidden="true"/></summary><ol>{RANK_TIERS.map(item=><li key={item.id} className={item.id===tier.id?'is-current':''} aria-current={item.id===tier.id?'step':undefined} style={{'--rank-color':item.color,'--rank-soft':item.soft}}><RankEmblem rank={item.name} decorative/><b>{item.name}</b>{item.id===tier.id&&<small>Rank của bạn</small>}</li>)}</ol></details>}
 </section>;
}
