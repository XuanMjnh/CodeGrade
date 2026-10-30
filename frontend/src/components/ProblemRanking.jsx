import { DataTable as UiTable } from './DataTable';
import {
  TableBody as UiTableBody,
  TableCell as UiTableCell,
  TableHead as UiTableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from './ui/table';
import React from 'react';
import { t } from '../lib/locale';
import { useResource, ErrorBox, Loading } from './ui';
import { languageNames } from '../lib/coderunner';
export default function ProblemRanking({ problemId, userId, revision }) {
  const [rows, error] = useResource(
    'PROBLEM_RANKING',
    {
      problemId,
    },
    revision,
  );
  return (
    <section className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6 problem-ranking">
      <h2>{t('Xếp hạng bài nộp')}</h2>
      <p className="muted text-sm leading-relaxed text-muted-foreground">
        {t(
          'Mỗi Coder lấy một bài AC tốt nhất. Ưu tiên tổng thời gian chạy các test, độ dài mã nguồn, rồi thời điểm nộp. Hiển thị tối đa 200 Coder.',
        )}
      </p>
      <ErrorBox error={error} />
      {!rows ? (
        <Loading />
      ) : rows.length ? (
        <div
          className="table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
          role="region"
          tabIndex={0}
          aria-label={t('Xếp hạng bài nộp')}
        >
          <UiTable>
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead>{t('Hạng')}</UiTableHead>
                <UiTableHead>Coder</UiTableHead>
                <UiTableHead>{t('Ngôn ngữ')}</UiTableHead>
                <UiTableHead>{t('Thời gian chạy')}</UiTableHead>
                <UiTableHead>{t('Độ dài mã')}</UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              {rows.map((r) => (
                <UiTableRow
                  key={r.userId}
                  className={r.userId === userId ? 'my-rank bg-accent/60' : ''}
                >
                  <UiTableCell>{r.rank}</UiTableCell>
                  <UiTableCell>
                    <b data-user-content>{r.name}</b>
                    <small data-user-content>@{r.username}</small>
                  </UiTableCell>
                  <UiTableCell>{languageNames[r.language]}</UiTableCell>
                  <UiTableCell>{Number(r.timeMs.toFixed(3))} ms</UiTableCell>
                  <UiTableCell>
                    {r.sourceLength} {t('ký tự')}
                  </UiTableCell>
                </UiTableRow>
              ))}
            </UiTableBody>
          </UiTable>
        </div>
      ) : (
        <p className="muted text-sm leading-relaxed text-muted-foreground">
          {t('Chưa có bài AC để xếp hạng.')}
        </p>
      )}
    </section>
  );
}
