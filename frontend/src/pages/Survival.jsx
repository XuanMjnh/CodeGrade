import React, { useEffect, useState } from 'react';
import { live } from '../lib/live';
import { ErrorBox, Loading, useResource, go } from '../components/ui';
import SurvivalRoomView from './SurvivalRoomView';
export { DifficultyChecks } from '../components/SurvivalKit';
export { default as Rooms } from './SurvivalLobby';

export function Room({ id, user, revision, onNotice }) {
  const [mine, mineError] = useResource('SUBMISSIONS', {}, revision);
  const [selectedSubmission, selectSubmission] = useState(null);
  const [seconds, Seconds] = useState(120),
    [finalSeconds, FinalSeconds] = useState(150),
    [capacity, Capacity] = useState(10),
    [name, Name] = useState('');
  const [r, setRoom] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [levels, setLevels] = useState([1, 2, 3]);
  function applyRoom(room) {
    setRoom(room);
    setLevels(room.selectedDifficulties);
    Seconds(room.roundSeconds || 120);
    FinalSeconds(room.finalSeconds || 150);
    Capacity(room.capacity || 10);
    Name(room.name || 'Code Survival');
  }
  useEffect(() => {
    const touch = () => {
      live.call('ROOM_TOUCH', { roomId: id }).catch(() => {});
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
      .call('ROOM_JOIN', { roomId: id })
      .then((room) => {
        if (active) applyRoom(room);
      })
      .catch((e) => {
        if (active) setError(e);
      });
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    if (!r) return;
    let active = true;
    live
      .call('ROOM_SNAPSHOT', { roomId: id })
      .then((room) => {
        if (active) applyRoom(room);
      })
      .catch((e) => {
        if (active) setError(e);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  async function action(type, payload = {}) {
    setError(null);
    setBusy(true);
    try {
      const room = await live.call(type, { roomId: r.id, ...payload });
      if (room.deleted || type === 'ROOM_LEAVE') {
        go('/survival');
        return;
      }
      applyRoom(room);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function matchAction(type) {
    setError(null);
    setBusy(true);
    try {
      await live.call(type, { roomId: r.id });
      go('/survival');
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
  return (
    <SurvivalRoomView
      room={r}
      user={user}
      revision={revision}
      onNotice={onNotice}
      action={action}
      matchAction={matchAction}
      busy={busy}
      error={error}
      setError={setError}
      config={{ name, seconds, finalSeconds, capacity, levels }}
      updateConfig={{
        name: Name,
        seconds: Seconds,
        finalSeconds: FinalSeconds,
        capacity: Capacity,
        levels: setLevels,
      }}
      submissions={mine}
      submissionError={mineError}
      selectedSubmission={selectedSubmission}
      selectSubmission={selectSubmission}
    />
  );
}
