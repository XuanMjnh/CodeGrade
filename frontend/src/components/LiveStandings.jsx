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
import { Badge } from './ui';
const verdicts = {
  NOT_SUBMITTED: 'Chưa nộp',
  QUEUED: 'Chờ chấm',
  RUNNING: 'Đang chấm…',
  SE: 'Lỗi hệ thống',
};
const playerStates = {
  ALIVE: 'Đang thi đấu',
  SPECTATOR: 'Đã bị loại',
  ELIMINATED: 'Đã bị loại',
  FORFEIT: 'Đã bỏ cuộc',
  LEFT: 'Đã rời phòng',
};
export default function LiveStandings({ room, userId }) {
  const current = room.current;
  if (!current) return null;
  const players = new Map(room.players.map((p) => [p.id, p]));
  const rows =
    room.liveStandings ||
    (current.players || []).map((userId) => ({
      userId,
    }));
  const competing = new Set(rows.map((p) => p.userId));
  const others = (room.participants || [])
    .filter((id) => !competing.has(id))
    .map((userId) => ({
      userId,
      outsideRound: true,
    }));
  const live = ['ROUND_ACTIVE', 'ROUND_GRADING'].includes(room.state);
  const voided = room.history?.some((h) => h.round?.id === current.id && h.type);
  const settled = room.history?.some((h) => h.round?.id === current.id && !h.type);
  return (
    <section
      className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs arena-live-standings"
      aria-labelledby="live-standings-title"
    >
      <div className="arena-section-heading flex flex-wrap items-center justify-between gap-3">
        <h2 id="live-standings-title">{t('Bảng kết quả trực tiếp')}</h2>
        <span className="inline-group flex flex-wrap items-center gap-2">
          <span>
            {t('Vòng')} {current.number}
          </span>
          <Badge tone={live ? 'success' : ''}>
            {t(voided ? 'Đã hủy' : live ? 'Trực tiếp' : settled ? 'Đã chốt' : 'Đã dừng')}
          </Badge>
        </span>
      </div>
      <p className="muted standings-note text-sm leading-relaxed text-muted-foreground">
        {t(
          voided
            ? 'Vòng đã bị hủy. Kết quả không dùng để loại người chơi.'
            : live
              ? 'Kết quả tạm thời, cập nhật khi server nhận và chấm bài.'
              : settled
                ? 'Kết quả vòng đấu đã được server xác nhận.'
                : 'Vòng đấu đã dừng. Xem trạng thái trận đấu để biết kết quả cuối cùng.',
        )}
      </p>
      <div
        className="table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
        role="region"
        aria-label={t('Bảng kết quả trực tiếp')}
        tabIndex={0}
      >
        <UiTable>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead>{t('Hạng')}</UiTableHead>
              <UiTableHead>Coder</UiTableHead>
              <UiTableHead>{t('Trạng thái')}</UiTableHead>
              <UiTableHead>{t('Kết quả')}</UiTableHead>
              <UiTableHead>{t('Lượt nộp')}</UiTableHead>
              <UiTableHead>{t('Điểm')}</UiTableHead>
              <UiTableHead>{t('Thời gian hiệu lực')}</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            {[...rows, ...others].map((row) => {
              const player = players.get(row.userId);
              const verdict = row.status ? verdicts[row.status] || row.status : 'Chờ cập nhật';
              return (
                <UiTableRow
                  key={row.userId}
                  className={row.userId === userId ? 'my-rank bg-accent/60' : ''}
                  aria-current={row.userId === userId ? 'true' : undefined}
                >
                  <UiTableCell>{!voided && row.rank != null ? '#' + row.rank : '—'}</UiTableCell>
                  <UiTableCell>
                    <strong data-user-content>{player?.name || row.userId}</strong>
                    {row.userId === userId && (
                      <small className="standings-self bg-accent/60">{t('Bạn')}</small>
                    )}
                  </UiTableCell>
                  <UiTableCell>
                    {t(
                      row.outsideRound && player?.status === 'ALIVE'
                        ? 'Đã chắc suất'
                        : playerStates[player?.status] || player?.status || '—',
                    )}
                  </UiTableCell>
                  <UiTableCell>
                    {row.outsideRound ? (
                      '—'
                    ) : (
                      <Badge
                        tone={
                          row.ac
                            ? 'success'
                            : ['QUEUED', 'RUNNING', 'NOT_SUBMITTED'].includes(row.status)
                              ? ''
                              : row.status
                                ? 'danger'
                                : ''
                        }
                      >
                        {t(verdict)}
                      </Badge>
                    )}
                    {row.ac && row.pending > 0 && (
                      <small className="standings-pending">{t('Đang chấm…')}</small>
                    )}
                  </UiTableCell>
                  <UiTableCell>{row.attempts != null ? row.attempts + ' / 2' : '—'}</UiTableCell>
                  <UiTableCell>{row.rank != null ? row.score : '—'}</UiTableCell>
                  <UiTableCell>
                    {row.ac && row.effectiveMs != null
                      ? (row.effectiveMs / 1000).toFixed(3) + 's'
                      : '—'}
                  </UiTableCell>
                </UiTableRow>
              );
            })}
          </UiTableBody>
        </UiTable>
      </div>
    </section>
  );
}
