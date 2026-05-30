import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Plus, Edit2, Trash2, Link as LinkIcon, FileText, Video } from "lucide-react";

interface Content { id: number; title: string; type: string; url?: string; description?: string; lessonId?: number; classId?: number; }

const inputStyle = { width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

const typeIcon = (t: string) => t === "video" ? <Video size={16} /> : t === "document" ? <FileText size={16} /> : <LinkIcon size={16} />;
const typeColor = (t: string) => t === "video" ? "#f87171" : t === "document" ? "#60a5fa" : "#a855f7";

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1a1238", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#f8f5ff", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminContent() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Content | null>(null);
  const [form, setForm] = useState({ title: "", type: "link", url: "", description: "" });

  const { data: content = [] } = useQuery<Content[]>({ queryKey: ["content"], queryFn: () => api.get("/content") });
  const createMut = useMutation({ mutationFn: (d: any) => api.post("/content", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["content"] }); setShowModal(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, d }: any) => api.put(`/content/${id}`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["content"] }); setShowModal(false); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.delete(`/content/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["content"] }) });

  function openCreate() { setEditing(null); setForm({ title: "", type: "link", url: "", description: "" }); setShowModal(true); }
  function openEdit(c: Content) { setEditing(c); setForm({ title: c.title, type: c.type, url: c.url ?? "", description: c.description ?? "" }); setShowModal(true); }
  function handleSave() { editing ? updateMut.mutate({ id: editing.id, d: form }) : createMut.mutate(form); }

  const TYPE_LABELS: Record<string, string> = { link: "لینک", video: "ویدیو", document: "سند", game: "بازی" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>محتوا</h1>
          <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>{content.length} محتوا</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> افزودن محتوا
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {content.map(c => (
          <div key={c.id} style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${typeColor(c.type)}22`, border: `1px solid ${typeColor(c.type)}44`, display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(c.type) }}>{typeIcon(c.type)}</div>
              <div>
                <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 14 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: typeColor(c.type) }}>{TYPE_LABELS[c.type] ?? c.type}</div>
              </div>
            </div>
            {c.url && <div style={{ color: "#8b5cf6", fontSize: 12, marginBottom: 10, direction: "ltr", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.url}</div>}
            {c.description && <div style={{ color: "#c4b5fd", fontSize: 13, marginBottom: 12 }}>{c.description}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openEdit(c)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#a855f7", cursor: "pointer", fontSize: 12, fontFamily: "Vazirmatn" }}><Edit2 size={12} /> ویرایش</button>
              <button onClick={() => { if (confirm("حذف شود؟")) deleteMut.mutate(c.id); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", cursor: "pointer", fontSize: 12, fontFamily: "Vazirmatn" }}><Trash2 size={12} /> حذف</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <Modal title={editing ? "ویرایش محتوا" : "افزودن محتوا"} onClose={() => setShowModal(false)}>
          <div style={{ marginBottom: 14 }}><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>عنوان</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} /></div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>نوع</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>آدرس (URL)</label><input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} placeholder="https://..." /></div>
          <div style={{ marginBottom: 14 }}><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>توضیحات</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={handleSave} disabled={!form.title} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>{editing ? "بروزرسانی" : "ذخیره"}</button>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
