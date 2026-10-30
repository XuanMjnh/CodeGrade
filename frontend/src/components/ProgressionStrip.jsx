import React from 'react';
import {Badge} from './ui';
import {t} from '../lib/locale';
import RankEmblem,{RANK_TIERS,getRankTier} from './RankEmblem';

function ratingRange(item){
 if(item.minRating==null&&typeof item.maxRating==='number')return <>{t('Dưới')} {item.maxRating+1} rating</>;
 if(typeof item.minRating==='number'&&item.maxRating==null)return <>{t('Từ')} {item.minRating} rating</>;
 if(typeof item.minRating==='number'&&typeof item.maxRating==='number')return <>{item.minRating}–{item.maxRating} rating</>;
 return '—';
}

export default function ProgressionStrip({stats,user,showRankGuide=false}){
 if(!stats)return null;
 const tier=getRankTier(stats.rank);
 const guide=stats.rankTiers||RANK_TIERS;
 const rankStart=stats.rankMinRating??0;
 const rankSpan=stats.nextRankRating-rankStart;
 return <section className="progression-strip paper" aria-label={t('Tiến trình học tập')}>
  <div className="progression-identity"><span className={'avatar avatar-frame-'+stats.avatarFrame} aria-hidden="true">{user.displayName?.slice(0,1)}</span><div><b data-user-content>{user.displayName}</b><small>LEVEL {stats.level} · Code Survival</small></div></div>
  <div className="exp-meter"><div className="inline between"><b>{stats.exp} EXP</b><small>Mốc tiếp theo: {stats.nextLevelExp}</small></div><progress aria-label="EXP đến cấp tiếp theo" value={stats.exp-100*(stats.level-1)**2} max={stats.nextLevelExp-100*(stats.level-1)**2}/></div>
  <div className="progression-rank" data-rank={tier.id} style={{'--rank-color':tier.color,'--rank-soft':tier.soft}}>
   <RankEmblem rank={stats.rank} decorative/>
   <div className="progression-rank-copy"><small>SURVIVAL RANKED</small><strong>{stats.rank}</strong><span>{stats.rating} rating</span>
    {stats.nextRank?<div className="rank-next-target"><p>{t('Còn thiếu')} <b>{stats.ratingToNextRank}</b> {t('rating để lên')} <b>{stats.nextRank}</b></p><small>{t('Mốc thăng hạng')}: {stats.nextRankRating} rating</small>{rankSpan>0&&<progress aria-label={t('Rating đến rank tiếp theo')} value={Math.max(0,Math.min(rankSpan,stats.rating-rankStart))} max={rankSpan}/>}</div>:stats.nextRank===null&&<p className="rank-highest">{t('Bạn đã đạt rank cao nhất.')}</p>}
    {stats.ratingGainMultiplier>1&&<small className="rank-gain-support">{t('Hỗ trợ điểm tăng')} ×{stats.ratingGainMultiplier}</small>}
   </div>
  </div>
  <div className="progression-badges">{stats.badges.length?stats.badges.map(b=><Badge key={b}>{b}</Badge>):<small>Huy hiệu xuất hiện khi đạt cột mốc.</small>}</div>
  {showRankGuide&&<details className="progression-rank-guide" open>
   <summary><i className="fa-solid fa-medal" aria-hidden="true"/>{t('Các bậc Rank')}<i className="fa-solid fa-chevron-down" aria-hidden="true"/></summary>
   <ol>{guide.map(item=>{
    const visual=getRankTier(item.name),current=visual.id===tier.id;
    return <li key={visual.id} className={current?'is-current':''} aria-current={current?'step':undefined} style={{'--rank-color':visual.color,'--rank-soft':visual.soft}}>
     <RankEmblem rank={item.name} decorative/><b>{item.name}</b><span className="rank-rating-range">{ratingRange(item)}</span>
     {item.gainMultiplier>1?<span className="rank-gain-badge">×{item.gainMultiplier} {t('điểm tăng')}</span>:item.gainMultiplier===1&&<small>{t('Điểm tăng tiêu chuẩn')}</small>}
     {current&&<small>{t('Rank của bạn')}</small>}
    </li>;
   })}</ol>
   {stats.rankTiers&&<p className="rank-policy-note">{t('Hệ số chỉ áp dụng cho phần rating tăng, theo rank đầu trận. Điểm trừ không nhân hệ số. Chỉ Đấu Rank thay đổi rating.')}</p>}
  </details>}
 </section>;
}
