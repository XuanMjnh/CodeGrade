import { useEffect, useState } from 'react';
import { live } from '../lib/live';
export function useApplication() {
  const [user, setUser] = useState(null),
    [status, setStatus] = useState('connecting');
  const [path, setPath] = useState(location.hash.slice(1) || '/practice'),
    [revision, setRevision] = useState(0),
    [notice, setNotice] = useState('');
  useEffect(() => {
    let timer;
    const offState = live.onState(setStatus);
    const off = live.subscribe((message) => {
      if (message.event === 'announcement_published') setNotice(message.data.title);
      if (message.event === 'logged_out') {
        setUser(null);
        return;
      }
      if (message.event === 'connected' && live.token)
        live
          .call('SYNC')
          .then((data) => {
            setUser(data.user);
            setRevision((value) => value + 1);
          })
          .catch(() => live.clearAuth());
      if (!timer)
        timer = setTimeout(() => {
          timer = null;
          setRevision((value) => value + 1);
        }, 200);
    });
    live.connect();
    let previous = location.hash;
    const navigate = () => {
      const guard = new CustomEvent('codegrade:before-navigate', {
        cancelable: true,
      });
      window.dispatchEvent(guard);
      if (guard.defaultPrevented) {
        history.replaceState(null, '', location.pathname + location.search + previous);
        return;
      }
      previous = location.hash;
      setPath(location.hash.slice(1) || '/practice');
    };
    window.addEventListener('hashchange', navigate);
    return () => {
      off();
      offState();
      clearTimeout(timer);
      window.removeEventListener('hashchange', navigate);
    };
  }, []);
  const onNotice = (message) => {
    setNotice(message);
    setRevision((value) => value + 1);
  };
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  return {
    user,
    setUser,
    status,
    path,
    revision,
    notice,
    onNotice,
  };
}
