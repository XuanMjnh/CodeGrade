import React, { useId } from 'react';
import { AlertCircle, HelpCircle, LoaderCircle } from 'lucide-react';
import { t, locale } from '../lib/locale';
import { formatCountdown } from '../lib/time';
import { cn } from '../lib/utils';
import { useServerTime } from '../hooks/use-server-time';
import PageBanner from './PageBanner';
import { Badge as BaseBadge } from './ui/badge';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { Button } from './ui/button';
export { Button } from './ui/button';
export { Input } from './ui/input';
export { Textarea } from './ui/textarea';
export { NativeSelect } from './ui/native-select';
export { Card } from './ui/card';
export { Label } from './ui/label';
export { DataTable as Table } from './DataTable';
export {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
  TableCaption,
} from './ui/table';
export { useResource } from '../hooks/use-resource';
const tones = {
  success: 'border-success/40 bg-success-soft text-success',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-800',
  'level-1': 'border-[#146347]/40 bg-[#eaf6ef] text-[#146347]',
  'level-2': 'border-[#086479]/40 bg-[#e8f7fc] text-[#086479]',
  'level-3': 'border-[#2458a6]/40 bg-[#edf3ff] text-[#2458a6]',
  'level-4': 'border-[#7a4b00]/40 bg-[#fff6e5] text-[#7a4b00]',
  'level-5': 'border-[#7831a3]/40 bg-[#f6edff] text-[#7831a3]',
  'level-6': 'border-[#a72844]/40 bg-[#fff0f3] text-[#a72844]',
};
export function Badge({ children, tone = '', className, ...props }) {
  return (
    <BaseBadge variant="secondary" className={cn('badge', tone, tones[tone], className)} {...props}>
      {children}
    </BaseBadge>
  );
}
export function Help({ text }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon-xs" aria-label={t('Trợ giúp: ') + text}>
            <HelpCircle className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
export function Field({ label, help, children }) {
  const id = useId(),
    control = React.isValidElement(children)
      ? React.cloneElement(children, {
          id,
          'aria-labelledby': `${id}-label`,
        })
      : children;
  return (
    <div className="field grid min-w-0 gap-2">
      <div className="flex items-center gap-1.5">
        <Label id={`${id}-label`} htmlFor={id}>
          {label}
        </Label>
        {help && <Help text={help} />}
      </div>
      {control}
    </div>
  );
}
export function Section({ title, open = false, children }) {
  return (
    <details open={open} className="section rounded-[14px] border bg-card">
      <summary className="px-5 py-4 font-medium">{title}</summary>
      <div className="section-body space-y-4 border-t p-5">{children}</div>
    </details>
  );
}
export function Check({ label, checked, onChange, disabled = false, tone = '' }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'check flex items-center gap-2.5 text-sm leading-relaxed',
        disabled && 'opacity-60',
        tone,
      )}
    >
      <Checkbox
        id={id}
        checked={!!checked}
        onCheckedChange={(value) => onChange(value === true)}
        disabled={disabled}
      />
      {label}
    </label>
  );
}
export function ErrorBox({ error }) {
  if (!error) return null;
  const message = t(error.message || String(error));
  return (
    <Alert variant="destructive" className="my-3 border-red-200 bg-red-50">
      <AlertCircle className="size-4" />
      <AlertDescription>
        {locale === 'en' && /[À-ỹ]/.test(message)
          ? 'Please check the request and try again.'
          : message}
      </AlertDescription>
    </Alert>
  );
}
export function Heading({ eyebrow = '', title, children, action, kind, highlight }) {
  const section =
    kind ||
    (eyebrow.includes('WORKSPACE')
      ? 'workspace'
      : eyebrow.includes('QUESTION BANK / CATEGORY')
        ? 'categories'
        : eyebrow.includes('QUESTION BANK')
          ? 'editor'
          : eyebrow.includes('CODE SURVIVAL') || eyebrow.includes('MULTIPLAYER')
            ? 'survival'
            : eyebrow.includes('CONTEST')
              ? 'contest'
              : eyebrow.includes('RANKINGS')
                ? 'leaderboard'
                : eyebrow.includes('JUDGE')
                  ? 'submissions'
                  : eyebrow.includes('ADMINISTRATION')
                    ? 'admin'
                    : 'practice');
  return (
    <PageBanner kind={section} title={title} action={action} highlight={highlight}>
      {children}
    </PageBanner>
  );
}
export const go = (path) => {
  location.hash = path;
};
export function TimeLeft({ deadline, withHours = false }) {
  const now = useServerTime();
  return (
    <span
      className={cn(
        'timer font-mono font-semibold tabular-nums',
        deadline - now < 15000 && 'urgent text-destructive',
      )}
      role="timer"
    >
      {formatCountdown(deadline, now, withHours)}
    </span>
  );
}
export function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="loading flex items-center gap-2 py-6 text-muted-foreground"
    >
      <LoaderCircle className="size-4 animate-spin" />
      {t('Đang tải dữ liệu…')}
    </div>
  );
}
