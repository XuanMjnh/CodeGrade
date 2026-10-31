import React from 'react';
import Icon from './Icon';
import RankAmbientBackground from './RankAmbientBackground';
import { survivalModes } from './SurvivalKit';
import { t } from '../lib/locale';
import { cn } from '../lib/utils';

const THEMES = {
  PRACTICE: {
    frame: 'border-emerald-800/50',
    veil: 'from-[#103e32]/85 via-[#103e32]/35 to-[#0b282c]/45',
    title: 'text-emerald-50',
    badge: 'border-emerald-200/25 bg-emerald-100/10 text-emerald-100',
    footer: 'border-emerald-200/15 bg-[#10392f]/90 text-emerald-50',
    icon: 'fa-terminal',
    tone: 'platinum',
  },
  NORMAL: {
    frame: 'border-action/55',
    veil: 'from-[#542614]/90 via-[#3c1e1c]/35 to-[#251d25]/50',
    title: 'text-orange-50',
    badge: 'border-orange-200/30 bg-orange-100/10 text-orange-100',
    footer: 'border-orange-200/15 bg-[#45251c]/90 text-orange-50',
    icon: 'fa-bolt',
    tone: 'master',
  },
  RANKED: {
    frame: 'border-gold/60',
    veil: 'from-[#29233c]/90 via-[#30233a]/25 to-[#30291c]/50',
    title: 'text-[#ffe7ac]',
    badge: 'border-gold/35 bg-gold/10 text-[#ffe7ac]',
    footer: 'border-gold/20 bg-[#292334]/90 text-[#ffe7ac]',
    icon: 'fa-trophy',
    tone: 'gold',
  },
};

function PracticeArtwork() {
  return (
    <div className="relative mx-auto h-56 w-full max-w-80 sm:h-64" aria-hidden="true">
      <div className="absolute inset-4 rounded-full border border-emerald-200/20" />
      <div className="absolute inset-9 rotate-12 rounded-[36px] border border-dashed border-emerald-200/20" />
      <div className="absolute top-8 left-[7%] h-40 w-[73%] -rotate-6 overflow-hidden rounded-2xl border-2 border-emerald-200/40 bg-[#123d36]/90 shadow-[0_14px_35px_rgb(0_0_0/.25)] sm:top-10 sm:h-44">
        <div className="flex h-8 items-center gap-1.5 border-b border-emerald-100/15 bg-emerald-100/5 px-3">
          <span className="size-1.5 rounded-full bg-emerald-200/80" />
          <span className="size-1.5 rounded-full bg-emerald-200/40" />
          <span className="size-1.5 rounded-full bg-emerald-200/20" />
        </div>
        <div className="flex h-32 items-center justify-center gap-3 sm:h-36">
          <span className="font-mono text-6xl font-bold tracking-tighter text-emerald-100">
            {'</>'}
          </span>
        </div>
      </div>
      <div className="absolute top-24 right-[2%] flex size-24 rotate-12 flex-col items-center justify-center rounded-2xl border border-emerald-100/40 bg-[#296755]/95 shadow-[0_8px_24px_rgb(0_0_0/.25)] sm:top-28 sm:size-28">
        <Icon name="fa-solid fa-users" className="size-11! text-emerald-50" />
        <div className="mt-3 flex gap-1">
          <span className="h-1 w-4 rounded-full bg-emerald-100/80" />
          <span className="h-1 w-7 rounded-full bg-emerald-100/30" />
        </div>
      </div>
      <div className="absolute bottom-2 left-[10%] grid size-12 -rotate-12 place-items-center rounded-xl border border-emerald-200/25 bg-emerald-200/10 text-emerald-100">
        <Icon name="fa-solid fa-user-plus" className="size-6!" />
      </div>
      <span className="absolute top-1 right-[16%] font-mono text-2xl text-emerald-200/70">+</span>
    </div>
  );
}

function NormalArtwork() {
  return (
    <div
      className="relative mx-auto grid h-56 w-full max-w-80 place-items-center sm:h-64"
      aria-hidden="true"
    >
      <div className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-linear-to-r from-transparent via-orange-200/70 to-transparent" />
      <div className="absolute inset-6 rotate-45 rounded-[32px] border border-orange-200/20" />
      <svg
        className="absolute inset-0 h-full w-full text-orange-200/25"
        viewBox="0 0 320 250"
        fill="none"
      >
        <path d="m198 0-82 106h56l-47 144 104-158h-62Z" fill="currentColor" />
        <path
          d="m0 164 88-32M232 116l88-32M36 213l62-36M222 69l62-36"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute top-9 left-[4%] flex h-36 w-28 -rotate-12 items-center justify-center rounded-[28px] border-2 border-orange-200/55 bg-linear-to-br from-[#a34c29] to-[#4c2624] shadow-[0_12px_30px_rgb(0_0_0/.3)] [clip-path:polygon(15%_0,85%_0,100%_20%,90%_80%,50%_100%,10%_80%,0_20%)] sm:top-11 sm:h-40 sm:w-32">
        <Icon name="fa-solid fa-code" className="mb-3 size-12! text-orange-100" />
      </div>
      <div className="absolute top-14 right-[4%] flex h-36 w-28 rotate-12 items-center justify-center rounded-[28px] border-2 border-amber-200/55 bg-linear-to-br from-[#98642c] to-[#4d2c27] shadow-[0_12px_30px_rgb(0_0_0/.3)] [clip-path:polygon(15%_0,85%_0,100%_20%,90%_80%,50%_100%,10%_80%,0_20%)] sm:top-16 sm:h-40 sm:w-32">
        <Icon name="fa-solid fa-bolt" className="mb-3 size-12! text-amber-100" />
      </div>
      <div className="relative grid size-20 -rotate-6 place-items-center rounded-2xl border border-orange-200/60 bg-[#3c2020] font-heading text-4xl font-black italic text-orange-100 shadow-[0_0_32px_rgb(251_146_60/.25)]">
        VS
      </div>
      <div className="absolute bottom-0 flex items-center gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="grid size-7 place-items-center rounded-lg border border-orange-200/20 bg-orange-100/10"
          >
            <Icon name="fa-solid fa-user" className="size-3! text-orange-100/80" />
          </span>
        ))}
      </div>
    </div>
  );
}

function RankedArtwork() {
  return (
    <div className="relative mx-auto h-56 w-full max-w-80 sm:h-64" aria-hidden="true">
      <div className="absolute inset-x-12 top-0 h-48 rounded-full border border-gold/20" />
      <div className="absolute inset-x-16 top-4 h-40 rounded-full border border-dashed border-gold/25" />
      <svg
        className="absolute inset-0 h-full w-full text-[#e8bd62]/60"
        viewBox="0 0 320 250"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M109 175C66 152 58 105 84 68M211 175c43-23 51-70 25-107" />
        <path d="m78 81-20-4 16 23m-2 8-18 4 22 12m1 8-14 12 24 3m4 9-7 14 23-5m135-84 20-4-16 23m2 8 18 4-22 12m-1 8 14 12-24 3m-4 9 7 14-23-5" />
      </svg>
      <div className="absolute top-7 left-1/2 grid h-36 w-28 -translate-x-1/2 place-items-center border-2 border-gold/75 bg-linear-to-br from-[#ffe8aa] via-[#d4a44e] to-[#fce6ad] text-[#5b3a10] shadow-[0_10px_40px_rgb(243_197_68/.2)] [clip-path:polygon(50%_0,95%_18%,88%_74%,50%_100%,12%_74%,5%_18%)] sm:h-40 sm:w-32">
        <Icon name="fa-solid fa-crown" className="mb-4 size-14!" />
      </div>
      <div className="absolute inset-x-8 bottom-0 flex h-20 items-end justify-center gap-1.5 sm:h-24">
        <div className="flex h-11 flex-1 items-center justify-center rounded-t-lg border border-[#be9e67]/40 bg-[#4c4050] font-mono text-lg font-bold text-[#d8c9b2]">
          2
        </div>
        <div className="flex h-20 flex-1 items-center justify-center rounded-t-xl border border-gold/60 bg-linear-to-b from-[#b48b42] to-[#604832] font-mono text-3xl font-black text-[#fff0bd] sm:h-24">
          1
        </div>
        <div className="flex h-9 flex-1 items-center justify-center rounded-t-lg border border-[#bd9068]/40 bg-[#4a3440] font-mono text-lg font-bold text-[#e0b493]">
          3
        </div>
      </div>
      <span className="absolute top-3 left-12 text-xl text-gold/80">✦</span>
      <span className="absolute top-16 right-9 text-sm text-gold/70">✦</span>
    </div>
  );
}

const ARTWORKS = { PRACTICE: PracticeArtwork, NORMAL: NormalArtwork, RANKED: RankedArtwork };

export default function SurvivalModeBanner({ mode, facts }) {
  const theme = THEMES[mode] || THEMES.PRACTICE;
  const Artwork = ARTWORKS[mode] || PracticeArtwork;
  return (
    <section
      className={cn(
        'survival-mode-banner relative isolate min-w-0 overflow-hidden rounded-2xl border bg-[#14282b] shadow-sm',
        theme.frame,
      )}
      data-mode={mode}
      aria-label={t('Đấu trường đã chọn')}
    >
      <RankAmbientBackground tone={theme.tone} />
      <div
        className={cn('pointer-events-none absolute inset-0 bg-linear-to-r', theme.veil)}
        aria-hidden="true"
      />
      <div className="relative grid min-h-[330px] items-center gap-3 px-5 pt-7 pb-5 text-center sm:min-h-[350px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:gap-0 sm:px-7 sm:py-7 sm:text-left">
        <div className="relative z-10 flex min-w-0 flex-col items-center sm:items-start">
          <span
            className={cn('mb-4 grid size-12 place-items-center rounded-2xl border', theme.badge)}
            aria-hidden="true"
          >
            <Icon name={'fa-solid ' + theme.icon} className="size-6!" />
          </span>
          <h2
            className={cn(
              'font-heading text-4xl font-black leading-[1.08] tracking-tight wrap-anywhere sm:text-5xl',
              theme.title,
            )}
          >
            {t(survivalModes[mode] || survivalModes.PRACTICE)}
          </h2>
        </div>
        <Artwork />
      </div>
      <div
        className={cn('relative grid grid-cols-3 divide-x divide-white/10 border-t', theme.footer)}
      >
        {facts.map((fact, i) => (
          <span
            className="flex min-w-0 items-center justify-center gap-2 px-2 py-4 text-center text-xs font-bold sm:text-sm"
            key={fact}
          >
            <Icon
              name={'fa-solid ' + ['fa-users', 'fa-crosshairs', 'fa-medal'][i]}
              className="hidden size-3.5! shrink-0 sm:block"
              aria-hidden="true"
            />
            {t(fact)}
          </span>
        ))}
      </div>
    </section>
  );
}
