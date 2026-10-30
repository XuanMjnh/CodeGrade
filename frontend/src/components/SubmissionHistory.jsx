import { Button as UiButton } from './ui/button';
import { DataTable as UiTable } from './DataTable';
import {
  TableBody as UiTableBody,
  TableCell as UiTableCell,
  TableHead as UiTableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from './ui/table';
import React, { useState } from 'react';
import { t } from '../lib/locale';
import { languageNames } from '../lib/coderunner';
import Result from './SubmissionResult';
import SubmissionStatus from './SubmissionStatus';
export default function SubmissionHistory({
  items,
  problemId,
  roomId,
  rounds = [],
  revision,
  selectedId,
  onSelect,
}) {
  const [selected, S] = useState(null),
    [page, P] = useState(1);
  const choose = onSelect || S,
    current = selectedId === undefined ? selected : selectedId;
  const rows = (items || [])
    .filter((s) => (roomId ? s.room_id === roomId : s.problem_id === problemId))
    .sort((a, b) => b.received_at - a.received_at);
  const pages = Math.max(1, Math.ceil(rows.length / 10)),
    visiblePage = Math.min(page, pages);
  return (
    <section
      className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6 submission-history"
      data-pagination="manual"
    >
      <h2>{t('Lịch sử chấm bài')}</h2>
      {!rows.length ? (
        <p className="muted text-sm leading-relaxed text-muted-foreground">
          {t('Chưa có bài nộp.')}
        </p>
      ) : (
        <>
          <div
            className="table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
            tabIndex={0}
            role="region"
            aria-label={t('Lịch sử chấm bài')}
          >
            <UiTable paginate={false}>
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead>{t('Thời gian')}</UiTableHead>
                  {roomId && <UiTableHead>{t('Vòng')}</UiTableHead>}
                  <UiTableHead>{t('Ngôn ngữ')}</UiTableHead>
                  <UiTableHead>{t('Chế độ')}</UiTableHead>
                  <UiTableHead>{t('Kết quả')}</UiTableHead>
                  <UiTableHead>{t('Điểm')}</UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                {rows.slice((visiblePage - 1) * 10, visiblePage * 10).map((s) => (
                  <UiTableRow key={s.id}>
                    <UiTableCell>
                      <UiButton
                        className="link inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                        onClick={() => choose(s.id)}
                        variant="ghost"
                      >
                        {new Date(s.received_at).toLocaleString(
                          document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN',
                        )}
                      </UiButton>
                    </UiTableCell>
                    {roomId && (
                      <UiTableCell>
                        {rounds.find((r) => r?.id === s.round_id)?.number || '—'}
                      </UiTableCell>
                    )}
                    <UiTableCell>{languageNames[s.language]}</UiTableCell>
                    <UiTableCell>{t(s.mode === 'EXAMPLES' ? 'RUN_EXAMPLES' : s.mode)}</UiTableCell>
                    <UiTableCell>
                      <SubmissionStatus submission={s} />
                    </UiTableCell>
                    <UiTableCell>{s.score}</UiTableCell>
                  </UiTableRow>
                ))}
              </UiTableBody>
            </UiTable>
          </div>
          <div className="inline-group flex flex-wrap items-center gap-2">
            <UiButton
              className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
              disabled={visiblePage <= 1}
              onClick={() => P(visiblePage - 1)}
              variant="ghost"
            >
              {t('Trang trước')}
            </UiButton>
            <span>
              {visiblePage} / {pages}
            </span>
            <UiButton
              className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
              disabled={visiblePage >= pages}
              onClick={() => P(visiblePage + 1)}
              variant="ghost"
            >
              {t('Trang sau')}
            </UiButton>
          </div>
        </>
      )}
      {current && (
        <>
          <UiButton
            className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
            onClick={() => choose(null)}
            variant="ghost"
          >
            {t('Đóng')}
          </UiButton>
          <Result id={current} revision={revision} />
        </>
      )}
    </section>
  );
}
