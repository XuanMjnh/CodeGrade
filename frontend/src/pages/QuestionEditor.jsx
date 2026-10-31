import ProgressMeter from '../components/ProgressMeter';
import Icon from '../components/Icon';
import { Button as UiButton } from '../components/ui/button';
import { Input as UiInput } from '../components/ui/input';
import { Label as UiLabel } from '../components/ui/label';
import { NativeSelect as UiNativeSelect } from '../components/ui/native-select';
import { Textarea as UiTextarea } from '../components/ui/textarea';
import CodeEditor from '../components/CodeEditor';
import { t as trUI } from '../lib/locale';
import React, { useEffect, useState, useRef } from 'react';
import { live } from '../lib/live';
import {
  defaults,
  normalize,
  validate,
  serialized,
  displayNames,
  languageNames,
} from '../lib/coderunner';
import { Section, Check, ErrorBox, Loading, go, Help } from '../components/ui';

function Field({ label, help, children }) {
  const id = React.useId();
  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
        id,
        'aria-labelledby': `${id}-label`,
      })
    : children;
  return (
    <div className="field grid min-w-0 gap-1.5">
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
        <UiLabel id={`${id}-label`} htmlFor={id} className="text-xs font-bold text-foreground">
          {label}
        </UiLabel>
        {help && <Help text={help} />}
      </div>
      {control}
    </div>
  );
}
import { cn } from '../lib/utils';
function at(obj, path) {
  return path.split('.').reduce((v, k) => v?.[k], obj);
}
const difficultyInfo = [
  {
    level: 1,
    name: 'Nhập môn',
    color: 'diff-1 text-[#146347]',
  },
  {
    level: 2,
    name: 'Dễ',
    color: 'diff-2 text-[#086479]',
  },
  {
    level: 3,
    name: 'Trung bình',
    color: 'diff-3 text-[#2458a6]',
  },
  {
    level: 4,
    name: 'Khá',
    color: 'diff-4 text-[#7a4b00]',
  },
  {
    level: 5,
    name: 'Khó',
    color: 'diff-5 text-[#7831a3]',
  },
  {
    level: 6,
    name: 'Cực khó',
    color: 'diff-6 text-[#a72844]',
  },
];
const sectionStyles = {
  'sec-1-info': {
    iconBg: 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/50',
  },
  'sec-2-grading': {
    iconBg: 'bg-sky-100/80 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200/50',
  },
  'sec-3-answer': {
    iconBg: 'bg-violet-100/80 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200/50',
  },
  'sec-4-testcases': {
    iconBg: 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/50',
  },
  'sec-5-advanced': {
    iconBg: 'bg-teal-100/80 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200/50',
  },
};
const questionTypeDescriptions = {
  python3_program: {
    title: 'Python 3 Program',
    desc: 'Chương trình Python 3 hoàn chỉnh, đọc Standard Input (stdin) và in ra Standard Output (stdout).',
  },
  cpp_program: {
    title: 'C++ Program',
    desc: 'Chương trình C++ đầy đủ hàm main(), đọc stdin và in stdout với EqualityGrader.',
  },
  cpp_function: {
    title: 'C++ Function',
    desc: 'Học viên viết hàm hoặc class; bộ chấm nối mã harness (testcode) để kiểm tra kết quả.',
  },
  python3: {
    title: 'Python 3 Function',
    desc: 'Học viên viết hàm; bộ chấm gọi hàm thông qua testcode và so sánh kết quả trả về.',
  },
};
export default function QuestionEditor({ id, revision, onNotice }) {
  const [q, setQ] = useState(() => defaults());
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [errors, setErrors] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeSection, setActiveSection] = useState('sec-1-info');
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draftError, setDraftError] = useState(null);
  const [activeTestTab, setActiveTestTab] = useState(0);
  const leaveAllowed = useRef(false);
  const metadataRevision = useRef(revision);
  const draftKey = 'cg-question-draft-' + (id || 'new');
  useEffect(() => {
    live.call('CATEGORIES').then(setCategories).catch(setError);
    fetch('/api/meta')
      .then((r) => r.json())
      .then((m) => setTypes(m.questionTypes || []))
      .catch(setError);
    if (id) {
      setLoading(true);
      setLoadFailed(false);
      live
        .call('QUESTION_EDIT', {
          id,
        })
        .then((d) => {
          setQ(normalize(d));
          setDirty(false);
        })
        .catch((e) => {
          setError(e);
          setLoadFailed(true);
        })
        .finally(() => setLoading(false));
    } else {
      setQ(defaults());
      setDirty(false);
    }
  }, [id]);

  // A validation event may update metadata, but must never replace in-progress edits.
  useEffect(() => {
    if (metadataRevision.current === revision) return;
    metadataRevision.current = revision;
    if (!id) return;
    let active = true;
    live
      .call('QUESTION_EDIT', {
        id,
      })
      .then((server) => {
        if (active)
          setQ((current) =>
            current.id === server.id && current.version === server.version
              ? {
                  ...current,
                  validatedVersion: server.validatedVersion,
                }
              : current,
          );
      })
      .catch((e) => {
        if (active) setError(e);
      });
    return () => {
      active = false;
    };
  }, [id, revision]);
  useEffect(() => {
    if (dirty) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(q));
        setDraftError(null);
      } catch {
        setDraftError(
          Error(
            trUI(
              'Không thể lưu nháp trên thiết bị. Hãy lưu lên server hoặc Export JSON để giữ thay đổi.',
            ),
          ),
        );
      }
    }
  }, [q, dirty, draftKey]);
  useEffect(() => {
    const f = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [dirty]);
  useEffect(() => {
    const guard = (e) => {
      if (
        !leaveAllowed.current &&
        (busy || (dirty && !window.confirm(trUI('Rời trình soạn đề khi còn thay đổi chưa lưu?'))))
      )
        e.preventDefault();
      leaveAllowed.current = false;
    };
    window.addEventListener('codegrade:before-navigate', guard);
    return () => window.removeEventListener('codegrade:before-navigate', guard);
  }, [dirty, busy]);

  // Keyboard shortcut Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!busy && !loadFailed) {
          save(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [q, busy, loadFailed]);
  function cancel() {
    if (!dirty || window.confirm(trUI('Bỏ các thay đổi chưa lưu?'))) {
      leaveAllowed.current = true;
      go('/practice');
    }
  }
  function readDraft() {
    try {
      return localStorage.getItem(draftKey);
    } catch {
      return null;
    }
  }
  function scrollToSection(secId, fieldFocus) {
    setActiveSection(secId);
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (fieldFocus) {
        setTimeout(() => {
          const inputEl =
            document.querySelector(`[aria-label="${fieldFocus}"]`) ||
            el.querySelector('input, textarea, select');
          inputEl?.focus();
        }, 350);
      }
    }
  }

  useEffect(() => {
    if (loading) return;
    const secIds = ['sec-1-info', 'sec-2-grading', 'sec-3-answer', 'sec-4-testcases', 'sec-5-advanced'];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );

    secIds.forEach((secId) => {
      const el = document.getElementById(secId);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading]);
  function update(path, value) {
    setQ((prev) => {
      const next = structuredClone(prev);
      const parts = path.split('.');
      const last = parts.pop();
      let obj = next;
      for (const k of parts) obj = obj[k];
      obj[last] = value;
      return next;
    });
    setDirty(true);
  }
  const input = (path, type = 'text', props = {}) => {
    const { className, ...restProps } = props;
    return (
      <UiInput
        aria-label={path}
        type={type}
        value={at(q, path) ?? ''}
        onChange={(e) =>
          update(
            path,
            type === 'number'
              ? e.target.value === ''
                ? null
                : Number(e.target.value)
              : e.target.value,
          )
        }
        className={cn(
          'h-10 rounded-xl border border-border/90 bg-slate-100/60 px-3 text-sm font-semibold text-foreground transition-all shadow-xs hover:border-action/60 hover:bg-card focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20 dark:border-border dark:bg-slate-900/50 dark:hover:bg-card dark:focus-visible:bg-card',
          className,
        )}
        {...restProps}
      />
    );
  };
  const area = (path, rows = 4) => {
    const isCode = /answer|testcases|template|globalextra/i.test(path);
    return (
      <UiTextarea
        className={cn(
          'w-full rounded-xl border border-border/90 bg-slate-100/60 p-3 text-sm leading-relaxed text-foreground transition-all shadow-xs hover:border-action/60 hover:bg-card focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20 dark:border-border dark:bg-slate-900/50 dark:hover:bg-card dark:focus-visible:bg-card',
          isCode && 'code-input font-mono text-xs',
        )}
        aria-label={path}
        spellCheck={false}
        rows={rows}
        value={at(q, path) ?? ''}
        onChange={(e) => update(path, e.target.value)}
      />
    );
  };
  const check = (path, label, disabled = false) => (
    <Check
      label={label}
      checked={at(q, path)}
      onChange={(v) => update(path, v)}
      disabled={disabled}
    />
  );
  const select = (path, options, disabled = false) => (
    <UiNativeSelect
      aria-label={path}
      value={at(q, path) ?? ''}
      disabled={disabled}
      className="h-10 rounded-xl border border-border/90 bg-slate-100/60 px-3 text-sm font-semibold text-foreground transition-all shadow-xs hover:border-action/60 hover:bg-card focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20 dark:border-border dark:bg-slate-900/50 dark:hover:bg-card dark:focus-visible:bg-card"
      onChange={(e) =>
        update(path, typeof at(q, path) === 'number' ? Number(e.target.value) : e.target.value)
      }
    >
      {options.map(([v, n]) => (
        <option key={v} value={v}>
          {n}
        </option>
      ))}
    </UiNativeSelect>
  );
  const field = (label, path, type = 'text', help = null, props = {}) => (
    <Field label={label} help={help}>
      {input(path, type, props)}
    </Field>
  );
  async function save(stay) {
    setError(null);
    const errs = validate(q);
    setErrors(errs);
    if (errs.length) {
      requestAnimationFrame(() => {
        const alert = document.querySelector('.editor-errors');
        alert?.focus();
        alert?.scrollIntoView({
          block: 'start',
        });
      });
      return;
    }
    setBusy(true);
    try {
      const result = await live.call('QUESTION_SAVE', serialized(q));
      setQ(normalize(result));
      setDirty(false);
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* The server save succeeded even if device storage is unavailable. */
      }
      onNotice(
        result.sampleValidation
          ? trUI('Đã lưu. Đáp án mẫu được đưa vào queue; xem kết quả ở Bài nộp.')
          : result.validationNotice || trUI('Đã lưu câu hỏi.'),
      );
      setDraftError(null);
      const destination = stay ? '/edit/' + result.id : '/practice';
      leaveAllowed.current = location.hash !== '#' + destination;
      go(destination);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(serialized(q), null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${q.general.questionName ? q.general.questionName.toLowerCase().replace(/\s+/g, '-') : 'coderunner-question'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function importJson(e) {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      if (f.size > 900000) throw Error(trUI('JSON tối đa 900 KiB.'));
      const incoming = normalize(JSON.parse(await f.text()));
      const errs = validate(incoming);
      if (errs.length) throw Error(errs.join('\n'));
      if (dirty && !window.confirm(trUI('Thay dữ liệu đang sửa bằng JSON này?'))) return;
      if (incoming.id !== id) {
        delete incoming.id;
        delete incoming.publicId;
        delete incoming.version;
        delete incoming.validatedVersion;
      }
      setQ(incoming);
      setDirty(true);
      setErrors([]);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      e.target.value = '';
    }
  }
  function insertStatementTemplate(tag) {
    const current = q.general.questionText || '';
    let insertion = '';
    if (tag === 'desc') insertion = '\n### Mô tả bài toán\nCho ...\n';
    else if (tag === 'input') insertion = '\n### Dữ liệu vào\n- Dòng đầu tiên chứa...\n';
    else if (tag === 'output') insertion = '\n### Dữ liệu ra\n- In ra kết quả trên một dòng...\n';
    else if (tag === 'constraints') insertion = '\n### Ràng buộc\n- 1 ≤ N ≤ 10⁵\n';
    else if (tag === 'example')
      insertion = '\n### Ví dụ\n**Input:**\n```\n5\n1 2 3 4 5\n```\n**Output:**\n```\n15\n```\n';
    update('general.questionText', current + insertion);
  }
  function insertPreloadTemplate(lang) {
    if (lang === 'cpp') {
      update(
        'answer.preloadAnswer',
        '#include <iostream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Viết code tại đây\n    \n    return 0;\n}\n',
      );
    } else if (lang === 'py') {
      update(
        'answer.preloadAnswer',
        'import sys\n\ndef main():\n    input = sys.stdin.read\n    # Viết code tại đây\n\nif __name__ == "__main__":\n    main()\n',
      );
    }
  }
  const selectedHelp =
    types.find((t) => t.id === q.coderunnertype)?.description || trUI('Chưa chọn loại câu hỏi.');
  const issues = validate(q);
  const exampleCount = q.testcases.filter((t) => t.useasexample).length;
  const verified = Boolean(q.version && q.validatedVersion === q.version && !dirty);
  const sections = [
    {
      id: 'sec-1-info',
      num: '01',
      title: 'Thông tin cơ bản',
      subtitle: 'Tên, nội dung & ngôn ngữ',
      icon: 'fa-file-lines',
      check: Boolean(q.general.questionName.trim() && q.general.questionText.trim() && q.languages.length > 0),
    },
    {
      id: 'sec-2-grading',
      num: '02',
      title: 'Cấu hình chấm',
      subtitle: 'Loại câu hỏi & tính điểm',
      icon: 'fa-sliders',
      check: issues.length === 0,
    },
    {
      id: 'sec-3-answer',
      num: '03',
      title: 'Đáp án mẫu',
      subtitle: 'Lời giải tham chiếu & preload',
      icon: 'fa-code',
      check: Boolean(q.answer.sampleAnswer.trim()),
    },
    {
      id: 'sec-4-testcases',
      num: '04',
      title: 'Bộ kiểm thử',
      subtitle: '5 testcases & thuộc tính',
      icon: 'fa-vials',
      check: q.testcases.length === 5,
    },
    {
      id: 'sec-5-advanced',
      num: '05',
      title: 'Nâng cao & xuất bản',
      subtitle: 'Trạng thái, tags & tệp đính kèm',
      icon: 'fa-rocket',
      check: true,
    },
  ];
    const completedSectionsCount = sections.filter((s) => s.check).length;
const checklistItems = [
    [!!q.general.questionName.trim(), 'Tên câu hỏi', 'sec-1-info', 'general.questionName'],
    [!!q.general.questionText.trim(), 'Nội dung đề', 'sec-1-info', 'general.questionText'],
    [q.languages.length > 0, 'Ngôn ngữ lập trình', 'sec-1-info', 'languages'],
    [q.testcases.length === 5, 'Đủ 5 testcase', 'sec-4-testcases', 'testcases'],
    [issues.length === 0, 'Cấu hình hợp lệ', 'sec-2-grading', 'coderunnertype'],
    [verified, 'Đáp án mẫu xác thực phiên bản hiện tại', 'sec-3-answer', 'answer.sampleAnswer'],
  ];
  const completedCount = checklistItems.filter(([ok]) => ok).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);
  if (loading) return <Loading />;
  return (
    <div className="question-editor studio min-w-0 space-y-5">
      {/* Top Header */}
            {/* Top Header Card */}
      <header className="studio-header rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4 mb-6 transition-all">
        {/* Top Control Bar: Breadcrumbs & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3.5">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer"
              onClick={cancel}
              title={trUI('Quay lại kho bài')}
            >
              <Icon name="fa-solid fa-arrow-left" className="size-3" aria-hidden="true" />
              <span>{trUI('Luyện tập')}</span>
            </button>
            <span className="text-border/80 select-none" aria-hidden="true">/</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              <Icon name="fa-solid fa-code" className="size-3 text-primary" aria-hidden="true" />
              QUESTION STUDIO
            </span>
            <span className="text-border/80 select-none" aria-hidden="true">/</span>
            <span className="text-xs font-semibold text-foreground">
              {id ? `Cập nhật đề #${q.publicId || id}` : 'Tạo mới'}
            </span>
          </div>

          {/* Quick Action Tools */}
          <div className="studio-tools flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 h-8 sm:h-9 rounded-xl border px-3 text-xs font-semibold shadow-2xs transition-all cursor-pointer",
                preview
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-bold"
                  : "border-border/80 bg-card text-foreground hover:border-emerald-600/40 hover:bg-muted/40"
              )}
              aria-pressed={preview}
              onClick={() => setPreview(!preview)}
            >
              <Icon name={`fa-solid ${preview ? 'fa-eye-slash' : 'fa-eye'}`} className="size-3.5 text-primary" aria-hidden="true" />
              <span>{preview ? trUI('Đóng xem trước') : trUI('Xem nội dung đề')}</span>
            </button>

            <label
              className="inline-flex items-center gap-1.5 h-8 sm:h-9 rounded-xl border border-border/80 bg-card px-3 text-xs font-semibold text-foreground hover:border-emerald-600/40 hover:bg-muted/40 shadow-2xs transition-all cursor-pointer"
              title="Nhập file JSON đề"
            >
              <Icon name="fa-solid fa-file-import" className="size-3.5 text-primary" aria-hidden="true" />
              <span>Nhập JSON</span>
              <input
                type="file"
                accept=".json,application/json"
                hidden
                disabled={busy || loadFailed}
                onChange={importJson}
              />
            </label>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8 sm:h-9 rounded-xl border border-border/80 bg-card px-3 text-xs font-semibold text-foreground hover:border-emerald-600/40 hover:bg-muted/40 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              disabled={busy || loadFailed}
              onClick={exportJson}
              title="Xuất file JSON đề"
            >
              <Icon name="fa-solid fa-file-export" className="size-3.5 text-primary" aria-hidden="true" />
              <span>Xuất JSON</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8 sm:h-9 rounded-xl border border-border/80 bg-card px-3 text-xs font-semibold text-muted-foreground hover:border-destructive/40 hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/30 transition-all cursor-pointer shadow-2xs"
              disabled={busy}
              onClick={cancel}
              title="Đóng trình tạo câu hỏi"
            >
              <Icon name="fa-solid fa-xmark" className="size-3.5" aria-hidden="true" />
              <span>{trUI('Đóng')}</span>
            </button>
          </div>
        </div>

        {/* Main Title Row & Metadata Badges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <Icon name="fa-solid fa-file-lines" className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1 flex-1">
              <h1
                className="studio-title text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate"
                title={q.general.questionName || 'Tạo câu hỏi mới'}
              >
                {q.general.questionName || 'Tạo câu hỏi mới'}
              </h1>

              {/* Status Badges Row */}
              <div className="studio-badges flex flex-wrap items-center gap-2 pt-0.5">
                <span className="badge inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-mono font-medium text-foreground shadow-2xs">
                  <Icon name="fa-solid fa-hashtag" className="size-3 text-muted-foreground" aria-hidden="true" />
                  {q.publicId || 'Chưa cấp mã'}
                </span>

                <span
                  className={cn(
                    "badge inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs",
                    q.general.status === 'ready'
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      q.general.status === 'ready' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    )}
                    aria-hidden="true"
                  />
                  {q.general.status === 'ready' ? 'Ready / Công bố' : 'Bản nháp'}
                </span>

                <span className="badge inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-bold text-foreground shadow-2xs">
                  <span className="text-primary font-mono">L{q.difficulty}</span>
                  <span className="text-muted-foreground font-normal">·</span>
                  <span className="font-medium text-muted-foreground">
                    {difficultyInfo.find((d) => d.level === q.difficulty)?.name || `Mức ${q.difficulty}`}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-1 py-0.5">
                  <Icon
                    name={`fa-solid ${dirty ? 'fa-clock' : 'fa-circle-check'}`}
                    className={cn("size-3", dirty ? "text-amber-500" : "text-emerald-600")}
                    aria-hidden="true"
                  />
                  <span>
                    {q.id ? `v${q.version}` : 'Chưa lưu lên server'} · {dirty ? 'Có thay đổi chưa lưu' : 'Đã đồng bộ'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ErrorBox error={error || draftError} />
      {errors.length > 0 && (
        <div
          role="alert"
          tabIndex={-1}
          className="alert my-3 text-sm leading-relaxed danger editor-errors rounded-[14px] border border-red-200 bg-red-50 p-4 text-red-800"
        >
          <strong>Cần sửa trước khi lưu</strong>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Studio 3-Column Layout */}
      <div className="studio-layout grid min-w-0 items-start gap-6 min-[961px]:grid-cols-[260px_minmax(0,1fr)] min-[1361px]:grid-cols-[260px_minmax(0,1fr)_290px]">
        {/* Left Column: Table of Contents */}
        <nav
          className="studio-nav rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-sm min-[961px]:sticky min-[961px]:top-20 space-y-3"
          aria-label="Mục lục bài tập"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 pb-3 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon name="fa-solid fa-list-check" className="size-3.5" aria-hidden="true" />
              </span>
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-foreground truncate">
                Mục lục đề bài
              </span>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
              5 mục
            </span>
          </div>

          {/* Section Items */}
          <div className="space-y-2">
            {sections.map((sec) => {
              const isActive = activeSection === sec.id;
              const meta = sectionStyles[sec.id] || {
                iconBg: 'bg-muted text-muted-foreground',
              };
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all cursor-pointer shadow-2xs",
                    isActive
                      ? "border-2 border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 font-bold dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200"
                      : "border border-border/80 bg-card hover:border-emerald-600/40 hover:bg-muted/30 text-foreground"
                  )}
                  aria-pressed={isActive}
                >
                  {/* Left Icon Container */}
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs transition-all shadow-2xs",
                      isActive
                        ? "bg-emerald-600 text-white font-extrabold shadow-emerald-600/20"
                        : meta.iconBg
                    )}
                  >
                    <Icon name={'fa-solid ' + sec.icon} className="size-3.5" aria-hidden="true" />
                  </span>

                  {/* Title without truncation */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "font-mono text-xs font-bold transition-colors shrink-0",
                          isActive
                            ? "text-emerald-800 dark:text-emerald-300"
                            : "text-muted-foreground"
                        )}
                      >
                        {sec.num}.
                      </span>
                      <span
                        className={cn(
                          "text-xs font-heading whitespace-nowrap transition-colors",
                          isActive
                            ? "font-bold text-foreground"
                            : "font-semibold text-foreground/90 group-hover:text-foreground"
                        )}
                      >
                        {sec.title}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Center Column: Form Panels & Content */}
        <div className="studio-content min-w-0 space-y-6">
          {/* Live Preview Container */}
          {preview && (
            <section className="paper text-card-foreground shadow-sm studio-preview space-y-4 rounded-2xl border bg-card p-6">
              <div className="studio-preview-card space-y-4 rounded-xl border bg-card p-5">
                <div className="studio-preview-header space-y-3">
                  <div className="inline-group between flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="eyebrow text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Icon name="fa-solid fa-eye" aria-hidden="true" /> BẢN XEM TRƯỚC GIAO DIỆN HỌC VIÊN
                      </span>
                      <h3 data-user-content className="text-xl font-bold mt-1">{q.general.questionName || 'Chưa có tên đề'}</h3>
                    </div>
                    <div className="inline-group flex flex-wrap items-center gap-2">
                      <span
                        className={`badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium level-${q.difficulty}`}
                      >
                        Mức {q.difficulty}
                      </span>
                      <span className="badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                        {q.languages.map((l) => languageNames[l]).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="studio-preview-body space-y-3">
                  <pre
                    data-user-content
                    className="statement-preview-text whitespace-pre-wrap break-words bg-transparent p-0 font-sans text-sm leading-7"
                  >
                    {q.general.questionText || 'Chưa có nội dung đề.'}
                  </pre>

                  {exampleCount > 0 && (
                    <div className="studio-preview-examples space-y-3">
                      <h4 className="font-semibold text-sm">
                        <Icon name="fa-solid fa-code" aria-hidden="true" />{' '}
                        {trUI('Ví dụ công khai')} ({exampleCount})
                      </h4>
                      <div className="preview-examples-list grid gap-4 sm:grid-cols-2">
                        {q.testcases
                          .filter((t) => t.useasexample)
                          .map((t, idx) => (
                            <div
                              key={t.id}
                              className="preview-example-box my-2 space-y-2 rounded-xl border p-4 bg-muted/20"
                            >
                              <strong className="text-xs font-bold text-foreground">Ví dụ {idx + 1}:</strong>
                              <div className="test-io-grid grid min-w-0 gap-3 sm:grid-cols-2">
                                <div>
                                  <small className="muted text-xs text-muted-foreground block mb-1">
                                    Input (stdin):
                                  </small>
                                  <pre className="code-box min-w-0 overflow-hidden rounded-lg border bg-card p-2 text-xs font-mono">
                                    {t.stdin || '(trống)'}
                                  </pre>
                                </div>
                                <div>
                                  <small className="muted text-xs text-muted-foreground block mb-1">
                                    Output mong đợi:
                                  </small>
                                  <pre className="code-box min-w-0 overflow-hidden rounded-lg border bg-card p-2 text-xs font-mono">
                                    {t.expected || '(trống)'}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>


              </div>
            </section>
          )}

          {/* Continuous Fieldset */}
          <fieldset disabled={busy || loadFailed} className="space-y-6 border-0 p-0 m-0 min-w-0">
            {/* Section 1: Thông tin cơ bản */}
                        {/* Section 1: Thông tin cơ bản */}
            <section id="sec-1-info" className="scroll-mt-24 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    01
                  </span>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Icon name="fa-solid fa-file-lines" className="text-primary size-4" />
                      Thông tin cơ bản & Phân loại
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Tên đề bài, danh mục, độ khó và nội dung chi tiết</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                    Mức {q.difficulty}
                  </span>
                </div>
              </div>

              {/* Category & ID Number Row */}
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field label="Danh mục câu hỏi (Category)">
                  {select(
                    'general.categoryId',
                    categories.map((c) => [c.id, c.name]),
                  )}
                </Field>
                {field(trUI('Mã tham chiếu ngoài (ID Number)'), 'general.idNumber')}
              </div>

              {/* Question Name */}
              {field('Tên câu hỏi (Question name)', 'general.questionName')}

              {/* Visual Difficulty Selector */}
              <div className="difficulty-selector space-y-2">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
                  <UiLabel className="text-xs font-bold text-foreground">
                    {trUI('Độ khó (Difficulty)')}
                  </UiLabel>
                </div>
                <div className="difficulty-grid grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {difficultyInfo.map((item) => {
                    const isSelected = q.difficulty === item.level;
                    return (
                      <button
                        key={item.level}
                        type="button"
                        onClick={() => update('difficulty', item.level)}
                        className={cn(
                          "flex min-h-[70px] flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition-all cursor-pointer shadow-2xs",
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-extrabold dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                            : "border-border/80 bg-card text-foreground hover:border-emerald-600/40 hover:bg-muted/30 font-semibold"
                        )}
                        aria-pressed={isSelected}
                      >
                        <span className={cn(
                          "font-heading text-base font-extrabold",
                          isSelected ? "text-emerald-800 dark:text-emerald-300" : item.color
                        )}>
                          L{item.level}
                        </span>
                        <span className="text-[11px] font-medium leading-tight">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Language Chips */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
                  <UiLabel className="text-xs font-bold text-foreground">
                    {trUI('Ngôn ngữ lập trình hỗ trợ')}
                  </UiLabel>
                </div>
                <div className="lang-selector-group flex flex-wrap items-center gap-2">
                  {Object.entries(languageNames).map(([k, n]) => {
                    const active = q.languages.includes(k);
                    return (
                      <button
                        type="button"
                        key={k}
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all shadow-2xs cursor-pointer",
                          active
                            ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                            : "border-border/80 bg-card text-muted-foreground hover:border-emerald-600/40 hover:bg-muted/40 hover:text-foreground"
                        )}
                        onClick={() =>
                          update(
                            'languages',
                            active ? q.languages.filter((l) => l !== k) : [...q.languages, k],
                          )
                        }
                      >
                        <Icon
                          name={`fa-solid ${k.startsWith('PY') ? 'fa-brands fa-python' : 'fa-code'}`}
                          className={cn("size-3.5", active ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}
                          aria-hidden="true"
                        />
                        <span>{n}</span>
                        {active && <Icon name="fa-solid fa-check" className="size-3 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />}
                      </button>
                    );
                  })}
                  <div className="lang-quick-actions flex flex-wrap items-center gap-1.5 ml-1">
                    <button
                      type="button"
                      className="h-8 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer"
                      onClick={() => update('languages', Object.keys(languageNames))}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      className="h-8 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer"
                      onClick={() => update('languages', ['PY311'])}
                    >
                      Chỉ Python
                    </button>
                    <button
                      type="button"
                      className="h-8 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer"
                      onClick={() => update('languages', ['CPP11', 'CPP17', 'CPP20'])}
                    >
                      Chỉ C++
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Statement with Toolbar */}
              <div className="field grid min-w-0 gap-2">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
                  <UiLabel className="text-xs font-bold text-foreground">
                    Question text (Nội dung đề bài)
                  </UiLabel>
                </div>
                <div className="rounded-xl border border-border/90 bg-card shadow-xs overflow-hidden focus-within:border-action focus-within:ring-3 focus-within:ring-action/20 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-slate-100/70 dark:bg-slate-900/60 px-3.5 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Icon name="fa-solid fa-wand-magic-sparkles" className="text-action size-3.5" aria-hidden="true" />
                      Chèn mẫu đề bài:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        ['desc', '+ Mô tả'],
                        ['input', '+ Đầu vào'],
                        ['output', '+ Đầu ra'],
                        ['constraints', '+ Ràng buộc'],
                        ['example', '+ Ví dụ'],
                      ].map(([tmpl, label]) => (
                        <button
                          key={tmpl}
                          type="button"
                          onClick={() => insertStatementTemplate(tmpl)}
                          className="h-7 px-2.5 text-xs font-semibold rounded-lg border border-border/80 bg-card text-foreground hover:bg-accent hover:border-primary/40 hover:text-primary transition-all shadow-2xs cursor-pointer"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <UiTextarea
                    aria-label="general.questionText"
                    spellCheck={false}
                    rows={10}
                    value={at(q, 'general.questionText') ?? ''}
                    onChange={(e) => update('general.questionText', e.target.value)}
                    className="w-full border-0 bg-slate-100/40 focus:bg-card p-3.5 text-sm font-mono leading-relaxed outline-none focus-visible:ring-0 focus:outline-none min-h-[280px] dark:bg-slate-900/40 dark:focus:bg-card"
                  />
                </div>
              </div>

              {/* General Feedback */}
              <Field label="Phản hồi chung (General feedback)">
                {area('general.generalFeedback', 3)}
              </Field>
            </section>

            {/* Section 2: Cấu hình chấm */}
            <section id="sec-2-grading" className="scroll-mt-24 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    02
                  </span>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Icon name="fa-solid fa-sliders" className="text-primary size-4" />
                      Cấu hình chấm & Đánh giá
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Loại câu hỏi CodeRunner, tính điểm, chế độ phạt và kiểm tra trước</p>
                  </div>
                </div>
                <span className="badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-mono font-medium">
                  {q.coderunnertype}
                </span>
              </div>

              {/* Visual Type Picker Grid */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
                  <UiLabel className="text-xs font-bold text-foreground">
                    Loại bài tập (Question type template)
                  </UiLabel>
                </div>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  {Object.entries(questionTypeDescriptions).map(([typeKey, info]) => {
                    const isSelected = q.coderunnertype === typeKey;
                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => update('coderunnertype', typeKey)}
                        className={cn(
                          "group relative flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-all cursor-pointer shadow-2xs",
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 font-medium dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700"
                            : "border-border/80 bg-card text-foreground hover:border-emerald-600/40 hover:bg-muted/30"
                        )}
                        aria-pressed={isSelected}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm transition-colors",
                              isSelected
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            )}>
                              <Icon name={`fa-solid ${typeKey.startsWith('py') ? 'fa-brands fa-python' : 'fa-code'}`} />
                            </span>
                            <span className="font-heading font-bold text-sm text-foreground">
                              {info.title}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                              <Icon name="fa-solid fa-check" className="size-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {info.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 1: Question Type Select & Default Mark */}
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field label="Loại chấm điểm CodeRunner">
                  {select('coderunnertype', [
                    ['Undefined', 'Undefined'],
                    ...types.map((t) => [t.id, t.id]),
                  ])}
                </Field>
                {field(
                  'Điểm mặc định (Default mark)',
                  'general.defaultMark',
                  'number',
                  null,
                  {
                    min: 0.01,
                    step: 'any',
                  },
                )}
              </div>

              {/* Row 2: Answer box rows & Penalty regime */}
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {field(
                  'Số dòng ô code (Answer box rows)',
                  'answerboxlines',
                  'number',
                  null,
                  {
                    min: 1,
                    max: 200,
                  },
                )}
                {field('Chế độ phạt (Penalty regime)', 'penaltyregime', 'text', null)}
              </div>

              {/* Row 3: Precheck & Stop Button */}
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field label="Nút kiểm tra thử (Precheck buttons)">
                  <div className="grid grid-cols-[1fr_auto] gap-2.5 items-center">
                    {select('precheck', [
                      [0, 'Disabled (Tắt)'],
                      [1, 'Empty (Rỗng)'],
                      [2, 'Examples (Ví dụ)'],
                      [3, 'Selected (Đã chọn)'],
                      [4, 'All (Toàn bộ)'],
                    ])}
                    <div className="h-10 flex items-center px-1">
                      {check('hidecheck', 'Ẩn nút check')}
                    </div>
                  </div>
                </Field>
                <Field label="Nút dừng/bỏ cuộc (Stop button)">
                  {select('giveupallowed', [
                    [0, 'Never available (Không cho phép)'],
                    [1, 'After maximum marks (Sau điểm tối đa)'],
                    [2, 'Always available (Luôn cho phép)'],
                  ])}
                </Field>
              </div>

              {/* Row 4: Feedback & All-or-nothing Marking */}
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field label="Hiển thị phản hồi (Feedback)">
                  {select('displayfeedback', [
                    [0, 'Use quiz settings (Theo bài thi)'],
                    [1, 'Force show (Luôn hiện)'],
                    [2, 'Force hide (Luôn ẩn)'],
                  ])}
                </Field>
                <Field label="Quy tắc tính điểm (Marking)">
                  <div className="h-10 flex items-center rounded-xl border border-border/70 bg-muted/20 px-3">
                    {check('allornothing', 'Chấm đạt tất cả hoặc không (All-or-nothing)')}
                  </div>
                </Field>
              </div>

              {/* Customisation Options Box */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-foreground">Tùy biến nâng cao (Customisation)</span>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  {check('customise', 'Bật chế độ tùy biến (Customise)')}
                  {check('showsource', 'Gỡ lỗi mẫu chấm (Template debugging)')}
                </div>
              </div>

              {/* Chi tiết loại câu hỏi */}
              {selectedHelp && (
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Icon name="fa-solid fa-circle-info" className="size-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-foreground mr-1">{q.coderunnertype}:</span>
                    <span>{selectedHelp}</span>
                  </div>
                </div>
              )}

              {/* Form Customisation nếu được bật */}
              {q.customise && (
                <div className="rounded-xl border border-border/80 bg-muted/20 p-5 space-y-4 shadow-2xs">
                  <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                    <Icon name="fa-solid fa-wrench" className="text-action size-3.5" />
                    Thiết lập mẫu CodeRunner tùy chỉnh
                  </h3>
                  <Field label="Template">{area('customisation.template', 8)}</Field>
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                    <Field label="Combinator">
                      <div className="h-10 flex items-center gap-4">
                        {check('customisation.iscombinatortemplate', 'Is combinator template')}
                        {check('customisation.allowmultiplestdins', 'Allow multiple stdins')}
                      </div>
                    </Field>
                    <Field label="Test splitter regex">
                      {input('customisation.testsplitterre', 'text', {
                        disabled: !q.customisation.iscombinatortemplate,
                      })}
                    </Field>
                  </div>
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                    <Field label="Grader">
                      {select(
                        'customisation.grader',
                        ['EqualityGrader', 'NearEqualityGrader', 'RegexGrader', 'TemplateGrader'].map(
                          (v) => [v, v],
                        ),
                      )}
                    </Field>
                    <Field label="UI plugin">
                      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                        {select('customisation.uiplugin', [
                          ['textarea', 'Textarea'],
                          ['ace', 'Ace (metadata)'],
                        ])}
                        {check('customisation.useace', 'Use Ace')}
                      </div>
                    </Field>
                  </div>
                  <Field label="Result columns">{area('customisation.resultcolumns')}</Field>
                  <Field label="Prototype extra">{area('customisation.prototypeextra')}</Field>
                </div>
              )}
            </section>

            {/* Section 3: Đáp án mẫu & Khung khởi tạo */}
            <section id="sec-3-answer" className="scroll-mt-24 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    03
                  </span>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Icon name="fa-solid fa-code" className="text-primary size-4" />
                      Đáp án mẫu & Khung khởi tạo
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Lời giải tham chiếu chuẩn xác và mã gợi ý ban đầu cho học viên</p>
                  </div>
                </div>
                <span className={cn(
                  "badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  verified ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" : "bg-secondary text-muted-foreground"
                )}>
                  {verified ? '✓ Đã xác thực' : 'Chưa xác thực'}
                </span>
              </div>

              {/* Top row: Language & Validation */}
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field label="Ngôn ngữ đáp án mẫu (Language)">
                  {select(
                    'answer.language',
                    q.languages.map((l) => [l, languageNames[l]]),
                  )}
                </Field>
                <Field label="Kiểm tra khi lưu (Validation)">
                  <div className="h-10 flex items-center rounded-xl border border-border/70 bg-muted/20 px-3">
                    {check('answer.validateOnSave', 'Xác thực đáp án mẫu khi bấm Lưu')}
                  </div>
                </Field>
              </div>

              {/* Sample Answer Code Editor Box */}
              <div className="overflow-hidden rounded-xl border border-border/90 bg-card shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-slate-100/70 dark:bg-slate-900/60 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
                    <span className="size-2 rounded-full bg-action" />
                    <Icon name="fa-solid fa-file-code" className="text-action size-3.5" aria-hidden="true" />
                    solution.{q.answer.language === 'PY311' ? 'py' : 'cpp'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const boilerplate =
                        q.answer.language === 'PY311'
                          ? '# Đáp án mẫu Python 3\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n'
                          : '// Đáp án mẫu C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n';
                      update('answer.sampleAnswer', boilerplate);
                    }}
                    className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border/80 bg-card text-xs font-bold text-foreground hover:bg-accent hover:border-primary/40 hover:text-primary transition-all shadow-2xs cursor-pointer"
                  >
                    <Icon name="fa-solid fa-wand-magic-sparkles" className="size-3" aria-hidden="true" />
                    <span>Chèn khung mẫu</span>
                  </button>
                </div>
                <div className="p-3">
                  <CodeEditor
                    label="answer.sampleAnswer"
                    readOnly={busy || loadFailed}
                    value={q.answer.sampleAnswer}
                    language={q.answer.language}
                    height="400px"
                    onChange={(value) => update('answer.sampleAnswer', value)}
                  />
                </div>
              </div>

              {/* Answer box preload sub-card */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold text-foreground">
                      Khung mã khởi tạo sẵn cho học viên (Answer box preload)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => insertPreloadTemplate('cpp')}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border/60 bg-card text-xs font-semibold text-foreground hover:bg-accent hover:border-primary/40 hover:text-primary transition-all shadow-2xs cursor-pointer"
                    >
                      <Icon name="fa-solid fa-code" className="size-3" aria-hidden="true" />
                      <span>Khung C++</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertPreloadTemplate('py')}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border/60 bg-card text-xs font-semibold text-foreground hover:bg-accent hover:border-primary/40 hover:text-primary transition-all shadow-2xs cursor-pointer"
                    >
                      <Icon name="fa-brands fa-python" className="size-3" aria-hidden="true" />
                      <span>Khung Python</span>
                    </button>
                  </div>
                </div>
                {area('answer.preloadAnswer', 5)}
              </div>

              {/* Global extra sub-card */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-foreground">
                    Mã ghép nối chung (Global extra harness/headers)
                  </span>
                </div>
                {area('answer.globalExtra', 4)}
              </div>
            </section>

            {/* Section 4: Bộ kiểm thử (Test cases) */}
            <section id="sec-4-testcases" className="scroll-mt-24 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    04
                  </span>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Icon name="fa-solid fa-vials" className="text-primary size-4" />
                      Bộ kiểm thử (Test Cases)
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Đủ 5 testcase: ví dụ công khai, dữ liệu cơ bản, biên và nâng cao</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                    {q.testcases.length} / 5 testcase
                  </span>
                  {exampleCount > 0 && (
                    <span className="badge inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 text-xs font-medium">
                      <Icon name="fa-solid fa-star" className="size-3 text-amber-500" />
                      {exampleCount} Ví dụ công khai
                    </span>
                  )}
                </div>
              </div>

              {/* Test Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {q.testcases.map((t, idx) => {
                  const isFilled = Boolean(
                    t.stdin.trim() || t.expected.trim() || t.testcode.trim(),
                  );
                  const isActive = activeTestTab === idx;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        setActiveTestTab(idx);
                        const el = document.getElementById('test-block-' + idx);
                        el?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'nearest',
                        });
                      }}
                      className={cn(
                        "flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all cursor-pointer shadow-2xs",
                        isActive
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                          : "border-border/80 bg-card text-muted-foreground hover:border-emerald-600/40 hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          isFilled ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )}
                        aria-hidden="true"
                      />
                      <span>Test {String(idx + 1).padStart(2, '0')}</span>
                      {t.useasexample && (
                        <Icon
                          name="fa-solid fa-star"
                          className="size-3 text-amber-500"
                          title="Public Example"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 5 Test Case Blocks */}
              {q.testcases.map((t, i) => (
                <div
                  className="test-block space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-2xs transition-all"
                  key={t.id}
                  id={'test-block-' + i}
                >
                  <div className="test-heading flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                        Test {String(i + 1).padStart(2, '0')} <span className="text-muted-foreground font-normal text-xs">/ 05</span>
                      </h3>
                    </div>
                    <div className="inline-group flex flex-wrap items-center gap-2">
                      {t.useasexample ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 text-xs font-medium">
                          <Icon name="fa-solid fa-star" className="size-3 text-amber-500" /> Public Example
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 text-muted-foreground px-2.5 py-0.5 text-xs font-medium">
                          Không công khai
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-mono font-medium text-foreground">
                        {displayNames[t.display] || t.display}
                      </span>
                    </div>
                  </div>

                  <div className="test-io-grid grid min-w-0 gap-4 sm:grid-cols-2">
                    {[
                      { key: 'stdin', label: 'Standard Input', tag: 'stdin', badge: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300' },
                      { key: 'expected', label: 'Expected output', tag: 'stdout', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' },
                      { key: 'testcode', label: 'Test code / harness', tag: 'harness', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300' },
                      { key: 'extra', label: 'Extra template data', tag: 'extra', badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
                    ].map(({ key, label, tag, badge }) => (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-action" />
                            {label}
                          </span>
                          <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border", badge)}>
                            {tag}
                          </span>
                        </div>
                        {area('testcases.' + i + '.' + key, 3)}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-border/80 bg-slate-100/60 dark:bg-slate-900/40 p-4 space-y-3.5">
                    {/* Checkboxes row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
                      <div className="flex flex-wrap items-center gap-5 sm:gap-7">
                        {check('testcases.' + i + '.useasexample', 'Ví dụ công khai (Use as example)')}
                        {check('testcases.' + i + '.hiderestiffail', 'Ẩn các test sau nếu sai')}
                      </div>
                    </div>

                    {/* Controls row: Display, Mark, Order in clean 3-col grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-action" />
                          Hiển thị (Display)
                        </span>
                        {select('testcases.' + i + '.display', Object.entries(displayNames))}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-action" />
                          Điểm số (Mark)
                        </span>
                        {input('testcases.' + i + '.mark', 'number', {
                          min: 0,
                          step: 'any',
                          disabled: q.allornothing,
                        })}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-action" />
                          Thứ tự test (Order)
                        </span>
                        {input('testcases.' + i + '.ordering', 'number', {
                          step: 1,
                        })}
                      </div>
                    </div>
                  </div>

                  {q.precheck === 3 && (
                    <Field label="Loại test kiểm tra trước (Precheck test type)">
                      {select('testcases.' + i + '.testtype', [
                        [0, 'Check only (Chỉ khi Check)'],
                        [1, 'Precheck only (Chỉ khi Precheck)'],
                        [2, 'Both (Cả hai)'],
                      ])}
                    </Field>
                  )}
                </div>
              ))}
            </section>

            {/* Section 5: Nâng cao & Xuất bản */}
            <section id="sec-5-advanced" className="scroll-mt-24 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    05
                  </span>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Icon name="fa-solid fa-rocket" className="text-primary size-4" />
                      Nâng cao & Xuất bản
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Trạng thái xuất bản, tham gia Code Survival, thẻ tags và tệp đính kèm</p>
                  </div>
                </div>
                <span className={cn(
                  "badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  q.general.status === 'ready'
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                )}>
                  <span className={cn("size-2 rounded-full", q.general.status === 'ready' ? "bg-emerald-500" : "bg-amber-500")} />
                  {q.general.status === 'ready' ? 'Ready' : 'Draft'}
                </span>
              </div>

              {/* Status choice cards (Bản nháp / Công bố) */}
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => update('general.status', 'draft')}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer shadow-2xs",
                    q.general.status === 'draft'
                      ? "border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20 font-medium dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-600"
                      : "border-border/80 bg-card text-foreground hover:border-amber-500/40 hover:bg-muted/30"
                  )}
                  aria-pressed={q.general.status === 'draft'}
                >
                  <span className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm",
                    q.general.status === 'draft'
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Icon name="fa-solid fa-file-pen" />
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-foreground">Bản nháp (Draft)</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Đang biên soạn, lưu tự do không yêu cầu đủ test</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => update('general.status', 'ready')}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer shadow-2xs",
                    q.general.status === 'ready'
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 font-medium dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700"
                      : "border-border/80 bg-card text-foreground hover:border-emerald-600/40 hover:bg-muted/30"
                  )}
                  aria-pressed={q.general.status === 'ready'}
                >
                  <span className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm",
                    q.general.status === 'ready'
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Icon name="fa-solid fa-circle-check" />
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-foreground">Công bố (Ready)</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Công khai luyện tập (yêu cầu đúng 5 testcase hợp lệ)</p>
                  </div>
                </button>
              </div>

              {/* Code Survival Card */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold text-foreground">Đấu trường Code Survival</span>
                  </div>
                  <div>
                    {check('survivalEligible', trUI('Cho phép sử dụng bài tập này trong chế độ sinh tồn Code Survival'))}
                  </div>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border",
                  verified ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground border-border"
                )}>
                  <Icon name={`fa-solid ${verified ? 'fa-check' : 'fa-clock'}`} className="size-3" />
                  {verified ? 'Đáp án mẫu đã xác thực' : 'Chưa xác thực đáp án'}
                </span>
              </div>

              {/* Tags Box */}
              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
                <Field label="Tags (Thẻ phân loại đề)">
                  <UiInput
                    aria-label="tags"
                    placeholder="Ví dụ: dp, math, greedy, array, binary-search..."
                    value={q.tags.join(', ')}
                    className="h-10 rounded-xl border border-border/90 bg-slate-100/60 px-3 text-sm font-semibold text-foreground transition-all shadow-xs hover:border-action/60 hover:bg-card focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20 dark:border-border dark:bg-slate-900/50 dark:hover:bg-card dark:focus-visible:bg-card"
                    onChange={(e) =>
                      update(
                        'tags',
                        e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </Field>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">Gợi ý nhanh:</span>
                  {[
                    'dp',
                    'math',
                    'greedy',
                    'string',
                    'array',
                    'binary-search',
                    'sorting',
                    'graphs',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="h-6 px-2 text-xs font-mono font-medium rounded-md border border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/70 hover:text-foreground transition-all shadow-2xs cursor-pointer"
                      onClick={() => {
                        if (!q.tags.includes(tag)) {
                          update('tags', [...q.tags, tag]);
                        }
                      }}
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tham số & cấu hình giao diện */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-foreground">Tham số giao diện & Template</span>
                </div>
                <Field label="Template params">{area('templateparams', 3)}</Field>
                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <Field label="Template controls">
                    <div className="h-10 flex items-center gap-3 flex-wrap">
                      {check('hoisttemplateparams', 'Hoist params')}
                      {check('extractcodefromjson', 'JSON code')}
                      {check('twigall', 'Twig all')}
                    </div>
                  </Field>
                  <Field label="Ngôn ngữ Template">
                    {select(
                      'templateparamslang',
                      [
                        'None',
                        'twig',
                        'python3',
                        'C',
                        'C++',
                        'Java',
                        'php',
                        'Octave',
                        'Pascal',
                      ].map((v) => [v, v === 'twig' ? 'Twig' : v]),
                    )}
                  </Field>
                </div>
                <Field label="UI parameters">{area('uiparameters', 3)}</Field>
              </div>

              {/* Advanced Customisation (Sandbox & Limits) */}
              {q.customise && (
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-action shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold text-foreground">Cấu hình Sandbox & Giới hạn</span>
                  </div>
                  <div className="grid min-w-0 gap-4 sm:grid-cols-3">
                    <Field label="Prototype type">
                      {select('advancedCustomisation.prototypetype', [
                        [0, 'No'],
                        [2, 'Yes — user defined (draft)'],
                      ])}
                    </Field>
                    <Field label="Type name">
                      {input('advancedCustomisation.typename', 'text', {
                        disabled: q.advancedCustomisation.prototypetype !== 2,
                      })}
                    </Field>
                    <Field label="Sandbox">
                      {select('advancedCustomisation.sandbox', [
                        ['DOCKER', 'Docker isolated runner'],
                      ])}
                    </Field>
                  </div>
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                    {field(
                      'Giới hạn thời gian CPU (CPU time limit - giây)',
                      'advancedCustomisation.cputimelimitsecs',
                      'number',
                      null,
                      {
                        min: 1,
                        max: 10,
                      },
                    )}
                    {field(
                      'Giới hạn bộ nhớ (Memory limit - MB)',
                      'advancedCustomisation.memlimitmb',
                      'number',
                      null,
                      {
                        min: 0,
                        max: 512,
                      },
                    )}
                  </div>
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                    {field('Language', 'advancedCustomisation.language')}
                    {field('Ace language', 'advancedCustomisation.acelang')}
                  </div>
                  <Field label="Sandbox params">{area('advancedCustomisation.sandboxparams', 2)}</Field>
                </div>
              )}
            </section>
</fieldset>
        </div>

        {/* Right Column: Support, Checklist & Fact List */}
        <aside
          className="studio-support space-y-5 min-[961px]:col-span-2 min-[1361px]:sticky min-[1361px]:top-20 min-[1361px]:col-span-1 [&>section]:rounded-2xl [&>section]:border [&>section]:bg-card [&>section]:p-5 [&>section]:shadow-sm [&_h2]:my-3 [&_h2]:text-base [&_h3]:mb-3 [&_h3]:text-base"
          aria-label="Kiểm tra & tóm tắt đề"
        >
          <section>
            <span className="eyebrow text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              PUBLISH CHECKLIST
            </span>
            <h2 className="text-base font-bold text-foreground">Trạng thái đề</h2>

            <div className="checklist-progress-box mb-3 flex items-center justify-between gap-3 border-b pb-3 text-xs font-semibold text-success">
              <span className="checklist-progress-text">
                {completedCount} / {checklistItems.length} mục hoàn tất
              </span>
              <span className="badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-bold text-foreground">
                {progressPercent}%
              </span>
            </div>
            <div className="checklist-progress-bar-bg mb-4 [&_[role=progressbar]]:h-2">
              <ProgressMeter className="checklist-progress-bar-fill" value={progressPercent} />
            </div>

            <ul className="studio-checklist space-y-2.5 text-xs text-muted-foreground">
              {checklistItems.map(([ok, label, targetSec, fieldName]) => (
                <li
                  key={label}
                  role="button"
                  tabIndex={0}
                  className="flex cursor-pointer items-start gap-2.5 hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50"
                  onClick={() => scrollToSection(targetSec, fieldName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      scrollToSection(targetSec, fieldName);
                    }
                  }}
                >
                  <Icon
                    aria-hidden="true"
                    name={'fa-solid ' + (ok ? 'fa-circle-check text-emerald-600 dark:text-emerald-400' : 'fa-circle-minus text-muted-foreground/60')}
                    className="mt-0.5 size-3.5 shrink-0"
                  />
                  <span className={ok ? 'text-foreground font-medium' : ''}>{label}</span>
                  <span className="sr-only">{ok ? 'Đạt' : 'Chưa đạt'}</span>
                </li>
              ))}
            </ul>

            <div className={cn(
              "studio-validation mt-4 rounded-xl p-3 text-xs flex items-center gap-2",
              issues.length ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            )} role="status">
              <Icon
                name={`fa-solid ${issues.length ? 'fa-triangle-exclamation' : 'fa-check'}`}
                aria-hidden="true"
                className="size-4 shrink-0"
              />
              <span className="font-medium">
                {issues.length
                  ? issues.length + ' vấn đề cần kiểm tra'
                  : 'Cấu hình hợp lệ để gửi lưu'}
              </span>
            </div>

            {issues.length > 0 && (
              <details className="mt-3 text-xs text-destructive rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                <summary className="font-semibold cursor-pointer">Xem vấn đề cấu hình ({issues.length})</summary>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  {issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section>
            <h3 className="font-bold text-sm text-foreground">Tóm tắt cấu hình</h3>
            <dl className="fact-list divide-y text-xs [&>div]:grid [&>div]:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] [&>div]:gap-2 [&>div]:py-2.5 [&_dt]:text-muted-foreground [&_dd]:text-right [&_dd]:font-medium [&_dd]:text-foreground">
              <div>
                <dt>Loại câu hỏi</dt>
                <dd className="font-mono">{q.coderunnertype}</dd>
              </div>
              <div>
                <dt>Ngôn ngữ</dt>
                <dd>{q.languages.map((l) => languageNames[l]).join(', ') || 'Chưa chọn'}</dd>
              </div>
              <div>
                <dt>Testcases</dt>
                <dd>
                  {q.testcases.length} · {exampleCount} Public Example
                </dd>
              </div>
              <div>
                <dt>Điểm mặc định</dt>
                <dd>{q.general.defaultMark}</dd>
              </div>
              <div>
                <dt>Code Survival</dt>
                <dd>{q.survivalEligible ? 'Cho phép' : 'Không dùng'}</dd>
              </div>
            </dl>

          </section>

          {readDraft() && (
            <section className="space-y-3">
              <h3 className="font-bold text-sm text-foreground">Nháp trên thiết bị</h3>

              <UiButton
                type="button"
                className="w-full h-9 border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent hover:border-primary/40 hover:text-primary text-xs font-semibold rounded-xl transition-all"
                disabled={busy || loadFailed}
                onClick={() => {
                  try {
                    if (dirty && !window.confirm(trUI('Thay nội dung hiện tại bằng nháp cục bộ?')))
                      return;
                    setQ(normalize(JSON.parse(readDraft())));
                    setDirty(true);
                  } catch (e) {
                    setError(e);
                  }
                }}
                variant="outline"
              >
                Khôi phục nháp cục bộ
              </UiButton>
            </section>
          )}
        </aside>
      </div>

      {/* Bottom Sticky Action Bar */}
      <footer className="savebar studio-savebar sticky bottom-3 z-30 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className={cn(
            "size-2.5 rounded-full shrink-0",
            busy ? "bg-amber-500 animate-ping" : dirty ? "bg-amber-500" : "bg-emerald-500"
          )} />
          <div>
            <b className="text-foreground">
              {busy ? (
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <Icon name="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Đang lưu lên máy chủ…
                </span>
              ) : dirty ? (
                'Có thay đổi chưa lưu'
              ) : (
                'Không có thay đổi'
              )}
            </b>
            {dirty && (
              <div className="text-[11px] text-muted-foreground">
                Đã lưu tạm trên thiết bị
              </div>
            )}
          </div>
        </div>
        <div className="inline-group flex flex-wrap items-center gap-2.5">
          <UiButton
            type="button"
            className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground h-10 px-4 rounded-xl text-xs font-semibold"
            disabled={busy}
            onClick={cancel}
            variant="ghost"
          >
            Hủy
          </UiButton>
          <UiButton
            type="button"
            className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground h-10 px-4 rounded-xl text-xs font-semibold"
            aria-busy={busy}
            disabled={busy || loadFailed}
            onClick={() => save(true)}
            variant="outline"
          >
            Lưu và tiếp tục sửa
          </UiButton>
          <UiButton
            type="button"
            aria-busy={busy}
            disabled={busy || loadFailed}
            onClick={() => save(false)}
            className="h-10 px-5 rounded-xl text-xs font-bold gap-2 bg-action text-white hover:bg-action-hover active:bg-action-active shadow-xs transition-all disabled:opacity-50"
          >
            <Icon name="fa-solid fa-floppy-disk" aria-hidden="true" className="size-3.5" />
            Lưu thay đổi →
          </UiButton>
        </div>
      </footer>
    </div>
  );
}
