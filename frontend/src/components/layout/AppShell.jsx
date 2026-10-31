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
  Code2,
  Swords,
  Trophy,
  BarChart3,
  History,
  X,
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
  ['practice', 'Luyện tập', Code2],
  ['survival', 'Code Survival', Swords],
  ['contests', 'Contest', Trophy],
  ['leaderboard', 'Xếp hạng', BarChart3],
  ['submissions', 'Bài nộp', History],
];
const roles = { ADMIN: 'Admin', AUTHOR: 'Người tạo đề', CODER: 'Coder' };
export function Logo({ network = false }) {
  return (
    <a
      href="#/practice"
      className="brand group inline-flex shrink-0 items-center gap-2.5 font-heading text-base min-[561px]:text-lg font-black tracking-tight text-foreground no-underline transition-opacity hover:opacity-90"
    >
      <span className="brand-icon flex size-8 min-[561px]:size-9 items-center justify-center rounded-xl bg-gradient-to-br from-action via-orange-600 to-amber-600 text-white shadow-xs shadow-orange-500/25 transition-transform duration-200 group-hover:scale-105">
        <Terminal className="size-4.5 min-[561px]:size-5" />
      </span>
      <span className="flex items-center gap-1.5">
        <span>CodeGrade</span>
        {network ? (
          <span className="rounded-md bg-muted px-1.5 py-0.2 font-mono text-[10px] font-bold text-muted-foreground">
            NET
          </span>
        ) : (
          <span className="size-1.5 rounded-full bg-action" />
        )}
      </span>
    </a>
  );
}
function Navigation({ page, mobile = false, onNavigate }) {
  return (
    <nav
      aria-label={t('Điều hướng chính')}
      className={
        mobile
          ? 'grid gap-1 py-2'
          : 'hidden flex-1 items-center gap-1 min-[1081px]:flex px-2'
      }
    >
      {navigation.map(([key, label, IconComponent]) => {
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
              'group inline-flex items-center gap-2 whitespace-nowrap text-xs font-bold transition-all duration-200 rounded-xl px-3 py-2',
              selected
                ? 'selected text-action bg-action/10 shadow-2xs font-extrabold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              mobile && 'w-full px-3.5 py-2.5 text-sm',
              mobile && selected && 'bg-action/10 text-action',
            )}
          >
            <IconComponent
              className={cn(
                'size-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                selected ? 'text-action' : 'text-muted-foreground/70 group-hover:text-foreground',
              )}
            />
            <span>{t(label)}</span>
          </a>
        );
      })}
    </nav>
  );
}
function AccountMenu({ user }) {
  const roleBadgeColor = {
    ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    AUTHOR: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    CODER: 'bg-action/10 text-action border-action/20',
  }[user.role] || 'bg-muted text-muted-foreground';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9.5 gap-2 px-2 rounded-xl hover:bg-muted/60 transition-all cursor-pointer font-normal"
          aria-label={t('Mở menu tài khoản')}
        >
          <span className="avatar flex size-7.5 items-center justify-center rounded-xl border border-action/30 bg-action/10 text-action font-heading text-xs font-black shadow-2xs">
            {user.displayName?.slice(0, 1)?.toUpperCase() || 'U'}
          </span>
          <span
            className="hidden max-w-[120px] truncate text-xs font-bold text-foreground min-[561px]:block"
            data-user-content
          >
            {user.displayName}
          </span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground/80 min-[561px]:block transition-transform duration-200" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px] rounded-2xl p-2.5 shadow-raised border-border/80">
        <div className="flex items-center gap-3 p-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-action/30 bg-action/10 text-action font-heading text-base font-black shadow-2xs">
            {user.displayName?.slice(0, 1)?.toUpperCase() || 'U'}
          </span>
          <div className="min-w-0 flex-1">
            <span className="block font-heading text-sm font-extrabold text-foreground truncate" data-user-content>
              {user.displayName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('rounded-md px-1.5 py-0.2 font-mono text-[9px] font-bold border', roleBadgeColor)}>
                {t(roles[user.role])}
              </span>
              <span className="text-[11px] text-muted-foreground truncate font-mono">
                @{user.username}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2">
          <a href="#/profile" className="flex items-center gap-2.5 text-xs font-semibold">
            <User className="size-4 text-action" />
            <span>{t('Thông tin cá nhân')}</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2">
          <a href="#/announcements" className="flex items-center gap-2.5 text-xs font-semibold">
            <Bell className="size-4 text-amber-500" />
            <span>{t('Thông báo')}</span>
          </a>
        </DropdownMenuItem>
        {user.role !== 'CODER' && (
          <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2">
            <a href="#/categories" className="flex items-center gap-2.5 text-xs font-semibold">
              <FolderOpen className="size-4 text-blue-500" />
              <span>{t('Danh mục')}</span>
            </a>
          </DropdownMenuItem>
        )}
        {user.role === 'ADMIN' && (
          <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2">
            <a href="#/admin" className="flex items-center gap-2.5 text-xs font-semibold">
              <ShieldCheck className="size-4 text-purple-500" />
              <span>{t('Quản trị')}</span>
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem
          className="rounded-xl cursor-pointer py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
          onSelect={() => live.logout().catch(() => {})}
        >
          <LogOut className="size-4" />
          <span className="font-semibold text-xs">{t('Đăng xuất')}</span>
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
      className="header-search relative hidden w-48 lg:w-56 xl:w-64 shrink-0 min-[1200px]:block"
      onSubmit={(event) => {
        event.preventDefault();
        if (query.trim()) {
          location.hash = '/practice?search=' + encodeURIComponent(query.trim());
        }
      }}
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        className="h-9 w-full rounded-xl border border-border/80 bg-slate-100/60 dark:bg-slate-900/50 pl-8.5 pr-8 text-xs font-medium shadow-2xs transition-all focus-visible:border-action focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-action/20"
        aria-label={t('Tìm bài tập')}
        placeholder={t('Tìm bài tập…')}
        value={query}
        maxLength={100}
        onChange={(event) => setQuery(event.target.value)}
      />
      <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/60 bg-muted px-1.5 font-mono text-[9px] font-bold text-muted-foreground pointer-events-none">
        /
      </kbd>
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
        className="header sticky top-0 z-40 flex w-full flex-wrap items-center gap-3 border-b border-border/80 bg-card/95 backdrop-blur-md px-4 py-2.5 shadow-2xs min-[561px]:gap-5 min-[561px]:px-6 min-[1081px]:flex-nowrap"
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
        <div className="user-menu ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer hidden min-[561px]:inline-flex"
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
          className="nav-toggle size-9 rounded-xl border-border/80 hover:bg-muted/60 min-[1081px]:hidden cursor-pointer"
          aria-label={t('Mở điều hướng')}
          aria-controls="mobile-navigation"
          aria-expanded={mobile}
          onClick={() => setMobile((value) => !value)}
        >
          {mobile ? <X className="size-5 text-action" /> : <Menu className="size-5" />}
        </Button>
        <div
          id="mobile-navigation"
          hidden={!mobile}
          className="order-last basis-full py-2 min-[1081px]:hidden border-t border-border/60 mt-1"
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
