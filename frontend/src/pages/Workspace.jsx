import { Button as UiButton } from '../components/ui/button';
import { Input as UiInput } from '../components/ui/input';
import { Label as UiLabel } from '../components/ui/label';
import { NativeSelect as UiNativeSelect } from '../components/ui/native-select';
import { submissionInsights } from '../lib/insights';
import { t as trUI } from '../lib/locale';
import CodeEditor from '../components/CodeEditor';
import SubmissionHistory from '../components/SubmissionHistory';
import ProblemRanking from '../components/ProblemRanking';
import { Discussion } from './Community';
import React, { useEffect, useState, useRef } from 'react';
import { live } from '../lib/live';
import { competitionScope } from '../lib/competition';
import { languageNames } from '../lib/coderunner';
import { Badge, ErrorBox, Loading, useResource, go } from '../components/ui';
import Icon from '../components/Icon';
import { cn } from '../lib/utils';
import { History, Trophy, MessageSquare } from 'lucide-react';
const cpp =
  '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    \n    return 0;\n}\n';
function renderStatementText(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    const isHeading =
      /^(?:###\s*)?(dữ liệu vào|dữ liệu ra|dữ liệu ra mong đợi|input|output|ví dụ|ràng buộc|giới hạn)(\s*:)?$/i.test(
        trimmed,
      );
    if (isHeading) {
      return (
        <span
          key={idx}
          className="block font-heading font-black text-action pt-2.5 pb-0.5 tracking-tight text-[13px] sm:text-sm"
        >
          {line}
        </span>
      );
    }
    return (
      <React.Fragment key={idx}>
        {line}
        {idx < lines.length - 1 ? '\n' : null}
      </React.Fragment>
    );
  });
}

export default function Workspace({
  id,
  user,
  revision,
  problem: provided,
  room,
  contestId,
  onNotice,
  onSubmissionSelected,
  readOnly = false,
}) {
  const [q, setQ] = useState(provided || null),
    [source, setSource] = useState(''),
    [language, setLanguage] = useState('PY311'),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [hydrated, setHydrated] = useState(false),
    [bottomTab, setBottomTab] = useState('submissions');
  const scope = competitionScope(room, contestId, id);
  const operation = useRef(null);
  const practiceKey = 'cg-code-' + user.id + '-' + id;
  const contestKey = contestId ? 'cg-code-contest-' + contestId + '-' + user.id + '-' + id : null;
  const draftKey = contestKey || (room ? 'cg-code-' + scope + '-' + user.id : practiceKey);
  const hydratedKey = useRef(draftKey);
  const [mine, mineError] = useResource('SUBMISSIONS', {}, revision);

  const copyExample = (text, label) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      onNotice?.(trUI('Đã sao chép ') + label + '.');
    } catch {
      // fallback
    }
  };
  useEffect(() => {
    let active = true;
    setHydrated(false);
    setBusy(false);
    hydratedKey.current = null;
    operation.current = null;
    if (scope) setSource('');
    (async () => {
      try {
        const p =
          provided ||
          (await live.call('QUESTION_GET', {
            id,
          }));
        const drafts = scope
          ? []
          : await live.call('DRAFT_GET', {
              problemId: id,
            });
        const local = draftKey ? JSON.parse(localStorage.getItem(draftKey) || 'null') : null,
          server = drafts[0];
        const savedLanguage = local?.language || server?.language;
        const lang = p.languages.includes(savedLanguage)
          ? savedLanguage
          : p.languages[0] || 'PY311';
        const text = local?.source ?? server?.source_code ?? p.preloadAnswer ?? '';
        if (active) {
          setQ(p);
          setLanguage(lang);
          setSource(text || (lang.startsWith('CPP') ? cpp : trUI('# Viết lời giải ở đây\n')));
          hydratedKey.current = draftKey;
          setHydrated(true);
        }
      } catch (e) {
        if (active) setError(e);
      }
    })();
    return () => {
      active = false;
      operation.current = null;
    };
  }, [id, scope, draftKey, practiceKey]);
  useEffect(() => {
    if (!hydrated || !draftKey || hydratedKey.current !== draftKey) return;
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        source,
        language,
      }),
    );
    if (!scope) {
      const timer = setTimeout(() => {
        live
          .call('DRAFT_SAVE', {
            problemId: id,
            source,
            language,
          })
          .catch(() => {});
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [source, language, hydrated, id, draftKey, scope]);
  async function submit(type, retry = false) {
    if (readOnly || busy || !hydrated) return;
    setBusy(true);
    setError(null);
    if (!retry || !operation.current)
      operation.current = {
        type,
        id: crypto.randomUUID(),
        scope,
        payload: {
          problemId: id,
          source,
          language,
          ...(room
            ? {
                roomId: room.id,
                roundId: room.current.id,
              }
            : {}),
          ...(contestId
            ? {
                contestId,
              }
            : {}),
        },
      };
    const op = operation.current;
    try {
      const result = await live.call(op.type, op.payload, op.id);
      if (operation.current !== op) return;
      onSubmissionSelected?.(result.id);
      operation.current = null;
      setBusy(false);
      onNotice?.(
        trUI('Server đã nhận bài lúc ') +
          new Date(result.receivedAt).toLocaleTimeString(
            localStorage.getItem('cg-locale') === 'en' ? 'en-US' : 'vi-VN',
          ) +
          '.',
      );
    } catch (e) {
      if (operation.current !== op) return;
      setError(e);
      if (e.code) operation.current = null;
      setBusy(false);
    }
  }
  const attempts = room
    ? (mine || []).filter(
        (s) => s.round_id === room.current.id && s.mode === 'OFFICIAL' && s.status !== 'SE',
      ).length
    : 0;
  const personal = submissionInsights((mine || []).filter((s) => s.problem_id === id));
  if (!q)
    return (
      <>
        <ErrorBox error={error} />
        <Loading />
      </>
    );
  return (
    <div
      className={'workspace-page space-y-4 ' + (room ? 'battle-workspace' : 'practice-workspace')}
    >
      {!room && (
        <section className="workspace-header rounded-2xl border border-border/80 bg-card p-3 sm:px-4 sm:py-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              <UiButton
                className="h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg border border-border/80 bg-card text-foreground hover:bg-muted shadow-2xs shrink-0"
                onClick={() => go(contestId ? '/contests/' + contestId : '/practice')}
                variant="outline"
              >
                <Icon
                  name="fa-solid fa-arrow-left"
                  className="size-3 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>{trUI('Quay lại')}</span>
              </UiButton>

              {q.publicId && (
                <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50/90 border border-orange-200/80 px-2 py-0.5 rounded dark:bg-orange-950/30 dark:border-orange-800/40 dark:text-orange-400 shrink-0">
                  {q.publicId}
                </span>
              )}

              <h1
                className="font-heading text-sm sm:text-base font-bold text-foreground tracking-tight line-clamp-1"
                data-user-content
              >
                {q.general.questionName}
              </h1>

              {q.difficulty && (
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border shrink-0',
                    q.difficulty <= 2
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40'
                      : q.difficulty <= 4
                        ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40'
                        : 'bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/40',
                  )}
                >
                  {trUI('Mức')} {q.difficulty}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {q.examples && (
                <span className="hidden md:inline-flex items-center gap-1.5 font-medium">
                  <Icon
                    name="fa-solid fa-flask"
                    className="size-3 text-muted-foreground/70"
                    aria-hidden="true"
                  />
                  <span>
                    {q.examples.length} {trUI('ví dụ')}
                  </span>
                </span>
              )}

              <span className="hidden lg:inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/80">
                {q.languages.map((l) => languageNames[l]).join(' · ')}
              </span>

              <span className="inline-flex items-center gap-1.5 font-medium">
                <Icon
                  name="fa-solid fa-trophy"
                  className="size-3 text-amber-500"
                  aria-hidden="true"
                />
                <span>
                  {trUI('Điểm cao nhất')}:{' '}
                  <strong className="font-bold text-foreground">{personal.best ?? '—'}</strong>
                </span>
              </span>
            </div>
          </div>
        </section>
      )}

      <ErrorBox error={error || mineError} />

      {room && readOnly && (
        <p className="alert my-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed">
          {trUI('Mã nguồn được giữ lại để xem và sao chép. Hiện không thể nộp bài ở vòng này.')}
        </p>
      )}

      <div className="workspace grid min-w-0 items-start gap-4 min-[851px]:grid-cols-2">
        {/* Left Column: Problem Statement */}
        <section className="statement flex flex-col rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xs overflow-hidden min-[851px]:h-[720px]">
          <div className="shrink-0 flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-2 font-heading font-bold text-sm text-foreground">
              <Icon
                name="fa-solid fa-file-lines"
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
              <span>{trUI('Đề bài & Yêu cầu')}</span>
            </div>
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border',
                q.difficulty <= 2
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : q.difficulty <= 4
                    ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300'
                    : 'bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/30 dark:text-orange-300',
              )}
            >
              {trUI('Mức')} {q.difficulty}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="space-y-1">
              <h2 className="font-heading text-lg sm:text-xl font-black tracking-tight text-action" data-user-content>
                {q.general.questionName}
              </h2>
            </div>

            <pre className="statement-text whitespace-pre-wrap break-words bg-transparent p-0 font-sans text-sm leading-relaxed text-foreground/90">
              {renderStatementText(q.general.questionText)}
            </pre>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-t border-border/50 pt-3">
                <Icon
                  name="fa-solid fa-flask"
                  className="size-3 text-primary"
                  aria-hidden="true"
                />
                <span>
                  {trUI('Ví dụ công khai')} ({q.examples?.length || 0})
                </span>
              </div>

              {q.examples?.map((t, i) => (
                <div
                  className="example space-y-2.5 rounded-xl border border-border/60 bg-muted/20 p-3.5"
                  key={i}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>
                      {trUI('Ví dụ')} #{i + 1}
                    </span>
                  </div>

                  {t.testcode && (
                    <div className="space-y-1">
                      <small className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        TEST CODE
                      </small>
                      <pre className="bg-card border border-border/60 rounded-lg p-2.5 font-mono text-xs overflow-x-auto text-foreground">
                        {t.testcode}
                      </pre>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <small className="text-[11px] font-black text-action uppercase tracking-wider font-heading">
                        INPUT
                      </small>
                      {t.stdin && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-action transition-colors cursor-pointer"
                          onClick={() => copyExample(t.stdin, trUI('Input'))}
                        >
                          <Icon
                            name="fa-regular fa-copy"
                            className="size-2.5"
                            aria-hidden="true"
                          />
                          <span>{trUI('Sao chép')}</span>
                        </button>
                      )}
                    </div>
                    <pre className="bg-card border border-border/60 rounded-lg p-2.5 font-mono text-xs overflow-x-auto text-foreground">
                      {t.stdin || trUI('(rỗng)')}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <small className="text-[11px] font-black text-action uppercase tracking-wider font-heading">
                        EXPECTED OUTPUT
                      </small>
                      {t.expected && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-action transition-colors cursor-pointer"
                          onClick={() => copyExample(t.expected, trUI('Output'))}
                        >
                          <Icon
                            name="fa-regular fa-copy"
                            className="size-2.5"
                            aria-hidden="true"
                          />
                          <span>{trUI('Sao chép')}</span>
                        </button>
                      )}
                    </div>
                    <pre className="bg-card border border-border/60 rounded-lg p-2.5 font-mono text-xs overflow-x-auto text-foreground">
                      {t.expected || trUI('(rỗng)')}
                    </pre>
                  </div>
                </div>
              ))}

              {!q.examples?.length && (
                <p className="text-xs text-muted-foreground italic">
                  {trUI('Đề chưa có ví dụ công khai.')}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Code Editor */}
        <section className="editor-panel flex flex-col rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xs overflow-hidden min-[851px]:h-[720px]">
          <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-2 font-heading font-bold text-sm text-foreground">
              <Icon name="fa-solid fa-code" className="size-3.5 text-primary" aria-hidden="true" />
              <span>{trUI('Lời giải của bạn')}</span>
              {room && (
                <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.2 text-[10px] font-bold">
                  {attempts}/2 lượt
                </span>
              )}
            </div>
            <UiNativeSelect
              aria-label={trUI('Ngôn ngữ nộp bài')}
              value={language}
              disabled={readOnly}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-8 text-xs font-semibold rounded-lg bg-card border-border/80 shadow-2xs"
            >
              {q.languages.map((l) => (
                <option key={l} value={l}>
                  {languageNames[l]}
                </option>
              ))}
            </UiNativeSelect>
          </div>

          <p id="editor-keyboard-hint" className="sr-only">
            Code editor. Tab moves to the next control. Ctrl+] inserts indentation.
          </p>

          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/15 px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-card border border-border/60 bg-card cursor-pointer transition-colors shadow-2xs">
                <Icon
                  name="fa-solid fa-upload"
                  className="size-2.5 text-primary"
                  aria-hidden="true"
                />
                <span>{trUI('Tải file lên')}</span>
                <input
                  type="file"
                  className="sr-only"
                  aria-label={trUI('Nhập file mã nguồn')}
                  disabled={readOnly}
                  accept=".cpp,.cc,.cxx,.py,.txt"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      if (f.size > 65536) throw Error(trUI('File tối đa 64 KB.'));
                      const text = await f.text();
                      if (text.includes('\0') || text.length > 65536)
                        throw Error(trUI('File mã nguồn không hợp lệ.'));
                      if (
                        source.trim() &&
                        !confirm(trUI('Thay thế mã đang soạn bằng nội dung file?'))
                      )
                        return;
                      const lang = f.name.endsWith('.py')
                        ? 'PY311'
                        : /\.(cpp|cc|cxx)$/i.test(f.name)
                          ? q.languages.find((x) => x.startsWith('CPP'))
                          : language;
                      if (!q.languages.includes(lang))
                        throw Error(trUI('Ngôn ngữ không được hỗ trợ cho bài này.'));
                      setLanguage(lang);
                      setSource(text);
                    } catch (e) {
                      setError(e);
                    } finally {
                      e.target.value = '';
                    }
                  }}
                />
              </label>

              <span className="font-mono text-[11px] font-semibold text-foreground/80 flex items-center gap-1">
                <Icon
                  name="fa-regular fa-file-code"
                  className="size-2.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>{language === 'PY311' ? 'main.py' : 'main.cpp'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span
                className="size-1.5 rounded-full bg-emerald-500 animate-pulse"
                aria-hidden="true"
              />
              <span>
                {scope
                  ? contestId
                    ? trUI('Tự lưu nháp thi đấu')
                    : 'Trận đấu trực tiếp'
                  : trUI('Tự động lưu nháp')}
              </span>
              <span className="opacity-40">•</span>
              <span className="font-mono">{source.length}/65536</span>
            </div>
          </div>

          <div className="flex-1 min-h-[480px] overflow-hidden">
            <CodeEditor
              value={source}
              onChange={setSource}
              language={language}
              readOnly={readOnly}
              height="100%"
            />
          </div>

          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-4 py-2.5">
            <span className="text-xs text-muted-foreground">
              {room
                ? trUI('Tối đa 2 bài chính thức; chạy ví dụ không trừ lượt.')
                : user.role === 'ADMIN'
                  ? trUI('Admin · kết quả không tính bảng xếp hạng')
                  : trUI('Mã nguồn được lưu tự động trên trình duyệt')}
            </span>

            <div className="inline-group flex flex-wrap items-center gap-2">
              {(room || q.precheck > 0) && !q.hidecheck && (
                <UiButton
                  className="secondary h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg border border-border/80 bg-card text-foreground hover:bg-muted shadow-2xs"
                  aria-busy={busy}
                  disabled={readOnly || busy || !hydrated}
                  onClick={() => submit(room ? 'RUN_EXAMPLES' : 'PRECHECK')}
                  variant="outline"
                >
                  <Icon
                    name="fa-solid fa-play"
                    className="size-2.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>{room ? trUI('Chạy ví dụ') : 'Precheck'}</span>
                </UiButton>
              )}

              <UiButton
                className="primary h-8 px-4 text-xs font-semibold gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs"
                aria-busy={busy}
                disabled={readOnly || busy || !hydrated || (room && attempts >= 2)}
                onClick={() => submit('SUBMIT')}
                variant="default"
              >
                <Icon
                  name={busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'}
                  className="size-3"
                  aria-hidden="true"
                />
                <span>{busy ? trUI('Đang gửi…') : trUI('Nộp bài →')}</span>
              </UiButton>
            </div>
          </div>

          {operation.current && error && (
            <div className="p-3 border-t border-destructive/20 bg-destructive/5 flex items-center justify-between gap-2">
              <span className="text-xs text-destructive">
                {error.message || trUI('Có lỗi xảy ra khi nộp bài.')}
              </span>
              <UiButton
                className="secondary h-7 px-2.5 text-xs font-semibold border-destructive/30 hover:bg-destructive/10 text-destructive retry"
                disabled={readOnly || busy}
                onClick={() => submit(operation.current.type, true)}
                variant="outline"
              >
                {trUI('Gửi lại cùng request ID')}
              </UiButton>
            </div>
          )}
        </section>
      </div>

      {!room && (
        <div className="workspace-bottom-section space-y-3.5 pt-3">
          <div
            className="workspace-tabs flex flex-wrap items-center gap-1.5 rounded-2xl bg-muted/60 p-1.5 border border-border/60 shadow-2xs w-fit"
            role="tablist"
          >
            <UiButton
              role="tab"
              aria-selected={bottomTab === 'submissions'}
              className={cn(
                'h-9 justify-center gap-2 rounded-xl border-0 px-3.5 text-xs font-bold transition-all shadow-none cursor-pointer',
                bottomTab === 'submissions'
                  ? 'active bg-card text-action shadow-2xs border border-border/80 font-black'
                  : 'bg-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground',
              )}
              onClick={() => setBottomTab('submissions')}
              variant="ghost"
            >
              <History className="size-3.5 shrink-0" />
              <span>{trUI('Lịch sử nộp bài')}</span>
            </UiButton>

            <UiButton
              role="tab"
              aria-selected={bottomTab === 'ranking'}
              className={cn(
                'h-9 justify-center gap-2 rounded-xl border-0 px-3.5 text-xs font-bold transition-all shadow-none cursor-pointer',
                bottomTab === 'ranking'
                  ? 'active bg-card text-action shadow-2xs border border-border/80 font-black'
                  : 'bg-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground',
              )}
              onClick={() => setBottomTab('ranking')}
              variant="ghost"
            >
              <Trophy className="size-3.5 shrink-0 text-amber-500" />
              <span>{trUI('Bảng xếp hạng bài này')}</span>
            </UiButton>

            <UiButton
              role="tab"
              aria-selected={bottomTab === 'discussion'}
              className={cn(
                'h-9 justify-center gap-2 rounded-xl border-0 px-3.5 text-xs font-bold transition-all shadow-none cursor-pointer',
                bottomTab === 'discussion'
                  ? 'active bg-card text-action shadow-2xs border border-border/80 font-black'
                  : 'bg-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground',
              )}
              onClick={() => setBottomTab('discussion')}
              variant="ghost"
            >
              <MessageSquare className="size-3.5 shrink-0 text-blue-500" />
              <span>{trUI('Thảo luận')}</span>
            </UiButton>
          </div>

          <div className="tab-panel">
            {bottomTab === 'submissions' && (
              <SubmissionHistory
                items={mine}
                problemId={id}
                revision={revision}
                onSelect={onSubmissionSelected}
              />
            )}
            {bottomTab === 'ranking' && (
              <ProblemRanking problemId={id} userId={user.id} revision={revision} />
            )}
            {bottomTab === 'discussion' && <Discussion id={id} revision={revision} />}
          </div>
        </div>
      )}
    </div>
  );
}
