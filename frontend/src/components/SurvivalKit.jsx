import React from 'react';
import Icon from './Icon';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Check } from './ui';
import { t } from '../lib/locale';

export function DifficultyChecks({ value, onChange, disabled }) {
  return (
    <div className="difficulty-checks grid grid-cols-3 gap-2" role="group" aria-label={t('Độ khó')}>
      {[1, 2, 3, 4, 5, 6].map((d) => (
        <Check
          key={d}
          tone={cn(
            'difficulty-option gap-1.5 rounded-lg border px-2 py-2.5 text-xs whitespace-nowrap has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent',
            'level-' + d,
          )}
          label={t('Mức ') + d}
          checked={value.includes(d)}
          disabled={disabled}
          onChange={(yes) => onChange(yes ? [...value, d].sort() : value.filter((v) => v !== d))}
        />
      ))}
    </div>
  );
}

export const survivalModes = { PRACTICE: 'Giao lưu', NORMAL: 'Đấu thường', RANKED: 'Đấu Rank' };
export const survivalStates = {
  LOBBY: 'Sảnh chờ',
  COUNTDOWN: 'Đếm ngược',
  ROUND_ACTIVE: 'Đang thi đấu',
  ROUND_GRADING: 'Đang chấm',
  ROUND_RESULT: 'Kết quả vòng',
  FINISHED: 'Đã kết thúc',
  CLOSED: 'Phòng đã đóng',
  UNRESOLVED: 'Chưa phân định',
};
export function GameButton({ className, children, ...props }) {
  return (
    <Button
      className={cn(
        'h-auto min-h-14 max-w-full rounded-xl border-b-4 border-action-active bg-action px-6 text-center font-heading text-base font-extrabold whitespace-normal text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-action-hover active:translate-y-0.5 active:border-b-2 motion-reduce:transform-none sm:text-lg',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
export function GameHeading({ icon, title, children }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-action">
          <Icon name={'fa-solid ' + icon} className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg sm:text-xl font-extrabold text-foreground">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  );
}
export function ArenaCrest({ compact = false }) {
  return (
    <div
      className={cn(
        'relative isolate mx-auto grid place-items-center',
        compact ? 'size-28' : 'size-44 sm:size-52',
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rotate-45 rounded-[28%] border border-white/20 bg-white/5" />
      <div className="absolute inset-4 -rotate-12 rounded-[28%] border border-white/20" />
      <div
        className={cn(
          'relative flex rotate-3 flex-col items-center justify-center gap-2 border-2 border-gold bg-warning-soft text-warning shadow-[0_8px_0_0_rgb(0_0_0/.15)] [clip-path:polygon(15%_0,85%_0,100%_20%,90%_78%,50%_100%,10%_78%,0_20%)]',
          compact ? 'h-24 w-20 pb-3' : 'h-40 w-32 pb-4 sm:h-44 sm:w-36',
        )}
      >
        <Icon name="fa-solid fa-trophy" className={compact ? 'size-8!' : 'size-12!'} />
        {!compact && (
          <span className="font-heading text-center text-sm leading-tight font-black tracking-tight">
            CODE
            <br />
            SURVIVAL
          </span>
        )}
        <span className="text-[9px] tracking-[.3em]">★ ★ ★</span>
      </div>
    </div>
  );
}
export function ArenaScene({ children, countdown = false }) {
  return (
    <div className="relative isolate flex min-h-[330px] flex-col items-center justify-center overflow-hidden bg-primary px-5 py-8 text-center text-primary-foreground sm:min-h-[365px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 size-[480px] -translate-x-1/2 rounded-full border border-white/10 bg-white/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-12 left-1/2 size-[320px] -translate-x-1/2 rounded-full border border-dashed border-white/20"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/15 to-transparent"
      />
      {countdown ? (
        <div className="relative my-8 grid size-44 place-items-center rounded-full border-8 border-white/15 bg-white/5 shadow-[0_0_0_16px_rgb(255_255_255/.04)] [&_.timer]:font-mono [&_.timer]:text-5xl [&_.timer]:font-extrabold [&_.timer]:tracking-tighter [&_.timer]:text-gold">
          {children}
        </div>
      ) : (
        <>
          <div className="relative mt-5">
            <span
              className="absolute -left-12 top-14 -rotate-12 font-mono text-2xl text-white/40"
              aria-hidden="true"
            >
              &lt;/&gt;
            </span>
            <ArenaCrest />
            <span
              className="absolute -right-10 top-24 rotate-12 font-mono text-xl text-gold/80"
              aria-hidden="true"
            >
              {'{ }'}
            </span>
          </div>
          {children}
        </>
      )}
    </div>
  );
}
export function ArenaRoster({ room, userId }) {
  const players = room.players.filter((p) => p.status !== 'LEFT');
  const waiting = ['LOBBY', 'COUNTDOWN'].includes(room.state);
  const ended = ['FINISHED', 'CLOSED', 'UNRESOLVED'].includes(room.state);
  const slots = waiting
    ? Math.max(0, (room.capacity || 5) - players.filter((p) => p.status === 'ALIVE').length)
    : 0;
  return (
    <section className="survival-roster min-w-0 space-y-3" aria-label="Người trong phòng">
      <GameHeading icon="fa-users" eyebrow="ROSTER" title="Đội hình">
        <span className="font-mono text-base font-bold text-action bg-action/10 px-2.5 py-0.5 rounded-full border border-action/20">
          {players.length}
        </span>
      </GameHeading>
      <div className="players grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              'player relative flex min-w-0 items-center gap-2.5 rounded-xl border p-2.5 transition-all shadow-2xs',
              p.id === userId
                ? 'border-action/50 bg-action/5 ring-1 ring-action/25'
                : 'border-border/70 bg-card hover:border-border',
              p.status === 'ALIVE' ? 'alive' : 'eliminated opacity-60',
            )}
          >
            <span
              className={cn(
                'relative grid size-9 shrink-0 place-items-center rounded-xl font-heading text-sm font-black border shadow-2xs',
                p.status === 'ALIVE'
                  ? p.id === userId
                    ? 'border-action/30 bg-action/15 text-action'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-border bg-muted text-muted-foreground',
              )}
              aria-hidden="true"
            >
              {p.name.slice(0, 1).toUpperCase()}
              {p.id === room.hostId && (
                <span
                  className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-amber-500 text-white shadow-2xs"
                  title="Chủ phòng"
                >
                  <Icon name="fa-solid fa-crown" className="size-2 fill-current" />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <b className="block text-xs sm:text-sm font-extrabold truncate text-foreground" data-user-content>
                  {p.name}
                </b>
                {p.id === userId && (
                  <span className="shrink-0 rounded-full bg-action/15 px-1.5 py-0.2 font-mono text-[8px] font-bold text-action">
                    Bạn
                  </span>
                )}
              </div>
              <span className="mt-0.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    p.status === 'ALIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40',
                  )}
                />
                {p.id === room.winnerId
                  ? 'Chiến thắng'
                  : p.status === 'ALIVE'
                    ? ended
                      ? 'Hoàn thành'
                      : waiting
                        ? 'Trong phòng'
                        : 'Còn thi đấu'
                    : p.status === 'FORFEIT'
                      ? 'Bỏ cuộc'
                      : 'Theo dõi'}
              </span>
            </div>
            <span className="self-center font-mono text-[9px] font-semibold text-muted-foreground/50">
              #{String(i + 1).padStart(2, '0')}
            </span>
          </div>
        ))}
        {Array.from({ length: slots }, (_, i) => (
          <div
            key={'slot-' + i}
            className="flex items-center gap-2.5 rounded-xl border border-dashed border-border/70 bg-muted/20 p-2.5 text-muted-foreground"
          >
            <span className="grid size-9 place-items-center rounded-xl border border-dashed border-border text-muted-foreground/60">
              <Icon name="fa-solid fa-user-plus" className="size-3.5!" />
            </span>
            <div>
              <b className="block text-xs font-semibold text-muted-foreground/80">Vị trí trống</b>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
export function ArenaPodium({ room }) {
  const leaders = (room.results || [])
    .filter((p) => p.placement <= 3)
    .sort((a, b) => a.placement - b.placement);
  if (!leaders.length) return null;
  return (
    <ol
      className="survival-podium mx-auto grid w-full max-w-2xl gap-3 sm:grid-cols-3"
      aria-label="Bục vinh danh"
    >
      {leaders.map((result) => (
        <li
          key={result.userId}
          className={cn(
            'flex min-w-0 flex-col items-center gap-2 rounded-xl border border-b-4 p-5',
            result.placement === 1 ? 'border-gold bg-warning-soft' : 'border-border bg-card',
          )}
        >
          <span
            className={cn(
              'grid size-10 place-items-center rounded-xl',
              result.placement === 1 ? 'bg-gold text-warning' : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon name={'fa-solid ' + (result.placement === 1 ? 'fa-crown' : 'fa-medal')} />
          </span>
          <small className="font-mono text-base font-bold text-foreground">
            HẠNG {result.placement}
          </small>
          <b className="max-w-full text-lg wrap-anywhere" data-user-content>
            {room.players.find((p) => p.id === result.userId)?.name || result.userId}
          </b>
          <span className="font-mono text-xl font-extrabold text-primary">+{result.exp} EXP</span>
          {room.mode === 'RANKED' && (
            <span className="text-sm font-semibold text-foreground">
              {result.ratingBefore} → {result.ratingAfter} rating
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
