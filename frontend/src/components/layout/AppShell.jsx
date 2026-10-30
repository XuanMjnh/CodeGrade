import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Terminal,
  User,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react';
import { t, LanguageButton } from '../../lib/locale';
import { live } from '../../lib/live';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import Utilities from '../Utilities';

const navigation = [
  ['practice', 'Luyện tập'],
  ['survival', 'Code Survival'],
  ['contests', 'Contest'],
  ['leaderboard', 'Xếp hạng'],
  ['submissions', 'Bài nộp'],
];
const roles = { ADMIN: 'Admin', AUTHOR: 'Người tạo đề', CODER: 'Coder' };
export function Logo({ network = false }) {
  return (
    <a
      href="#/practice"
      className="brand inline-flex shrink-0 items-center gap-2 font-heading text-base min-[561px]:gap-2.5 min-[561px]:text-lg font-bold tracking-[-.03em] text-foreground no-underline"
    >
      <span className="brand-icon flex size-[30px] min-[561px]:size-9 items-center justify-center rounded-[10px] bg-action text-white">
        <Terminal className="size-5" />
      </span>
      CodeGrade {network && <span className="font-normal text-muted-foreground">Network</span>}
    </a>
  );
}
function Navigation({ page, mobile = false, onNavigate }) {
  return (
    <nav
      aria-label={t('Điều hướng chính')}
      className={
        mobile
          ? 'grid gap-1'
          : 'hidden flex-1 items-stretch gap-[22px] self-stretch min-[1081px]:flex'
      }
    >
      {navigation.map(([key, label]) => {
        const selected =
          page === key ||
          (key === 'practice' && ['solve', 'edit'].includes(page)) ||
          (key === 'survival' && page === 'room');
        return (
          <a
            key={key}
            href={`#/${key}`}
            aria-current={selected ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'inline-flex min-h-11 items-center whitespace-nowrap text-xs font-semibold transition-colors hover:text-success',
              mobile ? 'rounded-lg px-3 py-2' : 'border-b-2 border-transparent',
              selected ? 'selected border-action-text text-action-text' : 'text-muted-foreground',
              mobile && selected && 'bg-accent text-success',
            )}
          >
            {t(label)}
          </a>
        );
      })}
    </nav>
  );
}
function AccountMenu({ user }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 gap-2 px-1 font-normal"
          aria-label={t('Mở menu tài khoản')}
        >
          <span className="avatar flex size-8 items-center justify-center rounded-full border bg-muted text-xs font-semibold">
            {user.displayName.slice(0, 1)}
          </span>
          <span
            className="hidden max-w-[110px] truncate text-xs min-[561px]:block"
            data-user-content
          >
            {user.displayName}
          </span>
          <ChevronDown className="hidden size-3 text-muted-foreground min-[561px]:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px] rounded-[14px] p-3 shadow-raised">
        <DropdownMenuLabel className="grid gap-1">
          <span data-user-content>{user.displayName}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {t(roles[user.role])} · @{user.username}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="#/profile">
            <User />
            {t('Thông tin cá nhân')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="#/announcements">
            <Bell />
            {t('Thông báo')}
          </a>
        </DropdownMenuItem>
        {user.role !== 'CODER' && (
          <DropdownMenuItem asChild>
            <a href="#/categories">
              <FolderOpen />
              {t('Danh mục')}
            </a>
          </DropdownMenuItem>
        )}
        {user.role === 'ADMIN' && (
          <DropdownMenuItem asChild>
            <a href="#/admin">
              <ShieldCheck />
              {t('Quản trị')}
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => live.logout().catch(() => {})}
        >
          <LogOut />
          {t('Đăng xuất')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function SearchBox() {
  const [query, setQuery] = useState('');
  return (
    <form
      role="search"
      className="header-search relative hidden w-[200px] shrink-0 min-[1440px]:block"
      onSubmit={(event) => {
        event.preventDefault();
        location.hash = '/practice?search=' + encodeURIComponent(query.trim());
      }}
    >
      <Input
        type="search"
        className="h-11 rounded-[10px] border-border bg-muted pr-11 text-xs shadow-none"
        aria-label={t('Tìm bài tập')}
        placeholder={t('Tìm bài tập…')}
        value={query}
        maxLength={100}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute top-0 right-0 text-muted-foreground"
        aria-label={t('Tìm kiếm')}
      >
        <Search className="size-4" />
      </Button>
    </form>
  );
}
export default function AppShell({ user, status, page, revision, children }) {
  const [mobile, setMobile] = useState(false);
  const navigationToggle = useRef(null);
  useEffect(() => {
    const close = () => setMobile(false);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, []);
  const arena = ['survival', 'room'].includes(page);
  const focused = arena || ['edit', 'solve'].includes(page);
  return (
    <div
      className={cn(
        'app-shell min-h-dvh',
        arena ? 'shell-arena' : page === 'edit' ? 'shell-studio' : 'shell-platform',
      )}
    >
      <a
        className="sr-only z-[100] focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:rounded-md focus:border focus:bg-card focus:p-3"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        {t('Đến nội dung chính')}
      </a>
      <header
        className="header sticky top-0 z-40 flex w-full flex-wrap items-center gap-3 border-b bg-card px-4 py-3 shadow-subtle min-[561px]:gap-6 min-[561px]:px-6 min-[561px]:py-3.5 min-[1081px]:flex-nowrap"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && mobile) {
            setMobile(false);
            navigationToggle.current?.focus();
          }
        }}
      >
        <Logo />
        <Navigation page={page} />
        <SearchBox />
        <div className="user-menu ml-auto flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-muted-foreground min-[561px]:inline-flex"
            asChild
          >
            <a href="#/announcements" aria-label={t('Thông báo')}>
              <Bell className="size-4" />
            </a>
          </Button>
          <LanguageButton />
          <AccountMenu user={user} />
        </div>
        <Button
          ref={navigationToggle}
          variant="outline"
          size="icon"
          className="nav-toggle min-[1081px]:hidden"
          aria-label={t('Mở điều hướng')}
          aria-controls="mobile-navigation"
          aria-expanded={mobile}
          onClick={() => setMobile((value) => !value)}
        >
          <Menu className="size-5" />
        </Button>
        <div
          id="mobile-navigation"
          hidden={!mobile}
          className="order-last basis-full py-2 min-[1081px]:hidden"
        >
          <Navigation page={page} mobile onNavigate={() => setMobile(false)} />
        </div>
      </header>
      {status === 'offline' && (
        <div
          role="status"
          className="border-b border-warning/30 bg-warning-soft px-5 py-3 text-center text-sm text-warning"
        >
          {t('Mất kết nối. Đang kết nối lại và khôi phục sự kiện; đồng hồ trận vẫn chạy.')}
        </div>
      )}
      <div
        className={cn(
          'app-layout mx-auto grid items-start gap-6 px-4 py-5 min-[561px]:px-5 min-[561px]:py-6 min-[851px]:px-6 min-[851px]:py-8',
          focused
            ? 'layout-focused max-w-[1600px] grid-cols-[minmax(0,1fr)]'
            : 'max-w-[1920px] grid-cols-[minmax(0,1fr)] min-[851px]:grid-cols-[minmax(0,1fr)_190px] min-[1440px]:grid-cols-[210px_minmax(0,1fr)_210px]',
          arena && 'max-w-[1480px]',
        )}
      >
        {!focused && (
          <div className="hidden min-w-0 min-[1440px]:sticky min-[1440px]:top-[104px] min-[1440px]:block">
            <Utilities side="left" revision={revision} />
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="main min-h-[calc(100vh-200px)] w-full min-w-0 outline-none"
        >
          <div className="space-y-4 sm:space-y-5">{children}</div>
        </main>
        {!focused && (
          <div className="min-w-0 min-[851px]:sticky min-[851px]:top-[104px]">
            <Utilities side="right" revision={revision} />
          </div>
        )}
      </div>
      <footer className="footer mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-4 border-t px-4 py-6 text-[11px] text-muted-foreground sm:px-6">
        <b>CodeGrade Network</b>
        <span>{t('Giải nhanh. Trụ vững. Chiến thắng.')}</span>
        <span>© 2026 CodeGrade</span>
      </footer>
    </div>
  );
}
