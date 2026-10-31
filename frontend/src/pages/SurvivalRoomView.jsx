import React, { useState } from 'react';
import Icon from '../components/Icon';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { NativeSelect } from '../components/ui/native-select';
import { DataTable } from '../components/DataTable';
import { TableHeader, TableHead, TableRow, TableBody, TableCell } from '../components/ui/table';
import { Badge, ErrorBox, TimeLeft, go } from '../components/ui';
import {
  ArenaScene,
  ArenaRoster,
  ArenaPodium,
  DifficultyChecks,
  GameButton,
  GameHeading,
  survivalModes,
  survivalStates,
} from '../components/SurvivalKit';
import LiveStandings from '../components/LiveStandings';
import SubmissionHistory from '../components/SubmissionHistory';
import Workspace from './Workspace';
import { cn } from '../lib/utils';
import { t } from '../lib/locale';

function RoomRules() {
  return (
    <details className="rounded-xl border bg-card p-4 text-[11px]">
      <summary className="font-semibold">Luật chơi</summary>
      <div className="mt-4 space-y-3 leading-relaxed text-muted-foreground">
        <p>
          Giao lưu: 2–10 Coder. Đấu thường và Đấu Rank: 5 Coder. Mỗi vòng tối đa 2 lượt nộp chính
          thức.
        </p>
        <p>
          AC trong thời gian giới hạn để có cơ hội đi tiếp. Nếu nhiều người AC, giữ tối đa 70% theo
          thời gian hiệu lực. Không ai AC: trận kết thúc chưa có người thắng.
        </p>
        <p>
          Chỉ Đấu Rank thay đổi điểm Rank. Mất kết nối có 90 giây để quay lại; sau đó tính bỏ cuộc.
        </p>
      </div>
    </details>
  );
}
function MatchResults({ room }) {
  if (!room.results) return null;
  return (
    <section className="survival-final-results min-w-0 space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
      <GameHeading icon="fa-medal" title="Kết quả trận đấu" />
      <div className="overflow-x-auto rounded-xl border">
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Hạng</TableHead>
              <TableHead>Coder</TableHead>
              <TableHead>EXP</TableHead>
              <TableHead>Điểm Rank</TableHead>
              <TableHead>Rank</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {room.results.map((p) => (
              <TableRow key={p.userId}>
                <TableCell className="font-mono font-bold">#{p.placement}</TableCell>
                <TableCell>
                  <b data-user-content>{room.players.find((x) => x.id === p.userId)?.name}</b>
                </TableCell>
                <TableCell className="font-mono text-primary">+{p.exp}</TableCell>
                <TableCell>
                  {room.mode === 'RANKED' ? `${p.ratingBefore} → ${p.ratingAfter}` : '—'}
                </TableCell>
                <TableCell>{room.mode === 'RANKED' ? p.rank : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </div>
    </section>
  );
}

export default function SurvivalRoomView({
  room: r,
  user,
  revision,
  onNotice,
  action,
  matchAction,
  busy,
  error,
  setError,
  config,
  updateConfig,
  submissions,
  submissionError,
  selectedSubmission,
  selectSubmission,
}) {
  const [panel, setPanel] = useState('standings');
  const { name, seconds, finalSeconds, capacity, levels } = config;
  const me = r.players.find((p) => p.id === user.id);
  const practice = !r.mode || r.mode === 'PRACTICE';
  const host = r.hostId === user.id && practice;
  const active = r.state === 'ROUND_ACTIVE';
  const waiting = ['LOBBY', 'COUNTDOWN'].includes(r.state);
  const ended = ['FINISHED', 'CLOSED', 'UNRESOLVED'].includes(r.state);
  const canPlay = me?.status === 'ALIVE' && (!r.tiePlayers || r.tiePlayers.includes(user.id));
  const winner = r.players.find((p) => p.id === r.winnerId);
  const alive = r.players.filter((p) => p.status === 'ALIVE').length;
  const deadline = active
    ? r.current?.deadline
    : ['COUNTDOWN', 'ROUND_RESULT'].includes(r.state)
      ? r.nextAt
      : null;
  const phase = waiting ? (r.state === 'LOBBY' ? 0 : 1) : ended ? 3 : 2;
  const BattleContainer = ended ? 'details' : 'section';
  const canLeave =
    me && !['LEFT', 'FORFEIT'].includes(me.status) && !ended && (practice || !waiting);
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(location.origin + '/#/room/' + r.code);
      onNotice?.(t('Đã sao chép liên kết mời.'));
    } catch (e) {
      setError(e);
    }
  }
  return (
    <div className={'arena-page arena-room min-w-0 space-y-4 state-' + r.state.toLowerCase()}>
      <header className="arena-room-header flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => go('/survival')}
            aria-label="Về sảnh Survival"
            className="shrink-0 rounded-xl border-border"
          >
            <Icon name="fa-solid fa-arrow-left" />
          </Button>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-primary">
              CODE SURVIVAL / {survivalModes[r.mode || 'PRACTICE']}
            </span>
            <h1
              className="mt-1 font-heading text-2xl font-extrabold wrap-anywhere sm:text-4xl"
              data-user-content
            >
              {r.name || 'Đấu trường Code Survival'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={ended ? '' : 'success'}>{survivalStates[r.state] || r.state}</Badge>
          <Button
            variant="outline"
            className="h-11 rounded-lg border-dashed border-primary/40 px-3 font-mono text-base font-bold tracking-widest"
            onClick={copyInvite}
            aria-label={'Sao chép mã mời ' + r.code}
          >
            <Icon name="fa-solid fa-ticket" className="size-3.5!" />
            {r.code}
            <Icon name="fa-solid fa-copy" className="size-3!" />
          </Button>
        </div>
      </header>
      <ErrorBox error={error} />
      <section
        className="arena-hud grid grid-cols-[minmax(0,1fr)_minmax(120px,1.4fr)_minmax(0,1fr)] overflow-hidden rounded-2xl border border-b-[3px] bg-card"
        aria-label="Thông tin vòng đấu"
      >
        <div className="flex flex-col justify-center gap-1 px-3 py-4 sm:px-6">
          <small className="text-[11px] font-semibold text-muted-foreground sm:text-sm">
            {waiting ? 'ĐẤU TRƯỜNG' : 'VÒNG HIỆN TẠI'}
          </small>
          <strong className="font-heading text-4xl font-black tracking-tight text-primary sm:text-5xl">
            {r.current ? String(r.current.number).padStart(2, '0') : '—'}
          </strong>
          {!waiting && (
            <span className="text-xs font-medium text-foreground sm:text-sm">
              {{
                NORMAL: 'Vòng sinh tồn',
                FINAL: 'Chung kết',
                TIE_BREAK: 'Phân định',
                RESCUE: 'Cứu hộ',
              }[r.current?.kind] ||
                (waiting ? 'Tập hợp đồng đội' : r.current?.kind || 'Chưa bắt đầu')}
            </span>
          )}
        </div>
        <div className="hud-clock flex flex-col items-center justify-center gap-1.5 border-x bg-action-soft px-2 py-4 text-center">
          <small className="text-[11px] font-semibold text-action-text sm:text-sm">
            {active
              ? 'THỜI GIAN CÒN LẠI'
              : r.state === 'COUNTDOWN'
                ? 'BẮT ĐẦU SAU'
                : r.state === 'ROUND_RESULT'
                  ? 'VÒNG TIẾP THEO'
                  : 'TRẠNG THÁI'}
          </small>
          {deadline ? (
            <div className="[&_.timer]:font-mono [&_.timer]:text-4xl [&_.timer]:font-extrabold [&_.timer]:tracking-tighter [&_.timer]:text-action-text sm:[&_.timer]:text-6xl">
              <TimeLeft deadline={deadline} />
            </div>
          ) : (
            <strong className="font-heading text-lg font-extrabold text-action-text sm:text-3xl">
              {r.state === 'ROUND_GRADING'
                ? 'Đang chấm…'
                : waiting
                  ? 'Chờ vào trận'
                  : 'Đã kết thúc'}
            </strong>
          )}
        </div>
        <div className="flex flex-col justify-center gap-1 px-3 py-4 text-right sm:px-6">
          <small className="text-[11px] font-semibold text-muted-foreground sm:text-sm">
            {waiting ? 'ĐÃ VÀO PHÒNG' : 'CODER CÒN LẠI'}
          </small>
          <strong className="font-heading text-4xl font-black text-primary sm:text-5xl">
            {alive}
            <span className="ml-1 text-lg font-semibold text-muted-foreground sm:text-2xl">
              /
              {waiting
                ? r.capacity || 5
                : r.participants?.length ||
                  r.players.filter((p) => !['LEFT', 'SPECTATOR'].includes(p.status)).length}
            </span>
          </strong>
          {r.players.some((p) => p.status === 'SPECTATOR') && (
            <span className="text-xs text-muted-foreground">
              {r.players.filter((p) => p.status === 'SPECTATOR').length} khán giả
            </span>
          )}
        </div>
      </section>
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="order-2 min-w-0 space-y-4 xl:order-1 xl:sticky xl:top-24">
          <div className="rounded-2xl border bg-card p-4">
            <ArenaRoster room={r} userId={user.id} />
          </div>
          <ol
            className="match-stages grid grid-cols-2 gap-2 rounded-2xl border bg-card p-4 xl:grid-cols-1"
            aria-label={t('Tiến trình trận đấu')}
          >
            {['Sảnh chờ', 'Đếm ngược', 'Thi đấu', 'Kết thúc'].map((stage, i) => (
              <li
                key={stage}
                aria-current={phase === i ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg p-2 text-[11px]',
                  phase === i
                    ? 'current bg-accent font-bold text-primary'
                    : i < phase
                      ? 'complete text-primary'
                      : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-lg border font-mono text-[9px]',
                    i === phase ? 'border-primary bg-primary text-white' : 'border-border',
                  )}
                >
                  {i < phase ? <Icon name="fa-solid fa-check" className="size-3!" /> : i + 1}
                </span>
                {stage}
              </li>
            ))}
          </ol>
          <RoomRules />
          {canLeave && (
            <Button
              variant="ghost"
              disabled={busy}
              className="w-full text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => {
                if (window.confirm(t('Rời sảnh / xác nhận bỏ cuộc?'))) action('ROOM_LEAVE');
              }}
            >
              <Icon name="fa-solid fa-person-walking-arrow-right" />
              Rời phòng / bỏ cuộc
            </Button>
          )}
        </aside>
        <div className="order-1 min-w-0 space-y-4 xl:order-2">
          {waiting && (
            <div
              className={cn('grid min-w-0 gap-4', practice && 'lg:grid-cols-[minmax(0,1fr)_280px]')}
            >
              <section className="min-w-0 overflow-hidden rounded-2xl border bg-card">
                <ArenaScene mode={r.mode || 'PRACTICE'} countdown={r.state === 'COUNTDOWN'}>
                  {r.state === 'COUNTDOWN' ? (
                    <TimeLeft deadline={r.nextAt} />
                  ) : (
                    <div className="relative mt-3 px-4">
                      <h2 className="font-heading text-4xl font-black tracking-tight sm:text-5xl">
                        Sảnh chờ
                      </h2>
                    </div>
                  )}
                </ArenaScene>
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-xl font-extrabold sm:text-2xl">
                        {r.state === 'COUNTDOWN' ? 'Sắp bắt đầu' : `${alive} Coder đã vào phòng`}
                      </h3>
                      {practice && alive < 2 && (
                        <Badge tone="warning" className="mt-2 text-sm">
                          Tối thiểu 2 Coder
                        </Badge>
                      )}
                    </div>
                    <Button variant="outline" className="h-11 text-sm" onClick={copyInvite}>
                      <Icon name="fa-solid fa-copy" className="size-3.5!" />
                      Mời bạn bè
                    </Button>
                  </div>
                  {host && r.state === 'LOBBY' && (
                    <GameButton
                      className="w-full"
                      disabled={busy}
                      aria-busy={busy}
                      onClick={() => action('ROOM_START')}
                    >
                      <Icon name="fa-solid fa-play" />
                      Bắt đầu trận →
                    </GameButton>
                  )}
                  {!practice && r.state === 'LOBBY' && (
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold">Chờ đủ 5 xác nhận</h3>
                      {r.acceptDeadline && (
                        <div className="[&_.timer]:font-mono [&_.timer]:text-2xl [&_.timer]:text-action">
                          <TimeLeft deadline={r.acceptDeadline} />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <GameButton disabled={busy} onClick={() => matchAction('MATCH_ACCEPT')}>
                          Xác nhận nhận trận
                        </GameButton>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => matchAction('MATCH_DECLINE')}
                        >
                          Từ chối trận
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
              {practice && (
                <section className="room-controls min-w-0 space-y-5 rounded-2xl border bg-card p-5">
                  <GameHeading icon="fa-crosshairs" title="Luật đấu của bạn" />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <Label className="grid gap-2 text-sm">
                      Tên phòng
                      <Input
                        maxLength={100}
                        value={name}
                        disabled={!host || r.state !== 'LOBBY'}
                        onChange={(e) => updateConfig.name(e.target.value)}
                      />
                    </Label>
                    <Label className="grid gap-2 text-sm">
                      Sức chứa
                      <NativeSelect
                        value={capacity}
                        disabled={!host || r.state !== 'LOBBY'}
                        onChange={(e) => updateConfig.capacity(+e.target.value)}
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </NativeSelect>
                    </Label>
                    <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
                      <Label className="grid gap-2 text-sm">
                        Vòng đấu (giây)
                        <Input
                          type="number"
                          min="30"
                          max="3600"
                          value={seconds}
                          disabled={!host || r.state !== 'LOBBY'}
                          onChange={(e) => updateConfig.seconds(+e.target.value)}
                        />
                      </Label>
                      <Label className="grid gap-2 text-sm">
                        Chung kết (giây)
                        <Input
                          type="number"
                          min="30"
                          max="3600"
                          value={finalSeconds}
                          disabled={!host || r.state !== 'LOBBY'}
                          onChange={(e) => updateConfig.finalSeconds(+e.target.value)}
                        />
                      </Label>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">Độ khó đề bài</h3>
                    <DifficultyChecks
                      value={levels}
                      onChange={updateConfig.levels}
                      disabled={!host || r.state !== 'LOBBY'}
                    />
                  </div>
                  {host && r.state === 'LOBBY' && (
                    <Button
                      variant="outline"
                      className="w-full text-sm font-bold"
                      disabled={busy}
                      onClick={() =>
                        action('ROOM_CONFIG', {
                          name,
                          capacity,
                          selectedDifficulties: levels,
                          roundSeconds: seconds,
                          finalSeconds,
                        })
                      }
                    >
                      Lưu cấu hình phòng
                    </Button>
                  )}
                </section>
              )}
            </div>
          )}
          {levels.some((d) => d >= 4) && waiting && (
            <p className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-xs text-warning">
              Mức 4–6 có thể cần nhiều thời gian hơn. Hãy cân nhắc thời gian vòng đấu trước khi bắt
              đầu.
            </p>
          )}
          {ended && (
            <section
              className={cn(
                'arena-outcome relative overflow-hidden rounded-2xl border bg-card px-5 py-8 text-center sm:p-10',
                winner && r.state === 'FINISHED'
                  ? 'victory border-gold bg-linear-to-b from-warning-soft/70 to-card'
                  : r.state === 'UNRESOLVED'
                    ? 'unresolved'
                    : 'closed',
              )}
              role="status"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gold" />
              <span className="mx-auto grid size-16 place-items-center rounded-2xl border-b-4 border-gold bg-warning-soft text-warning">
                <Icon
                  name={
                    'fa-solid ' +
                    (winner
                      ? 'fa-trophy'
                      : r.state === 'CLOSED'
                        ? 'fa-door-open'
                        : 'fa-flag-checkered')
                  }
                  className="size-8!"
                />
              </span>
              {winner && (
                <Badge tone="warning" className="mt-5 text-base">
                  Chiến thắng
                </Badge>
              )}
              <h2
                className="mt-3 font-heading text-4xl font-black tracking-tight wrap-anywhere sm:text-5xl"
                data-user-content
              >
                {winner?.name ||
                  (r.state === 'CLOSED' ? 'Phòng đã đóng' : 'Trận kết thúc chưa có người thắng')}
              </h2>
              {!winner && r.reason && (
                <p className="mt-3 text-base text-muted-foreground">{r.reason}</p>
              )}
              {winner && (
                <div className="mt-7">
                  <ArenaPodium room={r} />
                </div>
              )}
              <GameButton className="mt-6" onClick={() => go('/survival')}>
                <Icon name="fa-solid fa-play" />
                Trở về sảnh →
              </GameButton>
            </section>
          )}
          <MatchResults room={r} />
          {['ROUND_GRADING', 'ROUND_RESULT'].includes(r.state) && (
            <div
              className="arena-state-notice flex items-start gap-3 rounded-xl border border-primary/20 bg-accent p-4"
              role="status"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-primary">
                <Icon
                  name={
                    'fa-solid ' +
                    (r.state === 'ROUND_GRADING' ? 'fa-microchip' : 'fa-flag-checkered')
                  }
                />
              </span>
              <div>
                <h2 className="text-lg font-extrabold">
                  {r.state === 'ROUND_GRADING'
                    ? 'Chờ bộ chấm xác nhận'
                    : r.nextKind === 'RESCUE'
                      ? 'Chuẩn bị vòng cứu hộ'
                      : r.nextKind === 'TIE_BREAK'
                        ? 'Chuẩn bị phân định đồng hạng'
                        : 'Vòng đấu đã chốt'}
                </h2>
              </div>
            </div>
          )}
          {r.state === 'ROUND_RESULT' &&
            me &&
            r.participants?.includes(user.id) &&
            r.nextKind !== 'RESCUE' && (
              <p
                className={cn(
                  'arena-personal-result flex items-center gap-3 rounded-xl border p-4 text-sm font-bold',
                  me.status === 'ALIVE'
                    ? 'qualified border-primary/30 bg-accent text-primary'
                    : 'eliminated bg-muted text-muted-foreground',
                )}
                role="status"
              >
                <Icon
                  name={'fa-solid ' + (me.status === 'ALIVE' ? 'fa-shield-halved' : 'fa-eye')}
                />
                {me.status === 'ALIVE'
                  ? r.tiePlayers?.includes(user.id)
                    ? 'Bạn cần thi đấu vòng phụ'
                    : 'Bạn đã vào vòng tiếp theo'
                  : me.status === 'FORFEIT'
                    ? 'Bạn đã bỏ cuộc'
                    : 'Bạn đã bị loại · Tiếp tục theo dõi trận đấu'}
              </p>
            )}
          {r.current &&
            r.problem &&
            (r.current.players?.includes(user.id) || canPlay) &&
            !waiting && (
              <BattleContainer
                className="arena-battle-zone min-w-0 space-y-4 overflow-hidden rounded-2xl border border-t-[3px] border-t-primary bg-card p-3 sm:p-4"
                aria-label="Khu vực thi đấu"
              >
                {ended ? (
                  <summary className="p-1 text-sm font-semibold">
                    Xem lại đề bài & mã nguồn của bạn
                  </summary>
                ) : (
                  <GameHeading
                    icon="fa-code"
                    title={active && canPlay ? 'Đến lượt bạn tỏa sáng' : 'Thử thách của vòng đấu'}
                  >
                    <Badge tone={active && canPlay ? 'success' : ''}>
                      {active && canPlay ? 'Tối đa 2 lượt nộp' : 'Chế độ xem'}
                    </Badge>
                  </GameHeading>
                )}
                <Workspace
                  key={r.current.id}
                  id={r.current.problemId}
                  user={user}
                  revision={revision}
                  problem={r.problem}
                  room={r}
                  onNotice={onNotice}
                  onSubmissionSelected={(id) => {
                    selectSubmission(id);
                    setPanel('submissions');
                  }}
                  readOnly={!active || !canPlay}
                />
              </BattleContainer>
            )}
          {active && !canPlay && (
            <p className="flex gap-2 rounded-xl border bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
              <Icon name="fa-solid fa-eye" className="size-4! shrink-0" />
              {r.tiePlayers && !r.tiePlayers.includes(user.id) && me?.status === 'ALIVE'
                ? 'Bạn đã chắc suất đi tiếp. Theo dõi vòng phân định trong khi chờ.'
                : 'Bạn đang theo dõi trận đấu. Không thể nộp bài hoặc xem mã nguồn của đối thủ.'}
            </p>
          )}
          {r.current && !waiting && (
            <section className="min-w-0 overflow-hidden rounded-2xl border bg-card">
              <div
                className="flex border-b bg-muted/30 p-2"
                role="tablist"
                aria-label="Thông tin trận đấu"
              >
                {[
                  ['standings', 'Bảng kết quả'],
                  ['submissions', 'Bài nộp của bạn'],
                  ['history', 'Các vòng đấu'],
                ].map(([key, label], i, tabs) => (
                  <Button
                    key={key}
                    role="tab"
                    id={'room-tab-' + key}
                    aria-selected={panel === key}
                    aria-controls={'room-panel-' + key}
                    tabIndex={panel === key ? 0 : -1}
                    onClick={() => setPanel(key)}
                    onKeyDown={(e) => {
                      const next =
                        e.key === 'ArrowRight'
                          ? (i + 1) % tabs.length
                          : e.key === 'ArrowLeft'
                            ? (i + tabs.length - 1) % tabs.length
                            : null;
                      if (next !== null) {
                        e.preventDefault();
                        setPanel(tabs[next][0]);
                        document.getElementById('room-tab-' + tabs[next][0])?.focus();
                      }
                    }}
                    variant="ghost"
                    className={cn(
                      'h-12 min-w-0 flex-1 rounded-lg px-2 text-sm font-bold whitespace-normal sm:flex-none sm:px-4 sm:text-base',
                      panel === key ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground',
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div
                role="tabpanel"
                id={'room-panel-' + panel}
                aria-labelledby={'room-tab-' + panel}
                tabIndex={0}
                className="min-w-0 p-3 outline-none sm:p-5"
              >
                {panel === 'standings' && <LiveStandings room={r} userId={user.id} />}
                {panel === 'submissions' && (
                  <>
                    <ErrorBox error={submissionError} />
                    <SubmissionHistory
                      items={submissions}
                      roomId={r.id}
                      rounds={[...(r.history || []).map((h) => h.round), r.current]}
                      revision={revision}
                      selectedId={selectedSubmission}
                      onSelect={selectSubmission}
                    />
                  </>
                )}
                {panel === 'history' && (
                  <div className="space-y-3">
                    {r.history?.length ? (
                      r.history.map((h, i) => (
                        <div className="flex items-center gap-3 rounded-xl border p-4" key={i}>
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent font-mono text-xs font-bold text-primary">
                            {String(h.round?.number || i + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <h3 className="text-xs font-semibold">
                              Vòng {h.round?.number} · {h.round?.kind || h.type}
                            </h3>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              Mức {h.round?.difficulty} · {h.type || 'Đã lưu kết quả'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        Chưa có vòng đấu đã kết thúc.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
          {r.standings && (
            <details className="rounded-2xl border bg-card p-4">
              <summary className="text-xs font-semibold">Kết quả vòng gần nhất</summary>
              <div className="mt-4 min-w-0 overflow-x-auto rounded-xl border">
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hạng</TableHead>
                      <TableHead>Coder</TableHead>
                      <TableHead>Kết quả</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Thời gian hiệu lực</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {r.standings.map((s, i) => (
                      <TableRow key={s.userId}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{r.players.find((p) => p.id === s.userId)?.name}</TableCell>
                        <TableCell>
                          <Badge tone={s.ac ? 'success' : ''}>{s.ac ? 'AC' : 'Partial'}</Badge>
                        </TableCell>
                        <TableCell>{s.score}</TableCell>
                        <TableCell>
                          {s.ac ? (s.effectiveMs / 1000).toFixed(3) + 's' : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </div>
            </details>
          )}
          {user.role === 'ADMIN' &&
            ['ROUND_ACTIVE', 'ROUND_GRADING', 'ROUND_RESULT'].includes(r.state) && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      t(
                        'Xác nhận đề/test lỗi: hủy kết quả vòng và phát bài cứu hộ cho cùng thí sinh?',
                      ),
                    )
                  )
                    action('ROOM_INVALIDATE');
                }}
              >
                Admin: hủy vòng có đề lỗi
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}
