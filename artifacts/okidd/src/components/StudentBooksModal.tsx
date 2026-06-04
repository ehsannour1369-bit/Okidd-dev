import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, BookOpen, Plus, Trash2, BookMarked, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { showToast } from "../lib/toast";

interface Props {
  student: { id: number; name: string; gender?: string };
  schoolId: number;
  onClose: () => void;
}

export default function StudentBooksModal({ student, schoolId, onClose }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"assigned" | "add">("assigned");
  const [assigning, setAssigning] = useState<number | null>(null);

  // Direct assignments for this student
  const { data: directBooks = [], isLoading: loadingDirect } = useQuery<any[]>({
    queryKey: ["student-books", student.id, schoolId],
    queryFn: () => api.get(`/student-books?studentId=${student.id}&schoolId=${schoolId}`),
  });

  // Books from class enrollment
  const { data: classBooks = [] } = useQuery<any[]>({
    queryKey: ["enrolled-books", student.id],
    queryFn: () => api.get(`/users/${student.id}/enrolled-books`),
  });

  // School's purchased book licenses
  const { data: licenseSummary = [] } = useQuery<any[]>({
    queryKey: ["book-license-summary", schoolId],
    queryFn: () => api.get(`/book-license-summary?schoolId=${schoolId}`),
    enabled: tab === "add",
  });

  const directBookIds = new Set(directBooks.filter(b => b.isActive).map(b => b.bookId));
  const classBookIds = new Set(classBooks.map((b: any) => b.id));

  const removeMut = useMutation({
    mutationFn: (id: number) => api.delete(`/student-books/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-books", student.id] });
      qc.invalidateQueries({ queryKey: ["book-license-summary", schoolId] });
      showToast("کتاب حذف شد");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error"),
  });

  async function handleAssign(bookId: number) {
    setAssigning(bookId);
    try {
      await api.post("/student-books", { studentId: student.id, bookId, schoolId });
      qc.invalidateQueries({ queryKey: ["student-books", student.id] });
      qc.invalidateQueries({ queryKey: ["book-license-summary", schoolId] });
      showToast("کتاب با موفقیت تخصیص داده شد ✓");
    } catch (e: any) {
      showToast(e?.message ?? "خطا در تخصیص", "error");
    }
    setAssigning(null);
  }

  const accent = student.gender === "female" ? "#ec4899" : "#7c3aed";
  const light = student.gender === "female" ? "rgba(236,72,153,0.1)" : "rgba(124,58,237,0.1)";
  const border = student.gender === "female" ? "rgba(236,72,153,0.3)" : "rgba(124,58,237,0.3)";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#f5f3ff", border: `1px solid ${border}`, borderRadius: 22, padding: "24px 24px 28px", width: "90%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", direction: "rtl", fontFamily: "Vazirmatn, sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 17, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={18} color={accent} /> کتاب‌های {student.name}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "rgba(255,255,255,0.7)", borderRadius: 12, padding: 4 }}>
          {([["assigned", "کتاب‌های اختصاص‌یافته"], ["add", "افزودن کتاب"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", fontSize: 13, fontWeight: tab === key ? 700 : 500, background: tab === key ? `linear-gradient(135deg,${accent},${accent}cc)` : "transparent", color: tab === key ? "white" : "#6b7280", boxShadow: tab === key ? `0 2px 10px ${accent}40` : "none", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: ASSIGNED ── */}
        {tab === "assigned" && (
          <div>
            {/* Class-based books (read-only) */}
            {classBooks.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                  <BookMarked size={11} /> از طریق کلاس (خودکار)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {classBooks.map((b: any) => (
                    <div key={b.id} style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.22)", borderRadius: 11, padding: "10px 13px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={14} color="#059669" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#064e3b" }}>{b.title}</div>
                        {b.gradeLevel && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>پایه {b.gradeLevel}</div>}
                      </div>
                      <CheckCircle2 size={15} color="#059669" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct assignments */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <BookOpen size={11} /> تخصیص مستقیم
            </div>
            {loadingDirect && <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 13 }}>در حال بارگذاری...</div>}
            {!loadingDirect && directBooks.filter(b => b.isActive).length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 16px", background: "rgba(255,255,255,0.6)", borderRadius: 12, border: "1px dashed rgba(0,0,0,0.1)" }}>
                <BookOpen size={28} color="#d1d5db" style={{ marginBottom: 8 }} />
                <div style={{ color: "#9ca3af", fontSize: 13 }}>هیچ کتابی به‌صورت مستقیم تخصیص داده نشده</div>
                <button onClick={() => setTab("add")} style={{ marginTop: 10, padding: "7px 16px", background: light, border: `1px solid ${border}`, borderRadius: 9, color: accent, fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  + افزودن کتاب
                </button>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {directBooks.filter(b => b.isActive).map((b: any) => (
                <div key={b.id} style={{ background: "rgba(255,255,255,0.85)", border: `1px solid ${border}`, borderRadius: 12, padding: "11px 13px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <BookOpen size={15} color={accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e1b4b" }}>{b.book?.title ?? `کتاب #${b.bookId}`}</div>
                    {b.book?.gradeLevel && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>پایه {b.book.gradeLevel}</div>}
                  </div>
                  <button
                    onClick={() => removeMut.mutate(b.id)}
                    disabled={removeMut.isPending}
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "Vazirmatn" }}
                  >
                    <Trash2 size={12} /> حذف
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: ADD ── */}
        {tab === "add" && (
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "8px 12px" }}>
              فقط کتاب‌هایی نمایش داده می‌شوند که مدرسه لایسنس آن‌ها را خریداری کرده است.
            </div>

            {licenseSummary.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 16px", color: "#9ca3af", fontSize: 13 }}>
                <AlertCircle size={28} color="#d1d5db" style={{ marginBottom: 8 }} />
                <div>مدرسه هیچ لایسنس کتابی خریداری نکرده است</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {licenseSummary.map((item: any) => {
                const alreadyDirect = directBookIds.has(item.bookId);
                const alreadyClass = classBookIds.has(item.bookId);
                const noLicense = item.remaining <= 0 && !alreadyDirect && !alreadyClass;
                const isAssigning = assigning === item.bookId;

                return (
                  <div key={item.bookId} style={{ background: noLicense ? "rgba(249,250,251,0.7)" : "rgba(255,255,255,0.85)", border: `1px solid ${noLicense ? "rgba(0,0,0,0.08)" : border}`, borderRadius: 12, padding: "12px 13px", display: "flex", alignItems: "center", gap: 10, opacity: noLicense ? 0.6 : 1 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: noLicense ? "rgba(0,0,0,0.05)" : light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <BookOpen size={16} color={noLicense ? "#9ca3af" : accent} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e1b4b" }}>{item.bookTitle}</div>
                      <div style={{ fontSize: 11, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ color: "#6b7280" }}>خریداری: <b>{item.purchased}</b></span>
                        <span style={{ color: "#6b7280" }}>استفاده‌شده: <b>{item.used}</b></span>
                        <span style={{ color: item.remaining > 0 ? "#059669" : "#ef4444", fontWeight: 700 }}>باقی‌مانده: {item.remaining}</span>
                      </div>
                    </div>
                    {alreadyDirect ? (
                      <span style={{ fontSize: 11, background: "rgba(16,185,129,0.12)", color: "#065f46", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "3px 9px", fontWeight: 700, whiteSpace: "nowrap" }}>✓ تخصیص شده</span>
                    ) : alreadyClass ? (
                      <span style={{ fontSize: 11, background: "rgba(99,102,241,0.1)", color: "#3730a3", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, padding: "3px 9px", fontWeight: 700, whiteSpace: "nowrap" }}>از کلاس</span>
                    ) : (
                      <button
                        onClick={() => handleAssign(item.bookId)}
                        disabled={noLicense || isAssigning}
                        style={{ background: noLicense ? "rgba(0,0,0,0.05)" : `linear-gradient(135deg,${accent},${accent}cc)`, border: "none", borderRadius: 9, padding: "7px 13px", cursor: noLicense ? "not-allowed" : "pointer", color: noLicense ? "#9ca3af" : "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", boxShadow: noLicense ? "none" : `0 2px 8px ${accent}35` }}
                      >
                        {isAssigning ? <div style={{ width: 12, height: 12, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "sbSpin 0.6s linear infinite" }} /> : <Plus size={12} />}
                        {noLicense ? "ظرفیت پر" : "تخصیص"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes sbSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
