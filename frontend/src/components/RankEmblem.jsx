import React, { useId } from 'react';

export const RANK_STYLES = {
  bronze: 'border-[#a95f32] bg-[#fcf0e4] text-[#a95f32]',
  silver: 'border-[#62788a] bg-[#f0f4f7] text-[#62788a]',
  gold: 'border-[#a87612] bg-[#fff7da] text-[#a87612]',
  platinum: 'border-[#24826c] bg-[#e9f7f1] text-[#24826c]',
  diamond: 'border-[#237d9d] bg-[#eaf8fc] text-[#237d9d]',
  master: 'border-[#b84e23] bg-[#fff0e4] text-[#b84e23]',
};

// Names match the six tiers returned by the progression service.
export const RANK_TIERS = [
  {
    id: 'bronze',
    name: 'Đồng',
    color: '#a95f32',
    light: '#f5d6ad',
    soft: '#fcf0e4',
    level: 0,
  },
  {
    id: 'silver',
    name: 'Bạc',
    color: '#62788a',
    light: '#e8f0f6',
    soft: '#f0f4f7',
    level: 1,
  },
  {
    id: 'gold',
    name: 'Vàng',
    color: '#a87612',
    light: '#ffe89a',
    soft: '#fff7da',
    level: 2,
  },
  {
    id: 'platinum',
    name: 'Bạch Kim',
    color: '#24826c',
    light: '#bceee0',
    soft: '#e9f7f1',
    level: 3,
  },
  {
    id: 'diamond',
    name: 'Kim Cương',
    color: '#237d9d',
    light: '#b9edff',
    soft: '#eaf8fc',
    level: 4,
  },
  {
    id: 'master',
    name: 'Cao Thủ',
    color: '#b84e23',
    light: '#ffce77',
    soft: '#fff0e4',
    level: 5,
  },
];
const UNRANKED = {
  id: 'unranked',
  name: 'Chưa xếp hạng',
  color: '#76857d',
  light: '#e5ebe7',
  soft: '#f4f6f5',
  level: -1,
};
export function getRankTier(rank) {
  const value = String(rank || '')
    .trim()
    .toLowerCase();
  return (
    RANK_TIERS.find((tier) => tier.name.toLowerCase() === value || tier.id === value) || UNRANKED
  );
}
export default function RankEmblem({ rank, className = '', decorative = false }) {
  const tier = getRankTier(rank),
    id = 'rank-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const metal = 'url(#' + id + '-metal)',
    inner = 'url(#' + id + '-inner)';
  let symbol;
  switch (tier.id) {
    case 'bronze':
      symbol = <path d="m43 57 17-13 17 13v13L60 57 43 70Z" />;
      break;
    case 'silver':
      symbol = (
        <>
          <path d="m42 49 18-13 18 13v9L60 45 42 58Z" />
          <path d="m42 66 18-13 18 13v9L60 62 42 75Z" />
        </>
      );
      break;
    case 'gold':
      symbol = <path d="m60 33 7 15 17 2-12 12 3 17-15-8-15 8 3-17-12-12 17-2Z" />;
      break;
    case 'platinum':
      symbol = (
        <>
          <path d="m60 30 21 25-21 28-21-28Z" />
          <path d="m60 40 12 15-12 17-12-17Z" fill="white" fillOpacity=".85" />
        </>
      );
      break;
    case 'diamond':
      symbol = (
        <>
          <path d="m43 37 34 0 12 17-29 31-29-31Z" />
          <path
            d="m43 37 7 17 10-17 10 17 7-17M31 54h58M50 54l10 31 10-31"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </>
      );
      break;
    case 'master':
      symbol = (
        <>
          <path d="m34 43 14 11 12-23 12 23 14-11-6 31H40Z" />
          <path
            d="M43 80h34"
            fill="none"
            stroke={tier.color}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="m60 49 5 8-5 8-5-8Z" fill="white" />
        </>
      );
      break;
    default:
      symbol = (
        <path
          d="M60 43v21m0 9v1"
          fill="none"
          stroke={tier.color}
          strokeWidth="5"
          strokeLinecap="round"
        />
      );
  }
  return (
    <svg
      className={
        'size-12 shrink-0 rank-emblem rank-emblem-' +
        tier.id +
        '  ' +
        (className.includes('small') ? '!size-8 ' : '') +
        className
      }
      viewBox="0 0 120 124"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Huy hiệu ' + tier.name}
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      <defs>
        <linearGradient id={id + '-metal'} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={tier.light} />
          <stop offset=".48" stopColor={tier.color} />
          <stop offset="1" stopColor={tier.light} />
        </linearGradient>
        <linearGradient id={id + '-inner'} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="white" />
          <stop offset="1" stopColor={tier.soft} />
        </linearGradient>
      </defs>
      {tier.level >= 2 && (
        <g fill={metal} stroke={tier.color} strokeWidth="2" strokeLinejoin="round">
          <path d="M30 38 7 25l5 20 16 9L9 49l7 19 14 11Z" />
          <path d="m90 38 23-13-5 20-16 9 19-5-7 19-14 11Z" />
        </g>
      )}
      <path
        d="m60 10 35 15v34c0 24-16 41-35 53-19-12-35-29-35-53V25Z"
        fill={metal}
        stroke={tier.color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="m60 20 26 11v28c0 19-12 32-26 43-14-11-26-24-26-43V31Z"
        fill={inner}
        stroke="white"
        strokeOpacity=".7"
        strokeWidth="2"
      />
      {tier.level === 5 && (
        <path
          d="m42 18-4-13 14 7 8-10 8 10 14-7-4 13"
          fill={metal}
          stroke={tier.color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      <g fill={tier.color}>{symbol}</g>
      <g fill={tier.color}>
        {Array.from(
          {
            length: Math.max(1, tier.level + 1),
          },
          (_, i) => (
            <circle key={i} cx={60 + (i - Math.max(0, tier.level) / 2) * 6} cy="91" r="1.7" />
          ),
        )}
      </g>
    </svg>
  );
}
