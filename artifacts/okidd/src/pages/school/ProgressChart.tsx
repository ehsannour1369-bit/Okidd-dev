import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState } from "react";
import { BookOpen, Calendar, Check } from "lucide-react";

function toShamsi(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("fa-IR", {
      year: "numeric", month: "2-digit", day: "2-digit",
    }).replace(/\//g, "/");
  } catch { return iso; }
}

function LessonDateRow({
  lessonIndex, classId, bookId, existing,
}: {
  lessonIndex: number; classId: number; bookId: number; existing?: { id: number; teachDate: string };
}) {
  const qc = useQueryClient();
  const [value, setValue] = useState(existing?.teachDate ?? "");
  const [saved, setSaved] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post("/progress-chart/upsert", { classId, bookId, lessonId: lessonIndex, teachDate: value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress-chart", classId, bookId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    if (!value.trim()) return;
    mutate();
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px",
      background: existing?.teachDate ? "rgba(34,197,94,0.06)" : "rgba(245,243,255,0.65)",
      borderRadius: 10,
      border: `1px solid ${existing?.teachDate ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.12)"}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: existing?.teachDate ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.15)",
        border: `1px solid ${existing?.teachDate ? "rgba(34,197,94,0.4)" : "rgba(99,102,241,0.30)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: existing?.teachDate ? "#15803d" : "#a855f7",
        fontSize: 12, fontWeight: 700,
      }}>{lessonIndex}</div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ color: "#3730a3", fontSize: 13, minWidth: 50 }}>جلسه {lessonIndex.toLocaleString("fa-IR")}</span>
        {existing?.teachDate && (
          <span style={{
            fontSize: 12, color: "#15803d", background: "rgba(34,197,94,0.12)",
            padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(34,197,94,0.25)",
          }}>
            {existing.teachDate}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Calendar size={14} style={{ position: "absolute", right: 9, color: "#4f46e5", pointerEvents: "none" }} />
          <input
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setSaved(false); }}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder="۱۴۰۴/۰۱/۰۱"
            maxLength={10}
            style={{
              paddingRight: 30, paddingLeft: 10, paddingTop: 6, paddingBottom: 6,
              borderRadius: 8, border: "1px solid rgba(139,92,246,0.3)",
              background: "rgba(245,243,255,0.85)", color: "#1e1b4b",
              fontFamily: "Vazirmatn, sans-serif", fontSize: 13,
              width: 120, outline: "none",
              direction: "ltr",
            }}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isPending || !value.trim()}
          style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            fontFamily: "Vazirmatn, sans-serif", fontSize: 12, fontWeight: 700,
            background: saved ? "rgba(34,197,94,0.3)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: saved ? "#15803d" : "#fff",
            opacity: isPending || !value.trim() ? 0.6 : 1,
            transition: "all 0.2s",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          {saved ? <><Check size={12} />ذخیره شد</> : isPending ? "..." : "ذخیره"}
        </button>
      </div>
    </div>
  );
}

export default function SchoolProgressChart() {
  const { user } = useAuthStore();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["school-classes", user?.schoolId],
    queryFn: () => api.get(`/school-classes?schoolId=${user?.schoolId ?? 0}`),
    enabled: !!user?.schoolId,
  });

  const { data: books = [] } = useQuery<any[]>({
    queryKey: ["class-books", selectedClassId],
    queryFn: () => api.get(`/classes/${selectedClassId}/books`),
    enabled: !!selectedClassId,
  });

  const { data: chartData = [] } = useQuery<any[]>({
    queryKey: ["progress-chart", selectedClassId, selectedBookId],
    queryFn: () => api.get(`/progress-chart?classId=${selectedClassId}&bookId=${selectedBookId}`),
    enabled: !!selectedClassId && !!selectedBookId,
  });

  const selectedBook = books.find((b: any) => b.id === selectedBookId);
  const lessonCount = selectedBook?.lessonCount ?? 0;

  const dateMap: Record<number, { id: number; teachDate: string }> = {};
  for (const row of chartData) {
    dateMap[row.lessonId] = { id: row.id, teachDate: row.teachDate };
  }

  const setCount = Object.keys(dateMap).length;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>پراگرس چارت مدرسه</h1>
        <p style={{ color: "#4f46e5", fontSize: 14, marginTop: 4 }}>
          تعیین تاریخ جلسات به تفکیک کلاس و کتاب
        </p>
      </div>

      {/* Class & Book selector */}
      <div style={{
        background: "rgba(255,255,255,0.97)", borderRadius: 16,
        border: "1px solid rgba(139,92,246,0.2)", padding: 20, marginBottom: 24,
        display: "flex", gap: 20, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", color: "#3730a3", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
            انتخاب کلاس
          </label>
          <select
            value={selectedClassId ?? ""}
            onChange={e => { setSelectedClassId(e.target.value ? parseInt(e.target.value) : null); setSelectedBookId(null); }}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.3)",
              color: "#1e1b4b", fontFamily: "Vazirmatn, sans-serif", fontSize: 14,
              outline: "none", cursor: "pointer",
            }}
          >
            <option value="">— انتخاب کنید —</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", color: "#3730a3", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
            انتخاب کتاب
          </label>
          <select
            value={selectedBookId ?? ""}
            onChange={e => setSelectedBookId(e.target.value ? parseInt(e.target.value) : null)}
            disabled={!selectedClassId || books.length === 0}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.3)",
              color: selectedClassId ? "#1e1b4b" : "#6b7280",
              fontFamily: "Vazirmatn, sans-serif", fontSize: 14,
              outline: "none", cursor: selectedClassId ? "pointer" : "default",
              opacity: selectedClassId ? 1 : 0.5,
            }}
          >
            <option value="">— انتخاب کنید —</option>
            {books.map((b: any) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lessons grid */}
      {selectedClassId && selectedBookId && (
        <div>
          {selectedBook && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 16, flexWrap: "wrap", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#3730a3" }}>
                <BookOpen size={16} style={{ color: "#a855f7" }} />
                <span style={{ fontWeight: 600 }}>{selectedBook.title}</span>
                <span style={{ fontSize: 13, color: "#4f46e5" }}>— {lessonCount} جلسه</span>
              </div>
              <div style={{
                fontSize: 12, color: "#15803d",
                background: "rgba(34,197,94,0.12)", padding: "4px 12px",
                borderRadius: 999, border: "1px solid rgba(34,197,94,0.25)",
              }}>
                {setCount.toLocaleString("fa-IR")} از {lessonCount.toLocaleString("fa-IR")} تاریخ ثبت شده
              </div>
            </div>
          )}

          <div style={{
            background: "rgba(255,255,255,0.97)", borderRadius: 16,
            border: "1px solid rgba(139,92,246,0.2)", overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px",
              background: "rgba(245,243,255,0.90)",
              borderBottom: "1px solid rgba(139,92,246,0.15)",
              display: "flex", gap: 16, alignItems: "center",
            }}>
              <span style={{ color: "#4f46e5", fontSize: 12, fontWeight: 600 }}>جلسه</span>
              <span style={{ color: "#4f46e5", fontSize: 12, fontWeight: 600, flex: 1 }}>تاریخ فعلی</span>
              <span style={{ color: "#4f46e5", fontSize: 12, fontWeight: 600 }}>تاریخ جدید (شمسی)</span>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: lessonCount }, (_, i) => i + 1).map(idx => (
                <LessonDateRow
                  key={idx}
                  lessonIndex={idx}
                  classId={selectedClassId}
                  bookId={selectedBookId}
                  existing={dateMap[idx]}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {!selectedClassId && (
        <div style={{
          textAlign: "center", padding: 60,
          background: "rgba(18,14,42,0.5)", borderRadius: 16,
          border: "1px solid rgba(139,92,246,0.15)",
          color: "#4f46e5", fontSize: 14,
        }}>
          برای شروع یک کلاس انتخاب کنید
        </div>
      )}
    </div>
  );
}
