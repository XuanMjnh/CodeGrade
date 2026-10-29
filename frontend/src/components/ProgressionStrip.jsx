import React from 'react';
import {Badge} from './ui';

export default function ProgressionStrip({stats,user}){
 if(!stats)return null;
 return <section className="progression-strip paper" aria-label="Tiến trình học tập"><div className="progression-identity"><span className={'avatar avatar-frame-'+stats.avatarFrame} aria-hidden="true">{user.displayName?.slice(0,1)}</span><div><b data-user-content>{user.displayName}</b><small>LEVEL {stats.level} · {stats.avatarFrame}</small></div></div><div className="exp-meter"><div className="inline between"><b>{stats.exp} EXP</b><small>Mốc tiếp theo: {stats.nextLevelExp}</small></div><progress aria-label="EXP đến cấp tiếp theo" value={stats.exp-100*(stats.level-1)**2} max={stats.nextLevelExp-100*(stats.level-1)**2}/></div><div className="progression-rank"><small>SURVIVAL RANKED</small><strong>{stats.rank}</strong><span>{stats.rating} rating</span></div><div className="progression-badges">{stats.badges.length?stats.badges.map(b=><Badge key={b}>{b}</Badge>):<small>Huy hiệu xuất hiện khi đạt cột mốc.</small>}</div></section>;
}
