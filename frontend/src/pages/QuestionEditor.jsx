import CodeEditor from '../components/CodeEditor';
import {t as trUI} from "../lib/locale";
import React, {useEffect, useState, useRef} from 'react';
import {live} from '../lib/live';
import {defaults, normalize, validate, serialized, displayNames, languageNames} from '../lib/coderunner';
import {Field, Section, Check, ErrorBox, Loading, go} from '../components/ui';

function at(obj, path) {
  return path.split('.').reduce((v, k) => v?.[k], obj);
}

const difficultyInfo = [
  {level: 1, name: 'Nhập môn', color: 'diff-1'},
  {level: 2, name: 'Dễ', color: 'diff-2'},
  {level: 3, name: 'Trung bình', color: 'diff-3'},
  {level: 4, name: 'Khá', color: 'diff-4'},
  {level: 5, name: 'Khó', color: 'diff-5'},
  {level: 6, name: 'Cực khó', color: 'diff-6'}
];

const questionTypeDescriptions = {
  python3_program: {
    title: 'Python 3 Program',
    desc: 'Chương trình Python 3 hoàn chỉnh, đọc Standard Input (stdin) và in ra Standard Output (stdout).'
  },
  cpp_program: {
    title: 'C++ Program',
    desc: 'Chương trình C++ đầy đủ hàm main(), đọc stdin và in stdout với EqualityGrader.'
  },
  cpp_function: {
    title: 'C++ Function',
    desc: 'Học viên viết hàm hoặc class; bộ chấm nối mã harness (testcode) để kiểm tra kết quả.'
  },
  python3: {
    title: 'Python 3 Function',
    desc: 'Học viên viết hàm; bộ chấm gọi hàm thông qua testcode và so sánh kết quả trả về.'
  }
};

export default function QuestionEditor({id, revision, onNotice}) {
  const [q, setQ] = useState(() => defaults());
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [errors, setErrors] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [step, setStep] = useState(0);
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
    fetch('/api/meta').then(r => r.json()).then(m => setTypes(m.questionTypes || [])).catch(setError);
    if (id) {
      setLoading(true);
      setLoadFailed(false);
      live.call('QUESTION_EDIT', {id}).then(d => {
        setQ(normalize(d));
        setDirty(false);
      }).catch(e => {
        setError(e);
        setLoadFailed(true);
      }).finally(() => setLoading(false));
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
    live.call('QUESTION_EDIT', {id}).then(server => {
      if (active) setQ(current => current.id === server.id && current.version === server.version ? {...current, validatedVersion: server.validatedVersion} : current);
    }).catch(e => {
      if (active) setError(e);
    });
    return () => { active = false; };
  }, [id, revision]);

  useEffect(() => {
    if (dirty) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(q));
        setDraftError(null);
      } catch {
        setDraftError(Error(trUI('Không thể lưu nháp trên thiết bị. Hãy lưu lên server hoặc Export JSON để giữ thay đổi.')));
      }
    }
  }, [q, dirty, draftKey]);

  useEffect(() => {
    const f = e => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [dirty]);

  useEffect(() => {
    const guard = e => {
      if (!leaveAllowed.current && (busy || dirty && !window.confirm(trUI('Rời trình soạn đề khi còn thay đổi chưa lưu?')))) e.preventDefault();
      leaveAllowed.current = false;
    };
    window.addEventListener('codegrade:before-navigate', guard);
    return () => window.removeEventListener('codegrade:before-navigate', guard);
  }, [dirty, busy]);

  // Keyboard shortcut Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = e => {
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

  function changeStep(next) {
    setStep(next);
    requestAnimationFrame(() => {
      document.querySelector('.studio-panel-heading')?.scrollIntoView({block: 'start'});
      document.getElementById('studio-tab-' + next)?.focus({preventScroll: true});
    });
  }

  function update(path, value) {
    setQ(prev => {
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
    <input
      aria-label={path}
      type={type}
      value={at(q, path) ?? ''}
      onChange={e => update(path, type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
      {...props}
    />
  );

  const area = (path, rows = 4) => (
    <textarea
      className={/answer|testcases|template|globalextra/i.test(path) ? "code-input" : undefined}
      aria-label={path}
      spellCheck={false}
      rows={rows}
      value={at(q, path) ?? ''}
      onChange={e => update(path, e.target.value)}
    />
  );

  const check = (path, label, disabled = false) => (
    <Check label={label} checked={at(q, path)} onChange={v => update(path, v)} disabled={disabled}/>
  );

  const select = (path, options, disabled = false) => (
    <select
      aria-label={path}
      value={at(q, path) ?? ''}
      disabled={disabled}
      onChange={e => update(path, typeof at(q, path) === 'number' ? Number(e.target.value) : e.target.value)}
    >
      {options.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
    </select>
  );

  const field = (label, path, type = 'text', help = label, props = {}) => (
    <Field label={label} help={help}>{input(path, type, props)}</Field>
  );

  async function save(stay) {
    setError(null);
    const errs = validate(q);
    setErrors(errs);
    if (errs.length) {
      requestAnimationFrame(() => {
        const alert = document.querySelector('.editor-errors');
        alert?.focus();
        alert?.scrollIntoView({block: 'start'});
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
      onNotice(result.sampleValidation ? trUI("Đã lưu. Đáp án mẫu được đưa vào queue; xem kết quả ở Bài nộp.") : result.validationNotice || trUI("Đã lưu câu hỏi."));
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
    const blob = new Blob([JSON.stringify(serialized(q), null, 2)], {type: 'application/json'});
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
      if (f.size > 900000) throw Error(trUI("JSON tối đa 900 KiB."));
      const incoming = normalize(JSON.parse(await f.text()));
      const errs = validate(incoming);
      if (errs.length) throw Error(errs.join('\n'));
      if (dirty && !window.confirm(trUI("Thay dữ liệu đang sửa bằng JSON này?"))) return;
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
    else if (tag === 'example') insertion = '\n### Ví dụ\n**Input:**\n```\n5\n1 2 3 4 5\n```\n**Output:**\n```\n15\n```\n';
    update('general.questionText', current + insertion);
  }

  function insertPreloadTemplate(lang) {
    if (lang === 'cpp') {
      update('answer.preloadAnswer', '#include <iostream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Viết code tại đây\n    \n    return 0;\n}\n');
    } else if (lang === 'py') {
      update('answer.preloadAnswer', 'import sys\n\ndef main():\n    input = sys.stdin.read\n    # Viết code tại đây\n\nif __name__ == "__main__":\n    main()\n');
    }
  }

  const selectedHelp = types.find(t => t.id === q.coderunnertype)?.description || trUI("Chưa chọn loại câu hỏi.");
  const issues = validate(q);
  const exampleCount = q.testcases.filter(t => t.useasexample).length;
  const verified = Boolean(q.version && q.validatedVersion === q.version && !dirty);

  const steps = [
    ['Thông tin', 'Tên, nội dung & ngôn ngữ', 'fa-file-lines'],
    ['Cấu hình chấm', 'Loại câu hỏi & cách tính điểm', 'fa-sliders'],
    ['Đáp án mẫu', 'Lời giải tham chiếu & preload', 'fa-code'],
    ['Bộ kiểm thử', 'Input, output & thuộc tính', 'fa-vials'],
    ['Nâng cao & xuất bản', 'Sandbox, tệp đính kèm & tags', 'fa-rocket']
  ];

  const checklistItems = [
    [!!q.general.questionName.trim(), 'Tên câu hỏi', 0, 'general.questionName'],
    [!!q.general.questionText.trim(), 'Nội dung đề', 0, 'general.questionText'],
    [q.languages.length > 0, 'Ngôn ngữ lập trình', 0, 'languages'],
    [q.testcases.length === 5, 'Đủ 5 testcase', 3, 'testcases'],
    [issues.length === 0, 'Cấu hình hợp lệ', 1, 'coderunnertype'],
    [verified, 'Đáp án mẫu xác thực phiên bản hiện tại', 2, 'answer.sampleAnswer']
  ];

  const completedCount = checklistItems.filter(([ok]) => ok).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  if (loading) return <Loading/>;

  return (
    <div className="question-editor studio">
      {/* Top Header */}
      <header className="studio-header">
        <div className="studio-header-main">
          <div className="studio-breadcrumbs">
            <button type="button" className="ghost studio-back-btn" onClick={cancel} title={trUI("Quay lại kho bài")}>
              <i className="fa-solid fa-arrow-left" aria-hidden="true"/> <span>{trUI("Luyện tập")}</span>
            </button>
            <span className="studio-breadcrumb-separator" aria-hidden="true">/</span>
            <span className="eyebrow studio-kicker">QUESTION STUDIO <span aria-hidden="true">/</span> {id ? 'EDIT' : 'NEW'}</span>
          </div>

          <div className="studio-title-row">
            <h1 className="studio-title" title={q.general.questionName || 'Tạo câu hỏi mới'}>
              {q.general.questionName || 'Tạo câu hỏi mới'}
            </h1>
          </div>

          <div className="studio-badges inline">
            <span className="badge studio-id-badge">
              <i className="fa-solid fa-hashtag" aria-hidden="true"/> {q.publicId || 'Chưa cấp mã'}
            </span>
            <span className={`badge studio-status-badge ${q.general.status === 'ready' ? 'status-ready' : 'status-draft'}`}>
              <span className={`status-dot ${q.general.status === 'ready' ? 'is-ready' : 'is-draft'}`} aria-hidden="true"/>
              {q.general.status === 'ready' ? 'Ready' : 'Draft'}
            </span>
            <span className={`badge level-pill level-${q.difficulty}`}>
              Mức {q.difficulty}
            </span>
            <small className="studio-meta-text">
              {q.id ? 'Version ' + q.version : 'Chưa lưu lên server'} · {dirty ? 'Có thay đổi chưa lưu' : 'Không có thay đổi'}
            </small>
          </div>
        </div>

        <div className="studio-tools">
          <button
            type="button"
            className={`secondary studio-preview-toggle ${preview ? 'is-active' : ''}`}
            aria-pressed={preview}
            onClick={() => setPreview(!preview)}
          >
            <i className={`fa-solid ${preview ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"/>
            {preview ? trUI("Đóng xem trước") : trUI("Xem nội dung đề")}
          </button>
          <label className="button secondary studio-import-btn" title="Nhập file JSON đề">
            <i className="fa-solid fa-file-import" aria-hidden="true"/> Import JSON
            <input type="file" accept=".json,application/json" hidden disabled={busy || loadFailed} onChange={importJson}/>
          </label>
          <button type="button" className="secondary studio-export-btn" disabled={busy || loadFailed} onClick={exportJson} title="Xuất file JSON đề">
            <i className="fa-solid fa-file-export" aria-hidden="true"/> Export JSON
          </button>
          <button type="button" className="ghost studio-close-btn" disabled={busy} onClick={cancel}>
            {trUI("Đóng")}
          </button>
        </div>
      </header>

      <ErrorBox error={error || draftError}/>
      {errors.length > 0 && (
        <div role="alert" tabIndex={-1} className="alert danger editor-errors">
          <strong>Cần sửa trước khi lưu</strong>
          <ul>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Main Studio 3-Column Layout */}
      <div className="studio-layout">
        {/* Left Column: Navigation Stepper */}
        <nav className="studio-nav" aria-label="Các bước soạn đề">
          <div className="studio-nav-header">
            <span className="eyebrow">NỘI DUNG ĐỀ</span>
            <span className="studio-step-counter">{step + 1} / 5</span>
          </div>

          <div role="tablist" aria-label="Các bước soạn đề">
            {steps.map(([title, note, icon], i) => (
              <button
                type="button"
                role="tab"
                id={'studio-tab-' + i}
                aria-controls={'studio-panel-' + i}
                aria-selected={step === i}
                tabIndex={step === i ? 0 : -1}
                key={title}
                className={`studio-tab-item ${step === i ? 'is-active' : ''}`}
                onClick={() => changeStep(i)}
                onKeyDown={e => {
                  const n = ['ArrowDown', 'ArrowRight'].includes(e.key)
                    ? (i + 1) % 5
                    : ['ArrowUp', 'ArrowLeft'].includes(e.key)
                    ? (i + 4) % 5
                    : e.key === 'Home'
                    ? 0
                    : e.key === 'End'
                    ? 4
                    : null;
                  if (n !== null) {
                    e.preventDefault();
                    changeStep(n);
                  }
                }}
              >
                <span className="studio-step-number">{i + 1}</span>
                <span className="studio-tab-text">
                  <b>{title}</b>
                  <small>{note}</small>
                </span>
                <i className={'fa-solid ' + icon} aria-hidden="true"/>
              </button>
            ))}
          </div>

          <p className="studio-nav-note">
            <i className="fa-solid fa-circle-info" aria-hidden="true"/>
            <span>Đề công bố cần đúng 5 testcase hợp lệ. Mỗi cấu hình được giữ nguyên khi chuyển bước.</span>
          </p>
        </nav>

        {/* Center Column: Form Panels & Content */}
        <div className="studio-content">
          <div className="studio-panel-heading">
            <div className="studio-panel-info">
              <div className="inline">
                <span className="eyebrow">BƯỚC {step + 1} / 5</span>
                <span className="studio-step-pill">{steps[step][0]}</span>
              </div>
              <h2>{steps[step][0]}</h2>
              <p>{steps[step][1]}</p>
            </div>
            <button
              type="button"
              className={`secondary ${preview ? 'is-active' : ''}`}
              aria-pressed={preview}
              onClick={() => setPreview(!preview)}
            >
              <i className={`fa-solid ${preview ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"/>
              {preview ? trUI("Đóng xem trước") : trUI("Xem nội dung đề")}
            </button>
          </div>

          {/* Live Preview Container */}
          {preview && (
            <section className="paper pad studio-preview">
              <div className="studio-preview-card">
                <div className="studio-preview-header">
                  <div className="inline between">
                    <div>
                      <span className="eyebrow">
                        <i className="fa-solid fa-eye" aria-hidden="true"/> BẢN XEM TRƯỚC GIAO DIỆN HỌC VIÊN
                      </span>
                      <h3 data-user-content>{q.general.questionName || 'Chưa có tên đề'}</h3>
                    </div>
                    <div className="inline">
                      <span className={`badge level-${q.difficulty}`}>Mức {q.difficulty}</span>
                      <span className="badge">{q.languages.map(l => languageNames[l]).join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="studio-preview-body">
                  <pre data-user-content className="statement-preview-text">
                    {q.general.questionText || 'Chưa có nội dung đề.'}
                  </pre>

                  {exampleCount > 0 && (
                    <div className="studio-preview-examples">
                      <h4>
                        <i className="fa-solid fa-code" aria-hidden="true"/> {trUI("Ví dụ công khai")} ({exampleCount})
                      </h4>
                      <div className="preview-examples-list">
                        {q.testcases.filter(t => t.useasexample).map((t, idx) => (
                          <div key={t.id} className="preview-example-box">
                            <strong>Ví dụ {idx + 1}:</strong>
                            <div className="test-io-grid">
                              <div>
                                <small className="muted">Input (stdin):</small>
                                <pre className="code-box">{t.stdin || '(trống)'}</pre>
                              </div>
                              <div>
                                <small className="muted">Output mong đợi:</small>
                                <pre className="code-box">{t.expected || '(trống)'}</pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <small className="muted">Bản xem trước nội dung; bộ chấm sử dụng cấu hình đã lưu trên server.</small>
              </div>
            </section>
          )}

          {/* Controlled Panels Fieldset */}
          <fieldset disabled={busy || loadFailed} className="studio-fields">
            {/* Step 0: General Info */}
            <section role="tabpanel" tabIndex={0} id="studio-panel-0" aria-labelledby="studio-tab-0" hidden={step !== 0}>
              <Section title="Thông tin cơ bản & phân loại" open>
                <div className="two-cols">
                  <Field label="Category">{select('general.categoryId', categories.map(c => [c.id, c.name]))}</Field>
                  {field(trUI('Mã tham chiếu ngoài'), 'general.idNumber')}
                </div>
                {field('Question name', 'general.questionName', 'text', 'Tên tiêu đề hiển thị của bài tập')}
                
                {/* Visual Difficulty Selector */}
                <div className="difficulty-selector">
                  <label className="field-label">{trUI("Độ khó (Difficulty)")}</label>
                  <div className="difficulty-grid">
                    {difficultyInfo.map(item => (
                      <div
                        key={item.level}
                        role="button"
                        tabIndex={0}
                        className={`difficulty-card ${item.color} ${q.difficulty === item.level ? 'is-selected' : ''}`}
                        onClick={() => update('difficulty', item.level)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update('difficulty', item.level); } }}
                      >
                        <span className="diff-number">L{item.level}</span>
                        <span className="diff-name">{item.name}</span>
                      </div>
                    ))}
                  </div>
                  {/* Kept synchronized for accessibility and form validation */}
                  <div style={{display: 'none'}}>
                    <Field label="Difficulty">{select('difficulty', [1, 2, 3, 4, 5, 6].map(d => [d, trUI("Mức ") + d]))}</Field>
                  </div>
                </div>

                {/* Visual Language Chips */}
                <div className="field">
                  <div className="field-label">{trUI("Ngôn ngữ lập trình hỗ trợ")}</div>
                  <div className="lang-selector-group">
                    {Object.entries(languageNames).map(([k, n]) => {
                      const active = q.languages.includes(k);
                      return (
                        <button
                          type="button"
                          key={k}
                          className={`lang-chip-btn ${active ? 'is-active' : ''}`}
                          onClick={() => update('languages', active ? q.languages.filter(l => l !== k) : [...q.languages, k])}
                        >
                          <i className={`fa-solid ${k.startsWith('PY') ? 'fa-brands fa-python' : 'fa-code'}`} aria-hidden="true"/>
                          <span>{n}</span>
                          {active && <i className="fa-solid fa-check" aria-hidden="true"/>}
                        </button>
                      );
                    })}
                    <div className="lang-quick-actions">
                      <button type="button" className="ghost" onClick={() => update('languages', Object.keys(languageNames))}>
                        Tất cả
                      </button>
                      <button type="button" className="ghost" onClick={() => update('languages', ['PY311'])}>
                        Chỉ Python
                      </button>
                      <button type="button" className="ghost" onClick={() => update('languages', ['CPP11', 'CPP17', 'CPP20'])}>
                        Chỉ C++
                      </button>
                    </div>
                  </div>
                  {/* Standard hidden check group for form accessibility */}
                  <div style={{display: 'none'}}>
                    <div className="inline">
                      {Object.entries(languageNames).map(([k, n]) => (
                        <Check key={k} label={n} checked={q.languages.includes(k)} onChange={yes => update('languages', yes ? [...q.languages, k] : q.languages.filter(l => l !== k))}/>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Question Statement with Toolbar */}
                <div className="field">
                  <div className="field-label">Question text</div>
                  <div className="statement-toolbar">
                    <span className="statement-toolbar-label"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"/> Mẫu nhanh:</span>
                    <button type="button" className="statement-tool-btn" onClick={() => insertStatementTemplate('desc')}>+ Mô tả</button>
                    <button type="button" className="statement-tool-btn" onClick={() => insertStatementTemplate('input')}>+ Đầu vào</button>
                    <button type="button" className="statement-tool-btn" onClick={() => insertStatementTemplate('output')}>+ Đầu ra</button>
                    <button type="button" className="statement-tool-btn" onClick={() => insertStatementTemplate('constraints')}>+ Ràng buộc</button>
                    <button type="button" className="statement-tool-btn" onClick={() => insertStatementTemplate('example')}>+ Ví dụ</button>
                  </div>
                  <div className="statement-textarea-wrapper">
                    {area('general.questionText', 10)}
                  </div>
                </div>

                <Field label="General feedback">{area('general.generalFeedback', 3)}</Field>
              </Section>
            </section>

            {/* Step 1: CodeRunner & Grading Config */}
            <section role="tabpanel" tabIndex={0} id="studio-panel-1" aria-labelledby="studio-tab-1" hidden={step !== 1}>
              <Section title="CodeRunner question type" open>
                {/* Visual Type Picker Grid */}
                <div className="coderunner-type-grid">
                  {Object.entries(questionTypeDescriptions).map(([typeKey, info]) => (
                    <div
                      key={typeKey}
                      role="button"
                      tabIndex={0}
                      className={`coderunner-type-card ${q.coderunnertype === typeKey ? 'is-active' : ''}`}
                      onClick={() => update('coderunnertype', typeKey)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update('coderunnertype', typeKey); } }}
                    >
                      <h4>
                        <i className={`fa-solid ${typeKey.startsWith('py') ? 'fa-brands fa-python' : 'fa-code'}`} aria-hidden="true"/>
                        {info.title}
                        {q.coderunnertype === typeKey && <i className="fa-solid fa-circle-check" style={{marginLeft: 'auto', color: 'var(--color-success)'}} aria-hidden="true"/>}
                      </h4>
                      <p>{info.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="two-cols">
                  <Field label="Question type">
                    {select('coderunnertype', [['Undefined', 'Undefined'], ...types.map(t => [t.id, t.id])])}
                  </Field>
                  {field('Default mark', 'general.defaultMark', 'number', trUI("Tổng điểm câu hỏi, khác trọng số Mark của từng test."), {min: 0.01, step: 'any'})}
                </div>

                <div className="two-cols">
                  {field('Answer box — Rows', 'answerboxlines', 'number', trUI("Số dòng ô trả lời của coder, không phải số dòng testcase."), {min: 1, max: 200})}
                  {field('Penalty regime', 'penaltyregime', 'text', trUI("Lưu penalty Moodle; Code Survival dùng cố định 10 giây/lần sai."))}
                </div>

                <div className="two-cols">
                  <Field label="Submit buttons">
                    <div className="inline">
                      {select('precheck', [[0, 'Disabled'], [1, 'Empty'], [2, 'Examples'], [3, 'Selected'], [4, 'All']])}
                      {check('hidecheck', 'Hide check')}
                    </div>
                  </Field>
                  <Field label="Stop button">
                    {select('giveupallowed', [[0, 'Never available'], [1, 'After maximum marks'], [2, 'Always available']])}
                    <small className="muted">Chỉ khả dụng với bản nháp.</small>
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label="Feedback">
                    {select('displayfeedback', [[0, 'Use quiz settings'], [1, 'Force show'], [2, 'Force hide']])}
                  </Field>
                  <Field label="Marking">
                    {check('allornothing', 'All-or-nothing grading')}
                  </Field>
                </div>

                <Field label="Customisation">
                  <div className="inline">
                    {check('customise', 'Customise')}
                    {check('showsource', 'Template debugging')}
                  </div>
                </Field>
              </Section>

              <Section title="Question type details">
                <p><strong>{q.coderunnertype}:</strong> {selectedHelp}</p>
                <p className="muted">EqualityGrader so sánh chính xác, chỉ chuẩn hóa CRLF → LF. NearEqualityGrader dùng sai số tương đối 10⁻⁶. RegexGrader dùng RE2.</p>
              </Section>

              {q.customise && (
                <Section title="Customisation" open>
                  <div className="alert">Chỉ khả dụng với bản nháp.</div>
                  <Field label="Template">{area('customisation.template', 8)}</Field>
                  <Field label="Combinator">
                    {check('customisation.iscombinatortemplate', 'Is combinator template')}
                    {check('customisation.allowmultiplestdins', 'Allow multiple stdins')}
                  </Field>
                  <Field label="Test splitter regex">
                    {input('customisation.testsplitterre', 'text', {disabled: !q.customisation.iscombinatortemplate})}
                  </Field>
                  <Field label="Grader">
                    {select('customisation.grader', ['EqualityGrader', 'NearEqualityGrader', 'RegexGrader', 'TemplateGrader'].map(v => [v, v]))}
                  </Field>
                  <Field label="Result columns">{area('customisation.resultcolumns')}</Field>
                  <Field label="UI plugin">
                    {select('customisation.uiplugin', [['textarea', 'Textarea'], ['ace', 'Ace (metadata)']])}
                    {check('customisation.useace', 'Use Ace (metadata)')}
                  </Field>
                  <Field label="Prototype extra">{area('customisation.prototypeextra')}</Field>
                </Section>
              )}
            </section>

            {/* Step 2: Sample Answer & Preload */}
            <section role="tabpanel" tabIndex={0} id="studio-panel-2" aria-labelledby="studio-tab-2" hidden={step !== 2}>
              <Section title="Answer" open>
                <div className="two-cols">
                  <Field label="Sample answer language">
                    {select('answer.language', q.languages.map(l => [l, languageNames[l]]))}
                  </Field>
                  <Field label="Validate on Save">
                    {check('answer.validateOnSave', 'Validate sample answer on save')}
                  </Field>
                </div>

                <div className="answer-editor-box">
                  <div className="answer-editor-toolbar">
                    <span className="answer-editor-filename">
                      <i className="fa-solid fa-file-code" aria-hidden="true"/>
                      solution.{q.answer.language === 'PY311' ? 'py' : 'cpp'}
                    </span>
                    <div className="answer-editor-actions">
                      <button
                        type="button"
                        className="ghost"
                        style={{fontSize: '11px', padding: '4px 8px', minHeight: '26px'}}
                        onClick={() => {
                          const boilerplate = q.answer.language === 'PY311'
                            ? '# Đáp án mẫu Python 3\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n'
                            : '// Đáp án mẫu C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n';
                          update('answer.sampleAnswer', boilerplate);
                        }}
                      >
                        <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"/> Chèn khung mẫu
                      </button>
                    </div>
                  </div>
                  <Field label="Sample answer">
                    <CodeEditor
                      label="answer.sampleAnswer"
                      readOnly={busy || loadFailed}
                      value={q.answer.sampleAnswer}
                      language={q.answer.language}
                      height="400px"
                      onChange={value => update('answer.sampleAnswer', value)}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Answer box preload" open={!!q.answer.preloadAnswer}>
                <div className="inline" style={{marginBottom: '10px'}}>
                  <span className="muted">Mã khởi tạo sẵn trong ô code của học viên:</span>
                  <button type="button" className="ghost" style={{fontSize: '11px', padding: '4px 8px', minHeight: '26px'}} onClick={() => insertPreloadTemplate('cpp')}>
                    Khung C++
                  </button>
                  <button type="button" className="ghost" style={{fontSize: '11px', padding: '4px 8px', minHeight: '26px'}} onClick={() => insertPreloadTemplate('py')}>
                    Khung Python
                  </button>
                </div>
                <Field label="Preload">{area('answer.preloadAnswer', 6)}</Field>
              </Section>

              <Section title="Global extra" open={!!q.answer.globalExtra}>
                <p className="muted">Mã bổ trợ chung (header, struct, hoặc hàm test harness) được ghép nối khi chấm bài.</p>
                <Field label="Global extra">{area('answer.globalExtra', 5)}</Field>
              </Section>
            </section>

            {/* Step 3: Test cases */}
            <section role="tabpanel" tabIndex={0} id="studio-panel-3" aria-labelledby="studio-tab-3" hidden={step !== 3}>
              <Section title="Test cases" open>
                <div className="testcases-toolbar">
                  <div className="testcases-nav-strip">
                    {q.testcases.map((t, idx) => {
                      const isFilled = Boolean(t.stdin.trim() || t.expected.trim() || t.testcode.trim());
                      return (
                        <button
                          type="button"
                          key={t.id}
                          className={`test-pill-btn ${activeTestTab === idx ? 'is-active' : ''}`}
                          onClick={() => {
                            setActiveTestTab(idx);
                            const el = document.getElementById('test-block-' + idx);
                            el?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
                          }}
                        >
                          <span className={`test-status-dot ${isFilled ? 'is-filled' : ''}`} aria-hidden="true"/>
                          <span>Test {String(idx + 1).padStart(2, '0')}</span>
                          {t.useasexample && <i className="fa-solid fa-star" title="Public Example" aria-hidden="true"/>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="muted" style={{margin: 0, fontSize: '11px'}}>
                    Whitespace được giữ nguyên. Display chỉ điều khiển hiển thị, mọi test đã chọn vẫn được chấm.
                  </p>
                </div>

                {/* 5 Test Case Blocks */}
                {q.testcases.map((t, i) => (
                  <div className="test-block" key={t.id} id={'test-block-' + i}>
                    <div className="test-heading">
                      <h3>
                        <i className="fa-solid fa-vial" aria-hidden="true"/>
                        Test {String(i + 1).padStart(2, '0')} <small>/ 05</small>
                      </h3>
                      <div className="inline">
                        <span className="badge">
                          {t.useasexample ? 'Public Example' : 'Không phải ví dụ công khai'}
                        </span>
                        <span className="badge">Display: {displayNames[t.display] || t.display}</span>
                      </div>
                    </div>

                    <div className="test-io-grid">
                      {['stdin', 'expected', 'testcode', 'extra'].map((key, j) => (
                        <Field
                          key={key}
                          label={['Standard Input', 'Expected output', 'Test code / harness', 'Extra template data'][j]}
                          help={[
                            trUI("Dữ liệu stdin, có thể rỗng."),
                            trUI("Chuỗi mong đợi; không tự trim. Có thể rỗng."),
                            trUI("Mã harness (bài viết hàm), khác dữ liệu stdin."),
                            trUI("Metadata riêng cho template, được lưu nguyên vẹn.")
                          ][j]}
                        >
                          {area('testcases.' + i + '.' + key, 3)}
                        </Field>
                      ))}
                    </div>

                    <div className="test-properties-bar">
                      <Field label="Test properties">
                        <div className="inline" style={{gap: '16px'}}>
                          {check('testcases.' + i + '.useasexample', 'Use as example')}
                          <label className="inline">
                            <span>Display</span> {select('testcases.' + i + '.display', Object.entries(displayNames))}
                          </label>
                          {check('testcases.' + i + '.hiderestiffail', 'Hide rest if fail')}
                          <div className="inline">
                            <label>Mark {input('testcases.' + i + '.mark', 'number', {min: 0, step: 'any', disabled: q.allornothing})}</label>
                            <label>Ordering {input('testcases.' + i + '.ordering', 'number', {step: 1})}</label>
                          </div>
                        </div>
                      </Field>
                    </div>

                    {q.precheck === 3 && (
                      <Field label="Precheck test type">
                        {select('testcases.' + i + '.testtype', [[0, 'Check only'], [1, 'Precheck only'], [2, 'Both']])}
                      </Field>
                    )}
                  </div>
                ))}

                <p className="muted" style={{marginTop: '16px'}}>
                  <i className="fa-solid fa-lightbulb" aria-hidden="true"/> Mỗi đề công bố có đúng 5 testcase: ví dụ, cơ bản, biên, đặc biệt và phức tạp.
                </p>
              </Section>
            </section>

            {/* Step 4: Advanced & Publish */}
            <section role="tabpanel" tabIndex={0} id="studio-panel-4" aria-labelledby="studio-tab-4" hidden={step !== 4}>
              <Section title="Xuất bản & phân phối" open>
                <div className="status-choice-grid">
                  <div
                    role="button"
                    tabIndex={0}
                    className={`status-choice-card card-draft ${q.general.status === 'draft' ? 'is-active' : ''}`}
                    onClick={() => update('general.status', 'draft')}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update('general.status', 'draft'); } }}
                  >
                    <i className="fa-solid fa-file-pen" aria-hidden="true"/>
                    <div>
                      <h4>Bản nháp (Draft)</h4>
                      <p>Đang biên soạn, chưa hiện trong danh sách chính thức. Có thể lưu dù chưa đủ 5 testcase.</p>
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    className={`status-choice-card card-ready ${q.general.status === 'ready' ? 'is-active' : ''}`}
                    onClick={() => update('general.status', 'ready')}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update('general.status', 'ready'); } }}
                  >
                    <i className="fa-solid fa-circle-check" aria-hidden="true"/>
                    <div>
                      <h4>Công bố (Ready)</h4>
                      <p>Công khai cho học viên luyện tập. Yêu cầu đúng 5 testcase hợp lệ và cấu hình đạt chuẩn.</p>
                    </div>
                  </div>
                </div>

                <div style={{display: 'none'}}>
                  <Field label="Question status">
                    {select('general.status', [['draft', 'Draft'], ['ready', trUI("Ready / Công bố")]])}
                  </Field>
                </div>

                <Field label="Code Survival">
                  {check('survivalEligible', trUI("Cho phép dùng trong Code Survival"))}
                  <small className="muted">
                    Đáp án mẫu đã xác thực: {q.validatedVersion === q.version && q.version && !dirty ? 'v' + q.version : trUI("chưa xác thực phiên bản này")}
                  </small>
                </Field>
              </Section>

              <Section title="Tags & Phân loại chủ đề" open>
                <Field label="Tags">
                  <input
                    aria-label="tags"
                    placeholder="Ví dụ: dp, math, greedy, array..."
                    value={q.tags.join(', ')}
                    onChange={e => update('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  />
                </Field>
                <div className="inline" style={{marginTop: '8px', gap: '6px'}}>
                  <span className="muted" style={{fontSize: '11px'}}>Gợi ý nhanh:</span>
                  {['dp', 'math', 'greedy', 'string', 'array', 'binary-search', 'sorting', 'graphs'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className="ghost"
                      style={{fontSize: '11px', padding: '2px 8px', minHeight: '24px'}}
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
              </Section>

              <Section title="Tham số & cấu hình giao diện">
                <Field label="Template params">{area('templateparams', 4)}</Field>
                <Field label="Template param controls">
                  <div className="inline">
                    {check('hoisttemplateparams', 'Hoist template parameters')}
                    {check('extractcodefromjson', 'Extract code from JSON')}
                    {check('twigall', 'Twig all')}
                  </div>
                  <div className="inline" style={{marginTop: '8px'}}>
                    {select('templateparamslang', ['None', 'twig', 'python3', 'C', 'C++', 'Java', 'php', 'Octave', 'Pascal'].map(v => [v, v === 'twig' ? 'Twig' : v]))}
                    {!['None', 'twig'].includes(q.templateparamslang) && check('templateparamsevalpertry', 'Evaluate per try')}
                  </div>
                </Field>
                <Field label="UI parameters">{area('uiparameters')}</Field>
              </Section>

              {q.customise && (
                <Section title="Advanced customisation">
                  <Field label="Prototype type">
                    {select('advancedCustomisation.prototypetype', [[0, 'No'], [2, 'Yes — user defined (draft)']])}
                  </Field>
                  <Field label="Type name">
                    {input('advancedCustomisation.typename', 'text', {disabled: q.advancedCustomisation.prototypetype !== 2})}
                  </Field>
                  <Field label="Sandbox">
                    {select('advancedCustomisation.sandbox', [['DOCKER', 'Docker isolated runner']])}
                  </Field>
                  <div className="two-cols">
                    {field('CPU time limit (seconds)', 'advancedCustomisation.cputimelimitsecs', 'number', trUI("1–10 giây mỗi test."), {min: 1, max: 10})}
                    {field('Memory limit (MB)', 'advancedCustomisation.memlimitmb', 'number', trUI("64–512 MB; trống/0 dùng tối thiểu 64 MB."), {min: 0, max: 512})}
                  </div>
                  <Field label="Sandbox params">{area('advancedCustomisation.sandboxparams')}</Field>
                  <div className="two-cols">
                    {field('Language', 'advancedCustomisation.language')}
                    {field('Ace language', 'advancedCustomisation.acelang')}
                  </div>
                </Section>
              )}

              <Section title="Support files">
                <div className="alert">Chỉ khả dụng với bản nháp.</div>
                <pre>{JSON.stringify(q.datafiles, null, 2)}</pre>
              </Section>

              <Section title="Attachment options">
                <div className="alert">Chỉ khả dụng với bản nháp.</div>
                <Field label="Attachments">
                  {select('attachments.attachments', [[0, 'No'], [1, '1'], [2, '2'], [3, '3'], [-1, 'Unlimited']])}
                </Field>
                <Field label="Attachments required">
                  {select('attachments.attachmentsrequired', [0, 1, 2, 3].map(v => [v, String(v)]), q.attachments.attachments === 0)}
                </Field>
                {['filenamesregex', 'filenamesexplain', 'maxfilesize'].map(k => (
                  <Field key={k} label={k}>
                    {input('attachments.' + k, k === 'maxfilesize' ? 'number' : 'text', {disabled: q.attachments.attachments === 0})}
                  </Field>
                ))}
              </Section>
            </section>
          </fieldset>

          {/* Step Bottom Actions */}
          <div className="studio-step-actions">
            <button
              type="button"
              className="secondary"
              disabled={step === 0}
              onClick={() => changeStep(step - 1)}
            >
              ← Bước trước
            </button>
            <span>{step + 1} / 5</span>
            <button
              type="button"
              className="secondary"
              disabled={step === 4}
              onClick={() => changeStep(step + 1)}
            >
              Bước tiếp →
            </button>
          </div>
        </div>

        {/* Right Column: Support, Checklist & Fact List */}
        <aside className="studio-support" aria-label="Kiểm tra & tóm tắt đề">
          <section>
            <span className="eyebrow">PUBLISH CHECKLIST</span>
            <h2>Trạng thái đề</h2>

            <div className="checklist-progress-box">
              <span className="checklist-progress-text">{completedCount} / {checklistItems.length} mục hoàn tất</span>
              <span className="badge">{progressPercent}%</span>
            </div>
            <div className="checklist-progress-bar-bg">
              <div className="checklist-progress-bar-fill" style={{width: `${progressPercent}%`}}/>
            </div>

            <ul className="studio-checklist">
              {checklistItems.map(([ok, label, targetStep, fieldName]) => (
                <li
                  key={label}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    changeStep(targetStep);
                    setTimeout(() => {
                      document.querySelector(`[aria-label="${fieldName}"]`)?.focus();
                    }, 50);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      changeStep(targetStep);
                    }
                  }}
                >
                  <i aria-hidden="true" className={'fa-solid ' + (ok ? 'fa-circle-check' : 'fa-circle-minus')}/>
                  <span>{label}</span>
                  <span className="sr-only">{ok ? 'Đạt' : 'Chưa đạt'}</span>
                </li>
              ))}
            </ul>

            <p className={`studio-validation ${issues.length ? 'has-issues' : ''}`} role="status">
              <i className={`fa-solid ${issues.length ? 'fa-triangle-exclamation' : 'fa-check'}`} aria-hidden="true" style={{marginRight: '6px'}}/>
              {issues.length ? issues.length + ' vấn đề cần kiểm tra' : 'Cấu hình hợp lệ để gửi lưu'}
            </p>

            {issues.length > 0 && (
              <details>
                <summary>Xem vấn đề cấu hình ({issues.length})</summary>
                <ul>
                  {issues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              </details>
            )}
          </section>

          <section>
            <h3>Tóm tắt cấu hình</h3>
            <dl className="fact-list">
              <div>
                <dt>Loại câu hỏi</dt>
                <dd>{q.coderunnertype}</dd>
              </div>
              <div>
                <dt>Ngôn ngữ</dt>
                <dd>{q.languages.map(l => languageNames[l]).join(', ') || 'Chưa chọn'}</dd>
              </div>
              <div>
                <dt>Testcases</dt>
                <dd>{q.testcases.length} · {exampleCount} Public Example</dd>
              </div>
              <div>
                <dt>Điểm</dt>
                <dd>{q.general.defaultMark}</dd>
              </div>
              <div>
                <dt>Survival</dt>
                <dd>{q.survivalEligible ? 'Cho phép' : 'Không dùng'}</dd>
              </div>
            </dl>
            <p className="muted" style={{marginTop: '12px'}}>
              Public Example và Display là hai thuộc tính độc lập. Ẩn hiển thị không thay đổi việc chấm test.
            </p>
          </section>

          {readDraft() && (
            <section>
              <h3>Nháp trên thiết bị</h3>
              <p className="muted">Thay đổi được giữ cục bộ; chỉ nút Lưu mới cập nhật server.</p>
              <button
                type="button"
                className="secondary"
                disabled={busy || loadFailed}
                onClick={() => {
                  try {
                    if (dirty && !window.confirm(trUI('Thay nội dung hiện tại bằng nháp cục bộ?'))) return;
                    setQ(normalize(JSON.parse(readDraft())));
                    setDirty(true);
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                Khôi phục nháp cục bộ
              </button>
            </section>
          )}
        </aside>
      </div>

      {/* Bottom Sticky Action Bar */}
      <footer className="savebar studio-savebar">
        <div className="studio-savebar-status">
          <div>
            <b>
              {busy ? (
                <span><i className="fa-solid fa-spinner fa-spin" aria-hidden="true"/> Đang lưu…</span>
              ) : dirty ? (
                'Có thay đổi chưa lưu'
              ) : (
                'Không có thay đổi'
              )}
            </b>
            <small>
              {dirty ? 'Nháp cục bộ được giữ trên thiết bị' : 'Cấu hình server là nguồn dữ liệu chính thức'}
            </small>
          </div>
        </div>
        <div className="inline">
          <button type="button" className="ghost" disabled={busy} onClick={cancel}>
            Hủy
          </button>
          <button
            type="button"
            className="secondary"
            aria-busy={busy}
            disabled={busy || loadFailed}
            onClick={() => save(true)}
          >
            Lưu và tiếp tục sửa
          </button>
          <button
            type="button"
            aria-busy={busy}
            disabled={busy || loadFailed}
            onClick={() => save(false)}
          >
            Lưu thay đổi →
          </button>
        </div>
      </footer>
    </div>
  );
}
