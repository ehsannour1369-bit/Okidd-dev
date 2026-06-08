import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import PageTopBar from "../../components/PageTopBar";
import { showToast } from "../../lib/toast";
import { Plus, Edit2, Trash2, Upload, Film, Gamepad2, ClipboardCheck, PenLine, X } from "lucide-react";

interface Content {
  id: number; title: string; type: string; url?: string | null; filePath?: string | null;
  description?: string | null; lessonId?: number | null; bookId?: number | null;
  classId?: number | null; orderIndex: number;
}
interface Book { id: number; title: string; gradeLevel?: string | null; academicStage?: string | null; lessonCount?: number; }

const TYPES = [
  { value: "animation", label: "انیمیشن", icon: Film, color: "#f59e0b" },
  { value: "game", label: "بازی", icon: Gamepad2, color: "#34d399" },
  { value: "quiz", label: "آزمونک", icon: ClipboardCheck, color: "#60a5fa" },
  { value: "exercise", label: "تمرین", icon: PenLine, color: "#d97706" },
];

const STAGES = ["ابتدایی", "متوسطه اول", "متوسطه دوم", "پیش‌دبستانی", "عمومی"];

const GRADES = [
  { value: "1", label: "اول" }, { value: "2", label: "دوم" }, { value: "3", label: "سوم" },
  { value: "4", label: "چهارم" }, { value: "5", label: "پنجم" }, { value: "6", label: "ششم" },
  { value: "7", label: "هفتم" }, { value: "8", label: "هشتم" }, { value: "9", label: "نهم" },
  { value: "10", label: "دهم" }, { value: "11", label: "یازدهم" }, { value: "12", label: "دوازدهم" },
];

const STAGE_GRADES: Record<string, string[]> = {
  "ابتدایی": ["1", "2", "3", "4", "5", "6"],
  "متوسطه اول": ["7", "8", "9"],
  "متوسطه دوم": ["10", "11", "12"],
  "پیش‌دبستانی": [],
  "عمومی": [],
};

function gradeLabel(v: string) { return GRADES.find(g => g.value === v)?.label ?? v; }

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(255,252,235,0.90)", border: "1px solid rgba(139,92,246,0.3)",
  borderRadius: 10, color: "#78350f", padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl", boxSizing: "border-box",
};

const lbl: React.CSSProperties = { display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 };
const row: React.CSSProperties = { marginBottom: 14 };

function typeInfo(t: string) { return TYPES.find(x => x.value === t) ?? TYPES[0]; }

function DropZone({ onUploaded, currentUrl }: { onUploaded: (url: string) => void; currentUrl: string }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const doUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const token = useAuthStore.getState().token;
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.url) { onUploaded(data.url); setFileName(file.name); }
      else { showToast(data.error ?? "خطا در آپلود فایل", "error"); }
    } catch {
      showToast("آپلود فایل ناموفق بود", "error");
    } finally { setUploading(false); }
  }, [onUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  }, [doUpload]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${dragging ? "#d97706" : "rgba(139,92,246,0.4)"}`,
        borderRadius: 10, padding: "18px 14px", cursor: "pointer",
        background: dragging ? "rgba(168,85,247,0.08)" : "rgba(255,252,235,0.60)",
        textAlign: "center", transition: "all 0.2s",
      }}
    >
      <input ref={inputRef} type="file" style={{ display: "none" }} onChange={onPick} />
      {uploading ? (
        <div style={{ color: "#d97706", fontSize: 13 }}>در حال بارگذاری...</div>
      ) : fileName || currentUrl ? (
        <div style={{ color: "#34d399", fontSize: 13 }}>
          <Upload size={14} style={{ marginLeft: 6 }} />
          {fileName || "فایل بارگذاری شده"}
          <span style={{ color: "#b45309", fontSize: 11, marginRight: 8 }}>تغییر</span>
        </div>
      ) : (
        <div style={{ color: "#b45309", fontSize: 13 }}>
          <Upload size={16} style={{ marginBottom: 4 }} />
          <div>فایل را اینجا رها کنید یا کلیک کنید</div>
          <div style={{ fontSize: 11, marginTop: 4, color: "#b45309" }}>حداکثر ۲۰۰ مگابایت</div>
        </div>
      )}
    </div>
  );
}

function ContentModal({ editing, onClose, onSuccess }: { editing: Content | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    type: editing?.type ?? "animation",
    url: editing?.url ?? "",
    description: editing?.description ?? "",
    academicStage: "",
    grade: "",
    bookId: editing?.bookId ? String(editing.bookId) : "",
    lessonId: editing?.lessonId ? String(editing.lessonId) : "",
    orderIndex: String(editing?.orderIndex ?? 1),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });
  const { data: bookLessons = [] } = useQuery<any[]>({
    queryKey: ["lessons", form.bookId],
    queryFn: () => api.get(`/lessons?bookId=${form.bookId}`),
    enabled: !!form.bookId,
  });

  const selectedBook = books.find(b => String(b.id) === form.bookId);

  const uniqueStages = Array.from(new Set([...STAGES, ...books.map(b => b.academicStage).filter(Boolean)]));
  const gradesForStage = form.academicStage && STAGE_GRADES[form.academicStage]
    ? STAGE_GRADES[form.academicStage]
    : GRADES.map(g => g.value);
  const filteredBooks = books.filter(b =>
    (!form.academicStage || b.academicStage === form.academicStage) &&
    (!form.grade || b.gradeLevel === gradeLabel(form.grade))
  );

  function set(k: string, v: string) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "academicStage") { next.grade = ""; next.bookId = ""; next.lessonId = ""; }
      if (k === "grade") { next.bookId = ""; next.lessonId = ""; }
      if (k === "bookId") { next.lessonId = ""; }
      return next;
    });
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setLoading(true); setError("");
    try {
      const payload: any = {
        title: form.title,
        type: form.type,
        url: form.url || null,
        description: form.description || null,
        bookId: form.bookId ? parseInt(form.bookId) : null,
        lessonId: form.lessonId ? parseInt(form.lessonId) : null,
        orderIndex: parseInt(form.orderIndex) || 1,
      };
      if (editing) await api.put(`/content/${editing.id}`, payload);
      else await api.post("/content", payload);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "خطا");
    } finally { setLoading(false); }
  }

  const selStyle = { ...inp, appearance: "none" as const };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fffef5", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 20, padding: 28, width: "92%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#78350f", fontSize: 18, fontWeight: 700 }}>{editing ? "ویرایش محتوا" : "افزودن محتوا"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#b45309", cursor: "pointer" }}><X size={20} /></button>
        </div>

        {/* Title */}
        <div style={row}>
          <label style={lbl}>عنوان</label>
          <input value={form.title} onChange={e => set("title", e.target.value)} style={inp} placeholder="عنوان محتوا" />
        </div>

        {/* Type — 4 options as cards */}
        <div style={row}>
          <label style={lbl}>نوع</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {TYPES.map(t => {
              const Icon = t.icon;
              const active = form.type === t.value;
              return (
                <button key={t.value} onClick={() => set("type", t.value)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                  background: active ? `${t.color}22` : "rgba(255,252,235,0.90)",
                  border: `1px solid ${active ? t.color : "rgba(180,83,9,0.15)"}`,
                  borderRadius: 10, color: active ? t.color : "#b45309", cursor: "pointer",
                  fontFamily: "Vazirmatn, sans-serif", fontSize: 13, fontWeight: active ? 700 : 400,
                  transition: "all 0.15s",
                }}>
                  <Icon size={15} />{t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* URL */}
        <div style={row}>
          <label style={lbl}>آدرس (URL)</label>
          <input value={form.url} onChange={e => set("url", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} placeholder="https://..." />
        </div>

        {/* Upload dropzone */}
        <div style={row}>
          <label style={lbl}>بارگذاری فایل</label>
          <DropZone currentUrl={form.url} onUploaded={url => set("url", url)} />
        </div>

        {/* Assignment section */}
        <div style={{ borderTop: "1px solid rgba(139,92,246,0.2)", paddingTop: 14, marginBottom: 14 }}>
          <div style={{ color: "#d97706", fontSize: 12, fontWeight: 700, marginBottom: 12 }}>تخصیص محتوا</div>

          {/* مقطع */}
          <div style={row}>
            <label style={lbl}>مقطع تحصیلی</label>
            <select value={form.academicStage} onChange={e => set("academicStage", e.target.value)} style={selStyle}>
              <option value="">— انتخاب مقطع —</option>
              {uniqueStages.map(s => <option key={s} value={s!}>{s}</option>)}
            </select>
          </div>

          {/* پایه */}
          <div style={row}>
            <label style={lbl}>پایه تحصیلی</label>
            <select value={form.grade} onChange={e => set("grade", e.target.value)} style={selStyle}>
              <option value="">— انتخاب پایه —</option>
              {gradesForStage.map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}
            </select>
          </div>

          {/* کتاب */}
          <div style={row}>
            <label style={lbl}>کتاب درسی</label>
            <select value={form.bookId} onChange={e => set("bookId", e.target.value)} style={selStyle}>
              <option value="">— انتخاب کتاب —</option>
              {filteredBooks.map(b => <option key={b.id} value={String(b.id)}>{b.title}</option>)}
            </select>
          </div>

          {/* درس */}
          <div style={row}>
            <label style={lbl}>درس</label>
            <select value={form.lessonId} onChange={e => set("lessonId", e.target.value)} style={selStyle} disabled={!form.bookId}>
              <option value="">— انتخاب درس —</option>
              {bookLessons.map(l => <option key={l.id} value={String(l.id)}>{l.title}</option>)}
            </select>
          </div>

          {/* ترتیب نمایش */}
          <div style={row}>
            <label style={lbl}>ترتیب نمایش در درس</label>
            <select value={form.orderIndex} onChange={e => set("orderIndex", e.target.value)} style={selStyle} disabled={!form.lessonId}>
              <option value="">— انتخاب ترتیب —</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                <option key={n} value={String(n)}>#{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div style={row}>
          <label style={lbl}>توضیحات</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 10, textAlign: "center" }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={!form.title.trim() || loading} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? "در حال ذخیره..." : editing ? "بروزرسانی" : "ذخیره"}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 10, color: "#d97706", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminContent() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Content | null>(null);

  const { data: content = [] } = useQuery<Content[]>({ queryKey: ["content"], queryFn: () => api.get("/content") });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.delete(`/content/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["content"] }); showToast("محتوا حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });

  function openCreate() { setEditing(null); setShowModal(true); }
  function openEdit(c: Content) { setEditing(c); setShowModal(true); }
  function onSuccess() { qc.invalidateQueries({ queryKey: ["content"] }); showToast("محتوا با موفقیت ذخیره شد ✓"); }

  return (
    <div>
      <PageTopBar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#78350f", margin: 0 }}>محتوا</h1>
          <p style={{ color: "#b45309", fontSize: 14, marginTop: 4 }}>{content.length} محتوا</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> افزودن محتوا
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {content.map(c => {
          const ti = typeInfo(c.type);
          const Icon = ti.icon;
          return (
            <div key={c.id} style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ti.color}22`, border: `1px solid ${ti.color}44`, display: "flex", alignItems: "center", justifyContent: "center", color: ti.color }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#78350f", fontSize: 14 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: ti.color }}>{ti.label}</div>
                </div>
                {c.orderIndex > 0 && (
                  <div style={{ marginRight: "auto", fontSize: 11, color: "#b45309", background: "rgba(109,75,170,0.15)", borderRadius: 6, padding: "2px 7px" }}>#{c.orderIndex}</div>
                )}
              </div>
              {c.url && <div style={{ color: "#b45309", fontSize: 12, marginBottom: 8, direction: "ltr", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.url}</div>}
              {c.description && <div style={{ color: "#92400e", fontSize: 13, marginBottom: 10 }}>{c.description}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(c)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#d97706", cursor: "pointer", fontSize: 12, fontFamily: "Vazirmatn" }}><Edit2 size={12} /> ویرایش</button>
                <button onClick={() => { if (confirm("حذف شود؟")) deleteMut.mutate(c.id); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", cursor: "pointer", fontSize: 12, fontFamily: "Vazirmatn" }}><Trash2 size={12} /> حذف</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <ContentModal editing={editing} onClose={() => setShowModal(false)} onSuccess={onSuccess} />
      )}
    </div>
  );
}
