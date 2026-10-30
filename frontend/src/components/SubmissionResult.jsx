import ProgressMeter from './ProgressMeter';
import { DataTable as UiTable } from './DataTable';
import {
  TableBody as UiTableBody,
  TableCell as UiTableCell,
  TableHead as UiTableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from './ui/table';
import React from 'react';
import { t as trUI } from '../lib/locale';
import { useResource, ErrorBox, Loading } from './ui';
import SubmissionStatus from './SubmissionStatus';
export default function Result({ id, revision }) {
  const [data, error] = useResource(
    'SUBMISSION_GET',
    {
      id,
    },
    revision,
  );
  return (
    <div className="result space-y-4 rounded-[14px] border bg-card p-5">
      <ErrorBox error={error} />
      {!data ? (
        <Loading />
      ) : (
        <>
          <div className="inline-group flex flex-wrap items-center gap-2">
            <SubmissionStatus submission={data} />
            <b>{data.score}/100</b>
            <span className="muted text-sm leading-relaxed text-muted-foreground">{data.mode}</span>
          </div>
          {data.status === 'RUNNING' && data.total_tests > 0 && (
            <div
              className="judge-progress flex items-center gap-2 text-xs font-medium text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <ProgressMeter
                aria-label={trUI('Tiến độ chấm bài')}
                value={data.completed_tests}
                max={data.total_tests}
              />
              <span>
                {data.completed_tests}/{data.total_tests} {trUI('test đã chấm')}
              </span>
            </div>
          )}
          {data.result?.diagnostic && <pre>{data.result.diagnostic}</pre>}
          {data.result?.cases && (
            <div
              className="table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
              role="region"
              aria-label={trUI('Bảng dữ liệu')}
              tabIndex={0}
            >
              <UiTable>
                <UiTableHeader>
                  <UiTableRow>
                    <UiTableHead>Test</UiTableHead>
                    <UiTableHead>Kết quả</UiTableHead>
                    <UiTableHead>Thời gian</UiTableHead>
                    <UiTableHead>Output</UiTableHead>
                  </UiTableRow>
                </UiTableHeader>
                <UiTableBody>
                  {data.result.cases.map((t) => (
                    <UiTableRow key={t.index}>
                      <UiTableCell>#{t.index}</UiTableCell>
                      <UiTableCell>{t.hidden ? trUI('Ẩn theo chính sách') : t.verdict}</UiTableCell>
                      <UiTableCell>{t.hidden ? '—' : Math.round(t.timeMs) + ' ms'}</UiTableCell>
                      <UiTableCell>
                        <pre>{t.hidden ? '—' : t.stdout}</pre>
                      </UiTableCell>
                    </UiTableRow>
                  ))}
                </UiTableBody>
              </UiTable>
            </div>
          )}
        </>
      )}
    </div>
  );
}
