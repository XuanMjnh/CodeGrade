import React from 'react';
import {t as trUI} from '../lib/locale';
import {useResource,ErrorBox,Loading} from './ui';
import SubmissionStatus from './SubmissionStatus';
export default function Result({id,revision}){
 const [data,error]=useResource('SUBMISSION_GET',{id},revision);
 return <div className="result"><ErrorBox error={error}/>{!data?<Loading/>:<><div className="inline"><SubmissionStatus submission={data}/><b>{data.score}/100</b><span className="muted">{data.mode}</span></div>{data.status==='RUNNING'&&data.total_tests>0&&<div className="judge-progress" role="status" aria-live="polite"><progress aria-label={trUI('Tiến độ chấm bài')} value={data.completed_tests} max={data.total_tests}/><span>{data.completed_tests}/{data.total_tests} {trUI('test đã chấm')}</span></div>}{data.result?.diagnostic&&<pre>{data.result.diagnostic}</pre>}{data.result?.cases&&<div className="table-wrap" role="region" aria-label={trUI("Bảng dữ liệu")} tabIndex={0}><table><thead><tr><th>Test</th><th>Kết quả</th><th>Thời gian</th><th>Output</th></tr></thead><tbody>{data.result.cases.map(t=><tr key={t.index}><td>#{t.index}</td><td>{t.hidden?trUI("Ẩn theo chính sách"):t.verdict}</td><td>{t.hidden?'—':Math.round(t.timeMs)+' ms'}</td><td><pre>{t.hidden?'—':t.stdout}</pre></td></tr>)}</tbody></table></div>}</>}</div>;
}
