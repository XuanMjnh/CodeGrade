import React from 'react';
import {t} from '../lib/locale';
import {useResource,ErrorBox,Loading} from './ui';
import {languageNames} from '../lib/coderunner';
export default function ProblemRanking({problemId,userId,revision}){
 const [rows,error]=useResource('PROBLEM_RANKING',{problemId},revision);
 return <section className="paper pad problem-ranking"><h2>{t('Xếp hạng bài nộp')}</h2><p className="muted">{t('Mỗi Coder lấy một bài AC tốt nhất. Ưu tiên tổng thời gian chạy các test, độ dài mã nguồn, rồi thời điểm nộp. Hiển thị tối đa 200 Coder.')}</p><ErrorBox error={error}/>
  {!rows?<Loading/>:rows.length?<div className="table-wrap" role="region" tabIndex={0} aria-label={t('Xếp hạng bài nộp')}><table><thead><tr><th>{t('Hạng')}</th><th>Coder</th><th>{t('Ngôn ngữ')}</th><th>{t('Thời gian chạy')}</th><th>{t('Độ dài mã')}</th></tr></thead><tbody>{rows.map(r=><tr key={r.userId} className={r.userId===userId?'my-rank':''}><td>{r.rank}</td><td><b data-user-content>{r.name}</b><small data-user-content>@{r.username}</small></td><td>{languageNames[r.language]}</td><td>{Number(r.timeMs.toFixed(3))} ms</td><td>{r.sourceLength} {t('ký tự')}</td></tr>)}</tbody></table></div>:<p className="muted">{t('Chưa có bài AC để xếp hạng.')}</p>}
 </section>;
}
