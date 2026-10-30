import React, { lazy, Suspense, useEffect } from 'react';
import { toast } from 'sonner';
import { live } from './lib/live';
import { t } from './lib/locale';
import { useApplication } from './hooks/use-application';
import Auth from './components/Auth';
import AppShell from './components/layout/AppShell';
import { ErrorBox, Loading } from './components/ui';
import { Toaster } from './components/ui/sonner';
const named = (load, name) =>
  lazy(() =>
    load().then((module) => ({
      default: module[name],
    })),
  );
const Practice = lazy(() => import('./pages/Practice'));
const Workspace = lazy(() => import('./pages/Workspace'));
const QuestionEditor = lazy(() => import('./pages/QuestionEditor'));
const Rooms = named(() => import('./pages/Survival'), 'Rooms'),
  Room = named(() => import('./pages/Survival'), 'Room');
const Submissions = named(() => import('./pages/Records'), 'SubmissionsPage'),
  Leaderboard = named(() => import('./pages/Records'), 'Leaderboard');
const Categories = named(() => import('./pages/Records'), 'Categories'),
  Admin = named(() => import('./pages/Records'), 'Admin');
const Profile = named(() => import('./pages/Community'), 'Profile'),
  Announcements = named(() => import('./pages/Community'), 'Announcements');
const Contests = lazy(() => import('./pages/Contests'));
export default function App() {
  const { user, setUser, status, path, revision, notice, onNotice } = useApplication();
  useEffect(() => {
    if (notice && user)
      toast(notice, {
        duration: 6000,
      });
  }, [notice]);
  if (!user) {
    if (live.token && status !== 'anonymous')
      return (
        <div className="flex min-h-dvh items-center justify-center">
          <Loading />
        </div>
      );
    return <Auth onUser={setUser} status={status} notice={notice} />;
  }
  const [route, query] = path.split('?'),
    parts = route.split('/').filter(Boolean),
    page = parts[0] || 'practice',
    id = parts[1],
    author = user.role !== 'CODER';
  const props = {
    user,
    revision,
    onNotice,
  };
  let content;
  switch (page) {
    case 'profile':
      content = <Profile {...props} onUserChange={setUser} />;
      break;
    case 'announcements':
      content = <Announcements {...props} />;
      break;
    case 'practice':
      content = <Practice {...props} />;
      break;
    case 'solve': {
      const contestId = new URLSearchParams(query).get('contest');
      content = (
        <Workspace
          key={`${contestId || 'practice'}-${id}`}
          {...props}
          id={id}
          contestId={contestId}
        />
      );
      break;
    }
    case 'edit':
      content = author ? (
        <QuestionEditor key={id || 'new'} id={id} {...props} />
      ) : (
        <ErrorBox error={t('Bạn không có quyền tạo/sửa đề.')} />
      );
      break;
    case 'survival':
      content = <Rooms {...props} />;
      break;
    case 'room':
      content = <Room key={id} id={id} {...props} />;
      break;
    case 'submissions':
      content = <Submissions {...props} />;
      break;
    case 'leaderboard':
      content = <Leaderboard {...props} />;
      break;
    case 'categories':
      content = author ? (
        <Categories {...props} />
      ) : (
        <ErrorBox error={t('Bạn không có quyền quản lý category.')} />
      );
      break;
    case 'admin':
      content =
        user.role === 'ADMIN' ? (
          <Admin {...props} />
        ) : (
          <ErrorBox error={t('Bạn không có quyền Admin.')} />
        );
      break;
    case 'contests':
      content = <Contests {...props} contestId={id} />;
      break;
    default:
      content = (
        <div className="rounded-xl border bg-card p-8 text-center">
          {t('Trang không tồn tại.')}{' '}
          <a className="text-primary hover:underline" href="#/practice">
            {t('Về Practice')}
          </a>
        </div>
      );
  }
  return (
    <>
      <AppShell user={user} status={status} page={page} revision={revision}>
        <Suspense fallback={<Loading />}>{content}</Suspense>
      </AppShell>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
