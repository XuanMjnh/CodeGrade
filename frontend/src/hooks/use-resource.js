import { useEffect, useState } from 'react';
import { live } from '../lib/live';
const pending = new Map();
function request(type, payload, key) {
  if (!pending.has(key))
    pending.set(
      key,
      Promise.resolve()
        .then(() => live.call(type, payload))
        .finally(() => pending.delete(key)),
    );
  return pending.get(key);
}
export function useResource(type, payload = {}, revision = 0) {
  const key = JSON.stringify(payload);
  const [data, setData] = useState(null),
    [error, setError] = useState(null);
  useEffect(() => {
    if (!type) return;
    let active = true;
    setError(null);
    request(type, JSON.parse(key), `${live.token || 'anonymous'}:${type}:${key}:${revision}`)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((reason) => {
        if (active) setError(reason);
      });
    return () => {
      active = false;
    };
  }, [type, key, revision]);
  return [data, error, setData];
}
