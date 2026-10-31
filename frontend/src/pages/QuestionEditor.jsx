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
import { Field, Section, Check, ErrorBox, Loading, go } from '../components/ui';
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
  const input = (path, type = 'text', props = {}) => (
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
      {...props}
    />
  );
  const area = (path, rows = 4) => (
    <UiTextarea
      className={
        /answer|testcases|template|globalextra/i.test(path)
          ? 'code-input w-full font-mono'
          : undefined
      }
      aria-label={path}
      spellCheck={false}
      rows={rows}
      value={at(q, path) ?? ''}
      onChange={(e) => update(path, e.target.value)}
    />
  );
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
  const field = (label, path, type = 'text', help = label, props = {}) => (
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
      <header className="studio-header mb-7 flex flex-col items-start justify-between gap-6 border-b pt-6 pb-7 min-[961px]:flex-row">
        <div className="studio-header-main min-w-0 flex-1 space-y-3">
          <div className="studio-breadcrumbs flex flex-wrap items-center gap-3 mb-2 text-xs text-muted-foreground">
            <UiButton
              type="button"
              className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground studio-back-btn"
              onClick={cancel}
              title={trUI('Quay lại kho bài')}
              variant="ghost"
            >
              <Icon name="fa-solid fa-arrow-left" aria-hidden="true" />{' '}
              <span>{trUI('Luyện tập')}</span>
            </UiButton>
            <span className="studio-breadcrumb-separator" aria-hidden="true">
              /
            </span>
            <span className="eyebrow studio-kicker text-xs font-medium uppercase tracking-wider text-muted-foreground">
              QUESTION STUDIO <span aria-hidden="true">/</span> {id ? 'EDIT' : 'NEW'}
            </span>
          </div>

          <div className="studio-title-row flex items-center gap-3 flex-wrap">
            <h1
              className="studio-title text-2xl font-semibold tracking-tight"
              title={q.general.questionName || 'Tạo câu hỏi mới'}
            >
              {q.general.questionName || 'Tạo câu hỏi mới'}
            </h1>
          </div>

          <div className="studio-badges inline-group flex flex-wrap items-center gap-2">
            <span className="badge studio-id-badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
              <Icon name="fa-solid fa-hashtag" aria-hidden="true" /> {q.publicId || 'Chưa cấp mã'}
            </span>
            <span
              className={cn(
                "badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium studio-status-badge",
                q.general.status === 'ready'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              )}
            >
              <span
                className={cn("size-2 rounded-full", q.general.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500')}
                aria-hidden="true"
              />
              {q.general.status === 'ready' ? 'Ready / Công bố' : 'Bản nháp'}
            </span>
            <span
              className={`badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium level-pill level-${q.difficulty}`}
            >
              Mức {q.difficulty}
            </span>
            <small className="studio-meta-text text-sm leading-relaxed text-muted-foreground">
              {q.id ? 'Version ' + q.version : 'Chưa lưu lên server'} ·{' '}
              {dirty ? 'Có thay đổi chưa lưu' : 'Không có thay đổi'}
            </small>
          </div>
        </div>

        <div className="studio-tools flex flex-wrap items-center gap-2.5 [&_button]:min-h-9 [&_button]:text-xs [&_.button]:inline-flex [&_.button]:min-h-9 [&_.button]:cursor-pointer [&_.button]:items-center [&_.button]:gap-2 [&_.button]:rounded-md [&_.button]:border [&_.button]:border-input [&_.button]:bg-card [&_.button]:px-3 [&_.button]:text-xs [&_.button]:font-semibold [&_.button]:text-success">
          <UiButton
            type="button"
            className={`secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground studio-preview-toggle ${preview ? 'is-active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15' : ''}`}
            aria-pressed={preview}
            onClick={() => setPreview(!preview)}
            variant="outline"
          >
            <Icon name={`fa-solid ${preview ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
            {preview ? trUI('Đóng xem trước') : trUI('Xem nội dung đề')}
          </UiButton>
          <UiLabel
            className="button secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground studio-import-btn"
            title="Nhập file JSON đề"
          >
            <Icon name="fa-solid fa-file-import" aria-hidden="true" /> Nhập JSON
            <UiInput
              type="file"
              accept=".json,application/json"
              hidden
              disabled={busy || loadFailed}
              onChange={importJson}
            />
          </UiLabel>
          <UiButton
            type="button"
            className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground studio-export-btn"
            disabled={busy || loadFailed}
            onClick={exportJson}
            title="Xuất file JSON đề"
            variant="outline"
          >
            <Icon name="fa-solid fa-file-export" aria-hidden="true" /> Xuất JSON
          </UiButton>
          <UiButton
            type="button"
            className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground studio-close-btn"
            disabled={busy}
            onClick={cancel}
            variant="ghost"
          >
            {trUI('Đóng')}
          </UiButton>
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
          className="studio-nav rounded-2xl border bg-card p-4 shadow-sm min-[961px]:sticky min-[961px]:top-20 space-y-3"
          aria-label="Mục lục bài tập"
        >
          <div className="flex items-center justify-between border-b border-border/80 pb-3 px-1">
            <div className="flex items-center gap-2">
              <Icon name="fa-solid fa-list-check" className="text-primary size-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                MỤC LỤC ĐIỀU HƯỚNG
              </span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              5 mục
            </span>
          </div>

          <div className="space-y-1">
            {sections.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={cn(
                    "w-full text-left flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer group text-xs",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/25 shadow-xs"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : sec.check
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20 group-hover:text-foreground"
                      )}
                    >
                      {sec.num}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{sec.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{sec.subtitle}</div>
                    </div>
                  </div>
                  <Icon
                    name={'fa-solid ' + (sec.check ? 'fa-circle-check text-emerald-600 dark:text-emerald-400' : sec.icon)}
                    className={cn("size-3.5 shrink-0 opacity-70 group-hover:opacity-100", isActive && "opacity-100")}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Icon name="fa-solid fa-circle-info" className="text-primary size-3.5" />
              <span>Soạn đề liền mạch</span>
            </div>
            <p>Toàn bộ 5 phần được hiển thị liên tục không phân trang. Bấm mục lục hoặc checklist để cuộn nhanh đến phần cần xem.</p>
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

                <small className="muted text-xs text-muted-foreground block pt-2 border-t">
                  Bản xem trước nội dung; bộ chấm sử dụng cấu hình đã lưu trên server.
                </small>
              </div>
            </section>
          )}

          {/* Continuous Fieldset */}
          <fieldset disabled={busy || loadFailed} className="space-y-6 border-0 p-0 m-0 min-w-0">
            {/* Section 1: Thông tin cơ bản */}
            <section id="sec-1-info" className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
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
                <div className="two-cols grid min-w-0 gap-4 sm:grid-cols-2">
                  <Field label="Category">
                    {select(
                      'general.categoryId',
                      categories.map((c) => [c.id, c.name]),
                    )}
                  </Field>
                  {field(trUI('Mã tham chiếu ngoài'), 'general.idNumber')}
                </div>
                {field(
                  'Question name',
                  'general.questionName',
                  'text',
                  'Tên tiêu đề hiển thị của bài tập',
                )}

                {/* Visual Difficulty Selector */}
                <div className="difficulty-selector space-y-3">
                  <UiLabel className="field-label flex items-center gap-2 text-sm">
                    {trUI('Độ khó (Difficulty)')}
                  </UiLabel>
                  <div className="difficulty-grid grid min-w-0 grid-cols-2 gap-2.5 min-[481px]:grid-cols-3 min-[1201px]:grid-cols-6 [&_button]:h-auto [&_button]:min-h-[76px] [&_button]:items-center [&_button]:border-border [&_button]:py-3 [&_button]:whitespace-normal [&_small]:text-[10px]">
                    {difficultyInfo.map((item) => (
                      <UiButton
                        key={item.level}
                        role="button"
                        tabIndex={0}
                        className={`difficulty-card flex h-auto min-h-20 cursor-pointer flex-col items-start justify-center gap-1 rounded-lg border bg-card p-3 text-foreground transition-colors hover:border-primary/50 ${item.color}  ${q.difficulty === item.level ? 'is-selected border-primary bg-accent text-accent-foreground ring-1 ring-primary/30' : ''}`}
                        onClick={() => update('difficulty', item.level)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            update('difficulty', item.level);
                          }
                        }}
                        type="button"
                        variant="outline"
                        aria-pressed={q.difficulty === item.level}
                      >
                        <span className="diff-number text-lg font-semibold">L{item.level}</span>
                        <span className="diff-name text-xs font-normal">{item.name}</span>
                      </UiButton>
                    ))}
                  </div>
                  {/* Kept synchronized for accessibility and form validation */}
                  <div className="hidden">
                    <Field label="Difficulty">
                      {select(
                        'difficulty',
                        [1, 2, 3, 4, 5, 6].map((d) => [d, trUI('Mức ') + d]),
                      )}
                    </Field>
                  </div>
                </div>

                {/* Visual Language Chips */}
                <div className="field grid min-w-0 gap-4">
                  <div className="field-label flex items-center gap-2 text-sm">
                    {trUI('Ngôn ngữ lập trình hỗ trợ')}
                  </div>
                  <div className="lang-selector-group flex flex-wrap items-center gap-2">
                    {Object.entries(languageNames).map(([k, n]) => {
                      const active = q.languages.includes(k);
                      return (
                        <UiButton
                          type="button"
                          key={k}
                          className={`lang-chip-btn h-9 ${active ? 'is-active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15' : ''}`}
                          onClick={() =>
                            update(
                              'languages',
                              active ? q.languages.filter((l) => l !== k) : [...q.languages, k],
                            )
                          }
                          variant="default"
                        >
                          <Icon
                            name={`fa-solid ${k.startsWith('PY') ? 'fa-brands fa-python' : 'fa-code'}`}
                            aria-hidden="true"
                          />
                          <span>{n}</span>
                          {active && <Icon name="fa-solid fa-check" aria-hidden="true" />}
                        </UiButton>
                      );
                    })}
                    <div className="lang-quick-actions flex flex-wrap items-center gap-2">
                      <UiButton
                        type="button"
                        className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
                        onClick={() => update('languages', Object.keys(languageNames))}
                        variant="ghost"
                      >
                        Tất cả
                      </UiButton>
                      <UiButton
                        type="button"
                        className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
                        onClick={() => update('languages', ['PY311'])}
                        variant="ghost"
                      >
                        Chỉ Python
                      </UiButton>
                      <UiButton
                        type="button"
                        className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
                        onClick={() => update('languages', ['CPP11', 'CPP17', 'CPP20'])}
                        variant="ghost"
                      >
                        Chỉ C++
                      </UiButton>
                    </div>
                  </div>
                  {/* Standard hidden check group for form accessibility */}
                  <div className="hidden">
                    <div className="inline-group flex flex-wrap items-center gap-2">
                      {Object.entries(languageNames).map(([k, n]) => (
                        <Check
                          key={k}
                          label={n}
                          checked={q.languages.includes(k)}
                          onChange={(yes) =>
                            update(
                              'languages',
                              yes ? [...q.languages, k] : q.languages.filter((l) => l !== k),
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Question Statement with Toolbar */}
                <div className="field grid min-w-0 gap-4">
                  <div className="field-label flex items-center gap-2 text-sm">Question text</div>
                  <div className="statement-toolbar rounded-t-lg border bg-muted/50 p-2 flex flex-wrap items-center gap-2">
                    <span className="statement-toolbar-label text-xs text-muted-foreground flex items-center gap-1.5">
                      <Icon name="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /> Mẫu nhanh:
                    </span>
                    <UiButton
                      type="button"
                      className="statement-tool-btn flex flex-wrap items-center gap-2"
                      onClick={() => insertStatementTemplate('desc')}
                      variant="ghost"
                    >
                      + Mô tả
                    </UiButton>
                    <UiButton
                      type="button"
                      className="statement-tool-btn flex flex-wrap items-center gap-2"
                      onClick={() => insertStatementTemplate('input')}
                      variant="ghost"
                    >
                      + Đầu vào
                    </UiButton>
                    <UiButton
                      type="button"
                      className="statement-tool-btn flex flex-wrap items-center gap-2"
                      onClick={() => insertStatementTemplate('output')}
                      variant="ghost"
                    >
                      + Đầu ra
                    </UiButton>
                    <UiButton
                      type="button"
                      className="statement-tool-btn flex flex-wrap items-center gap-2"
                      onClick={() => insertStatementTemplate('constraints')}
                      variant="ghost"
                    >
                      + Ràng buộc
                    </UiButton>
                    <UiButton
                      type="button"
                      className="statement-tool-btn flex flex-wrap items-center gap-2"
                      onClick={() => insertStatementTemplate('example')}
                      variant="ghost"
                    >
                      + Ví dụ
                    </UiButton>
                  </div>
                  <div className="statement-textarea-wrapper w-full font-mono [&_textarea]:min-h-[300px] [&_textarea]:leading-[1.8]">
                    {area('general.questionText', 10)}
                  </div>
                </div>

                <Field label="General feedback">{area('general.generalFeedback', 3)}</Field>
            </section>

            {/* Section 2: Cấu hình chấm */}
            <section id="sec-2-grading" className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
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
                <div className="coderunner-type-grid [&_button]:h-auto [&_button]:whitespace-normal [&_button]:p-4 grid min-w-0 gap-4 sm:grid-cols-2">
                  {Object.entries(questionTypeDescriptions).map(([typeKey, info]) => (
                    <UiButton
                      key={typeKey}
                      role="button"
                      tabIndex={0}
                      className={`coderunner-type-card grid h-auto min-h-28 cursor-pointer gap-2 whitespace-normal rounded-[14px] border bg-card p-4 text-left text-foreground hover:border-primary/50 [&_h4]:flex [&_h4]:items-center [&_h4]:gap-2 [&_p]:text-xs [&_p]:font-normal [&_p]:leading-5 [&_p]:text-muted-foreground ${q.coderunnertype === typeKey ? 'is-active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15' : ''}`}
                      onClick={() => update('coderunnertype', typeKey)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          update('coderunnertype', typeKey);
                        }
                      }}
                      type="button"
                      variant="outline"
                      aria-pressed={q.coderunnertype === typeKey}
                    >
                      <h4>
                        <Icon
                          name={`fa-solid ${typeKey.startsWith('py') ? 'fa-brands fa-python' : 'fa-code'}`}
                          aria-hidden="true"
                        />
                        {info.title}
                        {q.coderunnertype === typeKey && (
                          <Icon
                            name="fa-solid fa-circle-check"
                            aria-hidden="true"
                            className="ml-auto text-emerald-700"
                          />
                        )}
                      </h4>
                      <p>{info.desc}</p>
                    </UiButton>
                  ))}
                </div>

                <div className="two-cols grid min-w-0 gap-4 sm:grid-cols-2">
                  <Field label="Question type">
                    {select('coderunnertype', [
                      ['Undefined', 'Undefined'],
                      ...types.map((t) => [t.id, t.id]),
                    ])}
                  </Field>
                  {field(
                    'Default mark',
                    'general.defaultMark',
                    'number',
                    trUI('Tổng điểm câu hỏi, khác trọng số Mark của từng test.'),
                    {
                      min: 0.01,
                      step: 'any',
                    },
                  )}
                </div>

                <div className="two-cols grid min-w-0 gap-4 sm:grid-cols-2">
                  {field(
                    'Answer box — Rows',
                    'answerboxlines',
                    'number',
                    trUI('Số dòng ô trả lời của coder, không phải số dòng testcase.'),
                    {
                      min: 1,
                      max: 200,
                    },
                  )}
                  {field(
                    'Penalty regime',
                    'penaltyregime',
                    'text',
                    trUI('Lưu penalty Moodle; Code Survival dùng cố định 10 giây/lần sai.'),
                  )}
                </div>

                <div className="two-cols grid min-w-0 gap-4 sm:grid-cols-2">
                  <Field label="Submit buttons">
                    <div className="inline-group flex flex-wrap items-center gap-2">
                      {select('precheck', [
                        [0, 'Disabled'],
                        [1, 'Empty'],
                        [2, 'Examples'],
                        [3, 'Selected'],
                        [4, 'All'],
                      ])}
                      {check('hidecheck', 'Hide check')}
                    </div>
                  </Field>
                  <Field label="Stop button">
                    {select('giveupallowed', [
                      [0, 'Never available'],
                      [1, 'After maximum marks'],
                      [2, 'Always available'],
                    ])}
                    <small className="muted text-sm leading-relaxed text-muted-foreground">
                      Chỉ khả dụng với bản nháp.
                    </small>
                  </Field>
                </div>

                <div className="two-cols grid min-w-0 gap-4 sm:grid-cols-2">
                  <Field label="Feedback">
                    {select('displayfeedback', [
                      [0, 'Use quiz settings'],
                      [1, 'Force show'],
                      [2, 'Force hide'],
                    ])}
                  </Field>
                  <Field label="Marking">{check('allornothing', 'All-or-nothing grading')}</Field>
                </div>

                <Field label="Customisation">
                  <div className="inline-group flex flex-wrap items-center gap-2">
                    {check('customise', 'Customise')}
                    {check('showsource', 'Template debugging')}
                  </div>
                </Field>

                <Section title="Chi tiết loại câu hỏi">
                  <p>
                    <strong>{q.coderunnertype}:</strong> {selectedHelp}
                  </p>
                  <p className="muted text-sm leading-relaxed text-muted-foreground">
                    EqualityGrader so sánh chính xác, chỉ chuẩn hóa CRLF → LF. NearEqualityGrader dùng
                    sai số tương đối 10⁻⁶. RegexGrader dùng RE2.
                  </p>
                </Section>

                {q.customise && (
                  <Section title="Tùy biến nâng cao (Customisation)" open>
                    <div className="alert my-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed">
                      Chỉ khả dụng với bản nháp.
                    </div>
                    <Field label="Template">{area('customisation.template', 8)}</Field>
                    <Field label="Combinator">
                      {check('customisation.iscombinatortemplate', 'Is combinator template')}
                      {check('customisation.allowmultiplestdins', 'Allow multiple stdins')}
                    </Field>
                    <Field label="Test splitter regex">
                      {input('customisation.testsplitterre', 'text', {
                        disabled: !q.customisation.iscombinatortemplate,
                      })}
                    </Field>
                    <Field label="Grader">
                      {select(
                        'customisation.grader',
                        ['EqualityGrader', 'NearEqualityGrader', 'RegexGrader', 'TemplateGrader'].map(
                          (v) => [v, v],
                        ),
                      )}
                    </Field>
                    <Field label="Result columns">{area('customisation.resultcolumns')}</Field>
                    <Field label="UI plugin">
                      {select('customisation.uiplugin', [
                        ['textarea', 'Textarea'],
                        ['ace', 'Ace (metadata)'],
                      ])}
                      {check('customisation.useace', 'Use Ace (metadata)')}
                    </Field>
                    <Field label="Prototype extra">{area('customisation.prototypeextra')}</Field>
                  </Section>
                )}
            </section>

            {/* Section 3: Đáp án mẫu & Khung khởi tạo */}
            <section id="sec-3-answer" className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
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
                <div className="two-cols grid min-w-0 gap-4 sm:grid-cols-2">
                  <Field label="Sample answer language">
                    {select(
                      'answer.language',
                      q.languages.map((l) => [l, languageNames[l]]),
                    )}
                  </Field>
                  <Field label="Validate on Save">
                    {check('answer.validateOnSave', 'Validate sample answer on save')}
                  </Field>
                </div>

                <div className="answer-editor-box min-w-0 overflow-hidden rounded-lg border bg-card">
                  <div className="answer-editor-toolbar flex flex-wrap items-center gap-2">
                    <span className="answer-editor-filename">
                      <Icon name="fa-solid fa-file-code" aria-hidden="true" />
                      solution.{q.answer.language === 'PY311' ? 'py' : 'cpp'}
                    </span>
                    <div className="answer-editor-actions flex flex-wrap items-center gap-2">
                      <UiButton
                        type="button"
                        className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground text-[11px] px-2 py-1 min-h-7"
                        onClick={() => {
                          const boilerplate =
                            q.answer.language === 'PY311'
                              ? '# Đáp án mẫu Python 3\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n'
                              : '// Đáp án mẫu C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n';
                          update('answer.sampleAnswer', boilerplate);
                        }}
                        variant="ghost"
                      >
                        <Icon name="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /> Chèn
                        khung mẫu
                      </UiButton>
                    </div>
                  </div>
                  <Field label="Sample answer">
                    <CodeEditor
                      label="answer.sampleAnswer"
                      readOnly={busy || loadFailed}
                      value={q.answer.sampleAnswer}
                      language={q.answer.language}
                      height="400px"
                      onChange={(value) => update('answer.sampleAnswer', value)}
                    />
                  </Field>
                </div>

              <Section title="Answer box preload" open={!!q.answer.preloadAnswer}>
                <div className="inline-group flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="muted text-sm leading-relaxed text-muted-foreground">
                    Mã khởi tạo sẵn trong ô code của học viên:
                  </span>
                  <UiButton
                    type="button"
                    className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground text-[11px] px-2 py-1 min-h-7"
                    onClick={() => insertPreloadTemplate('cpp')}
                    variant="ghost"
                  >
                    Khung C++
                  </UiButton>
                  <UiButton
                    type="button"
                    className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground text-[11px] px-2 py-1 min-h-7"
                    onClick={() => insertPreloadTemplate('py')}
                    variant="ghost"
                  >
                    Khung Python
                  </UiButton>
                </div>
                <Field label="Preload">{area('answer.preloadAnswer', 6)}</Field>
              </Section>

              <Section title="Global extra" open={!!q.answer.globalExtra}>
                <p className="muted text-sm leading-relaxed text-muted-foreground">
                  Mã bổ trợ chung (header, struct, hoặc hàm test harness) được ghép nối khi chấm
                  bài.
                </p>
                <Field label="Global extra">{area('answer.globalExtra', 5)}</Field>
              </Section>
            </section>

            {/* Section 4: Bộ kiểm thử (Test cases) */}
            <section id="sec-4-testcases" className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
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
                <div className="testcases-toolbar mb-4 flex flex-wrap items-center gap-2">
                  <div className="testcases-nav-strip mb-4 flex flex-wrap items-center gap-2">
                    {q.testcases.map((t, idx) => {
                      const isFilled = Boolean(
                        t.stdin.trim() || t.expected.trim() || t.testcode.trim(),
                      );
                      return (
                        <UiButton
                          type="button"
                          key={t.id}
                          className={`test-pill-btn h-8 ${activeTestTab === idx ? 'is-active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15' : ''}`}
                          onClick={() => {
                            setActiveTestTab(idx);
                            const el = document.getElementById('test-block-' + idx);
                            el?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'nearest',
                            });
                          }}
                          variant="default"
                        >
                          <span
                            className={`test-status-dot ${isFilled ? 'is-filled border-emerald-200 bg-emerald-50 text-emerald-800' : ''}`}
                            aria-hidden="true"
                          />
                          <span>Test {String(idx + 1).padStart(2, '0')}</span>
                          {t.useasexample && (
                            <Icon
                              name="fa-solid fa-star"
                              title="Public Example"
                              aria-hidden="true"
                            />
                          )}
                        </UiButton>
                      );
                    })}
                  </div>
                  <p className="muted text-muted-foreground m-0 text-[11px]">
                    Whitespace được giữ nguyên. Display chỉ điều khiển hiển thị, mọi test đã chọn
                    vẫn được chấm.
                  </p>
                </div>

                {/* 5 Test Case Blocks */}
                {q.testcases.map((t, i) => (
                  <div
                    className="test-block space-y-4 rounded-[14px] border bg-card p-5"
                    key={t.id}
                    id={'test-block-' + i}
                  >
                    <div className="test-heading flex flex-wrap items-center justify-between gap-3">
                      <h3>
                        <Icon name="fa-solid fa-vial" aria-hidden="true" />
                        Test {String(i + 1).padStart(2, '0')} <small>/ 05</small>
                      </h3>
                      <div className="inline-group flex flex-wrap items-center gap-2">
                        <span className="badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                          {t.useasexample ? 'Public Example' : 'Không phải ví dụ công khai'}
                        </span>
                        <span className="badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                          Display: {displayNames[t.display] || t.display}
                        </span>
                      </div>
                    </div>

                    <div className="test-io-grid grid min-w-0 gap-4 sm:grid-cols-2">
                      {['stdin', 'expected', 'testcode', 'extra'].map((key, j) => (
                        <Field
                          key={key}
                          label={
                            [
                              'Standard Input',
                              'Expected output',
                              'Test code / harness',
                              'Extra template data',
                            ][j]
                          }
                          help={
                            [
                              trUI('Dữ liệu stdin, có thể rỗng.'),
                              trUI('Chuỗi mong đợi; không tự trim. Có thể rỗng.'),
                              trUI('Mã harness (bài viết hàm), khác dữ liệu stdin.'),
                              trUI('Metadata riêng cho template, được lưu nguyên vẹn.'),
                            ][j]
                          }
                        >
                          {area('testcases.' + i + '.' + key, 3)}
                        </Field>
                      ))}
                    </div>

                    <div className="test-properties-bar grid min-w-0 gap-4 sm:grid-cols-2">
                      <Field label="Test properties">
                        <div className="inline-group flex flex-wrap items-center gap-4">
                          {check('testcases.' + i + '.useasexample', 'Use as example')}
                          <UiLabel className="inline-group flex flex-wrap items-center gap-2">
                            <span>Display</span>{' '}
                            {select('testcases.' + i + '.display', Object.entries(displayNames))}
                          </UiLabel>
                          {check('testcases.' + i + '.hiderestiffail', 'Hide rest if fail')}
                          <div className="inline-group flex flex-wrap items-center gap-2">
                            <UiLabel className="grid gap-2 text-sm font-medium">
                              Mark{' '}
                              {input('testcases.' + i + '.mark', 'number', {
                                min: 0,
                                step: 'any',
                                disabled: q.allornothing,
                              })}
                            </UiLabel>
                            <UiLabel className="grid gap-2 text-sm font-medium">
                              Ordering{' '}
                              {input('testcases.' + i + '.ordering', 'number', {
                                step: 1,
                              })}
                            </UiLabel>
                          </div>
                        </div>
                      </Field>
                    </div>

                    {q.precheck === 3 && (
                      <Field label="Precheck test type">
                        {select('testcases.' + i + '.testtype', [
                          [0, 'Check only'],
                          [1, 'Precheck only'],
                          [2, 'Both'],
                        ])}
                      </Field>
                    )}
                  </div>
                ))}

                <p className="muted text-sm leading-relaxed text-muted-foreground mt-4">
                  <Icon name="fa-solid fa-lightbulb" aria-hidden="true" /> Mỗi đề công bố có đúng 5
                  testcase: ví dụ, cơ bản, biên, đặc biệt và phức tạp.
                </p>
            </section>

            {/* Section 5: Nâng cao & Xuất bản */}
            <section id="sec-5-advanced" className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
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
                <div className="status-choice-grid [&_button]:h-auto [&_button]:whitespace-normal [&_button]:p-4 grid min-w-0 gap-4 sm:grid-cols-2">
                  <UiButton
                    role="button"
                    tabIndex={0}
                    className={`status-choice-card card-draft flex h-auto min-h-24 cursor-pointer flex-col items-start justify-center gap-2 whitespace-normal rounded-lg border bg-card p-4 text-left text-foreground ${q.general.status === 'draft' ? 'is-active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15' : ''}`}
                    onClick={() => update('general.status', 'draft')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        update('general.status', 'draft');
                      }
                    }}
                    type="button"
                    variant="outline"
                    aria-pressed={q.general.status === 'draft'}
                  >
                    <Icon name="fa-solid fa-file-pen" aria-hidden="true" />
                    <div>
                      <h4>Bản nháp (Draft)</h4>
                      <p>
                        Đang biên soạn, chưa hiện trong danh sách chính thức. Có thể lưu dù chưa đủ
                        5 testcase.
                      </p>
                    </div>
                  </UiButton>

                  <UiButton
                    role="button"
                    tabIndex={0}
                    className={`status-choice-card card-ready flex h-auto min-h-24 cursor-pointer flex-col items-start justify-center gap-2 whitespace-normal rounded-lg border bg-card p-4 text-left text-foreground ${q.general.status === 'ready' ? 'is-active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15' : ''}`}
                    onClick={() => update('general.status', 'ready')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        update('general.status', 'ready');
                      }
                    }}
                    type="button"
                    variant="outline"
                    aria-pressed={q.general.status === 'ready'}
                  >
                    <Icon name="fa-solid fa-circle-check" aria-hidden="true" />
                    <div>
                      <h4>Công bố (Ready)</h4>
                      <p>
                        Công khai cho học viên luyện tập. Yêu cầu đúng 5 testcase hợp lệ và cấu hình
                        đạt chuẩn.
                      </p>
                    </div>
                  </UiButton>
                </div>

                <div className="hidden">
                  <Field label="Question status">
                    {select('general.status', [
                      ['draft', 'Draft'],
                      ['ready', trUI('Ready / Công bố')],
                    ])}
                  </Field>
                </div>

                <Field label="Code Survival">
                  {check('survivalEligible', trUI('Cho phép dùng trong Code Survival'))}
                  <small className="muted text-sm leading-relaxed text-muted-foreground">
                    Đáp án mẫu đã xác thực:{' '}
                    {q.validatedVersion === q.version && q.version && !dirty
                      ? 'v' + q.version
                      : trUI('chưa xác thực phiên bản này')}
                  </small>
                </Field>

              <Section title="Tags & Phân loại chủ đề" open>
                <Field label="Tags">
                  <UiInput
                    aria-label="tags"
                    placeholder="Ví dụ: dp, math, greedy, array..."
                    value={q.tags.join(', ')}
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
                <div className="inline-group flex flex-wrap items-center mt-2 gap-1.5">
                  <span className="muted text-muted-foreground text-[11px]">Gợi ý nhanh:</span>
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
                    <UiButton
                      key={tag}
                      type="button"
                      className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground text-[11px] px-2 py-0.5 min-h-6"
                      onClick={() => {
                        if (!q.tags.includes(tag)) {
                          update('tags', [...q.tags, tag]);
                        }
                      }}
                      variant="ghost"
                    >
                      +{tag}
                    </UiButton>
                  ))}
                </div>
              </Section>

              <Section title="Tham số & cấu hình giao diện">
                <Field label="Template params">{area('templateparams', 4)}</Field>
                <Field label="Template param controls">
                  <div className="inline-group flex flex-wrap items-center gap-2">
                    {check('hoisttemplateparams', 'Hoist template parameters')}
                    {check('extractcodefromjson', 'Extract code from JSON')}
                    {check('twigall', 'Twig all')}
                  </div>
                  <div className="inline-group flex flex-wrap items-center gap-2 mt-2">
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
                    {!['None', 'twig'].includes(q.templateparamslang) &&
                      check('templateparamsevalpertry', 'Evaluate per try')}
                  </div>
                </Field>
                <Field label="UI parameters">{area('uiparameters')}</Field>
              </Section>

              {q.customise && (
                <Section title="Advanced customisation">
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
                  <div className="two-cols grid min-w-0 gap-4 sm:grid-cols-2">
                    {field(
                      'CPU time limit (seconds)',
                      'advancedCustomisation.cputimelimitsecs',
                      'number',
                      trUI('1–10 giây mỗi test.'),
                      {
                        min: 1,
                        max: 10,
                      },
                    )}
                    {field(
                      'Memory limit (MB)',
                      'advancedCustomisation.memlimitmb',
                      'number',
                      trUI('64–512 MB; trống/0 dùng tối thiểu 64 MB.'),
                      {
                        min: 0,
                        max: 512,
                      },
                    )}
                  </div>
                  <Field label="Sandbox params">
                    {area('advancedCustomisation.sandboxparams')}
                  </Field>
                  <div className="two-cols grid min-w-0 gap-4 sm:grid-cols-2">
                    {field('Language', 'advancedCustomisation.language')}
                    {field('Ace language', 'advancedCustomisation.acelang')}
                  </div>
                </Section>
              )}

              <Section title="Support files">
                <div className="alert my-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed">
                  Chỉ khả dụng với bản nháp.
                </div>
                <pre>{JSON.stringify(q.datafiles, null, 2)}</pre>
              </Section>

              <Section title="Attachment options">
                <div className="alert my-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed">
                  Chỉ khả dụng với bản nháp.
                </div>
                <Field label="Attachments">
                  {select('attachments.attachments', [
                    [0, 'No'],
                    [1, '1'],
                    [2, '2'],
                    [3, '3'],
                    [-1, 'Unlimited'],
                  ])}
                </Field>
                <Field label="Attachments required">
                  {select(
                    'attachments.attachmentsrequired',
                    [0, 1, 2, 3].map((v) => [v, String(v)]),
                    q.attachments.attachments === 0,
                  )}
                </Field>
                {['filenamesregex', 'filenamesexplain', 'maxfilesize'].map((k) => (
                  <Field key={k} label={k}>
                    {input('attachments.' + k, k === 'maxfilesize' ? 'number' : 'text', {
                      disabled: q.attachments.attachments === 0,
                    })}
                  </Field>
                ))}
              </Section>
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
            <p className="text-[11px] leading-relaxed text-muted-foreground mt-3">
              Public Example và Display là hai thuộc tính độc lập. Ẩn hiển thị không thay đổi việc
              chấm test.
            </p>
          </section>

          {readDraft() && (
            <section className="space-y-3">
              <h3 className="font-bold text-sm text-foreground">Nháp trên thiết bị</h3>
              <p className="text-xs text-muted-foreground">
                Thay đổi được giữ cục bộ; chỉ nút Lưu mới cập nhật server.
              </p>
              <UiButton
                type="button"
                className="w-full secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground text-xs rounded-xl"
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
            <div className="text-[11px] text-muted-foreground">
              {dirty
                ? 'Nháp cục bộ được giữ trên thiết bị'
                : 'Cấu hình server là nguồn dữ liệu chính thức'}
            </div>
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
