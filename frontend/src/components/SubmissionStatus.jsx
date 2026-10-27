import React from 'react';
import {t} from '../lib/locale';
import {Badge} from './ui';
export default function SubmissionStatus({submission:s}){
 const running=s.status==='RUNNING',pending=running||s.status==='QUEUED';
 return <Badge tone={s.status==='AC'?'success':pending?'':'danger'}>{running?s.current_test>0?`${t('Đang chấm test')} ${s.current_test}/${s.total_tests}`:t('Đang chuẩn bị chấm'):s.status}</Badge>;
}
