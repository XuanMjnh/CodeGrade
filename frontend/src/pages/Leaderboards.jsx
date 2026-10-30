import React, { useState, useRef } from 'react';
import { t as trUI } from '../lib/locale';
import { Heading, ErrorBox, Loading, useResource } from '../components/ui';
import RankEmblem from '../components/RankEmblem';

const METRICS = [
  { id: 'elo', field: 'elo', label: 'Elo Contest', icon: 'fa-flag-checkered', columns: ['elo', 'ac'], note: 'Elo chỉ thay đổi từ kết quả Contest có tính điểm.' },
  { id: 'ac', field: 'ac', label: 'Số bài AC', icon: 'fa-code', columns: ['ac', 'exp', 'rank'], note: 'Xếp hạng theo tổng số bài đã giải AC.' },
  { id: 'exp', field: 'exp', label: 'EXP', icon: 'fa-star', columns: ['exp', 'rank', 'normal_games', 'ranked_games'], note: 'EXP tích lũy từ các hoạt động được hệ thống ghi nhận.' },
  { id: 'rank', field: 'rank', label: 'Mức Rank', icon: 'fa-shield-halved', columns: ['rank', 'rating', 'exp', 'ranked_games'], note: 'Xếp theo điểm Rank Survival, từ cao xuống thấp. Điểm Rank độc lập với Elo Contest.' },
  { id: 'normal_games', field: 'normal_games', label: 'Số trận thường', icon: 'fa-bolt', columns: ['normal_games', 'exp', 'rank'], note: 'Chỉ đếm trận đấu thường đã kết thúc có kết quả chính thức; không tính phòng giao lưu hoặc trận bị hủy.' },
  { id: 'ranked_games', field: 'ranked_games', label: 'Số trận Rank', icon: 'fa-trophy', columns: ['ranked_games', 'rank', 'rating', 'exp'], note: 'Chỉ đếm trận Rank đã kết thúc có kết quả chính thức; không tính trận bị hủy.' }
];

const LABELS = { elo: 'Elo Contest', ac: 'Bài AC', exp: 'EXP', rank: 'Mức Rank', rating: 'Điểm Rank', normal_games: 'Trận thường', ranked_games: 'Trận Rank' };

function BoardValue({ coder, field }) {
  if (field === 'rank') {
    return (
      <span className="rank-inline">
        <RankEmblem rank={coder.rank} className="rank-emblem-small" decorative />
        <span>{trUI(coder.rank)}</span>
      </span>
    );
  }
  return Number(coder[field] ?? 0).toLocaleString(document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN');
}

export default function Leaderboard({ revision, user }) {
  const [metric, setMetric] = useState(() => {
    const requested = new URLSearchParams(location.hash.split('?')[1] || '').get('metric');
    return METRICS.some(item => item.id === requested) ? requested : 'elo';
  });

  return <LeaderboardView key={metric} metric={metric} setMetric={setMetric} revision={revision} user={user} />;
}

function LeaderboardView({ metric, setMetric, revision, user }) {
  const config = METRICS.find(item => item.id === metric) || METRICS[0];
  const [data, error] = useResource('LEADERBOARD', { metric }, revision);
  const myRowRef = useRef(null);

  const mine = data?.findIndex(coder => coder.id === user?.id) ?? -1;
  const own = mine >= 0 ? data[mine] : null;

  const scrollToMyRank = () => {
    myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Podium slots: Rank 2 (Left) - Rank 1 (Center, highest) - Rank 3 (Right)
  const podiumSlots = [
    { place: 2, index: 1, label: 'Á quân', medalIcon: 'fa-medal', tone: 'silver' },
    { place: 1, index: 0, label: 'Quán quân', medalIcon: 'fa-trophy', tone: 'gold' },
    { place: 3, index: 2, label: 'Hạng ba', medalIcon: 'fa-award', tone: 'bronze' }
  ];

  return (
    <div className="leaderboard-page">
      <Heading
        kind="leaderboard"
        title={trUI('Những người dẫn đầu')}
        highlight={{
          label: 'Dẫn đầu hiện tại',
          value: data?.[0]?.display_name || '—',
          userContent: true,
          detail: config.label
        }}
      >
        {trUI('Elo Contest, bài AC và thành tích Survival được xếp hạng theo từng tiêu chí riêng.')}
      </Heading>

      {/* STATS OVERVIEW CARDS */}
      <section className="leaderboard-stats-grid" aria-label={trUI('Tổng quan xếp hạng')}>
        <div className="lb-stat-box">
          <div className="lb-stat-icon">
            <i className="fa-solid fa-users" aria-hidden="true" />
          </div>
          <div className="lb-stat-info">
            <span className="lb-stat-label">{trUI('Coder trong top 200')}</span>
            <strong className="lb-stat-value">{data?.length ?? '—'}</strong>
          </div>
        </div>

        <div className={'lb-stat-box ' + (mine >= 0 ? 'lb-stat-box-highlight' : '')}>
          <div className="lb-stat-icon">
            <i className="fa-solid fa-ranking-star" aria-hidden="true" />
          </div>
          <div className="lb-stat-info">
            <span className="lb-stat-label">{trUI('Vị trí của bạn')}</span>
            <div className="lb-stat-row">
              <strong className="lb-stat-value">
                {user?.role !== 'CODER'
                  ? trUI('Không xếp hạng')
                  : data
                  ? mine >= 0
                    ? '#' + (mine + 1)
                    : trUI('Ngoài top 200')
                  : '—'}
              </strong>
              {mine >= 0 && (
                <button
                  type="button"
                  className="lb-jump-btn"
                  onClick={scrollToMyRank}
                  title={trUI('Cuộn đến vị trí của bạn')}
                >
                  <i className="fa-solid fa-crosshairs" aria-hidden="true" />
                  <span>{trUI('Xem vị trí')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lb-stat-box">
          <div className="lb-stat-icon">
            <i className={'fa-solid ' + config.icon} aria-hidden="true" />
          </div>
          <div className="lb-stat-info">
            <span className="lb-stat-label">{trUI('Thành tích của bạn')}</span>
            <strong className="lb-stat-value">
              {own ? <BoardValue coder={own} field={config.field} /> : '—'}
            </strong>
            <small className="lb-stat-detail">{trUI(config.label)}</small>
          </div>
        </div>
      </section>

      {/* FILTER & CRITERIA CONTROL BOX */}
      <section className="lb-control-card" aria-label={trUI('Tiêu chí xếp hạng')}>
        <div className="lb-control-header">
          <span className="lb-control-title">
            <i className="fa-solid fa-layer-group" aria-hidden="true" />
            <span>{trUI('Tiêu chí xếp hạng')}</span>
          </span>
        </div>

        <div className="lb-metric-buttons" role="tablist">
          {METRICS.map(item => {
            const isActive = metric === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                type="button"
                className={'lb-metric-btn ' + (isActive ? 'active' : '')}
                aria-selected={isActive}
                onClick={() => setMetric(item.id)}
              >
                <i className={'fa-solid ' + item.icon} aria-hidden="true" />
                <span>{trUI(item.label)}</span>
              </button>
            );
          })}
        </div>

        <div className="lb-scope-box" role="note">
          <i className="fa-solid fa-circle-info lb-scope-icon" aria-hidden="true" />
          <p className="lb-scope-text">{trUI(config.note)}</p>
        </div>
      </section>

      <ErrorBox error={error} />

      {/* PODIUM OF TOP 3 */}
      {data?.length > 0 && (
        <section className="lb-podium-section" aria-label={trUI('Ba vị trí dẫn đầu')}>
          <div className="lb-podium-header">
            <span className="lb-podium-kicker">
              <i className="fa-solid fa-award" aria-hidden="true" />
              <span>{trUI('Bục vinh danh')}</span>
            </span>
            <h2 className="lb-podium-title">{trUI('Top 3 Xuất Sắc Nhất')}</h2>
          </div>

          <div className="lb-podium-container">
            {podiumSlots.map(slot => {
              const coder = data[slot.index];
              if (!coder) return null;
              const isFirst = slot.place === 1;

              return (
                <article key={coder.id} className={'lb-podium-col place-' + slot.place}>
                  {/* Crown for 1st place */}
                  <div className="lb-podium-crown-slot">
                    {isFirst && (
                      <span className="lb-podium-crown" title={trUI('Quán quân')} aria-hidden="true">
                        <i className="fa-solid fa-crown" />
                      </span>
                    )}
                  </div>

                  {/* Avatar with rank medal badge */}
                  <div className="lb-podium-avatar-wrapper">
                    <span className="avatar lb-podium-avatar" aria-hidden="true">
                      {coder.display_name.slice(0, 1)}
                    </span>
                    <span className="lb-podium-badge">
                      <i className={'fa-solid ' + slot.medalIcon} aria-hidden="true" />
                      <span>{slot.place}</span>
                    </span>
                  </div>

                  {/* User info */}
                  <div className="lb-podium-meta">
                    <h3 className="lb-podium-name" data-user-content title={coder.display_name}>
                      {coder.display_name}
                    </h3>
                    <small className="lb-podium-username" data-user-content>
                      @{coder.username}
                    </small>
                  </div>

                  {/* Score pill */}
                  <div className="lb-podium-score-pill">
                    <strong className="lb-podium-score-val">
                      <BoardValue coder={coder} field={config.field} />
                    </strong>
                    <small className="lb-podium-score-sub">{trUI(config.label)}</small>
                  </div>

                  {/* 3D Pedestal Pillar */}
                  <div className={'lb-podium-pillar pillar-' + slot.place}>
                    <div className="lb-pillar-surface">
                      <span className="lb-pillar-number">{slot.place}</span>
                      <span className="lb-pillar-label">{trUI(slot.label)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="lb-podium-stage-ground" aria-hidden="true" />
        </section>
      )}

      {/* FULL LEADERBOARD TABLE BOX */}
      <section className="lb-table-section">
        <div className="lb-table-header">
          <div>
            <h2 className="lb-table-title">
              <i className="fa-solid fa-table-list" aria-hidden="true" />
              <span>{trUI('Bảng xếp hạng')} · {trUI(config.label)}</span>
            </h2>
            <p className="lb-table-subtitle">{trUI('Chỉ tài khoản Coder đang hoạt động được tính hạng.')}</p>
          </div>
          {mine >= 0 && (
            <button
              type="button"
              className="lb-btn-outline"
              onClick={scrollToMyRank}
            >
              <i className="fa-solid fa-location-crosshairs" aria-hidden="true" />
              <span>{trUI('Vị trí của bạn')} (#{mine + 1})</span>
            </button>
          )}
        </div>

        {!data ? (
          !error && <Loading />
        ) : (
          <div className="paper lb-table-card table-wrap" role="region" aria-label={trUI('Bảng dữ liệu')} tabIndex={0}>
            <table className="lb-table">
              <thead>
                <tr>
                  <th className="lb-th-rank">{trUI('Hạng')}</th>
                  <th className="lb-th-coder">{trUI('Coder')}</th>
                  {config.columns.map(field => (
                    <th key={field} className="lb-th-stat">{trUI(LABELS[field])}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((coder, index) => {
                  const isTop3 = index < 3;
                  const isMe = coder.id === user?.id;

                  return (
                    <tr
                      key={coder.id}
                      ref={isMe ? myRowRef : undefined}
                      className={(isTop3 ? 'lb-row-top lb-row-top-' + (index + 1) + ' ' : '') + (isMe ? 'lb-row-me my-rank' : '')}
                    >
                      <td className="lb-td-rank">
                        <span className={'lb-rank-badge rank-pos-' + (index + 1)}>
                          {index === 0 ? (
                            <><i className="fa-solid fa-trophy" aria-hidden="true" /><span className="sr-only">1</span></>
                          ) : index === 1 ? (
                            <><i className="fa-solid fa-medal" aria-hidden="true" /><span className="sr-only">2</span></>
                          ) : index === 2 ? (
                            <><i className="fa-solid fa-award" aria-hidden="true" /><span className="sr-only">3</span></>
                          ) : (
                            index + 1
                          )}
                        </span>
                      </td>
                      <td className="lb-td-coder">
                        <div className="lb-coder-cell">
                          <span className="avatar lb-mini-avatar" aria-hidden="true">
                            {coder.display_name.slice(0, 1)}
                          </span>
                          <div className="lb-coder-info">
                            <span className="lb-coder-name">
                              <b data-user-content>{coder.display_name}</b>
                              {isMe && <span className="lb-me-tag">{trUI('Bạn')}</span>}
                            </span>
                            <small data-user-content className="lb-coder-username">@{coder.username}</small>
                          </div>
                        </div>
                      </td>
                      {config.columns.map(field => (
                        <td key={field} className="lb-td-stat">
                          <BoardValue coder={coder} field={field} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!data.length && <div className="empty">{trUI('Chưa có Coder.')}</div>}
          </div>
        )}
      </section>
    </div>
  );
}
