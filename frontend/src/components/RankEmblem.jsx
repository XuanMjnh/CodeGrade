import React from 'react';
import { cn } from '../lib/utils';

export const RANK_STYLES = {
  iron: 'border-[#5c5453] bg-[#edeae9] text-[#5c5453]',
  bronze: 'border-[#a95f32] bg-[#fcf0e4] text-[#a95f32]',
  silver: 'border-[#62788a] bg-[#f0f4f7] text-[#62788a]',
  gold: 'border-[#a87612] bg-[#fff7da] text-[#a87612]',
  platinum: 'border-[#24826c] bg-[#e9f7f1] text-[#24826c]',
  diamond: 'border-[#237d9d] bg-[#eaf8fc] text-[#237d9d]',
  master: 'border-[#b84e23] bg-[#fff0e4] text-[#b84e23]',
  grandmaster: 'border-[#c0392b] bg-[#fdf0ef] text-[#c0392b]',
  challenger: 'border-[#2980b9] bg-[#ebf5fb] text-[#2980b9]',
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

const EXTRA_TIERS = [
  {
    id: 'iron',
    name: 'Sắt',
    color: '#5c5453',
    light: '#d2cdcb',
    soft: '#edeae9',
    level: -1,
  },
  {
    id: 'grandmaster',
    name: 'Đại Cao Thủ',
    color: '#c0392b',
    light: '#f9d5d1',
    soft: '#fdf0ef',
    level: 6,
  },
  {
    id: 'challenger',
    name: 'Thách Đấu',
    color: '#2980b9',
    light: '#d4e6f1',
    soft: '#ebf5fb',
    level: 7,
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

export const RANK_IMAGES = {
  bronze: '/ranks/bronze.png',
  silver: '/ranks/silver.png',
  gold: '/ranks/gold.png',
  platinum: '/ranks/platinum.png',
  diamond: '/ranks/diamond.png',
  master: '/ranks/master.png',
  grandmaster: '/ranks/grandmaster.png',
  challenger: '/ranks/challenger.png',
  iron: '/ranks/iron.png',
  unranked: '/ranks/unranked.png',
};

export function getRankTier(rank) {
  const value = String(rank || '')
    .trim()
    .toLowerCase();
  return (
    RANK_TIERS.find((tier) => tier.name.toLowerCase() === value || tier.id === value) ||
    EXTRA_TIERS.find((tier) => tier.name.toLowerCase() === value || tier.id === value) ||
    UNRANKED
  );
}

export default function RankEmblem({ rank, className = '', decorative = false }) {
  const tier = getRankTier(rank);
  const src = RANK_IMAGES[tier.id] || RANK_IMAGES.unranked;

  return (
    <img
      src={src}
      alt={decorative ? '' : `Huy hiệu Rank ${tier.name}`}
      aria-hidden={decorative ? 'true' : undefined}
      loading="lazy"
      decoding="async"
      className={cn(
        'inline-block size-12 shrink-0 object-contain select-none pointer-events-none',
        'rank-emblem rank-emblem-' + tier.id,
        className,
      )}
    />
  );
}
