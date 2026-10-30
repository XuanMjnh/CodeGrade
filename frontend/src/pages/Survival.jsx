import { Button as ActionLink, Button as UiButton } from '../components/ui/button';
import Icon from '../components/Icon';
import { Input as UiInput } from '../components/ui/input';
import { Label as UiLabel } from '../components/ui/label';
import { NativeSelect as UiNativeSelect } from '../components/ui/native-select';
import { DataTable as UiTable } from '../components/DataTable';
import {
  TableBody as UiTableBody,
  TableCell as UiTableCell,
  TableHead as UiTableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from '../components/ui/table';
import { t as trUI } from '../lib/locale';
import React, { useState, useEffect } from 'react';
import { live } from '../lib/live';
import { Badge, ErrorBox, Loading, useResource, go, Check, TimeLeft } from '../components/ui';
import Workspace from './Workspace';
import SubmissionHistory from '../components/SubmissionHistory';
import LiveStandings from '../components/LiveStandings';
export function DifficultyChecks({ value, onChange, disabled }) {
  return (
    <div
      className="difficulty-checks flex flex-wrap gap-2"
      role="group"
      aria-label={trUI('Độ khó')}
    >
      {[1, 2, 3, 4, 5, 6].map((d) => (
        <Check
          key={d}
          tone={'difficulty-option level-' + d}
          label={
            <span className="difficulty-label inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              {trUI('Mức ') + d}
            </span>
          }
          checked={value.includes(d)}
          disabled={disabled}
          onChange={(yes) => onChange(yes ? [...value, d].sort() : value.filter((v) => v !== d))}
        />
      ))}
    </div>
  );
}
export { default as Rooms } from './SurvivalLobby';
export function Room({ id, user, revision, onNotice }) {
  const [mine, mineError] = useResource('SUBMISSIONS', {}, revision),
    [selectedSubmission, selectSubmission] = useState(null);
  const [seconds, Seconds] = useState(120),
    [finalSeconds, FinalSeconds] = useState(150),
    [capacity, Capacity] = useState(10),
    [name, Name] = useState('');
  const [r, setRoom] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [levels, setLevels] = useState([1, 2, 3]);
  function applyRoom(d) {
    setRoom(d);
    setLevels(d.selectedDifficulties);
    Seconds(d.roundSeconds || 120);
    FinalSeconds(d.finalSeconds || 150);
    Capacity(d.capacity || 10);
    Name(d.name || 'Code Survival');
  }
  useEffect(() => {
    const touch = () => {
      live
        .call('ROOM_TOUCH', {
          roomId: id,
        })
        .catch(() => {});
      live.call('MATCH_QUEUE_STATUS').catch(() => {});
    };
    const timer = setInterval(touch, 15000),
      first = setTimeout(touch, 1500);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, [id]);
  useEffect(() => {
    let active = true;
    live
      .call('ROOM_JOIN', {
        roomId: id,
      })
      .then((d) => {
        if (active) {
          applyRoom(d);
        }
      })
      .catch(setError);
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    if (!r) return;
    let active = true;
    live
      .call('ROOM_SNAPSHOT', {
        roomId: id,
      })
      .then((d) => {
        if (active) {
          applyRoom(d);
        }
      })
      .catch(setError);
    return () => {
      active = false;
    };
  }, [revision]);
  async function action(type, p = {}) {
    setError(null);
    setBusy(true);
    try {
      const d = await live.call(type, {
        roomId: r.id,
        ...p,
      });
      if (d.deleted || type === 'ROOM_LEAVE') {
        go('/survival');
        return;
      }
      applyRoom(d);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (!r)
    return (
      <>
        <ErrorBox error={error} />
        <Loading />
      </>
    );
  const me = r.players.find((p) => p.id === user.id),
    host = r.hostId === user.id && r.mode !== 'NORMAL' && r.mode !== 'RANKED',
    active = r.state === 'ROUND_ACTIVE',
    canPlay = me?.status === 'ALIVE' && (!r.tiePlayers || r.tiePlayers.includes(user.id));
  const winner = r.players.find((p) => p.id === r.winnerId);
  const practice = !r.mode || r.mode === 'PRACTICE';
  async function matchAction(type) {
    setBusy(true);
    try {
      await live.call(type, {
        roomId: r.id,
      });
      go('/survival');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const roundKind = r.current?.kind,
    stageLabels = {
      LOBBY: 'SẢNH CHỜ',
      COUNTDOWN: 'CHUẨN BỊ',
      ROUND_ACTIVE: 'ĐANG THI ĐẤU',
      ROUND_GRADING: 'ĐANG CHẤM',
      ROUND_RESULT: 'KẾT QUẢ VÒNG',
      FINISHED: 'TRẬN ĐẤU KẾT THÚC',
      UNRESOLVED: 'CHƯA XÁC ĐỊNH NGƯỜI THẮNG',
      CLOSED: 'PHÒNG ĐÃ ĐÓNG',
    };
  const deadline = active
    ? r.current?.deadline
    : ['COUNTDOWN', 'ROUND_RESULT'].includes(r.state)
      ? r.nextAt
      : null;
  return (
    <div className={'arena-page arena-room min-w-0 space-y-6 state-' + r.state.toLowerCase()}>
      <header className="arena-room-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow text-xs font-medium uppercase tracking-wider text-muted-foreground">
            CODE SURVIVAL <span aria-hidden="true">/</span> {r.mode || 'PRACTICE'}
          </span>
          <h1 data-user-content>{r.name || 'Đấu trường Code Survival'}</h1>
          <p>
            <span className="invite-code rounded-md border bg-muted px-3 py-1 font-mono text-base tracking-widest">
              {r.code}
            </span>{' '}
            · {stageLabels[r.state] || r.state}
          </p>
        </div>
        <div className="inline-group flex flex-wrap items-center gap-2">
          {r.state === 'LOBBY' && host && (
            <UiButton
              className="arena-game-button bg-primary text-primary-foreground hover:bg-primary/90"
              aria-busy={busy}
              disabled={busy}
              onClick={() => action('ROOM_START')}
              variant="default"
            >
              Bắt đầu trận →
            </UiButton>
          )}
          <UiButton
            className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
            onClick={() => go('/survival')}
            variant="outline"
          >
            ← Sảnh Survival
          </UiButton>
        </div>
      </header>
      <section
        className="arena-hud grid gap-4 rounded-[14px] border bg-card p-5 sm:grid-cols-3"
        aria-label="Thông tin vòng đấu"
      >
        <div className="hud-round space-y-2">
          <small>VÒNG HIỆN TẠI</small>
          <strong>{r.current ? String(r.current.number).padStart(2, '0') : '—'}</strong>
          <span>{roundKind || 'Chưa bắt đầu'}</span>
        </div>
        <div className="hud-clock space-y-2">
          <small>
            {active
              ? 'THỜI GIAN CÒN LẠI'
              : r.state === 'ROUND_RESULT'
                ? 'VÒNG TIẾP THEO'
                : r.state === 'COUNTDOWN'
                  ? 'BẮT ĐẦU SAU'
                  : stageLabels[r.state] || r.state}
          </small>
          {deadline ? (
            <TimeLeft deadline={deadline} />
          ) : (
            <strong className="hud-state-label text-xs uppercase tracking-wider text-muted-foreground">
              {r.state === 'ROUND_GRADING' ? (
                <>
                  <Icon name="fa-solid fa-circle-notch grading-spinner" aria-hidden="true" /> Đang
                  chấm
                </>
              ) : r.state === 'LOBBY' ? (
                'Sẵn sàng?'
              ) : (
                'Đã chốt'
              )}
            </strong>
          )}
        </div>
        <div className="hud-players space-y-2">
          <small>CODER CÒN THI ĐẤU</small>
          <strong>
            {r.players.filter((p) => p.status === 'ALIVE').length}
            <span>
              {' '}
              /{' '}
              {r.participants?.length ||
                r.players.filter((p) => p.status !== 'LEFT' && p.status !== 'SPECTATOR').length}
            </span>
          </strong>
          <span>
            {r.players.filter((p) => p.status === 'SPECTATOR').length} khán giả ·{' '}
            {practice ? 'Không cộng EXP' : 'EXP theo kết quả server'}
          </span>
        </div>
      </section>
      {r.state === 'ROUND_GRADING' && (
        <div
          className="arena-state-notice my-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed"
          role="status"
        >
          <Icon name="fa-solid fa-microchip" aria-hidden="true" />
          <div>
            <h2>Đang xử lý bài nộp</h2>
            <p>
              Chờ bộ chấm xác nhận kết quả chính thức. Thứ tự tiếp nhận bài được giữ để bảo đảm công
              bằng.
            </p>
          </div>
        </div>
      )}
      {r.state === 'ROUND_RESULT' && (
        <div
          className="arena-state-notice my-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed"
          role="status"
        >
          <Icon name="fa-solid fa-flag-checkered" aria-hidden="true" />
          <div>
            <h2>
              {r.nextKind === 'RESCUE'
                ? 'Chuẩn bị vòng cứu hộ'
                : r.nextKind === 'TIE_BREAK'
                  ? 'Chuẩn bị phân định đồng hạng'
                  : 'Vòng đấu đã chốt'}
            </h2>
            <p>
              {r.nextKind === 'RESCUE'
                ? 'Vòng bị hủy do lỗi đề/test; kết quả vòng không dùng để loại người chơi.'
                : r.nextKind === 'TIE_BREAK'
                  ? 'Server đã xác định nhóm cần thi đấu vòng phụ.'
                  : 'Xem kết quả vòng bên dưới trước khi vòng tiếp theo bắt đầu.'}
            </p>
          </div>
        </div>
      )}
      {r.state === 'ROUND_RESULT' &&
        me &&
        r.participants?.includes(user.id) &&
        r.nextKind !== 'RESCUE' && (
          <p
            className={
              'arena-personal-result space-y-3 rounded-[14px] border bg-accent p-6 text-center ' +
              (me.status === 'ALIVE'
                ? 'qualified border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'eliminated opacity-70')
            }
            role="status"
          >
            <Icon
              name={'fa-solid ' + (me.status === 'ALIVE' ? 'fa-shield-halved' : 'fa-eye')}
              aria-hidden="true"
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
      {r.state === 'FINISHED' && winner && (
        <section
          className="arena-outcome space-y-3 rounded-[14px] border bg-accent p-6 text-center victory"
          role="status"
        >
          <Icon name="fa-solid fa-trophy" aria-hidden="true" />
          <span className="eyebrow text-xs font-medium uppercase tracking-wider text-muted-foreground">
            LAST CODER STANDING
          </span>
          <h2 data-user-content>{winner.name}</h2>
          <p>Người chiến thắng · {r.mode || 'PRACTICE'}</p>
          <ActionLink asChild variant="outline">
            <a
              className="button secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
              href="#/survival"
            >
              Trở về sảnh →
            </a>
          </ActionLink>
        </section>
      )}
      {r.state === 'UNRESOLVED' && (
        <section
          className="arena-outcome space-y-3 rounded-[14px] border bg-accent p-6 text-center unresolved"
          role="status"
        >
          <Icon name="fa-solid fa-scale-balanced" aria-hidden="true" />
          <h2>Trận kết thúc chưa có người thắng</h2>
          <p>{r.reason || 'Không có kết quả thắng được server xác nhận.'}</p>
          <ActionLink asChild variant="outline">
            <a
              className="button secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
              href="#/survival"
            >
              Trở về sảnh →
            </a>
          </ActionLink>
        </section>
      )}
      {!practice && ['LOBBY', 'COUNTDOWN'].includes(r.state) && (
        <section className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6">
          <h2>Chờ đủ 5 người sẵn sàng</h2>
          {r.state === 'LOBBY' && r.acceptDeadline && <TimeLeft deadline={r.acceptDeadline} />}
          {r.state === 'LOBBY' && (
            <UiButton
              className="arena-game-button bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={busy}
              onClick={() => matchAction('MATCH_ACCEPT')}
              variant="default"
            >
              Xác nhận nhận trận
            </UiButton>
          )}
          <UiButton
            className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
            disabled={busy}
            onClick={() => matchAction('MATCH_DECLINE')}
            variant="outline"
          >
            Từ chối trận
          </UiButton>
        </section>
      )}
      <ol
        className="match-stages grid gap-2 sm:grid-cols-4 [&>li]:flex [&>li]:items-center [&>li]:gap-2 [&>li]:rounded-lg [&>li]:border [&>li]:p-3 [&>li]:text-xs"
        aria-label={trUI('Tiến trình trận đấu')}
      >
        {['Sảnh chờ', 'Đếm ngược', 'Thi đấu', 'Kết thúc'].map((stage, i) => {
          const current =
            r.state === 'LOBBY'
              ? 0
              : r.state === 'COUNTDOWN'
                ? 1
                : ['FINISHED', 'UNRESOLVED', 'CLOSED'].includes(r.state)
                  ? 3
                  : 2;
          return (
            <li
              key={stage}
              className={
                i === current
                  ? 'current border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15'
                  : i < current
                    ? 'complete border-emerald-200 bg-emerald-50 text-emerald-800'
                    : ''
              }
              aria-current={i === current ? 'step' : undefined}
            >
              <span>{i + 1}</span>
              {trUI(stage)}
            </li>
          );
        })}
      </ol>
      <details className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6">
        <summary>Luật chơi</summary>
        <p>
          Practice: 2–10 Coder; Normal/Ranked: đúng 5 Coder. Chỉ Ranked thay đổi điểm Rank. Elo
          Contest được tính riêng. Mỗi vòng tối đa 2 lượt nộp. Vòng đóng sớm khi tất cả người còn
          thi đấu đã nộp ít nhất một bài chính thức và chốt kết quả khi chấm xong. Ở chung kết, AC
          được xác nhận theo thứ tự tiếp nhận; chờ các bài đến sớm hơn để bảo đảm công bằng. Ai
          không AC khi hết vòng bị loại. Nếu nhiều người AC, giữ tối đa 70% theo thời gian hiệu lực.
          Không ai AC: trận kết thúc không có người thắng. Lỗi hệ thống không phạt người chơi. Chủ
          phòng cấu hình thời gian trước khi bắt đầu. Lịch sử và thứ hạng được giữ khi thành viên
          rời trận. Mất kết nối có 90 giây để quay lại; sau đó tính bỏ cuộc.
        </p>
      </details>
      <ErrorBox error={error} />
      <details className="room-controls space-y-4 p-5 [&>summary]:font-medium paper rounded-[14px] border bg-card text-card-foreground shadow-xs">
        <summary>Cấu hình phòng & trạng thái của bạn</summary>
        <div className="room-status grid gap-4 md:grid-cols-3 [&_label]:grid [&_label]:gap-2">
          <div>
            {active ? (
              <TimeLeft deadline={r.current.deadline} />
            ) : ['COUNTDOWN', 'ROUND_RESULT'].includes(r.state) ? (
              <TimeLeft deadline={r.nextAt} />
            ) : (
              <h3>
                {r.state === 'ROUND_GRADING'
                  ? trUI('Đang chấm…')
                  : r.state === 'FINISHED'
                    ? winner?.name
                    : r.reason || trUI('Mời thêm Coder')}
              </h3>
            )}
          </div>
          <div>
            {host && r.state === 'LOBBY' && (
              <div>
                <UiLabel className="grid gap-2 text-sm font-medium">
                  Tên phòng
                  <UiInput maxLength={100} value={name} onChange={(e) => Name(e.target.value)} />
                </UiLabel>
                <UiLabel className="grid gap-2 text-sm font-medium">
                  Sức chứa
                  <UiNativeSelect value={capacity} onChange={(e) => Capacity(+e.target.value)}>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </UiNativeSelect>
                </UiLabel>
                <UiLabel className="grid gap-2 text-sm font-medium">
                  Thời gian vòng
                  <UiInput
                    type="number"
                    min="30"
                    max="3600"
                    value={seconds}
                    onChange={(e) => Seconds(+e.target.value)}
                  />
                </UiLabel>
                <UiLabel className="grid gap-2 text-sm font-medium">
                  Thời gian chung kết
                  <UiInput
                    type="number"
                    min="30"
                    max="3600"
                    value={finalSeconds}
                    onChange={(e) => FinalSeconds(+e.target.value)}
                  />
                </UiLabel>
              </div>
            )}
            <DifficultyChecks
              value={levels}
              onChange={setLevels}
              disabled={!host || r.state !== 'LOBBY'}
            />
            {host && r.state === 'LOBBY' && (
              <UiButton
                className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
                aria-busy={busy}
                disabled={busy}
                onClick={() =>
                  action('ROOM_CONFIG', {
                    selectedDifficulties: levels,
                    roundSeconds: seconds,
                    finalSeconds,
                    capacity,
                    name,
                  })
                }
                variant="ghost"
              >
                Lưu cấu hình phòng
              </UiButton>
            )}
          </div>
          <div>
            <h3>
              {me?.status === 'ALIVE'
                ? trUI('Đang thi đấu')
                : me?.status === 'FORFEIT'
                  ? trUI('Đã bỏ cuộc')
                  : trUI('Khán giả')}
            </h3>
            {me &&
              !['LEFT', 'FORFEIT'].includes(me.status) &&
              !['FINISHED', 'CLOSED', 'UNRESOLVED'].includes(r.state) &&
              (practice || !['LOBBY', 'COUNTDOWN'].includes(r.state)) && (
                <UiButton
                  className="ghost bg-transparent shadow-none hover:bg-muted hover:text-foreground danger-text text-destructive"
                  onClick={() => {
                    if (window.confirm(trUI('Rời sảnh / xác nhận bỏ cuộc?'))) action('ROOM_LEAVE');
                  }}
                  variant="ghost"
                >
                  Rời phòng / bỏ cuộc
                </UiButton>
              )}
          </div>
        </div>
      </details>
      {levels.some((d) => d >= 4) && (
        <div className="alert my-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed warning text-amber-900">
          Có mức 4–6: thời lượng mục tiêu 10 phút có thể không đủ; vòng phụ/chấm chậm có thể kéo dài
          trận.
        </div>
      )}
      <div className="subheading flex flex-wrap items-center justify-between gap-3">
        <h2>Người trong phòng</h2>
        <small>
          {r.players.filter((p) => p.status !== 'LEFT').length} {trUI('thành viên')}
        </small>
      </div>
      <div className="players grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {r.players
          .filter((p) => p.status !== 'LEFT')
          .map((p) => (
            <div
              className={
                'player flex items-center gap-3 rounded-lg border bg-card p-3 [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground ' +
                (p.status === 'ALIVE'
                  ? 'alive'
                  : ['SPECTATOR', 'FORFEIT', 'ELIMINATED'].includes(p.status)
                    ? 'eliminated opacity-70'
                    : '')
              }
              key={p.id}
            >
              <span
                className="avatar flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-primary"
                aria-hidden="true"
              >
                {p.name.slice(0, 1)}
              </span>
              <div>
                <b data-user-content>
                  {p.name}
                  {p.id === r.hostId ? trUI(' · Chủ phòng') : ''}
                </b>
                <small>
                  {trUI(
                    p.status === 'SPECTATOR' && r.participants?.includes(p.id)
                      ? 'ELIMINATED'
                      : p.status,
                  )}
                  {p.id === user.id ? trUI(' · Bạn') : ''}
                </small>
              </div>
              <Icon
                name={
                  'fa-solid player-status-icon ' +
                  (p.status === 'ALIVE'
                    ? 'fa-code'
                    : p.status === 'FORFEIT'
                      ? 'fa-person-walking-arrow-right'
                      : 'fa-eye')
                }
                aria-hidden="true"
              />
            </div>
          ))}
      </div>
      {practice && r.state === 'LOBBY' && (
        <div className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6">
          <h3>Trước khi bắt đầu</h3>
          <p>
            Practice cần ít nhất 2 Coder; Normal/Ranked cần đủ 5 xác nhận. Nguồn đề phải có{' '}
            {r.players.filter((p) => p.status === 'ALIVE').length >= 8 ? 5 : 4} bài đã công bố, có
            test ẩn và đáp án mẫu AC trong các mức đã chọn (gồm 1 dự phòng). Mọi cấu hình được khóa
            từ đếm ngược.
          </p>
          <p className="muted text-sm leading-relaxed text-muted-foreground">
            Ngắt mạng hoặc tải lại trang không tự loại bạn. Nút bỏ cuộc xác nhận việc rời trận.
          </p>
          <UiButton
            className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              navigator.clipboard
                ?.writeText(location.origin + '/#/room/' + r.code)
                .then(() => onNotice(trUI('Đã sao chép liên kết mời.')))
                .catch(setError);
            }}
            variant="outline"
          >
            Sao chép liên kết mời
          </UiButton>
        </div>
      )}
      {r.current && <LiveStandings room={r} userId={user.id} />}
      {r.current && r.problem && (r.current.players?.includes(user.id) || canPlay) && (
        <Workspace
          key={r.current.id}
          id={r.current.problemId}
          user={user}
          revision={revision}
          problem={r.problem}
          room={r}
          onNotice={onNotice}
          onSubmissionSelected={selectSubmission}
          readOnly={!active || !canPlay}
        />
      )}
      {active && !canPlay && (
        <div className="alert my-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed">
          Bạn đang xem vòng đấu
          {r.tiePlayers && !r.tiePlayers.includes(user.id) && me?.status === 'ALIVE'
            ? trUI(' và đã chắc suất đi tiếp')
            : ''}
          . Không được nộp bài, xem code đối thủ hoặc test ẩn.
        </div>
      )}
      {r.results && (
        <section className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6">
          <h2>Kết quả trận · {r.mode || 'PRACTICE'}</h2>
          <div className="table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card">
            <UiTable>
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead>Hạng</UiTableHead>
                  <UiTableHead>Coder</UiTableHead>
                  <UiTableHead>EXP</UiTableHead>
                  <UiTableHead>Điểm Rank</UiTableHead>
                  <UiTableHead>Rank</UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                {r.results.map((p) => (
                  <UiTableRow key={p.userId}>
                    <UiTableCell>#{p.placement}</UiTableCell>
                    <UiTableCell>{r.players.find((x) => x.id === p.userId)?.name}</UiTableCell>
                    <UiTableCell>+{p.exp}</UiTableCell>
                    <UiTableCell>
                      {r.mode === 'RANKED' ? `${p.ratingBefore} → ${p.ratingAfter}` : '—'}
                    </UiTableCell>
                    <UiTableCell>{r.mode === 'RANKED' ? p.rank : '—'}</UiTableCell>
                  </UiTableRow>
                ))}
              </UiTableBody>
            </UiTable>
          </div>
        </section>
      )}
      {r.current && (
        <>
          <ErrorBox error={mineError} />
          <SubmissionHistory
            items={mine}
            roomId={r.id}
            rounds={[...(r.history || []).map((h) => h.round), r.current]}
            revision={revision}
            selectedId={selectedSubmission}
            onSelect={selectSubmission}
          />
        </>
      )}
      {r.standings && (
        <section className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6">
          <h2>Kết quả vòng gần nhất</h2>
          <div
            className="table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
            role="region"
            aria-label={trUI('Bảng dữ liệu')}
            tabIndex={0}
          >
            <UiTable>
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead>Hạng</UiTableHead>
                  <UiTableHead>Coder</UiTableHead>
                  <UiTableHead>Kết quả</UiTableHead>
                  <UiTableHead>Điểm</UiTableHead>
                  <UiTableHead>Thời gian hiệu lực</UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                {r.standings.map((s, i) => (
                  <UiTableRow key={s.userId}>
                    <UiTableCell>{i + 1}</UiTableCell>
                    <UiTableCell>{r.players.find((p) => p.id === s.userId)?.name}</UiTableCell>
                    <UiTableCell>
                      <Badge tone={s.ac ? 'success' : ''}>{s.ac ? 'AC' : 'Partial'}</Badge>
                    </UiTableCell>
                    <UiTableCell>{s.score}</UiTableCell>
                    <UiTableCell>
                      {s.ac ? (s.effectiveMs / 1000).toFixed(3) + 's' : '—'}
                    </UiTableCell>
                  </UiTableRow>
                ))}
              </UiTableBody>
            </UiTable>
          </div>
        </section>
      )}
      {r.history?.length > 0 && (
        <details className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6">
          <summary>Lịch sử các vòng ({r.history.length})</summary>
          {r.history.map((h, i) => (
            <p key={i}>
              Vòng {h.round?.number} · {h.round?.kind || h.type} · Mức {h.round?.difficulty} ·{' '}
              {h.type || trUI('Đã lưu kết quả')}
            </p>
          ))}
        </details>
      )}
      {user.role === 'ADMIN' &&
        ['ROUND_ACTIVE', 'ROUND_GRADING', 'ROUND_RESULT'].includes(r.state) && (
          <UiButton
            className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              if (
                window.confirm(
                  trUI(
                    'Xác nhận đề/test lỗi: hủy kết quả vòng và phát bài cứu hộ cho cùng thí sinh?',
                  ),
                )
              )
                action('ROOM_INVALIDATE');
            }}
            variant="outline"
          >
            Admin: hủy vòng có đề lỗi
          </UiButton>
        )}
    </div>
  );
}
